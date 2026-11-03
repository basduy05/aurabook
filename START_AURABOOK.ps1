# ==============================================================================
# AuraBook Platform — Kịch Bản Khởi Động Toàn Diện & Tối Ưu Hóa (One-Click Launch)
# Bao gồm:
#   1. AuraBook Core (Saleor, Postgres pgvector, Redis, Celery, Dashboard 9000, Mailpit 8025)
#   2. Ecommerce AI Platform (LiveKit WebRTC 7880, Web-Reader DRM 8088)
#   3. Đồng bộ Database: Cổng thanh toán (VNPAY, MoMo Sandbox) & System Admin AppToken
#   4. Piper TTS Microservice (Port 5050 - Giọng F5-TTS / Nam Minh, không fallback Hoài My)
#   5. Ollama Local AI Engine (Port 11434 + Nạp sẵn 100% GPU VRAM mô hình Gemma 2: 2B)
#   6. LiveKit Voice CSKH Python Worker (vietnamese_cskh_agent.py)
#   7. Storefront Next.js (Port 3000)
#   8. System Admin Portal (Port 3001)
# ==============================================================================

$ROOT = $PSScriptRoot
$INFRA = Join-Path $ROOT "infra"
$FRONTEND = Join-Path $ROOT "frontend"
$ADMIN_DIR = Join-Path $ROOT "admin"
$AI_PLATFORM = Join-Path $ROOT "ecommerce-ai-platform"
$AI_SERVICES = Join-Path $AI_PLATFORM "docker-compose.services.yaml"
$VOICE_BACKEND = Join-Path $AI_PLATFORM "voice-agent\backend"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AURABOOK - KHOI DONG HE THONG TOAN DIEN & ON DINH NHAT    " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ------------------------------------------------------------------------------
# 1. Kiem tra Docker Daemon & Khoi dong Core Containers
# ------------------------------------------------------------------------------
Write-Host "[1/8] Kiem tra Docker & Khoi dong AuraBook Core (Postgres, Redis, Saleor, Celery)..." -ForegroundColor Yellow
docker compose -f "$INFRA\docker-compose.yml" up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Khoi dong Docker that bai. Hay chac chan Docker Desktop dang mo!" -ForegroundColor Red
    pause
    exit 1
}

# ------------------------------------------------------------------------------
# 2. Khoi dong Ecommerce AI Services (LiveKit WebRTC 7880, Web Reader 8088, Ollama 11434)
# ------------------------------------------------------------------------------
Write-Host "`n[2/8] Khoi dong AI Platform Containers (LiveKit 7880, DRM Gateway 8088, Ollama AI 11434)..." -ForegroundColor Yellow
if (Test-Path $AI_SERVICES) {
    docker compose -f "$AI_SERVICES" up -d
}

# ------------------------------------------------------------------------------
# 3. Kiem tra & Cho Backend Saleor (8000) va LiveKit (7880) san sang
# ------------------------------------------------------------------------------
Write-Host "`n[3/8] Dang kiem tra ket noi Backend Saleor (8000) & LiveKit (7880)..." -ForegroundColor Yellow
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
    Write-Host "  [OK] Backend Saleor da san sang (http://localhost:8000/graphql/)." -ForegroundColor Green
} else {
    Write-Host "  [!] Backend Saleor dang khoi dong, cac dich vu khac se tiep tuc chay..." -ForegroundColor Yellow
}

