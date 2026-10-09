# AuraBook CI/CD Pipeline

Hệ thống CI/CD của AuraBook được xây dựng theo chuẩn tự động hóa toàn diện cho kiến trúc monorepo phân tán (Next.js Frontend + Saleor/Django Backend + Celery + PostgreSQL pgvector + Redis + Docker).

---

## 📋 Cấu Trúc Pipeline

### 1. Continuous Integration (`.github/workflows/ci.yml`)
Kích hoạt tự động khi:
- Tạo hoặc cập nhật **Pull Request** vào nhánh `main`
- **Push** code trực tiếp vào nhánh `main`
- Chạy thủ công qua nút **Run workflow** (`workflow_dispatch`)

Pipeline bao gồm 3 jobs chạy song song:
- **`frontend-ci`**:
  - Node.js 22 + `pnpm` (quản lý gói chuẩn từ `packageManager: pnpm@10.28.1`).
  - Sinh mã GraphQL type-safe: `pnpm run generate:all`.
  - Kiểm tra kiểu tĩnh TypeScript: `pnpm run typecheck` (`tsc --noEmit`).
  - Chạy toàn bộ 722+ unit tests qua Vitest: `pnpm run test:run`.
  - Build kiểm thử production Next.js: `pnpm run build`.
- **`backend-ci`**:
  - Python 3.12 + `uv` (quản lý dependency hiệu năng cao từ `uv.lock`).
  - Tự động dựng Service Containers: PostgreSQL 16 (pgvector) & Redis 7.
  - Linter code Aurabook Custom Apps (DRM, Reading Progress, AI Search): `uv run ruff check`.
  - Kiểm tra tính toàn vẹn hệ thống Django: `uv run python manage.py check`.
  - Kiểm tra migrations chưa tạo: `uv run python manage.py makemigrations --check --dry-run`.
- **`docker-infra-ci`**:
  - Xác thực cú pháp cấu hình `infra/docker-compose.yml`.
  - Kiểm tra build Docker image độc lập cho cả Backend và Frontend qua `docker/build-push-action` với bộ đệm cache GHA.

---

### 2. Continuous Deployment (`.github/workflows/cd.yml`)
Kích hoạt khi:
- Code được merge vào nhánh `main`
- Tạo tag phiên bản phát hành (`v*.*.*`)
- Kích hoạt thủ công chọn môi trường (`production` hoặc `staging`)

Quy trình:
1. Đăng nhập an toàn vào **GitHub Container Registry (GHCR)** qua `GITHUB_TOKEN`.
2. Build và push production images:
   - `ghcr.io/<owner>/aurabook-backend:latest` & `:sha`
   - `ghcr.io/<owner>/aurabook-frontend:latest` & `:sha`
3. Xuất báo cáo trạng thái triển khai lên GitHub Step Summary.
