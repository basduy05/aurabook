from decimal import Decimal
import uuid
from typing import List
from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.catalog import Book, BookFormat
from app.models.order import CartItem
from app.schemas.order import (
    CartItemAddRequest,
    CartItemResponse,
    CartItemUpdateRequest,
    CartResponse,
)


class CartService:
    """Service managing customer shopping cart."""

    @staticmethod
    async def get_cart(db: AsyncSession, user_id: uuid.UUID) -> CartResponse:
        """Fetch all cart items for the given user with live book pricing and stock."""
        stmt = (
            select(CartItem)
            .options(selectinload(CartItem.book))
            .where(CartItem.user_id == user_id)
            .order_by(CartItem.created_at.desc())
        )
        res = await db.execute(stmt)
        items = res.scalars().all()

        cart_items_res: List[CartItemResponse] = []
        total_amount = Decimal("0.00")
        total_items = 0

        for item in items:
            book = item.book
            subtotal = book.sale_price * item.quantity
            total_amount += subtotal
            total_items += item.quantity

            cart_items_res.append(
                CartItemResponse(
                    id=item.id,
                    book_id=book.id,
                    title=book.title,
                    author=book.author,
                    cover_url=book.cover_url,
                    format=item.format,
                    unit_price=book.sale_price,
                    quantity=item.quantity,
                    subtotal=subtotal,
                    available_stock=book.available_stock,
                )
            )

        return CartResponse(
            items=cart_items_res,
            total_amount=total_amount,
            total_items=total_items,
        )

    @staticmethod
    async def add_item(
        db: AsyncSession, user_id: uuid.UUID, req: CartItemAddRequest
    ) -> CartResponse:
        """Add a book to the user's cart or increment its quantity."""
        # 1. Fetch book
        stmt = select(Book).where((Book.id == req.book_id) & (Book.is_available.is_(True)))
        res = await db.execute(stmt)
        book = res.scalar_one_or_none()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sách không tồn tại hoặc đã ngừng kinh doanh.",
            )

        # 2. Check format compatibility
        req_fmt = req.format.upper()
        if req_fmt not in ["PHYSICAL", "EBOOK"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Định dạng sách không hợp lệ. Chọn 'PHYSICAL' hoặc 'EBOOK'.",
            )
        if book.format != BookFormat.BOTH and book.format.value != req_fmt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Sách này chỉ phát hành định dạng {book.format.value}, không hỗ trợ {req_fmt}.",
            )

        # 3. Find existing cart item
        cart_stmt = select(CartItem).where(
            (CartItem.user_id == user_id)
            & (CartItem.book_id == req.book_id)
            & (CartItem.format == req_fmt)
        )
        cart_res = await db.execute(cart_stmt)
        cart_item = cart_res.scalar_one_or_none()

        new_quantity = req.quantity
        if cart_item:
            new_quantity += cart_item.quantity

        # Check physical stock
        if req_fmt == "PHYSICAL" and new_quantity > book.available_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Số lượng yêu cầu ({new_quantity}) vượt quá tồn kho khả dụng ({book.available_stock}).",
            )

        if cart_item:
            cart_item.quantity = new_quantity
        else:
            cart_item = CartItem(
                user_id=user_id,
                book_id=req.book_id,
                format=req_fmt,
                quantity=req.quantity,
            )
            db.add(cart_item)

        await db.commit()
        return await CartService.get_cart(db, user_id)

    @staticmethod
    async def update_item(
        db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID, req: CartItemUpdateRequest
    ) -> CartResponse:
        """Update the quantity of an item in the cart."""
        stmt = (
            select(CartItem)
            .options(selectinload(CartItem.book))
            .where((CartItem.id == item_id) & (CartItem.user_id == user_id))
        )
        res = await db.execute(stmt)
        item = res.scalar_one_or_none()
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mục giỏ hàng không tồn tại.",
            )

        if item.format == "PHYSICAL" and req.quantity > item.book.available_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tồn kho khả dụng chỉ còn {item.book.available_stock} cuốn.",
            )

        item.quantity = req.quantity
        await db.commit()
        return await CartService.get_cart(db, user_id)

    @staticmethod
    async def remove_item(
        db: AsyncSession, user_id: uuid.UUID, item_id: uuid.UUID
    ) -> CartResponse:
        """Remove a specific item from cart."""
        stmt = delete(CartItem).where((CartItem.id == item_id) & (CartItem.user_id == user_id))
        await db.execute(stmt)
        await db.commit()
        return await CartService.get_cart(db, user_id)

    @staticmethod
    async def clear_cart(db: AsyncSession, user_id: uuid.UUID) -> CartResponse:
        """Remove all items from user cart."""
        stmt = delete(CartItem).where(CartItem.user_id == user_id)
        await db.execute(stmt)
        await db.commit()
        return await CartService.get_cart(db, user_id)
