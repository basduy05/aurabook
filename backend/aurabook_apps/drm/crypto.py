import os
import secrets
import struct
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# DRM_MASTER_KEY phải là 32 bytes hex string (64 hex chars)
_MASTER_KEY = bytes.fromhex(os.environ.get("DRM_MASTER_KEY", "0" * 64))

SESSION_KEY_TTL_SECONDS = int(os.environ.get("DRM_SESSION_TTL", "3600"))


def generate_session_key() -> bytes:
    """Tạo ephemeral AES-256 session key ngẫu nhiên (32 bytes)."""
    return secrets.token_bytes(32)


def encrypt_session_key(session_key: bytes) -> tuple[bytes, bytes]:
    """
    Mã hóa session key bằng master key (AES-256-GCM).
    Trả về: (nonce, ciphertext)
    """
    aesgcm = AESGCM(_MASTER_KEY)
    nonce = secrets.token_bytes(12)  # 96-bit nonce
    ciphertext = aesgcm.encrypt(nonce, session_key, None)
    return nonce, ciphertext


def decrypt_session_key(nonce: bytes, ciphertext: bytes) -> bytes:
    """Giải mã session key từ DB để cấp cho client."""
    aesgcm = AESGCM(_MASTER_KEY)
    return aesgcm.decrypt(nonce, ciphertext, None)


def encrypt_chunk(plaintext: bytes, session_key: bytes, chunk_index: int) -> bytes:
    """
    Mã hóa một chunk nội dung sách (AES-256-GCM).
    Nonce được derive từ chunk_index để tránh nonce reuse.
    Trả về: nonce (12 bytes) + ciphertext
    """
    aesgcm = AESGCM(session_key)
    # Derive nonce: 4 bytes zero-pad + 8 bytes chunk_index
    nonce = b"\x00" * 4 + struct.pack(">Q", chunk_index)
    ciphertext = aesgcm.encrypt(nonce, plaintext, None)
    return nonce + ciphertext


def decrypt_chunk(data: bytes, session_key: bytes) -> bytes:
    """
    Giải mã chunk (để test/verify, không expose ở client-side).
    data = nonce (12 bytes) + ciphertext
    """
    aesgcm = AESGCM(session_key)
    nonce = data[:12]
    ciphertext = data[12:]
    return aesgcm.decrypt(nonce, ciphertext, None)
