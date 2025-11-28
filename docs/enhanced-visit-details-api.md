# Enhanced Visit Details API with Lab Orders

This document describes the enhanced API endpoint for adding comprehensive medical details to visits, now including lab orders alongside diagnoses and prescriptions.

## Endpoint

```
POST /api/v1/patients/visits/details
```

## Description

Adds multiple diagnoses, prescriptions, and/or lab orders to an already existing visit. This endpoint is used after visit creation to add comprehensive medical details including laboratory testing orders.

## Authentication

Requires JWT authentication via Bearer token in the Authorization header.

## Enhanced Features

### New Lab Order Support

The API now supports adding lab orders with the following capabilities:

- **Multiple Tests per Order**: Each lab order can contain multiple tests
- **Test Categorization**: Tests can be categorized (Hematology, Chemistry, Microbiology, etc.)
- **Special Instructions**: Each test can have specific collection or preparation instructions
- **Status Tracking**: Lab orders start with "PENDING" status and can be updated
- **Flexible Test Codes**: Optional test codes for laboratory system integration

### Request Body

```json
{
  "visitId": "string (required)",
  "diagnoses": [
    {
      "providerId": "string (optional)",
      "icdCode": "string (required)",
      "snomedId": "string (optional)",
      "label": "string (required)",
      "primary": "boolean (optional)",
      "confidence": "number 0-1 (optional)",
      "status": "provisional|confirmed|ruled-out (optional)",
      "notes": "string max 500 chars (optional)"
    }
  ],
  "prescriptions": [
    {
      "prescriberId": "string (optional)",
      "diagnosisId": "string (optional)",
      "items": [
        {
          "medicine": "string (required)",
          "dose": "string (required)",
          "frequency": "string (required)",
          "duration": "string (required)"
        }
      ],
      "instructions": "string max 1000 chars (optional)"
    }
  ],
  "labOrders": [
    {
      "tests": [
        {
          "testName": "string (required)",
          "testCode": "string (optional)",
          "category": "string (optional)",
          "instructions": "string max 500 chars (optional)"
        }
      ],
      "status": "PENDING|IN_PROGRESS|COMPLETED|CANCELLED (optional, defaults to PENDING)",
      "notes": "string max 500 chars (optional)"
    }
  ]
}
```

## Validation Rules

### General
- At least one of `diagnoses`, `prescriptions`, or `labOrders` must be provided
- All arrays can be empty but if provided, must contain at least one valid item

### Lab Orders Specific
- Each lab order must have at least one test
- Each test must have a `testName`
- `status` must be one of: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- `instructions` for tests are limited to 500 characters
- `notes` for lab orders are limited to 500 characters

### Test Categories
Common categories include:
- `Hematology` - Blood cell counts, coagulation studies
- `Chemistry` - Blood chemistry, glucose, lipids
- `Microbiology` - Cultures, sensitivity testing
- `Immunology` - Immune markers, antibodies
- `Endocrinology` - Hormone levels
- `Pathology` - Tissue analysis

## Example Requests

### 1. Lab Orders Only

```json
{
  "visitId": "visit-123",
  "labOrders": [
    {
      "tests": [
        {
          "testName": "Complete Blood Count",
          "testCode": "CBC",
          "category": "Hematology",
          "instructions": "Fasting not required"
        },
        {
          "testName": "Blood Glucose",
          "testCode": "BG",
          "category": "Chemistry",
          "instructions": "12-hour fasting required"
        }
      ],
      "status": "PENDING",
      "notes": "Routine annual checkup"
    }
  ]
}
```

### 2. Comprehensive Medical Details

```json
{
  "visitId": "visit-456",
  "diagnoses": [
    {
      "providerId": "doctor-123",
      "icdCode": "R50.9",
      "snomedId": "386661006",
      "label": "Fever of unspecified origin",
      "primary": true,
      "confidence": 0.8,
      "status": "provisional",
      "notes": "Requires further investigation"
    }
  ],
  "prescriptions": [
    {
      "prescriberId": "doctor-123",
      "items": [
        {
          "medicine": "Paracetamol",
          "dose": "500 mg",
          "frequency": "3 times/day",
          "duration": "5 days"
        }
      ],
      "instructions": "Take after meals"
    }
  ],
  "labOrders": [
    {
      "tests": [
        {
          "testName": "Blood Culture",
          "testCode": "BC",
          "category": "Microbiology",
          "instructions": "Collect before antibiotic therapy"
        },
        {
          "testName": "C-Reactive Protein",
          "testCode": "CRP",
          "category": "Immunology",
          "instructions": "No special preparation"
        }
      ],
      "status": "PENDING",
      "notes": "URGENT - Rule out sepsis"
    }
  ]
}
```

### 3. Multiple Lab Orders

