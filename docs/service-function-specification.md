# MSDP Service Function Specification

## 🎯 **Function Definition Framework**

### **📊 Service Function Matrix**

| Service | Core Responsibility | Data Ownership | External Dependencies |
|---------|-------------------|----------------|---------------------|
| **API Gateway** | Routing & Auth | Sessions, Routes | All Services |
| **Location Service** | Geography & Geospatial | Countries, Cities, GPS | None |
| **Merchant Service** | Merchant Business | Merchants, Menus | Location Service |
| **Admin Service** | Platform Management | Admin Users, Settings | All Services |
| **Admin Dashboard** | UI/UX Only | UI State Only | Admin Service |

## 🔧 **Detailed Function Specifications**

### **1. 📡 API Gateway Functions**
```typescript
interface APIGatewayService {
  // ✅ CORE FUNCTIONS
  authentication: {
    login(email: string, password: string): AuthResult;
    validateToken(token: string): ValidationResult;
    refreshToken(token: string): RefreshResult;
    logout(token: string): LogoutResult;
  };
  
  routing: {
    routeToLocationService(path: string, request: Request): ProxiedResponse;
    routeToMerchantService(path: string, request: Request): ProxiedResponse;
    routeToAdminService(path: string, request: Request): ProxiedResponse;
  };
  
  security: {
    applyRateLimit(clientId: string): RateLimitResult;
    applyCORS(origin: string): CORSResult;
    validateRequest(request: Request): ValidationResult;
  };
  
  // ✅ DATA OWNERSHIP
  data: {
    userSessions: Map<string, Session>;
    rateLimitCounters: Map<string, number>;
    serviceRoutes: RouteConfiguration[];
  };
}
```

### **2. 🌍 Location Service Functions**
```typescript
interface LocationService {
  // ✅ CORE FUNCTIONS
  geography: {
    // Country Management
    createCountry(country: CountryRequest): Country;
    getCountries(): Country[];
    updateCountry(id: string, updates: CountryUpdate): Country;
    
    // Region Management  
    createRegion(region: RegionRequest): Region;
    getRegions(countryId: string): Region[];
    
    // City Management
    createCity(city: CityRequest): City;
    getCities(regionId: string): City[];
  };
  
  serviceEnablement: {
    enableService(locationId: string, serviceType: ServiceType): EnablementResult;
    disableService(locationId: string, serviceType: ServiceType): DisablementResult;
    getEnabledServices(locationId: string): ServiceCategory[];
  };
  
  geospatial: {
    findNearby(coordinates: Coordinates, radius: number): Location[];
    calculateDistance(origin: Coordinates, destination: Coordinates): Distance;
    optimizeRoute(waypoints: Coordinates[]): Route;
  };
  
  realTimeTracking: {
    startTracking(orderId: string): TrackingSession;
    updateLocation(sessionId: string, coordinates: Coordinates): void;
    stopTracking(sessionId: string): TrackingResult;
  };
  
  // ✅ DATA OWNERSHIP
  data: {
    countries: Country[];
    regions: Region[];
    cities: City[];
    serviceCategories: ServiceCategory[];
    locationServiceEnablement: LocationService[];
    trackingSessions: TrackingSession[];
    geospatialData: GeospatialRecord[];
  };
}
```

### **3. 🏪 Merchant Service Functions**
```typescript
interface MerchantService {
  // ✅ CORE FUNCTIONS
  merchantManagement: {
    registerMerchant(merchant: MerchantRegistration): Merchant;
    getMerchant(merchantId: string): Merchant;
    updateMerchant(merchantId: string, updates: MerchantUpdate): Merchant;
    deleteMerchant(merchantId: string): DeletionResult;
    
    // Status Management
    activateMerchant(merchantId: string): StatusResult;
    suspendMerchant(merchantId: string, reason: string): StatusResult;
  };
  
  menuManagement: {
    createMenuItem(merchantId: string, item: MenuItemRequest): MenuItem;
    getMenu(merchantId: string): MenuItem[];
    updateMenuItem(itemId: string, updates: MenuItemUpdate): MenuItem;
    deleteMenuItem(itemId: string): DeletionResult;
  };
  
  orderProcessing: {
    createOrder(order: OrderRequest): Order;
    updateOrderStatus(orderId: string, status: OrderStatus): Order;
    getOrders(merchantId: string): Order[];
  };
  
  analytics: {
    getMerchantMetrics(merchantId: string): MerchantMetrics;
    getRevenueAnalytics(merchantId: string, period: TimePeriod): RevenueData;
  };
  
  // ✅ DATA OWNERSHIP
  data: {
    merchants: Merchant[];
    menuItems: MenuItem[];
    orders: Order[];
    merchantMetrics: MerchantMetrics[];
    merchantSettings: MerchantSetting[];
  };
}
```

