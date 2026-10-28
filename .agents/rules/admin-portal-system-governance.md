# Admin Portal & System Governance Rules

## 1. Full-Width Fluid First
- Mọi bảng điều khiển quản trị viên (Admin Portal) phải sử dụng bố cục tràn màn hình (`w-full min-h-screen px-4 lg:px-6`), tuyệt đối không giới hạn bởi `max-w-7xl` (1280px) để đảm bảo không gian hiển thị tối đa cho Data Table, Đồ thị tri thức, Lịch trình vận đơn và các biểu đồ phân tích.
- Sidebar phải hỗ trợ chế độ thu gọn thành icon bar (64px) và mở rộng (240px) để người dùng linh hoạt tối ưu bề ngang làm việc.

## 2. Zero-Code Operations (Feature Flags & Settings)
- Luôn cung cấp Trung tâm Cấu hình Hệ thống (System Config) với các công tắc tính năng (Feature Flags) và bộ chọn Nhà cung cấp LLM/Voice TTS, cho phép quản trị viên thay đổi hành vi hệ thống ngay lập tức mà không cần can thiệp vào mã nguồn:
  - Bật/tắt Widget Trợ lý AI, Đọc thử sách, Đánh giá công khai, Chế độ đọc DRM offline, Cổng thanh toán Sandbox.
  - Chọn model LLM (Ollama, Gemini Flash, Groq, OpenAI), thay đổi API key, nhiệt độ sáng tạo (Temperature).
  - Soạn thảo và cập nhật System Prompt của Trợ lý ảo trực tiếp trên giao diện.
  - Cấu hình Dify Knowledge Base (Dataset ID, API Key, Top-K, Score threshold).

## 3. High-Density & No-Spam UI
- Tối ưu mật độ hiển thị bằng bảng dữ liệu tinh gọn (Data Tables with inline controls), tránh lạm dụng các khối card lớn hoặc component trang trí gây tốn diện tích cuộn trang.
- Các thao tác thường dùng (đổi trạng thái vận đơn GHN, duyệt/ẩn đánh giá, khóa/mở độc giả) phải được đặt ngay trên từng dòng (inline action) hoặc dropdown trực tiếp.

## 4. Standalone Port Architecture with Reverse Proxy
- Khi tách trang quản trị sang một cổng riêng biệt (ví dụ cổng `:3001`), luôn cấu hình Reverse Proxy tại dev server (`/api`, `/graphql`, `/aurabook`, `/media`) trỏ về cổng backend chính (`:3000`, `:8000`) để đảm bảo các thao tác API diễn ra thông suốt, không bị lỗi CORS hoặc vướng xác thực chéo.
