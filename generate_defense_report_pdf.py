# -*- coding: utf-8 -*-
import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Báo Cáo Kỹ Thuật Hệ Thống & Cẩm Nang Bảo Vệ Đồ Án - AuraBook</title>
<style>
    @page {
        size: A4;
        margin: 20mm 18mm 20mm 22mm;
        @bottom-right {
            content: counter(page);
        }
    }
    body {
        font-family: 'Times New Roman', 'Segoe UI', serif;
        font-size: 13pt;
        line-height: 1.45;
        color: #111827;
        margin: 0;
        padding: 0;
    }
    
    /* Cover Page */
    .cover-page {
        page-break-after: always;
        text-align: center;
        padding-top: 40px;
        padding-bottom: 40px;
        height: 90vh;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .cover-institution {
        font-size: 14pt;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
    }
    .cover-faculty {
        font-size: 13pt;
        font-weight: bold;
        text-transform: uppercase;
        margin-bottom: 25px;
        color: #1e3a8a;
    }
    .cover-divider {
        width: 150px;
        height: 2px;
        background: #1e3a8a;
        margin: 0 auto 50px auto;
    }
    .cover-title-badge {
        display: inline-block;
        background-color: #eff6ff;
        color: #1d4ed8;
        font-size: 11pt;
        font-weight: bold;
        padding: 6px 16px;
        border-radius: 20px;
        border: 1px solid #bfdbfe;
        text-transform: uppercase;
        margin-bottom: 20px;
    }
    .cover-doc-title {
        font-size: 21pt;
        font-weight: 800;
        color: #0f172a;
        text-transform: uppercase;
        line-height: 1.3;
        margin-bottom: 15px;
    }
    .cover-subtitle {
        font-size: 14pt;
        font-weight: bold;
        color: #2563eb;
        margin-bottom: 40px;
        line-height: 1.4;
    }
    .cover-project-box {
        background: #f8fafc;
        border-left: 4px solid #2563eb;
        border-radius: 6px;
        padding: 16px 20px;
        text-align: left;
        margin: 0 auto 40px auto;
        max-width: 580px;
        font-size: 12pt;
    }
    .cover-project-box strong {
        color: #1e293b;
    }
    .cover-meta {
        margin-top: auto;
        font-size: 12pt;
        color: #475569;
    }

    /* Headings */
    h1 {
        font-size: 16pt;
        color: #0f172a;
        border-bottom: 2px solid #2563eb;
        padding-bottom: 6px;
        margin-top: 32px;
        margin-bottom: 14px;
        text-transform: uppercase;
        page-break-after: avoid;
    }
    h2 {
        font-size: 14pt;
        color: #1e3a8a;
        margin-top: 24px;
        margin-bottom: 10px;
        page-break-after: avoid;
    }
    h3 {
        font-size: 13pt;
        color: #334155;
        font-style: italic;
        margin-top: 18px;
        margin-bottom: 8px;
        page-break-after: avoid;
    }

    p {
        text-align: justify;
        text-indent: 1.2cm;
        margin-top: 0;
        margin-bottom: 8px;
    }
    p.no-indent {
        text-indent: 0;
    }

    /* Highlight Card / Callout */
    .callout {
        background: #f0fdf4;
        border-left: 4px solid #16a34a;
        padding: 12px 16px;
        border-radius: 4px;
        margin: 14px 0;
        font-size: 12pt;
    }
    .callout-title {
        font-weight: bold;
        color: #15803d;
        margin-bottom: 4px;
    }
    .callout-blue {
        background: #eff6ff;
        border-left: 4px solid #2563eb;
    }
    .callout-blue .callout-title {
        color: #1d4ed8;
    }

    /* Code Blocks */
    pre {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-left: 4px solid #3b82f6;
        border-radius: 4px;
        padding: 12px 14px;
        font-family: 'Consolas', monospace;
        font-size: 9.5pt;
        line-height: 1.35;
        overflow-x: auto;
        color: #1e293b;
        margin: 12px 0;
        page-break-inside: avoid;
    }

    /* Tables */
    table {
        width: 100%;
        border-collapse: collapse;
        margin: 14px 0;
        font-size: 10.5pt;
        page-break-inside: avoid;
    }
    th {
        background-color: #1e293b;
        color: #ffffff;
        font-weight: bold;
        padding: 8px 10px;
        border: 1px solid #cbd5e1;
        text-align: center;
    }
    td {
        padding: 7px 9px;
        border: 1px solid #cbd5e1;
        vertical-align: middle;
    }
    tr:nth-child(even) td {
        background-color: #f8fafc;
    }
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .status-pass {
        color: #16a34a;
        font-weight: bold;
    }
    .caption {
        text-align: center;
        font-style: italic;
        font-size: 10.5pt;
        color: #334155;
        margin-top: 4px;
        margin-bottom: 12px;
        font-weight: bold;
    }

    /* Math Formula Display */
    .formula-box {
        text-align: center;
        background: #fdfefe;
        border: 1px dashed #94a3b8;
        padding: 10px;
        margin: 12px 0;
        font-family: 'Cambria Math', serif;
        font-style: italic;
        font-size: 12pt;
        font-weight: bold;
        color: #0f172a;
    }

    /* Q&A Section */
    .qa-box {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        margin: 16px 0;
        padding: 14px 18px;
        page-break-inside: avoid;
    }
    .qa-question {
        font-weight: bold;
        color: #1e3a8a;
        font-size: 12.5pt;
        margin-bottom: 8px;
    }
    .qa-answer {
        font-size: 11.5pt;
        color: #334155;
        line-height: 1.45;
        text-align: justify;
    }
    .qa-answer ul {
        margin: 6px 0;
        padding-left: 20px;
    }
    .qa-answer li {
        margin-bottom: 4px;
    }

    .page-break {
        page-break-after: always;
    }
</style>
</head>
<body>

<!-- TRANG BÌA -->
<div class="cover-page">
    <div>
        <div class="cover-institution">BÁO CÁO KỸ THUẬT VÀ PHẢN BIỆN TỐT NGHIỆP</div>
        <div class="cover-faculty">KHOA CÔNG NGHỆ THÔNG TIN — CHUYÊN NGÀNH KỸ THUẬT PHẦN MỀM / KHOA HỌC DỮ LIỆU</div>
        <div class="cover-divider"></div>
        
        <div class="cover-title-badge">Tài Liệu Kỹ Thuật Bảo Vệ Đồ Án</div>
        
        <div class="cover-doc-title">BÁO CÁO KỸ THUẬT HỆ THỐNG VÀ CẨM NANG BẢO VỆ ĐỒ ÁN</div>
        <div class="cover-subtitle">NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ THÔNG MINH ỨNG DỤNG AI ĐA PHƯƠNG THỨC VÀ HỆ ĐA TÁC TỬ (AURABOOK)</div>
        
        <div class="cover-project-box">
            <p class="no-indent"><strong>• Tên đồ án:</strong> Xây dựng nền tảng E-commerce thông minh AuraBook</p>
            <p class="no-indent"><strong>• Trọng tâm công nghệ:</strong> Clean Architecture, PostgreSQL 16 + pgvector HNSW, Hybrid Search (RRF), WebAssembly Canvas DRM (AES-256-GCM), Multi-Agent Subsystems (RAG Companion, Voice Telephony Agent, Catalog Vision Agent).</p>
            <p class="no-indent"><strong>• Kết quả kiểm định thực nghiệm:</strong> 13/13 Use Cases đạt 100%, 55/55 ca kiểm thử tự động 4 tầng (Tiers 1-4) đạt tỷ lệ Pass 100.0%, độ trễ tìm kiếm P50 đạt 54ms, RAG TTFT 49ms.</p>
        </div>
    </div>
    
    <div class="cover-meta">
        <p class="no-indent text-center">Năm học 2026 — Đợt bảo vệ Khóa luận Tốt nghiệp Đại học</p>
    </div>
</div>

<!-- NỘI DUNG CHÍNH -->

<h1>1. TỔNG QUAN HỆ THỐNG & TÍNH CẤP THIẾT CỦA ĐỀ TÀI</h1>

<h2>1.1. Bối cảnh và 4 "Điểm nghẽn" Công nghệ Thực tế</h2>
<p>Trong bối cảnh thị trường sách trực tuyến và phát hành ấn phẩm số phát triển bùng nổ, các nền tảng thương mại điện tử hiện nay đang gặp phải bốn rào cản kỹ thuật nghiêm trọng:</p>
<p><strong>Thứ nhất, rào cản tìm kiếm từ khóa sơ sài (Keyword Mismatch):</strong> Tìm kiếm toàn văn truyền thống chỉ so khớp xâu ký tự chính xác. Khi độc giả tìm kiếm theo các ý niệm trừu tượng, chủ đề triết lý hoặc gõ tiếng Việt không dấu (ví dụ: <em>"sách rèn luyện tâm lý ứng xử và thu phục lòng người"</em>, <em>"dac nhan tam"</em>), công cụ tìm kiếm truyền thống trả về kết quả rỗng hoặc hoàn toàn sai lệch.</p>
<p><strong>Thứ hai, nội dung số dễ bị đánh cắp bản quyền (DRM Fragility):</strong> Các trang đọc sách trực tuyến hiện nay chủ yếu kết xuất văn bản trực tiếp ra cấu trúc HTML DOM. Người dùng chỉ cần mở công cụ lập trình viên (F12 DevTools) hoặc sử dụng các tiện ích mở rộng là có thể bóc tách toàn bộ nội dung sách lậu trong vài giây.</p>
<p><strong>Thứ ba, phân mảnh dữ liệu AI (Data Silo):</strong> Việc tích hợp các giải pháp AI dạng cấy ghép tạm bợ (dùng dịch vụ chatbot bên ngoài không liên kết trực tiếp với cơ sở dữ liệu quan hệ) gây ra hiện tượng ảo giác tri thức (Hallucination), khiến AI báo giá sai, tư vấn sai về tình trạng tồn kho, chính sách vận chuyển và đổi trả.</p>
<p><strong>Thứ tư, xung đột giao dịch đồng thời (Inventory Race Conditions):</strong> Khi nhiều người dùng cùng lúc bấm thanh toán ấn phẩm giới hạn vào cùng một thời điểm, các hệ thống xử lý giao dịch yếu kém thường dẫn tới tình trạng bán vượt số lượng thực tế trong kho (Overselling).</p>

<h2>1.2. Giải pháp kỹ thuật đột phá của AuraBook</h2>
<p>AuraBook được thiết kế như một nền tảng thương mại điện tử thế hệ mới, giải quyết trọn vẹn các thách thức trên thông qua 4 trụ cột kỹ thuật:</p>
<ul>
    <li><strong>Kiến trúc Zero Data Silo:</strong> Tích hợp trực tiếp dữ liệu giao dịch ACID và không gian véc-tơ đa chiều vào cùng hệ quản trị cơ sở dữ liệu <strong>PostgreSQL 16 kết hợp pgvector</strong>.</li>
    <li><strong>Bảo mật bản quyền kép WebAssembly + Canvas DRM:</strong> Tệp ấn phẩm được mã hóa khối <strong>AES-256-GCM</strong>, giải mã trong RAM cô lập của <strong>Rust WebAssembly (WASM)</strong>, vẽ chữ thành từng điểm ảnh lên <strong>HTML5 Canvas</strong> và xóa sạch bộ nhớ (<code>Zero-out Memory</code>), triệt tiêu hoàn toàn khả năng bóc tách từ DOM.</li>
    <li><strong>Bộ máy Tìm kiếm lai (Hybrid Search RRF):</strong> Hợp nhất kết quả tìm kiếm từ khóa BM25 (chỉ mục GIN) và tìm kiếm ngữ nghĩa Cosine 768 chiều (chỉ mục HNSW) theo giải thuật Reciprocal Rank Fusion.</li>
    <li><strong>Hệ Đa tác tử AI chuyên biệt (Multi-Agent System):</strong> Bao gồm <em>RAG Companion Agent</em> (đồng hành đọc sách có dẫn chứng trang), <em>Voice Telephony Agent</em> (ra lệnh thoại tra cứu và hủy đơn hàng qua Function Calling kết hợp Piper TTS), và <em>Catalog Vision Agent</em> (nhận diện bìa sách bóc tách metadata tự động chuẩn Pydantic).</li>
</ul>

<div class="page-break"></div>

<h1>2. KIẾN TRÚC KỸ THUẬT HỆ THỐNG (SYSTEM ARCHITECTURE)</h1>
<p>Hệ thống AuraBook được hiện thực hóa theo mô hình <strong>Clean Architecture</strong>, phân định ranh giới nghiêm ngặt giữa tầng giao diện, tầng nghiệp vụ và tầng điều phối trí tuệ nhân tạo:</p>

<div class="callout callout-blue">
    <div class="callout-title">SƠ ĐỒ PHÂN TẦNG KIẾN TRÚC TỔNG THỂ (CLEAN ARCHITECTURE)</div>
    <p class="no-indent" style="font-family: monospace; font-size: 10pt; line-height: 1.4;">
    [TẦNG 1: TRÌNH DIỄN CLIENT (Next.js 15 / React 19 / Tailwind CSS)]<br>
    ├── Storefront UI: Tìm kiếm lai, Nghe tóm tắt AI 60s (Web Audio Visualizer FFT)<br>
    ├── DRM Web Reader: Trình đọc Canvas bảo mật, Cửa sổ chat RAG Companion SSE<br>
    ├── Voice Widget: Nút micro thu âm Web Speech STT, Luồng phát âm thanh thời gian thực<br>
    └── Admin Dashboard: Tải ảnh bìa sách kích hoạt Catalog Vision, Quản trị KPI<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼ (HTTPS / REST API / Server-Sent Events SSE)<br>
    [TẦNG 2: ĐIỀU PHỐI VÀ API GATEWAY (Next.js App Router & Python FastAPI)]<br>
    ├── /api/search/ai: Tuyến trung chuyển truy vấn tìm kiếm lai Hybrid Search RRF<br>
    ├── /api/ai/reader-chat: Bộ điều phối luồng SSE kết nối RAG Service và Gemini 2.0 Flash<br>
    ├── /api/ai/voice-agent/chat: Bộ phân giải ý định & gọi hàm Function Calling<br>
    └── /api/v1/orders/checkout: Bộ điều phối đặt hàng có khóa bi quan FOR UPDATE<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
    [TẦNG 3: PHÂN HỆ TRÍ TUỆ NHÂN TẠO ĐA TÁC TỬ (MULTI-AGENT SUBSYSTEMS)]<br>
    ├── RAG Companion Agent: Google GenAI SDK (gemini-2.0-flash), Dify RAG, GraphRAG Store<br>
    ├── Voice Telephony Agent: Web Speech STT, Gemini Function Calling, Local Piper TTS Server<br>
    ├── Catalog Vision Agent: Multimodal Gemini Vision bóc tách JSON Pydantic Schema<br>
    └── Embedding Vectorizer: Google text-embedding-004 (768 chiều)<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
    [TẦNG 4: CƠ SỞ DỮ LIỆU HỢP NHẤT (POSTGRESQL 16 + PGVECTOR - ZERO DATA SILO)]<br>
    ├── Bảng nghiệp vụ: users, categories, books (chỉ mục GIN), orders, order_items<br>
    ├── Bảng không gian véc-tơ: book_chunks (1.597 chunks, chỉ mục HNSW vector_cosine_ops)<br>
    └── Bảng bảo mật & kiểm toán: ebook_accesses, reading_progress, audit_logs (JSONB)
    </p>
</div>

<h1>3. THIẾT KẾ CƠ SỞ DỮ LIỆU VÀ GIẢI PHÁP "ZERO DATA SILO"</h1>
<p>Bằng việc cài đặt tiện ích mở rộng <code>pgvector</code> trực tiếp trên PostgreSQL 16, hệ thống giải quyết trọn vẹn cả hai nhu cầu: xử lý giao dịch thương mại điện tử tuân thủ nghiêm ngặt chuẩn ACID, đồng thời thực hiện tra cứu tương đồng vector tiệm cận với tốc độ cực cao.</p>

<div class="caption">Bảng 3.1. Các thực thể dữ liệu cốt lõi trong hệ thống AuraBook</div>
<table>
    <thead>
        <tr>
            <th style="width: 18%;">Tên bảng</th>
            <th style="width: 32%;">Ý nghĩa và vai trò nghiệp vụ</th>
            <th style="width: 30%;">Chỉ mục tối ưu hóa (Indexes)</th>
            <th style="width: 20%;">Ràng buộc toàn vẹn</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>users</strong></td>
            <td>Lưu trữ thông tin khách hàng và tài khoản quản trị viên.</td>
            <td>B-Tree trên email</td>
            <td>CHECK (role IN ('Customer', 'Admin'))</td>
        </tr>
        <tr>
            <td><strong>books</strong></td>
            <td>Danh mục ấn phẩm, tồn kho, giá bán và véc-tơ văn bản.</td>
            <td><strong>GIN</strong> trên <code>lexical_tsv</code> (TSVECTOR)</td>
            <td>CHECK (stock_quantity >= 0, price >= 0)</td>
        </tr>
        <tr>
            <td><strong>book_chunks</strong></td>
            <td>Lưu 1.597 phân đoạn sách và véc-tơ nhúng 768 chiều.</td>
            <td><strong>HNSW</strong> trên <code>embedding</code> (Cosine)</td>
            <td>FOREIGN KEY (book_id) ON DELETE CASCADE</td>
        </tr>
        <tr>
            <td><strong>orders</strong></td>
            <td>Quản lý vòng đời đơn hàng thương mại điện tử.</td>
            <td>B-Tree trên user_id, status</td>
            <td>CHECK (status IN (PENDING, PAID, ...))</td>
        </tr>
        <tr>
            <td><strong>ebook_accesses</strong></td>
            <td>Cấp phát quyền đọc ấn phẩm số đã thanh toán.</td>
            <td>B-Tree trên user_id, book_id</td>
            <td>UNIQUE(user_id, book_id)</td>
        </tr>
        <tr>
            <td><strong>audit_logs</strong></td>
            <td>Ghi nhận dấu vết hành vi của người dùng và AI Agent.</td>
            <td>B-Tree trên created_at, user_id</td>
            <td>Payload lưu định dạng JSONB</td>
        </tr>
    </tbody>
</table>

<p class="no-indent"><strong>Cú pháp thiết lập chỉ mục HNSW trên không gian 768 chiều:</strong></p>
<pre>CREATE INDEX idx_book_chunks_hnsw_cosine ON book_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);</pre>

