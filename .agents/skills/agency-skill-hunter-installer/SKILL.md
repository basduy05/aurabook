---
name: agency-skill-hunter-installer
description: "Chuyên gia tự động tìm kiếm, đánh giá và cài đặt thêm các kỹ năng (skills) mới từ GitHub và cộng đồng nguồn mở khi dự án cần năng lực chuyên biệt. Hỗ trợ rà soát (audit) kho kỹ năng hiện có, phát hiện lỗ hổng chuyên môn và tự động chuyển đổi sang chuẩn Antigravity SKILL.md."
---

# Skill Hunter & Autonomous Installer

Kỹ năng chuyên biệt đảm nhận nhiệm vụ mở rộng và bảo trì hệ sinh thái kỹ năng của Antigravity.

## 🎯 Chức Năng Chính
1. **Rà soát & Đánh giá (Skill Audit)**: Phân tích danh mục các kỹ năng hiện có, kiểm tra cấu trúc YAML frontmatter, nhận diện các kỹ năng còn thiếu cho dự án.
2. **Tìm kiếm Kỹ năng Mới (Skill Discovery)**: Tìm kiếm trên GitHub, Awesome Agent Skills hoặc các repo chuyên ngành các skill phục vụ bài toán cụ thể (WebAssembly, DRM, Shaders, LLM Fine-tuning,...).
3. **Cài đặt Tự động (Auto-Installer)**: Tải tài liệu đặc tả, tự động chuẩn hóa định dạng `SKILL.md` chuẩn Antigravity và nạp vào `~/.gemini/config/skills/<skill_name>/SKILL.md`.

## 🛠️ Công Cụ Đi Kèm (`scripts/skill_hunter.py`)

Kỹ năng này cung cấp CLI Python để thực thi nhanh:
```bash
# 1. Rà soát toàn bộ kho skill hiện có
python scripts/skill_hunter.py audit

# 2. Tìm kiếm skill theo từ khóa
python scripts/skill_hunter.py search "webassembly"

# 3. Cài đặt trực tiếp một skill mới từ URL hoặc tên
python scripts/skill_hunter.py install --name "webassembly-expert" --description "..." --content-file "..."
```
