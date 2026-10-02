import base64
import uuid
from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.models.catalog import BookFormat
from app.schemas.catalog import (
    AudioTeaserResponse,
    HybridSearchResponse,
    HybridSearchResultItem,
)
from app.schemas.review import ReviewCreate, ReviewListResponse, ReviewResponse
from app.services.audio_service import AudioService
from app.services.review_service import ReviewService


def test_rrf_scoring_and_ranking_properties():
    """Kiểm tra đặc tính toán học của thuật toán Reciprocal Rank Fusion (k=60)."""
    k = 60

    # Book A: Top 1 in both Lexical and Semantic
    rrf_a = (1.0 / (k + 1)) + (1.0 / (k + 1))

    # Book B: Top 1 only in Lexical
    rrf_b = 1.0 / (k + 1)

    # Book C: Top 2 in Lexical and Top 3 in Semantic
    rrf_c = (1.0 / (k + 2)) + (1.0 / (k + 3))

    assert rrf_a > rrf_c > rrf_b
    assert round(rrf_a, 6) == 0.032787
    assert round(rrf_b, 6) == 0.016393


def test_hybrid_search_schemas():
    """Kiểm tra tính toàn vẹn của Schema kết quả tìm kiếm lai."""
    b_id = uuid.uuid4()
    item = HybridSearchResultItem(
        id=b_id,
        title="Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
        slug="thiet-ke-he-thong-da-tac-tu-ai-rag",
        author="AuraBook Lab",
        sale_price=Decimal("199000.00"),
        format=BookFormat.BOTH,
        rrf_score=0.032787,
        lexical_rank=1,
        semantic_rank=1,
        match_type="HYBRID",
    )
    assert item.title == "Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG"
    assert item.match_type == "HYBRID"

    response = HybridSearchResponse(
        query="RAG AI",
        total_results=1,
        items=[item],
    )
    assert response.total_results == 1
    assert response.items[0].rrf_score > 0.03


def test_audio_teaser_wav_generation():
    """Kiểm tra bộ tạo âm thanh tóm tắt AI WAV độc lập (UC03)."""
    data_uri = AudioService.generate_synthetic_audio_wav(duration_seconds=2)
    assert data_uri.startswith("data:audio/wav;base64,")

    b64_str = data_uri.replace("data:audio/wav;base64,", "")
    raw_bytes = base64.b64decode(b64_str)

    # Verify RIFF/WAVE header specification
    assert raw_bytes[0:4] == b"RIFF"
    assert raw_bytes[8:12] == b"WAVE"
    assert raw_bytes[12:16] == b"fmt "
    assert len(raw_bytes) > 44  # Header is 44 bytes + PCM audio payload


def test_audio_teaser_response_schema():
    """Kiểm tra cấu trúc phản hồi Audio Teaser 60s."""
    b_id = uuid.uuid4()
    resp = AudioTeaserResponse(
        book_id=b_id,
        book_title="Clean Architecture",
        duration_seconds=60,
        script_text="Kịch bản tóm tắt hấp dẫn được biên soạn tự động.",
        audio_url="data:audio/wav;base64,UklGRg...",
    )
    assert resp.duration_seconds == 60
    assert resp.voice_model == "gemini-2.0-flash-audio-vi"


def test_review_profanity_filter():
    """Kiểm tra bộ lọc từ ngữ thô tục / vi phạm tiêu chuẩn cộng đồng (UC08)."""
    # Clean reviews
    assert (
        ReviewService.contains_profanity("Cuốn sách này viết rất hay và bổ ích!")
        is False
    )
    assert (
        ReviewService.contains_profanity("Kiến trúc hệ thống sáng tạo, đáng đọc.")
        is False
    )

    # Toxic / banned reviews
    assert ReviewService.contains_profanity("Cuốn này như lừa đảo, chán vcl") is True
    assert ReviewService.contains_profanity("ĐM sách gì dở ẹc vậy trời") is True
    assert (
        ReviewService.contains_profanity("Tác giả viết scam không đúng sự thật") is True
    )


def test_review_schema_validation():
    """Kiểm tra ràng buộc số sao (1-5) và cấu trúc danh sách bình luận (UC08)."""
    # Valid review
    rev = ReviewCreate(rating=5, comment="Sách xuất sắc, đóng gói cẩn thận.")
    assert rev.rating == 5

    # Rating > 5 rejected
    with pytest.raises(ValidationError):
        ReviewCreate(rating=6, comment="Tuyệt vời")

    # Rating < 1 rejected
    with pytest.raises(ValidationError):
        ReviewCreate(rating=0, comment="Tệ")

    # List response schema
    b_id = uuid.uuid4()
    u_id = uuid.uuid4()
    import datetime

    item = ReviewResponse(
        id=uuid.uuid4(),
        user_id=u_id,
        user_full_name="Nguyễn Văn A",
        book_id=b_id,
        rating=5,
        comment="Đáng tiền",
        is_verified_purchase=True,
        created_at=datetime.datetime.now(datetime.UTC),
    )

    list_resp = ReviewListResponse(
        book_id=b_id,
        average_rating=4.8,
        total_reviews=15,
        rating_distribution={5: 12, 4: 3, 3: 0, 2: 0, 1: 0},
        items=[item],
        page=1,
        limit=10,
        total_pages=2,
    )
    assert list_resp.average_rating == 4.8
    assert list_resp.rating_distribution[5] == 12