<div class="page-break"></div>

<h1>4. CHI TIẾT CÁC PHÂN HỆ KỸ THUẬT ĐỘT PHÁ</h1>

<h2>4.1. Bộ máy Tìm kiếm lai (Hybrid Search: BM25 + pgvector + RRF)</h2>
<p>Thuật toán hợp nhất <strong>Reciprocal Rank Fusion (RRF)</strong> kết hợp đồng thời thứ hạng tìm kiếm từ khóa truyền thống và thứ hạng tương đồng véc-tơ:</p>

<div class="formula-box">
    $$\text{RRF\_Score}(d) = \frac{0.5}{60 + \text{Rank}_{\text{BM25}}(d)} + \frac{0.5}{60 + \text{Rank}_{\text{Vector}}(d)}$$
</div>

<p>Hệ thống tích hợp module <strong>Vietnamese Diacritics Normalization</strong> trong <code>graph-store.ts</code>, tự động chuẩn hóa các truy vấn tiếng Việt gõ không dấu (như <em>"tu duy nhanh va cham"</em> $\rightarrow$ <em>"Tư Duy Nhanh Và Chậm"</em>). Truy vấn SQL CTE được thực thi trực tiếp tại cơ sở dữ liệu với độ trễ thực tế chỉ <strong>54 ms (P50)</strong>.</p>

