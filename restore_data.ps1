# ============================================================
# AuraBook - Script Khoi Phuc Du Lieu
# Chay: .\restore_data.ps1  (Khoi phuc ban moi nhat)
# Hoac: .\restore_data.ps1 "backups\backup_..."
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
