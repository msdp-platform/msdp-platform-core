# 📚 MSDP Platform API Reference

## 🔐 **Authentication**

All API requests (except registration and login) require JWT authentication via:
- **Header**: `Authorization: Bearer {jwt_token}`
- **Cookie**: `msdp_session={jwt_token}` (for frontend)

**JWT Secret**: `dev-user-jwt-secret` (development)

---

## 👤 **User Service (Port 3003)**

### **Authentication Endpoints**

#### **POST /api/auth/register**
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123",
  "country": "usa"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "countryCode": "US"
    },
    "token": "jwt_token_here"
  }
}
```

#### **POST /api/auth/login**
Authenticate existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com", 
      "name": "John Doe",
      "countryCode": "US"
    },
    "token": "jwt_token_here"
  }
}
```

### **Profile Endpoints**

#### **GET /api/users/profile**
Get current user profile.

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "john@example.com",
      "name": "John Doe",
      "countryCode": "US",
      "createdAt": "2025-09-16T10:00:00Z"
    }
  }
}
```

---

## 📦 **Order Service (Port 3006)**

### **Order Management**

#### **POST /api/orders/create**
Create a new order with payment processing.

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "cartData": {
    "merchantId": "550e8400-e29b-41d4-a716-446655440000",
    "items": [
      {
        "productId": "550e8400-e29b-41d4-a716-446655440001",
        "name": "California Roll",
        "quantity": 2,
        "price": 12.99
      }
    ],
    "subtotal": 25.98,
    "taxAmount": 2.08,
    "deliveryFee": 2.99,
    "discountAmount": 0,
    "deliveryAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY", 
      "zip": "10001",
      "country": "USA"
    },
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "merchantName": "Urban Bites",
    "countryCode": "USA",
    "currencyCode": "USD"
  },
  "paymentMethod": {
    "type": "credit_card",
    "provider": "loopback"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "order": {
    "id": "order_uuid",
    "order_number": "ORD12345678ABCD",
    "status": "confirmed",
    "total_amount": "31.05",
    "currency_code": "USD",
    "created_at": "2025-09-16T10:00:00Z"
  },
  "payment": {
    "transactionId": "payment_uuid",
    "amount": "31.05",
    "currency": "USD", 
    "status": "completed"
  },
  "message": "Order created and payment processed successfully"
}
```

#### **GET /api/orders/user/:userId**
Get orders for a specific user.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by order status

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "order_uuid",
      "order_number": "ORD12345678ABCD",
      "status": "confirmed",
      "total_amount": "31.05",
      "merchant_name": "Urban Bites",
      "created_at": "2025-09-16T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1
  }
}
```

#### **GET /api/orders/:orderId**
Get specific order details.

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_uuid",
    "order_number": "ORD12345678ABCD", 
    "status": "confirmed",
    "payment_status": "paid",
    "total_amount": "31.05",
    "delivery_address": { "street": "123 Main St", "city": "New York" },
    "items": [
      {
        "menu_item_id": "item_uuid",
        "item_name": "California Roll",
        "quantity": 2,
        "unit_price": "12.99",
        "total_price": "25.98"
      }
    ],
    "tracking": []
  }
}
```

---

## 💳 **Payment Service (Port 3007)**

### **Payment Processing**

#### **POST /api/payments/process-internal** 
Process payment (service-to-service, no auth required).

**Request Body:**
```json
{
  "orderId": "order_uuid",
  "paymentMethod": {
    "type": "credit_card",
    "provider": "loopback"
  },
  "orderData": {
    "orderId": "order_uuid",
    "userId": "user_uuid",
    "subtotal": 25.98,
    "taxAmount": 2.08,
    "deliveryFee": 2.99,
    "totalAmount": 31.05,
    "currency": "USD",
    "countryCode": "USA"
  }
}
```

**Response (Success):**
```json
{
  "success": true,
  "payment": {
    "transactionId": "payment_uuid",
    "amount": "31.05",
    "currency": "USD",
    "status": "completed",
    "gateway_provider": "loopback",
    "processed_at": "2025-09-16T10:00:00Z"
  },
  "message": "Payment processed successfully"
}
```

---

## 🛒 **Customer Frontend APIs (Port 4002)**

### **Authentication (Proxied to User Service)**

#### **POST /api/register**
Register through frontend (sets secure cookies).

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123", 
  "country": "usa"
}
```

**Response:**
```json
{
  "ok": true,
  "user": {
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

#### **POST /api/login**
Login through frontend (sets secure cookies).

#### **GET /api/session**
Validate current session.

**Response:**
```json
{
  "ok": true,
  "user": {
    "id": "user_uuid",
    "email": "john@example.com",
    "type": "customer"
  }
}
```

### **Orders (Proxied to Order Service)**

#### **POST /api/orders/create**
Create order through frontend (uses session cookies).

#### **GET /api/orders**
Get user orders through frontend (uses session cookies).

---

## 🔧 **Error Responses**

### **Authentication Errors**
```json
{
  "error": "Invalid Token",
  "message": "Token is invalid or expired",
  "service": "order-service"
}
```

### **Validation Errors**
```json
{
  "error": "Missing required fields",
  "required": ["email", "password"],
  "received": {"email": true, "password": false}
}
```

### **Service Errors**
```json
{
  "success": false,
  "error": {
    "code": "order_creation_failed",
    "message": "Payment processing failed",
    "details": {...}
  }
}
```

---

## 🌍 **Multi-Country Support**

### **Supported Countries**
- **USA** 🇺🇸 - Currency: USD, Timezone: America/New_York
- **UK** 🇬🇧 - Currency: GBP, Timezone: Europe/London  
- **India** 🇮🇳 - Currency: INR, Timezone: Asia/Kolkata
- **Singapore** 🇸🇬 - Currency: SGD, Timezone: Asia/Singapore

### **Country-Specific Endpoints**
```bash
# Country-specific customer apps (future)
USA: http://localhost:5001
India: http://localhost:5002  
UK: http://localhost:5003
Singapore: http://localhost:5004
```

---

## 🔒 **Security**

### **JWT Token Structure**
```json
{
  "userId": "user_uuid",
  "email": "user@example.com",
  "type": "customer",
  "iat": 1726491615,
  "exp": 1727096415
}
```

### **Security Features**
- ✅ **JWT Authentication** across all services
- ✅ **HttpOnly Cookies** for frontend security
- ✅ **CORS Configuration** for cross-origin requests
- ✅ **Input Validation** on all endpoints
- ✅ **Error Handling** without information leakage
- ✅ **Service Isolation** through Docker networking

---

## 📊 **Monitoring & Health**

### **Health Check Endpoints**
```bash
GET /health  # All services
```

**Response Format:**
```json
{
  "status": "healthy",
  "service": "msdp-order-service",
  "version": "1.0.0",
  "timestamp": "2025-09-16T10:00:00Z",
  "environment": "development",
  "functions": {
    "orderProcessing": true,
    "paymentIntegration": true
  }
}
```

### **Container Status**
```bash
# Check all containers
docker ps

# Service-specific status
cd services/{service-name}
docker-compose -f docker-compose.dev.yml ps
```

---

*This API reference covers all operational endpoints in the MSDP platform.*  
*For implementation details, see service-specific documentation.*
