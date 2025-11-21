# Clinic API Examples

## Creating a Clinic with Auto-Tenant Creation

The Clinic API supports automatic tenant and address creation. You can provide tenant and address details directly in the payload, and the system will automatically create the tenant and address records and link them to the clinic.

### Example 1: Create Clinic with New Tenant (Auto-create tenant)

```json
{
  "tenantName": "HealthCare Solutions Ltd",
  "tenantSlug": "healthcare-solutions",
  "name": "City General Hospital",
  "clinicType": "HUMAN",
  "isActive": true,
  "phone": "+91-9876543210",
  "email": "admin@citygeneralhospital.com",
  "address": {
    "address": "123 Medical Center Road, Block A",
    "townCode": "TOWN001",
    "town": "Downtown",
    "pin": "400001",
    "subDistrictCode": "SUB001",
    "subDistrict": "Central Mumbai",
    "districtCode": "DIST001",
    "district": "Mumbai",
    "stateCode": "MH",
    "state": "Maharashtra",
    "countryId": "IN",
    "countryName": "India",
    "geoLocation": {
      "latitude": 19.0760,
      "longitude": 72.8777
    }
  }
}
```

### Example 2: Create Clinic with Existing Tenant ID

```json
{
  "tenantId": "existing-tenant-123",
  "name": "Happy Paws Veterinary Clinic",
  "clinicType": "PET",
  "isActive": true,
  "phone": "+91-9876543211",
  "email": "care@happypaws.com",
  "address": {
    "address": "456 Pet Care Street, Ground Floor",
    "townCode": "TOWN002",
    "town": "Bandra",
    "pin": "400050",
    "subDistrictCode": "SUB002",
    "subDistrict": "Bandra West",
    "districtCode": "DIST001",
    "district": "Mumbai",
    "stateCode": "MH",
    "state": "Maharashtra",
    "countryId": "IN",
    "countryName": "India"
  }
}
```

### Example 3: Create Clinic with Auto-Tenant (uses clinic name as tenant name)

```json
{
  "name": "City General Hospital",
  "clinicType": "HUMAN", 
  "phone": "+91-9876543212",
  "email": "info@citygeneralhospital.com",
  "address": {
    "address": "789 Hospital Street",
    "townCode": "TOWN003",
    "town": "Pune",
    "pin": "411001",
    "subDistrictCode": "SUB003",
    "subDistrict": "Pune Central",
    "districtCode": "DIST003",
    "district": "Pune",
    "stateCode": "MH",
    "state": "Maharashtra",
    "countryId": "IN",
    "countryName": "India"
  }
}
```
*Note: This will create a new tenant with name "City General Hospital" and slug "city-general-hospital"*

### Example 4: Create Clinic with Custom Tenant Name

```json
{
  "tenantName": "HealthCare Solutions Ltd",
  "tenantSlug": "healthcare-solutions",
  "name": "Branch Clinic Mumbai",
  "clinicType": "PET",
  "phone": "+91-9876543213",
  "email": "mumbai@healthcaresolutions.com"
}
```
*Note: This will create a tenant "HealthCare Solutions Ltd" with the clinic "Branch Clinic Mumbai"*

### Example 4: Create Clinic with existing Address ID (Traditional approach)

```json
{
  "tenantId": "tenant-123",
  "name": "Quick Care Clinic",
  "clinicType": "HUMAN",
  "isActive": true,
  "phone": "+91-9876543213",
  "email": "info@quickcare.com",
  "addressId": "existing-address-id-123"
}
```

## Important Notes

### Validation Rules

1. **Tenant Auto-Creation**: If no `tenantId` is provided, system will create tenant using `tenantName` OR `clinic name` (if tenantName not provided)
2. **Tenant Name**: Can be explicitly provided OR will default to clinic name
3. **Tenant Slug**: Auto-generated from tenant name if not provided, must be unique
4. **Address vs AddressId**: You cannot provide both `address` object and `addressId` in the same request
5. **Clinic Name**: Must be unique within the tenant and at least 2 characters long
6. **Clinic Type**: Must be one of: HUMAN, PET, LIVESTOCK
7. **PIN Code**: Must be exactly 6 digits
8. **Required Address Fields**: When providing address object, all fields except `geoLocation` are required
9. **Phone Number**: Must match pattern for 10-15 digit phone numbers (with optional country code, spaces, hyphens, parentheses)
10. **Email**: Must be valid email format

### Update Examples

When updating a clinic with address:

```json
{
  "name": "Updated Clinic Name",
  "phone": "+91-9876543214",
  "email": "updated@email.com",
  "address": {
    "address": "789 New Address Lane, Updated Location",
    "townCode": "TOWN004",
    "town": "Andheri",
    "pin": "400058",
    "subDistrictCode": "SUB004",
    "subDistrict": "Andheri East",
    "districtCode": "DIST001",
    "district": "Mumbai",
    "stateCode": "MH", 
    "state": "Maharashtra",
    "countryId": "IN",
    "countryName": "India"
  }
}
```

This will:
- Update the clinic's name, phone, and email
- Create a new address if the clinic doesn't have one, OR
- Update the existing address if the clinic already has one

### Bulk Create Example

```json
{
  "clinics": [
    {
      "tenantId": "tenant-123",
      "name": "Bulk Clinic 1",
      "clinicType": "HUMAN",
      "phone": "+91-9876543215",
      "email": "bulk1@example.com",
      "address": {
        "address": "Street 1, Bulk Location 1",
        "townCode": "T001",
        "town": "Town1",
        "pin": "400001",
        "subDistrictCode": "S001",
        "subDistrict": "Sub1",
        "districtCode": "D001",
        "district": "District1",
        "stateCode": "MH",
        "state": "Maharashtra",
        "countryId": "IN",
        "countryName": "India"
      }
    },
    {
      "tenantId": "tenant-123",
      "name": "Bulk Clinic 2", 
      "clinicType": "PET",
      "phone": "+91-9876543216",
      "email": "bulk2@example.com",
      "addressId": "existing-address-456"
    }
  ]
}
```

## API Endpoints

- **POST** `/api/v1/o/clinic` - Create single clinic
- **POST** `/api/v1/o/clinic/bulk` - Bulk create clinics (max 50)
- **PUT** `/api/v1/o/clinic/{id}` - Update clinic
- **GET** `/api/v1/o/clinic` - Get all clinics with filtering
- **GET** `/api/v1/o/clinic/page` - Get paginated clinics
- **GET** `/api/v1/o/clinic/{id}` - Get clinic by ID
- **DELETE** `/api/v1/o/clinic/{id}` - Delete clinic

All endpoints require JWT authentication via Bearer token.

## Response Example

```json
{
  "success": true,
  "message": "Clinic created successfully",
  "data": {
    "id": "clinic-123",
    "tenantId": "tenant-123",
    "name": "City General Hospital",
    "clinicType": "HUMAN",
    "isActive": true,
    "phone": "+91-9876543210",
    "email": "admin@citygeneralhospital.com",
    "createdAt": "2025-11-20T10:00:00.000Z",
    "updatedAt": "2025-11-20T10:00:00.000Z",
    "address": {
      "id": "address-123",
      "address": "123 Medical Center Road, Block A",
      "town": "Downtown",
      "state": "Maharashtra",
      "countryName": "India"
    },
    "tenant": {
      "id": "tenant-123",
      "name": "Healthcare System",
      "slug": "healthcare-system"
    },
    "_count": {
      "patients": 0,
      "appointments": 0,
      "visits": 0
    }
  }
}
```