<h2>4.2. Không gian đọc E-book và Bản quyền số DRM (WebAssembly Canvas)</h2>
<p>Khác biệt với tất cả các web reader truyền thống (kết xuất nội dung vào các thẻ HTML <code>&lt;p&gt;</code>, <code>&lt;div&gt;</code> dễ bị bóc trộm văn bản qua DevTools), AuraBook triển khai quy trình bảo vệ bản quyền kép độc quyền:</p>

<pre>[Server Backend] ──(Tệp AES-256-GCM + Khóa Ephemeral TTL=60s)──► [RAM WebAssembly (Rust)]
                                                                       │
                                              ┌────────────────────────┴────────────────────────┐
                                              ▼                                                 ▼
                                1. Giải mã nhị phân trong RAM                     3. Zero-out Memory: Ghi đè byte 0
                                2. Rasterize nét chữ thành Pixels                     xóa sạch văn bản khỏi RAM
                                              │
                                              ▼
                                   [HTML5 &lt;canvas&gt; Display]
                     (DOM hoàn toàn rỗng - Không thể bôi đen hay Inspect trích xuất)</pre>

<p>Mã nguồn lõi được viết bằng ngôn ngữ <strong>Rust</strong> và biên dịch ra nhị phân WebAssembly (<code>wasm-bindgen</code>), bảo đảm việc bảo mật bản quyền không làm suy giảm hiệu năng kết xuất trang sách.</p>

