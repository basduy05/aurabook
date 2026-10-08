@echo off
chcp 65001 >nul
echo Dang sao luu toan bo he thong AuraBook...
python "%~dp0scripts\backup_aurabook.py"
pause
