"""
AuraBook DRM App
================
Quản lý bảo mật bản quyền số (Digital Rights Management) cho e-book.

Tính năng:
  - Cấp ephemeral AES-256-GCM session key cho mỗi phiên đọc
  - Chỉ cấp key khi order của user có trạng thái PAID/FULFILLED
  - Thu hồi session key khi hết hạn hoặc người dùng đóng tab
  - Lưu tiến độ đọc sách (trang hiện tại, % hoàn thành)

Endpoints:
  POST   /aurabook/drm/session              → Cấp session key
  DELETE /aurabook/drm/session/{session_id} → Thu hồi session key
  POST   /aurabook/drm/progress/{product_id} → Cập nhật tiến độ đọc
  GET    /aurabook/reading/library           → Danh sách sách đã mua + progress

Security:
  - Session key là ephemeral: không lưu plaintext trong DB
  - Key được mã hóa bằng DRM_MASTER_KEY (env var)
  - Mỗi session key expire sau SESSION_KEY_TTL_SECONDS (mặc định: 3600s)
"""
