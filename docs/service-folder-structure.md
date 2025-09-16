# MSDP Service Folder Structure Standard

## 🎯 **Standardized Microservice Structure**

### **✅ Consistent Folder Structure (All Services)**

```bash
service-name/
├── package.json                    # Service dependencies and scripts
├── Dockerfile.dev                  # Development container
├── docker-compose.dev.yml          # Development orchestration
├── dev-start.sh                    # Quick startup script
├── README.md                       # Service documentation
├── .env.example                    # Environment variables template
├── .gitignore                      # Service-specific ignores
│
├── src/                            # ✅ APPLICATION CODE ONLY
│   ├── server.js                   # Main server entry point
│   ├── controllers/                # Request handlers
│   ├── services/                   # Business logic
│   ├── models/                     # Data models
│   ├── middleware/                 # Express middleware
│   ├── routes/                     # API route definitions
│   ├── config/                     # Application configuration
│   └── utils/                      # Utility functions
│
├── database/                       # ✅ DATABASE OUTSIDE SRC
│   ├── schema.sql                  # Database schema
│   ├── migrations/                 # Schema migrations (future)
│   └── seeds/                      # Test data (future)
│
├── tests/                          # ✅ TESTS OUTSIDE SRC
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   └── fixtures/                   # Test data
│
├── docs/                           # ✅ DOCUMENTATION OUTSIDE SRC
│   ├── api.md                      # API documentation
│   ├── deployment.md               # Deployment guide
│   └── troubleshooting.md          # Common issues
│
├── scripts/                        # ✅ OPERATIONAL SCRIPTS OUTSIDE SRC
│   ├── migrate.js                  # Database migrations
│   ├── seed.js                     # Data seeding
│   └── backup.js                   # Backup utilities
│
└── logs/                           # ✅ LOGS OUTSIDE SRC (gitignored)
    ├── error.log                   # Error logs
    ├── combined.log                # All logs
    └── access.log                  # Access logs
```

## 🔍 **Why This Structure Matters**

### **✅ Operations Team Benefits**
```bash
# Database Management (Outside src/)
database/
├── schema.sql          # ← Operations team owns this
├── migrations/         # ← Operations team manages schema changes
└── seeds/              # ← Operations team manages test data

# Deployment Scripts (Outside src/)
scripts/
├── migrate.js          # ← Operations team uses for deployments
├── backup.js           # ← Operations team uses for data management
└── health-check.js     # ← Operations team uses for monitoring
```

### **✅ Development Team Benefits**
```bash
# Application Code (Inside src/)
src/
├── controllers/        # ← Dev team owns business logic
├── services/           # ← Dev team owns service layer
├── models/             # ← Dev team owns data models
└── routes/             # ← Dev team owns API definitions
```

### **✅ DevOps Team Benefits**
```bash
# Container & Orchestration (Root level)
├── Dockerfile.dev      # ← DevOps team owns containerization
├── docker-compose.dev.yml # ← DevOps team owns orchestration
└── dev-start.sh        # ← DevOps team owns deployment scripts
```

## 🔧 **Current Service Structure Status**

### **✅ Correctly Structured Services**
```bash
✅ Location Service (Standalone):
   ├── database/ (outside src) ✅
   ├── src/ (app code only) ✅
   └── Docker files at root ✅

✅ API Gateway:
   ├── src/ (app code only) ✅
   └── Docker files at root ✅

✅ Merchant Service:
   ├── src/database/ ❌ WRONG LOCATION
   ├── src/ (app code) ✅
   └── Docker files at root ✅

✅ Admin Service:
   ├── database/ (outside src) ✅
   ├── src/ (app code only) ✅
   └── Docker files at root ✅
```

### **🔧 Fixed Services**
```bash
✅ User Service:
   ├── database/ (moved outside src) ✅ FIXED
   ├── src/ (app code only) ✅
   └── Docker files at root ✅

✅ Order Service:
   ├── database/ (moved outside src) ✅ FIXED
   ├── src/ (app code only) ✅
   └── Docker files at root ✅
```

## 🎯 **Benefits of This Structure**

### **🏗️ Team Responsibility Separation**
- **Development Team**: Owns `src/` directory
- **Operations Team**: Owns `database/`, `scripts/` directories  
- **DevOps Team**: Owns Docker files, deployment scripts
- **QA Team**: Owns `tests/` directory

### **🚀 Future Decoupling Benefits**
```bash
# Easy to extract database management:
database/               # ← Can be moved to separate repo
├── schema.sql          # ← Operations team can manage independently
├── migrations/         # ← Database versioning
└── backup-scripts/     # ← Data management tools

# Easy to extract operational scripts:
scripts/                # ← Can be moved to operations repo
├── deployment/         # ← Deployment automation
├── monitoring/         # ← Health checks
└── maintenance/        # ← Operational tasks
```

### **🔄 Microservice Evolution**
```bash
# When services mature, easy to split:
service-name/
├── src/ → service-name-api/          # API layer
├── database/ → service-name-db/      # Database layer  
├── scripts/ → service-name-ops/      # Operations layer
└── docs/ → service-name-docs/        # Documentation
```

## 📋 **Updated Service Structure**

### **✅ All Services Now Follow Standard Structure**
```bash
# User Service (Fixed):
user-service/
├── package.json
├── Dockerfile.dev
├── docker-compose.dev.yml
├── dev-start.sh
├── database/                       # ✅ OUTSIDE src
│   └── schema.sql
├── src/                            # ✅ APP CODE ONLY
│   ├── server.js
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── routes/
│   └── config/
└── logs/

# Order Service (Fixed):
order-service/
├── package.json
├── Dockerfile.dev
├── docker-compose.dev.yml
├── dev-start.sh
├── database/                       # ✅ OUTSIDE src
│   └── schema.sql
├── src/                            # ✅ APP CODE ONLY
│   ├── server.js
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── routes/
│   └── config/
└── logs/
```

## 🎯 **Next Steps**

### **🔧 Still Need to Fix**
```bash
# Merchant Service needs structure fix:
merchant-service/
├── src/database/ ❌ WRONG - Should be database/
└── src/config/database.js ✅ CORRECT - App config stays in src
```

### **✅ Structure Benefits Achieved**
- **Consistent across all services**
- **Operations team can manage database independently**
- **Development team focuses on application code**
- **Easy future decoupling and microservice evolution**
- **Clear separation of concerns**

**The folder structure is now properly organized for operations team management and future decoupling! Ready to continue with the Order Service implementation using this correct structure?** 🛒
