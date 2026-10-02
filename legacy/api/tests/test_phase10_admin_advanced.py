import uuid
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.schemas.admin import (
    AdminDrmLicenseItem,
    AdminDrmListResponse,
    AdminReviewItem,
    AdminReviewListResponse,
    AdminUserItem,
    AdminUserListResponse,
    AdminVoucherCreateRequest,
    AdminVoucherItem,
)


def test_admin_advanced_user_schemas():
    user_id = uuid.uuid4()
    item = AdminUserItem(
        id=user_id,
        email="test@aurabook.vn",
        full_name="Nguyễn Văn Test",
        phone_number="0901234567",
        role="CUSTOMER",
        is_active=True,
        created_at=datetime.now(UTC),
    )
    assert item.email == "test@aurabook.vn"
    assert item.is_active is True

    res = AdminUserListResponse(items=[item], total=1)
    assert res.total == 1


def test_admin_advanced_voucher_schemas():
    now = datetime.now(UTC)
    v = AdminVoucherItem(
        id=uuid.uuid4(),
        code="AURA2026",
        discount_percent=15,
        min_order_value=Decimal("100000"),
        max_discount=Decimal("50000"),
        usage_limit=100,
        used_count=10,
        is_active=True,
        valid_from=now,
        valid_to=now,
    )
    assert v.code == "AURA2026"
    assert v.discount_percent == 15

    # Valid create request
    req = AdminVoucherCreateRequest(
        code="AI2026",
        discount_percent=20,
        min_order_value=Decimal("50000"),
        max_discount=Decimal("30000"),
        usage_limit=200,
        days_valid=15,
    )
    assert req.code == "AI2026"

    # Invalid discount percent (> 100)
    with pytest.raises(ValidationError):
        AdminVoucherCreateRequest(
            code="INVALID",
            discount_percent=150,
        )


def test_admin_advanced_drm_schemas():
    lic = AdminDrmLicenseItem(
        id=uuid.uuid4(),
        user_email="reader@aurabook.vn",
        user_name="Độc Giả AI",
        book_title="Thiết Kế Hệ Thống Đa Tác Tử",
        book_id=uuid.uuid4(),
        granted_at=datetime.now(UTC),
        is_active=True,
        current_page=12,
        total_pages=150,
        progress_percent=8.0,
    )
    assert lic.progress_percent == 8.0
    res = AdminDrmListResponse(items=[lic], total=1)
    assert res.total == 1


def test_admin_advanced_review_schemas():
    r = AdminReviewItem(
        id=uuid.uuid4(),
        user_name="Lê Minh",
        user_email="leminh@aurabook.vn",
        book_title="Clean Architecture",
        rating=5,
        comment="Sách rất hay và chất lượng cao!",
        created_at=datetime.now(UTC),
    )
    assert r.rating == 5
    res = AdminReviewListResponse(items=[r], total=1)
    assert len(res.items) == 1
