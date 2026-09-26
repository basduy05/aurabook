import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.catalog import BookFormat


class CategoryBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: str | None = None
    description: str | None = None
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    book_count: int = 0


class BookBase(BaseModel):
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


class BookCreate(BookBase):
    category_id: uuid.UUID
    slug: str | None = None


class BookUpdate(BaseModel):
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


class BookListItemResponse(BookBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    category_id: uuid.UUID
    category_name: str | None = None
    category_slug: str | None = None
    held_quantity: int = 0
    available_stock: int = 0
    view_count: int = 0


class BookDetailResponse(BookListItemResponse):
    pass


class PaginatedBooksResponse(BaseModel):
    items: list[BookListItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int
