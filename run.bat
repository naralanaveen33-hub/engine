@echo off
echo ============================================================
echo   AQUACROP - Docker Run Script
echo ============================================================
echo.

REM Check Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

echo [1/4] Building Docker images...
docker compose build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker build failed!
    pause
    exit /b 1
)
echo [OK] Build successful.
echo.

echo [2/4] Starting containers...
docker compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker compose up failed!
    pause
    exit /b 1
)
echo [OK] Containers started.
echo.

echo [3/4] Waiting for backend to be ready...
timeout /t 5 /nobreak >nul

:check_backend
powershell -Command "try { $r = Invoke-WebRequest -Uri http://localhost:8000/api/v1/health -UseBasicParsing -TimeoutSec 3; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   Waiting for backend...
    timeout /t 3 /nobreak >nul
    goto check_backend
)
echo [OK] Backend is running at http://localhost:8000
echo.

echo [4/4] Checking frontend...
powershell -Command "try { $r = Invoke-WebRequest -Uri http://localhost:5173 -UseBasicParsing -TimeoutSec 3; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo   Waiting for frontend...
    timeout /t 3 /nobreak >nul
)
echo [OK] Frontend is running at http://localhost:5173
echo.

echo ============================================================
echo   AQUACROP IS RUNNING!
echo ============================================================
echo.
echo   Frontend:  http://localhost:5173
echo   Backend:   http://localhost:8000
echo   API Docs:  http://localhost:8000/docs
echo.
echo   View OTP codes:
echo     docker compose logs -f backend
echo.
echo   Stop AquaCrop:
echo     docker compose down
echo.
echo ============================================================
echo.
echo Opening AquaCrop in your browser...
start http://localhost:5173
echo.
echo Press any key to view backend logs (OTP will appear here)...
pause >nul
docker compose logs -f backend
