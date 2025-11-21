# Authentication API Examples

## Enhanced Login System with Auto-Context Detection

The OneHealth authentication system supports multi-tenant, multi-clinic context detection. Based on your user type and associations, the system automatically determines your access levels and available resources.

## User Types & Hierarchy

```
1. SUPER_ADMIN (Global Level)
   - No tenant association
   - Can access all tenants and clinics
   - System-level permissions

2. TENANT_ADMIN (Tenant Level)
   - Associated with specific tenant
   - Can access all clinics within their tenant
   - Tenant-level permissions

3. CLINIC_USER (Clinic Level)
   - Associated with specific clinics
   - Can access only assigned clinics
   - Clinic-level permissions

4. REGULAR_USER (Limited Access)
   - Has tenant association but no clinic access
   - Limited permissions
```

## Login Examples

### 1. Super Admin Login

```json
{
  "username": "superadmin@onehealth.com",
  "password": "securepassword123"
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
      "userId": "user-super-123",
      "username": "superadmin@onehealth.com",
      "userType": "SUPER_ADMIN",
      "tenantId": null,
      "tenantName": null,
      "clinicIds": [],
      "clinics": [],
      "roles": ["SUPER_ADMIN", "SYSTEM_ADMIN"],
      "permissions": [
        {
          "menuName": "User Management",
          "create": true,
          "read": true,
          "update": true,
          "delete": true
        }
        // ... all system permissions
      ]
    }
  }
}
```

### 2. Tenant Admin Login

```json
{
  "username": "admin@healthcare-solutions.com",
  "password": "adminpass123"
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
      "userId": "user-admin-456",
      "username": "admin@healthcare-solutions.com",
      "userType": "TENANT_ADMIN",
      "tenantId": "tenant-123",
      "tenantName": "HealthCare Solutions Ltd",
      "clinicIds": ["clinic-001", "clinic-002", "clinic-003"],
      "clinics": [
        {
          "id": "clinic-001",
          "name": "City General Hospital",
          "clinicType": "HUMAN",
          "roleInClinic": "ADMIN"
        },
        {
          "id": "clinic-002",
          "name": "Happy Paws Veterinary",
          "clinicType": "PET",
          "roleInClinic": "ADMIN"
        }
      ],
      "roles": ["TENANT_ADMIN"],
      "permissions": [
        {
          "menuName": "Clinic Management",
          "create": true,
          "read": true,
          "update": true,
          "delete": true
        }
        // ... tenant-level permissions
      ]
    }
  }
}
```

### 3. Clinic User Login

```json
{
  "username": "doctor@cityhospital.com",
  "password": "doctorpass123"
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
      "userId": "user-doctor-789",
      "username": "doctor@cityhospital.com",
      "userType": "CLINIC_USER",
      "tenantId": "tenant-123",
      "tenantName": "HealthCare Solutions Ltd",
      "clinicIds": ["clinic-001"],
      "clinics": [
        {
          "id": "clinic-001",
          "name": "City General Hospital",
          "clinicType": "HUMAN",
          "roleInClinic": "DOCTOR"
        }
      ],
      "roles": ["DOCTOR", "CLINIC_USER"],
      "permissions": [
        {
          "menuName": "Patient Management",
          "create": true,
          "read": true,
          "update": true,
          "delete": false
        },
        {
          "menuName": "Visit Management",
          "create": true,
          "read": true,
          "update": true,
          "delete": false
        }
      ]
    }
  }
}
```

### 4. Multi-Clinic User Login with Context

```json
{
  "username": "nurse@multisite.com",
  "password": "nursepass123",
  "clinicId": "clinic-002"
}
```
*Optional: Specify specific clinic context for users with access to multiple clinics*

### 5. Login with Tenant Context (for validation)

```json
{
  "username": "staff@clinic.com",
  "password": "staffpass123",
  "tenantId": "tenant-123",
  "clinicId": "clinic-001"
}
```
*Optional: Provide context for additional validation*

## Error Responses

### Invalid Credentials
```json
{
  "success": false,
  "message": "Invalid username or password",
  "error": "INVALID_CREDENTIALS"
}
```

### Account Locked
```json
{
  "success": false,
  "message": "Account is locked. Please contact administrator",
  "error": "ACCOUNT_LOCKED"
}
```

### Insufficient Permissions
```json
{
  "success": false,
  "message": "User has insufficient permissions or invalid configuration",
  "error": "INSUFFICIENT_PERMISSIONS"
}
```

### Invalid Context
```json
{
  "success": false,
  "message": "You do not have access to the specified clinic",
  "error": "INVALID_CONTEXT"
}
```

## JWT Token Usage

After successful login, include the token in all subsequent API requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Payload Structure
```json
{
  "userId": "user-123",
  "username": "user@example.com",
  "userType": "CLINIC_USER",
  "tenantId": "tenant-123",
  "clinicIds": ["clinic-001"],
  "roles": ["DOCTOR"],
  "iat": 1700000000,
  "exp": 1700086400
}
```

## Context-Based API Access

Based on your user type, APIs will automatically filter data:

- **Super Admin**: Access to all tenants and clinics
- **Tenant Admin**: Access to own tenant's clinics and data
- **Clinic User**: Access only to assigned clinic's data
- **Regular User**: Limited access based on specific permissions

## User Registration Flow

### 1. Create User Account
```json
{
  "username": "newuser@clinic.com",
  "password": "securepass123",
  "emailId": "newuser@clinic.com",
  "mobileNumber": "+91-9876543210",
  "tenantId": "tenant-123"
}
```

### 2. Assign Clinic Role
```json
{
  "userId": "user-new-456",
  "clinicId": "clinic-001",
  "roleInClinic": "DOCTOR"
}
```

### 3. Assign System Role
```json
{
  "userId": "user-new-456",
  "roleId": "role-doctor-123"
}
```

## API Endpoints

- **POST** `/api/v1/auth/login` - Enhanced login with context detection
- **POST** `/api/v1/auth/logout` - Logout and invalidate token
- **POST** `/api/v1/auth/refresh` - Refresh JWT token
- **GET** `/api/v1/auth/profile` - Get current user profile and context
- **POST** `/api/v1/auth/change-password` - Change user password

## Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Expiration**: 24 hours (configurable)
3. **Account Locking**: Automatic after failed attempts
4. **Context Validation**: Ensures users can only access authorized resources
5. **Role-Based Permissions**: Granular menu-level permissions
6. **Multi-Factor Authentication**: Ready for SMS/Email OTP integration

The authentication system provides seamless multi-tenant, multi-clinic access with automatic context detection! 🚀