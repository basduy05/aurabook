# ==============================================================================
# Script khởi chạy toàn bộ nền tảng Ecommerce AI Platform trên Localhost
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    KHỞI CHẠY ECOMMERCE AI PLATFORM (100% LOCAL FREE)     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$PlatformRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $PlatformRoot

# 1. Khởi chạy Dify RAG Knowledge Base
Write-Host "`n[1/3] Khởi chạy Core RAG (Dify) trên cổng 8080..." -ForegroundColor Yellow
docker compose -f core-rag/dify/docker/docker-compose.yaml up -d

# 2. Khởi chạy LiveKit Server & Web Reader Gateway
Write-Host "`n[2/3] Khởi chạy LiveKit Server (7880) & DRM Web Reader (8088)..." -ForegroundColor Yellow
docker compose -f docker-compose.services.yaml up -d

# 3. Hiển thị bảng điều khiển các dịch vụ
Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   TOÀN BỘ HẠ TẦNG LOCALHOST ĐÃ SẴN SÀNG!               " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

Write-Host @"
+--------------------+----------------------------+---------------------------------------+
| Phân hệ            | Địa chỉ Localhost          | Mô tả vai trò                         |
+--------------------+----------------------------+---------------------------------------+
| Dashboard Quản Trị | http://localhost:3000/ai-admin | Điều phối Provider & Cấu hình 0đ  |
| Core RAG (Dify)    | http://localhost:8080      | Quản lý kho tri thức RAG & Chatbot    |
| LiveKit Server     | ws://localhost:7880        | Máy chủ WebRTC xử lý Voice Call       |
| Edge-TTS Service   | http://localhost:5050      | Giọng đọc tiếng Việt MC VTV (0đ)      |
| DRM Web Reader     | http://localhost:8088      | Giao diện đọc sách EPUB/PDF bảo mật   |
| Voice Agent Web    | http://localhost:3001      | Web Next.js gọi thoại CSKH tiếng Việt |
+--------------------+----------------------------+---------------------------------------+

CÁC BƯỚC KHỞI ĐỘNG CÁC SERVICE MIỄN PHÍ:
1. Chạy Edge-TTS Microservice (Giọng đọc tiếng Việt 0đ vô hạn):
   cd voice-agent/backend
   python edge_tts_server.py

2. Chạy Voice Agent Backend (Xử lý âm thanh & gọi RAG):
   cd voice-agent/backend
   python vietnamese_cskh_agent.py dev

3. Mở Dashboard Quản Trị AI (Kiểm soát & Đổi Provider linh hoạt):
   Truy cập: http://localhost:3000/ai-admin (Mục 3. Trợ Lý Voice CSKH)
"@ -ForegroundColor White
