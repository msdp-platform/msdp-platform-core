#!/bin/bash

# MSDP Platform - Master Startup Script
echo "🚀 Starting Complete MSDP Platform..."
echo "========================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Create network if it doesn't exist
echo "🌐 Creating Docker network..."
docker network create msdp-network 2>/dev/null || true

# Function to start service and check health
start_service() {
    local service_name=$1
    local service_path=$2
    local health_url=$3
    local display_name=$4
    
    echo "🔨 Starting $display_name..."
    cd "$service_path"
    docker-compose -f docker-compose.dev.yml up -d --build
    
    if [ ! -z "$health_url" ]; then
        echo "⏳ Waiting for $display_name to be ready..."
        for i in {1..30}; do
            if curl -f "$health_url" > /dev/null 2>&1; then
                echo "✅ $display_name is healthy"
                break
            fi
            sleep 2
        done
    fi
}

# Start backend services first
echo ""
echo "🔧 Starting Backend Services..."
echo "================================"

start_service "api-gateway" "/Users/santanu/github/msdp-platform-core/api-gateway" "http://localhost:3000/health" "API Gateway"
start_service "location-service" "/Users/santanu/github/msdp-location-service" "http://localhost:3001/health" "Location Service"
start_service "merchant-service" "/Users/santanu/github/msdp-platform-core/services/merchant-service" "http://localhost:3002/health" "Merchant Service"
start_service "user-service" "/Users/santanu/github/msdp-platform-core/services/user-service" "http://localhost:3003/health" "User Service"
start_service "admin-service" "/Users/santanu/github/msdp-platform-core/services/admin-service" "http://localhost:3005/health" "Admin Service"
start_service "order-service" "/Users/santanu/github/msdp-platform-core/services/order-service" "http://localhost:3006/health" "Order Service"
start_service "payment-service" "/Users/santanu/github/msdp-platform-core/services/payment-service" "http://localhost:3007/health" "Payment Service"

# Start frontend applications
echo ""
echo "🖥️  Starting Frontend Applications..."
echo "===================================="

start_service "admin-dashboard" "/Users/santanu/github/msdp-admin-frontends/apps/admin-dashboard" "http://localhost:4000/health" "Admin Dashboard"
start_service "customer-app" "/Users/santanu/github/msdp-customer-frontends/apps/customer-app" "http://localhost:4002" "Customer App"
start_service "merchant-webapp" "/Users/santanu/github/msdp-merchant-frontends/apps/merchant-webapp" "http://localhost:4003/health" "Merchant Frontend"

echo ""
echo "🎉 MSDP Platform Started Successfully!"
echo "======================================"
echo ""
echo "📊 Backend Services:"
echo "  • API Gateway:      http://localhost:3000"
echo "  • Location Service: http://localhost:3001"
echo "  • Merchant Service: http://localhost:3002"
echo "  • User Service:     http://localhost:3003"
echo "  • Admin Service:    http://localhost:3005"
echo "  • Order Service:    http://localhost:3006"
echo "  • Payment Service:  http://localhost:3007"
echo ""
echo "🖥️  Frontend Applications:"
echo "  • Admin Dashboard:  http://localhost:4000"
echo "  • Customer App:     http://localhost:4002"
echo "  • Merchant Portal:  http://localhost:4003"
echo ""
echo "🗄️  Database Management:"
echo "  • Location PgAdmin: http://localhost:8080"
echo "  • Merchant PgAdmin: http://localhost:8083"
echo "  • User PgAdmin:     http://localhost:8084"
echo "  • Order PgAdmin:    http://localhost:8085"
echo "  • Admin PgAdmin:    http://localhost:8087"
echo "  • Payment PgAdmin:  http://localhost:8089"
echo ""
echo "🔧 Management Commands:"
echo "  • View all containers: docker ps"
echo "  • Stop all services: docker stop \$(docker ps -q)"
echo "  • View logs: docker logs <container-name>"
echo ""
echo "⚠️  IMPORTANT: Only use Docker containers, never run npm dev outside Docker!"
echo ""
