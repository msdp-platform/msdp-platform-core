# 🚀 MSDP Cloud-Native Development Environment

Enterprise-grade development environment for the MSDP platform using AKS, AWS Aurora Serverless, and Windsurf IDE with Telepresence.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Windsurf IDE (Local)                     │
│  • AI-powered development with Cascade                     │
│  • Git operations and code editing                         │
│  • Telepresence client for cluster connection             │
└─────────────────┬───────────────────────────────────────────┘
                  │ Telepresence Connection
┌─────────────────▼───────────────────────────────────────────┐
│              AKS Cluster (Existing)                        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐ │
│  │  dev-santanu    │ │   dev-cascade   │ │  staging-demo │ │
│  │  (Your Space)   │ │  (AI Dev Space) │ │ (Partner Demo)│ │
│  └─────────────────┘ └─────────────────┘ └───────────────┘ │
└─────────────────┬───────────────────────────────────────────┘
                  │ Private Connection
┌─────────────────▼───────────────────────────────────────────┐
│              AWS Development Environment                    │
│  • Aurora Serverless v2 (PostgreSQL)                      │
│  • ElastiCache Serverless (Redis)                         │
│  • Application Load Balancer                              │
│  • Auto-pause when inactive                               │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Benefits

- ✅ **Keep Windsurf + Cascade AI**: No need to switch to GitHub Codespaces
- ✅ **Zero Laptop Resources**: All compute happens in the cloud
- ✅ **Production-like Environment**: Real AWS services and Kubernetes
- ✅ **Fast Feedback Loop**: Instant deployment with hot reloading
- ✅ **Cost Optimized**: Auto-shutdown and serverless scaling
- ✅ **Enterprise Ready**: Scales with team growth

## 🛠️ Prerequisites

### Required Tools
- **Windsurf IDE** (your primary development environment)
- **kubectl** (Kubernetes CLI)
- **helm** (Kubernetes package manager)
- **skaffold** (Fast Kubernetes development)
- **telepresence** (Local-to-cluster development)
- **aws cli** (AWS services access)
- **azure cli** (AKS cluster access)

### Quick Setup
```bash
# Run the automated setup script
chmod +x dev-environment/scripts/setup-dev-tools.sh
./dev-environment/scripts/setup-dev-tools.sh
```

## 🚀 Quick Start

### 1. Initial Setup
```bash
# 1. Configure kubectl for AKS
az aks get-credentials --resource-group <your-rg> --name <your-cluster>

# 2. Configure AWS CLI for Aurora Serverless
aws configure

# 3. Apply Kubernetes namespaces
kubectl apply -f dev-environment/kubernetes/namespaces/

# 4. Verify setup
kubectl get namespaces | grep dev-
```

### 2. Start Development Environment
```bash
# Start your personal development environment
./dev-environment/scripts/dev-start.sh santanu

# Or use the alias (after restarting terminal)
msdp-start santanu
```

### 3. Connect Windsurf to Cluster
```bash
# Connect Telepresence to your namespace
telepresence connect --namespace=dev-santanu

# Intercept a service for local development
telepresence intercept merchant-service --port 3002:3002
```

### 4. Develop in Windsurf
- Open Windsurf IDE
- Edit code with Cascade AI assistance
- Changes are instantly reflected in the cluster
- Test against real AWS Aurora databases

### 5. Stop Environment (Save Costs)
```bash
# Stop your development environment
./dev-environment/scripts/dev-stop.sh santanu

# Or use the alias
msdp-stop santanu
```

## 🌍 Environment Types

### Development Environments

#### `dev-santanu` (Personal Development)
- **Resources**: 4 CPU, 8GB RAM
- **Auto-shutdown**: 6 PM GMT
- **Database**: msdp-dev-santanu (Aurora Serverless)
- **Purpose**: Your personal development space

#### `dev-cascade` (AI Development)
- **Resources**: 2 CPU, 4GB RAM  
- **Auto-shutdown**: 6 PM GMT
- **Database**: msdp-dev-cascade (Aurora Serverless)
- **Purpose**: AI-assisted development experiments

