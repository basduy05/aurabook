import base64
import os
import uuid
from datetime import UTC, datetime, timedelta

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.catalog import Book
from app.models.ebook import BookChunk, EbookAccess, ReadingProgress
from app.models.user import User
from app.schemas.ebook import (
    EbookAccessItemResponse,
    EbookContentResponse,
    EbookSessionKeyResponse,
    EncryptedChunkResponse,
    ReadingProgressResponse,
    ReadingProgressUpdateRequest,
)


class EbookSessionStore:
    """In-memory cache for ephemeral DRM session keys with auto-expiration."""

    def __init__(self):
        self._sessions: dict[str, dict] = {}

    def clean_expired(self):
        now = datetime.now(UTC)
        expired_keys = [k for k, v in self._sessions.items() if v["expires_at"] < now]
        for k in expired_keys:
            del self._sessions[k]

    def set(
        self,
        session_token: str,
        user_id: uuid.UUID,
        book_id: uuid.UUID,
        key_bytes: bytes,
        iv_bytes: bytes,
        ttl_seconds: int = 900,
    ):
        self.clean_expired()
        self._sessions[session_token] = {
            "user_id": user_id,
            "book_id": book_id,
            "key_bytes": key_bytes,
            "iv_bytes": iv_bytes,
            "expires_at": datetime.now(UTC) + timedelta(seconds=ttl_seconds),
        }

    def get(self, session_token: str) -> dict | None:
        self.clean_expired()
        return self._sessions.get(session_token)


session_store = EbookSessionStore()


