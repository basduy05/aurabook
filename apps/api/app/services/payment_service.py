from datetime import datetime, timedelta, timezone
from decimal import Decimal
import hashlib
import hmac
import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.catalog import Book
from app.models.ebook import EbookAccess
from app.models.order import (
    CartItem,
    Order,
    OrderItem,
    OrderStatus,
    Payment,
    PaymentProvider,
    PaymentStatus,
    Voucher,
)
from app.models.user import User
from app.schemas.order import (
    CheckoutResponse,
    OrderCreateRequest,
    OrderItemResponse,
    OrderResponse,
    WebhookIPNRequest,
)


def generate_hmac_signature(data: str, secret: str) -> str:
    """Generate SHA256 HMAC signature for payment tampering prevention."""
    return hmac.new(secret.encode("utf-8"), data.encode("utf-8"), hashlib.sha256).hexdigest()


class PaymentService:
    """Core payment processing and order management service implementing UC04."""

    @staticmethod
    async def checkout(
        db: AsyncSession, user: User, req: OrderCreateRequest
    ) -> CheckoutResponse:
        """Create order with pessimistic inventory hold and generate sandbox checkout URL."""
        # 1. Fetch user's cart items
        stmt = (
            select(CartItem)
            .options(selectinload(CartItem.book))
            .where(CartItem.user_id == user.id)
        )
        res = await db.execute(stmt)
        cart_items = res.scalars().all()

        if not cart_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Giỏ hàng của bạn đang trống. Vui lòng chọn sách trước khi thanh toán.",
            )

        # 2. Extract physical books for pessimistic locking
        physical_items = [ci for ci in cart_items if ci.format == "PHYSICAL"]
        physical_book_ids = list({ci.book_id for ci in physical_items})

        # Apply SELECT ... FOR UPDATE to lock rows
        if physical_book_ids:
            lock_stmt = (
                select(Book)
                .where(Book.id.in_(physical_book_ids))
                .with_for_update()
            )
            lock_res = await db.execute(lock_stmt)
            locked_books = {b.id: b for b in lock_res.scalars().all()}

            # Validate and hold available stock
            for ci in physical_items:
                book = locked_books.get(ci.book_id)
                if not book or not book.is_available:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Sách '{ci.book.title}' hiện không khả dụng.",
                    )
                if book.available_stock < ci.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Sách '{book.title}' không đủ tồn kho (chỉ còn {book.available_stock} cuốn khả dụng).",
                    )
                # Hold inventory for 15 minutes
                book.held_quantity += ci.quantity

        # 3. Calculate financial totals
        subtotal_amount = Decimal("0.00")
        for ci in cart_items:
            subtotal_amount += ci.book.sale_price * ci.quantity

        # Voucher calculation
        discount_amount = Decimal("0.00")
        applied_voucher_code: Optional[str] = None
        if req.voucher_code:
            v_code = req.voucher_code.strip().upper()
            v_stmt = select(Voucher).where(Voucher.code == v_code)
            v_res = await db.execute(v_stmt)
            voucher = v_res.scalar_one_or_none()
            if voucher and voucher.is_valid(subtotal_amount):
                applied_voucher_code = voucher.code
                if voucher.discount_percent:
                    discount_amount = (subtotal_amount * voucher.discount_percent) / Decimal("100")
                    if voucher.max_discount and discount_amount > voucher.max_discount:
                        discount_amount = voucher.max_discount
                elif voucher.discount_amount:
                    discount_amount = voucher.discount_amount
                voucher.used_count += 1

        final_amount = max(Decimal("0.00"), subtotal_amount - discount_amount)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        # 4. Generate unique order code
        timestamp_prefix = datetime.now(timezone.utc).strftime("%y%m%d%H%M%S")
        order_code = f"AB{timestamp_prefix}{uuid.uuid4().hex[:4].upper()}"

        order = Order(
            order_code=order_code,
            user_id=user.id,
            status=OrderStatus.PENDING,
            payment_status=PaymentStatus.UNPAID,
            subtotal_amount=subtotal_amount,
            discount_amount=discount_amount,
            shipping_fee=Decimal("0.00"),
            final_amount=final_amount,
            voucher_code=applied_voucher_code,
            shipping_address=req.shipping_address,
            expires_at=expires_at,
        )
        db.add(order)
        await db.flush()

        # Add order items
        for ci in cart_items:
            oi = OrderItem(
                order_id=order.id,
                book_id=ci.book_id,
                format=ci.format,
                unit_price=ci.book.sale_price,
                quantity=ci.quantity,
                subtotal=ci.book.sale_price * ci.quantity,
            )
            db.add(oi)

        # 5. Clear user cart
        for ci in cart_items:
            await db.delete(ci)

        # 6. Generate Sandbox checkout URL with cryptographic signature
        sig_data = f"{order.order_code}|{order.final_amount}"
        signature = generate_hmac_signature(sig_data, settings.JWT_SECRET)
        payment_url = f"{settings.API_V1_PREFIX}/payments/sandbox-simulator?order_code={order.order_code}&amount={order.final_amount}&sig={signature}"

        payment = Payment(
            order_id=order.id,
            provider=PaymentProvider.SANDBOX_GATEWAY,
            amount=final_amount,
            status="PENDING",
            payment_url=payment_url,
            signature=signature,
        )
        db.add(payment)

        # Commit transaction: Order created, stock held, cart cleared
        await db.commit()

        return CheckoutResponse(
            order_id=order.id,
            order_code=order.order_code,
            final_amount=order.final_amount,
            expires_at=order.expires_at,
            payment_url=payment_url,
        )

    @staticmethod
    async def process_webhook(db: AsyncSession, req: WebhookIPNRequest) -> dict:
        """Handle IPN Webhook from payment gateway with HMAC verification and E-book grant."""
        # 1. Verify HMAC-SHA256 signature
        expected_data = f"{req.order_code}|{req.amount}|{req.status}"
        expected_sig = generate_hmac_signature(expected_data, settings.JWT_SECRET)
        if not hmac.compare_digest(req.signature, expected_sig):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chữ ký Webhook không hợp lệ. Giao dịch bị từ chối.",
            )

        # 2. Fetch order and locked items
        stmt = (
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.book),
                selectinload(Order.payments),
            )
            .where(Order.order_code == req.order_code)
        )
        res = await db.execute(stmt)
        order = res.scalar_one_or_none()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy đơn hàng {req.order_code}",
            )

        # Idempotency check: Already paid
        if order.payment_status == PaymentStatus.PAID:
            return {"status": "ALREADY_PROCESSED", "order_code": order.order_code}

        # 3. Handle Payment SUCCESS
        if req.status == "SUCCESS":
            order.status = OrderStatus.PAID
            order.payment_status = PaymentStatus.PAID

            # Update payment record
            for p in order.payments:
                p.status = "SUCCESS"
                p.transaction_code = req.transaction_code
                p.ipn_data = req.model_dump(mode="json")

            # Finalize stock: deduct held_quantity and stock_quantity permanently
            for item in order.items:
                book = item.book
                if item.format == "PHYSICAL":
                    book.held_quantity = max(0, book.held_quantity - item.quantity)
                    book.stock_quantity = max(0, book.stock_quantity - item.quantity)

                # Grant E-book reading access if order contains digital book
                elif item.format == "EBOOK":
                    # Check if access already granted
                    chk_stmt = select(EbookAccess).where(
                        (EbookAccess.user_id == order.user_id) & (EbookAccess.book_id == item.book_id)
                    )
                    chk_res = await db.execute(chk_stmt)
                    if not chk_res.scalar_one_or_none():
                        access = EbookAccess(
                            user_id=order.user_id,
                            book_id=item.book_id,
                            order_id=order.id,
                            is_active=True,
                        )
                        db.add(access)

            await db.commit()
            return {"status": "SUCCESS", "order_code": order.order_code, "payment_status": "PAID"}

        # 4. Handle Payment FAILED / CANCELLED
        else:
            order.status = OrderStatus.CANCELLED
            order.payment_status = PaymentStatus.FAILED

            # Release held stock
            for item in order.items:
                if item.format == "PHYSICAL":
                    item.book.held_quantity = max(0, item.book.held_quantity - item.quantity)

            await db.commit()
            return {"status": "FAILED", "order_code": order.order_code, "payment_status": "FAILED"}

    @staticmethod
    async def sweep_expired_orders(db: AsyncSession) -> int:
        """Scan and cancel all expired PENDING orders, releasing held inventory."""
        now = datetime.now(timezone.utc)
        stmt = (
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.book))
            .where((Order.status == OrderStatus.PENDING) & (Order.expires_at < now))
        )
        res = await db.execute(stmt)
        expired_orders = res.scalars().all()

        count = 0
        for order in expired_orders:
            order.status = OrderStatus.CANCELLED
            for item in order.items:
                if item.format == "PHYSICAL":
                    item.book.held_quantity = max(0, item.book.held_quantity - item.quantity)
            count += 1

        if count > 0:
            await db.commit()
        return count
