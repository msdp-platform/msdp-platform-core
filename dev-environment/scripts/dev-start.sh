#!/bin/bash

# MSDP Development Environment Startup Script
# Usage: ./dev-start.sh [developer-name] [profile]

set -e

# Configuration
DEVELOPER=${1:-santanu}
PROFILE=${2:-full}
NAMESPACE="dev-${DEVELOPER}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    command -v kubectl >/dev/null 2>&1 || error "kubectl is required but not installed"
    command -v helm >/dev/null 2>&1 || error "helm is required but not installed"
    command -v skaffold >/dev/null 2>&1 || error "skaffold is required but not installed"
    command -v telepresence >/dev/null 2>&1 || error "telepresence is required but not installed"
    
    # Check kubectl context
    CURRENT_CONTEXT=$(kubectl config current-context)
    log "Current kubectl context: ${CURRENT_CONTEXT}"
    
    if [[ ! "${CURRENT_CONTEXT}" =~ "msdp" ]]; then
        warn "Current context doesn't appear to be MSDP cluster. Continue? (y/N)"
        read -r response
        if [[ ! "${response}" =~ ^[Yy]$ ]]; then
            error "Aborted by user"
        fi
    fi
}

# Create or update namespace
setup_namespace() {
    log "Setting up namespace: ${NAMESPACE}"
    
    if kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
        log "Namespace ${NAMESPACE} already exists"
    else
        log "Creating namespace ${NAMESPACE}"
        kubectl apply -f "${PROJECT_ROOT}/dev-environment/kubernetes/namespaces/dev-${DEVELOPER}.yaml"
    fi
    
    # Label namespace as active
    kubectl label namespace "${NAMESPACE}" environment=active --overwrite
    kubectl label namespace "${NAMESPACE}" last-started="$(date -u +%Y%m%d-%H%M%S)" --overwrite
}

# Setup AWS Aurora Serverless connection
setup_aws_databases() {
    log "Setting up AWS Aurora Serverless databases..."
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        warn "AWS CLI not configured. Skipping database setup."
        return
    fi
    
    # Database cluster identifier
    DB_CLUSTER="msdp-${NAMESPACE}"
    
    # Check if cluster exists
    if aws rds describe-db-clusters --db-cluster-identifier "${DB_CLUSTER}" >/dev/null 2>&1; then
        log "Database cluster ${DB_CLUSTER} exists"
        
        # Start the cluster if it's stopped
        CLUSTER_STATUS=$(aws rds describe-db-clusters --db-cluster-identifier "${DB_CLUSTER}" --query 'DBClusters[0].Status' --output text)
        if [[ "${CLUSTER_STATUS}" == "stopped" ]]; then
            log "Starting database cluster ${DB_CLUSTER}"
            aws rds start-db-cluster --db-cluster-identifier "${DB_CLUSTER}"
            log "Waiting for database cluster to start..."
            aws rds wait db-cluster-available --db-cluster-identifier "${DB_CLUSTER}"
        fi
    else
        warn "Database cluster ${DB_CLUSTER} does not exist. Please create it manually or run setup-aws-resources.sh"
    fi
}

# Deploy services using Skaffold
deploy_services() {
    log "Deploying services to ${NAMESPACE} with profile: ${PROFILE}"
    
    cd "${PROJECT_ROOT}"
    
    # Check if skaffold.yaml exists
    if [[ ! -f "skaffold.yaml" ]]; then
        warn "skaffold.yaml not found. Creating basic configuration..."
        create_skaffold_config
    fi
    
    # Deploy with Skaffold
    log "Starting Skaffold deployment..."
    skaffold dev --namespace="${NAMESPACE}" --profile="${PROFILE}" --port-forward &
    SKAFFOLD_PID=$!
    
    # Store PID for cleanup
    echo "${SKAFFOLD_PID}" > "/tmp/skaffold-${NAMESPACE}.pid"
    
    log "Skaffold started with PID: ${SKAFFOLD_PID}"
    log "Waiting for services to be ready..."
    sleep 30
}

# Setup Telepresence connection
setup_telepresence() {
    log "Setting up Telepresence connection to ${NAMESPACE}"
    
    # Connect to the cluster
    telepresence connect --namespace="${NAMESPACE}"
    
    log "Telepresence connected. You can now intercept services:"
    log "  telepresence intercept merchant-service --port 3002:3002"
    log "  telepresence intercept admin-service --port 3005:3005"
}

