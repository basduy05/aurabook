from decimal import Decimal
import enum
import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Enum as SQLEnum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.order import CartItem, OrderItem
    from app.models.ebook import BookChunk, EbookAccess, ReadingProgress


class BookFormat(str, enum.Enum):
    PHYSICAL = PHYSICAL
    EBOOK = EBOOK
    BOTH = BOTH


class Category(Base, TimestampMixin):
    __tablename__ = categories

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    books: Mapped[List[Book]] = relationship(
        back_populates=category,
        cascade=all, delete-orphan,
    )

    def __repr__(self) -> str:
        return f<Category {self.name}>


class Book(Base, TimestampMixin):
    __tablename__ = books

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(categories.id, ondelete=RESTRICT),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(300),
        unique=True,
        index=True,
        nullable=False,
    )
    author: Mapped[str] = mapped_column(
        String(150),
        index=True,
        nullable=False,
    )
    publisher: Mapped[Optional[str]] = mapped_column(
        String(150),
        nullable=True,
    )
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    cover_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )
    isbn: Mapped[Optional[str]] = mapped_column(
        String(30),
        unique=True,
        nullable=True,
    )
    format: Mapped[BookFormat] = mapped_column(
        SQLEnum(BookFormat, name=book_format_enum),
        default=BookFormat.PHYSICAL,
        nullable=False,
    )
    original_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    sale_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    stock_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    held_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )
    is_available: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    view_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # Relationships
    category: Mapped[Category] = relationship(back_populates=books)
    order_items: Mapped[List[OrderItem]] = relationship(back_populates=book)
    cart_items: Mapped[List[CartItem]] = relationship(back_populates=book)
    ebook_accesses: Mapped[List[EbookAccess]] = relationship(back_populates=book)
    reading_progresses: Mapped[List[ReadingProgress]] = relationship(back_populates=book)
    book_chunks: Mapped[List[BookChunk]] = relationship(back_populates=book, cascade=all, delete-orphan)

    @property
    def available_stock(self) -> int:
        "Physical available stock excluding held quantity for pending orders."
        return max(0, self.stock_quantity - self.held_quantity)

    def __repr__(self) -> str:
        return f<Book {self.title} - {self.format.value}>