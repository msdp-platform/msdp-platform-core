#!/bin/bash

# API Gateway Fast Development Startup Script
set -e

SERVICE_NAME="api-gateway"
CONTAINER_NAME="msdp-api-gateway-dev"
PORT=3000

echo "🚀 Starting MSDP API Gateway (Fast Mode)"
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Quick cleanup of existing containers
echo "🧹 Quick cleanup..."
docker-compose down --remove-orphans > /dev/null 2>&1 || true

# Start services with optimized build
echo "🔨 Starting services (optimized)..."
docker-compose -f docker-compose.dev.yml up --build -d --force-recreate

# Quick health check
echo "⏳ Quick health check..."
sleep 3

MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        echo "✅ API Gateway is healthy!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Waiting for service... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Service failed to start. Check logs with:"
    echo "   docker-compose -f docker-compose.dev.yml logs"
    exit 1
fi

# Check Redis
if docker exec $CONTAINER_NAME-redis sh -c 'redis-cli ping' > /dev/null 2>&1; then
    echo "✅ Redis is healthy!"
else
    echo "⚠️ Redis might still be starting..."
fi

echo ""
echo "🎉 API Gateway is ready!"
echo "========================================"
echo "📡 Service: http://localhost:$PORT"
echo "🔍 Health: http://localhost:$PORT/health"
echo "📊 Redis Commander: http://localhost:8081"
echo ""
echo "🔧 Quick commands:"
echo "  logs:    docker-compose -f docker-compose.dev.yml logs -f"
echo "  stop:    docker-compose -f docker-compose.dev.yml down"
echo "  restart: docker-compose -f docker-compose.dev.yml restart $SERVICE_NAME"
echo ""