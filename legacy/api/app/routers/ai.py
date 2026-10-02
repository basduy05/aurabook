from typing import Annotated

from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.ai import (
    RagChatResponse,
    RagQueryRequest,
    VoiceAgentResponse,
    VoiceCommandRequest,
)
from app.services.ai_service import AiService

router = APIRouter(prefix="/ai", tags=["AI Multimodal Agents (UC06, UC07)"])


@router.post(
    "/rag-stream",
    summary="Đối thoại RAG Companion ngữ cảnh trang sách (SSE Streaming) (UC06)",
)
async def stream_rag_companion(
    req: RagQueryRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Truy xuất các phân đoạn vector Cosine >= 0.70 và sinh lời giải thích dạng luồng Server-Sent Events."""
    return StreamingResponse(
        AiService.stream_rag(db, req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post(
    "/rag/chat",
    response_model=RagChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Hỏi đáp nội dung sách với Tác tử RAG (JSON Đồng bộ)",
)
async def chat_rag_companion(
    req: RagQueryRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> RagChatResponse:
    """Trả về câu trả lời phân tích chuyên sâu kèm danh sách dẫn chứng số trang chính xác."""
    return await AiService.chat_rag(db, req)


@router.post(
    "/voice-agent",
    response_model=VoiceAgentResponse,
    status_code=status.HTTP_200_OK,
    summary="Tác tử thoại CSKH thực thi Function Calling theo khẩu lệnh (UC07)",
)
async def process_voice_agent(
    req: VoiceCommandRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> VoiceAgentResponse:
    """Phân giải ý định qua Gemini Function Calling, tự động thực thi hàm CSDL và ghi nhật ký kiểm toán."""
    return await AiService.process_voice_command(db, current_user, req.transcript)
