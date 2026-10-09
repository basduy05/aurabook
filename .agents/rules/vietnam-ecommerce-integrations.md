# Vietnam E-commerce Integration Guidelines (Saleor + Next.js)

### 1. Administrative Divisions Mapping (Địa Giới Hành Chính Việt Nam)
Khi xử lý địa chỉ tại Việt Nam (countryCode = 'VN') từ Nominatim hoặc các dịch vụ Geocoding:
- `countryArea`: Đại diện cho **Tỉnh / Thành phố trực thuộc TW** (Hà Nội, TP. Hồ Chí Minh, Đà Nẵng,...). Bắt buộc phải chuẩn hóa và khớp với danh sách `countryAreaChoices` của Saleor GraphQL.
- `city`: Đại diện cho **Quận / Huyện / Thị xã / Thành phố thuộc tỉnh** (Quận Ba Đình, Quận Cầu Giấy, Huyện Gia Lâm,...). Tuyệt đối không điền lặp lại tên Tỉnh/Thành phố vào đây.
- `streetAddress1`: Đại diện cho **Địa chỉ cụ thể** gồm: `Số nhà + Tên đường + Phường/Xã` (ví dụ: `Số 25 Đường La Thành, Phường Giảng Võ`). Không để trơ trọi tên đường.
- `cityArea`: Tùy chọn lưu Phường / Xã.

### 2. Saleor App Token Authentication & Payments
- Saleor không lưu token app ở dạng plain-text mà lưu hash qua hàm `make_password(raw_token)` trong bảng `AppToken`.
- Để app token (`SALEOR_APP_TOKEN`) có thể thực hiện `transactionCreate` hoặc quản lý đơn hàng server-side, `App` tương ứng trong Saleor DB phải được gán các quyền: `handle_payments`, `handle_checkouts`, `manage_orders`.
- Cần có cơ chế fallback mềm trong checkout actions để các giao dịch thanh toán thử nghiệm (test card) không bị gián đoạn khi môi trường local chưa đồng bộ token.

### 3. Phân Biệt Đơn Hàng Ấn Phẩm Điện Tử (Ebook/Audiobook) vs Sách Giấy
- Đơn hàng không yêu cầu vận chuyển (`!order.shippingAddress` hoặc toàn bộ items là Ebook/Audiobook/Ấn phẩm điện tử):
  - Không hiển thị khối theo dõi giao vận GHN.
  - Hiển thị khối **Cấp phát quyền sử dụng ấn phẩm điện tử** (kích hoạt thư viện số, đọc trực tuyến).
- Đơn hàng có sách giấy/vật lý:
  - Hiển thị khối GHN với logo vector chính thức, đồng bộ Global CSS tokens và **mặc định thu gọn**.

### 4. Git Repository Structure
- Không nhúng repo con có thư mục `.git` vào trong dự án mà không đăng ký git submodule chính thức.
- Luôn giữ 1 Git root duy nhất (`aurabook`) để tránh chia đôi giao diện Source Control trong IDE và GitHub.