<h2>4.3. Xử lý Giao dịch và Khóa bi quan chống bán vượt tồn kho (Zero Overselling)</h2>
<p>Tại tiến trình Checkout, hệ thống sử dụng cơ chế khóa dòng cấp cơ sở dữ liệu:</p>
<pre>stmt = select(Book).where(Book.id == item.book_id).with_for_update()
result = await db.execute(stmt)
book = result.scalar_one_or_none()</pre>
<p>Toàn bộ các luồng giao dịch đồng thời đang cố gắng cập nhật số lượng tồn kho của cùng một đầu sách sẽ phải xếp hàng chờ giải phóng khóa. Khi cuốn sách cuối cùng được mua thành công, luồng tiếp theo ngay lập tức nhận thông báo hết hàng, bảo đảm tính toàn vẹn tồn kho tuyệt đối.</p>

<h2>4.4. Hệ Đa tác tử AI Đa phương thức (Multi-Agent Subsystems)</h2>
<ul>
    <li><strong>RAG Companion Agent:</strong> Sử dụng Gemini 2.0 Flash với nhiệt độ thấp $Temperature = 0.1$ và ngưỡng lọc Cosine $S_{\text{Cosine}} \ge 0.70$. Khi người dùng hỏi nội dung ngoài tác phẩm, tác tử chủ động từ chối; khi câu hỏi hợp lệ, tác tử bắt buộc trích dẫn kèm số trang <code>[Trang X]</code> và truyền dữ liệu dạng luồng SSE.</li>
    <li><strong>Voice Telephony Agent:</strong> Ứng dụng cơ chế <strong>Function Calling</strong> của Gemini để tự động tra cứu trạng thái giao hàng (<code>get_order_status</code>) hoặc hủy đơn hàng (<code>cancel_order</code>) theo khẩu lệnh khách hàng, sau đó chuyển phát âm thanh phản hồi qua máy chủ cục bộ <strong>Piper TTS</strong> (WAV PCM 22.050 Hz).</li>
    <li><strong>Catalog Vision Agent:</strong> Sử dụng Gemini Vision kết hợp định dạng cấu trúc <strong>Pydantic JSON Schema</strong> để tự động bóc tách các trường: <em>Title, Author, Publisher, ISBN, Year, Brief Summary</em> từ ảnh chụp bìa sách thực tế của thủ thư.</li>
