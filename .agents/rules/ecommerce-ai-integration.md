# Quy Chuẩn Tích Hợp Hệ Sinh Thái AI Vào AuraBook

Quy chuẩn này áp dụng khi phát triển, mở rộng hoặc tích hợp các phân hệ AI (Voice Agent, Core RAG, DRM Security) vào nền tảng AuraBook Storefront.

---

## 1. Trợ Lý Voice AI CSKH (Voice Agent LiveKit & Dify)
- **Deep UI Integration**: Không để Voice Agent phân mảnh dưới dạng web phụ hoặc port độc lập cho người dùng cuối. Thay vào đó, tích hợp trực tiếp dưới dạng **Floating Widget & Drawer** toàn cục trong layout chính (`(main)/layout.tsx`).
- **WebRTC Token Broker**: Luôn sử dụng Route Handler Next.js (`/api/voice-agent/token`) để ký HMAC-SHA256 JWT ngắn hạn (TTL tối đa 1h) kết nối LiveKit Server, không để lộ `LIVEKIT_API_SECRET` ở client.
- **Trải nghiệm đàm thoại đa giác quan**:
  - Tích hợp bộ hiển thị sóng âm động (Audio Visualizer) phản hồi theo cường độ mic người dùng và giọng đọc AI.
  - Phụ đề hội thoại thời gian thực (Live Subtitles Stream).
  - Khung chat văn bản (`Input` + nút `Send`) song song với thoại để người dùng tương tác trong mọi hoàn cảnh.
  - Thẻ câu hỏi mẫu (Quick Prompts) tra cứu tri thức Dify & chính sách hoàn tiền / DRM tức thì.
  - Bộ điều khiển Mute/Unmute và Ngắt kết nối trực quan.
- **Tự động ẩn trong Zen Reader**: Khi người dùng vào trang đọc sách (`/reader/[slug]`), widget Voice CSKH toàn trang phải tự động ẩn đi (`if (pathname?.includes("/reader")) return null;`) để nhường không gian cho AI Reading Companion chuyên sâu.
- **Khả năng chịu lỗi (Resilience)**: Nếu thiếu API key (OpenAI/Deepgram), Voice Worker và UI phải kích hoạt cơ chế mô phỏng thông minh (graceful fallback) thay vì crash tiến trình.

---

## 2. Bảo Mật Ấn Phẩm DRM & Trình Đọc Sách Web Reader (Zen Reader)
- **Route Đọc Sách Chuyên Dụng (Zen Mode)**: Đưa trình đọc sách vào route tiêu chuẩn trong Storefront (`/reader/[slug]`) với chế độ toàn màn hình:
  - Ẩn toàn bộ Storefront Header và Announcement Bar (`ConditionalHeader`).
  - Ẩn Storefront Footer (`ConditionalFooter`).
  - Ẩn widget Voice Agent toàn trang.
- **Cấu Trúc Điều Hướng Hai Cạnh (Dual Collapsible Sidebars)**:
  - **Bên Trái - Mục Lục Tác Phẩm (TOC)**: Danh sách các chương mục, tìm kiếm chương nhanh, chuyển trang tức thì, hỗ trợ thu nhỏ / mở rộng mượt mà.
  - **Bên Phải - AI Reading Companion**: Trợ lý AI chuyên sâu hỗ trợ đọc sách (diễn giải ý nghĩa, triết lý, ngữ cảnh nhân vật, tiếp nhận trích đoạn bôi chọn), hỗ trợ thu nhỏ / mở rộng.
- **Khắc Phục Lỗi Dark Mode (Text Color Fix)**:
  - Đăng ký theme trong ePub rendition phải bao phủ toàn diện các selector văn bản (`p, span, div, h1..h6, a, blockquote, li, em, strong, article, section`) với màu chữ `#e2e8f0 !important` để không bao giờ bị chữ màu đen trên nền tối.
- **Bảo Vệ Quyền Tác Giả & Tối Ưu Chụp Màn Hình**:
  - Khóa sự kiện `copy`/`cut` trên window và iframe kèm thông báo DRM bản quyền.
  - Cho phép bôi chọn (text selection) để mở Action Bar tiện ích: Tô màu Highlight, Lưu trích dẫn, Gửi đoạn trích cho AI phân tích.
  - Watermark định danh cá nhân đặt tinh tế ở góc trên chính giữa (top-center): `#{userId} • {userName}` để người dùng chụp màn hình trích dẫn đẹp mắt và minh bạch.
- **Điều Hướng Đồng Bộ Về Kho Sách Cộng Đồng**:
  - Nút "Quay lại" trên Reader chuyển về **Tủ sách của tôi trong Cộng đồng** (`/community?tab=bookshelf`).
  - Nút "Đọc sách" từ chi tiết đơn hàng số (`orders/[number]`) chuyển về Tủ sách trong cộng đồng.
  - Nút "Đọc sách ngay" trong mỗi thẻ sách tại Tủ sách cộng đồng mở trực tiếp Web Reader với tham số `back=/community?tab=bookshelf`.

---

## 3. Điều Phối Vận Hành Hợp Nhất (One-Click Launch Orchestration)
- Luôn duy trì bộ kịch bản một chạm:
  - `START_ALL.bat` / `START_ALL.ps1`: Khởi động tự động Saleor stack (8000, 9000, 5432, 6379, 8025) + LiveKit (7880) + Dify (8080) + DRM Gateway (8088) + Voice Worker + Storefront (3000).
  - `STOP_ALL.bat` / `STOP_ALL.ps1`: Tự động tạo bản sao lưu snapshot AuraBook trước khi tắt sạch các container và giải phóng cổng.
- **Tránh Xung Đột Cổng**: Dify Postgres chạy trong mạng bridge nội bộ của Dify Docker, tuyệt đối không map đè cổng 5432 và 6379 của AuraBook.

---

## 4. Tuân Thủ Design Tokens
- Khi sử dụng màu đặc thù trong Canvas hoặc ePub theme (`#hex` hoặc `rgba`), luôn bổ sung comment `// design-tokens-allow` trên cùng dòng để vượt qua kiểm tra `pnpm run lint:design-tokens`.
