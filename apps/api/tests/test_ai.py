import math
import uuid

import pytest
from pydantic import ValidationError

from app.schemas.ai import (
    RagChatResponse,
    RagChunkContext,
    RagQueryRequest,
    VoiceActionDetail,
    VoiceAgentResponse,
    VoiceCommandRequest,
)
from app.services.ai_service import AiService


def test_embedding_dimensions_and_l2_normalization():
    """Verify embedding produces 768-dimensional normalized vectors for pgvector (UC06)."""
    text = "Kiến trúc hệ thống đa tác tử AI và tìm kiếm lai hybrid search"
    vec = AiService.generate_embedding(text)

    # 1. 768 dimensions
    assert len(vec) == 768
    assert all(isinstance(x, float) for x in vec)

    # 2. L2 norm must be approximately 1.0
    norm = math.sqrt(sum(x * x for x in vec))
    assert abs(norm - 1.0) < 1e-3


def test_cosine_similarity_properties():
    """Verify cosine similarity calculation between vectors."""
    v1 = AiService.generate_embedding("Mã hóa bản quyền số bằng WebAssembly")
    v2 = AiService.generate_embedding("Mã hóa bản quyền số bằng WebAssembly")
    v3 = AiService.generate_embedding("Công thức nấu món phở bò truyền thống")

    # Identical texts must produce similarity ~ 1.0
    sim_identical = AiService.cosine_similarity(v1, v2)
    assert abs(sim_identical - 1.0) < 1e-4

    # Completely different texts should have significantly lower similarity
    sim_diff = AiService.cosine_similarity(v1, v3)
    assert sim_diff < sim_identical


def test_rag_schemas_validation():
    """Verify RAG query and response schemas validation."""
    book_id = uuid.uuid4()
    req = RagQueryRequest(
        book_id=book_id, query="Ý chính của chương 1 là gì?", current_page=2
    )
    assert req.book_id == book_id
    assert req.query == "Ý chính của chương 1 là gì?"
    assert req.current_page == 2

    # Query too short (< 2 chars)
    with pytest.raises(ValidationError):
        RagQueryRequest(book_id=book_id, query="a")

    chunk = RagChunkContext(
        chunk_index=0,
        page_number=1,
        chapter_title="Chương 1",
        content="Nội dung kiểm thử phân đoạn sách.",
        similarity_score=0.885,
    )
    resp = RagChatResponse(
        book_id=book_id,
        query=req.query,
        answer="Câu trả lời tóm tắt [Trang 1].",
        sources=[chunk],
        has_direct_evidence=True,
    )
    assert resp.has_direct_evidence is True
    assert len(resp.sources) == 1
    assert resp.sources[0].similarity_score == 0.885


def test_voice_command_schemas_validation():
    """Verify Voice command request and response schemas (UC07)."""
    req = VoiceCommandRequest(transcript="Hủy giúp tôi đơn hàng AB123456")
    assert req.transcript == "Hủy giúp tôi đơn hàng AB123456"

    # Transcript too short
    with pytest.raises(ValidationError):
        VoiceCommandRequest(transcript="")

    action_detail = VoiceActionDetail(
        function_name="cancel_order",
        arguments={"order_code": "AB123456"},
        result={"status": "CANCELLED"},
    )
    resp = VoiceAgentResponse(
        intent="cancel_order",
        action_executed=True,
        spoken_response="Dạ, đơn hàng AB123456 đã được hủy thành công ạ.",
        action_detail=action_detail,
    )
    assert resp.intent == "cancel_order"
    assert resp.action_executed is True
    assert resp.action_detail is not None
    assert resp.action_detail.function_name == "cancel_order"
