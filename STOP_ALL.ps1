# ==============================================================================
# AuraBook Platform — Dừng Toàn Bộ Hệ Thống An Toàn
# Bao gồm: Sao lưu dữ liệu + Dừng container AuraBook + Dừng AI Platform + Tắt Port
# ==============================================================================

$ROOT = $PSScriptRoot
$INFRA = Join-Path $ROOT "infra"
$AI_PLATFORM = Join-Path $ROOT "ecommerce-ai-platform"
$AI_SERVICES = Join-Path $AI_PLATFORM "docker-compose.services.yaml"
$DIFY_COMPOSE = Join-Path $AI_PLATFORM "core-rag\dify\docker\docker-compose.yaml"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AURABOOK & AI PLATFORM — DỪNG TOÀN BỘ HỆ THỐNG AN TOÀN    " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Sao lưu dữ liệu tự động
Write-Host "[1/4] Tự động tạo bản sao lưu snapshot AuraBook..." -ForegroundColor Yellow
if (Test-Path (Join-Path $ROOT "scripts\backup_aurabook.py")) {
    python (Join-Path $ROOT "scripts\backup_aurabook.py")
}

# 2. Dừng Docker containers AuraBook
Write-Host "`n[2/4] Dừng các Docker container AuraBook..." -ForegroundColor Yellow
docker compose -f "$INFRA\docker-compose.yml" stop
docker stop aurabook-dashboard aurabook-backend aurabook-celery aurabook-postgres aurabook-mailpit aurabook-redis 2>$null
Write-Host "  [OK] Các container AuraBook đã dừng an toàn." -ForegroundColor Green

# 3. Dừng Docker containers Ecommerce AI Platform
Write-Host "`n[3/4] Dừng các container Ecommerce AI Platform (LiveKit, Reader, Dify)..." -ForegroundColor Yellow
docker compose -f "$AI_SERVICES" stop 2>$null
docker compose -f "$DIFY_COMPOSE" stop 2>$null
docker stop ecommerce-livekit ecommerce-web-reader 2>$null
Write-Host "  [OK] Các container AI Platform đã dừng hoàn tất." -ForegroundColor Green

# 4. Tắt các tiến trình chạy trên port 3000 và Python worker
Write-Host "`n[4/4] Dọn dẹp tiến trình Node (Port 3000)..." -ForegroundColor Yellow
$pids = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($pids) {
    foreach ($p in $pids) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Host "  [OK] Đã dừng tiến trình port 3000 (PID: $p)." -ForegroundColor Green
    }
} else {
    Write-Host "  [OK] Port 3000 đã được giải phóng." -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   ĐÃ DỪNG TOÀN BỘ HỆ THỐNG THÀNH CÔNG!" -ForegroundColor Green
Write-Host "   Lần sau muốn bật lại chỉ cần chạy: .\START_ALL.bat" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