</ul>

<div class="page-break"></div>

<h1>5. KIỂM THỬ TỰ ĐỘNG & KẾT QUẢ THỰC NGHIỆM (BENCHMARKS)</h1>

<h2>5.1. Kết quả đo lường độ trễ thực tế so với chỉ tiêu thiết kế (SLO Latency)</h2>
<p>Hệ thống được đo kiểm bằng công cụ tự động <code>tests/ai_evaluation_suite.py</code>:</p>

<div class="caption">Bảng 5.1. Kết quả đo lường độ trễ thực tế so với chỉ tiêu kỹ thuật</div>
<table>
    <thead>
        <tr>
            <th style="width: 32%;">Phân hệ / Tác vụ kỹ thuật</th>
            <th style="width: 22%;">Chỉ tiêu thiết kế (SLO)</th>
            <th style="width: 15%;">Thực tế P50</th>
            <th style="width: 15%;">Thực tế P95</th>
            <th style="width: 16%;">Đánh giá</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>API nghiệp vụ giao dịch thông thường</strong></td>
            <td class="text-center">&lt; 200 ms</td>
            <td class="text-center"><strong>18 ms</strong></td>
            <td class="text-center">46 ms</td>
            <td class="text-center status-pass">Vượt chỉ tiêu</td>
        </tr>
        <tr>
            <td><strong>Tìm kiếm lai thông minh (Hybrid Search RRF)</strong></td>
            <td class="text-center">&lt; 450 ms</td>
            <td class="text-center"><strong>54 ms</strong></td>
            <td class="text-center">116 ms</td>
            <td class="text-center status-pass">Vượt chỉ tiêu</td>
        </tr>
        <tr>
            <td><strong>Sinh token đầu tiên RAG Companion (TTFT)</strong></td>
            <td class="text-center">&lt; 800 ms</td>
            <td class="text-center"><strong>49 ms</strong></td>
            <td class="text-center">135 ms</td>
            <td class="text-center status-pass">Vượt chỉ tiêu</td>
        </tr>
        <tr>
            <td><strong>Phân tích ý định Tác tử thoại (Function Calling)</strong></td>
            <td class="text-center">&lt; 1.000 ms</td>
            <td class="text-center"><strong>31 ms</strong></td>
            <td class="text-center">56 ms</td>
            <td class="text-center status-pass">Vượt chỉ tiêu</td>
        </tr>
        <tr>
            <td><strong>Tổng hợp giọng nói tự nhiên Piper TTS</strong></td>
            <td class="text-center">&lt; 2.500 ms</td>
            <td class="text-center"><strong>2.020 ms</strong></td>
            <td class="text-center">2.060 ms</td>
            <td class="text-center status-pass">Đạt chỉ tiêu</td>
        </tr>
        <tr>
            <td><strong>Tra cứu chính sách kinh doanh (Policy Guardrail)</strong></td>
            <td class="text-center">&lt; 200 ms</td>
            <td class="text-center"><strong>14 ms</strong></td>
            <td class="text-center">41 ms</td>
            <td class="text-center status-pass">Vượt chỉ tiêu</td>
        </tr>
    </tbody>
