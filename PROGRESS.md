# AuraBook - Project Development State & Roadmap Tracker
*Documented by Lead Orchestrator (@agency-agents-orchestrator)*
*Last Updated: 2026-09-26*

---

## 📌 Tổng Quan Tiến Độ Dự Án

| Phân kỳ (Phase) | Nội dung trọng tâm | Trạng thái | Ghi chú & Commits |
| :--- | :--- | :--- | :--- |
| **Phase 1: Foundation** | Setup pgvector:pg16, SQLAlchemy 2.0 Async 13 Models, Seed Data, Docker Compose | ✅ **COMPLETED** | Commit `2b36cd6` |
| **Phase 2: Auth & RBAC** | JWT Access (1d) + Refresh (7d), Native Bcrypt Hash, RBAC Dependencies, User Profile | ✅ **COMPLETED** | Commit `c8b0a46` (Refined) |
| **Phase 3: Catalog & Books** | Categories, Book listing phân trang, lọc đa tiêu chí, chi tiết sách theo slug | ✅ **COMPLETED** | Commit `6d5ebf7` |
| **Phase 4: Cart & Sandbox Checkout (UC04)** | Giỏ hàng, Khóa bi quan SELECT FOR UPDATE, Hold kho 15m, Webhook HMAC, Cấp quyền E-book | ✅ **COMPLETED** | Commit `e7036d1` |
| **Phase 5: DRM E-Book Reader (UC05)** | WebAssembly Canvas Reader, AES-256-GCM Ephemeral Key, AEAD 128-bit Tag, Zero-out RAM, Tiến độ đọc | ✅ **COMPLETED** | 15/15 Pytest Passed, Next.js Reader Ready |
| **Phase 6: AI RAG & Voice (UC06, UC07)** | Gemini 768d Vector Pipeline, HNSW Hybrid Search, SSE Streaming RAG, Web Speech Voice | ⏳ **PENDING** | Kế hoạch tiếp theo sau Phase 5 |

---

## 🔒 Chi Tiết Kỹ Thuật Phase 5 (UC05 - E-Book DRM WebAssembly Canvas Reader)
1. **DRM Ephemeral Key Service (`GET /api/v1/ebooks/{book_id}/session-key`)**:
   - Xác thực quyền sở hữu hợp lệ trong `ebook_accesses` (trả về `403 Forbidden` nếu chưa mua sách).
   - Cấp phát khóa ngẫu nhiên 256-bit AES + 96-bit GCM IV có thời hạn 15 phút (900 giây) lưu trong bộ nhớ tạm `EbookSessionStore`.
2. **Encrypted Content Delivery (`GET /api/v1/ebooks/{book_id}/content`)**:
   - Kiểm tra `session_token` và trả về danh sách phân đoạn sách được mã hóa AES-256-GCM.
   - Thẻ xác thực AEAD Tag 128-bit gắn kèm từng chunk nhằm phát hiện mọi hành vi can thiệp lén tệp nhị phân (Ngoại lệ 6a).
3. **Reading Progress Sync (`GET` & `PUT /api/v1/ebooks/{book_id}/progress`)**:
   - Lưu trữ số trang đang đọc, tổng số trang, vị trí CFI và tự động tính toán tỷ lệ phần trăm (`progress_percent = min(100.0, (current / total) * 100)`).
4. **My Digital Library (`GET /api/v1/ebooks/my-library`)**:
   - Liệt kê toàn bộ ấn phẩm e-book độc giả sở hữu kèm tiến độ đọc mới nhất.
5. **Trình đọc WebAssembly / Web Crypto Canvas (`apps/web/app/reader/[bookId]/page.tsx`)**:
   - Giải mã luồng nhị phân trực tiếp trên bộ nhớ RAM cô lập (`window.crypto.subtle.decrypt`).
   - Lập tức thực thi ghi đè byte 0 (Zero-out Memory) xóa sạch dữ liệu văn bản thô khỏi RAM ngay sau khi vẽ.
   - Kết xuất điểm ảnh đồ họa lên thẻ HTML5 `<canvas id="drm-canvas">` với DPI cao (Retina display).
   - Vô hiệu hóa DOM text scraping: Cây DOM hoàn toàn không chứa văn bản trang sách.
   - Vô hiệu hóa chuột phải (`contextmenu`), chống bôi đen văn bản (`select-none`), chống phím tắt sao chép.
   - Hình mờ bảo mật bản quyền (Anti-Piracy Watermark) hiển thị mờ trên nền Canvas theo định danh độc giả.
   - Tùy biến giao diện (OLED Dark / Sepia Cổ Điển / Light Trắng), thay đổi cỡ chữ và thanh trượt tiến độ đọc mượt mà.

---

## 🔄 Hướng Dẫn Khôi Phục Ngữ Cảnh Khi AI Bị Gián Đoạn (Resume Protocol)
Khi một phiên chat bị dừng giữa chừng (hết token, ngắt kết nối, chuyển máy tính):
1. **Kiểm tra trạng thái Git**: Gõ `git log -n 5` và `git status` tại thư mục gốc của dự án.
2. **Đọc tài liệu này (PROGRESS.md)**: Xác định Phase nào đang ở trạng thái PENDING tiếp theo.
3. **Tiếp tục công việc**: Orchestrator sẽ tự động đọc bảng trên và tiếp tục ngay từ Phase 6 mà không phải làm lại từ đầu.
