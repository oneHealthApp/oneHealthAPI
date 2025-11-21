#!/bin/bash

# Test script for Visit Details API
# This script tests the POST /patients/visits/details endpoint

API_BASE_URL="http://localhost:3000/api/v1"

echo "🩺 Testing Visit Details API..."
echo "================================="

echo "📝 Note: You need to provide a valid JWT token and existing visit ID"
echo "💡 Create a visit first using POST /patients/visits, then use the returned visitId"

# Example test data with both diagnoses and prescriptions
FULL_DETAILS_DATA='{
  "visitId": "your-visit-id",
  "diagnoses": [
    {
      "providerId": "D1",
      "icdCode": "A00",
      "snomedId": "123456",
      "label": "Cholera",
      "primary": true,
      "confidence": 0.9,
      "status": "confirmed",
      "notes": "Strong symptoms"
    },
    {
      "providerId": "D1",
      "icdCode": "B00",
      "label": "Viral Infection",
      "primary": false,
      "status": "provisional"
    }
  ],
  "prescriptions": [
    {
      "prescriberId": "D1",
      "items": [
        {
          "medicine": "Paracetamol",
          "dose": "500 mg",
          "frequency": "2 times/day",
          "duration": "5 days"
        }
      ],
      "instructions": "Take after meals"
    },
    {
      "prescriberId": "D1",
      "items": [
        {
          "medicine": "Vitamin C",
          "dose": "1 tablet",
          "frequency": "once/day",
          "duration": "10 days"
        }
      ]
    }
  ]
}'

# Example with only diagnoses
DIAGNOSIS_ONLY_DATA='{
  "visitId": "your-visit-id",
  "diagnoses": [
    {
      "icdCode": "J06.9",
      "label": "Acute upper respiratory infection",
      "primary": true,
      "status": "confirmed",
      "notes": "Patient presents with typical symptoms"
    }
  ]
}'

# Example with only prescriptions
PRESCRIPTION_ONLY_DATA='{
  "visitId": "your-visit-id",
  "prescriptions": [
    {
      "items": [
        {
          "medicine": "Amoxicillin",
          "dose": "250 mg",
          "frequency": "3 times/day",
          "duration": "7 days"
        }
      ],
      "instructions": "Complete the full course even if feeling better"
    }
  ]
}'

echo "📤 Test Data (Full Details - Diagnoses + Prescriptions):"
echo "$FULL_DETAILS_DATA" | jq .

echo ""
echo "📤 Test Data (Diagnoses Only):"
echo "$DIAGNOSIS_ONLY_DATA" | jq .

echo ""
echo "📤 Test Data (Prescriptions Only):"
echo "$PRESCRIPTION_ONLY_DATA" | jq .

echo ""
echo "📡 Example cURL commands:"
echo ""
echo "🏥 Add Full Details (Diagnoses + Prescriptions):"
echo "curl -X POST \\"
echo "  $API_BASE_URL/patients/visits/details \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -d '$FULL_DETAILS_DATA'"

echo ""
echo "🩺 Add Diagnoses Only:"
echo "curl -X POST \\"
echo "  $API_BASE_URL/patients/visits/details \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -d '$DIAGNOSIS_ONLY_DATA'"

echo ""
echo "💊 Add Prescriptions Only:"
echo "curl -X POST \\"
echo "  $API_BASE_URL/patients/visits/details \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -d '$PRESCRIPTION_ONLY_DATA'"

