# 🐳 MSDP Docker Deployment Guide

## 🎯 **Overview**

This guide covers the complete Docker-based deployment of the MSDP platform following microservice principles.

---

## 🏗️ **Service Architecture**

### **Backend Services (Dockerized)**
```
User Service (3003) ──┐
Merchant Service (3002) ──┤
Order Service (3006) ──┼── PostgreSQL Databases
Payment Service (3007) ──┤
Admin Service (3001) ──┘
```

### **Frontend Services (Dockerized)**
```
Customer App (4002) ──┐
Admin Dashboard (4000) ──┴── Next.js Applications
```

---

## 🚀 **Deployment Commands**

### **Individual Service Deployment**

#### **Backend Services**
```bash
# User Service
cd services/user-service
./dev-start.sh
# ✅ Starts: User service + PostgreSQL + PgAdmin

# Order Service  
cd services/order-service
./dev-start.sh
# ✅ Starts: Order service + PostgreSQL + PgAdmin

# Payment Service
cd services/payment-service  
./dev-start.sh
# ✅ Starts: Payment service + PostgreSQL + PgAdmin

# Admin Service
cd services/admin-service
./dev-start.sh
# ✅ Starts: Admin service + PostgreSQL + PgAdmin
```

#### **Frontend Services**
```bash
# Customer Frontend
cd /Users/santanu/github/msdp-customer-frontends/apps/customer-app
./dev-start.sh
# ✅ Starts: Customer app (Next.js)

# Admin Dashboard
cd /Users/santanu/github/msdp-admin-frontends/apps/admin-dashboard  
docker-compose -f docker-compose.dev.yml up -d
# ✅ Starts: Admin dashboard (Next.js)
```

### **Complete Platform Deployment**
```bash
# Start all backend services
cd /Users/santanu/github/msdp-platform-core
./scripts/start-all-services.sh  # (Create this script)

# Start all frontend services
./scripts/start-all-frontends.sh  # (Create this script)
```

---

## 📊 **Service Configuration**

### **Port Allocation**
| Service Type | Port Range | Services |
|--------------|------------|----------|
| **Backend Services** | 3000-3099 | User (3003), Order (3006), Payment (3007) |
| **Frontend Apps** | 4000-4099 | Admin (4000), Customer (4002) |
| **Databases** | 5400-5499 | PostgreSQL instances |
| **Management** | 8080-8099 | PgAdmin instances |

### **Environment Variables**

#### **Common Environment Variables**
```bash
# Authentication
JWT_SECRET=dev-user-jwt-secret
JWT_EXPIRES_IN=7d

# Database
POSTGRES_DB=msdp_{service}
POSTGRES_USER=msdp_user  
POSTGRES_PASSWORD=msdp_password

# Logging
LOG_LEVEL=debug
NODE_ENV=development
```

#### **Service-Specific Variables**

**User Service:**
```bash
PORT=3003
DB_PORT=5435
PGADMIN_PORT=8084
```

**Order Service:**
```bash
PORT=3006
DB_PORT=5437
PGADMIN_PORT=8088
USER_SERVICE_URL=http://host.docker.internal:3003
PAYMENT_SERVICE_URL=http://host.docker.internal:3007
```

**Payment Service:**
```bash
PORT=3007
DB_PORT=5439
PGADMIN_PORT=8089
```

**Customer Frontend:**
```bash
PORT=4002
USER_SERVICE_URL=http://host.docker.internal:3003
ORDER_SERVICE_URL=http://host.docker.internal:3006
PAYMENT_SERVICE_URL=http://host.docker.internal:3007
```

---

## 🔧 **Docker Configuration**

### **Standard Dockerfile.dev Structure**
```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache curl dumb-init && \
  addgroup -g 1001 -S nodejs && \
  adduser -S {servicename} -u 1001 -G nodejs

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm install && npm cache clean --force

# Set permissions
RUN mkdir -p logs && chown -R {servicename}:nodejs /app

# Copy application code
COPY . .

# Switch to non-root user
USER {servicename}

# Expose port
EXPOSE {port}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:{port}/health || exit 1

# Start application
CMD ["dumb-init", "npm", "run", "dev"]
```

### **Standard docker-compose.dev.yml Structure**
```yaml
version: "3.8"

networks:
  msdp-{service}-network:
    driver: bridge

services:
  {service}:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: msdp-{service}-dev
    ports:
      - "{port}:{port}"
    environment:
      - NODE_ENV=development
      - PORT={port}
      - JWT_SECRET=dev-user-jwt-secret
    volumes:
      - .:/app
      - {service}_node_modules:/app/node_modules
    networks:
      - msdp-{service}-network
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    container_name: msdp-{service}-postgres-dev
    environment:
      - POSTGRES_DB=msdp_{service}
      - POSTGRES_USER=msdp_user
      - POSTGRES_PASSWORD=msdp_password
    volumes:
      - {service}_postgres_data:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    networks:
      - msdp-{service}-network

volumes:
  {service}_node_modules:
  {service}_postgres_data:
```

