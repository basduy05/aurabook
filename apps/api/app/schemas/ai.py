import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class RagQueryRequest(BaseModel):
    book_id: uuid.UUID = Field(..., description="ID cuốn sách đang đối thoại RAG")
    query: str = Field(
        ..., min_length=2, max_length=1000, description="Nội dung câu hỏi của độc giả"
    )
    current_page: int | None = Field(
        None, ge=1, description="Trang sách độc giả đang đọc hiện tại"
    )


class RagChunkContext(BaseModel):
    chunk_index: int
    page_number: int
    chapter_title: str
    content: str
    similarity_score: float


class RagChatResponse(BaseModel):
    book_id: uuid.UUID
    query: str
    answer: str
    sources: list[RagChunkContext]
    has_direct_evidence: bool = True


class VoiceCommandRequest(BaseModel):
    transcript: str = Field(
        ...,
        min_length=2,
        max_length=1000,
        description="Đoạn thoại văn bản nhận từ Web Speech API",
    )
    client_timestamp: datetime | None = None


class VoiceActionDetail(BaseModel):
    function_name: str
    arguments: dict[str, Any]
    result: dict[str, Any]


class VoiceAgentResponse(BaseModel):
    intent: str
    action_executed: bool
    spoken_response: str
    action_detail: VoiceActionDetail | None = None
