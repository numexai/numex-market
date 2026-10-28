@echo off
chcp 65001 >nul
title Numex Kaşe Stüdyo
cd /d "%~dp0"

echo.
echo  ================================================
echo    NUMEX KASE STUDYO - Lazer Markalama
echo  ================================================
echo.
echo  Program baslatiliyor, lutfen bekleyin...
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo  [HATA] Bilgisayarda Node.js bulunamadi.
  echo  Lutfen https://nodejs.org adresinden LTS surumu kurun.
  echo.
  pause
  exit /b 1
)

start "" http://localhost:4175

echo  Tarayici aciliyor...
echo  Program calisiyor. Bu pencereyi KAPATMAYIN.
echo  Kapatmak icin bu pencerede Ctrl+C basin.
echo.
node server/server.js

pause
