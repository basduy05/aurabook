from decimal import Decimal
import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.models.catalog import BookFormat


class CategoryBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    slug: Optional[str] = None
    description: Optional[str] = None
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
    publisher: Optional[str] = Field(None, max_length=150)
    description: Optional[str] = None
    cover_url: Optional[str] = None
    isbn: Optional[str] = None
    format: BookFormat = BookFormat.PHYSICAL
    original_price: Decimal = Field(ge=0)
    sale_price: Decimal = Field(ge=0)
    stock_quantity: int = Field(default=0, ge=0)
    is_available: bool = True


class BookCreate(BookBase):
    category_id: uuid.UUID
    slug: Optional[str] = None


class BookUpdate(BaseModel):
    category_id: Optional[uuid.UUID] = None
    title: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    description: Optional[str] = None
    cover_url: Optional[str] = None
    isbn: Optional[str] = None
    format: Optional[BookFormat] = None
    original_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    is_available: Optional[bool] = None


class BookListItemResponse(BookBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    category_id: uuid.UUID
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    held_quantity: int = 0
    available_stock: int = 0
    view_count: int = 0


class BookDetailResponse(BookListItemResponse):
    pass


class PaginatedBooksResponse(BaseModel):
    items: List[BookListItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int