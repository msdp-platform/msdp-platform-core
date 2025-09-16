# 🛠️ MSDP Development Workflow Guide

## 🎯 **Development Environment Setup**

### **Prerequisites**
- Docker Desktop installed and running
- Git configured with access to all repositories
- Cursor IDE with the complete workspace loaded

### **Repository Setup**
```bash
# Load complete workspace in Cursor
cursor /Users/santanu/github/msdp-platform-all.code-workspace

# Or individual repositories
cursor /Users/santanu/github/msdp-shared-libs/msdp-shared-libs.code-workspace
cursor /Users/santanu/github/msdp-testing/msdp-testing.code-workspace
```

---

## 🔄 **Daily Development Workflow**

### **1. Start Development Environment**
```bash
# Start all backend services
cd /Users/santanu/github/msdp-platform-core

# User Service
cd services/user-service && ./dev-start.sh

# Order Service
cd services/order-service && ./dev-start.sh

# Payment Service
cd services/payment-service && ./dev-start.sh

# Customer Frontend
cd /Users/santanu/github/msdp-customer-frontends/apps/customer-app && ./dev-start.sh
```

### **2. Verify Everything is Running**
```bash
# Quick health check
node test-order-payment.js

# Check all containers
docker ps | grep msdp
```

### **3. Make Changes**
- Edit code in Cursor IDE
- Changes are automatically reflected (volume mounts)
- For major changes, restart specific service

### **4. Test Changes**
```bash
# Test specific service
curl http://localhost:3003/health

# Test complete flow
node test-customer-shopping-flow.js

# Manual testing
open http://localhost:4002
```

### **5. Commit Changes**
```bash
# Commit to appropriate repository
cd /Users/santanu/github/msdp-platform-core
git add . && git commit -m "feat: description"

cd /Users/santanu/github/msdp-customer-frontends
git add . && git commit -m "feat: description"
```

---

## 🏗️ **Adding New Features**

### **Backend Service Changes**

#### **1. Modify Service Code**
```bash
# Example: Add new endpoint to Order Service
cd services/order-service/src/routes
# Edit orderRoutes.js
```

#### **2. Update Database Schema (if needed)**
```bash
# Update schema.sql
cd services/order-service/database
# Edit schema.sql

# Recreate database
cd services/order-service
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

#### **3. Test Changes**
```bash
# Restart service
docker-compose -f docker-compose.dev.yml restart order-service

# Test endpoint
curl -X POST http://localhost:3006/api/new-endpoint \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{...test_data...}'
```

### **Frontend Changes**

#### **1. Add New Pages/Components**
```bash
cd /Users/santanu/github/msdp-customer-frontends/apps/customer-app/src
# Add new pages in app/ directory
# Add new components in components/ directory
```

#### **2. Add API Integration**
```bash
# Add new API routes in app/api/
# Update existing components to use new APIs
```

#### **3. Test Frontend Changes**
```bash
# Changes are automatically reflected in Docker container
# Test in browser: http://localhost:4002
```

---

## 🧪 **Testing Workflow**

### **Unit Testing (Future)**
```bash
# Backend service tests
cd services/{service-name}
npm test

# Frontend tests
cd /Users/santanu/github/msdp-customer-frontends/apps/customer-app
npm test
```

### **Integration Testing**
```bash
# Backend integration
node test-order-payment.js

# Frontend integration  
node test-customer-shopping-flow.js

# Cross-service testing
node test-customer-frontend.js
```

### **Manual Testing Checklist**
- [ ] User registration and login
- [ ] Merchant browsing and product selection
- [ ] Shopping cart functionality
- [ ] Checkout and payment processing
- [ ] Order confirmation and history
- [ ] Admin dashboard operations

---

## 🔧 **Debugging Workflow**

### **Service Debugging**

#### **1. Check Service Health**
```bash
curl http://localhost:{port}/health
```

#### **2. View Service Logs**
```bash
cd services/{service-name}
docker-compose -f docker-compose.dev.yml logs -f {service}
```

#### **3. Access Service Container**
```bash
docker exec -it msdp-{service}-dev sh
# Now you're inside the container
ps aux  # Check running processes
env | grep JWT  # Check environment variables
```

#### **4. Database Debugging**
```bash
# Access database directly
docker-compose -f docker-compose.dev.yml exec postgres \
  psql -U msdp_user -d msdp_{service}

# Check tables
\dt

# Query data
SELECT * FROM users LIMIT 5;
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;
```

### **Frontend Debugging**

#### **1. Check Browser Console**
- Open Developer Tools
- Check Console for JavaScript errors
- Check Network tab for API call failures

#### **2. Check API Responses**
```bash
# Test API endpoints directly
curl http://localhost:4002/api/session
curl -X POST http://localhost:4002/api/login -d '{...}'
```

#### **3. Container Debugging**
```bash
cd /Users/santanu/github/msdp-customer-frontends/apps/customer-app
docker-compose -f docker-compose.dev.yml logs -f customer-app
```

---

## 📊 **Performance Monitoring**

### **Container Resources**
```bash
# Monitor resource usage
docker stats

