#!/bin/bash

# Order Service Fast Development Startup Script
set -e

SERVICE_NAME="order-service"
CONTAINER_NAME="msdp-order-service-dev"
PORT=3006

echo "🛒 Starting MSDP Order Service (Cart & Order Management)"
echo "======================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Quick cleanup of existing containers
echo "🧹 Quick cleanup..."
docker-compose -f docker-compose.dev.yml down --remove-orphans > /dev/null 2>&1 || true

# Start services with optimized build
echo "🔨 Starting order management service..."
docker-compose -f docker-compose.dev.yml up --build -d --force-recreate

# Wait for database to be ready
echo "⏳ Waiting for database..."
MAX_DB_RETRIES=15
DB_RETRY_COUNT=0

while [ $DB_RETRY_COUNT -lt $MAX_DB_RETRIES ]; do
    if docker exec msdp-order-postgres-dev pg_isready -U msdp_user -d msdp_orders > /dev/null 2>&1; then
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
        echo "✅ Order Service is healthy!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Waiting for service... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Service failed to start. Check logs with:"
    echo "   docker-compose -f docker-compose.dev.yml logs order-service"
    exit 1
fi

# Check management tools
sleep 5
if curl -f http://localhost:8088 > /dev/null 2>&1; then
    echo "✅ PgAdmin is ready!"
else
    echo "⏳ PgAdmin still starting..."
fi

echo ""
echo "🎉 Order Service is ready!"
echo "======================================================"
echo "🛒 Service: http://localhost:$PORT"
echo "🔍 Health: http://localhost:$PORT/health"
echo "🗄️ PgAdmin: http://localhost:8088 (admin@msdp.com / admin123)"
echo ""
echo "🚀 Order Service Functions:"
echo "  - Shopping cart management"
echo "  - Order creation & processing"
echo "  - Order status tracking"
echo "  - Order history management"
echo "  - Real-time order updates"
echo ""
echo "📡 API Endpoints:"
echo "  - POST /api/carts/create"
echo "  - POST /api/carts/{id}/items"
echo "  - GET  /api/carts/{id}"
echo "  - POST /api/orders/create"
echo "  - GET  /api/orders/{id}"
echo "  - GET  /api/tracking/{orderId}"
echo ""
echo "🔧 Quick commands:"
echo "  logs:    docker-compose -f docker-compose.dev.yml logs -f"
echo "  stop:    docker-compose -f docker-compose.dev.yml down"
echo "  restart: docker-compose -f docker-compose.dev.yml restart $SERVICE_NAME"
echo "  db:      docker exec msdp-order-postgres-dev psql -U msdp_user -d msdp_orders"
echo ""
