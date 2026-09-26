from decimal import Decimal
import pytest
from pydantic import ValidationError

from app.models.catalog import BookFormat
from app.schemas.catalog import BookCreate, CategoryCreate
from app.services.catalog_service import slugify


def test_slugify_vietnamese():
    assert slugify("Công Nghệ & Lập Trình") == "cong-nghe-lap-trinh"
    assert slugify("Clean Architecture: Kiến Trúc Phần Mềm") == "clean-architecture-kien-truc-phan-mem"
    assert slugify("Đắc Nhân Tâm 2026!") == "dac-nhan-tam-2026"


def test_category_schema_validation():
    cat = CategoryCreate(name="Kinh Tế")
    assert cat.name == "Kinh Tế"
    assert cat.is_active is True

    # Name too short
    with pytest.raises(ValidationError):
        CategoryCreate(name="A")


def test_book_schema_validation():
    import uuid
    cat_id = uuid.uuid4()
    book = BookCreate(
        category_id=cat_id,
        title="Lập Trình Python Chuyên Sâu",
        author="Nguyễn Văn A",
        format=BookFormat.PHYSICAL,
        original_price=Decimal("200000"),
        sale_price=Decimal("150000"),
        stock_quantity=10,
    )
    assert book.title == "Lập Trình Python Chuyên Sâu"
    assert book.stock_quantity == 10

    # Negative price rejected
    with pytest.raises(ValidationError):
        BookCreate(
            category_id=cat_id,
            title="Sách Lỗi",
            author="Tác Giả",
            original_price=Decimal("-1000"),
            sale_price=Decimal("100000"),
        )
