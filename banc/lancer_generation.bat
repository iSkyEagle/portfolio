@echo off
chcp 65001 >nul
cd /d "%~dp0"
rem Python d'Anaconda en priorite : la commande "python" de Windows peut pointer vers le Microsoft Store.
set "PY=%USERPROFILE%\anaconda3\python.exe"
if not exist "%PY%" set "PY=%USERPROFILE%\miniconda3\python.exe"
if not exist "%PY%" set "PY=python"
"%PY%" generer.py %*
echo.
pause
