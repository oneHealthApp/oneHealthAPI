# Staff User Creation API

## Overview
This API endpoint creates a staff user with automatic Person record creation when the role is "STAFF". The implementation uses Prisma transactions to ensure data consistency across User, Person, UserRole, and UserClinic tables.

## Endpoint
```
POST /api/v1/users/staff
```

## Authentication
Requires JWT Bearer token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Request Body
```json
{
  "tenantId": "string (required)",
  "clinicId": "string (required)", 
  "name": "string (required, 2-100 chars)",
  "phoneNumber": "string (required, 10-15 digits)",
  "email": "string (required, valid email)",
  "username": "string (required, 3-50 chars, alphanumeric + underscore)",
  "password": "string (required, min 8 chars, must contain uppercase, lowercase, number, special char)",
  "sex": "string (optional, MALE|FEMALE|OTHER)",
  "roleId": "string (required)"
}
```

## Validation Rules

### Required Fields
- `tenantId`: Valid tenant ID that exists in database
- `clinicId`: Valid clinic ID that exists in database
- `name`: 2-100 characters, used for Person.fullName
- `phoneNumber`: 10-15 digits only
- `email`: Valid email format
- `username`: 3-50 characters, alphanumeric and underscores only
- `password`: Minimum 8 characters with uppercase, lowercase, number, and special character
- `roleId`: Valid role ID that exists in database

### Optional Fields
- `sex`: Must be one of MALE, FEMALE, OTHER if provided

### Uniqueness Validation
- `username`: Must be unique across all users
- `email`: Must be unique across all users  
- `phoneNumber`: Must be unique across all users

## Business Logic

### Role-Based Person Creation
- If the role name is "STAFF", a Person record is automatically created
- If the role name is not "STAFF", only User, UserRole, and UserClinic records are created
- Person record links back to User via `personId` field

### Transaction Flow
1. **Validation Phase**
   - Validate all input fields
   - Check uniqueness of username, email, phone
   - Verify tenant, clinic, and role exist
   
2. **Transaction Phase** (All-or-nothing)
   - Create User record with hashed password
   - Create Person record (if role is STAFF)
   - Link Person to User (if created)
   - Create UserRole record
   - Create UserClinic record

### Password Security
- Passwords are hashed using bcrypt with 10 salt rounds
- Original password is never stored in database
- Password validation requires complexity

## Response Format

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "generated-user-id",
      "username": "johndoe_staff",
      "emailId": "john.doe@example.com",
      "mobileNumber": "1234567890", 
      "tenantId": "tenant-123",
      "personId": "generated-person-id",
      "createdAt": "2025-11-21T10:30:00.000Z"
    },
    "person": {  // Only present if role is STAFF
      "id": "generated-person-id",
      "tenantId": "tenant-123",
      "type": "USER",
      "fullName": "John Doe",
      "phone": "1234567890",
      "email": "john.doe@example.com",
      "sex": "MALE",
      "createdAt": "2025-11-21T10:30:00.000Z"
    },
    "userRole": {
      "id": "generated-user-role-id",
      "userId": "generated-user-id",
      "roleId": "role-staff-id",
      "priority": 1
    },
    "userClinic": {
      "id": "generated-user-clinic-id", 
      "userId": "generated-user-id",
      "clinicId": "clinic-123",
      "roleInClinic": "STAFF"
    }
  }
}
```

## Error Responses

### 400 Bad Request - Validation Errors
```json
{
  "success": false,
  "message": "Validation error message",
  "error": "Detailed validation error"
}
```

Common validation errors:
- "Name is required"
- "Email must be valid"
- "Phone number must be 10-15 digits"
- "Password must contain uppercase, lowercase, number and special character"
- "Username can only contain letters, numbers and underscores"

### 409 Conflict - Duplicate Data
```json
{
  "success": false,
  "message": "Username already exists",
  "error": "Detailed error information"
}
```

Common conflict errors:
- "Username already exists"
- "Email already registered" 
- "Phone number already registered"

### 400 Bad Request - Invalid References
```json
{
  "success": false,
  "message": "Invalid tenant ID",
  "error": "Detailed error information"
}
```

Common reference errors:
- "Invalid role ID"
- "Invalid tenant ID"
- "Invalid clinic ID"

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Missing or invalid JWT token"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to create staff user",
  "error": "Detailed error information (development only)"
}
```

## Database Schema

### Tables Involved
1. **User** - Main user authentication record
2. **Person** - Personal information (created only for STAFF role)
3. **UserRole** - Links user to their role
4. **UserClinic** - Links user to their clinic
5. **Role** - Referenced for validation
6. **Tenant** - Referenced for validation
7. **Clinic** - Referenced for validation

### Relationships
```
User (1) --> (0..1) Person  [personId]
User (1) --> (M) UserRole   [userId]
User (1) --> (M) UserClinic [userId]
```

## Testing

### Prerequisites
1. Valid Tenant record in database
2. Valid Clinic record in database  
3. Valid Role record with roleName="STAFF" for Person creation
4. Valid JWT token for authentication

### Test Cases

#### Valid Staff Creation
```bash
curl -X POST \
  http://localhost:3000/api/v1/users/staff \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <jwt-token>' \
  -d '{
    "tenantId": "tenant-123",
    "clinicId": "clinic-456", 
    "name": "John Doe",
    "phoneNumber": "1234567890",
    "email": "john.doe@example.com",
    "username": "johndoe_staff",
    "password": "SecurePass123!",
    "sex": "MALE",
    "roleId": "role-staff-id"
  }'
```

#### Non-Staff Role (No Person Creation)
```bash
curl -X POST \
  http://localhost:3000/api/v1/users/staff \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <jwt-token>' \
  -d '{
    "tenantId": "tenant-123",
    "clinicId": "clinic-456",
    "name": "Jane Admin", 
    "phoneNumber": "0987654321",
    "email": "jane.admin@example.com",
    "username": "janeadmin",
    "password": "AdminPass456!",
    "roleId": "role-admin-id"
  }'
```

## Security Considerations

1. **Password Hashing**: Bcrypt with 10 salt rounds
2. **JWT Authentication**: Required for all requests
3. **Input Validation**: Comprehensive validation using Joi
4. **SQL Injection Prevention**: Prisma ORM with parameterized queries
5. **Transaction Safety**: All database operations in atomic transaction
6. **Error Information**: Sensitive details only shown in development mode

## Logging

The API logs the following events:
- User creation attempts (success/failure)
- Validation errors
- Database transaction results
- Authentication failures
- Performance metrics

Log entries include:
- Request ID for tracing
- User ID of requester
- Input data (with password redacted)
- Error details
- Timing information

## Performance

- **Transaction Overhead**: ~50-100ms for complete user creation
- **Validation Time**: ~10-20ms for all checks
- **Password Hashing**: ~100-200ms (bcrypt security vs performance)
- **Database Queries**: 4-6 queries per creation (within transaction)

## Monitoring

Key metrics to monitor:
- Request success/failure rates
- Response times
- Validation error patterns
- Database transaction rollback frequency
- Authentication failure rates