#### `staging-demo` (Business Demos)
- **Resources**: 8 CPU, 16GB RAM
- **Auto-shutdown**: Manual
- **Database**: msdp-staging-demo (Aurora Serverless)
- **Purpose**: Partner demonstrations

## 🔧 Development Profiles

### Full Platform (`--profile full`)
Deploys all services for complete platform development:
- Admin Service + Dashboard
- Merchant Service + Portal
- User Service
- Order Service
- Payment Service
- API Gateway

### Admin Focus (`--profile admin`)
Deploys admin-focused services:
- Admin Service + Dashboard
- User Service
- Monitoring tools

### Merchant Focus (`--profile merchant`)
Deploys business-focused services:
- Merchant Service + Portal
- Order Service
- Payment Service
- User Service

## 📡 Telepresence Workflow

### Basic Intercept
```bash
# Connect to cluster
telepresence connect --namespace=dev-santanu

# Intercept a service
telepresence intercept merchant-service --port 3002:3002

# Now code in Windsurf - traffic routes to your local code!
```

### Advanced Intercept with Headers
```bash
# Intercept only specific traffic
telepresence intercept merchant-service \
  --port 3002:3002 \
  --http-header=x-dev-user=santanu
```

### Multiple Service Development
```bash
# Intercept multiple services
telepresence intercept merchant-service --port 3002:3002
telepresence intercept order-service --port 3006:3006

# Work on multiple services simultaneously
```

## 💰 Cost Optimization

### Automatic Cost Controls
- **Auto-shutdown**: 6 PM GMT daily
- **Aurora auto-pause**: 5-30 minutes idle
- **Resource quotas**: CPU/Memory limits
- **Weekend shutdown**: Environments stop over weekends

### Manual Cost Controls
```bash
# Stop environment immediately
msdp-stop santanu

# Check resource usage
kubectl top pods -n dev-santanu

# Scale specific deployments
kubectl scale deployment merchant-service --replicas=0 -n dev-santanu
```

### Estimated Costs
```
Monthly Costs (with auto-shutdown):
├── AKS Compute: $50-100/month
├── Aurora Serverless: $30-60/month  
├── Storage: $20-30/month
└── Total: $100-190/month

Daily Costs (8 hours active):
├── AKS: ~$2-4/day
├── Aurora: ~$1-2/day
└── Total: ~$3-6/day
```

## 🔍 Monitoring & Debugging

### Check Environment Status
```bash
# Overall status
msdp-status

# Detailed pod information
kubectl get pods -n dev-santanu -o wide

# Service logs
kubectl logs -f deployment/merchant-service -n dev-santanu

# Interactive cluster management
k9s -n dev-santanu
```

### Database Connection
```bash
# Check Aurora Serverless status
aws rds describe-db-clusters --db-cluster-identifier msdp-dev-santanu

# Connect to database (if needed)
kubectl port-forward svc/postgresql 5432:5432 -n dev-santanu
```

### Telepresence Debugging
```bash
# List active intercepts
telepresence list

# Check connection status
telepresence status

# View intercept logs
telepresence gather-logs
```

## 🛠️ Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n dev-santanu

# Check resource quotas
kubectl describe resourcequota -n dev-santanu

# Check events
kubectl get events -n dev-santanu --sort-by='.lastTimestamp'
```

#### Telepresence Connection Issues
```bash
# Reset Telepresence
telepresence quit
telepresence connect --namespace=dev-santanu

# Check network connectivity
telepresence status
```

#### Database Connection Issues
```bash
# Check Aurora cluster status
aws rds describe-db-clusters --db-cluster-identifier msdp-dev-santanu

# Restart cluster if needed
aws rds start-db-cluster --db-cluster-identifier msdp-dev-santanu
```

#### Port Forwarding Issues
```bash
# Kill existing port forwards
pkill -f "kubectl port-forward"

# Restart port forwarding
kubectl port-forward svc/admin-dashboard 4000:4000 -n dev-santanu &
```

### Emergency Procedures

#### Complete Environment Reset
```bash
# Stop everything
msdp-stop santanu

