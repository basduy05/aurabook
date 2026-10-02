import asyncio
import logging
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import select, text

from app.core.database import AsyncSessionLocal, engine
from app.core.security import get_password_hash
from app.models import (
    Base,
    Book,
    BookFormat,
    Category,
    User,
    UserRole,
    Voucher,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_db")


async def init_database():
    """Initialize database extensions, tables, and default seed data."""
    logger.info("Initializing database schema and extensions...")
    async with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            try:
                await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                logger.info("Extensions uuid-ossp and vector enabled.")
            except Exception as e:
                logger.warning(f"Could not enable extensions: {e}")
        else:
            logger.info(
                f"Using {engine.dialect.name} dialect; skipping PostgreSQL extension creation."
            )

        await conn.run_sync(Base.metadata.create_all)
        logger.info("All database tables created successfully.")

    async with AsyncSessionLocal() as session:
        # 1. Seed Users
        admin_res = await session.execute(
            select(User).where(User.email == "admin@aurabook.vn")
        )
        if not admin_res.scalar_one_or_none():
            admin = User(
                email="admin@aurabook.vn",
                hashed_password=get_password_hash("Admin@123456"),
                full_name="Quản Trị Viên AuraBook",
                role=UserRole.ADMIN,
                phone_number="0901234567",
                is_active=True,
            )
            reader = User(
                email="reader@aurabook.vn",
                hashed_password=get_password_hash("Reader@123456"),
                full_name="Độc Giả Thử Nghiệm",
                role=UserRole.CUSTOMER,
                phone_number="0987654321",
                is_active=True,
            )
            session.add_all([admin, reader])
            logger.info("Seeded default users (admin@aurabook.vn, reader@aurabook.vn).")

        # 2. Seed Categories
        cat_res = await session.execute(select(Category))
        categories = cat_res.scalars().all()
        if not categories:
            cat_tech = Category(
                name="Công Nghệ & Lập Trình",
                slug="cong-nghe-lap-trinh",
                description="Sách chuyên ngành phát triển phần mềm, trí tuệ nhân tạo và kiến trúc hệ thống.",
            )
            cat_biz = Category(
                name="Kinh Tế & Quản Trị",
                slug="kinh-te-quan-tri",
                description="Sách tư duy chiến lược, tài chính, khởi nghiệp và đổi mới sáng tạo.",
            )
            cat_lit = Category(
                name="Văn Học & Kỹ Năng",
                slug="van-hoc-ky-nang",
                description="Tác phẩm văn học tinh hoa, phát triển bản thân và tư duy phản biện.",
            )
            session.add_all([cat_tech, cat_biz, cat_lit])
            await session.flush()
            logger.info("Seeded default categories.")

            # 3. Seed Books
            book_ai = Book(
                category_id=cat_tech.id,
                title="Thiết Kế Hệ Thống Đa Tác Tử Với AI & RAG",
                slug="thiet-ke-he-thong-da-tac-tu-ai-rag",
                author="AuraBook Lab",
                publisher="NXB Công Nghệ Số",
                description="Cẩm nang toàn diện về kiến trúc Multi-Agent Systems, RAG vector hybrid search và ứng dụng thực tiễn.",
                isbn="978-604-0-12345-1",
                format=BookFormat.BOTH,
                original_price=Decimal("250000.00"),
                sale_price=Decimal("199000.00"),
                stock_quantity=50,
                held_quantity=0,
                is_available=True,
                cover_url="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600",
            )
            book_clean = Book(
                category_id=cat_tech.id,
                title="Clean Architecture: Kiến Trúc Phần Mềm Hiện Đại",
                slug="clean-architecture-kien-truc-phan-mem-hien-dai",
                author="Robert C. Martin",
                publisher="NXB Thông Tin",
                description="Quy chuẩn thiết kế phần mềm sạch, tách rời ranh giới và kiểm thử độc lập.",
                isbn="978-604-0-12345-2",
                format=BookFormat.PHYSICAL,
                original_price=Decimal("320000.00"),
                sale_price=Decimal("275000.00"),
                stock_quantity=30,
                held_quantity=0,
                is_available=True,
                cover_url="https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600",
            )
            book_ebook = Book(
                category_id=cat_lit.id,
                title="Tư Duy Độc Lập Trong Kỷ Nguyên Trí Tuệ Nhân Tạo",
                slug="tu-duy-doc-lap-trong-ky-nguyen-ai",
                author="Nguyễn Văn Minh",
                publisher="NXB Tri Thức",
                description="Phát triển năng lực tư duy phản biện và khả năng hợp tác người - máy.",
                isbn="978-604-0-12345-3",
                format=BookFormat.EBOOK,
                original_price=Decimal("120000.00"),
                sale_price=Decimal("89000.00"),
                stock_quantity=9999,
                held_quantity=0,
                is_available=True,
                cover_url="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600",
            )
            session.add_all([book_ai, book_clean, book_ebook])

            # 4. Seed Voucher
            voucher = Voucher(
                code="AURA2026",
                discount_percent=15,
                min_order_value=Decimal("150000.00"),
                max_discount=Decimal("50000.00"),
                valid_from=datetime.now(UTC) - timedelta(days=1),
                valid_to=datetime.now(UTC) + timedelta(days=365),
                usage_limit=500,
                used_count=0,
                is_active=True,
            )
            session.add(voucher)
            logger.info("Seeded default books and vouchers.")

        await session.commit()
        logger.info("Database initialization completed successfully.")


if __name__ == "__main__":
    asyncio.run(init_database())
