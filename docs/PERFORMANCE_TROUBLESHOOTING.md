# MSDP Platform Performance Troubleshooting Guide

## 🚨 Common Performance Issues and Solutions

### **Issue 1: Multiple npm processes running outside Docker**

**Symptoms:**
- High CPU usage (100%+ on multiple cores)
- High memory usage (1GB+ per npm process)
- Port conflicts between npm and Docker
- Applications showing as "unhealthy" in Docker

**Cause:**
Running npm dev servers in IDE terminals while also running Docker containers.

**Solution:**
```bash
# 1. Kill all npm processes
pkill -f "npm run dev"
pkill -f "next dev"
pkill -f "npx expo"

# 2. Close terminal tabs in your IDE that are running npm
# 3. Only use Docker containers for all services
```

### **Issue 2: Multiple IDEs running simultaneously**

**Symptoms:**
- Extremely high CPU usage (200%+)
- Multiple GB of RAM usage
- System slowdown

**Cause:**
Running Cursor, VSCode, and Windsurf simultaneously.

**Solution:**
```bash
# Close unnecessary IDEs
killall "Visual Studio Code"
killall "Windsurf"
# Keep only Cursor running
```

### **Issue 3: Shared library dependencies breaking microservice independence**

**Symptoms:**
- Module not found errors: `@msdp/ui-components`
- Build failures in Docker containers
- Cross-repository dependencies

**Cause:**
Applications trying to import shared libraries that don't exist or aren't properly configured.

**Solution:**
- Remove all `@msdp/ui-components` imports
- Replace with self-contained components
- Use direct API calls instead of shared service registries

### **Issue 4: Port conflicts**

**Symptoms:**
- Containers failing to start
- "Port already in use" errors
- Applications not responding

**Cause:**
npm dev servers and Docker containers competing for the same ports.

**Solution:**
```bash
# Check what's using ports
lsof -ti:3000,3001,3002,3003,4000,4001,4002,4003

# Kill processes on specific ports
lsof -ti:4002 | xargs kill -9
```

## 🔧 **Proper Startup Procedure**

### **1. Clean Environment**
```bash
# Stop all npm processes
pkill -f "npm"
pkill -f "next"
pkill -f "expo"

# Stop all Docker containers
docker stop $(docker ps -q)
```

### **2. Start Platform**
```bash
# Use the master startup script
cd /Users/santanu/github/msdp-platform-core
./scripts/start-all-services.sh
```

### **3. Verify Health**
```bash
# Check all containers are running
docker ps

# Test key endpoints
curl http://localhost:3000/health  # API Gateway
curl http://localhost:4002/        # Customer App
curl http://localhost:4003/health  # Merchant Frontend
```

## 📊 **Resource Monitoring**

### **Check System Load**
```bash
# Current CPU/Memory usage
top -l 1 -o cpu | head -20

# Docker container resources
docker stats --no-stream
```

### **Identify Resource Hogs**
```bash
# Find heavy processes
ps aux | sort -nr -k 3 | head -10  # CPU usage
ps aux | sort -nr -k 4 | head -10  # Memory usage
```

## ⚠️ **Critical Rules to Follow**

1. **NEVER run npm dev outside Docker**
2. **Always use Docker containers for all services**
3. **Close unused IDE instances**
4. **Monitor resource usage regularly**
5. **Use the master startup script**

## 🎯 **Performance Optimization Tips**

1. **Docker Resource Limits**
   ```yaml
   # Add to docker-compose files
   deploy:
     resources:
       limits:
         memory: 512M
         cpus: '0.5'
   ```

2. **IDE Extension Management**
   - Disable unnecessary extensions
   - Close unused workspaces
   - Use single IDE instance

3. **System Monitoring**
   ```bash
   # Monitor system health
   watch -n 5 'docker stats --no-stream'
   ```

## 🔍 **Current Issue Analysis**

Based on your terminal output, you have:
- ❌ npm process on port 4001 (should be Docker only)
- ❌ npm process on port 4002 (should be Docker only)  
- ❌ expo processes trying to start
- ❌ Shared library import errors

**Immediate Action Required:**
1. Close all terminal tabs running npm in Cursor
2. Use only the Docker startup script
3. Monitor resource usage

This will immediately improve your laptop performance!
