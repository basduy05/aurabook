import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import (
    CheckoutResponse,
    OrderCreateRequest,
    OrderItemResponse,
    OrderResponse,
)
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/orders", tags=["Orders & Checkout (UC04)"])


@router.post(
    "/checkout",
    response_model=CheckoutResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo đơn hàng từ giỏ hàng & Lấy link Checkout Sandbox (UC04)",
)
async def checkout(
    req: OrderCreateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CheckoutResponse:
    """
    Thực hiện:
    1. Khóa bi quan `SELECT FOR UPDATE` tạm giữ kho sách in 15 phút.
    2. Áp dụng mã giảm giá voucher (nếu có).
    3. Tạo bản ghi đơn hàng PENDING và sinh link Sandbox Simulator.
    """
    return await PaymentService.checkout(db, current_user, req)


@router.get(
    "",
    response_model=list[OrderResponse],
    summary="Lịch sử đơn hàng của người dùng",
)
async def get_my_orders(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[OrderResponse]:
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.book))
        .where(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
    )
    res = await db.execute(stmt)
    orders = res.scalars().all()

    results = []
    for o in orders:
        items_res = [
            OrderItemResponse(
                id=item.id,
                book_id=item.book_id,
                book_title=item.book.title if item.book else "Sách",
                format=item.format,
                unit_price=item.unit_price,
                quantity=item.quantity,
                subtotal=item.subtotal,
            )
            for item in o.items
        ]
        results.append(
            OrderResponse(
                id=o.id,
                order_code=o.order_code,
                status=o.status,
                payment_status=o.payment_status,
                subtotal_amount=o.subtotal_amount,
                discount_amount=o.discount_amount,
                shipping_fee=o.shipping_fee,
                final_amount=o.final_amount,
                voucher_code=o.voucher_code,
                shipping_address=o.shipping_address,
                expires_at=o.expires_at,
                created_at=o.created_at,
                items=items_res,
            )
        )
    return results


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Chi tiết đơn hàng",
)
async def get_order_detail(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> OrderResponse:
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.book))
        .where((Order.id == order_id) & (Order.user_id == current_user.id))
    )
    res = await db.execute(stmt)
    order = res.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy đơn hàng.",
        )

    items_res = [
        OrderItemResponse(
            id=item.id,
            book_id=item.book_id,
            book_title=item.book.title if item.book else "Sách",
            format=item.format,
            unit_price=item.unit_price,
            quantity=item.quantity,
            subtotal=item.subtotal,
        )
        for item in order.items
    ]

    return OrderResponse(
        id=order.id,
        order_code=order.order_code,
        status=order.status,
        payment_status=order.payment_status,
        subtotal_amount=order.subtotal_amount,
        discount_amount=order.discount_amount,
        shipping_fee=order.shipping_fee,
        final_amount=order.final_amount,
        voucher_code=order.voucher_code,
        shipping_address=order.shipping_address,
        expires_at=order.expires_at,
        created_at=order.created_at,
        items=items_res,
    )
