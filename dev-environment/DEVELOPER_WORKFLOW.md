# 🚀 MSDP Developer Workflow Guide

## 🎯 **Your Development Environment Status**

### **✅ What's Live Right Now:**
- **🌍 Production URLs**: All services accessible via `*.dev.aztech-msdp.com`
- **🔒 SSL Certificates**: Automatic HTTPS via cert-manager + Let's Encrypt
- **☸️ Kubernetes Cluster**: AKS with proper namespaces and RBAC
- **🌐 DNS Automation**: External-DNS managing Route53 entries
- **📊 Monitoring**: Health checks and metrics ready

### **🔗 Your Live Services:**
```bash
# 🌐 API Gateway (Main Entry Point)
https://api.dev.aztech-msdp.com/health

# 🎛️ Admin Service (Platform Management)
https://admin.dev.aztech-msdp.com/health

# 🏪 VendaBuddy Merchant Service
https://merchant.dev.aztech-msdp.com/health

# 👤 User Authentication Service
https://auth.dev.aztech-msdp.com/health

# 📦 Order Processing Service
https://orders.dev.aztech-msdp.com/health

# 💳 Payment Processing Service
https://payments.dev.aztech-msdp.com/health
```

## 🛠️ **Developer Workflow Options**

### **Option 1: Windsurf + Cloud Services (Recommended)**
**Best for**: Feature development, API integration, frontend work

#### **Setup:**
```bash
# 1. Open Windsurf IDE
# 2. Your services are already live at *.dev.aztech-msdp.com
# 3. Develop locally, test against cloud services
```

#### **Workflow:**
1. **Code in Windsurf** with Cascade AI assistance
2. **Test APIs** against live cloud services
3. **Deploy changes** via Kubernetes when ready
4. **Iterate quickly** with real backend services

#### **Example - VendaBuddy Feature Development:**
```javascript
// In Windsurf - develop new merchant feature
const merchantAPI = 'https://merchant.dev.aztech-msdp.com';

// Test against live service
fetch(`${merchantAPI}/api/merchants/profile`)
  .then(res => res.json())
  .then(data => console.log(data));

// Develop with real data and APIs
```

### **Option 2: Kubernetes-Native Development**
**Best for**: Service modifications, infrastructure changes

#### **Update Service Code:**
```bash
# 1. Modify service code in Windsurf
# 2. Update Kubernetes deployment
kubectl set image deployment/merchant-service merchant-service=your-new-image -n dev-santanu

# 3. Or update the YAML and apply
kubectl apply -f dev-environment/kubernetes/merchant-service-simple.yaml
```

#### **Live Code Updates:**
```bash
# Edit the running service directly (for quick testing)
kubectl edit deployment merchant-service -n dev-santanu

# View logs in real-time
kubectl logs -f deployment/merchant-service -n dev-santanu

# Port forward for local debugging
kubectl port-forward deployment/merchant-service 3002:3002 -n dev-santanu
```

### **Option 3: Hybrid Development (Advanced)**
**Best for**: Full-stack development, service integration

#### **Run One Service Locally, Others in Cloud:**
```bash
# 1. Run merchant service locally in Windsurf
cd services/merchant-service
npm run dev  # Runs on localhost:3002

# 2. Update ingress to route to your local service temporarily
# 3. Other services remain in cloud
# 4. Test full integration
```

## 🔄 **Making Changes - Step by Step**

### **Scenario 1: Add New VendaBuddy Feature**

#### **Step 1: Develop in Windsurf**
```javascript
// services/merchant-service/src/routes/menuRoutes.js
// Add new menu analytics endpoint

app.get('/api/menu/analytics', async (req, res) => {
  res.json({
    message: 'Menu Analytics',
    data: {
      totalItems: 25,
      popularItems: ['Fish & Chips', 'Chicken Curry'],
      revenue: 1250.50,
      currency: 'GBP'
    }
  });
});
```

#### **Step 2: Test Against Live Services**
```bash
# Test your new endpoint
curl https://merchant.dev.aztech-msdp.com/api/menu/analytics
```

#### **Step 3: Deploy to Kubernetes**
```bash
# Update the service configuration
kubectl patch deployment merchant-service -n dev-santanu -p '{"spec":{"template":{"metadata":{"annotations":{"kubectl.kubernetes.io/restartedAt":"'$(date +%Y-%m-%dT%H:%M:%S%z)'"}}}}}'

# Or rebuild and update the container
# (We'll show you proper CI/CD later)
```

### **Scenario 2: Frontend Development**

#### **Step 1: Setup Frontend Environment**
```bash
# Navigate to your frontend repo
cd /Users/santanu/github/msdp-admin-frontends/apps/admin-dashboard

# Configure to use live backend
echo "NEXT_PUBLIC_API_URL=https://admin.dev.aztech-msdp.com" > .env.local
echo "NEXT_PUBLIC_MERCHANT_API_URL=https://merchant.dev.aztech-msdp.com" >> .env.local
```

