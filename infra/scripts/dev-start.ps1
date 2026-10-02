#!/usr/bin/env pwsh
# ============================================================
# AuraBook — Dev Startup Script
# Khởi động môi trường dev: postgres + redis → migrate → runserver
# Usage: .\infra\scripts\dev-start.ps1
# ============================================================

$ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$BACKEND = Join-Path $ROOT "backend"
$PYTHON = Join-Path $BACKEND ".venv\Scripts\python.exe"

Write-Host "🚀 AuraBook Dev Start" -ForegroundColor Cyan
Write-Host "=" * 50

# 1. Start postgres + redis
Write-Host "`n[1/4] Khởi động PostgreSQL + Redis..." -ForegroundColor Yellow
docker compose -f "$ROOT\infra\docker-compose.dev.yml" up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker compose thất bại. Hãy mở Docker Desktop trước!" -ForegroundColor Red
    exit 1
}

# 2. Đợi postgres healthy
Write-Host "`n[2/4] Chờ PostgreSQL sẵn sàng..." -ForegroundColor Yellow
$retries = 0
while ($retries -lt 20) {
    $health = docker inspect --format='{{.State.Health.Status}}' aurabook-postgres-dev 2>$null
    if ($health -eq "healthy") { break }
    Start-Sleep 2
    $retries++
    Write-Host "  Waiting... ($retries/20)"
}
if ($retries -eq 20) {
    Write-Host "❌ PostgreSQL không start được sau 40s" -ForegroundColor Red
    exit 1
}
Write-Host "  ✅ PostgreSQL ready!" -ForegroundColor Green

# 3. Set env và migrate
Write-Host "`n[3/4] Chạy migrate..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://aurabook_user:aurabook_secure_password@localhost:5432/aurabook_saleor"
$env:SECRET_KEY = "aurabook-local-dev-key-change-in-production"
$env:CACHE_URL = "redis://localhost:6379/0"
$env:ALLOWED_HOSTS = "localhost,127.0.0.1"
$env:HTTP_IP_FILTER_ALLOW_LOOPBACK_IPS = "True"
$env:PUBLIC_URL = "http://localhost:8000/"
$env:DASHBOARD_URL = "http://localhost:9000/"

Push-Location $BACKEND
& $PYTHON manage.py migrate --no-input 2>&1 | Tee-Object -Variable migrateOutput
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migrate thất bại!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "  ✅ Migrate OK!" -ForegroundColor Green

# 4. Chạy dev server
Write-Host "`n[4/4] Khởi động Saleor backend (port 8000)..." -ForegroundColor Yellow
Write-Host "  GraphQL: http://localhost:8000/graphql/" -ForegroundColor Cyan
Write-Host "  AuraBook APIs: http://localhost:8000/aurabook/" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C để dừng`n" -ForegroundColor Gray

& $PYTHON manage.py runserver 0.0.0.0:8000
Pop-Location
