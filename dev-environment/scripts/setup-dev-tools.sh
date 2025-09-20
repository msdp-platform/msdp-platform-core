#!/bin/bash

# MSDP Development Tools Setup Script
# This script installs and configures all necessary tools for cloud-native development

set -e

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

# Check if running on macOS
check_os() {
    if [[ "$OSTYPE" != "darwin"* ]]; then
        error "This script is designed for macOS. Please install tools manually on other systems."
    fi
    log "✅ Running on macOS"
}

# Install Homebrew if not present
install_homebrew() {
    if command -v brew >/dev/null 2>&1; then
        log "✅ Homebrew already installed"
        brew update
    else
        log "Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        
        # Add Homebrew to PATH for Apple Silicon Macs
        if [[ -f "/opt/homebrew/bin/brew" ]]; then
            echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
            eval "$(/opt/homebrew/bin/brew shellenv)"
        fi
    fi
}

# Install kubectl
install_kubectl() {
    if command -v kubectl >/dev/null 2>&1; then
        log "✅ kubectl already installed: $(kubectl version --client --short)"
    else
        log "Installing kubectl..."
        brew install kubectl
    fi
}

# Install Helm
install_helm() {
    if command -v helm >/dev/null 2>&1; then
        log "✅ Helm already installed: $(helm version --short)"
    else
        log "Installing Helm..."
        brew install helm
    fi
}

# Install Skaffold
install_skaffold() {
    if command -v skaffold >/dev/null 2>&1; then
        log "✅ Skaffold already installed: $(skaffold version)"
    else
        log "Installing Skaffold..."
        brew install skaffold
    fi
}

# Install Telepresence
install_telepresence() {
    if command -v telepresence >/dev/null 2>&1; then
        log "✅ Telepresence already installed: $(telepresence version)"
    else
        log "Installing Telepresence..."
        brew install datawire/blackbird/telepresence
    fi
}

# Install Tilt (alternative to Skaffold)
install_tilt() {
    if command -v tilt >/dev/null 2>&1; then
        log "✅ Tilt already installed: $(tilt version)"
    else
        log "Installing Tilt..."
        brew install tilt
    fi
}

# Install K9s (Kubernetes cluster management)
install_k9s() {
    if command -v k9s >/dev/null 2>&1; then
        log "✅ K9s already installed: $(k9s version --short)"
    else
        log "Installing K9s..."
        brew install k9s
    fi
}

# Install AWS CLI
install_aws_cli() {
    if command -v aws >/dev/null 2>&1; then
        log "✅ AWS CLI already installed: $(aws --version)"
    else
        log "Installing AWS CLI..."
        brew install awscli
    fi
}

# Install Azure CLI
install_azure_cli() {
    if command -v az >/dev/null 2>&1; then
        log "✅ Azure CLI already installed: $(az version --query '"azure-cli"' -o tsv)"
    else
        log "Installing Azure CLI..."
        brew install azure-cli
    fi
}

# Install Docker Desktop (if not present)
install_docker() {
    if command -v docker >/dev/null 2>&1; then
        log "✅ Docker already installed: $(docker --version)"
    else
        warn "Docker Desktop not found. Please install Docker Desktop manually from:"
        warn "https://www.docker.com/products/docker-desktop"
        warn "Docker is required for local development and building images."
    fi
}

# Install jq for JSON processing
install_jq() {
    if command -v jq >/dev/null 2>&1; then
        log "✅ jq already installed: $(jq --version)"
    else
        log "Installing jq..."
        brew install jq
    fi
}

# Install yq for YAML processing
install_yq() {
    if command -v yq >/dev/null 2>&1; then
        log "✅ yq already installed: $(yq --version)"
    else
        log "Installing yq..."
        brew install yq
    fi
}

# Setup kubectl autocompletion
setup_kubectl_completion() {
    log "Setting up kubectl autocompletion..."
    
    # Add to .zshrc if using zsh
    if [[ "$SHELL" == *"zsh"* ]]; then
        if ! grep -q "kubectl completion zsh" ~/.zshrc 2>/dev/null; then
            echo "" >> ~/.zshrc
            echo "# kubectl autocompletion" >> ~/.zshrc
            echo "source <(kubectl completion zsh)" >> ~/.zshrc
            echo "alias k=kubectl" >> ~/.zshrc
            echo "complete -F __start_kubectl k" >> ~/.zshrc
        fi
    fi
    
    # Add to .bash_profile if using bash
    if [[ "$SHELL" == *"bash"* ]]; then
        if ! grep -q "kubectl completion bash" ~/.bash_profile 2>/dev/null; then
            echo "" >> ~/.bash_profile
            echo "# kubectl autocompletion" >> ~/.bash_profile
            echo "source <(kubectl completion bash)" >> ~/.bash_profile
            echo "alias k=kubectl" >> ~/.bash_profile
            echo "complete -F __start_kubectl k" >> ~/.bash_profile
        fi
    fi
}

# Setup Helm autocompletion
setup_helm_completion() {
    log "Setting up Helm autocompletion..."
    
    # Add to .zshrc if using zsh
    if [[ "$SHELL" == *"zsh"* ]]; then
        if ! grep -q "helm completion zsh" ~/.zshrc 2>/dev/null; then
            echo "" >> ~/.zshrc
            echo "# helm autocompletion" >> ~/.zshrc
            echo "source <(helm completion zsh)" >> ~/.zshrc
        fi
    fi
    
    # Add to .bash_profile if using bash
    if [[ "$SHELL" == *"bash"* ]]; then
        if ! grep -q "helm completion bash" ~/.bash_profile 2>/dev/null; then
            echo "" >> ~/.bash_profile
            echo "# helm autocompletion" >> ~/.bash_profile
            echo "source <(helm completion bash)" >> ~/.bash_profile
        fi
    fi
}

