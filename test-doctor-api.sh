#!/bin/bash

# Example script to test Doctor creation API
# Run this after starting the server: npm start

API_BASE="http://localhost:3000/api/v1"

echo "🏥 OneHealth Doctor Creation API Test"
echo "======================================"

# You would need to replace these with actual values from your database
TENANT_ID="your_tenant_id_here"
CLINIC_ID="your_clinic_id_here"

# Test Doctor Creation
echo ""
echo "📋 Creating a new Doctor..."
echo ""

curl -X POST "$API_BASE/clinics/doctors" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "firstName": "Dr. John",
    "lastName": "Smith",
    "middleName": "Michael",
    "phone": "+1234567890",
    "email": "dr.john.smith@example.com",
    "username": "drjohnsmith",
    "password": "SecurePass123!",
    "clinicId": "'$CLINIC_ID'",
    "tenantId": "'$TENANT_ID'",
    "sex": "MALE",
    "dateOfBirth": "1985-06-15",
    "address": "123 Medical Center Drive, Health City, HC 12345",
    "externalId": "DOC001",
    "signatureUrl": "https://example.com/signatures/drsmith.png",
    "profileImageUrl": "https://example.com/photos/drsmith.jpg"
  }'

echo ""
echo ""
echo "✅ Doctor creation request completed!"
echo ""
echo "📋 Example responses:"
echo ""
echo "🔥 Success Response (201):"
echo "{"
echo '  "success": true,'
echo '  "data": {'
echo '    "success": true,'
echo '    "message": "Doctor created successfully",'
echo '    "userId": "cuid_user_id",'
echo '    "personId": "cuid_person_id"'
echo '  }'
echo "}"
echo ""
echo "❌ Error Response (400):"
echo "{"
echo '  "success": false,'
echo '  "error": "Username already exists"'
echo "}"
echo ""
echo "📌 Available API Endpoints:"
echo "  POST   $API_BASE/clinics/doctors              - Create doctor"
echo "  GET    $API_BASE/clinics/doctors              - Get all doctors"
echo "  GET    $API_BASE/clinics/doctors/{id}         - Get doctor by ID"
echo "  GET    $API_BASE/clinics/{clinicId}/doctors   - Get doctors by clinic"
echo ""
echo "🔧 Required Headers:"
echo "  Content-Type: application/json"
echo "  Authorization: Bearer {your_jwt_token}"