@echo off
chcp 65001 >nul
echo Dang khoi phuc toan bo he thong AuraBook tu ban sao luu moi nhat...
python "%~dp0scripts\restore_aurabook.py" %*
pause
