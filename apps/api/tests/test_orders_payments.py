import hmac
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.order import CartItemAddRequest, WebhookIPNRequest
from app.services.payment_service import generate_hmac_signature


def test_hmac_signature_generation_and_tampering():
    order_code = "AB260926200000A1B2"
    amount = Decimal("199000.00")
    status = "SUCCESS"

    # Generate valid signature
    data = f"{order_code}|{amount}|{status}"
    sig = generate_hmac_signature(data, settings.JWT_SECRET)
    assert len(sig) == 64

    # Validate with exact data
    assert hmac.compare_digest(sig, generate_hmac_signature(data, settings.JWT_SECRET))

    # Tampered amount must produce different signature
    tampered_data = f"{order_code}|{Decimal('10000.00')}|{status}"
    tampered_sig = generate_hmac_signature(tampered_data, settings.JWT_SECRET)
    assert sig != tampered_sig


def test_cart_item_schema_validation():
    import uuid

    req = CartItemAddRequest(
        book_id=uuid.uuid4(),
        format="PHYSICAL",
        quantity=2,
    )
    assert req.quantity == 2
    assert req.format == "PHYSICAL"

    # Zero or negative quantity rejected
    with pytest.raises(ValidationError):
        CartItemAddRequest(book_id=uuid.uuid4(), quantity=0)


def test_webhook_schema_validation():
    req = WebhookIPNRequest(
        order_code="AB123456",
        transaction_code="TX999",
        amount=Decimal("150000.00"),
        status="SUCCESS",
        signature="abcdef123456",
    )
    assert req.status == "SUCCESS"
    assert req.amount == Decimal("150000.00")