# Delete and recreate namespace
kubectl delete namespace dev-santanu
kubectl apply -f dev-environment/kubernetes/namespaces/dev-santanu.yaml

# Restart environment
msdp-start santanu
```

#### Cost Emergency (Stop Everything)
```bash
# Stop all development environments
for ns in dev-santanu dev-cascade staging-demo; do
  kubectl scale deployment --all --replicas=0 -n $ns
done

# Stop all Aurora clusters
for cluster in msdp-dev-santanu msdp-dev-cascade msdp-staging-demo; do
  aws rds stop-db-cluster --db-cluster-identifier $cluster
done
```

## 📚 Advanced Usage

### Custom Environment Variables
Create `.env.dev` in your service directories:
```bash
# services/merchant-service/.env.dev
NODE_ENV=development
LOG_LEVEL=debug
DATABASE_URL=postgresql://user:pass@aurora-endpoint:5432/msdp_merchant_dev
REDIS_URL=redis://elasticache-endpoint:6379
```

### Custom Skaffold Profiles
Modify `skaffold.yaml` to add custom profiles:
```yaml
profiles:
- name: my-custom-profile
  build:
    artifacts:
    - image: msdp/my-service
      context: services/my-service
  deploy:
    helm:
      releases:
      - name: my-custom-stack
        chartPath: dev-environment/helm/my-stack
```

### Integration with CI/CD
The development environment integrates with your existing CI/CD:
- **GitHub Actions**: Automated testing on commits
- **ArgoCD**: GitOps deployment to staging/production
- **Helm**: Consistent packaging across environments

## 🎯 Best Practices

### Development Workflow
1. **Start environment**: `msdp-start santanu`
2. **Connect Telepresence**: `telepresence connect --namespace=dev-santanu`
3. **Intercept service**: `telepresence intercept merchant-service --port 3002:3002`
4. **Code in Windsurf** with Cascade AI assistance
5. **Test changes** against real cloud services
6. **Commit and push** when ready
7. **Stop environment**: `msdp-stop santanu`

### Code Organization
- Keep service-specific code in `services/` directories
- Use `.env.dev` files for development configuration
- Leverage Windsurf's AI capabilities for code generation
- Test against real databases and services

### Resource Management
- Use appropriate profiles (`admin`, `merchant`, `full`)
- Monitor resource usage with `kubectl top`
- Stop environments when not in use
- Use auto-shutdown for cost control

## 🤝 Team Collaboration

### Shared Development
- Each developer gets their own namespace
- Shared staging environment for demos
- Common database schemas and test data
- Collaborative debugging with shared access

### Environment Sharing
```bash
# Share your environment URL (when using preview URLs)
telepresence preview create --namespace=dev-santanu

# Access someone else's environment
kubectl port-forward svc/admin-dashboard 4001:4000 -n dev-cascade
```

## 📞 Support

### Getting Help
- **Documentation**: This README and inline comments
- **Logs**: Check service logs with `kubectl logs`
- **Status**: Use `msdp-status` for quick overview
- **Interactive**: Use `k9s` for visual cluster management

### Useful Commands Reference
```bash
# Environment management
msdp-start santanu          # Start development environment
msdp-stop santanu           # Stop development environment
msdp-status                 # Check status of all resources

# Kubernetes shortcuts
k get pods                  # List pods
k logs -f <pod>            # Follow logs
k describe pod <pod>       # Detailed pod info
k exec -it <pod> -- bash   # Shell into pod

# Telepresence
telepresence connect        # Connect to cluster
telepresence intercept     # Intercept service traffic
telepresence list          # List active intercepts
telepresence quit          # Disconnect from cluster

# Database
aws rds describe-db-clusters # List Aurora clusters
aws rds start-db-cluster    # Start Aurora cluster
aws rds stop-db-cluster     # Stop Aurora cluster
```

---

**🎉 Happy coding with Windsurf, Cascade AI, and your cloud-native development environment!**
