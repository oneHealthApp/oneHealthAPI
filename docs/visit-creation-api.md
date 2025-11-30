# Visit Creation API Documentation

## Overview
The Visit Creation API enables healthcare facilities to create patient visit records when patients come to the clinic. This API is part of the patient module and handles the complete visit workflow from creation to management.

## Business Context
1. **Patient Registration**: Must be completed before creating a visit
2. **Visit Appointment Form**: Frontend sends visit data to this API
3. **Visit Record**: API creates a comprehensive visit entry with vitals, symptoms, and notes

## API Endpoints

### Create Visit
```
POST /api/v1/patients/visits
```

### Get Visit by ID
```
GET /api/v1/patients/visits/:id
```

### Update Visit
```
PUT /api/v1/patients/visits/:id
```

### Get Visits with Filtering
```
GET /api/v1/patients/visits
```

## Authentication
All endpoints require JWT Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

## Request Body Schema

### Create Visit Request
```json
{
  "tenantId": "string (required)",
  "clinicId": "string (required)",
  "patientId": "string (required)",
  "doctorId": "string (optional)",
  "visitType": "CLINIC | HOME | ON_CALL | FARM (optional, default: CLINIC)",
  "vitals": {
    "temperature": "number (90-110°F, optional)",
    "pulse": "number (40-200 bpm, optional)",
    "bp": "string (format: XXX/XX, optional)",
    "spo2": "number (70-100%, optional)"
  },
  "symptoms": "string (max 1000 chars, optional)",
  "notes": "string (max 2000 chars, optional)"
}
```

### Validation Rules

#### Required Fields
- `tenantId`: Must exist in database and be active
- `clinicId`: Must exist in database and be active
- `patientId`: Must exist in database

#### Optional Fields
- `doctorId`: If provided, must exist and have DOCTOR or STAFF role
- `visitType`: Must be one of the enum values
- `vitals`: Object with medical measurement validations
- `symptoms`: Free-text description of patient symptoms
- `notes`: Additional visit notes

#### Vitals Validation
```json
{
  "temperature": {
    "type": "number",
    "min": 90,
    "max": 110,
    "description": "Body temperature in Fahrenheit"
  },
  "pulse": {
    "type": "number", 
    "min": 40,
    "max": 200,
    "description": "Heart rate in beats per minute"
  },
  "bp": {
    "type": "string",
    "pattern": "^\\d{2,3}/\\d{2,3}$",
    "example": "120/80",
    "description": "Blood pressure systolic/diastolic"
  },
  "spo2": {
    "type": "number",
    "min": 70,
    "max": 100,
    "description": "Oxygen saturation percentage"
  }
}
```

