# Doctor API Documentation

## Overview
The Doctor API provides endpoints for creating and managing doctor users within the OneHealth system. When a doctor is created, both a User record and a Person record are created atomically in a single database transaction, ensuring data consistency.

## Features
- ✅ Atomic User + Person creation with database transactions
- ✅ Automatic clinic association
- ✅ Role-based access with PersonType.DOCTOR
- ✅ Comprehensive validation (Joi + business logic)
- ✅ Password security with bcrypt hashing
- ✅ Swagger API documentation
- ✅ Production-ready error handling

## API Endpoints

### Create Doctor
**POST** `/api/v1/clinics/doctors`

Creates a new doctor user with associated person record and clinic assignment.

#### Required Fields
- `firstName` (string, 2-50 chars) - First name
- `lastName` (string, 2-50 chars) - Last name
- `phone` (string, 10-15 digits) - Phone number
- `email` (string, valid email) - Email address
- `username` (string, 3-30 alphanumeric) - Username
- `password` (string, 8+ chars with complexity) - Password
- `clinicId` (string) - Clinic ID
- `tenantId` (string) - Tenant ID
- `sex` (enum: MALE, FEMALE, OTHER) - Sex

#### Optional Fields
- `middleName` (string, 1-50 chars) - Middle name
- `dateOfBirth` (date, ISO format) - Date of birth
- `address` (string, max 500 chars) - Address
- `externalId` (string, max 100 chars) - External ID
- `signatureUrl` (string, valid URL) - Signature URL
- `profileImageUrl` (string, valid URL) - Profile image URL

#### Password Requirements
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character (@$!%*?&)

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Doctor created successfully",
    "userId": "cuid_user_id",
    "personId": "cuid_person_id"
  }
}
```

#### Example Request
```bash
curl -X POST "http://localhost:3000/api/v1/clinics/doctors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "Dr. John",
    "lastName": "Smith",
    "phone": "+1234567890",
    "email": "dr.john.smith@example.com",
    "username": "drjohnsmith",
    "password": "SecurePass123!",
    "clinicId": "clinic_id_here",
    "tenantId": "tenant_id_here",
    "sex": "MALE"
  }'
```

### Get Doctor by ID
**GET** `/api/v1/clinics/doctors/{id}`

Retrieves a specific doctor by their user ID.

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "username": "drjohnsmith",
      "emailId": "dr.john.smith@example.com",
      "mobileNumber": "+1234567890",
      "emailVerified": false,
      "mobileValidationStatus": false,
      "isLocked": false,
      "profilePictureUrl": null,
      "tenantId": "tenant_id",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    },
    "person": {
      "id": "person_id",
      "tenantId": "tenant_id",
      "type": "DOCTOR",
      "fullName": "Dr. John Smith",
      "phone": "+1234567890",
      "email": "dr.john.smith@example.com",
      "dateOfBirth": null,
      "sex": "MALE",
      "metadata": {
        "firstName": "Dr. John",
        "lastName": "Smith"
      },
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    },
    "clinic": {
      "id": "clinic_id",
      "name": "Main Clinic",
      "clinicType": "HUMAN",
      "isActive": true
    }
  }
}
```

### Get Doctors by Clinic
**GET** `/api/v1/clinics/{clinicId}/doctors`

Retrieves all doctors associated with a specific clinic.

#### Query Parameters
- `tenantId` (optional) - Filter by tenant ID
- `isActive` (optional, boolean) - Filter by active status
- `search` (optional, string) - Search in name, email, phone, or username

### Get All Doctors
**GET** `/api/v1/clinics/doctors`

Retrieves all doctors with optional filtering.

#### Query Parameters
- `tenantId` (optional) - Filter by tenant ID
- `clinicId` (optional) - Filter by clinic ID
- `isActive` (optional, boolean) - Filter by active status
- `search` (optional, string) - Search in name, email, phone, or username

## Authentication
All endpoints require JWT authentication via Bearer token:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "error": "First name must be at least 2 characters long"
}
```

### 409 - Conflict
```json
{
  "success": false,
  "error": "Username already exists"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": "Doctor not found"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "error": "Failed to create doctor"
}
```

## Database Schema

### User Table
- `id` - Primary key
- `username` - Unique username
- `passwordHash` - Bcrypt hashed password
- `emailId` - Email address
- `mobileNumber` - Phone number
- `tenantId` - Reference to tenant
- `personId` - Reference to person record
- Other metadata fields

### Person Table
- `id` - Primary key
- `tenantId` - Reference to tenant
- `type` - PersonType enum (set to DOCTOR)
- `fullName` - Full name
- `phone` - Phone number
- `email` - Email address
- `sex` - Gender
- `metadata` - JSON metadata with additional fields

### UserClinic Table
- `userId` - Reference to user
- `clinicId` - Reference to clinic
- `roleInClinic` - Set to "DOCTOR"

## Transaction Safety
The doctor creation process uses Prisma transactions to ensure atomicity:
1. Validate clinic and tenant exist
2. Check for duplicate username/email/phone
3. Hash password
4. Create User record
5. Create Person record with DOCTOR type
6. Link User to Person
7. Create UserClinic association

If any step fails, the entire transaction is rolled back.

## Security Features
- Password hashing with bcrypt
- Input validation with Joi
- SQL injection prevention with Prisma
- JWT-based authentication
- Rate limiting (configured in app.ts)

## Testing
Use the provided test script:
```bash
./test-doctor-api.sh
```

Or test manually with curl commands as shown in the examples above.

## Swagger Documentation
API documentation is available at:
```
http://localhost:3000/api-docs
```

Look for the "Doctors" tag in the Swagger UI for interactive API testing.