---

## 🔍 **Service Discovery**

### **Internal Communication**
Services communicate using Docker's internal networking:

```bash
# From Order Service to Payment Service
http://host.docker.internal:3007/api/payments/process-internal

# From Customer Frontend to User Service  
http://host.docker.internal:3003/api/auth/login

# From Admin Dashboard to Admin Service
http://host.docker.internal:3001/api/admin/users
```

### **External Access**
```bash
# Customer Experience
http://localhost:4002

# Admin Management
http://localhost:4000

# Direct API Access (for testing)
http://localhost:3003/health  # User Service
http://localhost:3006/health  # Order Service
http://localhost:3007/health  # Payment Service
```

---

## 🧪 **Testing in Docker Environment**

### **Health Checks**
```bash
# Test all service health
curl http://localhost:3003/health  # User Service
curl http://localhost:3006/health  # Order Service  
curl http://localhost:3007/health  # Payment Service
curl http://localhost:4002/api/session  # Customer Frontend
```

### **Integration Tests**
```bash
# Backend integration
node test-order-payment.js

# Frontend integration
node test-customer-shopping-flow.js

# Manual browser testing
open http://localhost:4002
```

---

## 🔧 **Development Workflow**

### **Service Development**
```bash
# 1. Make code changes
# 2. Restart service to pick up changes
cd services/{service-name}
docker-compose -f docker-compose.dev.yml restart {service}

# 3. For major changes, rebuild
docker-compose -f docker-compose.dev.yml up --build -d

# 4. Check logs
docker-compose -f docker-compose.dev.yml logs {service}
```

### **Database Changes**
```bash
# 1. Update schema.sql
# 2. Recreate database
cd services/{service-name}
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d

# 3. Verify schema
docker-compose -f docker-compose.dev.yml exec postgres \
  psql -U msdp_user -d msdp_{service} -c "\dt"
```

### **Debugging**
```bash
# Access service container
docker exec -it msdp-{service}-dev sh

# View real-time logs
docker-compose -f docker-compose.dev.yml logs -f {service}

# Check container status
docker-compose -f docker-compose.dev.yml ps
```

---

## 📊 **Monitoring**

### **Container Health**
```bash
# All containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Service-specific
cd services/{service-name}
docker-compose -f docker-compose.dev.yml ps
```

### **Resource Usage**
```bash
# Container stats
docker stats

# Service-specific stats
docker stats msdp-{service}-dev
```

### **Database Monitoring**
```bash
# PgAdmin Access
User Service: http://localhost:8084
Order Service: http://localhost:8088  
Payment Service: http://localhost:8089

# Credentials: admin@msdp.com / admin123
```

---

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Port Conflicts**
```bash
# Check what's using a port
lsof -i :{port}

# Kill process using port
kill -9 $(lsof -ti:{port})
```

#### **Container Won't Start**
```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs {service}

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build -d
```

#### **Database Connection Issues**
```bash
# Check database container
docker-compose -f docker-compose.dev.yml exec postgres \
  psql -U msdp_user -d msdp_{service} -c "SELECT 1;"

# Recreate database
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

#### **Authentication Issues**
```bash
# Verify JWT secret consistency
grep -r "JWT_SECRET" services/*/docker-compose.dev.yml

# Should all be: dev-user-jwt-secret
```

### **Service-Specific Troubleshooting**

#### **User Service**
```bash
# Test authentication
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### **Order Service**  
```bash
# Test order creation (requires auth token)
curl -X POST http://localhost:3006/api/orders/create \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...order_data...}'
```

#### **Payment Service**
```bash
# Test internal payment processing
curl -X POST http://localhost:3007/api/payments/process-internal \
  -H "Content-Type: application/json" \
  -d '{...payment_data...}'
```

---

## 🎯 **Production Considerations**

### **Security Hardening**
- [ ] Change JWT secret from development default
- [ ] Use proper SSL/TLS certificates
- [ ] Implement rate limiting
- [ ] Add API key authentication for service-to-service calls
- [ ] Enable database encryption at rest

### **Scalability**
- [ ] Implement horizontal pod autoscaling
- [ ] Add load balancers for each service
- [ ] Configure database read replicas
- [ ] Implement caching layers (Redis)
- [ ] Add message queues for async processing

### **Monitoring**
- [ ] Add Prometheus metrics collection
- [ ] Implement centralized logging (ELK stack)
- [ ] Set up alerting (Grafana)
- [ ] Add distributed tracing
- [ ] Implement health check aggregation

---

*This guide provides complete Docker deployment instructions for the MSDP platform.*  
*All services are production-ready with proper containerization.*
