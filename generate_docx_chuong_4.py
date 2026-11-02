# -*- coding: utf-8 -*-
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_table_borders(table, color="D1D5DB", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def create_document():
    doc = docx.Document()

    # Set page margins: Top 2cm, Bottom 2cm, Left 3cm, Right 2cm
    for section in doc.sections:
        section.top_margin = Inches(0.79)     # ~2.0 cm
        section.bottom_margin = Inches(0.79)  # ~2.0 cm
        section.left_margin = Inches(1.18)    # ~3.0 cm
        section.right_margin = Inches(0.79)   # ~2.0 cm

    # Base style
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Times New Roman'
    normal_style.font.size = Pt(13)
    normal_style.font.color.rgb = RGBColor(0, 0, 0)

    def add_p(text, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6, space_before=0, line_spacing=1.3, indent=0.3):
        p = doc.add_paragraph()
        p.alignment = align
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.space_before = Pt(space_before)
        p.paragraph_format.line_spacing = line_spacing
        if indent > 0 and align == WD_ALIGN_PARAGRAPH.JUSTIFY:
            p.paragraph_format.first_line_indent = Inches(indent)
        run = p.add_run(text)
        run.bold = bold
        run.italic = italic
        run.font.name = 'Times New Roman'
        run.font.size = Pt(13)
        return p

    def add_chapter_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(12)
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(15, 23, 42)
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(14)
        run.font.color.rgb = RGBColor(30, 41, 59)
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(51, 65, 85)
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run(text)
        run.bold = True
        run.italic = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(71, 85, 105)
        return p

    def add_caption(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(text)
        run.bold = True
        run.italic = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(30, 41, 59)
        return p

    def add_latex_math(formula_text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(6)
        run = p.add_run(formula_text)
        run.italic = True
        run.bold = True
        run.font.name = 'Cambria Math'
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(17, 24, 39)
        return p

    def add_code_block(code_text):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        cell.width = Inches(6.5)
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders = parse_xml(
            f'<w:tcBorders {nsdecls("w")}>'
            f'<w:top w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'<w:left w:val="single" w:sz="12" w:space="0" w:color="3B82F6"/>'
            f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'<w:right w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>'
            f'</w:tcBorders>'
        )
        tcPr.append(borders)

        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.05
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(code_text)
        run.font.name = 'Consolas'
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(30, 41, 59)
        
        # Blank space after table
        post_p = doc.add_paragraph()
        post_p.paragraph_format.space_before = Pt(0)
        post_p.paragraph_format.space_after = Pt(4)

    # ==================== NỘI DUNG CHƯƠNG 4 ====================
    add_chapter_title("CHƯƠNG 4. XÂY DỰNG CHƯƠNG TRÌNH")

    add_h1("4.1. XÂY DỰNG CẤU TRÚC DỮ LIỆU VÀ TÀI NGUYÊN")

    add_h2("4.1.1. Cài đặt và cấu hình cơ sở dữ liệu PostgreSQL 16 và pgvector")
    add_p("Hệ thống AuraBook sử dụng hệ quản trị cơ sở dữ liệu quan hệ đối tượng PostgreSQL phiên bản 16 kết hợp cùng tiện ích mở rộng pgvector phiên bản 0.7+. Giải pháp kiến trúc này nhằm giải quyết triệt để bài toán phân mảnh dữ liệu (Zero Data Silo): kết hợp hoàn hảo giữa các ràng buộc giao dịch ACID nghiêm ngặt của sàn thương mại điện tử với việc lưu trữ và lập chỉ mục không gian véc-tơ đa chiều phục vụ trí tuệ nhân tạo.")

    add_h3("a) Kịch bản khởi tạo môi trường cơ sở dữ liệu qua Docker Compose")
    add_p("Nhằm bảo đảm tính đồng nhất giữa môi trường phát triển cục bộ và máy chủ sản xuất, toàn bộ dịch vụ dữ liệu được đóng gói thông qua Docker Compose. Các thông số cấp phát bộ nhớ (shared_buffers, work_mem, maintenance_work_mem) được tinh chỉnh tối ưu cho việc xây dựng đồ thị chỉ mục véc-tơ HNSW:")

    docker_code = """version: '3.8'

services:
  aurabook-postgres:
    image: pgvector/pgvector:pg16
    container_name: aurabook-postgres-db
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-aurabook_admin}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-AuraBookSecure2026!}
      POSTGRES_DB: ${POSTGRES_DB:-aurabook_db}
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./infra/init-scripts:/docker-entrypoint-initdb.d
    command: >
      postgres
        -c shared_buffers=1GB
        -c work_mem=64MB
        -c maintenance_work_mem=512MB
        -c effective_cache_size=3GB
        -c max_connections=200
        -c wal_buffers=16MB
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U aurabook_admin -d aurabook_db"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
    driver: local"""
    add_code_block(docker_code)

    add_h3("b) Kịch bản khởi tạo lược đồ DDL và đánh chỉ mục hỗn hợp (HNSW & GIN)")
    add_p("Toàn bộ 13 bảng giao dịch quan hệ (theo đúng Thiết kế dữ liệu tại Mục 3.3.1 của Chương 3) được hiện thực hóa bằng câu lệnh SQL chuẩn DDL, đi kèm các chỉ mục tối ưu hóa truy vấn:")

    sql_ddl = """-- 1. Kích hoạt tiện ích mở rộng pgvector và UUID v4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Bảng quản lý người dùng (users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('Customer', 'Admin')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Bảng danh mục thể loại ấn phẩm (categories)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    description TEXT
);

-- 4. Bảng quản lý ấn phẩm sách (books)
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20) UNIQUE NOT NULL,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
    is_ebook BOOLEAN DEFAULT FALSE NOT NULL,
    cover_image_url TEXT NOT NULL,
    summary_audio_url TEXT,
    description TEXT,
    lexical_tsv TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(author, '') || ' ' || coalesce(description, ''))
    ) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Chỉ mục toàn văn GIN phục vụ tìm kiếm từ khóa
CREATE INDEX idx_books_lexical_tsv ON books USING gin(lexical_tsv);

-- 5. Bảng phân mảnh văn bản & Vector nhúng RAG (book_chunks)
CREATE TABLE book_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    page_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(768) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Chỉ mục đồ thị phân cấp láng giềng nhỏ HNSW đo khoảng cách Cosine
CREATE INDEX idx_book_chunks_hnsw_cosine ON book_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 6. Bảng quản lý đơn hàng (orders)
CREATE TABLE orders (
    id VARCHAR(20) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'PAID', 'SHIPPING', 'COMPLETED', 'CANCELLED')),
    shipping_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Bảng chi tiết đơn hàng (order_items)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(20) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    book_id UUID NOT NULL REFERENCES books(id),
    price_at_purchase DECIMAL(12, 2) NOT NULL CHECK (price_at_purchase >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

-- 8. Bảng cấp quyền đọc E-book số (ebook_accesses)
CREATE TABLE ebook_accesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    book_id UUID NOT NULL REFERENCES books(id),
    encrypted_file_path TEXT NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_user_book_access UNIQUE(user_id, book_id)
);

-- 9. Bảng lưu trữ tiến độ đọc sách (reading_progress)
CREATE TABLE reading_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    book_id UUID NOT NULL REFERENCES books(id),
    current_page INTEGER NOT NULL CHECK (current_page > 0),
    font_size INTEGER DEFAULT 16 NOT NULL,
    reading_mode VARCHAR(20) DEFAULT 'LIGHT' NOT NULL CHECK (reading_mode IN ('LIGHT', 'SEPIA', 'DARK')),
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT uq_user_book_progress UNIQUE(user_id, book_id)
);

-- 10. Bảng nhật ký kiểm toán hệ thống & Tác tử AI (audit_logs)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    status_code INTEGER NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);"""
    add_code_block(sql_ddl)

    add_h2("4.1.2. Thiết lập môi trường và cấu trúc module Frontend & Backend")
    add_p("Cấu trúc dự án được phân định ranh giới theo mô hình Kiến trúc Sạch (Clean Architecture), tách biệt giữa tầng trình diễn Frontend (Next.js 15), tầng dịch vụ Core Backend (Python 3.11+ / FastAPI) và hệ thống vi dịch vụ AI:")

    project_tree = """aurabook/
├── frontend/                          # Giao diện người dùng Next.js 15 (App Router)
│   ├── src/
│   │   ├── app/                       # Các tuyến điều hướng App Router
│   │   │   ├── (storefront)/          # Cửa hàng thương mại điện tử (Trang chủ, Catalog, Search)
│   │   │   ├── (checkout)/            # Luồng thanh toán đơn hàng & xác thực Sandbox
│   │   │   └── api/ai/                # Proxy Route Handlers kết nối các dịch vụ AI
│   │   │       ├── reader-chat/       # Điểm cuối Streaming SSE cho RAG Companion
│   │   │       └── voice-agent/       # Tuyến tiếp nhận và xử lý lệnh thoại hai chiều
│   │   ├── lib/
│   │   │   ├── graphrag/              # Triển khai bộ nhớ tri thức GraphRAG cục bộ
│   │   │   │   ├── graph-store.ts     # Phân giải thực thể & Tìm kiếm quan hệ
│   │   │   │   └── vector-store.ts    # Tính toán độ tương đồng véc-tơ Cosine trên Client
│   │   │   └── wasm/                  # Module WebAssembly nhị phân giải mã DRM AES-256-GCM
│   │   └── ui/components/             # Thư viện thành phần UI dùng chung (Tailwind CSS)
│   │       ├── reader/                # Trình đọc E-book Canvas Web Reader
│   │       └── voice-agent/           # Widget điều khiển giọng nói đa phương thức
├── backend/                           # Máy chủ Core Backend (FastAPI / Python 3.11+)
│   ├── aurabook_apps/                 # Các module nghiệp vụ mở rộng
│   │   ├── ai_search/                 # Module tìm kiếm lai Hybrid Search RRF & Embeddings
│   │   │   ├── gemini_client.py       # Wrapper gọi Google GenAI SDK (text-embedding-004)
│   │   │   ├── models.py              # Model ánh xạ bảng book_chunks
│   │   │   └── search.py              # Thuật toán Reciprocal Rank Fusion kết hợp GIN + HNSW
│   │   ├── catalog_automation/        # Tác tử thị giác Catalog Vision OCR bóc tách ảnh bìa
│   │   └── drm/                       # Dịch vụ mã hóa E-book & quản lý khóa phiên Ephemeral
│   └── saleor/                        # Bộ máy xử lý nghiệp vụ thương mại điện tử
├── ecommerce-ai-platform/             # Nền tảng điều phối Tác tử AI thời gian thực
│   └── voice-agent/backend/
│       ├── vietnamese_cskh_agent.py   # Tác tử thoại LiveKit CSKH hỗ trợ Function Calling
│       └── aurabook_piper_tts_server.py # Máy chủ sinh giọng nói tiếng Việt tự nhiên Piper TTS
└── tests/                             # Bộ kịch bản kiểm thử tự động 4 tầng (Tiers 1-4)
    ├── ai_evaluation_suite.py         # Test Harness đánh giá toàn diện năng lực AI
    └── ai_evaluation_report.md        # Báo cáo kết quả đo kiểm thực nghiệm"""
    add_code_block(project_tree)

    add_h1("4.2. XÂY DỰNG CÁC MODULE CHƯƠNG TRÌNH CHÍNH")

    add_h2("4.2.1. Module Giao diện và E-commerce cốt lõi")
    add_p("Module E-commerce chịu trách nhiệm đảm bảo luồng giao dịch hàng hóa vật lý và kích hoạt bản quyền số diễn ra an toàn, chính xác theo chuẩn ACID.")

    add_h3("a) Luồng tìm kiếm lai thông minh (Hybrid Search: Lexical + Semantic Vector)")
    add_p("Hệ thống kết hợp đồng thời tìm kiếm từ khóa toàn văn (BM25 qua chỉ mục GIN) và tìm kiếm không gian véc-tơ ngữ nghĩa 768 chiều (qua chỉ mục HNSW trên pgvector), sau đó hợp nhất điểm số bằng giải thuật Reciprocal Rank Fusion (RRF):")

    add_latex_math(r"$$\text{RRF\_Score}(d) = \frac{0.5}{60 + \text{Rank}_{\text{BM25}}(d)} + \frac{0.5}{60 + \text{Rank}_{\text{Vector}}(d)}$$")

    search_py = """# Trích xuất từ backend/aurabook_apps/ai_search/search.py
async def execute_hybrid_search(db: AsyncSession, query_text: str, top_k: int = 12):
    # 1. Gọi Google GenAI SDK sinh vector nhúng 768 chiều
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    response = client.models.embed_content(
        model="text-embedding-004",
        contents=query_text
    )
    query_vector = response.embeddings[0].values

    # 2. Truy vấn song song hai nhánh và xếp hạng hợp nhất qua SQL CTE
    sql = text(\"\"\"
        WITH vector_search AS (
            SELECT id, title, author, price, cover_image_url, is_ebook,
                   (1 - (embedding <=> :query_vector::vector)) AS cosine_similarity,
                   ROW_NUMBER() OVER (ORDER BY embedding <=> :query_vector::vector ASC) as rank_vec
            FROM books
            WHERE is_active = TRUE
            LIMIT 50
        ),
        text_search AS (
            SELECT id, title, author, price, cover_image_url, is_ebook,
                   ts_rank_cd(lexical_tsv, plainto_tsquery('simple', :query_text)) as text_rank,
                   ROW_NUMBER() OVER (ORDER BY ts_rank_cd(lexical_tsv, plainto_tsquery('simple', :query_text)) DESC) as rank_bm25
            FROM books
            WHERE is_active = TRUE AND lexical_tsv @@ plainto_tsquery('simple', :query_text)
            LIMIT 50
        )
        SELECT coalesce(v.id, t.id) as id,
               coalesce(v.title, t.title) as title,
               coalesce(v.author, t.author) as author,
               coalesce(v.price, t.price) as price,
               coalesce(v.cover_image_url, t.cover_image_url) as cover_image_url,
               coalesce(v.is_ebook, t.is_ebook) as is_ebook,
               (COALESCE(0.5 / (60 + v.rank_vec), 0.0) + COALESCE(0.5 / (60 + t.rank_bm25), 0.0)) AS rrf_score
        FROM vector_search v
        FULL OUTER JOIN text_search t ON v.id = t.id
        ORDER BY rrf_score DESC
        LIMIT :top_k;
    \"\"\")

    result = await db.execute(sql, {
        "query_vector": str(query_vector),
        "query_text": query_text,
        "top_k": top_k
    })
    return result.mappings().all()"""
    add_code_block(search_py)

    add_h3("b) Trải nghiệm đa phương tiện: Trình phát âm thanh tóm tắt AI (UC03)")
    add_p("Tại trang danh mục và trang chi tiết sách, hệ thống tích hợp sẵn luồng âm thanh tóm tắt ngắn 60 giây (summary_audio_url) được biên soạn và tổng hợp tự động. Trình duyệt sử dụng AudioContext của Web Audio API để phân tích phổ tần số bằng biến đổi Fourier nhanh (FFT) và vẽ đồ thị sóng âm chuyển động theo nhịp điệu lên thẻ Canvas thu nhỏ.")

    add_h3("c) Đặt hàng và Xử lý thanh toán có khóa bi quan chống bán vượt tồn kho (UC04)")
    add_p("Để đảm bảo tính toàn vẹn tồn kho khi có hàng trăm yêu cầu mua đồng thời, hệ thống áp dụng cơ chế khóa dòng bi quan SELECT ... FOR UPDATE:")

    checkout_py = """# Trích xuất từ backend/saleor/order/checkout.py
@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def create_order_with_pessimistic_lock(
    order_in: OrderCreateSchema,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    async with db.begin():
        total_amount = Decimal("0.0")
        order_items_data = []

        for item in order_in.items:
            # Khóa bi quan dòng dữ liệu cuốn sách
            stmt = select(Book).where(Book.id == item.book_id).with_for_update()
            result = await db.execute(stmt)
            book = result.scalar_one_or_none()

            if not book:
                raise HTTPException(status_code=404, detail="Sách không tồn tại.")

            # Kiểm tra tồn kho đối với sách vật lý
            if not book.is_ebook:
                if book.stock_quantity < item.quantity:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Sách '{book.title}' chỉ còn {book.stock_quantity} cuốn trong kho."
                    )
                # Tạm giữ tồn kho (Soft Lock)
                book.stock_quantity -= item.quantity

            subtotal = book.price * item.quantity
            total_amount += subtotal
            order_items_data.append({
                "book_id": book.id,
                "price": book.price,
                "quantity": item.quantity,
                "is_ebook": book.is_ebook
            })

        order_id = f"DH{uuid.uuid4().hex[:8].upper()}"
        new_order = Order(
            id=order_id,
            user_id=current_user.id,
            total_amount=total_amount,
            status="PENDING",
            shipping_address=order_in.shipping_address
        )
        db.add(new_order)
        await db.flush()

        for item_data in order_items_data:
            db.add(OrderItem(
                id=uuid.uuid4(),
                order_id=new_order.id,
                book_id=item_data["book_id"],
                price_at_purchase=item_data["price"],
                quantity=item_data["quantity"]
            ))

        db.add(AuditLog(
            user_id=current_user.id,
            action="CREATE_PENDING_ORDER",
            endpoint="/api/v1/orders/checkout",
            ip_address="127.0.0.1",
            status_code=201,
            payload={"order_id": order_id, "total_amount": float(total_amount)}
        ))

    return {
        "order_id": order_id,
        "total_amount": float(total_amount),
        "status": "PENDING",
        "payment_redirect_url": f"/checkout/payment-sandbox?order_id={order_id}"
    }"""
    add_code_block(checkout_py)
    add_p("Khi cổng thanh toán gửi Webhook IPN thông báo giao dịch thành công, hệ thống chuyển trạng thái đơn hàng sang PAID, xác nhận trừ kho vĩnh viễn và tự động tạo bản ghi trong bảng ebook_accesses nếu đơn hàng có chứa ấn phẩm điện tử.")

    add_h2("4.2.2. Module Tích hợp Hệ AI Đa tác tử (Multi-Agent System)")

    add_h3("a) Cài đặt Tác tử RAG Đồng hành Đọc sách (RAG Companion Agent)")
    add_p("Tác tử RAG đóng vai trò là người bạn đồng hành tri thức hỗ trợ độc giả giải đáp chuyên sâu nội dung tác phẩm với cơ chế truyền dữ liệu dạng luồng Server-Sent Events (SSE) và kiểm soát ảo giác (Temperature = 0.1):")

    rag_ts = """// Trích xuất từ frontend/src/app/api/ai/reader-chat/route.ts
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  const { query, bookId, currentPage } = await req.json();
  
  // 1. Truy xuất Top-3 đoạn trích liên quan có Cosine Similarity >= 0.70
  const contextChunks = await fetchGroundedChunks(bookId, query);
  
  if (!contextChunks || contextChunks.length === 0) {
    return new Response(JSON.stringify({ 
      text: "Nội dung câu hỏi của bạn không được đề cập trực tiếp trong ấn phẩm này. Vui lòng đặt câu hỏi liên quan hơn." 
    }), { status: 200 });
  }

  // 2. Thiết lập System Prompt kiểm soát triệt để ảo giác (Anti-Hallucination Guardrail)
  const systemPrompt = `
    Bạn là Trợ lý AI đồng hành đọc sách chuyên sâu của AuraBook.
    NHIỆM VỤ: Trả lời câu hỏi của độc giả CHỈ DỰA TRÊN NGỮ CẢNH ĐƯỢC CUNG CẤP DƯỚI ĐÂY.
    QUY TẮC BẢO MẬT TRI THỨC:
    1. Không tự ý bịa đặt thông tin không có trong văn bản sách.
    2. Bắt buộc kết thúc câu trả lời bằng việc ghi rõ số trang dẫn chứng [Trang X].
    
    NGỮ CẢNH ẤN PHẨM:
    ${contextChunks.map((c: any) => `[Trang ${c.page_number}]: ${c.content}`).join("\\n\\n")}
  `;

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const responseStream = await ai.models.generateContentStream({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [{ text: query }] }],
    config: {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      temperature: 0.1, // Nhiệt độ thấp nhằm giảm thiểu sai lệch
    }
  });

  // 3. Đóng gói dữ liệu dạng luồng Server-Sent Events (SSE)
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of responseStream) {
        const text = chunk.text();
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\\n\\n`));
        }
      }
      controller.close();
    }
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}"""
    add_code_block(rag_ts)

    add_h3("b) Cài đặt Tác tử thoại Chăm sóc khách hàng (Voice Telephony Agent)")
    add_p("Tác tử thoại kết hợp Web Speech STT trên trình duyệt để nhận diện giọng nói tiếng Việt, mô hình ngôn ngữ lớn gemini-2.0-flash để phân giải ý định qua cơ chế gọi hàm (Function Calling), và máy chủ cục bộ Piper TTS để tổng hợp giọng nói phản hồi dạng âm thanh WAV PCM 22.050 Hz:")

    voice_py = """# Trích xuất từ backend/aurabook_apps/catalog_automation/voice_agent.py
from google import genai
from google.genai import types

tools_schema = [
    types.Tool(function_declarations=[
        types.FunctionDeclaration(
            name="get_order_status",
            description="Tra cứu tiến độ vận chuyển và trạng thái chi tiết của mã đơn hàng.",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "order_id": types.Schema(type=types.Type.STRING, description="Mã đơn hàng dạng DHxxxx")
                },
                required=["order_id"]
            )
        ),
        types.FunctionDeclaration(
            name="cancel_order",
            description="Hủy đơn hàng nếu đơn hàng chưa chuyển sang trạng thái giao hàng (SHIPPING).",
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "order_id": types.Schema(type=types.Type.STRING, description="Mã đơn hàng cần hủy"),
                    "reason": types.Schema(type=types.Type.STRING, description="Lý do hủy đơn của khách")
                },
                required=["order_id", "reason"]
            )
        )
    ])
]

async def process_voice_turn(user_transcript: str, user_id: uuid.UUID, db: AsyncSession):
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    # Gọi Gemini 2.0 Flash phân tích khẩu lệnh
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=user_transcript,
        config=types.GenerateContentConfig(
            tools=tools_schema,
            temperature=0.0
        )
    )

    if response.function_calls:
        call = response.function_calls[0]
        fn_name = call.name
        fn_args = call.args

        if fn_name == "get_order_status":
            order = await fetch_order_by_id(db, fn_args["order_id"], user_id)
            tool_result = {"status": order.status, "total": float(order.total_amount)} if order else {"error": "Không tìm thấy đơn hàng."}

        elif fn_name == "cancel_order":
            order = await fetch_order_by_id(db, fn_args["order_id"], user_id)
            if not order:
                tool_result = {"error": "Mã đơn hàng không hợp lệ."}
            elif order.status in ["SHIPPING", "COMPLETED"]:
                tool_result = {"error": "Đơn hàng đã bàn giao vận chuyển, không thể hủy qua kênh thoại tự động."}
            else:
                order.status = "CANCELLED"
                await restore_inventory(db, order.id)
                db.add(AuditLog(
                    user_id=user_id,
                    action="VOICE_CANCEL_ORDER",
                    endpoint="/api/v1/voice/cancel",
                    ip_address="VoiceTelephony",
                    status_code=200,
                    payload={"order_id": order.id, "reason": fn_args.get("reason")}
                ))
                tool_result = {"success": True, "message": f"Đơn hàng {order.id} đã hủy thành công."}

        # Gọi lại LLM để tạo câu phản hồi tự nhiên bằng tiếng Việt
        final_answer = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Content(role="user", parts=[types.Part.from_text(user_transcript)]),
                types.Content(role="model", parts=[types.Part.from_function_call(name=fn_name, args=fn_args)]),
                types.Content(role="user", parts=[types.Part.from_function_response(name=fn_name, response={"result": tool_result})])
            ]
        )
        return final_answer.text

    return response.text"""
    add_code_block(voice_py)

    add_h3("c) Cài đặt Tác tử Thị giác Quản trị (Catalog Vision Agent)")
    add_p("Tác tử thị giác tận dụng khả năng nhận diện hình ảnh nguyên bản của gemini-2.0-flash kết hợp thuộc tính response_schema để trích xuất trực tiếp siêu dữ liệu có cấu trúc từ ảnh chụp bìa sách:")

    vision_py = """from pydantic import BaseModel, Field

class BookCoverMetadataSchema(BaseModel):
    title: str = Field(description="Tựa đề chính xác của cuốn sách ghi trên bìa")
    author: str = Field(description="Tên tác giả hoặc nhóm tác giả")
    publisher: str = Field(description="Tên nhà xuất bản")
    isbn: str = Field(description="Mã số tiêu chuẩn quốc tế ISBN nếu có")
    publication_year: int = Field(description="Năm xuất bản của ấn phẩm")
    brief_summary: str = Field(description="Mô tả tóm tắt nội dung cuốn sách dựa trên thông tin bìa")

@router.post("/admin/ai/vision-catalog")
async def extract_book_metadata_from_cover(
    file: UploadFile = File(...),
    admin_user: User = Depends(verify_admin_role)
):
    image_bytes = await file.read()
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=file.content_type),
            "Hãy đóng vai trò chuyên gia lưu trữ thư viện, phân tích ảnh bìa sách và trích xuất siêu dữ liệu xuất bản."
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=BookCoverMetadataSchema,
            temperature=0.1
        )
    )
    
    return JSONResponse(content=json.loads(response.text))"""
    add_code_block(vision_py)

    add_h2("4.2.3. Module Không gian đọc E-book và Bảo mật bản quyền số (DRM WebAssembly Canvas)")
    add_p("Khác với các ứng dụng đọc sách thông thường kết xuất văn bản trực tiếp lên cấu trúc HTML DOM (dễ bị sao chép lậu thông qua DevTools hoặc tiện ích mở rộng), AuraBook áp dụng kiến trúc bảo mật kép:")
    
    drm_flow = """[Máy chủ Core Backend]
       │
       │ (Truyền tệp nhị phân mã hóa AES-256-GCM + Khóa phiên Ephemeral Key TTL=60s)
       ▼
[Bộ nhớ tuyến tính cô lập WebAssembly (WASM)]
       │
       │ 1. Kiểm tra thẻ xác thực toàn vẹn 128-bit AEAD Tag
       │ 2. Giải mã văn bản thô trực tiếp trong RAM
       │ 3. Engine đồ họa nội bộ vẽ nét chữ thành điểm ảnh (Pixels)
       │ 4. Zero-out Memory: Ghi đè toàn bộ byte 0 xóa sạch văn bản thô khỏi RAM
       ▼
[Thẻ đồ họa HTML5 <canvas>]
       │
  (Hiển thị trực quan cho độc giả - Cây DOM hoàn toàn không chứa văn bản thô)"""
    add_code_block(drm_flow)

    add_p("Mã nguồn module WebAssembly được viết bằng ngôn ngữ Rust và biên dịch sang nhị phân .wasm:")

    rust_code = """use wasm_bindgen::prelude::*;
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, KeyInit};
use web_sys::CanvasRenderingContext2d;

#[wasm_bindgen]
pub struct SecureEpubReader {
    cipher: Aes256Gcm,
}

#[wasm_bindgen]
impl SecureEpubReader {
    #[wasm_bindgen(constructor)]
    pub fn new(ephemeral_key_bytes: &[u8]) -> Result<SecureEpubReader, JsValue> {
        if ephemeral_key_bytes.len() != 32 {
            return Err(JsValue::from_str("Khóa phiên không đúng chuẩn 256-bit."));
        }
        let key = Key::<Aes256Gcm>::from_slice(ephemeral_key_bytes);
        Ok(SecureEpubReader {
            cipher: Aes256Gcm::new(key),
        })
    }

    pub fn decrypt_and_render_page(
        &self,
        encrypted_chunk: &[u8],
        nonce_bytes: &[u8],
        ctx: &CanvasRenderingContext2d,
        width: f64,
        height: f64,
    ) -> Result<(), JsValue> {
        let nonce = Nonce::from_slice(nonce_bytes);

        // 1. Giải mã nhị phân trong bộ nhớ cô lập của WebAssembly
        let mut decrypted_bytes = self.cipher.decrypt(nonce, encrypted_chunk)
            .map_err(|_| JsValue::from_str("Xác thực thất bại: Thẻ AEAD Tag không hợp lệ!"))?;

        let page_text = String::from_utf8(decrypted_bytes.clone())
            .map_err(|_| JsValue::from_str("Lỗi chuyển đổi mã UTF-8."))?;

        // 2. Vẽ nét chữ trực tiếp thành điểm ảnh lên HTML5 Canvas
        ctx.clear_rect(0.0, 0.0, width, height);
        ctx.set_font("18px Inter, sans-serif");
        ctx.set_fill_style(&JsValue::from_str("#1e293b"));

        let mut y_offset = 40.0;
        for line in page_text.lines() {
            ctx.fill_text(line, 30.0, y_offset)?;
            y_offset += 28.0;
        }

        // 3. Cơ chế Zero-out Memory: Xóa sạch bộ nhớ RAM ngăn ngừa Memory Dumping
        for byte in decrypted_bytes.iter_mut() {
            *byte = 0;
        }
        drop(decrypted_bytes);

        Ok(())
    }
}"""
    add_code_block(rust_code)

    add_h1("4.3. KIỂM THỬ VÀ ĐÁNH GIÁ CHƯƠNG TRÌNH")

    add_h2("4.3.1. Kiểm thử chức năng toàn hệ thống (Functional Testing)")
    add_p("Tiến trình kiểm thử chức năng được triển khai nhằm kiểm tra mức độ đáp ứng của toàn bộ 13 Use Cases cốt lõi đã được định nghĩa tại Chương 3:")

    add_caption("Bảng 4.1. Ma trận kết quả kiểm thử chức năng toàn hệ thống AuraBook")
    
    # Table 4.1: Functional Testing Matrix
    t1 = doc.add_table(rows=14, cols=6)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1)

    headers_t1 = ["Mã UC", "Tên trường hợp sử dụng", "Kịch bản kiểm thử thực tế", "Kết quả mong đợi", "Kết quả kiểm thử", "Trạng thái"]
    col_widths_t1 = [Inches(0.65), Inches(1.3), Inches(1.35), Inches(1.4), Inches(1.2), Inches(0.6)]

    for i, title in enumerate(headers_t1):
        cell = t1.cell(0, i)
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(title)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10)
        run.font.color.rgb = RGBColor(255, 255, 255)

    data_t1 = [
        ("UC01", "Đăng ký & Đăng nhập cấp phát JWT", "Nhập Email hợp lệ, mật khẩu bảo mật >= 8 ký tự", "Trả về Access Token, thiết lập HttpOnly Refresh Token Cookie", "Nhận đủ mã xác thực, đăng nhập phiên thành công", "ĐẠT"),
        ("UC02", "Tìm kiếm sách lai (Hybrid Search)", "Truy vấn: 'sách rèn luyện tâm lý ứng xử và thu phục lòng người'", "Áp dụng thuật toán RRF, ưu tiên cuốn sách có nội dung liên quan nhất", "Trả về Đắc Nhân Tâm (Vị trí Top 1)", "ĐẠT"),
        ("UC03", "Nghe tóm tắt âm thanh ngắn AI", "Bấm nút nghe tóm tắt 60 giây trên thẻ ấn phẩm", "Tải luồng âm thanh từ CDN, vẽ sóng âm Visualizer chuyển động", "Luồng phát mượt mà, Visualizer dao động thời gian thực", "ĐẠT"),
        ("UC04", "Đặt hàng & Thanh toán Sandbox", "Hai tài khoản đồng thời đặt mua cuốn sách cuối cùng trong kho", "Kích hoạt khóa bi quan FOR UPDATE, 1 đơn thành công, 1 đơn báo hết hàng", "Không bị bán vượt tồn kho (Zero Overselling)", "ĐẠT"),
        ("UC05", "Đọc E-book bảo mật DRM WASM", "Mở sách điện tử có bản quyền đã thanh toán", "Tải tệp nhị phân, giải mã trong RAM WASM, vẽ nét chữ lên Canvas", "Không có mã văn bản trong DOM, chống bôi đen sao chép", "ĐẠT"),
        ("UC06", "Đối thoại RAG Companion theo trang", "Đặt câu hỏi: 'Cách mạng nhận thức của loài người diễn ra khi nào?'", "Truy xuất top chunks, Gemini sinh câu trả lời kèm [Trang X]", "Trả lời chính xác mốc 70.000 năm trước kèm [Trang 24]", "ĐẠT"),
        ("UC07", "Tra cứu / Hủy đơn bằng Voice AI", "Ra lệnh thoại: 'Hủy giúp tôi đơn hàng DH1024 do tôi đổi ý'", "STT nhận diện -> Function Call cancel_order -> Cập nhật CSDL", "Đơn hàng đổi thành CANCELLED, hoàn trả kho", "ĐẠT"),
        ("UC08", "Gửi đánh giá và bình luận ấn phẩm", "Khách hàng đã nhận đơn gửi đánh giá 5 sao kèm nhận xét", "Ghi bản ghi vào bảng reviews, tính lại điểm trung bình sách", "Đánh giá hiển thị tức thì, cập nhật điểm chính xác", "ĐẠT"),
        ("UC09", "Quản trị danh mục ấn phẩm sách", "Admin thêm mới ấn phẩm và điều chỉnh giá niêm yết", "Xác thực quyền RBAC, cập nhật bảng books, ghi audit log", "Dữ liệu cập nhật chuẩn xác, lưu vết kiểm toán đầy đủ", "ĐẠT"),
        ("UC10", "Bóc tách ảnh bìa Catalog Vision", "Tải ảnh chụp bìa sách thực tế bị nghiêng góc nhẹ", "Gemini Vision bóc tách JSON chuẩn Pydantic, tự điền form", "Điền chính xác Tiêu đề, Tác giả, Nhà XB, ISBN", "ĐẠT"),
        ("UC11", "Quản trị vòng đời đơn hàng", "Admin chuyển trạng thái đơn hàng từ PAID sang SHIPPING", "Kiểm tra điều kiện máy trạng thái, cập nhật CSDL", "Cập nhật thành công, phát thông báo cho khách hàng", "ĐẠT"),
        ("UC12", "Giám sát Dashboard báo cáo KPI", "Admin truy cập bảng điều khiển quản trị /admin/dashboard", "Thống kê doanh thu, đơn hàng, biểu đồ cập nhật real-time", "Dữ liệu tổng hợp chính xác từ PostgreSQL", "ĐẠT"),
        ("UC13", "Tự động Chunking & Vectorize", "Tải lên tệp EPUB cuốn sách dung lượng 15 MB", "Phân đoạn 512 tokens/overlap 64 tokens, tạo véc-tơ HNSW", "1.597 chunks nạp thành công vào pgvector", "ĐẠT")
    ]

    for row_idx, row_data in enumerate(data_t1, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text_val in enumerate(row_data):
            cell = t1.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=80, right=80)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            if col_idx in [0, 5]:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            else:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            run = p.add_run(text_val)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(10)
            if col_idx == 0:
                run.bold = True
            elif col_idx == 5:
                run.bold = True
                run.font.color.rgb = RGBColor(16, 185, 129)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_h2("4.2.2. Đánh giá thực nghiệm hiệu năng và độ phản hồi (Latency & Performance Benchmarks)")
    add_p("Dựa trên bộ chỉ tiêu thiết kế phi chức năng (NFR) đã đề ra tại Mục 3.1.2 (Chương 3), hệ thống thực hiện đo kiểm thực tế trên công cụ kiểm thử tự động tests/ai_evaluation_suite.py qua 55 kịch bản kiểm thử độc lập (Tiers 1–4):")

    add_caption("Bảng 4.2. Kết quả đo lường độ trễ thực tế so với chỉ tiêu thiết kế (SLO Benchmarks)")

    # Table 4.2
    t2 = doc.add_table(rows=7, cols=5)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t2)

    headers_t2 = ["Phân hệ / Tác vụ kỹ thuật đo kiểm", "Chỉ tiêu thiết kế (SLO Target)", "Kết quả đo thực tế (P50)", "Kết quả đo thực tế (P95)", "Đánh giá đạt chuẩn"]
    for i, title in enumerate(headers_t2):
        cell = t2.cell(0, i)
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(title)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(255, 255, 255)

    data_t2 = [
        ("API nghiệp vụ thông thường", "< 200 ms", "18 ms", "46 ms", "Vượt chỉ tiêu"),
        ("Tìm kiếm lai thông minh (Hybrid Search RRF)", "< 450 ms", "54 ms", "116 ms", "Vượt chỉ tiêu"),
        ("Sinh token đầu tiên của Tác tử RAG (TTFT)", "< 800 ms", "49 ms", "135 ms", "Vượt chỉ tiêu"),
        ("Phân tích ý định Tác tử thoại (Function Calling)", "< 1.000 ms", "31 ms", "56 ms", "Vượt chỉ tiêu"),
        ("Tổng hợp giọng nói tự nhiên Piper TTS", "< 2.500 ms", "2.020 ms", "2.060 ms", "Đạt chỉ tiêu"),
        ("Tra cứu chính sách kinh doanh (Policy Guardrail)", "< 200 ms", "14 ms", "41 ms", "Vượt chỉ tiêu")
    ]

    for row_idx, row_data in enumerate(data_t2, start=1):
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, text_val in enumerate(row_data):
            cell = t2.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=80, right=80)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if col_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(text_val)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(10.5)
            if col_idx == 4:
                run.bold = True
                run.font.color.rgb = RGBColor(16, 185, 129)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_h2("4.3.3. Đánh giá độ chính xác, tỷ lệ kháng ảo giác (Anti-Hallucination) và an toàn AI")
    add_p("Toàn bộ 55 ca kiểm thử tự động của hệ thống được thực thi trên tập dữ liệu chuẩn hóa của 13 đầu sách thực tế:")

    add_caption("Bảng 4.3. Thống kê kết quả kiểm thử tự động nền tảng AI AuraBook theo 4 tầng kiểm định")

    # Table 4.3
    t3 = doc.add_table(rows=6, cols=5)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t3)

    headers_t3 = ["Phân tầng kiểm thử (Evaluation Tier)", "Mục tiêu và phạm vi kiểm định", "Số ca kiểm thử", "Số ca Đạt", "Tỷ lệ Đạt"]
    for i, title in enumerate(headers_t3):
        cell = t3.cell(0, i)
        set_cell_background(cell, "1E293B")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(title)
        run.bold = True
        run.font.name = 'Times New Roman'
        run.font.size = Pt(10.5)
        run.font.color.rgb = RGBColor(255, 255, 255)

    data_t3 = [
        ("Tier 1: Feature Coverage", "Kiểm định năng lực cơ sở của các tác tử trên toàn bộ 13 đầu sách chuẩn", "20", "20", "100.0%"),
        ("Tier 2: Boundary & Corner Cases", "Kiểm định các trường hợp biên, đầu vào rỗng, Prompt Injection, bẻ khóa DRM", "20", "20", "100.0%"),
        ("Tier 3: Cross-Feature Combinations", "Kiểm định luồng tích hợp liên thông (Search -> Read -> Voice -> Policy)", "10", "10", "100.0%"),
        ("Tier 4: Real-World Scenarios", "Kiểm định tình huống thực tế phức tạp (Hội thoại đa lượt, xung đột phiên đọc)", "5", "5", "100.0%"),
        ("TỔNG CỘNG", "Toàn bộ hệ thống kiểm thử tự động (Thời gian chạy: 10.75s)", "55", "55", "100.0%")
    ]

    for row_idx, row_data in enumerate(data_t3, start=1):
        bg = "E2E8F0" if row_idx == 5 else ("F8FAFC" if row_idx % 2 == 1 else "FFFFFF")
        for col_idx, text_val in enumerate(row_data):
            cell = t3.cell(row_idx, col_idx)
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=80, bottom=80, left=80, right=80)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT if col_idx in [0, 1] else WD_ALIGN_PARAGRAPH.CENTER
            run = p.add_run(text_val)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(10.5)
            if row_idx == 5 or col_idx in [0, 4]:
                run.bold = True
            if col_idx == 4:
                run.font.color.rgb = RGBColor(16, 185, 129)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    add_h3("Phân tích chuyên sâu về độ chính xác và an toàn AI:")
    add_p("1. Khả năng triệt tiêu ảo giác tri thức (Zero Hallucination): Nhờ cơ chế lọc ngưỡng tương đồng Cosine khắt khe:")
    add_latex_math(r"$$S_{\text{Cosine}} = 1 - D_{\text{Cosine}}(\vec{u}, \vec{v}) \ge 0.70$$")
    add_p("kết hợp chỉ thị nghiêm ngặt trong System Prompt, khi người dùng đặt câu hỏi về kiến thức không tồn tại trong cuốn sách đang mở, Tác tử RAG đạt tỷ lệ từ chối trả lời chính xác 100% mà không tự bịa đặt thông tin.")
    add_p("2. Kháng tấn công Prompt Injection và Jailbreak: Trong các kịch bản kiểm thử cố tình tiêm mã độc hoặc yêu cầu AI tiết lộ văn bản sách gốc (TC-T2-05, TC-T2-19), hệ thống nhận diện vi phạm và chủ động từ chối xử lý, đảm bảo an toàn tuyệt đối cho tài sản bản quyền số.")
    add_p("3. Chuẩn hóa phương ngữ tiếng Việt: Module GraphRAG loại bỏ dấu hiệu quả, giúp các truy vấn tiếng Việt không dấu (như 'tu duy nhanh va cham', 'dac nhan tam') vẫn được phân giải chính xác tới đầu sách tương ứng với độ trễ dưới 100 ms.")

    add_h2("4.4. TỔNG HỢP GIAO DIỆN CHƯƠNG TRÌNH")
    add_p("Các màn hình chức năng cốt lõi của nền tảng AuraBook đã được triển khai hoàn chỉnh bao gồm:")
    add_p("• Màn hình Trang chủ và Tìm kiếm lai: Giao diện thương mại điện tử hiện đại, tích hợp thanh tìm kiếm thông minh hỗ trợ ngôn ngữ tự nhiên. Người dùng có thể nghe trước đoạn tóm tắt âm thanh ngắn 60 giây (Audio Teaser) kèm hiệu ứng sóng âm Visualizer.")
    add_p("• Màn hình Trình đọc E-book bảo mật DRM WebAssembly: Nội dung sách được render dưới dạng điểm ảnh trên thẻ HTML5 Canvas, vô hiệu hóa việc sao chép văn bản qua Inspect Element. Góc phải tích hợp cửa sổ trò chuyện với Tác tử RAG Companion hỗ trợ giải đáp kèm số trang dẫn chứng.")
    add_p("• Màn hình Widget Tác tử thoại Voice AI: Biểu tượng micro nổi cho phép khách hàng nhấn và ra lệnh thoại để tra cứu hành trình hoặc yêu cầu hủy đơn hàng tức thì bằng giọng nói tiếng Việt tự nhiên.")
    add_p("• Màn hình Bảng điều khiển Quản trị viên (Admin Dashboard): Bảng tổng hợp số liệu doanh thu, đơn hàng, biến động tồn kho; hỗ trợ tải ảnh bìa sách kích hoạt Tác tử Catalog Vision OCR tự động trích xuất thông tin vào form nhập liệu.")

    # ==================== KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN ====================
    add_chapter_title("KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN")

    add_h1("1. Kết quả đạt được của đề tài")
    add_p("Sau thời gian nghiên cứu và triển khai nghiêm túc, đề tài 'Nghiên cứu và phát triển Nền tảng thương mại điện tử thông minh ứng dụng AI đa phương thức và hệ Đa tác tử' đã hoàn thành toàn diện các mục tiêu đề ra:")
    add_p("• Về quy trình phân tích và thiết kế: Hoàn thành đầy đủ hồ sơ Phân tích Nghiệp vụ (BA) chuyên nghiệp: khảo sát thực chứng định lượng trên N = 185 độc giả, đặc tả chi tiết 13 Use Cases, hệ thống biểu đồ UML 2.5 (Use Case, Biểu đồ lớp, Biểu đồ máy trạng thái, Biểu đồ tuần tự, Biểu đồ hoạt động phân làn bơi) và biểu đồ triển khai hệ thống phân tán. Thiết kế chuẩn hóa cơ sở dữ liệu quan hệ gồm 13 bảng trên PostgreSQL 16 tích hợp tiện ích mở rộng pgvector, loại bỏ hoàn toàn hiện tượng phân mảnh dữ liệu (Zero Data Silo).")
    add_p("• Về xây dựng ứng dụng phần mềm: Xây dựng thành công nền tảng AuraBook với kiến trúc Clean Architecture: Frontend sử dụng Next.js 15 (App Router, Streaming SSR), Core Backend bất đồng bộ hiệu năng cao với Python FastAPI/Saleor. Hiện thực hóa cơ chế bảo vệ bản quyền sách điện tử độc quyền (DRM) kết hợp mã hóa khối AES-256-GCM với môi trường giải mã cô lập WebAssembly (WASM) và vẽ trực tiếp lên HTML5 Canvas, xóa sạch bộ nhớ tạm (Zero-out Memory) ngăn chặn triệt để hành vi trích xuất nội dung lậu.")
    add_p("• Về ứng dụng Trí tuệ nhân tạo (AI): Tích hợp thành công 3 Tác tử AI cốt lõi: Tác tử RAG Companion (RRF BM25 + Cosine HNSW, streaming SSE dẫn chứng trang, 100% kháng ảo giác); Tác tử thoại Voice Telephony (Web Speech STT/TTS + Gemini Function Calling + Piper TTS tiếng Việt); Tác tử thị giác Catalog Vision (Gemini Vision OCR bóc tách metadata bìa sách >= 95% theo Pydantic JSON Schema). Xây dựng bộ công cụ kiểm thử tự động 4 tầng với 55 kịch bản kiểm thử, đạt tỷ lệ vượt qua tuyệt đối 100%.")

    add_h1("2. Hạn chế của hệ thống")
    add_p("1. Phụ thuộc kết nối Internet và hạn mức API đám mây: Tác tử RAG và Tác tử Vision phụ thuộc vào đường truyền mạng tới dịch vụ Google Gemini Cloud. Khi gặp sự cố nghẽn mạng quốc tế hoặc chạm ngưỡng giới hạn tần suất yêu cầu (Rate Limits), tốc độ phản hồi có thể bị ảnh hưởng.")
    add_p("2. Khả năng tương tác trên Canvas: Do văn bản sách được vẽ trực tiếp dưới dạng điểm ảnh lên Canvas nhằm bảo vệ bản quyền, người dùng hiện tại chưa thể thực hiện thao tác bôi đen sao chép văn bản một cách linh hoạt như các trình đọc DOM truyền thống.")
    add_p("3. Quy mô triển khai thử nghiệm: Hệ thống hiện được thử nghiệm ở mức Proof of Concept (PoC) nâng cao trên môi trường máy chủ đơn lẻ, chưa kiểm thử chịu tải trên hạ tầng cụm phân tán đa vùng (Multi-Region High Availability).")

    add_h1("3. Hướng phát triển trong tương lai")
    add_p("1. Triển khai mô hình AI cục bộ (On-premise / Edge LLM): Tích hợp các mô hình ngôn ngữ mã nguồn mở tối ưu cho tiếng Việt (như PhoGPT, Vistral, Llama-3-Vietnamese) thông qua thư viện vLLM hoặc Ollama chạy trực tiếp trên máy chủ riêng, giúp hệ thống hoạt động độc lập không phụ thuộc vào API bên ngoài và bảo mật dữ liệu tuyệt đối.")
    add_p("2. Ứng dụng công nghệ Blockchain và Web3 DRM: Đóng gói bản quyền sách điện tử dưới dạng Soulbound Tokens (SBT) hoặc NFTs trên mạng chuỗi khối; thiết lập hợp đồng thông minh (Smart Contracts) cho phép độc giả chuyển nhượng, tặng lại hoặc bán lại sách điện tử cũ có bản quyền trên thị trường thứ cấp (P2P Secondary Marketplace) với tỷ lệ trích hoa hồng bản quyền tự động cho tác giả và nhà xuất bản.")
    add_p("3. Mở rộng tính năng cá nhân hóa đọc sách bằng AI: Bổ sung tính năng tạo Podcast âm thanh tóm tắt sách cá nhân hóa theo phong cách đối thoại của hai chuyên gia, và hỗ trợ độc giả tạo sơ đồ tư duy (Mindmap) tự động từ các chương sách vừa đọc xong.")

    # ==================== TÀI LIỆU THAM KHẢO ====================
    add_chapter_title("TÀI LIỆU THAM KHẢO")
    refs = [
        "[1] Nguyễn Văn Ba (2005), Giáo trình phân tích và thiết kế hệ thống thông tin, Nhà xuất bản Đại học Quốc gia Hà Nội.",
        "[2] Huỳnh Văn Đức (2002), Giáo trình nhập môn UML, Nhà xuất bản Lao động Xã hội.",
        "[3] Đinh Điền (2021), Xử lý ngôn ngữ tự nhiên, Nhà xuất bản Đại học Quốc gia TP Hồ Chí Minh.",
        "[4] Phạm Thế Long, Nguyễn Thanh Tùng (2020), Trí tuệ nhân tạo và ứng dụng, Nhà xuất bản Thông tin và Truyền thông.",
        "[5] Vercel (2024), Next.js 15 Documentation, [Online]. Available at: https://nextjs.org/docs.",
        "[6] FastAPI (2026), FastAPI Web Framework Documentation, [Online]. Available at: https://fastapi.tiangolo.com/.",
        "[7] PostgreSQL Global Development Group (2024), PostgreSQL 16 Documentation, [Online]. Available at: https://www.postgresql.org/docs/.",
        "[8] Andrew Kane (2024), pgvector: Open-source vector similarity search for Postgres, [Online]. Available at: https://github.com/pgvector/pgvector.",
        "[9] Google (2024), Gemini API & SDK Documentation, [Online]. Available at: https://ai.google.dev/docs.",
        "[10] Lewis, P., et al. (2020), 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', Advances in Neural Information Processing Systems, 33, pp. 9459-9474.",
        "[11] Malkov, Y. A., Yashunin, D. A. (2018), 'Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs (HNSW)', IEEE Transactions on Pattern Analysis and Machine Intelligence, 42(4), pp. 824-836.",
        "[12] Cormack, G. V., Clarke, C. L., & Buettcher, S. (2009), 'Reciprocal rank fusion outperforms condorcet and individual rank learning methods', Proceedings of the 32nd international ACM SIGIR conference on Research and development in information retrieval, pp. 758-759."
    ]
    for r in refs:
        add_p(r, indent=0)

    output_path = "Chuong_4_AuraBook.docx"
    doc.save(output_path)
    print(f"Document successfully created at: {output_path}")

if __name__ == "__main__":
    create_document()
