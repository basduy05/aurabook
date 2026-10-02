import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EbookAccessItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    book_id: uuid.UUID
    title: str
    slug: str
    author: str
    cover_url: str | None = None
    format: str
    granted_at: datetime
    is_active: bool
    current_page: int = 1
    total_pages: int = 1
    progress_percent: float = 0.0
    last_read_at: datetime | None = None


class EbookSessionKeyResponse(BaseModel):
    book_id: uuid.UUID
    session_token: str
    key_base64: str
    iv_base64: str
    expires_in: int = 900
    issued_at: datetime


class EncryptedChunkResponse(BaseModel):
    chunk_index: int
    page_number: int
    chapter_title: str
    ciphertext_base64: str
    tag_base64: str
    iv_base64: str


class EbookContentResponse(BaseModel):
    book_id: uuid.UUID
    title: str
    total_chunks: int
    total_pages: int
    chunks: list[EncryptedChunkResponse]


class ReadingProgressUpdateRequest(BaseModel):
    current_page: int = Field(ge=1, description="Trang sách hiện tại đang đọc")
    total_pages: int = Field(ge=1, description="Tổng số trang của sách")
    last_cfi_or_location: str | None = Field(
        None, max_length=255, description="Vị trí đọc chi tiết hoặc mã CFI"
    )


class ReadingProgressResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    book_id: uuid.UUID
    current_page: int
    total_pages: int
    progress_percent: float
    last_cfi_or_location: str | None = None
    last_read_at: datetime
