from datetime import datetime, timezone
from decimal import Decimal
import enum
import uuid
from typing import TYPE_CHECKING, Any, Dict, List, Optional
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.catalog import Book
    from app.models.ebook import EbookAccess


class OrderStatus(str, enum.Enum):
    PENDING = PENDING
    PAID = PAID
    PROCESSING = PROCESSING
    SHIPPED = SHIPPED
    COMPLETED = COMPLETED
    CANCELLED = CANCELLED


class PaymentStatus(str, enum.Enum):
    UNPAID = UNPAID
    PAID = PAID
    REFUNDED = REFUNDED
    FAILED = FAILED


class PaymentProvider(str, enum.Enum):
    SANDBOX_GATEWAY = SANDBOX_GATEWAY
    VNPAY_SANDBOX = VNPAY_SANDBOX
    MOMO_SANDBOX = MOMO_SANDBOX


class Voucher(Base, TimestampMixin):
    __tablename__ = vouchers

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        index=True,
        nullable=False,
    )
    discount_percent: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    discount_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    min_order_value: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal(0.00),
        nullable=False,
    )
    max_discount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_to: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    usage_limit: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    used_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    def is_valid(self, order_amount: Decimal) -> bool:
        now = datetime.now(timezone.utc)
        if not self.is_active:
            return False
        if now < self.valid_from or now > self.valid_to:
            return False
        if self.used_count >= self.usage_limit:
            return False
        if order_amount < self.min_order_value:
            return False
        return True


class Order(Base, TimestampMixin):
    __tablename__ = orders

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    order_code: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        index=True,
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(users.id, ondelete=RESTRICT),
        nullable=False,
        index=True,
    )
    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus, name=order_status_enum),
        default=OrderStatus.PENDING,
        index=True,
        nullable=False,
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus, name=payment_status_enum),
        default=PaymentStatus.UNPAID,
        nullable=False,
    )
    subtotal_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal(0.00),
        nullable=False,
    )
    shipping_fee: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        default=Decimal(0.00),
        nullable=False,
    )
    final_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    voucher_code: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    shipping_address: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
        nullable=False,
    )

    # Relationships
    user: Mapped[User] = relationship(back_populates=orders)
    items: Mapped[List[OrderItem]] = relationship(
        back_populates=order,
        cascade=all, delete-orphan,
    )
    payments: Mapped[List[Payment]] = relationship(
        back_populates=order,
        cascade=all, delete-orphan,
    )
    ebook_accesses: Mapped[List[EbookAccess]] = relationship(
        back_populates=order,
        cascade=all, delete-orphan,
    )

    def __repr__(self) -> str:
        return f<Order {self.order_code} - {self.status.value}>


class OrderItem(Base, TimestampMixin):
    __tablename__ = order_items

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(orders.id, ondelete=CASCADE),
        nullable=False,
        index=True,
    )
    book_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(books.id, ondelete=RESTRICT),
        nullable=False,
        index=True,
    )
    format: Mapped[str] = mapped_column(
        String(20),
        default=PHYSICAL,
        nullable=False,
    )
    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )
    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )

    # Relationships
    order: Mapped[Order] = relationship(back_populates=items)
    book: Mapped[Book] = relationship(back_populates=order_items)


class Payment(Base, TimestampMixin):
    __tablename__ = payments

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(orders.id, ondelete=RESTRICT),
        nullable=False,
        index=True,
    )
    provider: Mapped[PaymentProvider] = mapped_column(
        SQLEnum(PaymentProvider, name=payment_provider_enum),
        default=PaymentProvider.SANDBOX_GATEWAY,
        nullable=False,
    )
    transaction_code: Mapped[Optional[str]] = mapped_column(
        String(100),
        unique=True,
        nullable=True,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(30),
        default=PENDING,
        nullable=False,
    )
    payment_url: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
    )
    ipn_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSONB,
        nullable=True,
    )
    signature: Mapped[Optional[str]] = mapped_column(
        String(256),
        nullable=True,
    )

    # Relationships
    order: Mapped[Order] = relationship(back_populates=payments)


class CartItem(Base, TimestampMixin):
    __tablename__ = cart_items

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(users.id, ondelete=CASCADE),
        nullable=False,
        index=True,
    )
    book_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(books.id, ondelete=CASCADE),
        nullable=False,
        index=True,
    )
    format: Mapped[str] = mapped_column(
        String(20),
        default=PHYSICAL,
        nullable=False,
    )
    quantity: Mapped[int] = mapped_column(
        Integer,
        default=1,
        nullable=False,
    )

    # Relationships
    user: Mapped[User] = relationship(back_populates=cart_items)
    book: Mapped[Book] = relationship(back_populates=cart_items)