## Response Formats

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Visit created successfully",
  "data": {
    "id": "visit-abc123",
    "tenantId": "tenant-123",
    "clinicId": "clinic-456",
    "patientId": "patient-789",
    "doctorId": "doctor-101",
    "visitType": "CLINIC",
    "startedAt": "2025-11-21T10:30:00.000Z",
    "endedAt": null,
    "symptoms": "Fever, headache, and fatigue",
    "vitals": {
      "temperature": 98.6,
      "pulse": 72,
      "bp": "120/80",
      "spo2": 98
    },
    "notes": "Patient appears alert and responsive",
    "workflowState": "OPEN",
    "createdAt": "2025-11-21T10:30:00.000Z",
    "updatedAt": "2025-11-21T10:30:00.000Z"
  }
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "Invalid patient ID",
  "error": "Patient with provided ID does not exist"
}
```

#### 400 Bad Request - Vitals Validation Error
```json
{
  "success": false,
  "message": "Temperature must be at least 90°F",
  "error": "Validation failed on vitals.temperature field"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Missing or invalid JWT token"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to create visit",
  "error": "Database connection error"
}
```

## Database Schema

### Visit Model
```prisma
model Visit {
  id       String @id @default(cuid())
  tenantId String
  clinicId String
  patientId String
  doctorId String?
  
  visitType VisitType @default(CLINIC)
  startedAt DateTime  @default(now())
  endedAt   DateTime?

  symptoms String?
  vitals   Json?     // Stores vitals object as JSON
  notes    String?
  workflowState String? // "OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Relationships
- **Tenant** (1:M) - Visit belongs to tenant
- **Clinic** (1:M) - Visit belongs to clinic
- **Patient** (1:M) - Visit belongs to patient
- **Doctor** (1:M) - Visit optionally assigned to doctor

## Visit Types

| Type | Description | Use Case |
|------|-------------|----------|
| `CLINIC` | Regular clinic visit | Standard outpatient visit |
| `HOME` | Home visit | Doctor visits patient at home |
| `ON_CALL` | On-call visit | Emergency or urgent care |
| `FARM` | Farm visit | Livestock care (veterinary) |

## Workflow States

| State | Description | Next States |
|-------|-------------|-------------|
| `OPEN` | Visit just created | IN_PROGRESS, CANCELLED |
| `IN_PROGRESS` | Visit in progress | COMPLETED, CANCELLED |
| `COMPLETED` | Visit completed | - |
| `CANCELLED` | Visit cancelled | - |

## Business Logic

### Automatic Fields
- `startedAt`: Set to current timestamp when visit is created
- `endedAt`: Initially null, set when visit is completed
- `workflowState`: Defaults to "OPEN"
- `vitals`: Stored as JSON in database for flexible structure

### Validation Logic
1. **Entity Validation**: Verifies tenant, clinic, and patient exist
2. **Doctor Validation**: If doctorId provided, verifies doctor exists and has appropriate role
3. **Vitals Validation**: Ensures medical measurements are within realistic ranges
4. **Text Limits**: Enforces character limits on symptoms and notes

### Data Handling
- **Vitals Storage**: Vitals object is serialized to JSON for database storage
- **Vitals Retrieval**: JSON is parsed back to object when returning data
- **Null Handling**: Optional fields are stored as null when not provided

## Query Parameters for Filtering

When using `GET /patients/visits`, you can filter results with:

| Parameter | Type | Description |
|-----------|------|-------------|
| `tenantId` | string | Filter by tenant |
| `clinicId` | string | Filter by clinic |
| `patientId` | string | Filter by patient |
| `doctorId` | string | Filter by doctor |
| `visitType` | enum | Filter by visit type |
| `workflowState` | string | Filter by workflow state |
| `startDate` | date | Filter visits after date |
| `endDate` | date | Filter visits before date |

### Example Filter Query
```
GET /patients/visits?patientId=patient-123&clinicId=clinic-456&workflowState=OPEN
```

## Testing Examples

### Clinic Visit
```bash
curl -X POST \
  http://localhost:3000/api/v1/patients/visits \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "tenantId": "tenant-123",
    "clinicId": "clinic-456",
    "patientId": "patient-789",
    "doctorId": "doctor-101",
    "visitType": "CLINIC",
    "vitals": {
      "temperature": 98.6,
      "pulse": 72,
      "bp": "120/80",
      "spo2": 98
    },
    "symptoms": "Fever, headache, and fatigue",
    "notes": "Patient appears alert and responsive"
  }'
```

### Emergency Visit (No Doctor Assigned)
```bash
curl -X POST \
  http://localhost:3000/api/v1/patients/visits \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "tenantId": "tenant-123",
    "clinicId": "clinic-456",
    "patientId": "patient-789",
    "visitType": "CLINIC",
    "vitals": {
      "temperature": 102.5,
      "pulse": 110,
      "bp": "140/90",
      "spo2": 95
    },
    "symptoms": "Severe chest pain, difficulty breathing",
    "notes": "EMERGENCY - requires immediate attention"
  }'
```

## Integration with Other Modules

### Prerequisites
1. **Patient Module**: Patient must be registered first
2. **User Module**: Doctor must exist with proper role
3. **Clinic Module**: Clinic must be configured
4. **Tenant Module**: Tenant must be set up

### Related Endpoints
- **Diagnoses**: Can be added to visits after creation
- **Prescriptions**: Can be linked to visits
- **Lab Orders**: Can be associated with visits
- **Appointments**: May precede visit creation

## Security Considerations

1. **Authentication**: JWT token required for all endpoints
2. **Data Validation**: Comprehensive input validation with Joi
3. **Medical Data**: Vitals stored securely as JSON
4. **Audit Trail**: All operations logged with request IDs
5. **Error Handling**: Sensitive details only in development mode

## Performance Characteristics

- **Creation Time**: ~50-100ms for visit creation
- **Validation Time**: ~20-30ms for all validations
- **Database Queries**: 4-5 queries per creation (validation + insert)
- **JSON Processing**: Minimal overhead for vitals serialization

## Monitoring & Logging

### Key Metrics
- Visit creation success/failure rates
- Response times by visit type
- Validation error patterns
- Doctor assignment rates

### Log Events
- Visit creation attempts
- Validation failures
- Entity not found errors
- Database errors
- Performance metrics

All logs include request ID for tracing and user ID for audit purposes.