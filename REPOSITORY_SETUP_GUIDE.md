# 🏢 MSDP Platform Repository Setup Guide

## 🎯 **Repository Configuration Requirements**

### **Organization Setup:**
- **Owner**: Your GitHub Organization
- **Visibility**: Private (for production platform)
- **Default Branch**: `dev` (for development workflow)
- **Branch Protection**: Enable for `main` branch

---

## 📋 **Repositories to Configure**

### **Core Repositories (Must be Private):**
1. **msdp-platform-core** - Backend microservices
2. **msdp-customer-frontends** - Customer web & mobile apps
3. **msdp-admin-frontends** - Admin dashboard
4. **msdp-merchant-frontends** - Merchant portal
5. **msdp-location-service** - Location services
6. **msdp-shared-libs** - Shared UI components & API clients
7. **msdp-testing** - E2E tests & load testing
8. **msdp-devops-infrastructure** - Deployment & infrastructure
9. **msdp-documentation** - Platform documentation

---

## 🔧 **GitHub Repository Setup Steps**

### **For Each Repository:**

#### **1. Create Private Repository in Your Organization**
```bash
# Via GitHub CLI (if installed)
gh repo create your-org/msdp-platform-core --private --clone=false

# Or via GitHub Web Interface:
# 1. Go to your organization on GitHub
# 2. Click "New repository"
# 3. Name: msdp-platform-core
# 4. Visibility: Private
# 5. Initialize: Don't initialize (we have existing code)
```

#### **2. Set Default Branch to 'dev'**
```bash
# Via GitHub Web Interface:
# 1. Go to repository Settings
# 2. Click "Branches" in left sidebar
# 3. Change default branch from 'main' to 'dev'
# 4. Confirm the change
```

#### **3. Add Remote and Push**
```bash
# Add your organization remote
git remote add origin https://github.com/your-org/msdp-platform-core.git

# Push all branches
git push -u origin dev
git push origin main  # if main branch exists
```

---

## 🚀 **Quick Setup Commands**

### **Repository 1: Platform Core**
```bash
cd /Users/santanu/github/msdp-platform-core

# Remove existing remote (if any)
git remote remove origin 2>/dev/null || true

# Add your organization remote
git remote add origin https://github.com/your-org/msdp-platform-core.git

# Push dev branch (set as upstream)
git push -u origin dev

# Push main if it exists
git checkout main 2>/dev/null && git push origin main && git checkout dev || true
```

### **Repository 2: Customer Frontends**
```bash
cd /Users/santanu/github/msdp-customer-frontends

# Remove existing remote (if any)
git remote remove origin 2>/dev/null || true

# Add your organization remote
git remote add origin https://github.com/your-org/msdp-customer-frontends.git

# Push dev branch (set as upstream)
git push -u origin dev

# Push main if it exists
git checkout main 2>/dev/null && git push origin main && git checkout dev || true
```

### **Repository 3: Admin Frontends**
```bash
cd /Users/santanu/github/msdp-admin-frontends

# Remove existing remote (if any)
git remote remove origin 2>/dev/null || true

# Add your organization remote
git remote add origin https://github.com/your-org/msdp-admin-frontends.git

# Push dev branch (set as upstream)
git push -u origin dev

# Push main if it exists
git checkout main 2>/dev/null && git push origin main && git checkout dev || true
```

### **Repository 4: Merchant Frontends**
```bash
cd /Users/santanu/github/msdp-merchant-frontends

# Remove existing remote (if any)
git remote remove origin 2>/dev/null || true

# Add your organization remote
git remote add origin https://github.com/your-org/msdp-merchant-frontends.git

# Push dev branch (set as upstream)
git push -u origin dev

# Push main if it exists
git checkout main 2>/dev/null && git push origin main && git checkout dev || true
```

### **Repository 5: Location Service**
```bash
cd /Users/santanu/github/msdp-location-service

# Remove existing remote (if any)
git remote remove origin 2>/dev/null || true

# Add your organization remote
git remote add origin https://github.com/your-org/msdp-location-service.git

# Push dev branch (set as upstream)
git push -u origin dev

# Push main if it exists
git checkout main 2>/dev/null && git push origin main && git checkout dev || true
```

### **Repository 6: Shared Libraries**
```bash
cd /Users/santanu/github/msdp-shared-libs

# Add your organization remote
git remote add origin https://github.com/your-org/msdp-shared-libs.git

# Create dev branch from main
git checkout -b dev

# Push both branches
git push -u origin main
git push -u origin dev
```

### **Repository 7: Testing**
```bash
cd /Users/santanu/github/msdp-testing

# Add your organization remote
git remote add origin https://github.com/your-org/msdp-testing.git

# Create dev branch from main
git checkout -b dev

# Push both branches
git push -u origin main
git push -u origin dev
```

### **Repository 8: DevOps Infrastructure**
```bash
cd /Users/santanu/github/msdp-devops-infrastructure

# Remove existing remote (if any)
git remote remove origin 2>/dev/null || true

# Add your organization remote
git remote add origin https://github.com/your-org/msdp-devops-infrastructure.git

# Push dev branch (set as upstream)
git push -u origin dev

# Push main if it exists
git checkout main 2>/dev/null && git push origin main && git checkout dev || true
```

### **Repository 9: Documentation**
```bash
cd /Users/santanu/github/msdp-documentation

# Remove existing remote (if any)
git remote remove origin 2>/dev/null || true

# Add your organization remote
git remote add origin https://github.com/your-org/msdp-documentation.git

# Push dev branch (set as upstream)
git push -u origin dev

# Push main if it exists
git checkout main 2>/dev/null && git push origin main && git checkout dev || true
```

---

## 🔒 **Security & Access Control**

### **Repository Settings (For Each Repo):**
1. **Visibility**: Private
2. **Default Branch**: `dev`
3. **Branch Protection**: Enable for `main` branch
4. **Team Access**: Configure appropriate permissions
5. **Security**: Enable vulnerability alerts

### **Branch Protection Rules for 'main':**
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators
- ✅ Restrict pushes to main branch

---

## 📊 **Verification Steps**

### **After Setup, Verify:**
```bash
# Check all remotes are set correctly
cd /Users/santanu/github/msdp-platform-core && git remote -v
cd /Users/santanu/github/msdp-customer-frontends && git remote -v
cd /Users/santanu/github/msdp-admin-frontends && git remote -v

# Check default branches are 'dev'
# (Check via GitHub web interface)

# Verify all repositories are private
# (Check via GitHub web interface)
```

---

## 🎯 **Next Steps After Setup**

1. **Configure Team Access** - Add team members with appropriate permissions
2. **Set Up CI/CD** - GitHub Actions for automated testing and deployment
3. **Enable Security Features** - Dependabot, security alerts, code scanning
4. **Create Release Workflow** - Proper dev → staging → main workflow
5. **Documentation Access** - Ensure team can access all documentation

---

**Replace `your-org` with your actual GitHub organization name in all commands above.**

*This setup ensures your MSDP platform is properly organized, secure, and ready for team collaboration.*