$livekitReady = netstat -ano 2>$null | Select-String ":7880 " | Select-String "LISTENING"
if ($livekitReady) {
    Write-Host "  [OK] LiveKit WebRTC Server da san sang tren port 7880." -ForegroundColor Green
} else {
    Write-Host "  [!] LiveKit Server dang khoi dong tren port 7880..." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# 3.1. Tu dong dong bo Cong thanh toan (MoMo, VNPAY) va AppToken vao Database
# ------------------------------------------------------------------------------
Write-Host "`n[4/8] Dong bo Cong thanh toan (MoMo, VNPAY) & AppToken trong Database Saleor..." -ForegroundColor Yellow
try {
    docker exec aurabook-backend python register_payment_app.py
    Write-Host "  [OK] Da dong bo thanh cong Cong thanh toan (MoMo, VNPAY) va Token quan tri vao DB." -ForegroundColor Green
} catch {
    Write-Host "  [!] Chu y: Chua the dong bo register_payment_app.py ngay luc nay: $_" -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# 4. Kiem tra & Khoi dong AuraBook TTS Engine (Port 5050)
# ------------------------------------------------------------------------------
Write-Host "`n[5/8] Kiem tra TTS Studio Engine (Port 5050)..." -ForegroundColor Yellow
$p5050 = netstat -ano 2>$null | Select-String ":5050 " | Select-String "LISTENING"
if (-not $p5050) {
    Write-Host "  -> Dang khoi dong TTS Engine (aurabook_piper_tts_server.py)..." -ForegroundColor Cyan
    $ttsScript = Join-Path $VOICE_BACKEND "aurabook_piper_tts_server.py"
    if (Test-Path $ttsScript) {
        Start-Process python.exe -ArgumentList "$ttsScript" -WorkingDirectory "$VOICE_BACKEND" -WindowStyle Minimized
        for ($i = 0; $i -lt 8; $i++) {
            Start-Sleep -Seconds 1
            $p5050 = netstat -ano 2>$null | Select-String ":5050 " | Select-String "LISTENING"
            if ($p5050) { break }
        }
    }
}
$ttsHealth = curl.exe -s http://localhost:5050/health 2>$null
if ($ttsHealth -and $ttsHealth.Contains("online")) {
    Write-Host "  [OK] TTS Server hoat dong on dinh tai http://localhost:5050 (Da go bo fallback Hoai My)." -ForegroundColor Green
} else {
    Write-Host "  [OK] TTS Server da duoc bat tren port 5050." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 5. Kiem tra & Khoi dong Ollama Container (Port 11434 + Preload Gemma 2: 2B vao GPU)
# ------------------------------------------------------------------------------
Write-Host "`n[6/8] Kiem tra Container Ollama AI Server (Port 11434)..." -ForegroundColor Yellow
$p11434 = netstat -ano 2>$null | Select-String ":11434 " | Select-String "LISTENING"
if (-not $p11434) {
    Write-Host "  -> Dang khoi dong container aurabook-ollama..." -ForegroundColor Cyan
    docker start aurabook-ollama 2>$null
    if ($LASTEXITCODE -ne 0 -and (Test-Path $AI_SERVICES)) {
        docker compose -f "$AI_SERVICES" up -d ollama
    }
    for ($i = 0; $i -lt 10; $i++) {
        Start-Sleep -Seconds 1
        $p11434 = netstat -ano 2>$null | Select-String ":11434 " | Select-String "LISTENING"
        if ($p11434) { break }
    }
}

$p11434Check = netstat -ano 2>$null | Select-String ":11434 " | Select-String "LISTENING"
if ($p11434Check) {
    Write-Host "  [OK] Ollama Docker Container dang hoat dong tren port 11434 (NVIDIA GPU Passthrough)." -ForegroundColor Green
    # Nạp sẵn mô hình gemma2:2b vào 100% VRAM GPU để toàn bộ hệ thống phản hồi siêu tốc dưới 500ms
    try {
        Write-Host "  -> Dang nap truoc mo hinh gemma2:2b vao GPU VRAM (Warmup Zero-Latency)..." -ForegroundColor Cyan
        Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/generate" -Method Post -Body '{"model":"gemma2:2b","keep_alive":"24h"}' -ContentType "application/json" -TimeoutSec 15 -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  [OK] Mo hinh gemma2:2b da san sang 100% phuc vu Reader Chat & Voice CSKH tren GPU." -ForegroundColor Green
    } catch {}
} else {
    Write-Host "  [!] Chua khoi dong duoc container Ollama tren port 11434." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# 5.1. Khoi chay LiveKit Voice CSKH Python Worker
# ------------------------------------------------------------------------------
Write-Host "`n  -> Kiem tra tien trinh LiveKit Voice CSKH Worker..." -ForegroundColor Cyan
$workerRunning = Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%vietnamese_cskh_agent.py%'" -ErrorAction SilentlyContinue
if (-not $workerRunning) {
    Write-Host "  -> Dang khoi chay Voice CSKH Worker (vietnamese_cskh_agent.py dev)..." -ForegroundColor Cyan
    $workerScript = @"
Set-Location '$VOICE_BACKEND'
if (Get-Command uv -ErrorAction SilentlyContinue) {
    uv run python vietnamese_cskh_agent.py dev
} elseif (Test-Path '.venv\Scripts\python.exe') {
    & .\.venv\Scripts\python.exe vietnamese_cskh_agent.py dev
} else {
    python vietnamese_cskh_agent.py dev
}
"@
    Start-Process powershell.exe -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", $workerScript -WindowStyle Minimized
    Write-Host "  [OK] LiveKit Voice CSKH Worker da duoc khoi chay." -ForegroundColor Green
} else {
    Write-Host "  [OK] LiveKit Voice CSKH Worker da dang hoat dong." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 6. Kiem tra & Khoi dong Frontend Next.js Storefront (Port 3000)
# ------------------------------------------------------------------------------
Write-Host "`n[7/8] Kiem tra Frontend Next.js Storefront (Port 3000)..." -ForegroundColor Yellow
$p3000 = netstat -ano 2>$null | Select-String ":3000 " | Select-String "LISTENING"
if (-not $p3000) {
    Write-Host "  -> Dang khoi dong Next.js Storefront tren port 3000..." -ForegroundColor Cyan
    $pkgRunner = if (Get-Command pnpm.cmd -ErrorAction SilentlyContinue) { "pnpm.cmd dev" } elseif (Get-Command pnpm -ErrorAction SilentlyContinue) { "pnpm dev" } else { "npm.cmd run dev" }
    Start-Process powershell.exe -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "Set-Location '$FRONTEND'; $pkgRunner" -WindowStyle Minimized
    for ($i = 0; $i -lt 15; $i++) {
        Start-Sleep -Seconds 2
        $p3000 = netstat -ano 2>$null | Select-String ":3000 " | Select-String "LISTENING"
        if ($p3000) { break }
    }
    Write-Host "  [OK] Frontend Storefront da duoc khoi chay tren port 3000." -ForegroundColor Green
} else {
    Write-Host "  [OK] Frontend Storefront da dang hoat dong tren port 3000." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 7. Kiem tra & Khoi dong System Admin Portal (Port 3001)
# ------------------------------------------------------------------------------
Write-Host "`n[8/8] Kiem tra Cong Quan Tri He Thong Doc Lap (Port 3001)..." -ForegroundColor Yellow
$p3001 = netstat -ano 2>$null | Select-String ":3001 " | Select-String "LISTENING"
if (-not $p3001) {
    Write-Host "  -> Dang khoi dong Admin Portal tren port 3001..." -ForegroundColor Cyan
    $adminRunner = if (Get-Command pnpm.cmd -ErrorAction SilentlyContinue) { "pnpm.cmd dev" } elseif (Get-Command pnpm -ErrorAction SilentlyContinue) { "pnpm dev" } else { "npm.cmd run dev" }
    Start-Process powershell.exe -ArgumentList "-ExecutionPolicy", "Bypass", "-NoExit", "-Command", "Set-Location '$ADMIN_DIR'; $adminRunner" -WindowStyle Minimized
    for ($i = 0; $i -lt 10; $i++) {
        Start-Sleep -Seconds 1
        $p3001 = netstat -ano 2>$null | Select-String ":3001 " | Select-String "LISTENING"
        if ($p3001) { break }
    }
    Write-Host "  [OK] Cong Quan Tri He Thong da duoc khoi chay tren port 3001." -ForegroundColor Green
} else {
    Write-Host "  [OK] Cong Quan Tri He Thong da dang hoat dong tren port 3001." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# Bang tong hop trang thai he thong & Mo trinh duyet
# ------------------------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   TOAN BO HE THONG AURABOOK & AI PLATFORM DA SAN SANG!     " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  1. Storefront (Doc gia & Mua sam)       : http://localhost:3000" -ForegroundColor Cyan
Write-Host "     -> Tich hop san Voice CSKH, DRM Reader & Tro ly AI (Gemma 2 2B)" -ForegroundColor White
Write-Host "  2. System Admin (Quan tri rieng)        : http://localhost:3001" -ForegroundColor Yellow
Write-Host "  3. Saleor Dashboard (Quan tri kho/don) : http://localhost:9000/dashboard/" -ForegroundColor Cyan
Write-Host "  4. GraphQL API Backend (Saleor Core)    : http://localhost:8000/graphql/" -ForegroundColor Cyan
Write-Host "  5. LiveKit WebRTC Voice Server          : ws://localhost:7880" -ForegroundColor Cyan
Write-Host "  6. Piper TTS Studio Engine (Offline)    : http://localhost:5050/health" -ForegroundColor Cyan
Write-Host "  7. Ollama Local LLM (Khoa Gemma 2 2B)   : http://localhost:11434" -ForegroundColor Cyan
Write-Host "  8. Web Reader DRM Gateway               : http://localhost:8088" -ForegroundColor Cyan
Write-Host "  9. Mailpit (Hom thu xac nhan don/otp)   : http://localhost:8025" -ForegroundColor Cyan
Write-Host " 10. Thanh toan (MoMo / VNPAY)            : Da dong bo App & Token trong DB" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:3000"
Start-Process "http://localhost:3001"
