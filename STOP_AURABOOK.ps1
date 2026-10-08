# ============================================================
# AuraBook — Script Dừng Hệ Thống An Toàn (Tự động sao lưu)
# Chạy: .\STOP_AURABOOK.ps1
# ============================================================

$ROOT = $PSScriptRoot
$INFRA = Join-Path $ROOT "infra"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   🛑 AURABOOK — DỪNG HỆ THỐNG AN TOÀN" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Tự động sao lưu dữ liệu trước khi dừng
Write-Host "[1/3] Tự động tạo bản sao lưu snapshot mới nhất..." -ForegroundColor Yellow
python (Join-Path $ROOT "scripts\backup_aurabook.py")

# 2. Dừng Docker containers (Giữ nguyên volume, không dùng -v)
Write-Host "`n[2/3] Dừng các Docker container an toàn..." -ForegroundColor Yellow
docker compose -f "$INFRA\docker-compose.yml" stop
Write-Host "  ✅ Các container đã dừng, toàn bộ volumes và dữ liệu được bảo toàn nguyên vẹn." -ForegroundColor Green

# 3. Tắt Frontend Next.js nếu đang chạy
Write-Host "`n[3/3] Dọn dẹp tiến trình Frontend trên port 3000..." -ForegroundColor Yellow
$p3 = netstat -ano 2>$null | Select-String ":3000 " | Select-String "LISTENING"
if ($p3) {
    $pid3 = (($p3 -split '\s+')[-1])
    Stop-Process -Id $pid3 -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Đã dừng tiến trình port 3000 (PID: $pid3)." -ForegroundColor Green
} else {
    Write-Host "  ✅ Port 3000 đã giải phóng." -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   ĐÃ DỪNG HỆ THỐNG THÀNH CÔNG!" -ForegroundColor Green
Write-Host "   Lần sau muốn bật lại chỉ cần chạy: .\START_AURABOOK.bat" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
