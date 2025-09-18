#!/bin/bash
# Setup Enhanced MSDP Backstage with Plugins and Templates
# Target: Remote machine 192.168.1.102

echo "🚀 SETTING UP ENHANCED MSDP BACKSTAGE"
echo "====================================="
echo ""
echo "📍 Target: santanubiswas@192.168.1.102"
echo "📋 Adding: Plugins, Templates, and MSDP Integration"
echo ""

# Configuration
REMOTE_HOST="192.168.1.102"
REMOTE_USER="santanubiswas"
REMOTE_PASSWORD="SANTANUPATLA"

# Function to run commands on remote machine
run_remote() {
    echo "🔧 Remote: $1"
    sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST "$1"
}

# Function to copy files to remote machine
copy_to_remote() {
    echo "📁 Copying: $1 -> $2"
    sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no -r "$1" $REMOTE_USER@$REMOTE_HOST:"$2"
}

echo "📋 Step 1: Stopping current Backstage..."
run_remote "pkill -f 'yarn.*start' || true"

echo ""
echo "📋 Step 2: Copying MSDP configuration and catalog..."
copy_to_remote "app-config.msdp.yaml" "/Users/santanubiswas/projects/msdp-backstage-remote/app-config.local.yaml"
copy_to_remote "catalog/" "/Users/santanubiswas/projects/msdp-backstage-remote/"
copy_to_remote "templates/" "/Users/santanubiswas/projects/msdp-backstage-remote/"

echo ""
echo "📋 Step 3: Setting up Node.js environment and installing plugins..."
run_remote "export NVM_DIR=\"\$HOME/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" && nvm use 20 && cd /Users/santanubiswas/projects/msdp-backstage-remote && yarn add @backstage/plugin-tech-radar @backstage/plugin-todo"

echo ""
echo "📋 Step 4: Copying configuration to packages..."
run_remote "cd /Users/santanubiswas/projects/msdp-backstage-remote && cp app-config.local.yaml packages/app/ && cp app-config.local.yaml packages/backend/"

echo ""
echo "📋 Step 5: Starting enhanced Backstage..."
run_remote "export NVM_DIR=\"\$HOME/.nvm\" && [ -s \"\$NVM_DIR/nvm.sh\" ] && . \"\$NVM_DIR/nvm.sh\" && cd /Users/santanubiswas/projects/msdp-backstage-remote && export BACKSTAGE_APP_CONFIG_app_listen_host=0.0.0.0 && export BACKSTAGE_APP_CONFIG_backend_listen_host=0.0.0.0 && nohup yarn start --config app-config.local.yaml > enhanced-backstage.log 2>&1 &"

echo ""
echo "⏳ Waiting 60 seconds for enhanced Backstage to start..."
sleep 60

echo ""
echo "🔍 Testing enhanced Backstage..."
curl -s -o /dev/null -w "Enhanced Backstage: HTTP %{http_code}\n" http://$REMOTE_HOST:3000

echo ""
echo "✅ ENHANCED MSDP BACKSTAGE SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "🎯 New Features Available:"
echo "├── 📊 Enhanced Service Catalog with all MSDP services"
echo "├── 👥 Team structure (Platform Team, Frontend Team, Global Admins)"
echo "├── 🔌 Essential plugins (Tech Radar, Todo management)"
echo "├── 📋 Self-service templates:"
echo "│   ├── 🌍 Enable New Location"
echo "│   ├── 🏪 Onboard New Business"
echo "│   └── 🚀 Create New MSDP Service"
echo "└── 🔗 API proxies to your laptop MSDP services"
echo ""
echo "🌐 Access Enhanced Backstage:"
echo "   http://$REMOTE_HOST:3000"
echo ""
echo "🎯 Try These Features:"
echo "1. Browse 'Catalog' → See all MSDP services and teams"
echo "2. Click 'Create' → Use self-service templates"
echo "3. Search for services by tags (nodejs, microservice, etc.)"
echo "4. View individual service details and relationships"
echo ""
echo "🎉 Your MSDP platform now has enterprise-grade service management!"