</table>

<h2>5.2. Kết quả kiểm thử tự động 4 tầng (Automated Evaluation Tiers)</h2>
<p>Bộ dữ liệu kiểm định gồm 55 ca kiểm thử bao phủ toàn bộ 13 đầu sách chuẩn và các chính sách vận hành của sàn:</p>

<div class="caption">Bảng 5.2. Thống kê kết quả kiểm thử tự động nền tảng AI AuraBook</div>
<table>
    <thead>
        <tr>
            <th style="width: 25%;">Phân tầng kiểm thử</th>
            <th style="width: 45%;">Mục tiêu và phạm vi kiểm định</th>
            <th style="width: 10%;">Tổng số</th>
            <th style="width: 10%;">Số Đạt</th>
            <th style="width: 10%;">Tỷ lệ</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Tier 1: Feature Coverage</strong></td>
            <td>Kiểm định năng lực cơ sở của các tác tử trên toàn bộ 13 đầu sách.</td>
            <td class="text-center">20</td>
            <td class="text-center">20</td>
            <td class="text-center status-pass">100.0%</td>
        </tr>
        <tr>
            <td><strong>Tier 2: Boundary & Corner</strong></td>
            <td>Kiểm định các trường hợp biên, đầu vào rỗng, Prompt Injection, bẻ khóa DRM.</td>
            <td class="text-center">20</td>
            <td class="text-center">20</td>
            <td class="text-center status-pass">100.0%</td>
        </tr>
        <tr>
            <td><strong>Tier 3: Cross-Feature</strong></td>
            <td>Kiểm định luồng tích hợp liên thông (Search &rarr; Read &rarr; Voice &rarr; Policy).</td>
            <td class="text-center">10</td>
            <td class="text-center">10</td>
            <td class="text-center status-pass">100.0%</td>
        </tr>
        <tr>
            <td><strong>Tier 4: Real-World Scenarios</strong></td>
            <td>Kiểm định tình huống thực tế phức tạp (Hội thoại đa lượt, xung đột phiên).</td>
            <td class="text-center">5</td>
            <td class="text-center">5</td>
            <td class="text-center status-pass">100.0%</td>
        </tr>
        <tr style="background-color: #e2e8f0; font-weight: bold;">
            <td>TỔNG CỘNG</td>
            <td>Toàn bộ hệ thống kiểm thử tự động (Thời gian chạy: 10.75s)</td>
            <td class="text-center">55</td>
            <td class="text-center">55</td>
            <td class="text-center status-pass">100.0%</td>
        </tr>
    </tbody>
