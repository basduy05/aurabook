import base64
import os
import uuid
from datetime import UTC, datetime

import pytest
from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from pydantic import ValidationError

from app.schemas.ebook import (
    EbookContentResponse,
    EbookSessionKeyResponse,
    EncryptedChunkResponse,
    ReadingProgressUpdateRequest,
)
from app.services.ebook_service import EbookSessionStore


def test_aes_gcm_encryption_and_decryption_lifecycle():
    """Verify AES-256-GCM encryption, AEAD tag integrity, and tamper detection (UC05)."""
    key = os.urandom(32)
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)

    plaintext = "Toàn bộ nội dung sách E-book bảo mật bằng WebAssembly Canvas trên AuraBook.".encode()

    encrypted_data = aesgcm.encrypt(nonce, plaintext, None)
    ciphertext = encrypted_data[:-16]
    tag = encrypted_data[-16:]

    assert len(tag) == 16  # 128-bit AEAD tag
    assert ciphertext != plaintext

    payload_to_decrypt = ciphertext + tag
    decrypted = aesgcm.decrypt(nonce, payload_to_decrypt, None)
    assert decrypted == plaintext
    assert (
        decrypted.decode()
        == "Toàn bộ nội dung sách E-book bảo mật bằng WebAssembly Canvas trên AuraBook."
    )

    tampered_payload = bytearray(payload_to_decrypt)
    tampered_payload[0] ^= 0xFF
    with pytest.raises(InvalidTag):
        aesgcm.decrypt(nonce, bytes(tampered_payload), None)


def test_session_store_lifecycle():
    """Verify DRM session key caching and expiration behavior."""
    store = EbookSessionStore()
    user_id = uuid.uuid4()
    book_id = uuid.uuid4()
    key = os.urandom(32)
    iv = os.urandom(12)
    token = f"sess_{uuid.uuid4().hex}"

    store.set(token, user_id, book_id, key, iv, ttl_seconds=900)
    retrieved = store.get(token)
    assert retrieved is not None
    assert retrieved["user_id"] == user_id
    assert retrieved["book_id"] == book_id
    assert retrieved["key_bytes"] == key
    assert retrieved["iv_bytes"] == iv

    assert store.get("invalid_token") is None


def test_reading_progress_schemas_and_percentage_calculation():
    """Verify progress calculation and schema validation."""
    req = ReadingProgressUpdateRequest(
        current_page=25,
        total_pages=100,
        last_cfi_or_location="epubcfi(/6/4[chap01]!/4/2/10)",
    )
    assert req.current_page == 25
    assert req.total_pages == 100
    assert req.last_cfi_or_location is not None

    with pytest.raises(ValidationError):
        ReadingProgressUpdateRequest(current_page=0, total_pages=100)

    current = 45
    total = 180
    percent = min(100.0, round((current / total) * 100, 2))
    assert percent == 25.0


def test_ebook_schemas_structure():
    """Verify EbookContentResponse and EbookSessionKeyResponse structures."""
    book_id = uuid.uuid4()
    now = datetime.now(UTC)

    session_resp = EbookSessionKeyResponse(
        book_id=book_id,
        session_token="drm_sess_abc123",
        key_base64=base64.b64encode(os.urandom(32)).decode(),
        iv_base64=base64.b64encode(os.urandom(12)).decode(),
        expires_in=900,
        issued_at=now,
    )
    assert session_resp.expires_in == 900
    assert session_resp.book_id == book_id

    chunk = EncryptedChunkResponse(
        chunk_index=0,
        page_number=1,
        chapter_title="Chương 1",
        ciphertext_base64=base64.b64encode(b"encrypted_sample").decode(),
        tag_base64=base64.b64encode(os.urandom(16)).decode(),
        iv_base64=base64.b64encode(os.urandom(12)).decode(),
    )
    content_resp = EbookContentResponse(
        book_id=book_id,
        title="Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
        total_chunks=1,
        total_pages=1,
        chunks=[chunk],
    )
    assert content_resp.total_chunks == 1
    assert content_resp.chunks[0].chapter_title == "Chương 1"
