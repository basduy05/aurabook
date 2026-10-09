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

# 1. Khoi dong cac Docker container (Giu nguyen volume va du lieu)
Write-Host "[1/3] Khoi dong Docker containers..." -ForegroundColor Yellow
docker compose -f "$INFRA\docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Khoi dong Docker that bai. Hay chac chan Docker Desktop dang chay!" -ForegroundColor Red
    pause
    exit 1
}

# Cho backend Saleor san sang tren port 8000
Write-Host "  -> Dang kiem tra Backend Saleor (port 8000)..." -ForegroundColor Cyan
$backendReady = $false
for ($i = 0; $i -lt 15; $i++) {
    $code = curl.exe -s -o NUL -w "%{http_code}" http://localhost:8000/graphql/ 2>$null
    if ($code -eq "200") {
        $backendReady = $true
        break
    }
    Start-Sleep -Seconds 2
}
if ($backendReady) {
    Write-Host "  [OK] Backend Saleor da san sang phuc vu." -ForegroundColor Green
} else {
    Write-Host "  [!] Backend dang khoi dong, tiep tuc bat storefront..." -ForegroundColor Yellow
}

# 2. Kiem tra Frontend Next.js (port 3000)
Write-Host "`n[2/3] Kiem tra Frontend Next.js (Storefront)..." -ForegroundColor Yellow
$p3 = netstat -ano 2>$null | Select-String ":3000 " | Select-String "LISTENING"
if (-not $p3) {
    Write-Host "  -> Dang khoi dong Next.js dev server tren port 3000..." -ForegroundColor Cyan
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$FRONTEND'; npm run dev" -WindowStyle Minimized
    for ($i = 0; $i -lt 10; $i++) {
        Start-Sleep -Seconds 2
        $p3 = netstat -ano 2>$null | Select-String ":3000 " | Select-String "LISTENING"
        if ($p3) { break }
    }
    Write-Host "  [OK] Frontend da duoc khoi chay tren port 3000." -ForegroundColor Green
} else {
    Write-Host "  [OK] Frontend da dang chay tren port 3000." -ForegroundColor Green
}

# 3. Thong bao san sang va mo trinh duyet
Write-Host "`n[3/3] San sang truy cap!" -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   AURABOOK DA KHOI DONG THANH CONG!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Storefront (Khach hang)   : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Admin Dashboard (Quan tri): http://localhost:9000/dashboard/" -ForegroundColor Cyan
Write-Host "  Mailpit (Hom thu test)     : http://localhost:8025" -ForegroundColor Cyan
Write-Host "  GraphQL API Backend        : http://localhost:8000/graphql/" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

# Mo trinh duyet
Start-Process "http://localhost:3000"
Start-Process "http://localhost:9000/dashboard/"
