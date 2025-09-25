#!/bin/bash

# Setup script for AI API keys in Crossplane
# This script helps you configure your OpenAI and Claude API keys

set -e

echo "🤖 AI-Powered Crossplane Setup"
echo "================================"

# Check if API keys are provided as environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY environment variable not set"
    echo "Please set it with: export OPENAI_API_KEY='your-openai-key'"
    echo "Or run: read -s OPENAI_API_KEY && export OPENAI_API_KEY"
    exit 1
fi

if [ -z "$CLAUDE_API_KEY" ]; then
    echo "❌ CLAUDE_API_KEY environment variable not set" 
    echo "Please set it with: export CLAUDE_API_KEY='your-claude-key'"
    echo "Or run: read -s CLAUDE_API_KEY && export CLAUDE_API_KEY"
    exit 1
fi

echo "✅ API keys found in environment variables"

# Base64 encode the API keys
OPENAI_API_KEY_B64=$(echo -n "${OPENAI_API_KEY}" | base64)
CLAUDE_API_KEY_B64=$(echo -n "${CLAUDE_API_KEY}" | base64)

# Optional: Set custom OpenAI base URL and model
OPENAI_BASE_URL=${OPENAI_BASE_URL:-"https://api.openai.com/v1"}
OPENAI_MODEL=${OPENAI_MODEL:-"gpt-4"}

OPENAI_BASE_URL_B64=$(echo -n "${OPENAI_BASE_URL}" | base64)
OPENAI_MODEL_B64=$(echo -n "${OPENAI_MODEL}" | base64)

echo "🔐 Generating Kubernetes secrets..."

# Generate the secrets YAML
cat <<EOF > infrastructure/crossplane-infra/openai-secret-generated.yaml
# Auto-generated OpenAI and Claude API secrets
# Generated on: $(date)
apiVersion: v1
kind: Secret
metadata:
  name: gpt
  namespace: crossplane-system
type: Opaque
data:
  OPENAI_API_KEY: ${OPENAI_API_KEY_B64}
  OPENAI_BASE_URL: ${OPENAI_BASE_URL_B64}
  OPENAI_MODEL: ${OPENAI_MODEL_B64}

---
apiVersion: v1
kind: Secret
metadata:
  name: claude
  namespace: crossplane-system
type: Opaque
data:
  ANTHROPIC_API_KEY: ${CLAUDE_API_KEY_B64}
EOF

echo "✅ Secrets generated: infrastructure/crossplane-infra/openai-secret-generated.yaml"

# Apply the secrets to the cluster
echo "🚀 Applying secrets to Kubernetes cluster..."
kubectl apply -f infrastructure/crossplane-infra/openai-secret-generated.yaml

echo "✅ API key secrets applied successfully!"

# Restart the AI functions to pick up the new secrets
echo "🔄 Restarting AI functions to pick up new API keys..."
kubectl delete pods -n crossplane-system -l "pkg.crossplane.io/function=function-openai" --ignore-not-found=true
kubectl delete pods -n crossplane-system -l "pkg.crossplane.io/function=function-claude" --ignore-not-found=true

echo "⏳ Waiting for AI functions to restart..."
sleep 10

# Check the status
echo "📊 Checking AI function status..."
kubectl get functions.pkg.crossplane.io function-openai function-claude

echo ""
echo "🎉 Setup complete! Your AI functions should now work with your API keys."
echo ""
echo "Next steps:"
echo "1. Wait for functions to become healthy (may take 1-2 minutes)"
echo "2. Create an AIApp claim to test the AI infrastructure generation"
echo "3. Monitor the logs: kubectl logs -n crossplane-system -l pkg.crossplane.io/function=function-openai"
echo ""
echo "Example AIApp claim:"
echo "kubectl apply -f - <<EOF"
echo "apiVersion: platform.msdp.com/v1alpha1"
echo "kind: AIApp"
echo "metadata:"
echo "  name: test-ai-app"
echo "spec:"
echo "  prompt: 'Create a simple web API with database'"
echo "  appName: 'test-app'"
echo "  aiProvider: 'auto'"
echo "EOF"