echo ""
echo "✅ Expected Response (200 OK):"
cat << 'EOF'
{
  "success": true,
  "message": "Visit updated successfully",
  "data": {
    "diagnoses": [
      {
        "id": "diag-abc123",
        "visitId": "VISIT123",
        "providerId": "D1",
        "icdCode": "A00",
        "snomedId": "123456",
        "label": "Cholera",
        "primary": true,
        "confidence": 0.9,
        "status": "confirmed",
        "notes": "Strong symptoms",
        "createdAt": "2025-11-21T10:30:00.000Z"
      }
    ],
    "prescriptions": [
      {
        "id": "presc-def456",
        "visitId": "VISIT123",
        "prescriberId": "D1",
        "items": [
          {
            "medicine": "Paracetamol",
            "dose": "500 mg",
            "frequency": "2 times/day",
            "duration": "5 days"
          }
        ],
        "instructions": "Take after meals",
        "createdAt": "2025-11-21T10:30:00.000Z"
      }
    ]
  }
}
EOF

echo ""
echo "❌ Error Cases:"
echo "• 400 - Visit not found"
echo "• 400 - Validation errors (missing required fields)"
echo "• 400 - Invalid confidence values (must be 0-1)"
echo "• 400 - Missing both diagnoses and prescriptions"
echo "• 401 - Unauthorized (missing or invalid JWT token)"
echo "• 500 - Internal server error"

echo ""
echo "🔑 Required Setup:"
echo "1. Create a visit first using POST /patients/visits"
echo "2. Note the returned visitId from visit creation"
echo "3. Get a valid JWT token from login endpoint"
echo "4. Replace 'your-visit-id' with actual visit ID"
echo "5. Replace placeholder provider/prescriber IDs with valid user IDs"

echo ""
echo "📚 Swagger Documentation:"
echo "• Interactive API docs: http://localhost:3000/api-docs"
echo "• Find 'Visits' section"
echo "• Click 'POST /patients/visits/details' endpoint"
echo "• Use 'Try it out' button to test directly"

echo ""
echo "🩺 Diagnosis Fields:"
echo "• icdCode (required): ICD-10 diagnosis code"
echo "• label (required): Human-readable diagnosis name"
echo "• providerId (optional): ID of diagnosing provider"
echo "• snomedId (optional): SNOMED CT identifier"
echo "• primary (optional): Whether this is primary diagnosis"
echo "• confidence (optional): Confidence level 0.0-1.0"
echo "• status (optional): provisional | confirmed | ruled-out"
echo "• notes (optional): Additional notes (max 500 chars)"

echo ""
echo "💊 Prescription Fields:"
echo "• items (required): Array of medicine items"
echo "  - medicine (required): Medicine name"
echo "  - dose (required): Dosage amount"
echo "  - frequency (required): How often to take"
echo "  - duration (required): How long to take"
echo "• prescriberId (optional): ID of prescribing provider"
echo "• diagnosisId (optional): Related diagnosis ID"
echo "• instructions (optional): Additional instructions (max 1000 chars)"

echo ""
echo "🔄 Business Logic:"
echo "• Visit must exist before adding details"
echo "• At least one diagnosis OR prescription must be provided"
echo "• All operations performed in database transaction"
echo "• Prescription items stored as JSON"
echo "• Multiple diagnoses and prescriptions can be added in single call"

echo ""
echo "💾 Database Operations:"
echo "• Validates visit existence"
echo "• Bulk inserts diagnoses (if provided)"
echo "• Bulk inserts prescriptions (if provided)"
echo "• Uses transaction for data consistency"
echo "• Links all records to existing visit"

echo ""
echo "🎯 Use Cases:"
echo "• Doctor adds initial diagnosis after examination"
echo "• Doctor prescribes medications for treatment"
echo "• Adding secondary diagnoses discovered during treatment"
echo "• Updating prescriptions based on patient response"

echo ""
echo "📊 Related Endpoints:"
echo "• POST /patients/visits - Create initial visit"
echo "• GET /patients/visits/:id - Get visit with all details"
echo "• PUT /patients/visits/:id - Update visit information"

echo ""
echo "⚠️ Important Notes:"
echo "• This endpoint adds NEW diagnoses/prescriptions"
echo "• It does NOT update existing diagnoses/prescriptions"
echo "• Use separate update endpoints for modifying existing records"
echo "• Visit must be in OPEN or IN_PROGRESS state for adding details"