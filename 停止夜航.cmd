@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "AFTER_HOURS_NODE=node"
where node >nul 2>nul
if errorlevel 1 (
  if exist "%ProgramFiles%\nodejs\node.exe" (
    set "AFTER_HOURS_NODE=%ProgramFiles%\nodejs\node.exe"
  ) else (
    echo 请先安装 Node.js 22 或更高版本，然后重新双击这个文件。
    pause
    exit /b 1
  )
)
"%AFTER_HOURS_NODE%" launcher.mjs --stop
pause
