# ==============================================================================
# AuraBook Platform — Khởi Động Hợp Nhất Toàn Bộ Hệ Thống (One-Click Launch)
# Bao gồm: AuraBook Saleor Stack + Ecommerce AI Platform (Dify, LiveKit, DRM Reader)
# ==============================================================================

$ROOT = $PSScriptRoot
$INFRA = Join-Path $ROOT "infra"
$FRONTEND = Join-Path $ROOT "frontend"
$AI_PLATFORM = Join-Path $ROOT "ecommerce-ai-platform"
$AI_SERVICES = Join-Path $AI_PLATFORM "docker-compose.services.yaml"
$DIFY_COMPOSE = Join-Path $AI_PLATFORM "core-rag\dify\docker\docker-compose.yaml"
$VOICE_BACKEND = Join-Path $AI_PLATFORM "voice-agent\backend"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AURABOOK & ECOMMERCE AI PLATFORM — ONE-CLICK LAUNCH      " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Khởi động các Docker container AuraBook (Postgres, Redis, Mailpit, Backend, Celery, Dashboard)
Write-Host "[1/5] Khởi động AuraBook Core Services (Saleor, Postgres, Redis)..." -ForegroundColor Yellow
docker compose -f "$INFRA\docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Khởi động Docker thất bại. Hãy chắc chắn Docker Desktop đang chạy!" -ForegroundColor Red
    pause
    exit 1
}

# 2. Khởi động Ecommerce AI Platform (LiveKit Server 7880, Web-Reader 8088)
Write-Host "`n[2/5] Khởi động AI Platform (LiveKit Server 7880, DRM Reader Gateway 8088)..." -ForegroundColor Yellow
docker compose -f "$AI_SERVICES" up -d

# 3. Khởi động Core RAG (Dify Knowledge Base 8080)
Write-Host "`n[3/5] Khởi động Core RAG (Dify Knowledge Base trên port 8080)..." -ForegroundColor Yellow
docker compose -f "$DIFY_COMPOSE" up -d

# Chờ Backend Saleor (8000) và LiveKit (7880) sẵn sàng
Write-Host "`n  -> Đang kiểm tra trạng thái các dịch vụ kết nối..." -ForegroundColor Cyan
$backendReady = $false
for ($i = 0; $i -lt 10; $i++) {
    $code = curl.exe -s -o NUL -w "%{http_code}" http://localhost:8000/graphql/ 2>$null
    if ($code -eq "200") {
        $backendReady = $true
        break
    }
    Start-Sleep -Seconds 2
}
if ($backendReady) {
    Write-Host "  [OK] Backend Saleor (8000) đã sẵn sàng." -ForegroundColor Green
} else {
    Write-Host "  [!] Backend Saleor đang khởi động..." -ForegroundColor Yellow
}

# 4. Khởi chạy Voice Agent Python Worker trong cửa sổ Terminal riêng biệt
Write-Host "`n[4/5] Khởi chạy Voice Agent Python Worker..." -ForegroundColor Yellow
$workerScript = @"
Set-Location '$VOICE_BACKEND'
Write-Host '=== AuraBook Vietnamese Voice CSKH Worker ===' -ForegroundColor Cyan
if (Test-Path '.venv\Scripts\activate.ps1') {
    & .\.venv\Scripts\activate.ps1
}
python vietnamese_cskh_agent.py dev
"@
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", $workerScript -WindowStyle Normal
Write-Host "  [OK] Voice Agent Worker đã được khởi chạy trong cửa sổ riêng." -ForegroundColor Green

# 5. Khởi chạy Storefront Next.js (port 3000)
Write-Host "`n[5/5] Khởi chạy Storefront Next.js (port 3000)..." -ForegroundColor Yellow
$p3 = netstat -ano 2>$null | Select-String ":3000 " | Select-String "LISTENING"
if (-not $p3) {
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$FRONTEND'; npm run dev" -WindowStyle Minimized
    for ($i = 0; $i -lt 8; $i++) {
        Start-Sleep -Seconds 2
        $p3 = netstat -ano 2>$null | Select-String ":3000 " | Select-String "LISTENING"
        if ($p3) { break }
    }
    Write-Host "  [OK] Storefront Next.js đã được khởi chạy trên port 3000." -ForegroundColor Green
} else {
    Write-Host "  [OK] Storefront Next.js đã đang chạy trên port 3000." -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   TOÀN BỘ HỆ THỐNG AURABOOK & AI ĐÃ SẴN SÀNG!              " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  1. Storefront (Độc giả & Mua sắm) : http://localhost:3000" -ForegroundColor Cyan
Write-Host "     -> Đã tích hợp Widget Voice CSKH nổi & Web Reader DRM" -ForegroundColor White
Write-Host "  2. Admin Dashboard (Quản trị)     : http://localhost:9000/dashboard/" -ForegroundColor Cyan
Write-Host "  3. Core RAG (Dify Tri thức)       : http://localhost:8080" -ForegroundColor Cyan
Write-Host "  4. LiveKit WebRTC Server          : ws://localhost:7880" -ForegroundColor Cyan
Write-Host "  5. DRM Web Reader Gateway         : http://localhost:8088" -ForegroundColor Cyan
Write-Host "  6. GraphQL API Backend            : http://localhost:8000/graphql/" -ForegroundColor Cyan
Write-Host "  7. Mailpit (Hòm thư test)         : http://localhost:8025" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:3000"
