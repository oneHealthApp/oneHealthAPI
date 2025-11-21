# Authentication Examples - OneHealth API

This document provides complete examples for authentication workflow with the OneHealth API.

## Super Admin Creation & Login

### 1. Create Super Admin User

#### Option A: Using Script (Recommended for Development)
```bash
npm run create-super-admin
```

#### Option B: Using API Endpoint (Development Only)
```bash
POST /setup/super-admin
Content-Type: application/json

# No body required - uses defaults
```

**Response:**
```json
{
  "success": true,
  "message": "Super Admin created successfully",
  "data": {
    "userId": "cjxq4t6e90001s8l8z7jyq0vn",
    "username": "admin",
    "email": "admin@onehealth.com",
    "roleAssigned": true,
    "loginCredentials": {
      "username": "admin",
      "password": "Admin@1234",
      "note": "Please change password after first login"
    }
  }
}
```

### 2. Login with Super Admin

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "cjxq4t6e90001s8l8z7jyq0vn",
      "username": "admin",
      "emailId": "admin@onehealth.com",
      "firstName": "Super",
      "lastName": "Admin",
      "isActive": true,
      "userType": "SUPER_ADMIN",
      "roles": ["SUPER_ADMIN"],
      "clinics": []
    }
  }
}
```

## User Types & Access Levels

### 1. Super Admin
- **Role:** SUPER_ADMIN
- **Access:** Full system access, can manage all tenants, clinics, and users
- **Context:** Global system administration

### 2. Tenant Admin  
- **Role:** TENANT_ADMIN
- **Access:** Can manage their tenant and associated clinics
- **Context:** Tenant-specific administration

### 3. Clinic User
- **Role:** CLINIC_USER  
- **Access:** Limited to specific clinic operations
- **Context:** Clinic-specific operations

## Authentication Headers

For all authenticated requests, include the JWT token:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Example API Calls with Authentication

### 1. Get User Profile
```bash
GET /api/v1/users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Create Clinic (as Super Admin)
```bash
POST /api/v1/clinics
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Downtown Medical Center",
  "phone": "+1234567890",
  "email": "info@downtown-medical.com",
  "address": {
    "street": "123 Main Street",
    "city": "Downtown",
    "state": "CA",
    "pincode": "90210",
    "district": "Los Angeles",
    "country": "USA"
  }
}
```

### 3. Create Patient (as Clinic User)
```bash
POST /api/v1/patients
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "clinicId": "clinic_uuid_here",
  "type": "HUMAN",
  "person": {
    "firstName": "John",
    "lastName": "Doe",
    "gender": "MALE",
    "dateOfBirth": "1985-01-15T00:00:00.000Z",
    "phone": "+1234567890",
    "email": "john.doe@example.com"
  },
  "address": {
    "street": "456 Oak Avenue",
    "city": "Riverside",
    "state": "CA",
    "pincode": "92501",
    "district": "Riverside",
    "country": "USA"
  }
}
```

## Error Responses

### 1. Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid username or password",
  "error": "AUTHENTICATION_FAILED"
}
```

### 2. Token Expired
```json
{
  "success": false,
  "message": "Token has expired",
  "error": "TOKEN_EXPIRED"
}
```

### 3. Insufficient Permissions
```json
{
  "success": false,
  "message": "Insufficient permissions to access this resource",
  "error": "AUTHORIZATION_FAILED"
}
```

## Testing Authentication Flow

### 1. Complete Test Sequence
```bash
# Step 1: Create Super Admin
npm run create-super-admin

# Step 2: Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@1234"}'

# Step 3: Use token in subsequent requests
curl -X GET http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Postman Collection Variables
```json
{
  "baseUrl": "http://localhost:3000",
  "token": "{{loginResponse.data.token}}"
}
```

## Security Notes

⚠️ **Important Security Considerations:**

1. **Default Credentials:** Change the default password immediately after first login
2. **Production Setup:** Disable setup endpoints in production (`NODE_ENV=production`)
3. **Token Expiry:** Tokens have a configurable expiry time
4. **Rate Limiting:** Authentication endpoints are rate-limited
5. **HTTPS Only:** Use HTTPS in production environments

## Troubleshooting

### Common Issues:

1. **"User already exists"** - Super admin was already created, try logging in
2. **"Invalid token"** - Token may be expired or malformed
3. **"Setup not allowed"** - Running in production mode
4. **Database connection error** - Check database connectivity

### Debug Commands:
```bash
# Check if super admin exists
# Run this in your database console:
SELECT * FROM "User" WHERE username = 'admin';

# Check roles
SELECT * FROM "Role" WHERE name = 'SUPER_ADMIN';
```