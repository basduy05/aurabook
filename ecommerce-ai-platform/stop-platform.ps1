# ==============================================================================
# Script dừng toàn bộ nền tảng Ecommerce AI Platform trên Localhost
# ==============================================================================

Write-Host "Đang dừng toàn bộ container Ecommerce AI Platform..." -ForegroundColor Yellow

$PlatformRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $PlatformRoot

docker compose -f docker-compose.services.yaml down
docker compose -f core-rag/dify/docker/docker-compose.yaml down

Write-Host "Đã dừng hoàn tất toàn bộ dịch vụ!" -ForegroundColor Green