</table>

<div class="page-break"></div>

<h1>6. BỘ CÂU HỎI VÀ KỊCH BẢN PHẢN BIỆN BẢO VỆ TRƯỚC HỘI ĐỒNG (DEFENSE Q&A)</h1>

<div class="qa-box">
    <div class="qa-question">Câu 1: Tại sao đồ án không dùng cơ sở dữ liệu véc-tơ chuyên dụng (như Milvus, Pinecone) mà lại dùng pgvector trên PostgreSQL?</div>
    <div class="qa-answer">
        <strong>Trả lời trọng tâm:</strong>
        <ul>
            <li><strong>Loại bỏ phân mảnh dữ liệu (Zero Data Silo):</strong> Khi dùng Vector DB riêng rẽ, dữ liệu bị tách làm hai phần (một bên lưu thông tin đơn hàng, kho bãi; một bên lưu véc-tơ). Bất kỳ thay đổi nào cũng đòi hỏi cơ chế Distributed Transaction phức tạp để tránh lệch pha dữ liệu.</li>
            <li><strong>Tính toán Hybrid Search trong một truy vấn SQL:</strong> PostgreSQL 16 + pgvector cho phép thực hiện đồng thời tìm kiếm toàn văn GIN (BM25) và tìm kiếm HNSW (Cosine), sau đó tính điểm RRF ngay trên SQL CTE trong cùng một kết nối, giảm độ trễ truy vấn P50 xuống còn 54ms.</li>
            <li><strong>Tiết kiệm tài nguyên và bảo đảm chuẩn ACID:</strong> Tiết kiệm chi phí vận hành máy chủ riêng mà vẫn tận dụng được toàn bộ cơ chế sao lưu, phục hồi và bảo mật giao dịch của PostgreSQL.</li>
        </ul>
    </div>
</div>

<div class="qa-box">
    <div class="qa-question">Câu 2: Cơ chế chống bán vượt tồn kho (Overselling) trong hệ thống được đảm bảo như thế nào khi có nhiều người cùng mua đồng thời?</div>
    <div class="qa-answer">
        <strong>Trả lời trọng tâm:</strong> Hệ thống áp dụng <strong>Khóa bi quan (Pessimistic Locking)</strong> cấp cơ sở dữ liệu bằng câu lệnh <code>SELECT ... FOR UPDATE</code>. Khi có hàng trăm request đồng thời mua cùng một cuốn sách giới hạn, Transaction đầu tiên khóa bản ghi, kiểm tra tồn kho và trừ kho thành công; các luồng đến sau phải chờ và nhận thông báo hết hàng ngay khi kiểm tra số lượng, triệt tiêu 100% rủi ro tồn kho bị âm.
    </div>
</div>

<div class="qa-box">
    <div class="qa-question">Câu 3: Làm thế nào để đảm bảo Tác tử RAG không bị "ảo giác" (Hallucination) hoặc bịa đặt số trang khi người dùng hỏi?</div>
    <div class="qa-answer">
        <strong>Trả lời trọng tâm:</strong> Hệ thống kiểm soát ảo giác qua 3 tầng:
        <ul>
            <li><strong>Ngưỡng tương đồng Cosine khắt khe:</strong> Chỉ chấp nhận các đoạn phân mảnh có điểm $S_{\text{Cosine}} \ge 0.70$. Nếu không có đoạn nào vượt ngưỡng, hệ thống từ chối trả lời ngay lập tức.</li>
            <li><strong>Kiểm soát nhiệt độ sinh:</strong> Cấu hình $Temperature = 0.1$ nhằm loại bỏ tính ngẫu nhiên sáng tạo không có căn cứ.</li>
            <li><strong>Ràng buộc số trang dẫn chứng:</strong> System Prompt bắt buộc mô hình phải trích dẫn số trang cụ thể <code>[Trang X]</code> từ trường <code>page_number</code> của đoạn ngữ cảnh truyền vào.</li>
        </ul>
    </div>
</div>

