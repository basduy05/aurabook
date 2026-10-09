import logging
import re

from celery import shared_task

from .gemini_client import get_text_embedding
from .models import BookChunk

logger = logging.getLogger(__name__)

CHUNK_SIZE = 512   # tokens (approximate chars / 4)
CHUNK_OVERLAP = 64  # token overlap giữa các chunk


def _split_text_recursive(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Recursive Character Text Splitter.
    Ưu tiên split theo: paragraph → sentence → word
    """
    if len(text) <= chunk_size * 4:
        return [text.strip()] if text.strip() else []

    # Try paragraph split
    paragraphs = re.split(r'\n{2,}', text)
    if len(paragraphs) > 1:
        chunks = []
        current = ""
        for para in paragraphs:
            if len(current) + len(para) < chunk_size * 4:
                current += "\n\n" + para
            else:
                if current:
                    chunks.append(current.strip())
                current = para
        if current:
            chunks.append(current.strip())
        return chunks

    # Fallback: fixed size split with overlap
    chars_per_chunk = chunk_size * 4
    overlap_chars = overlap * 4
    chunks = []
    start = 0
    while start < len(text):
        end = start + chars_per_chunk
        chunks.append(text[start:end].strip())
        start = end - overlap_chars
    return [c for c in chunks if c]


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def vectorize_book(self, product_id: str, product_slug: str, full_text: str) -> dict:
    """Celery task: Chia nhỏ văn bản sách → tạo embeddings → lưu vào DB.
    Được kích hoạt khi admin upload nội dung sách mới.
    """
    logger.info("Bắt đầu vectorize sách product_id=%s", product_id)
    try:
        chunks = _split_text_recursive(full_text)
        logger.info("Tổng số chunks: %d", len(chunks))

        # Xóa chunks cũ
        BookChunk.objects.filter(product_id=product_id).delete()

        created = 0
        for idx, chunk_text in enumerate(chunks):
            embedding = get_text_embedding(chunk_text)
            # Store embedding as binary (will be pgvector in production)
            import struct
            embedding_bytes = struct.pack(f"{len(embedding)}f", *embedding)
            BookChunk.objects.create(
                product_id=product_id,
                product_slug=product_slug,
                chunk_index=idx,
                chunk_text=chunk_text,
                embedding=embedding_bytes,
                token_count=len(chunk_text) // 4,
            )
            created += 1
            if idx % 10 == 0:
                logger.info("Progress: %d/%d chunks", idx + 1, len(chunks))

        logger.info("✅ Vectorize hoàn thành: %d chunks cho %s", created, product_slug)
        return {"status": "success", "product_id": product_id, "chunks_created": created}

    except Exception as exc:
        logger.error("Lỗi vectorize: %s", exc)
        raise self.retry(exc=exc)
