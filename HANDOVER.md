# HANDOVER — AuraBook Saleor Migration
*Cập nhật: 2026-10-02 (Phase M1 + M3 scaffold hoàn thành)*

---

## 🏗️ Trạng Thái Hiện Tại

**Đã hoàn thành:**
- ✅ **Phase M1**: Restructure thư mục xong
  - `saleor/` → `backend/`
  - `storefront/` → `frontend/`
  - `apps/` → `legacy/` (tham khảo, xóa sau)
  - Tạo: `infra/`, `shared/`, `backend/aurabook_apps/`
- ✅ **Phase M3 Scaffold**: 4 AuraBook Custom Apps đã tạo xong
  - `backend/aurabook_apps/drm/` — AES-256-GCM DRM
  - `backend/aurabook_apps/ai_search/` — Hybrid Search RRF + Gemini
  - `backend/aurabook_apps/audio/` — Audio Teaser streaming
  - `backend/aurabook_apps/reading_progress/` — Reading library

**Đang làm tiếp (Phase M2):**
- Cấu hình Saleor backend `backend/saleor/settings.py`
- Tích hợp aurabook_apps vào INSTALLED_APPS + urls.py
- Setup Channel "aurabook-vn" (VND)
- Setup ProductType "Book" với attributes

**Bỏ qua:**
- ~~Phase M4~~ (Frontend branding) — Dùng Saleor Storefront nguyên bản

---

## 📂 Cấu Trúc Mới

```
aurabook/
├── backend/                 ← Saleor Django (từ saleor/)
│   ├── aurabook_apps/       ← Custom Apps AuraBook (MỚI)
│   │   ├── drm/             ← AES-256-GCM DRM sessions
│   │   ├── ai_search/       ← Gemini RAG + RRF k=60
│   │   ├── audio/           ← Audio Teaser streaming
│   │   └── reading_progress/← Library + progress
│   └── saleor/              ← Saleor core (không chỉnh)
├── frontend/                ← Saleor Storefront (từ storefront/)
├── legacy/                  ← apps/ cũ (TẠM THỜI)
├── infra/                   ← docker-compose, nginx, scripts
│   ├── docker-compose.yml   ← Full Saleor stack
│   ├── nginx/nginx.conf     ← Reverse proxy
│   └── scripts/migrate_legacy_to_saleor.py
└── shared/                  ← Shared assets
```

---

## 🔧 Bước Tiếp Theo (Phase M2)

1. Mở `backend/saleor/settings.py`
2. Thêm `aurabook_apps.*` vào `INSTALLED_APPS`
3. Thêm routes vào `backend/saleor/urls.py`
4. Chạy `python backend/manage.py migrate`
5. Tạo superuser: `python backend/manage.py createsuperuser`
6. Chạy `docker compose up -d` từ root

---

## ⚙️ Ports

| Service | Port |
|---|---|
| Saleor Backend (GraphQL) | 8000 |
| Saleor Storefront | 3000 |
| Saleor Dashboard | 9000 |
| PostgreSQL | 5432 |
| Redis | 6379 |
