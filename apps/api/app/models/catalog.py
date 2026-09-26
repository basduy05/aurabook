import enum
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy import (
    Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.ebook import BookChunk, EbookAccess, ReadingProgress
    from app.models.order import CartItem, OrderItem


class BookFormat(str, enum.Enum):
    PHYSICAL = "PHYSICAL"
    EBOOK = "EBOOK"
    BOTH = "BOTH"


class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        index=True,
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    books: Mapped[list["Book"]] = relationship(
        back_populates="category",
        cascade="all, delete-orphan",
    )


class Book(Base, TimestampMixin):
    __tablename__ = "books"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )
    slug: Mapped[str] = mapped_column(
        String(280),
        unique=True,
        index=True,
        nullable=False,
    )
    author: Mapped[str] = mapped_column(
        String(255),
        index=True,
        nullable=False,
    )
    publisher: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    isbn: Mapped[str | None] = mapped_column(
        String(30),
        unique=True,
        nullable=True,
    )
    format: Mapped[BookFormat] = mapped_column(
        SQLEnum(BookFormat, name="book_format_enum"),
        default=BookFormat.BOTH,
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
    cover_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # Relationships
    category: Mapped["Category"] = relationship(back_populates="books")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="book")
    cart_items: Mapped[list["CartItem"]] = relationship(
        back_populates="book",
        cascade="all, delete-orphan",
    )
    ebook_accesses: Mapped[list["EbookAccess"]] = relationship(back_populates="book")
    reading_progresses: Mapped[list["ReadingProgress"]] = relationship(
        back_populates="book",
        cascade="all, delete-orphan",
    )
    book_chunks: Mapped[list["BookChunk"]] = relationship(
        back_populates="book",
        cascade="all, delete-orphan",
    )
