import re
import time
import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog import Book
from app.models.ebook import BookChunk
from app.schemas.admin import ChunkSample, ProcessEbookResponse
from app.services.ai_service import AiService


class ChunkingWorker:
    @staticmethod
    def recursive_split_text(
        text: str,
        chunk_size_tokens: int = 512,
        overlap_tokens: int = 64,
    ) -> list[str]:
        """Tách văn bản đệ quy với kích thước phân đoạn và độ gối đầu overlap."""
        # Approximate: 1 token ≈ 4 characters for Vietnamese text
        chunk_char_size = max(200, chunk_size_tokens * 4)
        overlap_chars = min(chunk_char_size // 2, overlap_tokens * 4)

        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
        if not paragraphs:
            paragraphs = [text.strip()]

        chunks: list[str] = []
        current_chunk = ""

        for para in paragraphs:
            if len(current_chunk) + len(para) + 1 <= chunk_char_size:
                current_chunk += ("\n\n" if current_chunk else "") + para
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                    # Keep overlap from tail of previous chunk
                    if overlap_chars > 0 and len(current_chunk) > overlap_chars:
                        current_chunk = current_chunk[-overlap_chars:] + "\n\n" + para
                    else:
                        current_chunk = para
                else:
                    # Single paragraph is too large, slice it
                    for i in range(0, len(para), chunk_char_size - overlap_chars):
                        sub_part = para[i : i + chunk_char_size]
                        if sub_part.strip():
                            chunks.append(sub_part.strip())
                    current_chunk = ""

        if current_chunk and current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks if chunks else [text[:chunk_char_size]]

    @classmethod
    async def process_book_content(
        cls,
        db: AsyncSession,
        book_id: uuid.UUID,
        content_text: str | None,
        chunk_size_tokens: int = 512,
        overlap_tokens: int = 64,
    ) -> ProcessEbookResponse:
        start_time = time.time()

        # 1. Verify book exists
        stmt = select(Book).where(Book.id == book_id)
        res = await db.execute(stmt)
        book = res.scalar_one_or_none()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy thông tin ấn phẩm sách để thực hiện phân đoạn.",
            )

        # 2. Prepare text content
        raw_text = content_text.strip() if content_text else ""
        if not raw_text:
            raw_text = (
                f"Chương 1: Khởi đầu tác phẩm {book.title}.\n"
                f"Tác giả: {book.author}. Tóm tắt: {book.description or 'Nội dung sách giá trị.'}\n\n"
                "Chương 2: Kiến trúc và Thực tiễn chuyên sâu.\n"
                "Nội dung này trình bày các phân đoạn đệ quy tối ưu hóa cho mô hình tìm kiếm RAG và trích xuất thông tin."
            )

        # 3. Recursive chunking
        chunk_texts = cls.recursive_split_text(
            raw_text,
            chunk_size_tokens=chunk_size_tokens,
            overlap_tokens=overlap_tokens,
        )

        # 4. Remove previous chunks for this book
        await db.execute(delete(BookChunk).where(BookChunk.book_id == book_id))

        total_tokens = 0
        samples: list[ChunkSample] = []
        new_chunk_objs: list[BookChunk] = []

        # 5. Process each chunk & generate 768d vector
        for idx, c_text in enumerate(chunk_texts, start=1):
            # Token count approximation (1 token ≈ 4 chars)
            t_count = max(1, len(c_text) // 4)
            total_tokens += t_count
            page_num = (idx + 1) // 2  # Approx 2 chunks per page

            # Generate 768d embedding
            embedding = await AiService.generate_embedding(c_text)

            chunk_obj = BookChunk(
                book_id=book_id,
                chunk_index=idx,
                content=c_text,
                page_number=page_num,
                chapter_title=f"Phần {idx}",
                token_count=t_count,
                embedding=embedding,
            )
            new_chunk_objs.append(chunk_obj)

            if len(samples) < 3:
                snippet = c_text[:120] + ("..." if len(c_text) > 120 else "")
                samples.append(
                    ChunkSample(
                        chunk_index=idx,
                        page_number=page_num,
                        token_count=t_count,
                        snippet=snippet,
                    )
                )

        db.add_all(new_chunk_objs)
        await db.commit()

        elapsed = round(time.time() - start_time, 3)

        return ProcessEbookResponse(
            book_id=book_id,
            chunks_created=len(new_chunk_objs),
            total_tokens=total_tokens,
            elapsed_seconds=elapsed,
            sample_chunks=samples,
        )
