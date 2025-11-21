# OneHealth API - Swagger Documentation Fix

## Updated API Endpoints with Correct Swagger Paths

All Swagger documentation has been updated to match the actual API routes.

### ✅ **Fixed Endpoints:**

#### **Authentication**
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration  
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/users/profile` - Get user profile

#### **Clinics** 
- `POST /api/v1/clinics` - Create clinic
- `POST /api/v1/clinics/bulk` - Bulk create clinics
- `GET /api/v1/clinics` - Get all clinics
- `GET /api/v1/clinics/page` - Get paginated clinics
- `GET /api/v1/clinics/{id}` - Get clinic by ID
- `PUT /api/v1/clinics/{id}` - Update clinic
- `DELETE /api/v1/clinics/{id}` - Delete clinic

#### **Patients**
- `POST /api/v1/patients` - Create patient  
- `POST /api/v1/patients/bulk` - Bulk create patients
- `GET /api/v1/patients` - Get all patients
- `GET /api/v1/patients/page` - Get paginated patients
- `GET /api/v1/patients/{id}` - Get patient by ID
- `GET /api/v1/patients/pseudonym/{pseudonymId}` - Get patient by pseudonym
- `PUT /api/v1/patients/{id}` - Update patient
- `DELETE /api/v1/patients/{id}` - Delete patient

#### **Menus**
- `POST /api/v1/menus` - Create menu
- `GET /api/v1/menus` - Get all menus
- `GET /api/v1/menus/page` - Get paginated menus
- `GET /api/v1/menus/{id}` - Get menu by ID
- `GET /api/v1/menus/user/{userId}` - Get user menus
- `PUT /api/v1/menus/{id}` - Update menu
- `DELETE /api/v1/menus/{id}` - Delete menu

#### **Roles**
- `POST /api/v1/roles` - Create role
- `GET /api/v1/roles` - Get all roles
- `GET /api/v1/roles/page` - Get paginated roles
- `GET /api/v1/roles/{id}` - Get role by ID
- `PUT /api/v1/roles/{id}` - Update role
- `DELETE /api/v1/roles/{id}` - Delete role

#### **Users**
- `GET /api/v1/users` - Get all users
- `POST /api/v1/users/block` - Block user
- `POST /api/v1/users/unblock` - Unblock user

### 🔧 **What Was Fixed:**

1. **Clinic Routes**: Changed from `/clinic` to `/clinics` in Swagger docs
2. **Patient Routes**: Changed from `/patient` to `/patients` in Swagger docs  
3. **Menu Documentation**: Added comprehensive Swagger schemas and documentation
4. **Role Documentation**: Added comprehensive Swagger schemas and documentation
5. **Consistent Naming**: All endpoints now use plural resource naming

### 📚 **Swagger UI Access:**

Visit: `http://localhost:3000/api-docs`

All endpoints should now appear correctly in the Swagger interface with:
- ✅ Correct paths matching actual routes
- ✅ Complete request/response schemas
- ✅ Proper authentication requirements
- ✅ Detailed descriptions and examples

### 🧪 **Test Your Fixed API:**

```bash
# Start the server
npm run dev

# Open Swagger UI
open http://localhost:3000/api-docs

# Test clinic creation with correct endpoint
curl -X POST 'http://localhost:3000/api/v1/clinics' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test Clinic",
    "clinicType": "HUMAN",
    "isActive": true
  }'
```

All endpoints are now properly documented and should work correctly with the Swagger interface!