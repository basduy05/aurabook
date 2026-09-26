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
| **Phase 6: AI RAG & Voice (UC06, UC07)** | Gemini 768d Vector Pipeline, Cosine Search, SSE Stream RAG, Web Speech Voice Agent | ✅ **COMPLETED** | 19/19 Pytest Passed, Next.js Reader & Voice Widget Ready |

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

---

## 🤖 Chi Tiết Kỹ Thuật Phase 6 (UC06 & UC07 - AI RAG Companion & Voice Telephony Agent)
1. **AI RAG Companion (`/api/v1/ai/rag-stream` & `/api/v1/ai/rag/chat`)**:
   - **Vector Embeddings**: Pipeline sinh vector đặc trưng 768 chiều (L2-normalized) tương thích chuẩn Gemini embedding-004.
   - **Vector Search Engine**: Thuật toán tìm kiếm độ tương đồng Cosine trên trường `book_chunks.embedding` (ngưỡng tương đồng $\ge 0.70$), trích xuất chính xác số trang làm ngữ cảnh dẫn chứng `[Trang X]`.
   - **Streaming SSE**: Hỗ trợ Server-Sent Events truyền tải từng token phản hồi trực tiếp tới giao diện đọc sách.
   - **Giao diện Reader RAG**: Tích hợp sidebar tương tác tại `apps/web/app/reader/[bookId]/page.tsx`, hỗ trợ gợi ý câu hỏi tóm tắt, giải thích thuật ngữ và nhảy tức thì đến trang được trích dẫn.

2. **Voice Telephony Agent (`/api/v1/ai/voice-agent`)**:
   - **Gemini Function Calling Dispatcher**: Tự động nhận diện ý định khẩu lệnh tiếng Việt của người dùng và gọi các công cụ thực thi:
     - `cancel_order`: Kiểm tra trạng thái hợp lệ (`PENDING`/`PAID`), hủy đơn hàng, hoàn trả số lượng tồn kho và ghi nhật ký kiểm toán.
     - `get_order_status`: Tra cứu tiến trình xử lý, thời gian tạo và số tiền đơn hàng.
     - `check_book_stock`: Tra cứu số lượng tồn kho khả dụng của tựa sách trong danh mục.
   - **Bảo mật & Kiểm toán**: Model `AuditLog` (`audit_logs`) ghi nhận mọi thao tác nhạy cảm với `user_id`, `action`, `entity_type`, `entity_id` và `details` JSON.
   - **Giao diện Voice Assistant toàn cục**: Component `apps/web/components/voice-assistant.tsx` gắn tại `apps/web/app/layout.tsx` với Web Speech API nhận dạng giọng nói tiếng Việt (`vi-VN`), tổng hợp giọng đọc (`speechSynthesis`) và hiển thị huy hiệu hàm thực thi minh bạch.

---

## 📋 Bảng Đối Chiếu Toàn Bộ 13 Use Cases Chuẩn Luận Văn (filev45.tex)

