@echo off
title Strangelet Stitch — AI Audio-Reactive Video Engine
set TMP=D:\mv-auto-e\.cache\tmp
set TEMP=D:\mv-auto-e\.cache\tmp
set PIP_CACHE_DIR=D:\mv-auto-e\.cache\pip
cd /d D:\mv-auto-e
echo ===================================================
echo   Strangelet Stitch — Audio-Reactive Video Engine
echo   Booting local engine on http://127.0.0.1:8765 ...
echo ===================================================

:: Open browser after 2.5s delay to ensure Python/Uvicorn is listening
start "" /min cmd /c "timeout /t 3 /nobreak >nul & start http://127.0.0.1:8765"

"D:\mv-auto-e\.venv\Scripts\python.exe" -m uvicorn backend.main:app --host 127.0.0.1 --port 8765
pause
