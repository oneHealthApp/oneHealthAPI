# Patient API Examples

## Creating a Patient with Address and Person

The Patient API supports automatic address and person creation. You can provide address and person details directly in the payload, and the system will automatically create the address and person records and link them to the patient.

### Example 1: Create HUMAN Patient with Person and Address

```json
{
  "tenantId": "tenant-123",
  "clinicId": "clinic-456",
  "pseudonymId": "HUMAN-PAT-001",
  "type": "HUMAN",
  "age": 35,
  "sex": "FEMALE",
  "hasIdentifyingInfo": true,
  "externalId": "HUMAN-001",
  "person": {
    "fullName": "Jane Doe",
    "phone": "+91-9876543210",
    "email": "jane.doe@example.com",
    "dateOfBirth": "1988-05-15",
    "sex": "FEMALE"
  },
  "address": {
    "address": "456 Health Street, Block C",
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

### Example 2: Create PET Patient with Owner Person and Address

```json
{
  "tenantId": "tenant-123",
  "clinicId": "clinic-456",
  "pseudonymId": "PAT001",
  "type": "PET",
  "age": 3,
  "sex": "MALE",
  "species": "DOG",
  "breed": "Golden Retriever",
  "hasIdentifyingInfo": true,
  "externalId": "EXT-DOG-001",
  "ownerId": "owner-789",
  "person": {
    "fullName": "Max the Golden",
    "dateOfBirth": "2020-03-10",
    "sex": "MALE"
  },
  "address": {
    "address": "123 Main Street, Apartment 4B",
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

### Example 3: Create Patient with only Person (no address)

```json
{
  "tenantId": "tenant-123",
  "clinicId": "clinic-456", 
  "pseudonymId": "HUMAN-PAT-002",
  "type": "HUMAN",
  "age": 42,
  "sex": "MALE",
  "hasIdentifyingInfo": true,
  "person": {
    "fullName": "John Smith",
    "phone": "9876543210",
    "email": "john.smith@email.com",
    "dateOfBirth": "1981-12-25",
    "sex": "MALE"
  }
}
```

### Example 4: Create Patient without Person/Address (Traditional approach)

```json
{
  "tenantId": "tenant-123",
  "clinicId": "clinic-456",
  "pseudonymId": "PAT001",
  "type": "PET",
  "age": 3,
  "sex": "MALE",
  "species": "DOG",
  "breed": "Golden Retriever",
  "hasIdentifyingInfo": true,
  "externalId": "EXT-DOG-001",
  "ownerId": "owner-789",
  "address": {
    "address": "123 Main Street, Apartment 4B",
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

### Example 2: Create HUMAN Patient with Address

```json
{
  "tenantId": "tenant-123",
  "clinicId": "clinic-456",
  "pseudonymId": "HUMAN-PAT-001",
  "type": "HUMAN",
  "age": 35,
  "sex": "FEMALE",
  "hasIdentifyingInfo": true,
  "externalId": "HUMAN-001",
  "address": {
    "address": "456 Health Street, Block C",
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

### Example 3: Create Patient with existing Address ID (Traditional approach)

```json
{
  "tenantId": "tenant-123",
  "clinicId": "clinic-456",
  "pseudonymId": "PAT002",
  "type": "LIVESTOCK",
  "age": 2,
  "sex": "FEMALE",
  "species": "COW",
  "breed": "Holstein",
  "hasIdentifyingInfo": false,
  "addressId": "existing-address-id-123"
}
```

## Important Notes

### Validation Rules

1. **Address vs AddressId**: You cannot provide both `address` object and `addressId` in the same request
2. **Species for Animals**: PET and LIVESTOCK patients must have a `species` field
3. **No Species for Humans**: HUMAN patients cannot have a `species` field  
4. **PIN Code**: Must be exactly 6 digits
5. **Required Address Fields**: When providing address object, all fields except `geoLocation` are required
6. **Person Fields**: All person fields are optional, but if provided:
   - **Full Name**: Must be 2-100 characters if provided
   - **Email**: Must be valid email format
   - **Phone**: Must match pattern for 10-15 digit phone numbers (with optional country code, spaces, hyphens, parentheses)
   - **Date of Birth**: Must be valid ISO date format (YYYY-MM-DD) and not in the future
   - **Sex**: Must be one of: MALE, FEMALE, OTHER, UNKNOWN

### Update Examples

When updating a patient with address:

```json
{
  "age": 4,
  "breed": "German Shepherd",
  "address": {
    "address": "789 New Address Lane",
    "townCode": "TOWN003",
    "town": "Andheri",
    "pin": "400058",
    "subDistrictCode": "SUB003",
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
- Update the patient's age and breed
- Create a new address if the patient doesn't have one, OR
- Update the existing address if the patient already has one

### Update with Person and Address

```json
{
  "age": 36,
  "person": {
    "fullName": "Jane Smith",
    "phone": "+91-9876543211",
    "email": "jane.smith@newdomain.com"
  },
  "address": {
    "address": "789 New Address Lane",
    "townCode": "TOWN003",
    "town": "Andheri",
    "pin": "400058",
    "subDistrictCode": "SUB003",
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
- Update the patient's age
- Create a new person record if the patient doesn't have one, OR update the existing person record
- Create a new address if the patient doesn't have one, OR update the existing address

### Bulk Create Example

```json
{
  "patients": [
    {
      "tenantId": "tenant-123",
      "pseudonymId": "BULK-PAT-001",
      "type": "PET",
      "species": "CAT",
      "age": 2,
      "person": {
        "fullName": "Fluffy the Cat",
        "dateOfBirth": "2022-01-15",
        "sex": "FEMALE"
      },
      "address": {
        "address": "Street 1",
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
      "pseudonymId": "BULK-PAT-002",
      "type": "HUMAN",
      "age": 30,
      "person": {
        "fullName": "Alice Johnson",
        "phone": "+91-9876543212",
        "email": "alice.johnson@example.com",
        "dateOfBirth": "1993-08-20",
        "sex": "FEMALE"
      },
      "addressId": "existing-address-123"
    }
  ]
}
```

## API Endpoints

- **POST** `/api/v1/o/patient` - Create single patient
- **POST** `/api/v1/o/patient/bulk` - Bulk create patients
- **PUT** `/api/v1/o/patient/{id}` - Update patient

All endpoints require JWT authentication via Bearer token.