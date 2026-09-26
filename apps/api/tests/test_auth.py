import pytest
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)


def test_password_hashing():
    "Verify password hash generation and comparison."
    password = StrongPassword@123
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password(WrongPassword, hashed) is False


def test_jwt_token_lifecycle():
    "Verify JWT access and refresh token encoding and decoding."
    user_id = 123e4567-e89b-12d3-a456-426614174000
    role = CUSTOMER

    # 1. Access token
    access_token = create_access_token(subject=user_id, role=role)
    payload = decode_token(access_token)
    assert payload is not None
    assert payload[sub] == user_id
    assert payload[role] == role
    assert payload[type] == access

    # 2. Refresh token
    refresh_token = create_refresh_token(subject=user_id)
    ref_payload = decode_token(refresh_token)
    assert ref_payload is not None
    assert ref_payload[sub] == user_id
    assert ref_payload[type] == refresh

    # 3. Invalid token
    assert decode_token(invalid.jwt.token) is None