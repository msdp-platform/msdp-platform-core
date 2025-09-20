#!/bin/bash

# MSDP Development Environment Shutdown Script
# Usage: ./dev-stop.sh [developer-name]

set -e

# Configuration
DEVELOPER=${1:-santanu}
NAMESPACE="dev-${DEVELOPER}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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
}

# Stop Skaffold processes
stop_skaffold() {
    log "Stopping Skaffold processes for ${NAMESPACE}..."
    
    if [[ -f "/tmp/skaffold-${NAMESPACE}.pid" ]]; then
        SKAFFOLD_PID=$(cat "/tmp/skaffold-${NAMESPACE}.pid")
        if kill -0 "${SKAFFOLD_PID}" 2>/dev/null; then
            log "Stopping Skaffold process ${SKAFFOLD_PID}"
            kill "${SKAFFOLD_PID}" || warn "Failed to stop Skaffold process"
            sleep 5
            # Force kill if still running
            if kill -0 "${SKAFFOLD_PID}" 2>/dev/null; then
                kill -9 "${SKAFFOLD_PID}" || warn "Failed to force stop Skaffold process"
            fi
        fi
        rm -f "/tmp/skaffold-${NAMESPACE}.pid"
    fi
    
    # Kill any remaining skaffold processes for this namespace
    pkill -f "skaffold.*${NAMESPACE}" || true
}

# Stop port forwarding
stop_port_forwarding() {
    log "Stopping port forwarding for ${NAMESPACE}..."
    
    # Stop specific port forwards
    for service in admin merchant gateway; do
        if [[ -f "/tmp/port-forward-${service}-${NAMESPACE}.pid" ]]; then
            PID=$(cat "/tmp/port-forward-${service}-${NAMESPACE}.pid")
            if kill -0 "${PID}" 2>/dev/null; then
                kill "${PID}" || warn "Failed to stop port forward for ${service}"
            fi
            rm -f "/tmp/port-forward-${service}-${NAMESPACE}.pid"
            rm -f "/tmp/port-forward-${service}-${NAMESPACE}.log"
        fi
    done
    
    # Kill any remaining port forwards for this namespace
    pkill -f "kubectl port-forward.*${NAMESPACE}" || true
}

# Disconnect Telepresence
stop_telepresence() {
    log "Disconnecting Telepresence..."
    
    # List active intercepts for this namespace
    if telepresence list --namespace="${NAMESPACE}" 2>/dev/null | grep -q "intercepted"; then
        log "Stopping active intercepts in ${NAMESPACE}"
        telepresence leave --namespace="${NAMESPACE}" || warn "Failed to leave intercepts"
    fi
    
    # Quit telepresence if no other namespaces are using it
    if ! telepresence list 2>/dev/null | grep -q "intercepted"; then
        telepresence quit || warn "Failed to quit Telepresence"
    fi
}

# Scale down deployments
scale_down_services() {
    log "Scaling down services in ${NAMESPACE}..."
    
    # Check if namespace exists
    if ! kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
        warn "Namespace ${NAMESPACE} does not exist"
        return
    fi
    
    # Scale down all deployments
    DEPLOYMENTS=$(kubectl get deployments -n "${NAMESPACE}" -o name 2>/dev/null || true)
    if [[ -n "${DEPLOYMENTS}" ]]; then
        log "Scaling down deployments..."
        kubectl scale deployment --all --replicas=0 -n "${NAMESPACE}" || warn "Failed to scale down deployments"
        
        # Wait for pods to terminate
        log "Waiting for pods to terminate..."
        kubectl wait --for=delete pod --all -n "${NAMESPACE}" --timeout=60s || warn "Some pods may still be terminating"
    else
        log "No deployments found in ${NAMESPACE}"
    fi
    
    # Scale down statefulsets if any
    STATEFULSETS=$(kubectl get statefulsets -n "${NAMESPACE}" -o name 2>/dev/null || true)
    if [[ -n "${STATEFULSETS}" ]]; then
        log "Scaling down statefulsets..."
        kubectl scale statefulset --all --replicas=0 -n "${NAMESPACE}" || warn "Failed to scale down statefulsets"
    fi
}

# Pause AWS Aurora Serverless
pause_aws_databases() {
    log "Pausing AWS Aurora Serverless databases..."
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        warn "AWS CLI not configured. Skipping database pause."
        return
    fi
    
    # Database cluster identifier
    DB_CLUSTER="msdp-${NAMESPACE}"
    
    # Check if cluster exists and is running
    if aws rds describe-db-clusters --db-cluster-identifier "${DB_CLUSTER}" >/dev/null 2>&1; then
        CLUSTER_STATUS=$(aws rds describe-db-clusters --db-cluster-identifier "${DB_CLUSTER}" --query 'DBClusters[0].Status' --output text)
        
        if [[ "${CLUSTER_STATUS}" == "available" ]]; then
            log "Stopping database cluster ${DB_CLUSTER}"
            aws rds stop-db-cluster --db-cluster-identifier "${DB_CLUSTER}" || warn "Failed to stop database cluster"
        else
            log "Database cluster ${DB_CLUSTER} is already ${CLUSTER_STATUS}"
        fi
    else
        log "Database cluster ${DB_CLUSTER} does not exist"
    fi
}

# Update namespace labels
update_namespace_labels() {
    log "Updating namespace labels..."
    
    if kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
        kubectl label namespace "${NAMESPACE}" environment=inactive --overwrite
        kubectl label namespace "${NAMESPACE}" last-stopped="$(date -u +%Y%m%d-%H%M%S)" --overwrite
        kubectl label namespace "${NAMESPACE}" auto-shutdown- || true  # Remove auto-shutdown label
    fi
}

# Clean up temporary files
cleanup_temp_files() {
    log "Cleaning up temporary files..."
    
    rm -f "/tmp/skaffold-${NAMESPACE}.pid"
    rm -f "/tmp/port-forward-*-${NAMESPACE}.pid"
    rm -f "/tmp/port-forward-*-${NAMESPACE}.log"
}

# Show cost savings information
show_cost_info() {
    log "💰 Cost optimization complete!"
    echo
    echo -e "${BLUE}💡 Resources stopped:${NC}"
    echo -e "  🔧 AKS deployments scaled to 0 replicas"
    echo -e "  🗄️  Aurora Serverless cluster paused"
    echo -e "  🌐 Port forwarding stopped"
    echo -e "  📡 Telepresence disconnected"
    echo
    echo -e "${GREEN}💵 Estimated cost savings:${NC}"
    echo -e "  • AKS compute: ~$0.10-0.20/hour saved"
    echo -e "  • Aurora Serverless: ~$0.05-0.15/hour saved"
    echo -e "  • Total: ~$0.15-0.35/hour saved"
    echo
    echo -e "${BLUE}🚀 To restart:${NC}"
    echo -e "  ${YELLOW}./dev-start.sh ${DEVELOPER}${NC}"
    echo
}

# Main execution
main() {
    log "🛑 Stopping MSDP Development Environment"
    log "Developer: ${DEVELOPER}"
    log "Namespace: ${NAMESPACE}"
    echo
    
    stop_skaffold
    stop_port_forwarding
    stop_telepresence
    scale_down_services
    pause_aws_databases
    update_namespace_labels
    cleanup_temp_files
    show_cost_info
    
    log "✅ Development environment shutdown complete!"
}

# Handle script interruption
trap 'error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"
