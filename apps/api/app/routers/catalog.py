import uuid
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import require_staff
from app.models.catalog import BookFormat
from app.models.user import User
from app.schemas.catalog import (
    AudioTeaserResponse,
    BookCreate,
    BookDetailResponse,
    CategoryCreate,
    CategoryResponse,
    HybridSearchResponse,
    PaginatedBooksResponse,
)
from app.services.audio_service import AudioService
from app.services.catalog_service import CatalogService
from app.services.search_service import SearchService

router = APIRouter(tags=["Catalog & Books"])


# --- Categories ---
@router.get(
    "/categories",
    response_model=list[CategoryResponse],
    summary="Lấy danh sách thể loại sách",
)
async def list_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[CategoryResponse]:
    """Truy xuất toàn bộ danh mục thể loại sách kèm số lượng đầu sách."""
    return await CatalogService.get_categories(db)


@router.post(
    "/categories",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo thể loại sách mới (Yêu cầu quyền Staff/Admin)",
)
async def create_category(
    req: CategoryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_staff)],
) -> CategoryResponse:
    cat = await CatalogService.create_category(db, req)
    return CategoryResponse(
        id=cat.id,
        name=cat.name,
        slug=cat.slug,
        description=cat.description,
        is_active=cat.is_active,
        book_count=0,
    )


# --- Books ---
@router.get(
    "/books",
    response_model=PaginatedBooksResponse,
    summary="Danh sách ấn phẩm sách (phân trang, lọc, tìm kiếm)",
)
async def list_books(
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(1, ge=1, description="Số trang hiện tại"),
    limit: int = Query(12, ge=1, le=50, description="Số lượng mục mỗi trang"),
    category: str | None = Query(None, description="Slug danh mục cần lọc"),
    format: BookFormat | None = Query(None, description="PHYSICAL, EBOOK hoặc BOTH"),
    min_price: Decimal | None = Query(None, ge=0, description="Giá thấp nhất"),
    max_price: Decimal | None = Query(None, ge=0, description="Giá cao nhất"),
    search: str | None = Query(
        None, description="Từ khóa tìm kiếm theo tiêu đề hoặc tác giả"
    ),
    sort_by: str = Query(
        "created_at_desc",
        description="Thứ tự sắp xếp: created_at_desc, price_asc, price_desc, view_count_desc",
    ),
) -> PaginatedBooksResponse:
    return await CatalogService.list_books(
        db=db,
        page=page,
        limit=limit,
        category_slug=category,
        book_format=format,
        min_price=min_price,
        max_price=max_price,
        search=search,
        sort_by=sort_by,
    )


# --- UC02: Hybrid Search (BM25 + 768d Vector with RRF k=60) ---
@router.get(
    "/books/search/hybrid",
    response_model=HybridSearchResponse,
    summary="Tìm kiếm sách lai kết hợp thuật toán RRF k=60 (UC02)",
)
async def search_hybrid(
    db: Annotated[AsyncSession, Depends(get_db)],
    q: str = Query(..., min_length=1, description="Từ khóa tìm kiếm"),
    limit: int = Query(10, ge=1, le=30, description="Số lượng kết quả tối đa"),
    min_similarity: float = Query(
        0.40, ge=0.0, le=1.0, description="Ngưỡng tương đồng cosine tối thiểu"
    ),
) -> HybridSearchResponse:
    return await SearchService.search_hybrid(
        db=db, q=q, limit=limit, min_similarity=min_similarity
    )


# --- UC03: AI Audio Teaser (60s) ---
@router.get(
    "/books/{id}/audio-teaser",
    response_model=AudioTeaserResponse,
    summary="Nghe thử âm thanh tóm tắt sách AI Audio Teaser 60s (UC03)",
)
async def get_audio_teaser(
    id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AudioTeaserResponse:
    return await AudioService.get_or_create_audio_teaser(db=db, book_id=id)


@router.get(
    "/books/{slug}",
    response_model=BookDetailResponse,
    summary="Chi tiết ấn phẩm sách theo Slug",
)
async def get_book_detail(
    slug: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> BookDetailResponse:
    """Lấy thông tin chi tiết một cuốn sách, kiểm tra tồn kho khả dụng và tăng lượt xem."""
    return await CatalogService.get_book_by_slug(db, slug)


@router.post(
    "/books",
    response_model=BookDetailResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Thêm mới ấn phẩm sách (Yêu cầu quyền Staff/Admin)",
)
async def create_book(
    req: BookCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(require_staff)],
) -> BookDetailResponse:
    return await CatalogService.create_book(db, req)
