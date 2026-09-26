# AuraBook - Context Handover & Session State Machine
*Generated automatically by @conversation-handoff-sentinel*
*Current Time: 2026-09-26*

---

## 🚀 Trạng Thái Dự Án Hiện Tại (Snapshot State)
- **Repository**: `https://github.com/basduy05/aurabook.git`
- **Nhánh hoạt động**: `main`
- **Git Author & Committer**: `basduy05 <basduygame@gmail.com>` (Đã cấu hình chuẩn 100%)
- **Hệ thống Kiểm thử**:
  - `apps/api`: **30/30 tests Pytest PASSED**, Ruff linter đạt **0 lỗi, 0 cảnh báo**.
  - `apps/web`: **Next.js 15 Production Build (10/10 routes OK)**, TypeScript `tsc --noEmit` PASSED, ESLint đạt **0 lỗi, 0 cảnh báo**.

---

## 📊 Tình Trạng Các Phân Kỳ (Phases Breakdown)

| Phase | Trọng tâm chức năng | Tình trạng BE | Tình trạng FE | Trạng thái tổng |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: Foundation** | 13 Models Async SQLAlchemy, pgvector:pg16, Seed script | ✅ Xong | ⚙️ Setup Monorepo | ✅ **HOÀN THÀNH** |
| **Phase 2: Auth & RBAC** | JWT Access + Refresh, Bcrypt, RBAC Middleware | ✅ Xong | ✅ Form UI Login & Register | ✅ **HOÀN THÀNH** |
| **Phase 3: Catalog & Books** | Lọc đa tiêu chí, phân trang, slug, chi tiết sách | ✅ Xong | ✅ Storefront Catalog & Details | ✅ **HOÀN THÀNH** |
| **Phase 4: Cart & Sandbox Checkout** | Khóa bi quan SELECT FOR UPDATE, Hold 15m, Webhook IPN HMAC | ✅ Xong | ✅ Cart, Checkout & Sandbox | ✅ **HOÀN THÀNH** |
| **Phase 5: DRM E-Book Reader (UC05)** | Cấp khóa phiên AES-256, chunk AES-GCM AEAD Tag, Tiến độ đọc | ✅ Xong | ✅ WASM Canvas Reader & Library | ✅ **HOÀN THÀNH** |
| **Phase 6: AI RAG & Voice AI (UC06, UC07)** | Gemini 768d vector embeddings, Cosine Similarity, SSE Stream RAG, Web Speech Voice | ✅ Xong | ✅ RAG Sidebar & Global Voice | ✅ **HOÀN THÀNH** |
| **Phase 7: Advanced Catalog & Review (UC02, UC03, UC08)** | RRF k=60 Hybrid Search, Audio Teaser WAV, Đánh giá đơn PAID & Profanity filter | ✅ Xong | ✅ RRF Toggle, Audio Player, Reviews | ✅ **HOÀN THÀNH** |
| **Phase 8: Admin Services & Pipelines (UC09-UC13)** | Admin CRUD, Gemini Vision OCR Bìa, FSM Order, Dashboard Realtime, Vector Worker | ✅ Xong | ⏳ Sắp làm Phase 10 | ✅ **HOÀN THÀNH (BE)** |
| **Phase 9: Frontend Storefront E-Commerce (UC01-UC04, UC08)** | Trang chủ, Catalog RRF, Sách chi tiết, Audio Teaser, Giỏ hàng, Checkout Sandbox, Login & Register | ✅ Sẵn sàng | ✅ 10/10 Routes Biên dịch OK | ✅ **HOÀN THÀNH** |
| **Phase 10: Admin Dashboard & Operation Portal (UC09-UC13)** | Admin Portal UI, Gemini Vision Bìa Sách, Quản lý đơn FSM, Giám sát doanh thu & Vector Worker | ✅ Sẵn sàng | ⏳ Sắp thực hiện | ⏳ **PENDING** |

---

## 🎯 Chi Tiết Frontend Đã Hoàn Thiện Tại Phase 9 (`apps/web`)
1. `apps/web/context/cart-context.tsx`: Context toàn cục quản lý giỏ hàng (`localStorage`), mã giảm giá `AURA2026` 15%, phiên xác thực độc giả.
2. `apps/web/components/navbar.tsx`: Header dính mờ kính (Glassmorphism), ô tìm kiếm trực tiếp, huy hiệu đếm giỏ hàng, menu tài khoản người dùng.
3. `apps/web/components/cart-drawer.tsx`: Drawer trượt mượt mà hiển thị sản phẩm tức thì, thay đổi số lượng và nút thanh toán nhanh.
4. `apps/web/components/footer.tsx`: Chân trang hiện đại giới thiệu kiến trúc Next.js 15, AES-256-GCM DRM, Gemini 768d và liên kết Swagger.
5. `apps/web/app/page.tsx`: Landing page ấn tượng với tìm kiếm tức thời, danh mục thẻ lọc, các tác phẩm nổi bật và máy phát 60s AI Audio Teaser.
6. `apps/web/app/books/page.tsx`: Trang danh mục toàn diện với nút bật/tắt tìm kiếm lai RRF $k=60$, bộ lọc định dạng sách, đóng gói trong `<Suspense>`.
7. `apps/web/app/books/[slug]/page.tsx`: Trang chi tiết ấn phẩm với `use(params)`, máy phát 60s Audio Teaser HTML5, lựa chọn định dạng, liên kết đọc DRM và động cơ Đánh giá xác thực đơn hàng (UC08).
8. `apps/web/app/cart/page.tsx`: Trang giỏ hàng chi tiết với form áp mã khuyến mãi `AURA2026`, bảng tính tạm tính, chiết khấu và tổng thanh toán.
9. `apps/web/app/checkout/page.tsx`: Form thanh toán đơn hàng (sách in / sách số), lựa chọn Cổng Sandbox (HMAC-SHA256) vs COD, giả lập thanh toán tức thì và chuyển quyền đọc sách.
10. `apps/web/app/login/page.tsx` & `apps/web/app/register/page.tsx`: Thẻ đăng nhập và đăng ký bảo mật với nút 1-chạm tài khoản Demo Khách Hàng / Quản Trị Viên, lưu JWT vào Context và chuyển hướng thông minh.
11. `apps/web/app/reader/[bookId]/page.tsx`: Trình đọc sách WASM Canvas DRM chống trích xuất text DOM, giải mã AES-256-GCM và zero-out RAM.
12. `apps/web/app/library/page.tsx`: Thư viện số cá nhân hiển thị toàn bộ sách đã mua và thanh tiến độ đọc.

---

## 📌 Hướng Dẫn Khôi Phục Khi Khởi Động Phiên Mới
Khi bắt đầu một phiên hội thoại mới:
1. Orchestrator đọc trực tiếp file này (`HANDOVER.md`) và `PROGRESS.md`.
2. Chạy `git status` và xác nhận tác giả Git: `basduy05 <basduygame@gmail.com>`.
3. Kiểm tra các cổng: Backend `apps/api` (port 8000), Frontend `apps/web` (port 3000).
4. Tiếp tục thực hiện **Phase 10: Admin Dashboard & Operation Portal (UC09-UC13)** theo kế hoạch tổng thể.