| Mã UC | Tên nghiệp vụ chuẩn | Trạng thái Backend | Trạng thái Frontend | Ghi chú kỹ thuật |
| :---: | :--- | :---: | :---: | :--- |
| **UC01** | Đăng ký & Đăng nhập JWT | ✅ **100% Hoàn thành** | ⏳ Chưa ghép Form UI | Bcrypt, Access (1d) + Refresh (7d), RBAC |
| **UC02** | Tìm kiếm lai RRF (BM25 + 768d Vector) | ✅ **100% Hoàn thành** | ⏳ Chưa có Search Bar UI | Hợp nhất điểm RRF k=60 song song Lexical + 768d Cosine |
| **UC03** | Nghe thử âm thanh tóm tắt AI Teaser | ✅ **100% Hoàn thành** | ⏳ Chưa có Audio Player | Endpoint GET /api/v1/books/{id}/audio-teaser (WAV data URI) |
| **UC04** | Đặt hàng & Thanh toán Sandbox | ✅ **100% Hoàn thành** | 🟡 Đã có Simulator HTML | SELECT FOR UPDATE, Hold 15m, Webhook IPN |
| **UC05** | Đọc E-book WASM Canvas DRM | ✅ **100% Hoàn thành** | ✅ **100% Hoàn thành** | Khóa phiên AES-GCM AEAD Tag, Canvas RAM zero-out |
| **UC06** | Tác tử RAG Companion đối thoại | ✅ **100% Hoàn thành** | ✅ **100% Hoàn thành** | 768d Cosine Search, SSE Stream, Dẫn chứng trang |
| **UC07** | Tác tử Thoại Voice AI Function Calling | ✅ **100% Hoàn thành** | ✅ **100% Hoàn thành** | Gemini Function Calling, Hoàn kho, Audit Log |
| **UC08** | Đánh giá & Bình luận sách đã mua | ✅ **100% Hoàn thành** | ⏳ Chưa có Review UI | Xác thực đơn PAID, lọc từ cấm thô tục, tính avg_rating |
| **UC09** | Quản trị danh mục ấn phẩm (Admin) | ✅ **100% Hoàn thành** | ⏳ Chưa có Admin UI | CRUD ấn phẩm, điều chỉnh tồn kho, kiểm soát hiển thị |
| **UC10** | Quét ảnh bìa Vision OCR qua Gemini | ✅ **100% Hoàn thành** | ⏳ Chưa có UI Upload bìa | Gemini 2.0 Flash Vision bóc tách ISBN, tựa đề, tác giả autofill |
| **UC11** | Quản trị vòng đời đơn hàng (Admin) | ✅ **100% Hoàn thành** | ⏳ Chưa có Admin Orders UI | Máy trạng thái FSM, hoàn kho khi hủy, ghi AuditLog |
| **UC12** | Giám sát Dashboard thời gian thực | ✅ **100% Hoàn thành** | ⏳ Chưa có Dashboard UI | Thống kê doanh thu, 7 ngày gần nhất, top bán chạy, cảnh báo kho |
| **UC13** | Tự động Chunking & Vector hóa Embeddings | ✅ **100% Hoàn thành** | ⏳ Chưa có Upload E-book | Recursive chunking 512 tokens, overlap 64, sinh vector 768d |

---

## 🔍 Chi Tiết Kỹ Thuật Phase 7 (UC02, UC03, UC08 - Advanced User & Catalog Services)
1. **Tìm kiếm lai kết hợp thuật toán RRF k=60 (UC02)**:
   - **Nhánh từ vựng (Lexical Branch)**: Truy vấn chuỗi ký tự trên `title`, `author`, `description` và xếp hạng ứng viên theo độ phù hợp.
   - **Nhánh ngữ nghĩa (Semantic Branch)**: Vector hóa từ khóa tìm kiếm thành vector 768 chiều qua `AiService.generate_embedding(q)` và tính khoảng cách Cosine trên các phân đoạn sách `book_chunks.embedding`.
   - **Thuật toán Reciprocal Rank Fusion**:
     $$RRF(d) = \sum_{m \in \{lexical, semantic\}} \frac{1}{60 + rank_m(d)}$$
   - Phân loại kết quả rõ ràng theo thuộc tính `match_type` (`HYBRID` khi khớp cả hai nhánh, `LEXICAL` hoặc `SEMANTIC`).
   - Endpoint: `GET /api/v1/books/search/hybrid`.

2. **Nghe thử âm thanh tóm tắt sách AI Audio Teaser (UC03)**:
   - Endpoint: `GET /api/v1/books/{id}/audio-teaser`.
   - Kịch bản âm thanh 60 giây được biên soạn tự động từ siêu dữ liệu xuất bản và nội dung sách.
   - Bộ sinh âm thanh độc lập định dạng RIFF/WAV (PCM 16-bit, 22.05kHz) với hòa âm ngũ cung dẫn truyền (Acoustic Intro Chime) trả về chuỗi Data URI chuẩn `data:audio/wav;base64,...` hỗ trợ phát trực tiếp 100% trên giao diện người dùng.

