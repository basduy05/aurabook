import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.ebook import (
    EbookAccessItemResponse,
    EbookContentResponse,
    EbookSessionKeyResponse,
    ReadingProgressResponse,
    ReadingProgressUpdateRequest,
)
from app.services.ebook_service import EbookService

router = APIRouter(prefix="/ebooks", tags=["E-Book DRM WebAssembly Reader (UC05)"])


@router.get(
    "/my-library",
    response_model=list[EbookAccessItemResponse],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách E-book trong Thư viện số cá nhân của độc giả",
)
async def get_my_library(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[EbookAccessItemResponse]:
    """Truy xuất toàn bộ danh sách các ấn phẩm E-book mà độc giả đã thanh toán thành công."""
    return await EbookService.get_user_library(db, current_user.id)


@router.get(
    "/{book_id}/session-key",
    response_model=EbookSessionKeyResponse,
    status_code=status.HTTP_200_OK,
    summary="Cấp khóa phiên dùng một lần (Ephemeral Key) giải mã DRM",
)
async def get_session_key(
    book_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> EbookSessionKeyResponse:
    """Kiểm tra quyền sở hữu trong ebook_accesses và cấp khóa phiên AES-256 dùng một lần."""
    return await EbookService.issue_session_key(db, current_user, book_id)


@router.get(
    "/{book_id}/content",
    response_model=EbookContentResponse,
    status_code=status.HTTP_200_OK,
    summary="Tải phân đoạn nội dung sách đã mã hóa AES-256-GCM kèm thẻ AEAD Tag",
)
async def get_ebook_content(
    book_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    x_session_token: Annotated[str | None, Header()] = None,
    session_token: Annotated[str | None, Query()] = None,
) -> EbookContentResponse:
    """Tải dữ liệu phân đoạn sách được mã hóa AES-256-GCM; chỉ giải mã được trên WebAssembly của client."""
    token = x_session_token or session_token
    if not token:
        from fastapi import HTTPException

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Yêu cầu cung cấp session_token (qua Header X-Session-Token hoặc query param).",
        )
    return await EbookService.get_encrypted_content(db, current_user, book_id, token)


@router.get(
    "/{book_id}/progress",
    response_model=ReadingProgressResponse,
    status_code=status.HTTP_200_OK,
    summary="Lấy tiến độ đọc sách hiện tại của độc giả",
)
async def get_progress(
    book_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReadingProgressResponse:
    """Lấy số trang đang đọc, tổng số trang và phần trăm tiến độ đã lưu."""
    return await EbookService.get_reading_progress(db, current_user.id, book_id)


@router.put(
    "/{book_id}/progress",
    response_model=ReadingProgressResponse,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật vị trí và tiến độ trang sách đọc dở dang",
)
async def update_progress(
    book_id: uuid.UUID,
    req: ReadingProgressUpdateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReadingProgressResponse:
    """Tự động đồng bộ số trang sách đang đọc, tính toán phần trăm hoàn thành và lưu vào CSDL."""
    return await EbookService.update_reading_progress(db, current_user.id, book_id, req)
