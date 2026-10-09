# ============================================================
# AuraBook - Script Khoi Dong Toan Bo He Thong
# Chay: .\START_AURABOOK.bat
# ============================================================

$ROOT = $PSScriptRoot
$INFRA = Join-Path $ROOT "infra"
$FRONTEND = Join-Path $ROOT "frontend"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AURABOOK - KHOI DONG HE THONG TOAN DIEN" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Khoi dong cac Docker container (Giu nguyen volume & du lieu)
Write-Host "[1/3] Khoi dong Docker containers..." -ForegroundColor Yellow
docker compose -f "$INFRA\docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Khoi dong Docker that bai. Hay chac chan Docker Desktop dang chay!" -ForegroundColor Red
    pause
    exit 1
}

# 2. Kiem tra Frontend Next.js (port 3000)
Write-Host "`n[2/3] Kiem tra Frontend Next.js (Storefront)..." -ForegroundColor Yellow
$p3 = netstat -ano 2>$null | Select-String ":3000 " | Select-String "LISTENING"
if (-not $p3) {
    Write-Host "  -> Dang khoi dong Next.js dev server tren port 3000..." -ForegroundColor Cyan
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$FRONTEND'; npm run dev" -WindowStyle Minimized
    Start-Sleep 5
} else {
    Write-Host "  [OK] Frontend da dang chay tren port 3000." -ForegroundColor Green
}

# 3. Thong bao san sang & mo trinh duyet
Write-Host "`n[3/3] San sang truy cap!" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   AURABOOK DA KHOI DONG THANH CONG!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Storefront (Khach hang) : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Admin Dashboard (Quan tri): http://localhost:9000/dashboard/" -ForegroundColor Cyan
Write-Host "  Mailpit (Hom thu test)   : http://localhost:8025" -ForegroundColor Cyan
Write-Host "  GraphQL API Backend       : http://localhost:8000/graphql/" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# Mo trinh duyet
Start-Process "http://localhost:3000"
Start-Process "http://localhost:9000/dashboard/"
