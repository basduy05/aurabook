# ============================================================
# AuraBook - Script Dung He Thong An Toan (Tu dong sao luu)
# Chay: .\STOP_AURABOOK.bat
# ============================================================

$ROOT = $PSScriptRoot
$INFRA = Join-Path $ROOT "infra"
$AI_PLATFORM = Join-Path $ROOT "ecommerce-ai-platform"
$AI_SERVICES = Join-Path $AI_PLATFORM "docker-compose.services.yaml"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AURABOOK - DUNG HE THONG AN TOAN & GIAI PHONG TAI NGUYEN  " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Tu dong sao luu du lieu truoc khi dung
Write-Host "[1/4] Tu dong tao ban sao luu snapshot moi nhat..." -ForegroundColor Yellow
if (Test-Path (Join-Path $ROOT "scripts\backup_aurabook.py")) {
    python (Join-Path $ROOT "scripts\backup_aurabook.py")
}

# 2. Dung Docker containers AuraBook Core & AI Platform (Giu nguyen volume)
Write-Host "`n[2/4] Dung cac Docker container an toan..." -ForegroundColor Yellow
docker compose -f "$INFRA\docker-compose.yml" stop 2>$null
docker stop aurabook-dashboard aurabook-backend aurabook-celery aurabook-postgres aurabook-mailpit aurabook-redis 2>$null
if (Test-Path $AI_SERVICES) {
    docker compose -f "$AI_SERVICES" stop 2>$null
    docker stop ecommerce-livekit ecommerce-web-reader aurabook-ollama 2>$null
}
Write-Host "  [OK] Cac container Docker da dung, toan bo du lieu va volumes duoc bao toan." -ForegroundColor Green

# 3. Don dep tien trinh Node/Web (Port 3000 Storefront & Port 3001 Admin)
Write-Host "`n[3/4] Giai phong cac cong 3000 (Storefront) va 3001 (Admin)..." -ForegroundColor Yellow
foreach ($port in @(3000, 3001)) {
    $pids = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($pids) {
        foreach ($p in $pids) {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            Write-Host "  [OK] Da dung tien trinh port $port (PID: $p)." -ForegroundColor Green
        }
    } else {
        Write-Host "  [OK] Port $port da sach." -ForegroundColor Green
    }
}

# 4. Don dep Piper TTS (Port 5050)
Write-Host "`n[4/5] Giai phong Piper TTS Engine (Port 5050)..." -ForegroundColor Yellow
$p5050 = Get-NetTCPConnection -LocalPort 5050 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($p5050) {
    foreach ($p in $p5050) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        Write-Host "  [OK] Da dung tien trinh Piper TTS (PID: $p)." -ForegroundColor Green
    }
} else {
    Write-Host "  [OK] Port 5050 da sach." -ForegroundColor Green
}

# 5. Don dep LiveKit Voice CSKH Worker
Write-Host "`n[5/5] Giai phong LiveKit Voice CSKH Worker..." -ForegroundColor Yellow
$workerProcesses = Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%vietnamese_cskh_agent.py%'" -ErrorAction SilentlyContinue
if ($workerProcesses) {
    foreach ($proc in $workerProcesses) {
        Stop-Process -Id $proc.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "  [OK] Da dung Voice Worker (PID: $($proc.ProcessId))." -ForegroundColor Green
    }
} else {
    Write-Host "  [OK] Voice Worker da duoc giai phong." -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   DA DUNG TOAN BO HE THONG THANH CONG!                     " -ForegroundColor Green
Write-Host "   Lan sau muon bat lai chi can chay: .\START.bat hoac .\START_AURABOOK.bat" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
