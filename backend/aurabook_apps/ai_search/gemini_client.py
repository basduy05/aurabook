import logging
import os
from typing import Any

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
EMBEDDING_MODEL = "text-embedding-004"
VISION_MODEL = "gemini-2.0-flash"

_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


def get_text_embedding(text: str) -> list[float]:
    """Tạo vector embedding 768-dim từ text bằng Gemini text-embedding-004.
    Trả về list[float] độ dài 768.
    """
    if not _client:
        logger.warning("GEMINI_API_KEY không được cấu hình, trả về vector rỗng")
        return [0.0] * 768
    try:
        result = _client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
        )
        return result.embeddings[0].values
    except Exception as exc:
        logger.error("Lỗi tạo embedding: %s", exc)
        return [0.0] * 768


def ocr_book_cover(image_bytes: bytes) -> dict[str, Any]:
    """Dùng Gemini 2.0 Flash Vision để OCR bìa sách.
    Trả về metadata: title, author, publisher, isbn, description
    """
    if not _client:
        return {"error": "GEMINI_API_KEY không được cấu hình"}
    try:
        import json
        import re
        prompt = """
        Đây là ảnh bìa sách. Hãy trích xuất thông tin sau và trả về JSON:
        {
          "title": "tên sách",
          "author": "tên tác giả",
          "publisher": "nhà xuất bản (nếu có)",
          "isbn": "mã ISBN (nếu có)",
          "description": "mô tả ngắn nội dung sách (1-2 câu)",
          "language": "vi hoặc en",
          "category": "danh mục sách"
        }
        Nếu không tìm thấy thông tin nào, để null.
        """
        image_part = types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
        response = _client.models.generate_content(
            model=VISION_MODEL,
            contents=[image_part, prompt],
        )
        text = response.text
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return {"raw_response": text}
    except Exception as exc:
        logger.error("Lỗi OCR bìa sách: %s", exc)
        return {"error": str(exc)}


def rag_query_stream(query: str, product_id: str, chunks: list[str]):
    """Generator: RAG Q&A với SSE streaming.
    Dùng Gemini để trả lời câu hỏi dựa trên context chunks.
    Yield từng token để SSE.
    """
    if not _client:
        yield "data: GEMINI_API_KEY chưa được cấu hình\n\n"
        return

    context = "\n\n".join([f"[Chunk {i+1}]\n{c}" for i, c in enumerate(chunks[:5])])
    prompt = f"""
Bạn là trợ lý AI của AuraBook. Dựa trên nội dung sách sau:

{context}

Hãy trả lời câu hỏi: {query}

Trả lời bằng tiếng Việt, súc tích và chính xác.
    """
    try:
        response = _client.models.generate_content_stream(
            model=VISION_MODEL,
            contents=prompt,
        )
        for chunk in response:
            if chunk.text:
                yield f"data: {chunk.text}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as exc:
        logger.error("Lỗi RAG query: %s", exc)
        yield f"data: Lỗi: {exc}\n\n"
