# ==============================================================================
# Script Kiểm Định Chất Lượng RAG (Ragas Evaluation Pipeline) Cho Dify RAG
# ==============================================================================

$SCRIPT_DIR = $PSScriptRoot
Set-Location $SCRIPT_DIR

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AURABOOK AI EVALUATION — RAGAS BENCHMARK PIPELINE        " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path ".venv")) {
    Write-Host "[1/2] Đang khởi tạo môi trường Python virtualenv..." -ForegroundColor Yellow
    python -m venv .venv
}

Write-Host "[1/2] Kích hoạt môi trường và kiểm tra thư viện..." -ForegroundColor Yellow
& .\.venv\Scripts\activate.ps1

Write-Host "[2/2] Bắt đầu đánh giá độ trung thực (Faithfulness) và mức độ liên quan (Relevancy)..." -ForegroundColor Yellow
python evaluate_dify_rag.py

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "   KIỂM ĐỊNH HOÀN TẤT!                                      " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
