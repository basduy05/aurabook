import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewListResponse, ReviewResponse
from app.services.review_service import ReviewService

router = APIRouter(prefix="/books", tags=["Reviews & Ratings (UC08)"])


@router.post(
    "/{id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Gửi đánh giá và bình luận ấn phẩm đã mua (UC08)",
)
async def create_review(
    id: uuid.UUID,
    req: ReviewCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ReviewResponse:
    """Độc giả gửi số sao (1-5) và nhận xét.

    Yêu cầu:
    - Độc giả phải có đơn hàng đã mua ấn phẩm (status='PAID') hoặc EbookAccess.
    - Nội dung được kiểm duyệt từ ngữ thô tục qua Profanity Filter.
    - Hệ thống tự động tính lại điểm trung bình average_rating trên sách.
    """
    return await ReviewService.create_or_update_review(
        db=db,
        user=current_user,
        book_id=id,
        req=req,
    )


@router.get(
    "/{id}/reviews",
    response_model=ReviewListResponse,
    summary="Danh sách đánh giá và phân bổ số sao của ấn phẩm (UC08)",
)
async def list_reviews(
    id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1, description="Số trang hiện tại"),
    limit: int = Query(10, ge=1, le=50, description="Số lượng mục mỗi trang"),
) -> ReviewListResponse:
    """Lấy danh sách các nhận xét của độc giả kèm tỷ lệ phân bổ sao từ 1 đến 5."""
    return await ReviewService.list_book_reviews(
        db=db,
        book_id=id,
        page=page,
        limit=limit,
    )
