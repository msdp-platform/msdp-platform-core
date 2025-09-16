# 🚀 MSDP Platform - Local Development Guide

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Git

### 🎯 Start Individual Services

#### 1. API Gateway (Port 3000)
```bash
cd services/api-gateway
./dev-start.sh
```
- **Service**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Redis Commander**: http://localhost:8081

#### 2. Location Service (Port 3001)
```bash
cd services/location-service
./dev-start.sh
```
- **Service**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **PgAdmin**: http://localhost:8080 (admin@msdp.com / admin123)
- **Redis Commander**: http://localhost:8082

#### 3. Merchant Service (Port 3002)
```bash
cd services/merchant-service
docker-compose -f docker-compose.dev.yml up --build -d
```
- **Service**: http://localhost:3002
- **Health Check**: http://localhost:3002/health
- **PgAdmin**: http://localhost:8083 (admin@msdp.com / admin123)

#### 4. Admin Dashboard (Port 4000)
```bash
cd ../msdp-admin-frontends/apps/admin-dashboard
docker-compose -f docker-compose.dev.yml up --build -d
```
- **Service**: http://localhost:4000
- **PgAdmin**: http://localhost:8084 (admin@msdp.com / admin123)

### 🎛️ Master Control Script

Use the master control script for easy management:

```bash
# Start all services
./dev-control.sh start all

# Start specific service
./dev-control.sh start api-gateway

# Check status
./dev-control.sh status

# View logs
./dev-control.sh logs location-service

# Stop all services
./dev-control.sh stop all

# Clean up everything
./dev-control.sh clean
```

## 🔧 Service Details

### Port Allocation
| Service | Port | Database Port | Admin Port |
|---------|------|---------------|------------|
| API Gateway | 3000 | - | 8081 (Redis) |
| Location Service | 3001 | 5433 | 8080 (PgAdmin) |
| Merchant Service | 3002 | 5434 | 8083 (PgAdmin) |
| Admin Dashboard | 4000 | 5435 | 8084 (PgAdmin) |

### Environment Variables

Each service has its own environment configuration:
- `services/api-gateway/env.development`
- `services/location-service/.env` (from docker-compose)
- `services/merchant-service/.env` (from docker-compose)

### Database Access

**PostgreSQL Connections:**
```bash
# Location Service DB
docker exec -it msdp-location-postgres-dev psql -U msdp_user -d msdp_location

# Merchant Service DB  
docker exec -it msdp-merchant-postgres-dev psql -U msdp_user -d msdp_merchant

# Admin Dashboard DB
docker exec -it msdp-admin-postgres-dev psql -U msdp_user -d msdp_admin
```

**Redis Access:**
```bash
# Location Service Redis
docker exec -it msdp-location-redis-dev redis-cli

# API Gateway Redis
docker exec -it msdp-api-redis-dev redis-cli
```

## 🧪 Testing Services

### Health Checks
```bash
# Check all service health
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Location Service
curl http://localhost:3002/health  # Merchant Service
curl http://localhost:4000/        # Admin Dashboard
```

### API Testing
```bash
# Get countries from Location Service
curl http://localhost:3001/api/locations

# Get merchants from Merchant Service
curl http://localhost:3002/api/merchants

# Test API Gateway routing
curl http://localhost:3000/api/v1/locations
curl http://localhost:3000/api/v1/merchants
```

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure no other services are running on the same ports
2. **Docker not running**: Ensure Docker Desktop is started
3. **Database connection issues**: Wait for databases to fully initialize (15-30 seconds)
4. **Permission issues**: Ensure scripts are executable (`chmod +x script-name.sh`)

### Useful Commands

```bash
# View all running containers
docker ps

# View container logs
docker logs msdp-api-gateway-dev

# Restart a specific container
docker restart msdp-location-service-dev

# Remove all stopped containers
docker container prune

# View networks
docker network ls
```

## 📁 File Structure

```
msdp-platform-core/
├── dev-control.sh              # Master control script
├── services/
│   ├── api-gateway/
│   │   ├── Dockerfile.dev
│   │   ├── docker-compose.dev.yml
│   │   ├── dev-start.sh
│   │   └── env.development
│   ├── location-service/
│   │   ├── Dockerfile.dev
│   │   ├── docker-compose.dev.yml
│   │   └── dev-start.sh
│   └── merchant-service/
│       ├── Dockerfile.dev
│       └── docker-compose.dev.yml
```

## 🚀 Next Steps

1. **Start with Location Service** - Most complete implementation
2. **Test API Gateway** - Central routing and authentication
3. **Add Merchant Service** - Business logic layer
4. **Connect Frontend** - Admin dashboard integration
5. **Add Customer Apps** - Complete the ecosystem

Happy coding! 🎉
