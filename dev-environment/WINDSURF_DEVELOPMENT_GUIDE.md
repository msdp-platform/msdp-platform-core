# 🌊 Windsurf + MSDP Cloud Development Guide

## 🎉 **Complete MSDP Ecosystem is Live!**

Your enterprise-grade development environment is now fully operational with all microservices running in AKS:

### **✅ Services Running:**
- **🎛️ Admin Service** (Port 3005): Platform management & orchestration
- **🏪 Merchant Service** (Port 3002): VendaBuddy business management  
- **👤 User Service** (Port 3003): Authentication & user management
- **📦 Order Service** (Port 3006): Cart management & order processing
- **💳 Payment Service** (Port 3007): Payment processing & transactions
- **🌐 API Gateway** (Port 3000): Central routing & service discovery

## 🚀 **Development Approaches with Windsurf**

### **Approach 1: Direct Port Forwarding (Recommended)**

This is the most reliable method and works perfectly with Windsurf:

#### **Setup Commands:**
```bash
# Forward all services for development
kubectl port-forward -n dev-santanu svc/api-gateway 3000:3000 &
kubectl port-forward -n dev-santanu svc/admin-service-simple 3005:3005 &
kubectl port-forward -n dev-santanu svc/merchant-service 3002:3002 &
kubectl port-forward -n dev-santanu svc/user-service 3003:3003 &
kubectl port-forward -n dev-santanu svc/order-service 3006:3006 &
kubectl port-forward -n dev-santanu svc/payment-service 3007:3007 &

# Or use the convenience script
./dev-environment/scripts/setup-port-forwards.sh
```

#### **Windsurf Development Workflow:**
1. **Open Windsurf IDE** with your MSDP project
2. **Services are accessible** at `localhost:300X` 
3. **Develop with Cascade AI** - full AI assistance available
4. **Test against real services** running in AKS cluster
5. **Deploy changes** by updating Kubernetes deployments

### **Approach 2: Telepresence (When Working)**

If Telepresence daemon issues are resolved:

```bash
# Connect to cluster
telepresence connect --namespace=dev-santanu

# Intercept a service for local development
telepresence intercept merchant-service --port 3002:3002

# Now develop locally while connected to cluster
```

### **Approach 3: Hybrid Development**

Combine local development with cloud services:

```bash
# Run one service locally in Windsurf
cd services/merchant-service
npm run dev

# Forward other services from cluster
kubectl port-forward -n dev-santanu svc/user-service 3003:3003 &
kubectl port-forward -n dev-santanu svc/order-service 3006:3006 &
```

## 🛠️ **Development Workflow Examples**

### **Example 1: VendaBuddy Feature Development**

```bash
# 1. Forward merchant service for local development
kubectl port-forward -n dev-santanu svc/merchant-service 3002:3002 &

# 2. Forward supporting services
kubectl port-forward -n dev-santanu svc/user-service 3003:3003 &
kubectl port-forward -n dev-santanu svc/order-service 3006:3006 &

# 3. Open Windsurf and develop with Cascade AI
# 4. Test API calls:
curl http://localhost:3002/api/merchants/profile
curl http://localhost:3003/api/auth/login
curl http://localhost:3006/api/orders
```

### **Example 2: Full Stack Development**

```bash
# 1. Forward API Gateway (routes to all services)
kubectl port-forward -n dev-santanu svc/api-gateway 3000:3000 &

# 2. Develop frontend applications
cd /Users/santanu/github/msdp-admin-frontends/apps/admin-dashboard
npm run dev

# 3. Frontend connects to http://localhost:3000/api/*
# 4. All requests route through gateway to appropriate services
```

## 🔧 **Windsurf IDE Configuration**

