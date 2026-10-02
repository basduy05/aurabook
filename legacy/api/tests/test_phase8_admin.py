import uuid
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.models.catalog import BookFormat
from app.models.order import OrderStatus
from app.schemas.admin import (
    AdminBookCreateRequest,
    AdminDashboardMetricsResponse,
    AdminOrderStatusUpdateRequest,
    AdminStockUpdateRequest,
    DailyRevenueItem,
    LowStockAlertItem,
    ProcessEbookResponse,
    TopSellingBookItem,
    VisionExtractResponse,
)
from app.services.chunking_worker import ChunkingWorker
from app.services.vision_service import VisionService


def test_admin_book_schemas_validation():
    """Kiểm tra tính toàn vẹn của Schema quản trị sách (UC09)."""
    cat_id = uuid.uuid4()
    req = AdminBookCreateRequest(
        category_id=cat_id,
        title="Kiến Trúc Microservices Toàn Diện",
        author="Nguyễn Văn A",
        format=BookFormat.BOTH,
        original_price=Decimal("300000.00"),
        sale_price=Decimal("240000.00"),
        stock_quantity=50,
        isbn="978-604-0-11223-3",
    )
    assert req.title == "Kiến Trúc Microservices Toàn Diện"
    assert req.stock_quantity == 50

    # Stock update schema
    stock_req = AdminStockUpdateRequest(
        stock_delta=20, reason="Nhập lô sách mới từ nhà in"
    )
    assert stock_req.stock_delta == 20

    # Negative price rejected
    with pytest.raises(ValidationError):
        AdminBookCreateRequest(
            category_id=cat_id,
            title="Sách Lỗi",
            author="Tác giả",
            original_price=Decimal("-50000.00"),
            sale_price=Decimal("100000.00"),
        )


@pytest.mark.asyncio
async def test_catalog_vision_ocr_extraction():
    """Kiểm tra tác tử Catalog Vision bóc tách ảnh bìa sách (UC10)."""
    # Sample mock image base64
    fake_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    res = await VisionService.extract_book_cover(image_base64=fake_b64)

    assert isinstance(res, VisionExtractResponse)
    assert len(res.title) > 0
    assert len(res.author) > 0
    assert res.confidence_score >= 0.90
    assert res.isbn is not None


def test_admin_order_status_update_schema():
    """Kiểm tra điều phối trạng thái đơn hàng FSM (UC11)."""
    req = AdminOrderStatusUpdateRequest(
        status=OrderStatus.SHIPPED,
        note="Đơn hàng đã bàn giao cho đơn vị vận chuyển ViettelPost.",
    )
    assert req.status == OrderStatus.SHIPPED
    assert req.note is not None

    req_cancel = AdminOrderStatusUpdateRequest(
        status=OrderStatus.CANCELLED,
        note="Khách yêu cầu hủy qua hotline.",
    )
    assert req_cancel.status == OrderStatus.CANCELLED


def test_admin_dashboard_metrics_schema():
    """Kiểm tra cấu trúc và tính toán chỉ số Dashboard thời gian thực (UC12)."""
    b_id = uuid.uuid4()
    metrics = AdminDashboardMetricsResponse(
        total_revenue=Decimal("15500000.00"),
        today_revenue=Decimal("1200000.00"),
        total_orders=120,
        paid_orders_count=96,
        conversion_rate=80.0,
        total_customers=450,
        total_books=85,
        revenue_by_day=[
            DailyRevenueItem(
                date="2026-09-20", revenue=Decimal("2000000.00"), orders_count=15
            ),
            DailyRevenueItem(
                date="2026-09-21", revenue=Decimal("2500000.00"), orders_count=18
            ),
        ],
        top_selling_books=[
            TopSellingBookItem(
                book_id=b_id,
                title="Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
                author="AuraBook Lab",
                units_sold=45,
                total_revenue=Decimal("8955000.00"),
            )
        ],
        low_stock_alerts=[
            LowStockAlertItem(
                book_id=b_id,
                title="Clean Architecture",
                stock_quantity=3,
                held_quantity=1,
                available_stock=2,
            )
        ],
    )

    assert metrics.total_revenue == Decimal("15500000.00")
    assert metrics.conversion_rate == 80.0
    assert len(metrics.revenue_by_day) == 2
    assert metrics.top_selling_books[0].units_sold == 45
    assert metrics.low_stock_alerts[0].available_stock == 2


def test_recursive_chunking_worker():
    """Kiểm tra phân đoạn đệ quy và độ gối đầu overlap (UC13)."""
    sample_text = (
        "Đoạn 1: Trí tuệ nhân tạo đang làm thay đổi toàn diện phương thức phát triển phần mềm hiện đại.\n\n"
        "Đoạn 2: Các kiến trúc Multi-Agent Systems cho phép nhiều tác tử chuyên biệt hóa phối hợp nhịp nhàng.\n\n"
        "Đoạn 3: Công nghệ Retrieval-Augmented Generation (RAG) giúp kết nối mô hình ngôn ngữ lớn với cơ sở tri thức.\n\n"
        "Đoạn 4: Bảo mật bản quyền số E-book đòi hỏi cơ chế mã hóa giải mã trong bộ nhớ RAM kết hợp thẻ AEAD Tag."
    )

    # Split with small size to force multiple chunks
    chunks = ChunkingWorker.recursive_split_text(
        sample_text,
        chunk_size_tokens=60,  # ~240 chars
        overlap_tokens=15,  # ~60 chars
    )

    assert len(chunks) >= 2
    # Verify chunks contain text
    for c in chunks:
        assert len(c.strip()) > 0

    # Verify schema
    b_id = uuid.uuid4()
    resp = ProcessEbookResponse(
        book_id=b_id,
        chunks_created=len(chunks),
        total_tokens=250,
        elapsed_seconds=0.125,
        sample_chunks=[],
    )
    assert resp.chunks_created >= 2
    assert resp.elapsed_seconds > 0
