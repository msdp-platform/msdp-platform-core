#!/bin/bash

# MSDP Platform Development Control Script - Optimized
# Usage: ./dev-control.sh [command] [service]

set -e

# Load port configuration
PORTS_CONFIG="/Users/santanu/github/msdp-platform-core/config/ports.json"

# Service definitions with ports from config (location-service is now standalone)
SERVICES=("api-gateway:3000" "merchant-service:3002")
STANDALONE_SERVICES=("location-service:3001")
FRONTEND_SERVICES=("admin-dashboard:4000" "customer-app:4001" "merchant-webapp:4002")

show_help() {
    echo "🚀 MSDP Platform Development Control (Optimized)"
    echo "================================================"
    echo ""
    echo "Usage: ./dev-control.sh [command] [service]"
    echo ""
    echo "Commands:"
    echo "  start [service]    - Start a specific service or all services"
    echo "  stop [service]     - Stop a specific service or all services"
    echo "  restart [service]  - Restart a specific service or all services"
    echo "  status            - Show status of all services"
    echo "  logs [service]    - Show logs for a specific service"
    echo "  clean             - Clean up all containers and volumes"
    echo "  health            - Check health of all running services"
    echo "  ports             - Show port allocation"
    echo "  quick [service]   - Quick start with minimal output"
    echo ""
    echo "Services:"
    echo "  Backend Services (Platform-Core):"
    for service_port in "${SERVICES[@]}"; do
        service=$(echo $service_port | cut -d: -f1)
        port=$(echo $service_port | cut -d: -f2)
        echo "    - $service (Port $port)"
    done
    echo "  Standalone Services:"
    for service_port in "${STANDALONE_SERVICES[@]}"; do
        service=$(echo $service_port | cut -d: -f1)
        port=$(echo $service_port | cut -d: -f2)
        echo "    - $service (Port $port) - Run from msdp-location-service repo"
    done
    echo "  Frontend Services:"
    for service_port in "${FRONTEND_SERVICES[@]}"; do
        service=$(echo $service_port | cut -d: -f1)
        port=$(echo $service_port | cut -d: -f2)
        echo "    - $service (Port $port)"
    done
    echo ""
    echo "Examples:"
    echo "  ./dev-control.sh quick location-service"
    echo "  ./dev-control.sh start all"
    echo "  ./dev-control.sh status"
    echo "  ./dev-control.sh ports"
    echo ""
}

show_ports() {
    echo "📋 MSDP Port Allocation"
    echo "======================"
    echo ""
    echo "🔧 Backend Services:"
    echo "  api-gateway:       3000 (Redis: 6379, Commander: 8081)"
    echo "  location-service:  3001 (DB: 5433, Redis: 6380, PgAdmin: 8080, Commander: 8082)"
    echo "  merchant-service:  3002 (DB: 5434, PgAdmin: 8083)"
    echo ""
    echo "🎨 Frontend Services:"
    echo "  admin-dashboard:   4000 (DB: 5437, PgAdmin: 8086)"
    echo "  customer-app:      4001"
    echo "  merchant-webapp:   4002"
    echo ""
    echo "🌍 Country-Specific:"
    echo "  customer-usa:      5001"
    echo "  customer-india:    5002" 
    echo "  customer-uk:       5003"
    echo "  customer-singapore: 5004"
    echo ""
}

check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker first."
        exit 1
    fi
}

start_service() {
    local service=$1
    local quiet=${2:-false}
    
    case $service in
        "api-gateway")
            if [ "$quiet" = "true" ]; then
                cd services/api-gateway && docker-compose -f docker-compose.dev.yml up --build -d > /dev/null 2>&1
                echo "✅ API Gateway started (Port 3000)"
            else
                cd services/api-gateway && ./dev-start.sh
            fi
            ;;
        "location-service")
            if [ "$quiet" = "true" ]; then
                cd services/location-service && docker-compose -f docker-compose.dev.yml up --build -d > /dev/null 2>&1
                echo "✅ Location Service started (Port 3001)"
            else
                cd services/location-service && ./dev-start.sh
            fi
            ;;
        "merchant-service")
            if [ "$quiet" = "true" ]; then
                cd services/merchant-service && docker-compose -f docker-compose.dev.yml up --build -d > /dev/null 2>&1
                echo "✅ Merchant Service started (Port 3002)"
            else
                cd services/merchant-service && docker-compose -f docker-compose.dev.yml up --build -d
            fi
            ;;
        "admin-dashboard")
            if [ "$quiet" = "true" ]; then
                cd ../msdp-admin-frontends/apps/admin-dashboard && docker-compose -f docker-compose.dev.yml up --build -d > /dev/null 2>&1
                echo "✅ Admin Dashboard started (Port 4000)"
            else
                cd ../msdp-admin-frontends/apps/admin-dashboard && docker-compose -f docker-compose.dev.yml up --build -d
            fi
            ;;
        "all")
            echo "🚀 Starting all backend services..."
            for service_port in "${SERVICES[@]}"; do
                service=$(echo $service_port | cut -d: -f1)
                start_service $service true
                sleep 2
            done
            echo "✅ All services started!"
            ;;
        *)
            echo "❌ Unknown service: $service"
            echo "Available services: api-gateway location-service merchant-service admin-dashboard"
            exit 1
            ;;
    esac
}

