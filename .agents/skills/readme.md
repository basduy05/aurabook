# AuraBook — Skills Ecosystem & Frontend Craft Manual

Hệ thống kỹ năng (Skills) của AuraBook được thiết lập theo mô hình **Đặc tả hướng hành vi & Chế tài thẩm mỹ cao cấp (Taste-Driven & Impeccable Craft)**.

---

## 🌟 1. Bộ Kỹ Năng Thiết Kế Cốt Lõi (Primary UI/UX Skills)

### 🎨 Taste-Skill (`.agents/skills/taste-skill`)
- **Tôn chỉ**: Triệt tiêu mã nguồn giao diện rập khuôn (Anti-Slop), không sử dụng template chung chung của AI.
- **Định hướng mỹ thuật**: Nhà xuất bản sách công nghệ cao cấp (Modern Luxury Tech Publishing).
- **Bộ 3 thước đo (The 3 Dials)**:
  - `DESIGN_VARIANCE: 7` — Bố cục bất đối xứng tinh tế, tạo nhịp điệu thị giác sống động.
  - `MOTION_INTENSITY: 6` — Hiệu ứng chuyển động lò xo mượt mà, cảm giác bấm tactile chân thực.
  - `VISUAL_DENSITY: 4` (Storefront khách hàng) / `7` (Cổng quản trị Admin).

### 💎 Impeccable (`.agents/skills/impeccable`)
- **Tôn chỉ**: Vượt ngưỡng tiêu chuẩn bình thường (Out-of-distribution craft), bảo đảm sàn chất lượng (Craft Floor).
- **4 Chế độ vận hành (4 Surface Modes)**:
  - **`Persuade`** (Trang chủ, Chi tiết sách): Thu hút sự chú ý, tạo cảm hứng và thúc đẩy hành động mua.
  - **`Operate`** (Admin Portal, Quản lý đơn, Quản lý người dùng, DRM): Tối ưu hóa mật độ dữ liệu, lọc nhanh, thao tác 1-chạm.
  - **`Read`** (Trình đọc WASM Canvas DRM): Tối ưu hóa trải nghiệm đọc, chống mỏi mắt, bảo vệ bản quyền tuyệt đối.
  - **`Experience`** (Audio Teaser 60s, Trợ lý giọng nói Voice AI): Trải nghiệm âm thanh và trí tuệ nhân tạo tương tác.
- **Hợp đồng ngữ cảnh**: Được định danh qua hai tài liệu bắt buộc:
  - [`PRODUCT.md`](file:///c:/Users/basduy05/Downloads/aurabook/PRODUCT.md) — Chân lý sản phẩm, luồng người dùng và kiến trúc hệ thống.
  - [`DESIGN.md`](file:///c:/Users/basduy05/Downloads/aurabook/DESIGN.md) — Hệ thống Design Tokens, bảng màu và quy chuẩn hoàn thiện.

---

## 🧭 2. Quy Tắc Thương Hiệu Bất Di Bất Dịch (Brand Assets)
- **Logo chính thức**: Sử dụng độc quyền hình ảnh nghệ thuật hình học trắng đen (`/logo.png`).
- **Quy tắc hiển thị**:
  1. Chỉ hiển thị nguyên vẹn ảnh gốc, không đóng khung viền bao quanh (no borders/frames).
  2. Tuyệt đối không chèn chữ text bên cạnh logo (loại bỏ chữ "AuraBook" thừa thãi ở phần thương hiệu).
  3. Favicon giữ nguyên vẹn cấu hình hiện tại.
- **Màu sắc chủ đạo**:
  - Xanh đại dương (Ocean Blue: `#0284c7`, `#0369a1`).
  - Vàng kim ấm (Warm Gold: `#f59e0b`, `#d97706`).
  - Slate thanh lịch (`#0f172a`, `#334155`) và Nền trắng tinh khiết (`#ffffff`).

---

## 🛠️ 3. Lệnh Hỗ Trợ Impeccable CLI
Tại thư mục gốc dự án:
```powershell
# Nạp ngữ cảnh thiết kế cho một trang cụ thể
.\.agents\skills\impeccable\scripts\impeccable.cmd context --target apps/web/app/page.tsx

# Kiểm tra chất lượng kỹ thuật & tính thẩm mỹ
.\.agents\skills\impeccable\scripts\impeccable.cmd audit apps/web/app/page.tsx
```