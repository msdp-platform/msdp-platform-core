# MSDP 3-Tier Architecture with Crossplane

This directory contains a clean, production-ready 3-tier architecture implementation using Community Crossplane with Go templating and auto-ready functions.

## 🏗️ Architecture Overview

### **3-Tier Application Stack:**
- **Tier 1 (Frontend)**: S3 Static Website with custom HTML
- **Tier 2 (Backend)**: Lambda Functions + API Gateway
- **Tier 3 (Database)**: PostgreSQL RDS with encryption

### **Crossplane Functions Used:**
- ✅ `function-go-templating`: Template-based resource generation
- ✅ `function-auto-ready`: Automatic resource readiness detection

## 📁 Files Structure

```
infrastructure/crossplane-infra/
├── 3tier-xrd.yaml              # CompositeResourceDefinition schema
├── 3tier-composition.yaml      # Composition with Go templating
├── argocd-application.yaml     # GitOps deployment configuration
├── demo-3tier-app.yaml         # Example application deployment
└── README.md                   # This documentation
```
```bash
# Deploy the ArgoCD application (requires permission)
kubectl apply -f argocd-application.yaml
```

### **Deploy Manually (Alternative)**
```bash
# 1. Deploy XRD and Composition (requires permission)
kubectl apply -f 3tier-xrd.yaml
kubectl apply -f 3tier-composition.yaml

# 2. Deploy demo application (requires permission)
kubectl apply -f demo-3tier-app.yaml

# Check application status
kubectl get tierapp demo-ecommerce-app
kubectl describe tierapp demo-ecommerce-app
```

## 📊 Resource Monitoring

### **Check Crossplane Resources:**
```bash
# Check XRD status
kubectl get xrd

# Check compositions
kubectl get compositions

# Check functions
kubectl get functions.pkg.crossplane.io

# Check managed resources
kubectl get managed
```

### **Check AWS Resources:**
```bash
# Database instances
kubectl get instances.rds.aws.upbound.io

# Lambda functions
kubectl get functions.lambda.aws.upbound.io

# S3 buckets
kubectl get buckets.s3.aws.upbound.io

# API Gateways
kubectl get restapis.apigateway.aws.upbound.io
```

## 🎛️ Configuration Options

### **Application Specification:**
```yaml
spec:
  appName: your-app-name          # Required: Application name
  environment: dev|staging|prod   # Required: Environment
  
  frontend:
    enabled: true|false           # Enable/disable frontend tier
    type: static-website          # Frontend type
    
  backend:
    enabled: true|false           # Enable/disable backend tier
    type: lambda                  # Backend type
    runtime: nodejs18.x           # Lambda runtime
    memory: 512                   # Memory in MB
    timeout: 30                   # Timeout in seconds
    
  database:
    enabled: true|false           # Enable/disable database tier
    engine: postgresql            # Database engine
    version: "15.4"               # Database version
    instanceClass: db.t3.micro    # Instance size
    allocatedStorage: 20          # Storage in GB
    multiAZ: false                # Multi-AZ deployment
    
  constraints:
    region: eu-west-1             # AWS region
    budget: low|medium|high       # Cost optimization
    performance: basic|standard   # Performance tier
    security: enhanced            # Security level
```

## 🔍 Troubleshooting

### **Common Issues:**

1. **XRD Not Ready:**
   ```bash
   kubectl describe xrd x3tierapps.platform.msdp.com
   ```

2. **Composition Issues:**
   ```bash
   kubectl describe composition 3tier-architecture
   kubectl logs -n crossplane-system deployment/crossplane
   ```

3. **Function Problems:**
   ```bash
   kubectl get functions.pkg.crossplane.io
   kubectl logs -n crossplane-system -l pkg.crossplane.io/function=function-go-templating
   ```

4. **AWS Resource Failures:**
   ```bash
   kubectl describe instances.rds.aws.upbound.io
   kubectl describe functions.lambda.aws.upbound.io
   ```

## 🎯 Features

### **✅ Working Features:**
- Complete 3-tier architecture generation
- Go template-based resource creation
- Automatic resource readiness detection
- GitOps deployment via ArgoCD
- AWS multi-service integration
- Environment-specific configurations
- Security best practices

### **🔧 Customization:**
- Configurable per-tier settings
- Environment-specific parameters
- Budget and performance constraints
- Security level adjustments
- Regional deployment options

## 📈 Next Steps

1. **Test Deployment**: Deploy demo application and verify all tiers
2. **Custom Applications**: Create your own TierApp resources
3. **Monitoring**: Set up observability for deployed resources
4. **Scaling**: Add more composition variants for different use cases
5. **Security**: Implement additional security configurations

## 🏷️ Labels and Annotations

All resources use consistent labeling:
- `app.kubernetes.io/name`: Resource name
- `app.kubernetes.io/component`: Component type
- `app.kubernetes.io/part-of`: msdp-platform
- `msdp.platform/architecture`: 3tier
- `msdp.platform/environment`: Environment name

This ensures proper resource organization and management across the platform.