# Service-specific monitoring
docker stats msdp-user-service-dev
docker stats msdp-order-service-dev
docker stats msdp-payment-service-dev
docker stats msdp-customer-app-dev
```

### **Database Performance**
```bash
# Check database connections
docker-compose -f docker-compose.dev.yml exec postgres \
  psql -U msdp_user -d msdp_{service} -c "SELECT * FROM pg_stat_activity;"

# Check database size
docker-compose -f docker-compose.dev.yml exec postgres \
  psql -U msdp_user -d msdp_{service} -c "SELECT pg_size_pretty(pg_database_size('msdp_{service}'));"
```

---

## 🔄 **Git Workflow**

### **Multi-Repository Management**

#### **Platform Core Changes**
```bash
cd /Users/santanu/github/msdp-platform-core
git add .
git commit -m "feat: description of backend changes"
git push origin dev
```

#### **Customer Frontend Changes**
```bash
cd /Users/santanu/github/msdp-customer-frontends
git add .
git commit -m "feat: description of frontend changes"
git push origin dev
```

#### **Admin Frontend Changes**
```bash
cd /Users/santanu/github/msdp-admin-frontends
git add .
git commit -m "feat: description of admin changes"
git push origin dev
```

### **Workspace Management**
```bash
# Use complete workspace for cross-repository work
cursor /Users/santanu/github/msdp-platform-all.code-workspace

# Use individual workspaces for focused development
cursor /Users/santanu/github/msdp-shared-libs/msdp-shared-libs.code-workspace
cursor /Users/santanu/github/msdp-testing/msdp-testing.code-workspace
```

---

## 🚨 **Emergency Procedures**

### **Service Down**
```bash
# Check what's wrong
cd services/{service-name}
docker-compose -f docker-compose.dev.yml logs {service}

# Restart service
docker-compose -f docker-compose.dev.yml restart {service}

# If still failing, rebuild
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build -d
```

### **Database Issues**
```bash
# Reset specific database
cd services/{service-name}
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d

# Check database logs
docker-compose -f docker-compose.dev.yml logs postgres
```

### **Port Conflicts**
```bash
# Find what's using the port
lsof -i :{port}

# Kill the process
kill -9 $(lsof -ti:{port})

# Restart service
./dev-start.sh
```

---

## 📋 **Configuration Reference**

### **Service Ports**
- **User Service**: 3003 (DB: 5435, PgAdmin: 8084)
- **Order Service**: 3006 (DB: 5437, PgAdmin: 8088)
- **Payment Service**: 3007 (DB: 5439, PgAdmin: 8089)
- **Customer App**: 4002
- **Admin Dashboard**: 4000

### **JWT Configuration**
- **Secret**: `dev-user-jwt-secret` (all services)
- **Expires**: 7 days
- **Type**: Customer tokens have `type: "customer"`

### **Database Credentials**
- **Username**: `msdp_user`
- **Password**: `msdp_password`
- **PgAdmin**: `admin@msdp.com` / `admin123`

---

## 🎯 **Feature Development Checklist**

### **New Backend Feature**
- [ ] Update service code
- [ ] Update database schema if needed
- [ ] Add API endpoint
- [ ] Add authentication if required
- [ ] Test with curl/Postman
- [ ] Update API documentation
- [ ] Add integration test
- [ ] Commit changes

### **New Frontend Feature**
- [ ] Add UI components
- [ ] Add API integration
- [ ] Add routing if needed
- [ ] Test in browser
- [ ] Test authentication flow
- [ ] Test error handling
- [ ] Update user documentation
- [ ] Commit changes

### **Cross-Service Feature**
- [ ] Plan service interactions
- [ ] Update multiple services
- [ ] Test service communication
- [ ] Test complete user flow
- [ ] Update integration tests
- [ ] Update documentation
- [ ] Commit to all repositories

---

## 📚 **Documentation Maintenance**

### **When to Update Documentation**
- ✅ New service added
- ✅ New API endpoint created
- ✅ Configuration changes
- ✅ New testing procedures
- ✅ Deployment changes

### **Documentation Files to Update**
- **README.md** - Main overview
- **API_REFERENCE.md** - API changes
- **DOCKER_DEPLOYMENT_GUIDE.md** - Deployment changes
- **QUICK_REFERENCE.md** - New commands/URLs
- **PLATFORM_STATUS.md** - Status updates

---

*This workflow guide ensures consistent development practices across the MSDP platform.*
