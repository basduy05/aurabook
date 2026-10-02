import math
import re
import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.catalog import Book
from app.models.ebook import EbookAccess, Review
from app.models.order import Order, OrderItem, OrderStatus
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewListResponse, ReviewResponse

# Vietnamese profanity & toxic terms blacklist
PROFANITY_LIST = [
    "đm",
    "đkm",
    "dcm",
    "dkm",
    "vcl",
    "vkl",
    "clmm",
    "lừa đảo",
    "scam",
    "chó đẻ",
    "súc vật",
    "ngu dốt",
    "địt",
    "cặc",
    "lồn",
]


class ReviewService:
    @staticmethod
    def contains_profanity(text: str | None) -> bool:
        if not text:
            return False
        clean = text.lower()
        for bad in PROFANITY_LIST:
            # Match word boundary or exact occurrence
            pattern = rf"(^|\s|[.,!?;:_]){re.escape(bad)}([.,!?;:_]|\s|$)"
            if re.search(pattern, clean):
                return True
        return False

    @staticmethod
    async def verify_user_purchased_book(
        db: AsyncSession,
        user_id: uuid.UUID,
        book_id: uuid.UUID,
    ) -> bool:
        """Kiểm tra độc giả đã mua sách thành công (Order status='PAID' hoặc có EbookAccess)."""
        # Check EbookAccess first
        access_stmt = select(EbookAccess).where(
            EbookAccess.user_id == user_id,
            EbookAccess.book_id == book_id,
            EbookAccess.is_active.is_(True),
        )
        access_res = await db.execute(access_stmt)
        if access_res.scalar_one_or_none():
            return True

        # Check Order with PAID status
        order_stmt = (
            select(OrderItem)
            .join(Order, Order.id == OrderItem.order_id)
            .where(
                Order.user_id == user_id,
                Order.status == OrderStatus.PAID,
                OrderItem.book_id == book_id,
            )
        )
        order_res = await db.execute(order_stmt)
        if order_res.scalar_one_or_none():
            return True

        return False

    @classmethod
    async def create_or_update_review(
        cls,
        db: AsyncSession,
        user: User,
        book_id: uuid.UUID,
        req: ReviewCreate,
    ) -> ReviewResponse:
        # 1. Verify book exists
        book_stmt = select(Book).where(Book.id == book_id, Book.is_available.is_(True))
        book_res = await db.execute(book_stmt)
        book = book_res.scalar_one_or_none()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy ấn phẩm sách yêu cầu đánh giá.",
            )

        # 2. Verify purchase ownership
        has_purchased = await cls.verify_user_purchased_book(db, user.id, book_id)
        if not has_purchased:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chỉ độc giả đã mua ấn phẩm (đơn hàng thành công) mới được quyền gửi đánh giá.",
            )

        # 3. Profanity filter
        if cls.contains_profanity(req.comment):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nội dung nhận xét vi phạm tiêu chuẩn cộng đồng về ngôn từ. Vui lòng chỉnh sửa lại.",
            )

        # 4. Upsert review
        rev_stmt = select(Review).where(
            Review.user_id == user.id, Review.book_id == book_id
        )
        rev_res = await db.execute(rev_stmt)
        existing_rev = rev_res.scalar_one_or_none()

        if existing_rev:
            existing_rev.rating = req.rating
            existing_rev.comment = req.comment.strip() if req.comment else None
            review_obj = existing_rev
        else:
            review_obj = Review(
                user_id=user.id,
                book_id=book_id,
                rating=req.rating,
                comment=req.comment.strip() if req.comment else None,
            )
            db.add(review_obj)

        await db.flush()

        # 5. Recalculate average_rating and total_reviews
        calc_stmt = select(
            func.avg(Review.rating),
            func.count(Review.id),
        ).where(Review.book_id == book_id)
        calc_res = await db.execute(calc_stmt)
        avg_rating, total_cnt = calc_res.one()

        book.average_rating = Decimal(str(round(avg_rating or 0.0, 2)))
        book.total_reviews = total_cnt or 0

        await db.commit()
        await db.refresh(review_obj)

        return ReviewResponse(
            id=review_obj.id,
            user_id=review_obj.user_id,
            user_full_name=user.full_name,
            book_id=review_obj.book_id,
            rating=review_obj.rating,
            comment=review_obj.comment,
            is_verified_purchase=True,
            created_at=review_obj.created_at,
        )

    @classmethod
    async def list_book_reviews(
        cls,
        db: AsyncSession,
        book_id: uuid.UUID,
        page: int = 1,
        limit: int = 10,
    ) -> ReviewListResponse:
        page = max(1, page)
        limit = min(max(1, limit), 50)
        offset = (page - 1) * limit

        # Check book exists
        book_stmt = select(Book).where(Book.id == book_id)
        book_res = await db.execute(book_stmt)
        book = book_res.scalar_one_or_none()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy ấn phẩm sách.",
            )

        # Count total
        count_stmt = select(func.count(Review.id)).where(Review.book_id == book_id)
        total_res = await db.execute(count_stmt)
        total = total_res.scalar_one()

        # Distribution
        dist_stmt = (
            select(Review.rating, func.count(Review.id))
            .where(Review.book_id == book_id)
            .group_by(Review.rating)
        )
        dist_res = await db.execute(dist_stmt)
        distribution = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0}
        for r_val, count in dist_res.all():
            if r_val in distribution:
                distribution[r_val] = count

        # List items with user loaded
        query = (
            select(Review)
            .options(selectinload(Review.user))
            .where(Review.book_id == book_id)
            .order_by(Review.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        items_res = await db.execute(query)
        revs = items_res.scalars().all()

        items = [
            ReviewResponse(
                id=r.id,
                user_id=r.user_id,
                user_full_name=r.user.full_name if r.user else "Độc giả ẩn danh",
                book_id=r.book_id,
                rating=r.rating,
                comment=r.comment,
                is_verified_purchase=True,
                created_at=r.created_at,
            )
            for r in revs
        ]

        total_pages = math.ceil(total / limit) if total > 0 else 0
        avg_rating = float(book.average_rating) if book.average_rating else 0.0

        return ReviewListResponse(
            book_id=book.id,
            average_rating=avg_rating,
            total_reviews=total,
            rating_distribution=distribution,
            items=items,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )
