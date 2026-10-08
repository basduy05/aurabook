# ============================================================
# AuraBook — Automated Backup & Snapshot Script
# Chạy: .\backup_data.ps1
# ============================================================
$ROOT = $PSScriptRoot
& python (Join-Path $ROOT "scripts\backup_aurabook.py")
