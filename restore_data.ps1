# ============================================================
# AuraBook — Automated Restore Script
# Chạy: .\restore_data.ps1  (Khôi phục bản mới nhất)
# Hoặc: .\restore_data.ps1 "backups\backup_..."
# ============================================================
param (
    [string]$BackupPath = ""
)
$ROOT = $PSScriptRoot
$scriptPath = Join-Path $ROOT "scripts\restore_aurabook.py"
if ($BackupPath) {
    & python $scriptPath $BackupPath
} else {
    & python $scriptPath
}
