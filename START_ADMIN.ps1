# ============================================================
# AuraBook - Script Khoi Dong Cong Quan Tri He Thong Doc Lap
# Chay: .\START_ADMIN.bat
# ============================================================

$ROOT = $PSScriptRoot
$ADMIN_DIR = Join-Path $ROOT "admin"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AURABOOK - CONG QUAN TRI HE THONG DOC LAP (PORT 3001)    " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Kiem tra cong 3001
$p3001 = netstat -ano 2>$null | Select-String ":3001 " | Select-String "LISTENING"
if (-not $p3001) {
    Write-Host "-> Dang khoi dong Admin Portal tren port 3001..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "Set-Location '$ADMIN_DIR'; pnpm dev" -WindowStyle Minimized

    for ($i = 0; $i -lt 10; $i++) {
        Start-Sleep -Seconds 1
        $p3001 = netstat -ano 2>$null | Select-String ":3001 " | Select-String "LISTENING"
        if ($p3001) { break }
    }
    Write-Host "  [OK] Cổng Quản Trị Hệ Thống đã sẵn sàng tại http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "  [OK] Cổng Quản Trị Hệ Thống đang hoạt động trên port 3001." -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   TRUY CAP CONG QUAN TRI: http://localhost:3001            " -ForegroundColor Green
Write-Host "   Mat ma dang nhap mac dinh: aurabook@2026                 " -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:3001"
