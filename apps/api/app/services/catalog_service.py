import math
import re
import unicodedata
import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.catalog import Book, BookFormat, Category
from app.schemas.catalog import (
    BookCreate,
    BookDetailResponse,
    BookListItemResponse,
    CategoryCreate,
    CategoryResponse,
    PaginatedBooksResponse,
)


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = "".join([c for c in text if not unicodedata.combining(c)])
    text = text.lower().replace("đ", "d").replace("Đ", "d")
    text = re.sub(r"[^\w\s-]", "", text).strip()
    return re.sub(r"[-\s]+", "-", text)


class CatalogService:
    @staticmethod
    async def get_categories(db: AsyncSession) -> list[CategoryResponse]:
        stmt = (
            select(
                Category,
                func.count(Book.id).label("book_count"),
            )
            .outerjoin(
                Book, (Book.category_id == Category.id) & (Book.is_available.is_(True))
            )
            .where(Category.is_active.is_(True))
            .group_by(Category.id)
            .order_by(Category.name.asc())
        )
        res = await db.execute(stmt)
        rows = res.all()

        results = []
        for cat, count in rows:
            res_item = CategoryResponse(
                id=cat.id,
                name=cat.name,
                slug=cat.slug,
                description=cat.description,
                is_active=cat.is_active,
                book_count=count,
            )
            results.append(res_item)
        return results

    @staticmethod
    async def create_category(db: AsyncSession, req: CategoryCreate) -> Category:
        slug = req.slug or slugify(req.name)
        stmt = select(Category).where(
            (Category.slug == slug) | (Category.name == req.name)
        )
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Danh mục '{req.name}' hoặc slug '{slug}' đã tồn tại.",
            )

        cat = Category(
            name=req.name.strip(),
            slug=slug,
            description=req.description,
            is_active=req.is_active,
        )
        db.add(cat)
        await db.commit()
        await db.refresh(cat)
        return cat

    @staticmethod
    async def list_books(
        db: AsyncSession,
        page: int = 1,
        limit: int = 12,
        category_slug: str | None = None,
        book_format: BookFormat | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        search: str | None = None,
        sort_by: str = "created_at_desc",
    ) -> PaginatedBooksResponse:
        page = max(1, page)
        limit = min(max(1, limit), 50)
        offset = (page - 1) * limit

        query = (
            select(Book)
            .options(selectinload(Book.category))
            .where(Book.is_available.is_(True))
        )
        count_query = select(func.count(Book.id)).where(Book.is_available.is_(True))

        if category_slug:
            cat_stmt = select(Category.id).where(Category.slug == category_slug)
            cat_res = await db.execute(cat_stmt)
            cat_id = cat_res.scalar_one_or_none()
            if cat_id:
                query = query.where(Book.category_id == cat_id)
                count_query = count_query.where(Book.category_id == cat_id)
            else:
                return PaginatedBooksResponse(
                    items=[], total=0, page=page, limit=limit, total_pages=0
                )

        if book_format:
            query = query.where(
                (Book.format == book_format) | (Book.format == BookFormat.BOTH)
            )
            count_query = count_query.where(
                (Book.format == book_format) | (Book.format == BookFormat.BOTH)
            )

        if min_price is not None:
            query = query.where(Book.sale_price >= min_price)
            count_query = count_query.where(Book.sale_price >= min_price)
        if max_price is not None:
            query = query.where(Book.sale_price <= max_price)
            count_query = count_query.where(Book.sale_price <= max_price)

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                (Book.title.ilike(search_pattern)) | (Book.author.ilike(search_pattern))
            )
            count_query = count_query.where(
                (Book.title.ilike(search_pattern)) | (Book.author.ilike(search_pattern))
            )

        if sort_by == "price_asc":
            query = query.order_by(Book.sale_price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Book.sale_price.desc())
        elif sort_by == "view_count_desc":
            query = query.order_by(Book.view_count.desc())
        else:
            query = query.order_by(Book.created_at.desc())

        total_res = await db.execute(count_query)
        total = total_res.scalar_one()

        query = query.offset(offset).limit(limit)
        items_res = await db.execute(query)
        books = items_res.scalars().all()

        book_items = []
        for b in books:
            item = BookListItemResponse(
                id=b.id,
                title=b.title,
                slug=b.slug,
                author=b.author,
                publisher=b.publisher,
                description=b.description,
                cover_url=b.cover_url,
                isbn=b.isbn,
                format=b.format,
                original_price=b.original_price,
                sale_price=b.sale_price,
                stock_quantity=b.stock_quantity,
                held_quantity=b.held_quantity,
                available_stock=b.available_stock,
                is_available=b.is_available,
                view_count=b.view_count,
                category_id=b.category_id,
                category_name=b.category.name if b.category else None,
                category_slug=b.category.slug if b.category else None,
            )
            book_items.append(item)

        total_pages = math.ceil(total / limit) if total > 0 else 0

        return PaginatedBooksResponse(
            items=book_items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    @staticmethod
    async def get_book_by_slug(db: AsyncSession, slug: str) -> BookDetailResponse:
        stmt = (
            select(Book)
            .options(selectinload(Book.category))
            .where((Book.slug == slug) & (Book.is_available.is_(True)))
        )
        res = await db.execute(stmt)
        book = res.scalar_one_or_none()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy ấn phẩm sách với slug '{slug}'.",
            )

        book.view_count += 1
        await db.commit()
        await db.refresh(book)

        return BookDetailResponse(
            id=book.id,
            title=book.title,
            slug=book.slug,
            author=book.author,
            publisher=book.publisher,
            description=book.description,
            cover_url=book.cover_url,
            isbn=book.isbn,
            format=book.format,
            original_price=book.original_price,
            sale_price=book.sale_price,
            stock_quantity=book.stock_quantity,
            held_quantity=book.held_quantity,
            available_stock=book.available_stock,
            is_available=book.is_available,
            view_count=book.view_count,
            category_id=book.category_id,
            category_name=book.category.name if book.category else None,
            category_slug=book.category.slug if book.category else None,
        )

    @staticmethod
    async def create_book(db: AsyncSession, req: BookCreate) -> BookDetailResponse:
        slug = req.slug or slugify(req.title)
        stmt = select(Book).where(Book.slug == slug)
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            slug = f"{slug}-{uuid.uuid4().hex[:6]}"

        book = Book(
            category_id=req.category_id,
            title=req.title.strip(),
            slug=slug,
            author=req.author.strip(),
            publisher=req.publisher.strip() if req.publisher else None,
            description=req.description,
            cover_url=req.cover_url,
            isbn=req.isbn.strip() if req.isbn else None,
            format=req.format,
            original_price=req.original_price,
            sale_price=req.sale_price,
            stock_quantity=req.stock_quantity,
            held_quantity=0,
            is_available=req.is_available,
        )
        db.add(book)
        await db.commit()
        await db.refresh(book)
        return await CatalogService.get_book_by_slug(db, book.slug)