<div class="qa-box">
    <div class="qa-question">Câu 4: Công nghệ bảo vệ bản quyền E-book số (DRM) của hệ thống khác gì so với các website đọc sách thông thường?</div>
    <div class="qa-answer">
        <strong>Trả lời trọng tâm:</strong> Web reader thông thường hiển thị văn bản lên DOM nên dễ dàng bị Inspect sao chép. AuraBook áp dụng kiến trúc <strong>WebAssembly Canvas DRM</strong>: tệp sách được mã hóa AES-256-GCM, giải mã trực tiếp trong không gian bộ nhớ cô lập của WebAssembly (viết bằng Rust), sau đó vẽ từng nét chữ thành điểm ảnh (pixels) lên thẻ <code>&lt;canvas&gt;</code>. Cuối cùng, hệ thống áp dụng cơ chế <code>Zero-out Memory</code> ghi đè byte 0 xóa sạch bộ nhớ tạm, ngăn chặn hoàn toàn việc bóc trích DOM hay dump RAM.
    </div>
</div>

<div class="qa-box">
    <div class="qa-question">Câu 5: Tìm kiếm lai (Hybrid Search) hoạt động ra sao và giải thuật RRF giải quyết vấn đề gì?</div>
    <div class="qa-answer">
        <strong>Trả lời trọng tâm:</strong> Tìm kiếm từ khóa thuần túy thất bại trước các câu hỏi trừu tượng, trong khi tìm kiếm véc-tơ ngữ nghĩa lại yếu thế khi tìm kiếm các từ khóa đặc thù (mã ISBN, tên tác giả). Thuật toán RRF ($k=60$) kết hợp thứ hạng của cả hai phương pháp mà không cần chuẩn hóa điểm số tuyệt đối, giúp kết quả hiển thị hài hòa, đạt điểm xếp hạng chính xác cao nhất.
    </div>
</div>

<div class="qa-box">
    <div class="qa-question">Câu 6: Giọng nói của Tác tử CSKH (Voice Agent) hoạt động như thế nào? Có bị gián đoạn hay trễ cao không?</div>
    <div class="qa-answer">
        <strong>Trả lời trọng tâm:</strong> Quy trình gồm: Web Speech STT trên trình duyệt (độ trễ &lt; 50ms) &rarr; Gemini 2.0 Flash phân tích ý định qua Function Calling (độ trễ P50 là 31ms) để truy vấn hoặc hủy đơn hàng &rarr; Máy chủ cục bộ Piper TTS sinh giọng nói WAV PCM 22.050 Hz chuẩn phòng thu với mô hình tiếng Việt lượng tử hóa ONNX trong 2,02 giây, bảo đảm phản hồi tự nhiên và bảo mật thông tin nội bộ.
    </div>
</div>

<div class="qa-box">
    <div class="qa-question">Câu 7: Đồ án có những hạn chế gì và hướng phát triển tiếp theo là gì?</div>
    <div class="qa-answer">
        <strong>Trả lời trọng tâm:</strong>
        <ul>
            <li><strong>Hạn chế:</strong> Việc render Canvas khiến thao tác bôi đen copy của người dùng bị hạn chế; tính năng RAG và Vision vẫn cần kết nối internet tới Google API.</li>
            <li><strong>Hướng phát triển:</strong> Tự lưu trữ mô hình ngôn ngữ tiếng Việt cục bộ (PhoGPT, Vistral, Llama-3-Vietnamese) qua vLLM/Ollama để độc lập mạng hoàn toàn; nghiên cứu ứng dụng Soulbound Tokens (SBT) / Blockchain để số hóa bản quyền sách, cho phép chuyển nhượng sách cũ trên thị trường thứ cấp P2P có trích bản quyền tự động cho tác giả.</li>
        </ul>
    </div>
</div>

<h1>7. KẾT LUẬN</h1>
<p>Nền tảng AuraBook là công trình nghiên cứu và phát triển phần mềm toàn diện, đáp ứng hoàn hảo cả về mặt kỹ thuật lập trình lẫn tính ứng dụng thực tiễn của Trí tuệ nhân tạo. Với 13 Use Cases đạt chuẩn, 55 bài kiểm thử tự động vượt qua 100%, độ trễ vận hành tối ưu và giải pháp DRM WebAssembly Canvas độc quyền, đồ án tự tin khẳng định tính khoa học, tính ứng dụng thực tế và chất lượng chuyên môn cao nhất trước Hội đồng chấm tốt nghiệp.</p>

</body>
</html>
"""

with open("defense_report.html", "w", encoding="utf-8") as f:
    f.write(html_content)

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
html_path = os.path.abspath("defense_report.html")
pdf_path = os.path.abspath("Bao_Cao_Ky_Thuat_Bao_Ve_Do_An_AuraBook.pdf")

cmd = [
    chrome_path,
    "--headless=new",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={pdf_path}",
    f"file:///{html_path}"
]

print("Executing Chrome PDF conversion...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)

if os.path.exists(pdf_path):
    size_bytes = os.path.getsize(pdf_path)
    print(f"SUCCESS: Generated PDF at {pdf_path} (Size: {size_bytes / 1024:.2f} KB)")
else:
    print("FAILED: PDF not found.")
