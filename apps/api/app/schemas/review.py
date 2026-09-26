import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5, description="Số sao đánh giá từ 1 đến 5")
    comment: str | None = Field(
        None, max_length=2000, description="Nội dung nhận xét chi tiết"
    )


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    user_full_name: str
    book_id: uuid.UUID
    rating: int
    comment: str | None = None
    is_verified_purchase: bool = True
    created_at: datetime


class ReviewListResponse(BaseModel):
    book_id: uuid.UUID
    average_rating: float
    total_reviews: int
    rating_distribution: dict[int, int] = Field(
        default_factory=lambda: {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
    )
    items: list[ReviewResponse]
    page: int
    limit: int
    total_pages: int