#### **Step 2: Develop with Live Backend**
```javascript
// In your Next.js app
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Real API calls to live services
const fetchMerchants = async () => {
  const response = await fetch(`${apiUrl}/api/merchants/profile`);
  return response.json();
};
```

#### **Step 3: Deploy Frontend to Kubernetes**
```bash
# Create frontend deployment (we'll create this)
kubectl apply -f dev-environment/kubernetes/admin-dashboard-deployment.yaml
```

### **Scenario 3: Database Changes**

#### **Step 1: Connect to Database**
```bash
# Port forward to database (when Aurora Serverless is setup)
kubectl port-forward svc/postgresql-service 5432:5432 -n dev-santanu

# Connect with your favorite DB tool
psql -h localhost -p 5432 -U admin_user -d msdp_admin_dev
```

#### **Step 2: Run Migrations**
```bash
# In your service directory
cd services/merchant-service
npm run migrate

# Or apply directly to Kubernetes
kubectl exec -it deployment/merchant-service -n dev-santanu -- npm run migrate
```

## 🚀 **Rapid Development Workflow**

### **Daily Development Cycle:**

#### **Morning Setup (2 minutes):**
```bash
# 1. Check service health
curl https://api.dev.aztech-msdp.com/health

# 2. Open Windsurf IDE
# 3. Start coding with Cascade AI
```

#### **Development Loop (Continuous):**
```bash
# 1. Code in Windsurf
# 2. Test against https://api.dev.aztech-msdp.com
# 3. Deploy changes via kubectl
# 4. Verify at https://service.dev.aztech-msdp.com
# 5. Repeat
```

#### **End of Day (1 minute):**
```bash
# Optional: Scale down to save costs
kubectl scale deployment --all --replicas=0 -n dev-santanu

# Or let auto-shutdown handle it at 6 PM GMT
```

## 🛠️ **Development Tools & Commands**

### **Essential Commands:**
```bash
# Service Status
kubectl get pods -n dev-santanu

# Service Logs
kubectl logs -f deployment/merchant-service -n dev-santanu

# Service Shell Access
kubectl exec -it deployment/merchant-service -n dev-santanu -- /bin/sh

# Quick Service Restart
kubectl rollout restart deployment/merchant-service -n dev-santanu

# Port Forward for Local Access
kubectl port-forward svc/merchant-service 3002:3002 -n dev-santanu
```

### **Debugging Commands:**
```bash
# Check ingress status
kubectl get ingress -n dev-santanu

# Check certificates
kubectl get certificates -n dev-santanu

# Check DNS entries
kubectl logs -n external-dns-system deployment/external-dns

# Check service endpoints
kubectl get endpoints -n dev-santanu
```

## 🎯 **Development Scenarios**

### **Frontend Team:**
- **Use**: Live backend APIs at `*.dev.aztech-msdp.com`
- **Develop**: Frontend apps in Windsurf
- **Deploy**: Frontend to Kubernetes when ready
- **Test**: Against real microservices

### **Backend Team:**
- **Use**: Kubernetes deployments for services
- **Develop**: Service code in Windsurf
- **Deploy**: Via `kubectl apply` or image updates
- **Test**: Via public HTTPS endpoints

### **Full-Stack Team:**
- **Use**: Hybrid approach - some local, some cloud
- **Develop**: Complete features end-to-end
- **Deploy**: Both frontend and backend
- **Test**: Complete user journeys

## 🔄 **Next Steps: Proper CI/CD**

### **What We'll Build:**
1. **GitHub Actions**: Automatic builds and deployments
2. **ArgoCD Integration**: GitOps workflow
3. **Staging Environment**: `*.test.aztech-msdp.com`
4. **Production Pipeline**: `*.aztech-msdp.com`

### **Developer Experience:**
```bash
# Future workflow:
git push origin feature/new-menu-analytics
# → Triggers CI/CD
# → Builds container
# → Deploys to dev environment
# → Runs tests
# → Ready for staging promotion
```

## 💡 **Pro Tips**

### **Windsurf + Cascade AI:**
- **Use AI for**: Code generation, debugging, API design
- **Ask Cascade**: "Help me create a new VendaBuddy analytics endpoint"
- **Get Help**: "Debug this Kubernetes deployment issue"

### **Kubernetes Development:**
- **Use namespaces**: Keep your work isolated in `dev-santanu`
- **Watch resources**: `kubectl get pods -w -n dev-santanu`
- **Use labels**: Filter and organize your deployments

### **API Development:**
- **Test early**: Use live services for immediate feedback
- **Document APIs**: Update OpenAPI specs as you go
- **Version APIs**: Plan for backward compatibility

## 🎉 **You're Ready to Develop!**

**Your MSDP platform is now a world-class development environment:**

✅ **Enterprise Infrastructure**: Same as Netflix, Uber, Spotify  
✅ **Live HTTPS Services**: Professional public endpoints  
✅ **SSL Certificates**: Automatic and secure  
✅ **DNS Management**: Fully automated  
✅ **Developer Friendly**: Windsurf + Cascade AI ready  
✅ **Production Ready**: Scalable and monitored  

**Start developing and let's build the future of VendaBuddy! 🚀**
