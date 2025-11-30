# Ongoing Visits API

This document describes the new API endpoint for retrieving ongoing visits by clinic ID.

## Endpoint

```
GET /api/v1/patients/visits/clinic/{clinicId}/ongoing
```

## Description

Retrieves all visits for a specific clinic where the visit is still ongoing (endedAt is null). This endpoint is useful for displaying active visits in clinic dashboards, queue management, and real-time capacity tracking.

## Authentication

Requires JWT authentication via Bearer token in the Authorization header.

## Parameters

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| clinicId | string | Yes | The clinic ID to get ongoing visits for |

### Example Request

```bash
curl -X GET "http://localhost:3000/api/v1/patients/visits/clinic/clinic-456/ongoing" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

## Response Format

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Ongoing visits retrieved successfully",
  "data": [
    {
      "id": "visit-abc123",
      "tenantId": "tenant-123",
      "clinicId": "clinic-456",
      "patientId": "patient-789",
      "doctorId": "doctor-101",
      "visitType": "CLINIC",
      "startedAt": "2025-11-22T10:30:00.000Z",
      "endedAt": null,
      "symptoms": "Fever, headache",
      "vitals": {
        "temperature": 98.6,
        "pulse": 72,
        "bp": "120/80",
        "spo2": 98
      },
      "notes": "Patient appears alert",
      "workflowState": "OPEN",
      "patient": {
        "id": "patient-789",
        "pseudonymId": "P-12345",
        "type": "HUMAN",
        "age": 35,
        "sex": "Male",
        "species": null
      },
      "doctor": {
        "id": "doctor-101",
        "username": "dr.smith",
        "emailId": "dr.smith@clinic.com",
        "person": {
          "fullName": "Dr. John Smith"
        }
      },
      "clinic": {
        "id": "clinic-456",
        "name": "City General Clinic",
        "clinicType": "HUMAN"
      },
      "createdAt": "2025-11-22T10:30:00.000Z",
      "updatedAt": "2025-11-22T10:30:00.000Z"
    }
  ]
}
```

### Error Responses

#### 400 Bad Request - Invalid Clinic ID
```json
{
  "success": false,
  "message": "Invalid clinic ID",
  "error": "Clinic with provided ID does not exist or is inactive"
}
```

#### 401 Unauthorized - Missing or Invalid JWT
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Missing or invalid JWT token"
}
```

#### 404 Not Found - Clinic Not Found
```json
{
  "success": false,
  "message": "Clinic not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch ongoing visits",
  "error": "Internal server error details (development mode only)"
}
```

## Business Logic

- Returns only visits where `endedAt` is `null` (ongoing visits)
- Includes comprehensive patient information and assigned doctor details
- Results are ordered by visit start time (most recent first)
- Includes visit vitals, symptoms, and current workflow state
- Validates clinic existence and active status before processing

## Use Cases

1. **Clinic Dashboard**: Display current active visits for staff overview
2. **Queue Management**: Track ongoing patient visits for efficient workflow
3. **Staff Assignment**: Monitor workload and assign doctors to visits
4. **Real-time Monitoring**: Track clinic capacity and patient flow
5. **Workflow Management**: Identify visits that need attention or follow-up

## Database Query

The endpoint filters visits using:
```sql
WHERE clinicId = :clinicId AND endedAt IS NULL
ORDER BY startedAt DESC
```

## Testing

Use the provided test script:
```bash
export TOKEN="your-jwt-token-here"
./test-ongoing-visits.sh
```

Or test manually:
```bash
curl -X GET "http://localhost:3000/api/v1/patients/visits/clinic/YOUR_CLINIC_ID/ongoing" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

## Swagger Documentation

This endpoint is fully documented in the Swagger UI at `/api-docs`. The documentation includes:
- Complete request/response schemas
- Authentication requirements
- Example requests and responses
- Error scenarios and status codes

## Implementation Files

- **Controller**: `src/modules/patient/visit.controller.ts`
- **Service**: `src/modules/patient/visit.service.ts`
- **Repository**: `src/modules/patient/visit.repository.ts`
- **Routes**: `src/modules/patient/patient.routes.ts`