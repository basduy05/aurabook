# ============================================================
# AuraBook — Script Khởi Động Toàn Bộ Hệ Thống (Giữ nguyên dữ liệu)
# Chạy: .\START_AURABOOK.ps1
# ============================================================

$ROOT = $PSScriptRoot
$INFRA = Join-Path $ROOT "infra"
$FRONTEND = Join-Path $ROOT "frontend"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   🚀 AURABOOK — KHỞI ĐỘNG HỆ THỐNG TOÀN DIỆN" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Khởi động các Docker container (Giữ nguyên volume & dữ liệu)
Write-Host "[1/3] Khởi động Docker containers..." -ForegroundColor Yellow
docker compose -f "$INFRA\docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Khởi động Docker thất bại. Hãy chắc chắn Docker Desktop đang mở!" -ForegroundColor Red
    pause
    exit 1
}

# 2. Kiểm tra Frontend Next.js (port 3000)
Write-Host "`n[2/3] Kiểm tra Frontend Next.js (Storefront)..." -ForegroundColor Yellow
$p3 = netstat -ano 2>$null | Select-String ":3000 " | Select-String "LISTENING"
if (-not $p3) {
    Write-Host "  -> Đang khởi động Next.js dev server trên port 3000..." -ForegroundColor Cyan
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$FRONTEND'; npm run dev" -WindowStyle Minimized
    Start-Sleep 5
} else {
    Write-Host "  ✅ Frontend đã đang chạy trên port 3000." -ForegroundColor Green
}

# 3. Thông báo sẵn sàng & mở trình duyệt
Write-Host "`n[3/3] Sẵn sàng truy cập!" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   🎉 AURABOOK ĐÃ KHỞI ĐỘNG THÀNH CÔNG!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  🛍️ Storefront (Khách hàng) : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  ⚙️ Admin Dashboard (Quản trị): http://localhost:9000/dashboard/" -ForegroundColor Cyan
Write-Host "  📧 Mailpit (Hòm thư test)   : http://localhost:8025" -ForegroundColor Cyan
Write-Host "  🔌 GraphQL API Backend       : http://localhost:8000/graphql/" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# Mở trình duyệt
Start-Process "http://localhost:3000"
Start-Process "http://localhost:9000/dashboard/"
