import uuid
from typing import Annotated
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.order import (
    CartItemAddRequest,
    CartItemUpdateRequest,
    CartResponse,
)
from app.services.cart_service import CartService

router = APIRouter(prefix="/cart", tags=["Shopping Cart"])


@router.get(
    "",
    response_model=CartResponse,
    summary="Lấy chi tiết giỏ hàng hiện tại",
)
async def get_cart(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CartResponse:
    """Truy xuất các sản phẩm trong giỏ hàng kèm tồn kho và tính tổng tiền."""
    return await CartService.get_cart(db, current_user.id)


@router.post(
    "/items",
    response_model=CartResponse,
    status_code=status.HTTP_200_OK,
    summary="Thêm sách vào giỏ hàng",
)
async def add_to_cart(
    req: CartItemAddRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CartResponse:
    """Thêm một ấn phẩm sách (Sách in hoặc E-book) vào giỏ hàng."""
    return await CartService.add_item(db, current_user.id, req)


@router.put(
    "/items/{item_id}",
    response_model=CartResponse,
    summary="Cập nhật số lượng sản phẩm trong giỏ",
)
async def update_cart_item(
    item_id: uuid.UUID,
    req: CartItemUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CartResponse:
    return await CartService.update_item(db, current_user.id, item_id, req)


@router.delete(
    "/items/{item_id}",
    response_model=CartResponse,
    summary="Xóa sản phẩm khỏi giỏ hàng",
)
async def remove_cart_item(
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CartResponse:
    return await CartService.remove_item(db, current_user.id, item_id)


@router.delete(
    "/clear",
    response_model=CartResponse,
    summary="Dọn sạch giỏ hàng",
)
async def clear_cart(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> CartResponse:
    return await CartService.clear_cart(db, current_user.id)