class EbookService:
    """E-Book DRM Security, Content Delivery, and Reading Progress Service."""

    @staticmethod
    async def check_access(
        db: AsyncSession,
        user_id: uuid.UUID,
        book_id: uuid.UUID,
    ) -> EbookAccess:
        """Verify whether the user has active DRM access rights to read this e-book."""
        stmt = select(EbookAccess).where(
            EbookAccess.user_id == user_id,
            EbookAccess.book_id == book_id,
            EbookAccess.is_active.is_(True),
        )
        res = await db.execute(stmt)
        access = res.scalar_one_or_none()
        if not access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn chưa sở hữu bản quyền sách điện tử này hoặc quyền truy cập đã hết hạn.",
            )
        return access

    @staticmethod
    async def issue_session_key(
        db: AsyncSession,
        user: User,
        book_id: uuid.UUID,
    ) -> EbookSessionKeyResponse:
        """Issue a one-time ephemeral AES-256 session key & IV for client WASM decryption."""
        # 1. Verify DRM ownership
        await EbookService.check_access(db, user.id, book_id)

        # 2. Generate 256-bit AES key and 96-bit GCM IV
        key_bytes = os.urandom(32)  # 256 bits
        iv_bytes = os.urandom(12)  # 96 bits for standard AES-GCM
        session_token = f"drm_sess_{uuid.uuid4().hex}"
        ttl_seconds = 900  # 15 minutes

        # 3. Store session
        session_store.set(
            session_token=session_token,
            user_id=user.id,
            book_id=book_id,
            key_bytes=key_bytes,
            iv_bytes=iv_bytes,
            ttl_seconds=ttl_seconds,
        )

        return EbookSessionKeyResponse(
            book_id=book_id,
            session_token=session_token,
            key_base64=base64.b64encode(key_bytes).decode("utf-8"),
            iv_base64=base64.b64encode(iv_bytes).decode("utf-8"),
            expires_in=ttl_seconds,
            issued_at=datetime.now(UTC),
        )

    @staticmethod
    async def get_encrypted_content(
        db: AsyncSession,
        user: User,
        book_id: uuid.UUID,
        session_token: str,
    ) -> EbookContentResponse:
        """Retrieve book content and encrypt chunks using the ephemeral AES-256-GCM key."""
        # 1. Validate session
        sess = session_store.get(session_token)
        if not sess or sess["user_id"] != user.id or sess["book_id"] != book_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Khóa phiên đọc sách không hợp lệ hoặc đã hết hạn. Vui lòng lấy lại session key.",
            )

        # 2. Verify book exists
        book_res = await db.execute(select(Book).where(Book.id == book_id))
        book = book_res.scalar_one_or_none()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cuốn sách không tồn tại trong hệ thống.",
            )

        # 3. Fetch chunks from DB
        chunks_stmt = (
            select(BookChunk)
            .where(BookChunk.book_id == book_id)
            .order_by(BookChunk.chunk_index.asc())
        )
        chunks_res = await db.execute(chunks_stmt)
        db_chunks = chunks_res.scalars().all()

        # If no chunks seeded yet for this book, generate high-quality default chapters
        sample_pages: list[dict] = []
        if db_chunks:
            for c in db_chunks:
                sample_pages.append(
                    {
                        "chunk_index": c.chunk_index,
                        "page_number": c.page_number or (c.chunk_index + 1),
                        "chapter_title": c.chapter_title or f"Phần {c.chunk_index + 1}",
                        "content": c.content,
                    }
                )
        else:
            sample_pages = [
                {
                    "chunk_index": 0,
                    "page_number": 1,
                    "chapter_title": "Lời Mở Đầu: Kỷ Nguyên Đọc Sách Số Bảo Mật",
                    "content": (
                        f'Chào mừng bạn đến với ấn phẩm điện tử "{book.title}".\n\n'
                        "Hệ thống AuraBook bảo vệ bản quyền số của tác giả và nhà xuất bản bằng công nghệ "
                        "DRM WebAssembly Canvas. Toàn bộ nội dung trang sách được mã hóa bằng thuật toán "
                        "AES-256-GCM theo chuẩn mã hóa quân sự quốc tế.\n\n"
                        "Khi trang sách được tải về thiết bị của bạn, module WebAssembly trong bộ nhớ RAM cô lập "
                        "sẽ giải mã và vẽ trực tiếp các nét chữ lên HTML5 Canvas, hoàn toàn không tạo thẻ DOM văn bản thô, "
                        "chống sao chép trái phép và tự động làm sạch bộ nhớ sau khi kết xuất.\n\n"
                        "Chúc bạn có một trải nghiệm đọc sách an tâm, tiện lợi và tràn đầy cảm hứng!"
                    ),
                },
                {
                    "chunk_index": 1,
                    "page_number": 2,
                    "chapter_title": "Chương 1: Kiến Trúc Nền Tảng & Bản Quyền Số",
                    "content": (
                        "Trong quá trình phát triển các nền tảng thương mại điện tử xuất bản phẩm, "
                        "rào cản lớn nhất luôn là nguy cơ rò rỉ dữ liệu khi phát hành sách điện tử (E-book).\n\n"
                        "Phần lớn các ứng dụng đọc sách nền web truyền thống sử dụng HTML/CSS để hiển thị nội dung. "
                        "Điều này cho phép các công cụ tự động hoặc tiện ích mở rộng của trình duyệt bóc tách (scraping) "
                        "toàn bộ văn bản chỉ trong vài giây.\n\n"
                        "AuraBook giải quyết triệt để bài toán này bằng cách chuyển đổi toàn bộ quy trình sang mô hình "
                        "kết xuất điểm ảnh đồ họa Canvas được vận hành bởi mã máy nhị phân WebAssembly."
                    ),
                },
                {
                    "chunk_index": 2,
                    "page_number": 3,
                    "chapter_title": "Chương 2: Tác Tử RAG Đồng Hành Cùng Độc Giả",
                    "content": (
                        "Không chỉ dừng lại ở việc đọc tĩnh, AuraBook tích hợp cụm Tác tử Trí tuệ Nhân tạo Đa phương thức "
                        "(Gemini 2.0 Flash) trực tiếp vào không gian đọc.\n\n"
                        "Mỗi trang sách bạn đang đọc được lập chỉ mục véc-tơ không gian đa chiều (768 chiều trên pgvector). "
                        "Bất kỳ khi nào bạn gặp một khái niệm trừu tượng hoặc thuật ngữ phức tạp, bạn có thể mở khung chat "
                        "để đối thoại với Tác tử RAG Companion. Trợ lý AI sẽ trích xuất ngữ cảnh liên quan và giải thích chi tiết "
                        "kèm dẫn chứng số trang chính xác."
                    ),
                },
            ]

        # 4. Encrypt each chunk using AES-256-GCM with session key
        aesgcm = AESGCM(sess["key_bytes"])
        base_iv = sess["iv_bytes"]

        encrypted_chunks: list[EncryptedChunkResponse] = []
        for p in sample_pages:
            # Derive unique 12-byte IV per chunk by XORing chunk_index
            chunk_iv = bytearray(base_iv)
            chunk_iv[0] = chunk_iv[0] ^ (p["chunk_index"] & 0xFF)
            chunk_iv[1] = chunk_iv[1] ^ ((p["chunk_index"] >> 8) & 0xFF)
            chunk_iv_bytes = bytes(chunk_iv)

            raw_bytes = p["content"].encode("utf-8")
            # AESGCM.encrypt returns ciphertext + 16-byte tag appended at the end
            encrypted_payload = aesgcm.encrypt(chunk_iv_bytes, raw_bytes, None)
            ciphertext = encrypted_payload[:-16]
            tag = encrypted_payload[-16:]

            encrypted_chunks.append(
                EncryptedChunkResponse(
                    chunk_index=p["chunk_index"],
                    page_number=p["page_number"],
                    chapter_title=p["chapter_title"],
                    ciphertext_base64=base64.b64encode(ciphertext).decode("utf-8"),
                    tag_base64=base64.b64encode(tag).decode("utf-8"),
                    iv_base64=base64.b64encode(chunk_iv_bytes).decode("utf-8"),
                )
            )

        return EbookContentResponse(
            book_id=book_id,
            title=book.title,
            total_chunks=len(encrypted_chunks),
            total_pages=len(encrypted_chunks),
            chunks=encrypted_chunks,
        )

    @staticmethod
    async def get_reading_progress(
        db: AsyncSession,
        user_id: uuid.UUID,
        book_id: uuid.UUID,
    ) -> ReadingProgressResponse:
        """Fetch current user's reading progress for a given book."""
        stmt = select(ReadingProgress).where(
            ReadingProgress.user_id == user_id,
            ReadingProgress.book_id == book_id,
        )
        res = await db.execute(stmt)
        prog = res.scalar_one_or_none()

        if prog:
            return ReadingProgressResponse.model_validate(prog)

        # Default if not read yet
        return ReadingProgressResponse(
            book_id=book_id,
            current_page=1,
            total_pages=1,
            progress_percent=0.0,
            last_cfi_or_location=None,
            last_read_at=datetime.now(UTC),
        )

    @staticmethod
    async def update_reading_progress(
        db: AsyncSession,
        user_id: uuid.UUID,
        book_id: uuid.UUID,
        req: ReadingProgressUpdateRequest,
    ) -> ReadingProgressResponse:
        """Update reader's current page, calculate percentage, and persist to database."""
        # 1. Verify book access
        await EbookService.check_access(db, user_id, book_id)

        # 2. Compute progress percentage
        safe_total = max(1, req.total_pages)
        safe_current = max(1, min(req.current_page, safe_total))
        percent = min(100.0, round((safe_current / safe_total) * 100, 2))
        now = datetime.now(UTC)

        # 3. Check existing progress record
        stmt = select(ReadingProgress).where(
            ReadingProgress.user_id == user_id,
            ReadingProgress.book_id == book_id,
        )
        res = await db.execute(stmt)
        prog = res.scalar_one_or_none()

        if prog:
            prog.current_page = safe_current
            prog.total_pages = safe_total
            prog.progress_percent = percent
            prog.last_cfi_or_location = req.last_cfi_or_location
            prog.last_read_at = now
        else:
            prog = ReadingProgress(
                user_id=user_id,
                book_id=book_id,
                current_page=safe_current,
                total_pages=safe_total,
                progress_percent=percent,
                last_cfi_or_location=req.last_cfi_or_location,
                last_read_at=now,
            )
            db.add(prog)

        await db.commit()
        await db.refresh(prog)
        return ReadingProgressResponse.model_validate(prog)

    @staticmethod
    async def get_user_library(
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> list[EbookAccessItemResponse]:
        """Fetch all digital e-books owned by current user with live reading progress."""
        stmt = (
            select(EbookAccess)
            .options(
                selectinload(EbookAccess.book).selectinload(Book.reading_progresses)
            )
            .where(
                EbookAccess.user_id == user_id,
                EbookAccess.is_active.is_(True),
            )
            .order_by(EbookAccess.granted_at.desc())
        )
        res = await db.execute(stmt)
        access_list = res.scalars().all()

        library: list[EbookAccessItemResponse] = []
        for acc in access_list:
            book = acc.book
            # Find matching progress for this user
            user_prog = next(
                (p for p in (book.reading_progresses or []) if p.user_id == user_id),
                None,
            )

            library.append(
                EbookAccessItemResponse(
                    book_id=book.id,
                    title=book.title,
                    slug=book.slug,
                    author=book.author,
                    cover_url=book.cover_url,
                    format=book.format.value
                    if hasattr(book.format, "value")
                    else str(book.format),
                    granted_at=acc.granted_at,
                    is_active=acc.is_active,
                    current_page=user_prog.current_page if user_prog else 1,
                    total_pages=user_prog.total_pages if user_prog else 1,
                    progress_percent=user_prog.progress_percent if user_prog else 0.0,
                    last_read_at=user_prog.last_read_at if user_prog else None,
                )
            )

        return library
