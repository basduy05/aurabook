# AuraBook Monorepo

Dự án **AuraBook** được xây dựng theo kiến trúc Monorepo hiện đại, bao gồm frontend Next.js 15 và backend FastAPI kết hợp PostgreSQL 16 và Redis.

---

## 🏗 Cấu Trúc Dự Án

```text
aurabook/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI: lint (ruff, eslint), test, build
├── apps/
│   ├── web/                     # Frontend Next.js 15 (App Router, TypeScript, Tailwind, Shadcn)
│   │   ├── app/                 # App Router pages & layouts
│   │   ├── components/ui/       # Shadcn UI reusable components
│   │   ├── lib/                 # Utility functions (cn, clsx)
│   │   ├── Dockerfile           # Docker container cho Web
│   │   └── package.json
│   └── api/                     # Backend FastAPI (Python 3.11+, Domain-driven layout)
│       ├── app/
│       │   ├── core/            # Config, DB async engine, Redis pool, Security JWT
│       │   ├── models/          # SQLAlchemy Base models & mixins
│       │   ├── schemas/         # Pydantic Schemas & DTOs
│       │   ├── routers/         # Domain API Routes (Health, v1...)
│       │   ├── services/        # Business logic services
│       │   └── main.py          # FastAPI application factory & CORS
│       ├── tests/               # Pytest async test suite
│       ├── Dockerfile           # Docker container cho API
│       ├── requirements.txt
│       └── ruff.toml            # Ruff linter & formatter configuration
├── .env.example                 # Mẫu danh sách đầy đủ biến môi trường
├── .gitignore
├── docker-compose.yml           # Local setup: web, api, postgres:16, redis:7-alpine
├── package.json                 # Root monorepo workspace scripts
└── README.md
```

---

## 🚀 Khởi Động Nhanh Bằng Docker Compose (Khuyến Nghị)

### 1. Chuẩn bị biến môi trường
Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

### 2. Khởi chạy toàn bộ hệ thống
Khởi động 4 container (`postgres`, `redis`, `api`, `web`) ở chế độ background:

```bash
docker compose up -d --build
```

### 3. Kiểm tra các dịch vụ
Khi các container đã sẵn sàng:
- 🌐 **Web Frontend**: [http://localhost:3000](http://localhost:3000)
- ⚡ **API Documentation (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- 🔍 **API Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- 🗄 **PostgreSQL**: `localhost:5432` (User: `aurabook_user`, DB: `aurabook_db`)
- 📦 **Redis**: `localhost:6379`

### 4. Xem log và dừng dịch vụ
```bash
# Xem log thời gian thực của tất cả service
docker compose logs -f

# Xem log riêng từng service (ví dụ: api)
docker compose logs -f api

# Dừng hệ thống
docker compose down
```

---

## 💻 Chạy Trực Tiếp Từng Ứng Dụng (Local Development Không Qua Docker)

Nếu bạn muốn debug trực tiếp trên máy mà không dùng Docker cho `web` hoặc `api`:

### 1. Backend API (`apps/api`)

**Yêu cầu**: Python 3.11+

```bash
cd apps/api

# Khởi tạo virtual environment
python -m venv .venv

# Kích hoạt venv
# Trên Windows:
.venv\Scripts\activate
# Trên Linux/macOS:
source .venv/bin/activate

# Cài đặt dependencies
pip install -r requirements.txt

# Chạy server development với Uvicorn (hot-reload)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Chạy Linting & Tests cho API:**
```bash
# Kiểm tra linter với Ruff
ruff check .

# Tự động format code với Ruff
ruff format .

# Chạy kiểm thử tự động với Pytest
pytest
```

---

### 2. Frontend Web (`apps/web`)

**Yêu cầu**: Node.js 20+

```bash
cd apps/web

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev
```

**Chạy Linting & Build cho Web:**
```bash
# Kiểm tra linting với ESLint
npm run lint

# Kiểm tra kiểu dữ liệu TypeScript
npm run type-check

# Build thử phiên bản production
npm run build
```

---

## 🔄 GitHub Actions CI Pipeline

Dự án đã được tích hợp sẵn GitHub Actions workflow tại `.github/workflows/ci.yml`. Mỗi khi có Pull Request hoặc Push vào nhánh `main`, hệ thống sẽ tự động thực hiện:

1. **Job API (`lint-and-test-api`)**:
   - Kiểm tra chuẩn code với `ruff check` và `ruff format --check`.
   - Chạy toàn bộ test suite với `pytest`.
2. **Job Web (`lint-and-build-web`)**:
   - Kiểm tra mã nguồn với `eslint`.
   - Kiểm tra build và TypeScript types với `next build`.

---

## 🔐 Biến Môi Trường (.env.example)

| Tên biến | Giá trị mẫu | Mô tả |
| :--- | :--- | :--- |
| `APP_NAME` | `AuraBook` | Tên dự án |
| `ENVIRONMENT` | `development` | Môi trường (`development`, `production`, `test`) |
| `DEBUG` | `True` | Bật / tắt chế độ debug |
| `API_PORT` | `8000` | Port chạy FastAPI backend |
| `PORT` | `3000` | Port chạy Next.js frontend |
| `JWT_SECRET` | *32+ ký tự ngẫu nhiên* | Khóa bí mật ký JWT Token |
| `DATABASE_URL` | `postgresql+asyncpg://...` | Chuỗi kết nối PostgreSQL (Async SQLAlchemy) |
| `REDIS_URL` | `redis://redis:6379/0` | Chuỗi kết nối Redis cache / queue |
| `GEMINI_API_KEY` | `...` | Google Gemini AI API Key |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | URL API gọi từ frontend |
