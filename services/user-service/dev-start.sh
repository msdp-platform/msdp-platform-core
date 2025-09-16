#!/bin/bash

# User Service Fast Development Startup Script
set -e

SERVICE_NAME="user-service"
CONTAINER_NAME="msdp-user-service-dev"
PORT=3003

echo "👤 Starting MSDP User Service (Customer Authentication)"
echo "===================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Quick cleanup of existing containers
echo "🧹 Quick cleanup..."
docker-compose -f docker-compose.dev.yml down --remove-orphans > /dev/null 2>&1 || true

# Start services with optimized build
echo "🔨 Starting customer user service..."
docker-compose -f docker-compose.dev.yml up --build -d --force-recreate

# Wait for database to be ready
echo "⏳ Waiting for database..."
MAX_DB_RETRIES=15
DB_RETRY_COUNT=0

while [ $DB_RETRY_COUNT -lt $MAX_DB_RETRIES ]; do
    if docker exec msdp-user-postgres-dev pg_isready -U msdp_user -d msdp_users > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    DB_RETRY_COUNT=$((DB_RETRY_COUNT + 1))
    echo "⏳ Waiting for database... ($DB_RETRY_COUNT/$MAX_DB_RETRIES)"
    sleep 2
done

# Wait for service to be ready
echo "⏳ Checking service health..."
sleep 3

MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        echo "✅ User Service is healthy!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Waiting for service... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Service failed to start. Check logs with:"
    echo "   docker-compose -f docker-compose.dev.yml logs user-service"
    exit 1
fi

# Check management tools
sleep 5
if curl -f http://localhost:8084 > /dev/null 2>&1; then
    echo "✅ PgAdmin is ready!"
else
    echo "⏳ PgAdmin still starting..."
fi

echo ""
echo "🎉 User Service is ready!"
echo "===================================================="
echo "👤 Service: http://localhost:$PORT"
echo "🔍 Health: http://localhost:$PORT/health"
echo "🗄️ PgAdmin: http://localhost:8084 (admin@msdp.com / admin123)"
echo ""
echo "🚀 User Service Functions:"
echo "  - Customer registration & authentication"
echo "  - User profile management"
echo "  - Session management with cookies"
echo "  - User preferences & settings"
echo "  - Location management"
echo "  - Multi-country support"
echo ""
echo "📡 API Endpoints:"
echo "  - POST /api/auth/register"
echo "  - POST /api/auth/login"
echo "  - GET  /api/auth/session"
echo "  - POST /api/auth/logout"
echo "  - GET  /api/users/profile"
echo "  - PUT  /api/users/profile"
echo "  - POST /api/users/location"
echo ""
echo "🔧 Quick commands:"
echo "  logs:    docker-compose -f docker-compose.dev.yml logs -f"
echo "  stop:    docker-compose -f docker-compose.dev.yml down"
echo "  restart: docker-compose -f docker-compose.dev.yml restart $SERVICE_NAME"
echo "  db:      docker exec msdp-user-postgres-dev psql -U msdp_user -d msdp_users"
echo ""