### **VS Code Settings for MSDP Development:**

Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.yaml": "yaml"
  },
  "yaml.schemas": {
    "kubernetes": "*.k8s.yaml"
  },
  "rest-client.environmentVariables": {
    "local": {
      "baseUrl": "http://localhost:3000",
      "adminUrl": "http://localhost:3005",
      "merchantUrl": "http://localhost:3002"
    }
  }
}
```

### **Environment Variables for Development:**

Create `.env.development`:
```bash
# API URLs (forwarded from cluster)
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:3005
NEXT_PUBLIC_MERCHANT_API_URL=http://localhost:3002

# Development flags
NODE_ENV=development
NEXT_PUBLIC_ENV=development
ENABLE_DEBUG=true

# Service discovery
USER_SERVICE_URL=http://localhost:3003
ORDER_SERVICE_URL=http://localhost:3006
PAYMENT_SERVICE_URL=http://localhost:3007
```

## 🧪 **Testing Your Setup**

### **Health Check All Services:**
```bash
# Test through API Gateway
curl http://localhost:3000/health | jq .

# Test individual services
curl http://localhost:3005/health | jq .services
curl http://localhost:3002/health | jq .vendabuddy
curl http://localhost:3003/health | jq .functions
curl http://localhost:3006/health | jq .functions
curl http://localhost:3007/health | jq .paymentConfig
```

### **Test Service Integration:**
```bash
# Test authentication flow
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@vendabuddy.com","password":"demo123"}'

# Test VendaBuddy merchant APIs
curl http://localhost:3000/api/merchants/profile
curl http://localhost:3000/api/menu

# Test order processing
curl http://localhost:3000/api/orders
curl http://localhost:3000/api/cart

# Test payment processing
curl http://localhost:3000/api/payments/transactions
```

## 🎯 **Development Best Practices**

### **1. Service-First Development:**
- Always test against real services in the cluster
- Use port forwarding to access cluster services
- Develop with production-like data and behavior

### **2. Windsurf + Cascade AI Workflow:**
- Use Cascade AI for code generation and debugging
- Leverage AI for API integration and testing
- Get AI assistance for Kubernetes and Docker issues

### **3. Microservice Development:**
- Develop one service at a time
- Test service integration frequently
- Use the API Gateway for unified access

### **4. Database Development:**
- Services connect to Aurora Serverless (when configured)
- Use port forwarding for database access if needed
- Test with production-like data structures

## 🚨 **Troubleshooting**

### **Port Forward Issues:**
```bash
# Kill existing port forwards
pkill -f "kubectl port-forward"

# Restart port forwarding
./dev-environment/scripts/setup-port-forwards.sh
```

### **Service Connection Issues:**
```bash
# Check service status
kubectl get pods -n dev-santanu
kubectl get services -n dev-santanu

# Check service logs
kubectl logs -f deployment/merchant-service -n dev-santanu
```

### **Telepresence Issues:**
```bash
# Reset Telepresence
telepresence quit
sudo telepresence uninstall --everything
brew reinstall telepresence

# Alternative: Use port forwarding instead
```

## 💡 **Pro Tips for Windsurf Development**

### **1. Multi-Terminal Setup:**
- Terminal 1: Port forwarding commands
- Terminal 2: kubectl commands for cluster management
- Terminal 3: Local development server
- Terminal 4: Testing and API calls

### **2. Cascade AI Prompts:**
```
"Help me create a new VendaBuddy API endpoint for menu management"
"Debug this Kubernetes service connection issue"
"Generate tests for this microservice integration"
"Optimize this API call for better performance"
```

### **3. Hot Reloading:**
- Use `nodemon` for backend services
- Use `next dev` for frontend applications
- Changes reflect immediately with port forwarding

## 🎉 **You're Ready to Develop!**

Your complete MSDP ecosystem is running in enterprise-grade cloud infrastructure. You can now:

✅ **Develop with Windsurf + Cascade AI** - Full AI assistance  
✅ **Test against real services** - Production-like environment  
✅ **Scale with your team** - Enterprise-ready infrastructure  
✅ **Deploy with confidence** - Battle-tested Kubernetes setup  

**Happy coding with your cloud-native VendaBuddy platform!** 🚀
