# OneHealth API - Endpoints Summary

## Authentication
- **POST** `/api/v1/auth/login` - Login with username/password
- **POST** `/api/v1/auth/register` - Register new user  
- **POST** `/api/v1/auth/logout` - Logout user
- **GET** `/api/v1/users/profile` - Get user profile

## Clinic Management 
- **POST** `/api/v1/clinics` - Create new clinic
- **POST** `/api/v1/clinics/bulk` - Bulk create clinics
- **GET** `/api/v1/clinics` - Get all clinics
- **GET** `/api/v1/clinics/page` - Get paginated clinics
- **GET** `/api/v1/clinics/{id}` - Get clinic by ID
- **PUT** `/api/v1/clinics/{id}` - Update clinic
- **DELETE** `/api/v1/clinics/{id}` - Delete clinic

## Patient Management
- **POST** `/api/v1/patients` - Create new patient
- **POST** `/api/v1/patients/bulk` - Bulk create patients
- **GET** `/api/v1/patients` - Get all patients
- **GET** `/api/v1/patients/page` - Get paginated patients
- **GET** `/api/v1/patients/{id}` - Get patient by ID
- **GET** `/api/v1/patients/pseudonym/{pseudonymId}` - Get patient by pseudonym
- **PUT** `/api/v1/patients/{id}` - Update patient
- **DELETE** `/api/v1/patients/{id}` - Delete patient

## Menu Management
- **POST** `/api/v1/menus` - Create new menu
- **GET** `/api/v1/menus` - Get all menus
- **GET** `/api/v1/menus/page` - Get paginated menus
- **GET** `/api/v1/menus/{id}` - Get menu by ID
- **GET** `/api/v1/menus/user/{userId}` - Get menus for user
- **PUT** `/api/v1/menus/{id}` - Update menu
- **DELETE** `/api/v1/menus/{id}` - Delete menu

## Role Management
- **POST** `/api/v1/roles` - Create new role
- **GET** `/api/v1/roles` - Get all roles
- **GET** `/api/v1/roles/page` - Get paginated roles
- **GET** `/api/v1/roles/{id}` - Get role by ID
- **PUT** `/api/v1/roles/{id}` - Update role
- **DELETE** `/api/v1/roles/{id}` - Delete role

## User Management
- **GET** `/api/v1/users` - Get all users
- **POST** `/api/v1/users/block` - Block user
- **POST** `/api/v1/users/unblock` - Unblock user
- **PUT** `/api/v1/users/verify-email/{id}` - Verify user email

## Setup (Development Only)
- **POST** `/setup/super-admin` - Create super admin user
- **GET** `/setup/health` - Setup health check

## Working Example

### 1. Login with Super Admin
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@1234"
  }'
```

### 2. Create Clinic (Fixed URL)
```bash
curl -X POST http://localhost:3000/api/v1/clinics \
  -H "accept: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Healthy Life Clinic",
    "clinicType": "HUMAN",
    "isActive": true,
    "phone": "9876543210",
    "email": "info@healthylifeclinic.com",
    "address": {
      "address": "24 MG Road, Shivaji Nagar",
      "townCode": "T1234",
      "town": "Pune",
      "pin": "411004",
      "subDistrictCode": "SD56",
      "subDistrict": "Shivaji Nagar",
      "districtCode": "D789",
      "district": "Pune",
      "stateCode": "MH",
      "state": "Maharashtra",
      "countryId": "IN",
      "countryName": "India",
      "geoLocation": {
        "lat": 18.5204,
        "lng": 73.8567
      }
    }
  }'
```

## Key Changes Made

1. **Fixed Route Paths**: Changed from `/o/clinic` to `/clinics` (plural)
2. **Updated Swagger Documentation**: All paths now match the actual routes
3. **Fixed TypeScript Issues**: Simplified bulk create to avoid compilation errors
4. **Consistent Naming**: All modules now use plural naming convention

## Swagger Documentation

Access the API documentation at: `http://localhost:3000/api-docs`

All endpoints are now properly documented and should appear in Swagger UI with the correct paths.

## Authentication Required

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

Get the token by logging in with the super admin credentials:
- Username: `admin`
- Password: `Admin@1234`