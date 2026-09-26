import enum
import uuid
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import Boolean, Enum as SQLEnum, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.order import CartItem, Order
    from app.models.ebook import EbookAccess, ReadingProgress


class UserRole(str, enum.Enum):
    CUSTOMER = CUSTOMER
    STAFF = STAFF
    ADMIN = ADMIN


class User(Base, TimestampMixin):
    __tablename__ = users

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )
    full_name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )
    phone_number: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
    )
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name=user_role_enum),
        default=UserRole.CUSTOMER,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
    )

    # Relationships
    orders: Mapped[List[Order]] = relationship(
        back_populates=user,
        cascade=all, delete-orphan,
    )
    cart_items: Mapped[List[CartItem]] = relationship(
        back_populates=user,
        cascade=all, delete-orphan,
    )
    ebook_accesses: Mapped[List[EbookAccess]] = relationship(
        back_populates=user,
        cascade=all, delete-orphan,
    )
    reading_progresses: Mapped[List[ReadingProgress]] = relationship(
        back_populates=user,
        cascade=all, delete-orphan,
    )

    def __repr__(self) -> str:
        return f<User {self.email} ({self.role.value})>