stop_service() {
    local service=$1
    
    case $service in
        "api-gateway")
            cd services/api-gateway && docker-compose -f docker-compose.dev.yml down > /dev/null 2>&1
            echo "🛑 API Gateway stopped"
            ;;
        "location-service")
            cd services/location-service && docker-compose -f docker-compose.dev.yml down > /dev/null 2>&1
            echo "🛑 Location Service stopped"
            ;;
        "merchant-service")
            cd services/merchant-service && docker-compose -f docker-compose.dev.yml down > /dev/null 2>&1
            echo "🛑 Merchant Service stopped"
            ;;
        "admin-dashboard")
            cd ../msdp-admin-frontends/apps/admin-dashboard && docker-compose -f docker-compose.dev.yml down > /dev/null 2>&1 || true
            echo "🛑 Admin Dashboard stopped"
            ;;
        "all")
            echo "🛑 Stopping all services..."
            for service_port in "${SERVICES[@]}"; do
                service=$(echo $service_port | cut -d: -f1)
                stop_service $service
            done
            echo "✅ All services stopped!"
            ;;
        *)
            echo "❌ Unknown service: $service"
            exit 1
            ;;
    esac
}

show_status() {
    echo "📊 MSDP Services Status (Optimized)"
    echo "==================================="
    echo ""
    
    # Check backend services
    echo "🔧 Backend Services:"
    for service_port in "${SERVICES[@]}"; do
        service=$(echo $service_port | cut -d: -f1)
        port=$(echo $service_port | cut -d: -f2)
        
        if curl -f http://localhost:$port/health > /dev/null 2>&1; then
            echo "  ✅ $service (Port $port) - Healthy"
        else
            echo "  ❌ $service (Port $port) - Not responding"
        fi
    done
    
    echo ""
    echo "🎨 Frontend Services:"
    if curl -f http://localhost:4000 > /dev/null 2>&1; then
        echo "  ✅ admin-dashboard (Port 4000) - Running"
    else
        echo "  ❌ admin-dashboard (Port 4000) - Not running"
    fi
    
    echo ""
    echo "🗄️ Infrastructure:"
    
    # Check databases
    DB_COUNT=0
    for container in $(docker ps --format "table {{.Names}}" | grep postgres | head -5); do
        if docker exec $container pg_isready > /dev/null 2>&1; then
            DB_COUNT=$((DB_COUNT + 1))
        fi
    done
    echo "  📊 PostgreSQL instances: $DB_COUNT running"
    
    # Check Redis
    REDIS_COUNT=0
    for container in $(docker ps --format "table {{.Names}}" | grep redis | head -5); do
        if docker exec $container redis-cli ping > /dev/null 2>&1; then
            REDIS_COUNT=$((REDIS_COUNT + 1))
        fi
    done
    echo "  📊 Redis instances: $REDIS_COUNT running"
    
    echo ""
    echo "🔧 Management Tools:"
    if curl -f http://localhost:8080 > /dev/null 2>&1; then
        echo "  ✅ PgAdmin (Port 8080) - Available"
    fi
    if curl -f http://localhost:8082 > /dev/null 2>&1; then
        echo "  ✅ Redis Commander (Port 8082) - Available"
    fi
}

show_logs() {
    local service=$1
    case $service in
        "api-gateway")
            cd services/api-gateway && docker-compose -f docker-compose.dev.yml logs -f
            ;;
        "location-service")
            cd services/location-service && docker-compose -f docker-compose.dev.yml logs -f
            ;;
        "merchant-service")
            cd services/merchant-service && docker-compose -f docker-compose.dev.yml logs -f
            ;;
        *)
            echo "❌ Unknown service: $service"
            exit 1
            ;;
    esac
}

quick_start() {
    local service=$1
    echo "⚡ Quick starting $service..."
    start_service $service true
    
    # Quick status check
    sleep 5
    case $service in
        "api-gateway")
            if curl -f http://localhost:3000/health > /dev/null 2>&1; then
                echo "🎉 $service ready at http://localhost:3000"
            else
                echo "⚠️ $service starting... check logs if needed"
            fi
            ;;
        "location-service")
            if curl -f http://localhost:3001/health > /dev/null 2>&1; then
                echo "🎉 $service ready at http://localhost:3001"
            else
                echo "⚠️ $service starting... check logs if needed"
            fi
            ;;
        "merchant-service")
            if curl -f http://localhost:3002/health > /dev/null 2>&1; then
                echo "🎉 $service ready at http://localhost:3002"
            else
                echo "⚠️ $service starting... check logs if needed"
            fi
            ;;
    esac
}

clean_all() {
    echo "🧹 Deep cleaning all containers and volumes..."
    
    # Stop all services
    stop_service all
    
    # Remove unused containers, networks, images
    docker system prune -f > /dev/null 2>&1
    
    # Remove only development volumes (preserve data volumes)
    docker volume rm $(docker volume ls -q | grep msdp.*node_modules) > /dev/null 2>&1 || true
    
    echo "✅ Cleanup completed!"
}

# Main script logic
case $1 in
    "start")
        check_docker
        start_service ${2:-"all"}
        ;;
    "stop")
        stop_service ${2:-"all"}
        ;;
    "restart")
        stop_service ${2:-"all"}
        sleep 2
        start_service ${2:-"all"}
        ;;
    "status")
        show_status
        ;;
    "logs")
        if [ -z "$2" ]; then
            echo "❌ Please specify a service name"
            exit 1
        fi
        show_logs $2
        ;;
    "clean")
        clean_all
        ;;
    "health")
        show_status
        ;;
    "ports")
        show_ports
        ;;
    "quick")
        check_docker
        if [ -z "$2" ]; then
            echo "❌ Please specify a service name for quick start"
            exit 1
        fi
        quick_start $2
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        show_help
        exit 1
        ;;
esac