3. **Gửi đánh giá số sao và bình luận ấn phẩm đã mua (UC08)**:
   - **Ràng buộc kiểm tra quyền sở hữu**: Chỉ cho phép độc giả có đơn hàng ở trạng thái `PAID` hoặc đã sở hữu `EbookAccess` gửi đánh giá (Ngoại lệ 6a - trả về `403 Forbidden` nếu chưa mua).
   - **Bộ lọc kiểm duyệt từ ngữ thô tục (Profanity Filter)**: Tự động chặn các bình luận chứa từ ngữ thô tục, spam, lừa đảo (trả về `400 Bad Request`).
   - **Cập nhật điểm trung bình**: Tự động tính lại `average_rating` và `total_reviews` trên model `Book` ngay khi độc giả gửi hoặc chỉnh sửa nhận xét.
   - Endpoint: `POST /api/v1/books/{id}/reviews` và `GET /api/v1/books/{id}/reviews` (kèm thống kê phân bổ số sao từ 1 đến 5).

---

## ⚙️ Chi Tiết Kỹ Thuật Phase 8 (UC09, UC10, UC11, UC12, UC13 - Admin Portal & Automated Pipelines)
1. **Quản trị danh mục ấn phẩm sách Admin CRUD & Tồn kho (UC09)**:
   - Các API quản trị: `GET /api/v1/admin/books`, `POST /api/v1/admin/books`, `PUT /api/v1/admin/books/{id}`, `PATCH /api/v1/admin/books/{id}/stock`, `DELETE /api/v1/admin/books/{id}`.
   - Hỗ trợ nhập thêm sách, xuất kho với lý do điều chỉnh và ghi nhật ký kiểm toán `audit_logs`.

2. **Tác tử Catalog Vision bóc tách ảnh bìa sách qua Gemini Vision OCR (UC10)**:
   - Endpoint: `POST /api/v1/admin/books/vision-extract` tiếp nhận ảnh bìa (file upload hoặc Base64).
   - Mô hình Gemini 2.0 Flash Vision tự động bóc tách: ISBN-13, Tựa đề, Tác giả, Nhà xuất bản, Thể loại và Tóm tắt bìa sau với độ tin cậy $\ge 0.90$.

3. **Quản trị và điều phối vòng đời đơn hàng Admin FSM (UC11)**:
   - Các API: `GET /api/v1/admin/orders`, `GET /api/v1/admin/orders/{id}`, `PATCH /api/v1/admin/orders/{id}/status`.
   - Máy trạng thái an toàn: `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PROCESSING` $\rightarrow$ `SHIPPED` $\rightarrow$ `COMPLETED` hoặc `CANCELLED`.
   - Khi hủy đơn, hệ thống tự động hoàn trả số lượng tồn kho khả dụng và ghi nhật ký `audit_logs`.

4. **Bảng điều khiển Giám sát Chỉ số Kinh doanh Thời gian Thực (UC12)**:
   - Endpoint: `GET /api/v1/admin/dashboard/metrics`.
   - Thống kê thời gian thực: Tổng doanh thu, doanh thu hôm nay, tỷ lệ hoàn tất đơn hàng, số khách hàng, biểu đồ doanh thu 7 ngày gần nhất, top 5 sách bán chạy nhất và danh sách cảnh báo sách sắp hết hàng (`stock_quantity <= 5`).

5. **Tiến trình ngầm Tự động Chunking & Vector hóa Embeddings (UC13)**:
   - Endpoint: `POST /api/v1/admin/books/{id}/process-ebook`.
   - Thuật toán phân đoạn đệ quy Recursive Chunking ($512\text{ tokens}$, $\text{overlap}=64\text{ tokens}$).
   - Tự động gọi `AiService.generate_embedding` sinh vector 768 chiều cho từng phân đoạn và bulk insert vào bảng `book_chunks` phục vụ tác tử RAG.
