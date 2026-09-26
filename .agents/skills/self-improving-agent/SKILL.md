---
name: self-improving-agent
description: "Hệ thống tự động theo dõi, đánh giá hiệu quả công việc của các skill và thu thập bài học kinh nghiệm (Continuous Learning & Self-Improvement). Kích hoạt khi: (1) Một lệnh hoặc thao tác bị lỗi lặp lại, (2) Người dùng sửa sai cho AI, (3) Phát hiện cách làm tối ưu hơn cho một tác vụ định kỳ, (4) Tổng kết và đề xuất cải tiến sau mỗi Sprint/Phase."
---

# Self-Improving Agent Skill

Kỹ năng tự động hóa việc theo dõi, đánh giá hiệu năng và tích lũy tri thức cho hệ sinh thái tác tử trong Antigravity.

## 🎯 Mục Tiêu Cốt Lõi
1. **Theo dõi liên tục**: Ghi nhận các lỗi phát sinh trong quá trình chạy lệnh, build, test.
2. **Thu nạp bài học (Learnings)**: Đúc kết kinh nghiệm khi người dùng chỉnh sửa hướng dẫn hoặc khi tìm ra phương án tối ưu hơn.
3. **Cải tiến & Nâng cấp**: Đề xuất nâng cấp nội dung file `SKILL.md` hoặc bổ sung các quy tắc (`rules/`) để không bao giờ lặp lại lỗi cũ.

## 📁 Cấu Trúc Nhật Ký Tự Học (`.learnings/`)

Tự động khởi tạo thư mục `.learnings/` tại gốc dự án nếu chưa có:
- `.learnings/LEARNINGS.md`: Chứa các bài học, quy ước kiến trúc phát hiện trong quá trình code.
- `.learnings/ERRORS.md`: Nhật ký các lỗi terminal/API và giải pháp đã khắc phục.
- `.learnings/FEATURE_REQUESTS.md`: Các tính năng hoặc năng lực mới mà người dùng yêu cầu.

## 🔄 Quy Trình Đánh Giá Định Kỳ (After-Action Review)

Sau mỗi Phase hoặc Sprint hoàn thành:
1. Đọc lại các lỗi đã gặp trong terminal hoặc git diff.
2. Ghi một mục tóm tắt bài học:
   ```markdown
   ### [YYYY-MM-DD] - [Tiêu đề bài học]
   - **Tác tử liên quan**: [tên skill]
   - **Vấn đề**: [mô tả ngắn gọn]
   - **Giải pháp tối ưu**: [cách giải quyết đúng]
   - **Hành động phòng ngừa**: [đề xuất cập nhật rule/skill]
   ```
3. Đưa ra hướng tinh chỉnh để các tác tử khác làm việc hiệu quả hơn trong các pha tiếp theo.