### **4. 🎛️ Admin Service Functions** (NEW - Port 3005)
```typescript
interface AdminService {
  // ✅ CORE FUNCTIONS
  adminUserManagement: {
    createAdminUser(admin: AdminUserRequest): AdminUser;
    getAdminUsers(): AdminUser[];
    updateAdminRole(adminId: string, role: AdminRole): AdminUser;
    deleteAdminUser(adminId: string): DeletionResult;
  };
  
  platformManagement: {
    // Merchant Oversight (calls Merchant Service)
    approveMerchant(merchantId: string): ApprovalResult;
    rejectMerchant(merchantId: string, reason: string): RejectionResult;
    getMerchantsForApproval(): PendingMerchant[];
    
    // Location Oversight (calls Location Service)
    enableLocationService(locationId: string, serviceType: string): EnablementResult;
    getLocationEnablementRequests(): PendingEnablement[];
    
    // Platform Configuration
    updatePlatformSetting(key: string, value: any): PlatformSetting;
    getPlatformSettings(): PlatformSetting[];
  };
  
  orchestration: {
    // Cross-Service Data Aggregation
    getDashboardMetrics(): DashboardMetrics;
    getPlatformHealth(): PlatformHealth;
    generatePlatformReport(): PlatformReport;
  };
  
  auditManagement: {
    logAdminAction(action: AdminAction): AuditLog;
    getAuditLogs(filters: AuditFilters): AuditLog[];
    generateComplianceReport(): ComplianceReport;
  };
  
  // ✅ DATA OWNERSHIP
  data: {
    adminUsers: AdminUser[];
    platformSettings: PlatformSetting[];
    auditLogs: AuditLog[];
    approvalWorkflows: ApprovalWorkflow[];
  };
}
```

### **5. 🎨 Admin Dashboard Functions** (Port 4000 - Frontend Only)
```typescript
interface AdminDashboard {
  // ✅ CORE FUNCTIONS (UI ONLY)
  uiComponents: {
    renderDashboard(metrics: DashboardMetrics): React.Component;
    renderMerchantList(merchants: Merchant[]): React.Component;
    renderLocationMap(locations: Location[]): React.Component;
    renderAnalyticsCharts(data: AnalyticsData): React.Component;
  };
  
  userInteractions: {
    handleMerchantApproval(merchantId: string): void;
    handleLocationEnablement(locationId: string): void;
    handleSettingsUpdate(settings: PlatformSettings): void;
  };
  
  dataFetching: {
    // ✅ ONLY calls Admin Service API (no direct service calls)
    fetchDashboardData(): Promise<DashboardData>;
    fetchMerchants(): Promise<Merchant[]>;
    fetchLocations(): Promise<Location[]>;
  };
  
  // ✅ DATA OWNERSHIP
  data: {
    uiState: UIState;
    userPreferences: UserPreferences;
    dashboardConfigurations: DashboardConfig[];
    // NO business data stored locally
  };
}
```

## 🔄 **Service Communication Patterns**

### **✅ Correct Communication Flow**
```typescript
// Example: Admin approves a merchant
1. Admin Dashboard → Admin Service: POST /api/admin/merchants/approve/{id}
2. Admin Service → Merchant Service: PUT /api/merchants/{id}/status
3. Admin Service → Audit Log: Log approval action
4. Admin Service → Admin Dashboard: Return approval result

// Example: Get dashboard metrics
1. Admin Dashboard → Admin Service: GET /api/admin/dashboard-data
2. Admin Service → Location Service: GET /api/locations/summary
3. Admin Service → Merchant Service: GET /api/merchants/summary  
4. Admin Service → Order Service: GET /api/orders/summary
5. Admin Service: Aggregate and calculate metrics
6. Admin Service → Admin Dashboard: Return aggregated data
```

### **❌ Current Wrong Patterns**
```typescript
// ❌ WRONG: Admin Dashboard directly queries other services
Admin Dashboard → Location Service (Direct DB access)
Admin Dashboard → Merchant Service (Direct DB access)

// ✅ CORRECT: Admin Dashboard only talks to Admin Service
Admin Dashboard → Admin Service → Other Services (API calls)
```

## 🎯 **Implementation Priority**

### **Phase 1: Create Admin Backend Service**
```bash
1. Create services/admin-service/ (Port 3005)
2. Implement admin user management
3. Implement platform settings
4. Implement audit logging
```

### **Phase 2: Add Service Orchestration**
```bash
1. Add API clients for other services
2. Implement dashboard data aggregation
3. Implement approval workflows
4. Add cross-service health monitoring
```

### **Phase 3: Refactor Admin Frontend**
```bash
1. Remove direct database access
2. Remove business logic
3. Add Admin Service API client
4. Keep only UI/UX components
```

**This approach ensures each service has clear, well-defined functions and respects microservice boundaries!** 

Ready to implement the Admin Service backend following these function definitions? 🚀