# Create development aliases
setup_dev_aliases() {
    log "Setting up development aliases..."
    
    ALIASES_FILE=""
    if [[ "$SHELL" == *"zsh"* ]]; then
        ALIASES_FILE=~/.zshrc
    elif [[ "$SHELL" == *"bash"* ]]; then
        ALIASES_FILE=~/.bash_profile
    fi
    
    if [[ -n "$ALIASES_FILE" ]]; then
        if ! grep -q "# MSDP Development Aliases" "$ALIASES_FILE" 2>/dev/null; then
            cat >> "$ALIASES_FILE" << 'EOF'

# MSDP Development Aliases
alias msdp-start='./dev-environment/scripts/dev-start.sh'
alias msdp-stop='./dev-environment/scripts/dev-stop.sh'
alias msdp-logs='kubectl logs -f'
alias msdp-pods='kubectl get pods'
alias msdp-services='kubectl get services'
alias msdp-intercept='telepresence intercept'
alias msdp-connect='telepresence connect'
alias msdp-status='kubectl get pods,services,ingresses'

# Kubernetes shortcuts
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get services'
alias kgi='kubectl get ingresses'
alias kdp='kubectl describe pod'
alias kds='kubectl describe service'
alias klf='kubectl logs -f'

# Development shortcuts
alias dev-santanu='./dev-environment/scripts/dev-start.sh santanu'
alias dev-cascade='./dev-environment/scripts/dev-start.sh cascade'
alias staging-demo='PROFILE=staging ./dev-environment/scripts/dev-start.sh staging'
EOF
        fi
    fi
}

# Verify installations
verify_installations() {
    log "Verifying installations..."
    
    local tools=("kubectl" "helm" "skaffold" "telepresence" "tilt" "k9s" "aws" "az" "docker" "jq" "yq")
    local failed=()
    
    for tool in "${tools[@]}"; do
        if command -v "$tool" >/dev/null 2>&1; then
            log "✅ $tool: $(command -v "$tool")"
        else
            warn "❌ $tool: not found"
            failed+=("$tool")
        fi
    done
    
    if [[ ${#failed[@]} -gt 0 ]]; then
        warn "Some tools failed to install: ${failed[*]}"
        warn "Please install them manually or re-run this script"
    else
        log "🎉 All tools installed successfully!"
    fi
}

# Make scripts executable
make_scripts_executable() {
    log "Making development scripts executable..."
    
    chmod +x dev-environment/scripts/dev-start.sh
    chmod +x dev-environment/scripts/dev-stop.sh
    chmod +x dev-environment/scripts/setup-dev-tools.sh
    
    log "✅ Scripts are now executable"
}

# Show next steps
show_next_steps() {
    log "🎉 Development tools setup complete!"
    echo
    echo -e "${BLUE}📋 Next Steps:${NC}"
    echo -e "  1. ${YELLOW}Restart your terminal${NC} to load new aliases and completions"
    echo -e "  2. ${YELLOW}Configure kubectl${NC} to connect to your AKS cluster:"
    echo -e "     ${GREEN}az aks get-credentials --resource-group <rg-name> --name <cluster-name>${NC}"
    echo -e "  3. ${YELLOW}Configure AWS CLI${NC} for Aurora Serverless access:"
    echo -e "     ${GREEN}aws configure${NC}"
    echo -e "  4. ${YELLOW}Apply Kubernetes namespaces${NC}:"
    echo -e "     ${GREEN}kubectl apply -f dev-environment/kubernetes/namespaces/${NC}"
    echo -e "  5. ${YELLOW}Start your development environment${NC}:"
    echo -e "     ${GREEN}./dev-environment/scripts/dev-start.sh santanu${NC}"
    echo
    echo -e "${BLUE}🛠️  Available Commands:${NC}"
    echo -e "  • ${GREEN}msdp-start santanu${NC}     - Start your development environment"
    echo -e "  • ${GREEN}msdp-stop santanu${NC}      - Stop your development environment"
    echo -e "  • ${GREEN}msdp-status${NC}            - Check status of all resources"
    echo -e "  • ${GREEN}k9s${NC}                    - Interactive Kubernetes management"
    echo -e "  • ${GREEN}telepresence connect${NC}   - Connect to cluster for intercepts"
    echo
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo -e "  • Telepresence: https://www.telepresence.io/docs/"
    echo -e "  • Skaffold: https://skaffold.dev/docs/"
    echo -e "  • K9s: https://k9scli.io/"
    echo
}

# Main execution
main() {
    log "🚀 Setting up MSDP Development Tools"
    echo
    
    check_os
    install_homebrew
    install_kubectl
    install_helm
    install_skaffold
    install_telepresence
    install_tilt
    install_k9s
    install_aws_cli
    install_azure_cli
    install_docker
    install_jq
    install_yq
    setup_kubectl_completion
    setup_helm_completion
    setup_dev_aliases
    make_scripts_executable
    verify_installations
    show_next_steps
    
    log "✅ Development tools setup complete!"
}

# Run main function
main "$@"
