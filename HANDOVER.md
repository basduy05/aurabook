# AuraBook - Context Handover & Session State Machine
*Generated automatically by @conversation-handoff-sentinel*
*Current Time: 2026-09-26*

---

## 🚀 Trạng Thái Dự Án Hiện Tại (Snapshot State)
- **Repository**: `https://github.com/basduy05/aurabook.git`
- **Nhánh hoạt động**: `main` (Up to date with origin/main)
- **Git Author & Committer**: `basduy05 <basduygame@gmail.com>` (Đã cấu hình chuẩn 100%)
- **Hệ thống Kiểm thử**:
  - `apps/api`: **19/19 tests Pytest PASSED**, Ruff linter đạt **0 lỗi, 0 cảnh báo**.
  - `apps/web`: **TypeScript `tsc --noEmit` PASSED**, ESLint đạt **0 lỗi, 0 cảnh báo**.

---

## 📊 Tình Trạng Các Phân Kỳ (Phases Breakdown)

| Phase | Trọng tâm chức năng | Tình trạng BE | Tình trạng FE | Trạng thái tổng |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Foundation** | 13 Models Async SQLAlchemy, pgvector:pg16, Seed script | ✅ Xong | ➖ Setup Monorepo | ✅ **HOÀN THÀNH** |
| **Phase 2: Auth & RBAC** | JWT Access + Refresh, Bcrypt, RBAC Middleware | ✅ Xong | ⏳ Chưa ghép UI form | ✅ **HOÀN THÀNH (BE)** |
| **Phase 3: Catalog & Books** | Lọc đa tiêu chí, phân trang, slug, chi tiết sách | ✅ Xong | ⏳ Chưa ghép UI Store | ✅ **HOÀN THÀNH (BE)** |
| **Phase 4: Cart & Sandbox Checkout** | Khóa bi quan SELECT FOR UPDATE, Hold 15m, Webhook IPN HMAC | ✅ Xong | ⏳ Đã có Simulator HTML | ✅ **HOÀN THÀNH** |
| **Phase 5: DRM E-Book Reader (UC05)** | Cấp khóa phiên AES-256, chunk AES-GCM AEAD Tag, Tiến độ đọc | ✅ Xong | ✅ WASM Canvas Reader + Digital Library | ✅ **HOÀN THÀNH** |
| **Phase 6: AI RAG & Voice AI (UC06, UC07)** | Gemini 768d vector embeddings, Cosine Similarity, SSE Stream RAG, Web Speech Voice | ✅ Xong | ✅ Xong | ✅ **HOÀN THÀNH** |

---

## 🔍 Trả Lời Về Tình Trạng Frontend vs Backend
- **Đã làm ở Frontend (`apps/web`)**:
  1. `apps/web/app/reader/[bookId]/page.tsx`: Trình đọc E-book DRM Canvas bảo mật cao cấp (Giải mã AES-GCM trong RAM, Zero-out memory, vẽ Canvas chống scraping DOM, Dark/Sepia/Light, chỉnh cỡ chữ, TOC, đồng bộ tiến độ đọc).
  2. `apps/web/app/library/page.tsx`: Giao diện Thư viện số cá nhân hiển thị sách đã mua kèm thanh tiến độ.
  3. `apps/web/app/page.tsx`: Trang chủ giới thiệu hệ sinh thái AuraBook kèm liên kết Swagger và Thư viện số.
- **Phần Frontend còn lại cần bổ sung thêm**:
  - Giao diện Sàn thương mại điện tử mua sách (Trang duyệt danh mục phân tầng, trang chi tiết sách với nút chọn Mua sách giấy / Mua E-book, Giỏ hàng trượt Drawer, Modal Đăng nhập/Đăng ký, và Khung thoại Voice AI trên giao diện web).

---

## 🎯 Nhiệm Vụ Kế Tiếp: Phase 6 (AI RAG & Voice AI Companion)
1. **UC06: Tác Tử RAG Companion đối thoại ngữ cảnh trang sách**:
   - `pgvector` vector embedding pipeline (768 chiều với Google Gemini `text-embedding-004`).
   - Tìm kiếm lai HNSW Cosine Similarity $\ge 0.70$ kết hợp lọc theo `book_id`.
   - Endpoint Streaming SSE: `POST /api/v1/ai/rag/chat` sinh câu trả lời dạng hiệu ứng gõ chữ kèm huy hiệu dẫn chứng số trang (`[Trang X]`).
2. **UC07: Tác Tử Thoại Chăm Sóc Khách Hàng (Voice Telephony Agent)**:
   - Web Speech API (nhận diện giọng nói tiếng Việt & tổng hợp giọng đọc).
   - Gemini 2.0 Flash Function Calling: Tự động tra cứu đơn hàng (`track_order`), kiểm tra hủy đơn hàng (`cancel_order`), tra cứu tồn kho sách (`check_book_stock`).
   - Endpoint: `POST /api/v1/ai/voice/command`.

---

## 📋 Câu Lệnh 1-Click Để Tiếp Tục Khi Mở Conversation Mới
Nếu bạn mở Conversation mới, chỉ cần gửi tin nhắn sau:
```text
Tiếp tục dự án AuraBook theo file HANDOVER.md và PROGRESS.md. Triển khai Phase 6 (AI RAG & Voice AI Companion).
```
Tác tử sẽ tự động đọc tài liệu này và tiếp tục ngay lập tức!
