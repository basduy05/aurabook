# AuraBook — Product Context & Architecture Truth (PRODUCT.md)
*Standard Product Specification for Impeccable & Taste-Skill Governance*

---

## 1. Product Overview
**AuraBook** là nền tảng xuất bản và phát hành sách công nghệ & AI thế hệ mới tại Việt Nam. Nền tảng kết hợp xuất sắc giữa sách in chất lượng cao và sách số bảo mật bản quyền DRM thời gian thực, tích hợp hệ sinh thái AI tiên tiến (RAG Hybrid Search RRF $k=60$, AI Audio Teaser 60s và Trợ lý giọng nói Voice AI).

- **Sứ mệnh**: Mang tri thức công nghệ lõi (AI, RAG, Distributed Systems, Clean Architecture) đến độc giả Việt Nam với trải nghiệm đọc số cao cấp, an toàn và chống sao chép tuyệt đối.
- **Khẩu hiệu**: *Nền Tảng Tri Thức Công Nghệ Số & Sách Bản Quyền DRM Thế Hệ Mới.*

---

## 2. Target Audience & Personas
1. **Kỹ sư Phần mềm & Chuyên gia AI (Primary Reader)**:
   - Nhu cầu đọc sâu, tra cứu code mẫu, tìm kiếm ngữ nghĩa theo đoạn nội dung (Hybrid Search RRF).
   - Đọc trực tiếp trên trình duyệt hoặc thiết bị di động mà không cần cài đặt ứng dụng cồng kềnh.
2. **Nhà Quản lý Dự án & Giám đốc Kỹ thuật (Engineering Leads / CTOs)**:
   - Tiếp cận các ấn phẩm thiết kế hệ thống, microservices, kiến trúc đám mây và quy chuẩn bảo mật.
3. **Quản trị viên Nhà Xuất Bản & Tác Giả (Admin & Authors)**:
   - Theo dõi doanh thu thời gian thực, quản lý kho sách, scan bìa sách tự động bằng Gemini Vision OCR, kiểm soát đơn hàng FSM và cấp quyền truy cập bản quyền số DRM.

---

## 3. Core Functional Modules & User Journeys

### A. Storefront & Catalog (Chế độ: Persuade)
- **Khám phá tác phẩm**: Duyệt danh mục với bộ lọc đa tiêu chí (Sách in, E-Book DRM, Combo cả hai).
- **Hybrid Search RRF ($k=60$)**: Kết hợp tìm kiếm từ khóa SQL toàn văn và 768-chiều vector embeddings của Gemini, xếp hạng chuẩn Reciprocal Rank Fusion.
- **60s AI Audio Teaser**: Nghe bản tóm tắt âm thanh được AI chuyển ngữ và tổng hợp trước khi quyết định mua sách.
- **Đánh giá xác thực (UC08)**: Chỉ những độc giả đã thanh toán thành công đơn hàng (trạng thái `PAID`) mới được cấp quyền viết đánh giá, tự động kiểm duyệt ngôn từ tiêu cực.

### B. DRM E-Book Reader (Chế độ: Read)
- **Công nghệ Canvas WASM**: Render từng trang sách trực tiếp lên thẻ HTML5 Canvas, vô hiệu hóa hoàn toàn DOM Text Selection, DevTools Inspector và chụp màn hình clipboard.
- **Bảo mật phiên đọc**: Cấp khóa phiên dùng một lần AES-256-GCM Ephemeral Session Keys; xóa sạch RAM (`Zero-out RAM`) khi rời trang.
- **Tiến độ đọc**: Lưu vị trí trang và tỷ lệ hoàn thành theo thời gian thực vào cơ sở dữ liệu.

### C. Giỏ hàng & Thanh toán Sandbox (Chế độ: Operate)
- Giữ hàng bi quan 15 phút với `SELECT FOR UPDATE` ngăn ngừa overselling.
- Cổng thanh toán giả lập Sandbox Gateway với kiểm tra chữ ký HMAC-SHA256 và Webhook IPN xử lý bất đồng bộ.
- Áp dụng mã giảm giá voucher (`AURA2026` giảm 15%).

### D. Admin Operations Portal (Chế độ: Operate)
- **UC12 Realtime KPIs Dashboard**: Theo dõi doanh thu 7 ngày, tổng đơn hàng, tỷ lệ hoàn tất, sách bán chạy và cảnh báo tồn kho thấp.
- **UC09 & UC10 Quản lý Sách & OCR AI**: Quét ảnh bìa sách để tự động điền form qua Gemini 2.0 Flash Vision OCR, cập nhật tồn kho tức thì.
- **UC13 Vector Worker**: Kích hoạt worker băm nhỏ văn bản (Recursive Text Chunking) và tạo vector embeddings 768 chiều lưu trữ phục vụ RAG.
- **UC11 Vòng đời đơn hàng FSM**: Quản lý trạng thái đơn chuyển tiếp an toàn PENDING ➔ PAID ➔ SHIPPING ➔ DELIVERED (hoặc CANCELLED tự động hoàn kho và ghi AuditLog).
- **Quản lý người dùng, Mã giảm giá, Thu hồi bản quyền DRM, và Duyệt nhận xét**.

---

## 4. Technology Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Context API (`cart-context`).
- **Backend**: FastAPI (Python 3.11/3.12), Async SQLAlchemy 2.0, SQLite (Dev) / PostgreSQL 16 + pgvector (Prod), Redis (với in-memory fallback), PyJWT, Passlib Bcrypt.
- **AI Ecosystem**: Gemini 2.0 Flash Vision OCR, Gemini Text Embeddings (768-dim), RRF Hybrid Search ($k=60$).
- **Brand Assets**: Official geometric cinematography aerial emblem at `/logo.png`.
