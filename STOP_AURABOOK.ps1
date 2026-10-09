# ============================================================
# AuraBook - Script Dung He Thong An Toan (Tu dong sao luu)
# Chay: .\STOP_AURABOOK.bat
# ============================================================

$ROOT = $PSScriptRoot
$INFRA = Join-Path $ROOT "infra"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AURABOOK - DUNG HE THONG AN TOAN" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Tu dong sao luu du lieu truoc khi dung
Write-Host "[1/3] Tu dong tao ban sao luu snapshot moi nhat..." -ForegroundColor Yellow
python (Join-Path $ROOT "scripts\backup_aurabook.py")

# 2. Dung Docker containers (Giu nguyen volume)
Write-Host "`n[2/3] Dung cac Docker container an toan..." -ForegroundColor Yellow
docker compose -f "$INFRA\docker-compose.yml" stop
docker stop aurabook-dashboard aurabook-backend aurabook-celery aurabook-postgres aurabook-mailpit aurabook-redis 2>$null
Write-Host "  [OK] Cac container da dung, toan bo du lieu va volumes duoc bao toan." -ForegroundColor Green

# 3. Tat Frontend Next.js neu dang chay tren port 3000
Write-Host "`n[3/3] Don dep tien trinh Frontend tren port 3000..." -ForegroundColor Yellow
$pids = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($pids) {
    foreach ($p in $pids) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Host "  [OK] Da dung tien trinh port 3000 (PID: $p)." -ForegroundColor Green
    }
} else {
    $p3 = netstat -ano 2>$null | Select-String ":3000 " | Select-String "LISTENING"
    if ($p3) {
        $pid3 = (($p3 -split '\s+')[-1])
        Stop-Process -Id $pid3 -Force -ErrorAction SilentlyContinue
        Write-Host "  [OK] Da dung tien trinh port 3000 (PID: $pid3)." -ForegroundColor Green
    } else {
        Write-Host "  [OK] Port 3000 da duoc giai phong." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   DA DUNG HE THONG THANH CONG!" -ForegroundColor Green
Write-Host "   Lan sau muon bat lai chi can chay: .\START_AURABOOK.bat" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
