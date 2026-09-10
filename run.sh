#!/bin/bash
echo "============================================================"
echo "  AQUACROP - Docker Run Script"
echo "============================================================"
echo ""

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker first."
    exit 1
fi

echo "[1/4] Building Docker images..."
docker compose build
if [ $? -ne 0 ]; then
    echo "[ERROR] Docker build failed!"
    exit 1
fi
echo "[OK] Build successful."
echo ""

echo "[2/4] Starting containers..."
docker compose up -d
if [ $? -ne 0 ]; then
    echo "[ERROR] Docker compose up failed!"
    exit 1
fi
echo "[OK] Containers started."
echo ""

echo "[3/4] Waiting for backend to be ready..."
sleep 5
until curl -sf http://localhost:8000/api/v1/health > /dev/null 2>&1; do
    echo "  Waiting for backend..."
    sleep 3
done
echo "[OK] Backend is running at http://localhost:8000"
echo ""

echo "[4/4] Checking frontend..."
until curl -sf http://localhost:5173 > /dev/null 2>&1; do
    echo "  Waiting for frontend..."
    sleep 3
done
echo "[OK] Frontend is running at http://localhost:5173"
echo ""

echo "============================================================"
echo "  AQUACROP IS RUNNING!"
echo "============================================================"
echo ""
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo "  View OTP codes:"
echo "    docker compose logs -f backend"
echo ""
echo "  Stop AquaCrop:"
echo "    docker compose down"
echo ""
echo "============================================================"
echo ""
echo "Showing backend logs (OTP codes appear here)..."
echo "Press Ctrl+C to stop."
echo ""
docker compose logs -f backend