```json
{
  "visitId": "visit-789",
  "labOrders": [
    {
      "tests": [
        {
          "testName": "Lipid Profile",
          "testCode": "LIPID",
          "category": "Chemistry",
          "instructions": "12-hour fasting required"
        }
      ],
      "status": "PENDING",
      "notes": "Cardiovascular risk assessment"
    },
    {
      "tests": [
        {
          "testName": "Thyroid Function Test",
          "testCode": "TFT",
          "category": "Endocrinology",
          "instructions": "Morning collection preferred"
        }
      ],
      "status": "PENDING",
      "notes": "Follow-up from previous abnormal results"
    }
  ]
}
```

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Visit updated successfully",
  "data": {
    "diagnoses": [
      {
        "id": "diag-abc123",
        "visitId": "visit-123",
        "providerId": "doctor-123",
        "icdCode": "R50.9",
        "snomedId": "386661006",
        "label": "Fever of unspecified origin",
        "primary": true,
        "confidence": 0.8,
        "status": "provisional",
        "notes": "Requires further investigation",
        "createdAt": "2025-11-22T10:30:00.000Z"
      }
    ],
    "prescriptions": [
      {
        "id": "presc-def456",
        "visitId": "visit-123",
        "prescriberId": "doctor-123",
        "diagnosisId": null,
        "items": [
          {
            "medicine": "Paracetamol",
            "dose": "500 mg",
            "frequency": "3 times/day",
            "duration": "5 days"
          }
        ],
        "instructions": "Take after meals",
        "createdAt": "2025-11-22T10:30:00.000Z"
      }
    ],
    "labOrders": [
      {
        "id": "lab-ghi789",
        "visitId": "visit-123",
        "tests": [
          {
            "testName": "Blood Culture",
            "testCode": "BC",
            "category": "Microbiology",
            "instructions": "Collect before antibiotic therapy"
          },
          {
            "testName": "C-Reactive Protein",
            "testCode": "CRP",
            "category": "Immunology",
            "instructions": "No special preparation"
          }
        ],
        "results": null,
        "status": "PENDING",
        "createdAt": "2025-11-22T10:30:00.000Z",
        "updatedAt": "2025-11-22T10:30:00.000Z"
      }
    ]
  }
}
```

## Error Responses

### 400 Bad Request - Missing Required Data
```json
{
  "success": false,
  "message": "At least one of diagnoses, prescriptions, or lab orders must be provided"
}
```

### 400 Bad Request - Invalid Lab Order
```json
{
  "success": false,
  "message": "Validation failed",
  "details": [
    {
      "field": "labOrders[0].tests[0].testName",
      "message": "Test name is required"
    }
  ]
}
```

### 400 Bad Request - Visit Not Found
```json
{
  "success": false,
  "message": "Visit not found",
  "error": "Visit with provided ID does not exist"
}
```

## Business Logic

### Transaction Safety
- All insertions (diagnoses, prescriptions, lab orders) are performed within a single database transaction
- If any insertion fails, all changes are rolled back
- Ensures data consistency across all medical records

### Lab Order Workflow
1. **Creation**: Lab orders start with "PENDING" status
2. **Processing**: Status can be updated to "IN_PROGRESS" when lab starts processing
3. **Completion**: Status becomes "COMPLETED" when results are available
4. **Cancellation**: Status can be "CANCELLED" if test is no longer needed

### Data Storage
- Test information is stored as JSON in the database for flexibility
- Results field is initially null and populated when lab results are available
- All timestamps are automatically managed

## Integration Considerations

### Laboratory Information Systems (LIS)
- Test codes can be mapped to your laboratory system
- Categories help organize tests by department
- Instructions field supports special collection requirements

### Clinical Decision Support
- Primary diagnoses can trigger automated lab recommendations
- Confidence levels support diagnostic uncertainty tracking
- Status tracking enables workflow management

## Testing

Use the provided test script:
```bash
export TOKEN="your-jwt-token-here"
./test-visit-details-lab-orders.sh
```

## Swagger Documentation

Complete API documentation with examples is available at `/api-docs` when the server is running. The documentation includes:

- Interactive request/response examples
- Full schema definitions
- Authentication requirements
- Validation rules and error scenarios

## Migration from Previous Version

### Backward Compatibility
- Existing requests using only `diagnoses` and `prescriptions` continue to work unchanged
- Response format is enhanced but maintains all existing fields
- No breaking changes to existing functionality

### New Features Available
- Add `labOrders` array to existing requests
- Enhanced validation now checks for at least one of three data types
- Response includes `labOrders` array (empty if no lab orders added)

## Implementation Files

- **Types**: `src/modules/patient/visit.type.ts`
- **Validator**: `src/modules/patient/visit.validator.ts`
- **Repository**: `src/modules/patient/visit.repository.ts` 
- **Service**: `src/modules/patient/visit.service.ts`
- **Controller**: `src/modules/patient/visit.controller.ts`