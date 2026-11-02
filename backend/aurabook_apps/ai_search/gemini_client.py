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


import math
import re
import unicodedata

BOOK_THEMES = [
    ("dac-nhan-tam", ["dac nhan tam", "giao tiep", "ung xu", "thu phuc", "long nguoi", "ket ban", "dale carnegie", "lang nghe", "khen ngoi"]),
    ("bon-thoa-uoc", ["bon thoa uoc", "tam ly", "chua lanh", "noi tam", "binh an", "hanh phuc", "thoa uoc", "toltec", "don miguel ruiz"]),
    ("sapiens-luoc-su-loai-nguoi", ["sapiens", "luoc su loai nguoi", "lich su", "loai nguoi", "tien hoa", "cach mang", "yuval noah harari"]),
    ("tri-tue-do-thai", ["tri tue do thai", "do thai", "tri tue", "tri nho", "thien tai", "ghi nho", "eran katz", "can phong la ma"]),
    ("10-dieu-tao-nen-so-phan", ["10 dieu tao nen so phan", "so phan", "david simon", "thoi quen", "cam ket", "ky luat"]),
    ("bi-mat-cua-mot-tri-nho-sieu-pham", ["bi mat cua mot tri nho sieu pham", "tri nho", "sieu pham", "chia khoa", "lien tuong"]),
    ("cach-nghi-de-thanh-cong", ["cach nghi de thanh cong", "napoleon hill", "lam giau", "khat vong", "niem tin", "kien tri", "tao ra gia tri", "thang du", "tai san", "kinh doanh"]),
    ("cay-cam-ngot-cua-toi", ["cay cam ngot cua toi", "zeze", "jose mauro de vasconcelos", "tuoi tho", "tinh yeu thuong"]),
    ("chien-tranh-tien-te-tap-1", ["chien tranh tien te tap 1", "song hongbing", "dong chay cua tien ngam", "rothschild", "fed", "thang du", "gia tri thang du", "kinh te", "tai chinh", "gia tri", "tu ban"]),
    ("chien-tranh-tien-te-tap-2", ["chien tranh tien te tap 2", "song hongbing", "quyen luc vang", "tai phiet", "vang", "thang du", "gia tri thang du", "kinh te", "tai chinh"]),
    ("chien-tranh-tien-te-tap-3", ["chien tranh tien te tap 3", "song hongbing", "rung ram tai chinh", "dong usd", "thang du", "gia tri thang du", "kinh te", "tai chinh"]),
    ("chu-nghia-khac-ky", ["chu nghia khac ky", "stoicism", "william b irvine", "ban linh", "binh than", "tinh tam"]),
    ("tu-duy-nhanh-va-cham", ["tu duy nhanh va cham", "daniel kahneman", "he thong 1", "he thong 2", "dinh kien"])
]

def _strip_vietnamese_diacritics(s: str) -> str:
    s = (s or "").lower().replace("đ", "d").replace("Đ", "d")
    s = unicodedata.normalize("NFD", s)
    return "".join(c for c in s if unicodedata.category(c) != "Mn")

def _djb2_hash(s: str) -> int:
    h = 5381
    for c in s:
        h = (((h << 5) + h) + ord(c)) & 0xFFFFFFFF
    return h

def generate_dense_768_embedding(text: str, book_slug: str = None) -> list[float]:
    """Sinh vector 768-dim chuẩn hóa L2, bất biến với dấu tiếng Việt."""
    vec = [0.0] * 768
    norm_text = _strip_vietnamese_diacritics(text)

    # Band 1: Book themes (0..255)
    for b_idx, (slug, keywords) in enumerate(BOOK_THEMES):
        slot_base = b_idx * 18
        weight = 0.0
        if book_slug and slug in book_slug:
            weight += 4.0
        for kw in keywords:
            if kw in norm_text:
                weight += 2.5
        if weight > 0:
            vec[slot_base] = weight
            vec[slot_base + 1] = math.log1p(weight)
            vec[slot_base + 2] = math.sqrt(weight)

    # Band 2: Subword lexical hash (256..639 -> 384 slots)
    words = re.findall(r"[a-z0-9]+", norm_text)
    for w in words:
        h1 = _djb2_hash(w) % 384
        h2 = (_djb2_hash(w[::-1]) * 31) % 384
        vec[256 + h1] += 1.0
        vec[256 + h2] += 0.5

    # Band 3: Structural length & bias (640..767)
    vec[640] = math.log1p(len(words))
    vec[641] = 1.0

    # L2 Normalization
    norm = math.sqrt(sum(x * x for x in vec))
    if norm > 0:
        return [round(x / norm, 6) for x in vec]
    return [1.0] + [0.0] * 767


def get_text_embedding(text: str, book_slug: str = None) -> list[float]:
    """Tạo vector embedding 768-dim từ text bằng Gemini text-embedding-004.
    Nếu không có key hoặc lỗi, dùng Deterministic Dense 768-dim Vectorizer chuẩn hóa L2.
    """
    if _client:
        try:
            result = _client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text,
            )
            vals = result.embeddings[0].values
            if any(vals):
                return vals
        except Exception as exc:
            logger.error("Lỗi tạo embedding qua Gemini API: %s, fallback sang dense 768-dim", exc)

    return generate_dense_768_embedding(text, book_slug)


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
