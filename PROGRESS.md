# AuraBook - Project Development State & Roadmap Tracker
*Documented by Lead Orchestrator (gency-agents-orchestrator)*
*Last Updated: 2026-09-26*

---

## 📌 Tổng Quan Tiến Độ Dự Án

| Phân kỳ (Phase) | Nội dung trọng tâm | Trạng thái | Ghi chú & Commits |
| :--- | :--- | :--- | :--- |
| **Phase 1: Foundation** | Setup pgvector:pg16, SQLAlchemy 2.0 Async 13 Models, Seed Data, Docker Compose | ✅ **COMPLETED** | Commit 2b36cd6 |
| **Phase 2: Auth & RBAC** | JWT Access (1d) + Refresh (7d), Bcrypt Hash, RBAC Dependencies, User Profile | ✅ **COMPLETED** | Commit c8b0a46 |
| **Phase 3: Catalog & Books** | Categories, Book listing phân trang, lọc đa tiêu chí, chi tiết sách theo slug | ✅ **COMPLETED** | Commit 6d5ebf7 |
| **Phase 4: Cart & Sandbox Checkout (UC04)** | Giỏ hàng, Khóa bi quan SELECT FOR UPDATE, Hold kho 15m, Webhook HMAC, Cấp quyền E-book | ✅ **COMPLETED** | Triển khai xong |
| **Phase 5: DRM E-Book Reader** | WebAssembly Canvas Reader, AES-256-GCM Decryption trên RAM, Tiến độ đọc | ⏳ **PENDING** | Thiết kế sau Phase 4 |
| **Phase 6: AI RAG & Voice** | Gemini 768d Vector Pipeline, HNSW Hybrid Search, SSE Streaming RAG, Web Speech Voice | ⏳ **PENDING** | Tích hợp sau Phase 5 |

---

## 🔄 Hướng Dẫn Khôi Phục Ngữ Cảnh Khi AI Bị Gián Đoạn (Resume Protocol)
Khi một phiên chat bị dừng giữa chừng (hết token, ngắt kết nối, chuyển máy tính):
1. **Kiểm tra trạng thái Git**: Gõ git log -n 5 và git status tại thư mục gốc của dự án.
2. **Đọc tài liệu này (PROGRESS.md)**: Xác định Phase nào đang ở trạng thái IN PROGRESS và file nào vừa được chỉnh sửa.
3. **Tiếp tục công việc**: Orchestrator sẽ tự động đọc bảng trên và tiếp tục ngay từ phase chưa hoàn thành mà không phải làm lại từ đầu.
