import math
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit import AuditLog
from app.models.catalog import Book
from app.models.order import Order, OrderItem, OrderStatus, PaymentStatus
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminUserItem,
    AdminUserListResponse,
    AdminVoucherItem,
    AdminVoucherCreateRequest,
    AdminDrmLicenseItem,
    AdminDrmListResponse,
    AdminReviewItem,
    AdminReviewListResponse,
    AdminBookCreateRequest,
    AdminBookDetailResponse,
    AdminBookUpdateRequest,
    AdminDashboardMetricsResponse,
    AdminOrderDetailResponse,
    AdminOrderItemDetail,
    AdminOrderListItemResponse,
    AdminOrderListResponse,
    AdminOrderStatusUpdateRequest,
    AdminPaginatedBooksResponse,
    AdminPaymentDetail,
    AdminStockUpdateRequest,
    DailyRevenueItem,
    LowStockAlertItem,
    TopSellingBookItem,
)
from app.services.catalog_service import slugify


class AdminService:
    # =========================================================================
    # UC12: Dashboard Metrics & Real-time Business Analytics
    # =========================================================================
    @staticmethod
    async def get_dashboard_metrics(db: AsyncSession) -> AdminDashboardMetricsResponse:
        # Total Revenue from PAID / COMPLETED / SHIPPED orders
        rev_stmt = select(func.coalesce(func.sum(Order.final_amount), Decimal("0.00"))).where(
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.SHIPPED])
        )
        total_rev_res = await db.execute(rev_stmt)
        total_revenue = total_rev_res.scalar_one()

        # Today's Revenue
        today_start = datetime.now(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
        today_stmt = select(func.coalesce(func.sum(Order.final_amount), Decimal("0.00"))).where(
            Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.SHIPPED]),
            Order.created_at >= today_start,
        )
        today_rev_res = await db.execute(today_stmt)
        today_revenue = today_rev_res.scalar_one()

        # Total Orders & Paid Orders
        total_orders_res = await db.execute(select(func.count(Order.id)))
        total_orders = total_orders_res.scalar_one()

        paid_orders_res = await db.execute(
            select(func.count(Order.id)).where(
                Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.SHIPPED])
            )
        )
        paid_orders_count = paid_orders_res.scalar_one()
        conversion_rate = (
            round((paid_orders_count / total_orders) * 100.0, 2)
            if total_orders > 0
            else 0.0
        )

        # Total Customers & Books
        cust_res = await db.execute(
            select(func.count(User.id)).where(User.role == UserRole.CUSTOMER)
        )
        total_customers = cust_res.scalar_one()

        books_res = await db.execute(select(func.count(Book.id)))
        total_books = books_res.scalar_one()

        # Last 7 Days Daily Revenue
        revenue_by_day: list[DailyRevenueItem] = []
        for i in range(6, -1, -1):
            day_target = today_start - timedelta(days=i)
            day_next = day_target + timedelta(days=1)
            day_stmt = select(
                func.coalesce(func.sum(Order.final_amount), Decimal("0.00")),
                func.count(Order.id),
            ).where(
                Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.SHIPPED]),
                Order.created_at >= day_target,
                Order.created_at < day_next,
            )
            d_res = await db.execute(day_stmt)
            d_rev, d_cnt = d_res.one()
            revenue_by_day.append(
                DailyRevenueItem(
                    date=day_target.strftime("%Y-%m-%d"),
                    revenue=d_rev,
                    orders_count=d_cnt,
                )
            )

        # Top 5 Selling Books
        top_stmt = (
            select(
                Book.id,
                Book.title,
                Book.author,
                Book.cover_url,
                func.coalesce(func.sum(OrderItem.quantity), 0).label("units_sold"),
                func.coalesce(func.sum(OrderItem.subtotal), Decimal("0.00")).label("total_rev"),
            )
            .join(OrderItem, OrderItem.book_id == Book.id)
            .join(Order, Order.id == OrderItem.order_id)
            .where(Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED, OrderStatus.SHIPPED]))
            .group_by(Book.id)
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(5)
        )
        top_res = await db.execute(top_stmt)
        top_selling: list[TopSellingBookItem] = [
            TopSellingBookItem(
                book_id=row[0],
                title=row[1],
                author=row[2],
                cover_url=row[3],
                units_sold=row[4],
                total_revenue=row[5],
            )
            for row in top_res.all()
        ]

        # Low Stock Alerts (stock_quantity <= 5)
        alert_stmt = (
            select(Book)
            .where(Book.is_available.is_(True), Book.stock_quantity <= 5)
            .order_by(Book.stock_quantity.asc())
            .limit(10)
        )
        alert_res = await db.execute(alert_stmt)
        low_stock_alerts: list[LowStockAlertItem] = [
            LowStockAlertItem(
                book_id=b.id,
                title=b.title,
                stock_quantity=b.stock_quantity,
                held_quantity=b.held_quantity,
                available_stock=b.available_stock,
            )
            for b in alert_res.scalars().all()
        ]

        return AdminDashboardMetricsResponse(
            total_revenue=total_revenue,
            today_revenue=today_revenue,
            total_orders=total_orders,
            paid_orders_count=paid_orders_count,
            conversion_rate=conversion_rate,
            total_customers=total_customers,
            total_books=total_books,
            revenue_by_day=revenue_by_day,
            top_selling_books=top_selling,
            low_stock_alerts=low_stock_alerts,
        )

    # =========================================================================
    # UC11: Admin Order Lifecycle Management
    # =========================================================================
    @staticmethod
    async def list_orders(
        db: AsyncSession,
        status_filter: OrderStatus | None = None,
        search: str | None = None,
        page: int = 1,
        limit: int = 15,
    ) -> AdminOrderListResponse:
        page = max(1, page)
        limit = min(max(1, limit), 50)
        offset = (page - 1) * limit

        query = select(Order).options(selectinload(Order.user), selectinload(Order.items))
        count_query = select(func.count(Order.id))

        if status_filter:
            query = query.where(Order.status == status_filter)
            count_query = count_query.where(Order.status == status_filter)

        if search:
            s_pat = f"%{search.strip()}%"
            query = query.join(User, User.id == Order.user_id).where(
                (Order.order_code.ilike(s_pat))
                | (User.full_name.ilike(s_pat))
                | (User.email.ilike(s_pat))
            )
            count_query = count_query.join(User, User.id == Order.user_id).where(
                (Order.order_code.ilike(s_pat))
                | (User.full_name.ilike(s_pat))
                | (User.email.ilike(s_pat))
            )

        total_res = await db.execute(count_query)
        total = total_res.scalar_one()

        query = query.order_by(Order.created_at.desc()).offset(offset).limit(limit)
        orders_res = await db.execute(query)
        orders = orders_res.scalars().all()

        items = [
            AdminOrderListItemResponse(
                id=o.id,
                order_code=o.order_code,
                user_id=o.user_id,
                customer_name=o.user.full_name if o.user else "Khách hàng",
                customer_email=o.user.email if o.user else "",
                total_amount=o.total_amount,
                discount_amount=o.discount_amount,
                final_amount=o.final_amount,
                status=o.status,
                payment_status=o.payment_status,
                items_count=len(o.items),
                created_at=o.created_at,
            )
            for o in orders
        ]

        total_pages = math.ceil(total / limit) if total > 0 else 0
        return AdminOrderListResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    @staticmethod
    async def get_order_detail(db: AsyncSession, order_id: uuid.UUID) -> AdminOrderDetailResponse:
        stmt = (
            select(Order)
            .options(
                selectinload(Order.user),
                selectinload(Order.items).selectinload(OrderItem.book),
                selectinload(Order.payments),
            )
            .where(Order.id == order_id)
        )
        res = await db.execute(stmt)
        order = res.scalar_one_or_none()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đơn hàng yêu cầu.",
            )

        items_detail = [
            AdminOrderItemDetail(
                id=item.id,
                book_id=item.book_id,
                book_title=item.book.title if item.book else "Sách đã gỡ",
                book_cover_url=item.book.cover_url if item.book else None,
                format=item.format,
                unit_price=item.unit_price,
                quantity=item.quantity,
                subtotal=item.subtotal,
            )
            for item in order.items
        ]

        payments_detail = [
            AdminPaymentDetail(
                id=p.id,
                provider=p.provider,
                amount=p.amount,
                status=p.status,
                transaction_code=p.transaction_code,
                created_at=p.created_at,
            )
            for p in order.payments
        ]

        return AdminOrderDetailResponse(
            id=order.id,
            order_code=order.order_code,
            user_id=order.user_id,
            customer_name=order.user.full_name if order.user else "Khách hàng",
            customer_email=order.user.email if order.user else "",
            total_amount=order.total_amount,
            discount_amount=order.discount_amount,
            final_amount=order.final_amount,
            status=order.status,
            payment_status=order.payment_status,
            items_count=len(order.items),
            created_at=order.created_at,
            shipping_address=order.shipping_address,
            paid_at=order.paid_at,
            items=items_detail,
            payments=payments_detail,
        )

    @staticmethod
    async def update_order_status(
        db: AsyncSession,
        current_user: User,
        order_id: uuid.UUID,
        req: AdminOrderStatusUpdateRequest,
    ) -> AdminOrderDetailResponse:
        stmt = (
            select(Order)
            .options(selectinload(Order.items).selectinload(OrderItem.book))
            .where(Order.id == order_id)
        )
        res = await db.execute(stmt)
        order = res.scalar_one_or_none()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy đơn hàng cần cập nhật.",
            )

        old_status = order.status
        new_status = req.status

        # If transitioning to CANCELLED from active status, restore book stocks
        if new_status == OrderStatus.CANCELLED and old_status != OrderStatus.CANCELLED:
            for it in order.items:
                if it.book:
                    it.book.stock_quantity += it.quantity

        order.status = new_status
        if new_status == OrderStatus.PAID and not order.paid_at:
            order.paid_at = datetime.now(UTC)
            order.payment_status = PaymentStatus.PAID

        # Audit log recording
        audit = AuditLog(
            user_id=current_user.id,
            action="ADMIN_UPDATE_ORDER_STATUS",
            entity_type="ORDER",
            entity_id=str(order.id),
            details={
                "order_code": order.order_code,
                "old_status": old_status.value,
                "new_status": new_status.value,
                "note": req.note,
                "admin_email": current_user.email,
            },
        )
        db.add(audit)

        await db.commit()
        return await AdminService.get_order_detail(db, order.id)

    # =========================================================================
    # UC09: Admin Catalog Management (CRUD & Stock Adjustments)
    # =========================================================================
    @staticmethod
    async def list_books_admin(
        db: AsyncSession,
        search: str | None = None,
        category_id: uuid.UUID | None = None,
        page: int = 1,
        limit: int = 15,
    ) -> AdminPaginatedBooksResponse:
        page = max(1, page)
        limit = min(max(1, limit), 50)
        offset = (page - 1) * limit

        query = select(Book).options(selectinload(Book.category))
        count_query = select(func.count(Book.id))

        if category_id:
            query = query.where(Book.category_id == category_id)
            count_query = count_query.where(Book.category_id == category_id)

        if search:
            s_pat = f"%{search.strip()}%"
            query = query.where(
                (Book.title.ilike(s_pat))
                | (Book.author.ilike(s_pat))
                | (Book.isbn.ilike(s_pat))
            )
            count_query = count_query.where(
                (Book.title.ilike(s_pat))
                | (Book.author.ilike(s_pat))
                | (Book.isbn.ilike(s_pat))
            )

        total_res = await db.execute(count_query)
        total = total_res.scalar_one()

        query = query.order_by(Book.created_at.desc()).offset(offset).limit(limit)
        books_res = await db.execute(query)
        books = books_res.scalars().all()

        items = [
            AdminBookDetailResponse(
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
                average_rating=b.average_rating,
                total_reviews=b.total_reviews,
                category_id=b.category_id,
                category_name=b.category.name if b.category else None,
                category_slug=b.category.slug if b.category else None,
                created_at=b.created_at,
            )
            for b in books
        ]

        total_pages = math.ceil(total / limit) if total > 0 else 0
        return AdminPaginatedBooksResponse(
            items=items,
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages,
        )

    @staticmethod
    async def create_book_admin(
        db: AsyncSession,
        current_user: User,
        req: AdminBookCreateRequest,
    ) -> AdminBookDetailResponse:
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
        await db.flush()

        audit = AuditLog(
            user_id=current_user.id,
            action="ADMIN_CREATE_BOOK",
            entity_type="BOOK",
            entity_id=str(book.id),
            details={"title": book.title, "slug": book.slug, "isbn": book.isbn},
        )
        db.add(audit)
        await db.commit()
        await db.refresh(book)

        # Reload with category
        fetch_stmt = (
            select(Book).options(selectinload(Book.category)).where(Book.id == book.id)
        )
        b_res = await db.execute(fetch_stmt)
        b_loaded = b_res.scalar_one()

        return AdminBookDetailResponse(
            id=b_loaded.id,
            title=b_loaded.title,
            slug=b_loaded.slug,
            author=b_loaded.author,
            publisher=b_loaded.publisher,
            description=b_loaded.description,
            cover_url=b_loaded.cover_url,
            isbn=b_loaded.isbn,
            format=b_loaded.format,
            original_price=b_loaded.original_price,
            sale_price=b_loaded.sale_price,
            stock_quantity=b_loaded.stock_quantity,
            held_quantity=b_loaded.held_quantity,
            available_stock=b_loaded.available_stock,
            is_available=b_loaded.is_available,
            view_count=b_loaded.view_count,
            average_rating=b_loaded.average_rating,
            total_reviews=b_loaded.total_reviews,
            category_id=b_loaded.category_id,
            category_name=b_loaded.category.name if b_loaded.category else None,
            category_slug=b_loaded.category.slug if b_loaded.category else None,
            created_at=b_loaded.created_at,
        )

    @staticmethod
    async def update_book_admin(
        db: AsyncSession,
        current_user: User,
        book_id: uuid.UUID,
        req: AdminBookUpdateRequest,
    ) -> AdminBookDetailResponse:
        stmt = (
            select(Book).options(selectinload(Book.category)).where(Book.id == book_id)
        )
        res = await db.execute(stmt)
        book = res.scalar_one_or_none()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sách để cập nhật.",
            )

        if req.category_id is not None:
            book.category_id = req.category_id
        if req.title is not None:
            book.title = req.title.strip()
        if req.author is not None:
            book.author = req.author.strip()
        if req.publisher is not None:
            book.publisher = req.publisher.strip()
        if req.description is not None:
            book.description = req.description
        if req.cover_url is not None:
            book.cover_url = req.cover_url
        if req.isbn is not None:
            book.isbn = req.isbn.strip()
        if req.format is not None:
            book.format = req.format
        if req.original_price is not None:
            book.original_price = req.original_price
        if req.sale_price is not None:
            book.sale_price = req.sale_price
        if req.stock_quantity is not None:
            book.stock_quantity = req.stock_quantity
        if req.is_available is not None:
            book.is_available = req.is_available

        audit = AuditLog(
            user_id=current_user.id,
            action="ADMIN_UPDATE_BOOK",
            entity_type="BOOK",
            entity_id=str(book.id),
            details={"title": book.title, "admin": current_user.email},
        )
        db.add(audit)
        await db.commit()
        await db.refresh(book)

        return AdminBookDetailResponse(
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
            average_rating=book.average_rating,
            total_reviews=book.total_reviews,
            category_id=book.category_id,
            category_name=book.category.name if book.category else None,
            category_slug=book.category.slug if book.category else None,
            created_at=book.created_at,
        )

    @staticmethod
    async def adjust_stock_admin(
        db: AsyncSession,
        current_user: User,
        book_id: uuid.UUID,
        req: AdminStockUpdateRequest,
    ) -> AdminBookDetailResponse:
        stmt = (
            select(Book).options(selectinload(Book.category)).where(Book.id == book_id)
        )
        res = await db.execute(stmt)
        book = res.scalar_one_or_none()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sách để điều chỉnh kho.",
            )

        old_stock = book.stock_quantity
        new_stock = old_stock + req.stock_delta
        if new_stock < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Số lượng xuất kho vượt quá tồn kho khả dụng ({old_stock}).",
            )

        book.stock_quantity = new_stock

        audit = AuditLog(
            user_id=current_user.id,
            action="ADMIN_ADJUST_STOCK",
            entity_type="BOOK",
            entity_id=str(book.id),
            details={
                "old_stock": old_stock,
                "new_stock": new_stock,
                "delta": req.stock_delta,
                "reason": req.reason,
            },
        )
        db.add(audit)
        await db.commit()
        await db.refresh(book)

        return AdminBookDetailResponse(
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
            average_rating=book.average_rating,
            total_reviews=book.total_reviews,
            category_id=book.category_id,
            category_name=book.category.name if book.category else None,
            category_slug=book.category.slug if book.category else None,
            created_at=book.created_at,
        )

    @staticmethod
    async def delete_book_admin(
        db: AsyncSession,
        current_user: User,
        book_id: uuid.UUID,
    ) -> dict[str, str]:
        stmt = select(Book).where(Book.id == book_id)
        res = await db.execute(stmt)
        book = res.scalar_one_or_none()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Không tìm thấy sách để xóa.",
            )

        book.is_available = False
        audit = AuditLog(
            user_id=current_user.id,
            action="ADMIN_SOFT_DELETE_BOOK",
            entity_type="BOOK",
            entity_id=str(book.id),
            details={"title": book.title, "admin": current_user.email},
        )
        db.add(audit)
        await db.commit()
        return {"message": f"Đã ẩn ấn phẩm sách '{book.title}' khỏi danh mục hiển thị."}

    # =========================================================================
    # Advanced Admin Control Methods (Users, Vouchers, DRM, Reviews)
    # =========================================================================
    @staticmethod
    async def list_users(
        db: AsyncSession,
        search: str | None = None,
        role: str | None = None,
    ) -> AdminUserListResponse:
        stmt = select(User)
        if search:
            stmt = stmt.where(User.email.ilike(f"%{search}%") | User.full_name.ilike(f"%{search}%"))
        if role:
            stmt = stmt.where(User.role == role)
        stmt = stmt.order_by(User.created_at.desc())
        
        result = await db.execute(stmt)
        users = result.scalars().all()
        
        items = [
            AdminUserItem(
                id=u.id,
                email=u.email,
                full_name=u.full_name,
                phone_number=u.phone_number,
                role=u.role.value if hasattr(u.role, "value") else str(u.role),
                is_active=u.is_active,
                created_at=u.created_at,
            )
            for u in users
        ]
        return AdminUserListResponse(items=items, total=len(items))

    @staticmethod
    async def toggle_user_status(db: AsyncSession, user_id: uuid.UUID) -> dict[str, str]:
        user = await db.get(User, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Người dùng không tồn tại.")
        user.is_active = not user.is_active
        await db.commit()
        return {"message": f"Đã {'mở khóa' if user.is_active else 'khóa'} tài khoản {user.email}"}

    @staticmethod
    async def list_vouchers(db: AsyncSession) -> list[AdminVoucherItem]:
        from app.models.order import Voucher
        stmt = select(Voucher).order_by(Voucher.created_at.desc())
        result = await db.execute(stmt)
        vouchers = result.scalars().all()
        return [
            AdminVoucherItem(
                id=v.id,
                code=v.code,
                discount_percent=v.discount_percent,
                min_order_value=v.min_order_value,
                max_discount=v.max_discount,
                usage_limit=v.usage_limit,
                used_count=v.used_count,
                is_active=v.is_active,
                valid_from=v.valid_from,
                valid_to=v.valid_to,
            )
            for v in vouchers
        ]

    @staticmethod
    async def create_voucher(db: AsyncSession, req: AdminVoucherCreateRequest) -> AdminVoucherItem:
        from app.models.order import Voucher
        # Check duplicate
        exists = await db.execute(select(Voucher).where(Voucher.code == req.code.upper()))
        if exists.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Mã voucher này đã tồn tại.")
        
        now = datetime.now(UTC)
        v = Voucher(
            id=uuid.uuid4(),
            code=req.code.upper(),
            discount_percent=req.discount_percent,
            min_order_value=req.min_order_value,
            max_discount=req.max_discount,
            usage_limit=req.usage_limit,
            used_count=0,
            is_active=True,
            valid_from=now,
            valid_to=now + timedelta(days=req.days_valid),
        )
        db.add(v)
        await db.commit()
        await db.refresh(v)
        return AdminVoucherItem(
            id=v.id,
            code=v.code,
            discount_percent=v.discount_percent,
            min_order_value=v.min_order_value,
            max_discount=v.max_discount,
            usage_limit=v.usage_limit,
            used_count=v.used_count,
            is_active=v.is_active,
            valid_from=v.valid_from,
            valid_to=v.valid_to,
        )

    @staticmethod
    async def toggle_voucher(db: AsyncSession, voucher_id: uuid.UUID) -> dict[str, str]:
        from app.models.order import Voucher
        v = await db.get(Voucher, voucher_id)
        if not v:
            raise HTTPException(status_code=404, detail="Voucher không tồn tại.")
        v.is_active = not v.is_active
        await db.commit()
        return {"message": f"Đã {'kích hoạt' if v.is_active else 'vô hiệu hóa'} voucher {v.code}"}

    @staticmethod
    async def list_drm_licenses(db: AsyncSession) -> AdminDrmListResponse:
        from app.models.ebook import EbookAccess, ReadingProgress
        stmt = (
            select(EbookAccess)
            .options(selectinload(EbookAccess.user), selectinload(EbookAccess.book))
            .order_by(EbookAccess.granted_at.desc())
        )
        res = await db.execute(stmt)
        accesses = res.scalars().all()
        
        items = []
        for a in accesses:
            # Query reading progress
            prog_res = await db.execute(
                select(ReadingProgress).where(
                    ReadingProgress.user_id == a.user_id,
                    ReadingProgress.book_id == a.book_id,
                )
            )
            prog = prog_res.scalar_one_or_none()
            items.append(
                AdminDrmLicenseItem(
                    id=a.id,
                    user_email=a.user.email if a.user else "N/A",
                    user_name=a.user.full_name if a.user else "N/A",
                    book_title=a.book.title if a.book else "N/A",
                    book_id=a.book_id,
                    granted_at=a.granted_at,
                    is_active=a.is_active,
                    current_page=prog.current_page if prog else 1,
                    total_pages=prog.total_pages if prog else 1,
                    progress_percent=prog.progress_percent if prog else 0.0,
                )
            )
        return AdminDrmListResponse(items=items, total=len(items))

    @staticmethod
    async def revoke_drm_license(db: AsyncSession, license_id: uuid.UUID) -> dict[str, str]:
        from app.models.ebook import EbookAccess
        lic = await db.get(EbookAccess, license_id)
        if not lic:
            raise HTTPException(status_code=404, detail="Bản quyền không tồn tại.")
        lic.is_active = not lic.is_active
        await db.commit()
        return {"message": f"Đã {'kích hoạt lại' if lic.is_active else 'thu hồi'} bản quyền số"}

    @staticmethod
    async def list_reviews(db: AsyncSession) -> AdminReviewListResponse:
        from app.models import Review
        stmt = (
            select(Review)
            .options(selectinload(Review.user), selectinload(Review.book))
            .order_by(Review.created_at.desc())
        )
        res = await db.execute(stmt)
        reviews = res.scalars().all()
        items = [
            AdminReviewItem(
                id=r.id,
                user_name=r.user.full_name if r.user else "Khách hàng",
                user_email=r.user.email if r.user else "N/A",
                book_title=r.book.title if r.book else "N/A",
                rating=r.rating,
                comment=r.comment,
                created_at=r.created_at,
            )
            for r in reviews
        ]
        return AdminReviewListResponse(items=items, total=len(items))

    @staticmethod
    async def delete_review(db: AsyncSession, review_id: uuid.UUID) -> dict[str, str]:
        from app.models import Review
        rev = await db.get(Review, review_id)
        if not rev:
            raise HTTPException(status_code=404, detail="Đánh giá không tồn tại.")
        await db.delete(rev)
        await db.commit()
        return {"message": "Đã xóa đánh giá thành công"}
