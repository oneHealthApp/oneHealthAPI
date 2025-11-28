#!/bin/bash

# Test script for Visit Creation API
# This script tests the POST /patients/visits endpoint

API_BASE_URL="http://localhost:3000/api/v1"

echo "🏥 Testing Visit Creation API..."
echo "================================="

# First, we need to login to get access token
echo "📝 Note: You need to provide a valid JWT token to test this endpoint"
echo "💡 Use your login endpoint to get the token first"

# Example test data for clinic visit
CLINIC_VISIT_DATA='{
  "tenantId": "your-tenant-id",
  "clinicId": "your-clinic-id",
  "patientId": "your-patient-id",
  "doctorId": "your-doctor-id",
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

# Example test data for emergency visit
EMERGENCY_VISIT_DATA='{
  "tenantId": "your-tenant-id", 
  "clinicId": "your-clinic-id",
  "patientId": "your-patient-id",
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

echo "📤 Test Data (Clinic Visit):"
echo "$CLINIC_VISIT_DATA" | jq .

echo ""
echo "📤 Test Data (Emergency Visit):"
echo "$EMERGENCY_VISIT_DATA" | jq .

echo ""
echo "📡 Example cURL commands:"
echo ""
echo "🏥 Create Clinic Visit:"
echo "curl -X POST \\"
echo "  $API_BASE_URL/patients/visits \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -d '$CLINIC_VISIT_DATA'"

echo ""
echo "🚨 Create Emergency Visit:"
echo "curl -X POST \\"
echo "  $API_BASE_URL/patients/visits \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -d '$EMERGENCY_VISIT_DATA'"

echo ""
echo "📋 Get Visit by ID:"
echo "curl -X GET \\"
echo "  $API_BASE_URL/patients/visits/VISIT_ID \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN'"

echo ""
echo "🔍 Get Visits with Filters:"
echo "curl -X GET \\"
echo "  '$API_BASE_URL/patients/visits?patientId=PATIENT_ID&clinicId=CLINIC_ID&visitType=CLINIC' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN'"

echo ""
echo "✅ Expected Response (201 Created):"
cat << 'EOF'
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
EOF

echo ""
echo "❌ Error Cases:"
echo "• 400 - Validation errors (missing required fields, invalid vitals)"
echo "• 400 - Invalid references (tenant, clinic, patient, doctor not found)"
echo "• 401 - Unauthorized (missing or invalid JWT token)"
echo "• 500 - Internal server error"

echo ""
echo "🔑 Required Setup:"
echo "1. Ensure you have a valid Tenant record"
echo "2. Ensure you have a valid Clinic record"
echo "3. Ensure you have a valid Patient record"
echo "4. Ensure you have a valid Doctor/User with DOCTOR or STAFF role (if assigning doctor)"
echo "5. Get a valid JWT token from login endpoint"
echo "6. Replace placeholder values in the test data"

echo ""
echo "📚 Swagger Documentation:"
echo "• Interactive API docs: http://localhost:3000/api-docs"
echo "• Find 'Visits' section"
echo "• Click 'POST /patients/visits' endpoint"
echo "• Use 'Try it out' button to test directly"
echo "• Comprehensive request/response examples included"

echo ""
echo "🎯 Visit Types Supported:"
echo "• CLINIC - Regular clinic visit"
echo "• HOME - Home visit"
echo "• ON_CALL - On-call visit"
echo "• FARM - Farm visit (for livestock)"

echo ""
echo "🩺 Vitals Validation Ranges:"
echo "• Temperature: 90-110°F"
echo "• Pulse: 40-200 bpm"
echo "• Blood Pressure: Format 'XXX/XX' (e.g., 120/80)"
echo "• SpO2: 70-100%"

echo ""
echo "💾 Database Changes:"
echo "• Creates Visit record with JSON vitals"
echo "• Links to Tenant, Clinic, Patient, and Doctor (if provided)"
echo "• Sets startedAt to current time"
echo "• Sets workflowState to 'OPEN'"
echo "• Validates all foreign key relationships"

echo ""
echo "🔄 Workflow States:"
echo "• OPEN - Visit just created"
echo "• IN_PROGRESS - Visit in progress"
echo "• COMPLETED - Visit completed"
echo "• CANCELLED - Visit cancelled"

echo ""
echo "📊 Additional API Endpoints:"
echo "• GET /patients/visits/:id - Get specific visit"
echo "• PUT /patients/visits/:id - Update visit"
echo "• GET /patients/visits - Get visits with filters"

echo ""
echo "🔍 Query Parameters for Filtering:"
echo "• tenantId - Filter by tenant"
echo "• clinicId - Filter by clinic"
echo "• patientId - Filter by patient"
echo "• doctorId - Filter by doctor"
echo "• visitType - Filter by visit type"
echo "• workflowState - Filter by workflow state"
echo "• startDate - Filter visits after date"
echo "• endDate - Filter visits before date"