import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.catalog import BookFormat
from app.models.order import OrderStatus, PaymentProvider, PaymentStatus


# --- UC09: Admin Book Schemas ---
class AdminBookCreateRequest(BaseModel):
    category_id: uuid.UUID
    title: str = Field(min_length=2, max_length=255)
    author: str = Field(min_length=2, max_length=150)
    publisher: str | None = Field(None, max_length=150)
    description: str | None = None
    cover_url: str | None = None
    isbn: str | None = None
    format: BookFormat = BookFormat.PHYSICAL
    original_price: Decimal = Field(ge=0)
    sale_price: Decimal = Field(ge=0)
    stock_quantity: int = Field(default=0, ge=0)
    is_available: bool = True
    slug: str | None = None


class AdminBookUpdateRequest(BaseModel):
    category_id: uuid.UUID | None = None
    title: str | None = None
    author: str | None = None
    publisher: str | None = None
    description: str | None = None
    cover_url: str | None = None
    isbn: str | None = None
    format: BookFormat | None = None
    original_price: Decimal | None = None
    sale_price: Decimal | None = None
    stock_quantity: int | None = None
    is_available: bool | None = None


class AdminStockUpdateRequest(BaseModel):
    stock_delta: int = Field(
        ...,
        description="Số lượng thay đổi: dương để nhập thêm, âm để xuất bớt",
    )
    reason: str = Field(
        default="Điều chỉnh kiểm kê định kỳ",
        max_length=255,
        description="Lý do điều chỉnh số lượng tồn kho",
    )


class AdminBookDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    slug: str
    author: str
    publisher: str | None
    description: str | None
    cover_url: str | None
    isbn: str | None
    format: BookFormat
    original_price: Decimal
    sale_price: Decimal
    stock_quantity: int
    held_quantity: int
    available_stock: int
    is_available: bool
    view_count: int
    average_rating: Decimal
    total_reviews: int
    category_id: uuid.UUID
    category_name: str | None = None
    category_slug: str | None = None
    created_at: datetime


class AdminPaginatedBooksResponse(BaseModel):
    items: list[AdminBookDetailResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# --- UC10: Catalog Vision OCR Schemas ---
class VisionExtractRequest(BaseModel):
    image_base64: str | None = Field(
        None,
        description="Chuỗi Base64 của ảnh bìa sách (hỗ trợ JPG, PNG, WEBP)",
    )


class VisionExtractResponse(BaseModel):
    isbn: str | None = Field(None, description="Mã ISBN-13 hoặc ISBN-10 bóc tách được")
    title: str = Field(description="Tựa đề sách nhận diện từ ảnh bìa")
    author: str = Field(description="Tên tác giả nhận diện")
    publisher: str | None = Field(None, description="Nhà xuất bản")
    suggested_category: str | None = Field(None, description="Thể loại gợi ý")
    summary: str | None = Field(None, description="Tóm tắt lời tựa bìa sau")
    confidence_score: float = Field(
        ge=0.0, le=1.0, description="Độ tin cậy của mô hình Vision OCR"
    )
    raw_ocr_text: str | None = None


# --- UC11: Admin Order Workflow Schemas ---
class AdminOrderStatusUpdateRequest(BaseModel):
    status: OrderStatus = Field(
        ...,
        description="Trạng thái đơn hàng đích: PENDING, PAID, PROCESSING, SHIPPED, COMPLETED, CANCELLED",
    )
    note: str | None = Field(None, max_length=500, description="Ghi chú điều phối")


class AdminOrderItemDetail(BaseModel):
    id: uuid.UUID
    book_id: uuid.UUID
    book_title: str
    book_cover_url: str | None = None
    format: str
    unit_price: Decimal
    quantity: int
    subtotal: Decimal


class AdminPaymentDetail(BaseModel):
    id: uuid.UUID
    provider: PaymentProvider
    amount: Decimal
    status: str
    transaction_code: str | None = None
    created_at: datetime


class AdminOrderListItemResponse(BaseModel):
    id: uuid.UUID
    order_code: str
    user_id: uuid.UUID
    customer_name: str
    customer_email: str
    total_amount: Decimal
    discount_amount: Decimal
    final_amount: Decimal
    status: OrderStatus
    payment_status: PaymentStatus
    items_count: int
    created_at: datetime


class AdminOrderDetailResponse(AdminOrderListItemResponse):
    shipping_address: str | None = None
    paid_at: datetime | None = None
    items: list[AdminOrderItemDetail]
    payments: list[AdminPaymentDetail]


class AdminOrderListResponse(BaseModel):
    items: list[AdminOrderListItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int


# --- UC12: Admin Dashboard Metrics Schemas ---
class DailyRevenueItem(BaseModel):
    date: str
    revenue: Decimal
    orders_count: int


class TopSellingBookItem(BaseModel):
    book_id: uuid.UUID
    title: str
    author: str
    cover_url: str | None = None
    units_sold: int
    total_revenue: Decimal


class LowStockAlertItem(BaseModel):
    book_id: uuid.UUID
    title: str
    stock_quantity: int
    held_quantity: int
    available_stock: int


class AdminDashboardMetricsResponse(BaseModel):
    total_revenue: Decimal
    today_revenue: Decimal
    total_orders: int
    paid_orders_count: int
    conversion_rate: float
    total_customers: int
    total_books: int
    revenue_by_day: list[DailyRevenueItem]
    top_selling_books: list[TopSellingBookItem]
    low_stock_alerts: list[LowStockAlertItem]


# --- UC13: E-book Chunking & Vectorization Schemas ---
class ProcessEbookRequest(BaseModel):
    content_text: str | None = Field(
        None,
        description="Nội dung thô của E-book hoặc phân đoạn cần bóc tách",
    )
    chunk_size_tokens: int = Field(default=512, ge=100, le=2048)
    overlap_tokens: int = Field(default=64, ge=0, le=256)


class ChunkSample(BaseModel):
    chunk_index: int
    page_number: int | None = None
    token_count: int
    snippet: str


class ProcessEbookResponse(BaseModel):
    book_id: uuid.UUID
    chunks_created: int
    total_tokens: int
    elapsed_seconds: float
    sample_chunks: list[ChunkSample]