# Create basic Skaffold configuration if it doesn't exist
create_skaffold_config() {
    cat > skaffold.yaml << EOF
apiVersion: skaffold/v4beta1
kind: Config
metadata:
  name: msdp-development
profiles:
- name: full
  activation:
  - env: PROFILE=full
  build:
    artifacts:
    - image: msdp/admin-service
      context: services/admin-service
    - image: msdp/merchant-service
      context: services/merchant-service
    - image: msdp/user-service
      context: services/user-service
    - image: msdp/order-service
      context: services/order-service
    - image: msdp/payment-service
      context: services/payment-service
    - image: msdp/api-gateway
      context: services/api-gateway
  deploy:
    helm:
      releases:
      - name: msdp-platform
        chartPath: dev-environment/helm/msdp-platform
        valuesFiles:
        - dev-environment/helm/values/\${PROFILE}.yaml
        setValues:
          global.namespace: \${SKAFFOLD_NAMESPACE}
          global.environment: development

- name: admin
  activation:
  - env: PROFILE=admin
  build:
    artifacts:
    - image: msdp/admin-service
      context: services/admin-service
    - image: msdp/user-service
      context: services/user-service
  deploy:
    helm:
      releases:
      - name: msdp-admin-stack
        chartPath: dev-environment/helm/admin-stack
        setValues:
          global.namespace: \${SKAFFOLD_NAMESPACE}

- name: merchant
  activation:
  - env: PROFILE=merchant
  build:
    artifacts:
    - image: msdp/merchant-service
      context: services/merchant-service
    - image: msdp/order-service
      context: services/order-service
    - image: msdp/payment-service
      context: services/payment-service
  deploy:
    helm:
      releases:
      - name: msdp-merchant-stack
        chartPath: dev-environment/helm/merchant-stack
        setValues:
          global.namespace: \${SKAFFOLD_NAMESPACE}
EOF
    log "Created basic skaffold.yaml configuration"
}

# Setup ingress and port forwarding
setup_access() {
    log "Setting up access to services..."
    
    # Wait for services to be ready
    kubectl wait --for=condition=ready pod -l app=admin-dashboard -n "${NAMESPACE}" --timeout=300s || warn "Admin dashboard not ready"
    kubectl wait --for=condition=ready pod -l app=merchant-webapp -n "${NAMESPACE}" --timeout=300s || warn "Merchant webapp not ready"
    
    # Setup port forwarding in background
    log "Setting up port forwarding..."
    
    # Kill existing port forwards
    pkill -f "kubectl port-forward.*${NAMESPACE}" || true
    
    # Admin Dashboard
    kubectl port-forward -n "${NAMESPACE}" svc/admin-dashboard 4000:4000 > "/tmp/port-forward-admin-${NAMESPACE}.log" 2>&1 &
    echo $! > "/tmp/port-forward-admin-${NAMESPACE}.pid"
    
    # Merchant Portal
    kubectl port-forward -n "${NAMESPACE}" svc/merchant-webapp 4003:4003 > "/tmp/port-forward-merchant-${NAMESPACE}.log" 2>&1 &
    echo $! > "/tmp/port-forward-merchant-${NAMESPACE}.pid"
    
    # API Gateway
    kubectl port-forward -n "${NAMESPACE}" svc/api-gateway 3000:3000 > "/tmp/port-forward-gateway-${NAMESPACE}.log" 2>&1 &
    echo $! > "/tmp/port-forward-gateway-${NAMESPACE}.pid"
    
    sleep 5
    
    log "Port forwarding setup complete!"
}

# Display access information
show_access_info() {
    log "🎉 Development environment ready for ${DEVELOPER}!"
    echo
    echo -e "${BLUE}📊 Access URLs:${NC}"
    echo -e "  🔧 Admin Dashboard:  ${GREEN}http://localhost:4000${NC}"
    echo -e "  🏪 Merchant Portal:  ${GREEN}http://localhost:4003${NC}"
    echo -e "  🌐 API Gateway:      ${GREEN}http://localhost:3000${NC}"
    echo
    echo -e "${BLUE}🔧 Development Commands:${NC}"
    echo -e "  📡 Connect Telepresence: ${YELLOW}telepresence connect --namespace=${NAMESPACE}${NC}"
    echo -e "  🔄 Intercept Service:    ${YELLOW}telepresence intercept merchant-service --port 3002:3002${NC}"
    echo -e "  📋 View Logs:           ${YELLOW}kubectl logs -f deployment/merchant-service -n ${NAMESPACE}${NC}"
    echo -e "  🛑 Stop Environment:     ${YELLOW}./dev-stop.sh ${DEVELOPER}${NC}"
    echo
    echo -e "${BLUE}💡 Tips:${NC}"
    echo -e "  • Use Windsurf IDE with Telepresence for the best development experience"
    echo -e "  • Services will auto-shutdown at 6 PM GMT to save costs"
    echo -e "  • Check service status: ${YELLOW}kubectl get pods -n ${NAMESPACE}${NC}"
    echo
}

# Main execution
main() {
    log "🚀 Starting MSDP Development Environment"
    log "Developer: ${DEVELOPER}"
    log "Profile: ${PROFILE}"
    log "Namespace: ${NAMESPACE}"
    echo
    
    check_prerequisites
    setup_namespace
    setup_aws_databases
    deploy_services
    setup_access
    setup_telepresence
    show_access_info
    
    log "✅ Development environment startup complete!"
    log "Press Ctrl+C to stop the environment"
    
    # Keep script running
    trap 'log "Shutting down..."; ./dev-stop.sh ${DEVELOPER}; exit 0' INT TERM
    
    # Monitor the environment
    while true; do
        sleep 60
        if ! kill -0 "${SKAFFOLD_PID}" 2>/dev/null; then
            warn "Skaffold process died. Restarting..."
            deploy_services
        fi
    done
}

# Run main function
main "$@"
