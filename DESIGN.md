# AuraBook — Design System & Craft Floor Contract (DESIGN.md)
*Governance: Taste-Skill (@taste-skill) & Impeccable (@impeccable)*

---

## 1. Aesthetic Direction: Luxury Modern Tech Publishing
AuraBook theo đuổi ngôn ngữ thiết kế mỹ thuật cao cấp dành cho nền tảng xuất bản công nghệ:
- **Tông sáng chủ đạo (Crisp Light Mode)**: Nền trắng tinh khiết (`#FFFFFF`), kết hợp các lớp kính mờ mỏng (Glassmorphism `backdrop-blur-md`), bóng đổ tự nhiên êm dịu (`shadow-xs` / `shadow-sm`) và độ tương phản quang học hoàn hảo.
- **Biểu tượng thương hiệu**: Sử dụng độc quyền hình ảnh logo AuraBook chính thức tại `/logo.png` (biểu tượng trang sách xanh cyan mở ra đón ngôi sao vàng ấm áp kèm chữ thương hiệu `aurabook`).
- **Quy tắc Logo tối cao**: Luôn sử dụng hình ảnh logo gốc `/logo.png`, hiển thị tỉ lệ chuẩn, không bóp méo, không đóng khung viền thô và không chèn chữ phụ ngoài thiết kế.

---

## 2. Core Color Palette Tokens
| Token | HEX Code | Tailwind Class | Semantic Usage |
| :--- | :--- | :--- | :--- |
| **Primary Ocean Blue** | `#0284C7` | `bg-sky-600` / `text-sky-600` | Nút hành động chính, điểm nhấn liên kết, tiêu đề phụ |
| **Deep Blue Shade** | `#0369A1` / `#0C4A6E` | `bg-sky-700` / `text-sky-950` | Trạng thái hover, đường viền nhấn, banner công nghệ |
| **Warm Gold / Amber** | `#F59E0B` | `text-amber-500` / `bg-amber-500` | Ngôi sao đánh giá, huy hiệu nổi bật, mã giảm giá AURA2026 |
| **Gilded Amber Dark** | `#D97706` | `text-amber-600` / `border-amber-400` | Điểm nhấn nút Admin, đường viền cảnh báo, tag VIP |
| **Pure White** | `#FFFFFF` | `bg-white` | Nền canvas chính, bề mặt card sản phẩm |
| **Crisp Light Slate** | `#F8FAFC` / `#F1F5F9` | `bg-slate-50` / `bg-slate-100` | Nền phụ, input form, vùng phân cách nhẹ |
| **Midnight Slate (Dark)** | `#0F172A` / `#0A0D14` | `bg-[#0F172A]` / `bg-[#0A0D14]` | Header thông báo micro, Mega Footer, text heading chính |
| **Success Emerald** | `#10B981` | `text-emerald-600` / `bg-emerald-50` | Trạng thái ĐÃ THANH TOÁN (PAID), kho hàng sẵn sàng |
| **Warning Amber** | `#F59E0B` | `text-amber-600` / `bg-amber-50` | Đơn chờ xử lý (PENDING), cảnh báo sắp hết hàng |
| **Critical Rose** | `#EF4444` | `text-rose-600` / `bg-rose-50` | Đơn hủy, bản quyền bị thu hồi, tài khoản bị khóa |

---

## 3. The 4 Surface Operating Modes (Impeccable Framework)

### 1. Mode: Persuade (Storefront, Landing, Book Detail)
- **Mục tiêu**: Thu hút sự chú ý, tạo cảm giác sang trọng và thôi thúc độc giả sở hữu ấn phẩm.
- **Đặc trưng**: Tiêu đề ấn tượng, lưới sách bất đối xứng nhẹ, phát đoạn âm thanh thử nghiệm 60s mượt mà, thông tin tác giả và chứng chỉ bản quyền rõ nét.

### 2. Mode: Operate (Admin Portal, Orders, Users, Vouchers, DRM)
- **Mục tiêu**: Tối ưu hóa năng suất xử lý dữ liệu của người vận hành hệ thống.
- **Đặc trưng**: Mật độ thông tin cao (`VISUAL_DENSITY: 7`), tìm kiếm tức thì, lọc đa trạng thái, bảng biểu rõ ràng với huy hiệu FSM màu sắc phân minh, trạng thái tải và phản hồi tức thời.

### 3. Mode: Read (DRM E-Book Reader)
- **Mục tiêu**: Tập trung tối đa vào nội dung chữ và hình minh họa mà không bị phân tâm.
- **Đặc trưng**: Canvas đọc bảo mật tuyệt đối, thanh công cụ tinh gọn trên đầu và dưới chân trang, chuyển trang mượt mà, thanh tiến độ đọc trực quan.

### 4. Mode: Experience (AI Audio Teaser, Voice Assistant)
- **Mục tiêu**: Mang lại cảm giác thích thú và trải nghiệm công nghệ vị lai.
- **Đặc trưng**: Hiệu ứng sóng âm động, phản hồi giọng nói thời gian thực và chuyển động 3D tương tác.

---

## 4. The 3 Dials Configuration (Taste-Skill)
- **`DESIGN_VARIANCE: 7`**: Bố cục hài hòa, có các điểm nhấn thị giác bất đối xứng tinh tế, loại bỏ sự nhàm chán của mẫu template sao chép.
- **`MOTION_INTENSITY: 6`**: Chuyển động lò xo nhẹ nhàng (`transition-all duration-200`), hiệu ứng chạm bấm mềm mại, thanh trượt Drawer dứt khoát.
- **`VISUAL_DENSITY`**:
  - `4` đối với Giao diện Khách hàng & Landing (không gian thoáng đãng, dễ thở).
  - `7` đối với Cổng Quản trị Admin (tập trung cao độ vào dữ liệu, hàng cột chặt chẽ).

---

## 5. Craft Floor & Anti-Slop Discipline
1. **Tuyệt đối không dùng template AI mặc định**: Nghiêm cấm gradient tím hồng sến súa, các hộp thẻ 3 cột rập khuôn vô hồn.
2. **Không để trạng thái dở dang**: Mọi thao tác tải dữ liệu đều có spinner/skeleton êm ái; mọi lỗi mạng đều có thông báo thân thiện và cơ chế fallback thông minh.
3. **Thân thiện trên mọi kích thước màn hình**: Đáp ứng hoàn hảo từ màn hình di động nhỏ 375px đến màn hình máy tính 1440px+.
