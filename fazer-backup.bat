@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==============================
echo   Backup do AG Tech
echo ==============================
echo.
set /p BACKUP_EMAIL=Seu e-mail de login: 
set /p BACKUP_PASSWORD=Sua senha: 
echo.
call node scripts/backup.mjs
echo.
echo Pronto. Os arquivos ficam na pasta "backups".
echo Copie essa pasta para o Google Drive ou um pen drive.
pause
