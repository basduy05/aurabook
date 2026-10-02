import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.models.order import OrderStatus, PaymentStatus


# --- Cart Schemas ---
class CartItemAddRequest(BaseModel):
    book_id: uuid.UUID
    format: str = Field(
        default="PHYSICAL", description="Định dạng: PHYSICAL hoặc EBOOK"
    )
    quantity: int = Field(default=1, ge=1, le=100, description="Số lượng sách cần mua")


class CartItemUpdateRequest(BaseModel):
    quantity: int = Field(..., ge=1, le=100, description="Số lượng sách mới")


class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    book_id: uuid.UUID
    title: str
    author: str
    cover_url: str | None = None
    format: str
    unit_price: Decimal
    quantity: int
    subtotal: Decimal
    available_stock: int


class CartResponse(BaseModel):
    items: list[CartItemResponse]
    total_amount: Decimal
    total_items: int


# --- Order Schemas ---
class OrderCreateRequest(BaseModel):
    shipping_address: dict[str, Any] | None = Field(
        None,
        description="Địa chỉ nhận hàng đối với sách in (Họ tên, SĐT, Địa chỉ)",
    )
    voucher_code: str | None = Field(None, description="Mã khuyến mãi giảm giá")


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    book_id: uuid.UUID
    book_title: str | None = None
    format: str
    unit_price: Decimal
    quantity: int
    subtotal: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_code: str
    status: OrderStatus
    payment_status: PaymentStatus
    subtotal_amount: Decimal
    discount_amount: Decimal
    shipping_fee: Decimal
    final_amount: Decimal
    voucher_code: str | None = None
    shipping_address: dict[str, Any] | None = None
    expires_at: datetime
    created_at: datetime
    items: list[OrderItemResponse] = []


class CheckoutResponse(BaseModel):
    order_id: uuid.UUID
    order_code: str
    final_amount: Decimal
    expires_at: datetime
    payment_url: str
    message: str = "Đơn hàng đã được khởi tạo và tạm giữ tồn kho 15 phút. Vui lòng thanh toán qua link."


# --- Payment & Webhook Schemas ---
class WebhookIPNRequest(BaseModel):
    order_code: str
    transaction_code: str
    amount: Decimal
    status: str = Field(..., description="SUCCESS hoặc FAILED")
    signature: str = Field(..., description="Chữ ký xác thực HMAC-SHA256")
