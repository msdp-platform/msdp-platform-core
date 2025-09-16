# ⚡ MSDP Platform Quick Reference

## 🚀 **Start Everything (Quick Commands)**

### **Backend Services**
```bash
# User Service
cd services/user-service && ./dev-start.sh

# Order Service
cd services/order-service && ./dev-start.sh

# Payment Service  
cd services/payment-service && ./dev-start.sh

# Admin Service
cd services/admin-service && ./dev-start.sh
```

### **Frontend Services**
```bash
# Customer Web App
cd /Users/santanu/github/msdp-customer-frontends/apps/customer-app && ./dev-start.sh

# Customer Mobile App
cd /Users/santanu/github/msdp-customer-frontends/apps/customer-mobile && npx expo start

# Admin Dashboard
cd /Users/santanu/github/msdp-admin-frontends/apps/admin-dashboard && docker-compose -f docker-compose.dev.yml up -d
```

---

## 🌐 **Live URLs**

| Service | URL | Purpose |
|---------|-----|---------|
| **Customer Web App** | http://localhost:4002 | Shopping experience |
| **Customer Mobile App** | http://localhost:8090 | Mobile shopping (Expo web) |
| **Admin Dashboard** | http://localhost:4000 | Platform management |
| **User Service** | http://localhost:3003/health | User management API |
| **Order Service** | http://localhost:3006/health | Order processing API |
| **Payment Service** | http://localhost:3007/health | Payment processing API |

---

## 🧪 **Testing Commands**

```bash
# Backend Integration Test
node test-order-payment.js

# Customer Frontend Test
node test-customer-shopping-flow.js

# Manual Testing
open http://localhost:4002
```

---

## 📊 **Service Status Check**

```bash
# Quick health check all services
curl http://localhost:3003/health  # User
curl http://localhost:3006/health  # Order  
curl http://localhost:3007/health  # Payment
curl http://localhost:4002/api/session  # Customer Frontend

# Container status
docker ps | grep msdp
```

---

## 🔧 **Common Operations**

### **Restart Service**
```bash
cd services/{service-name}
docker-compose -f docker-compose.dev.yml restart {service}
```

### **View Logs**
```bash
cd services/{service-name}  
docker-compose -f docker-compose.dev.yml logs {service}
```

### **Rebuild Service**
```bash
cd services/{service-name}
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build -d
```

### **Database Access**
```bash
# PgAdmin URLs
User DB: http://localhost:8084
Order DB: http://localhost:8088
Payment DB: http://localhost:8089

# Credentials: admin@msdp.com / admin123
```

---

## 🛒 **Customer Journey Test**

### **Manual Testing Steps**
1. **Open**: http://localhost:4002
2. **Register**: Create new account
3. **Browse**: Click "View" on Urban Bites
4. **Add to Cart**: Select California Roll (x2)
5. **Checkout**: Enter delivery address
6. **Place Order**: Complete payment
7. **Success**: View order confirmation
8. **History**: Check /orders page

### **Expected Results**
- ✅ Registration successful
- ✅ Order created (ORD#########)
- ✅ Payment processed ($31.05)
- ✅ Order status: Confirmed
- ✅ Payment status: Paid

---

## 🔒 **Authentication Flow**

### **Test User Creation**
```bash
curl -X POST http://localhost:4002/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"testpass123","country":"usa"}'
```

### **Test Login**
```bash
curl -X POST http://localhost:4002/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}' \
  -c cookies.txt
```

### **Test Session**
```bash
curl http://localhost:4002/api/session -b cookies.txt
```

---

## 📁 **Repository Structure**

```
msdp-platform-core/
├── services/
│   ├── user-service/         # User management & auth
│   ├── order-service/        # Orders & cart
│   ├── payment-service/      # Payment processing
│   └── admin-service/        # Admin operations
├── config/
│   └── platform-config.json # Port & service configuration
├── docs/                     # All documentation
├── test-*.js                # Integration tests
└── README.md                # Main documentation

msdp-customer-frontends/
├── apps/
│   └── customer-app/         # Main shopping app
└── themes/                   # Country-specific themes

msdp-admin-frontends/
├── apps/
│   └── admin-dashboard/      # Admin management
```

---

## 🚨 **Emergency Commands**

### **Stop Everything**
```bash
# Kill all MSDP containers
docker ps | grep msdp | awk '{print $1}' | xargs docker stop

# Remove all MSDP containers
docker ps -a | grep msdp | awk '{print $1}' | xargs docker rm
```

### **Reset Database**
```bash
cd services/{service-name}
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### **Full Platform Reset**
```bash
# Stop all services
docker stop $(docker ps -q --filter "name=msdp")

# Remove all containers and volumes
docker system prune -f
docker volume prune -f

# Restart everything
# (Run individual dev-start.sh scripts)
```

---

## 📖 **Documentation Links**

- **[Main README](../README.md)** - Complete platform overview
- **[API Reference](./API_REFERENCE.md)** - All API endpoints
- **[Docker Guide](./DOCKER_DEPLOYMENT_GUIDE.md)** - Deployment details
- **[Architecture](../MICROSERVICE_ARCHITECTURE.md)** - System design
- **[Platform Status](../PLATFORM_STATUS.md)** - Current status

---

## 🎯 **Next Steps Planning**

### **Ready Features**
- ✅ Complete customer shopping experience
- ✅ Order and payment processing
- ✅ User management and authentication
- ✅ Admin dashboard for management
- ✅ Docker-based deployment

### **Potential Next Features**
- 📱 Mobile application (React Native)
- 🏪 Enhanced merchant portal
- 🔔 Real-time notifications
- 📊 Analytics and reporting
- 🌍 Production deployment
- 💳 Real payment gateway integration

---

*Keep this reference handy for quick platform operations!*
