# ============================================================
# AuraBook - Script Sao Luu Du Lieu Tu Dong
# Chay: .\backup_data.ps1
# ============================================================
$ROOT = $PSScriptRoot
& python (Join-Path $ROOT "scripts\backup_aurabook.py")
