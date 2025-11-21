#!/bin/bash

# OneHealth API Testing Script
echo "🧪 OneHealth API Testing"
echo "======================="
echo ""

BASE_URL="http://localhost:3000"

echo "1️⃣ Testing Super Admin Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@1234"
  }')

echo "Login Response: $LOGIN_RESPONSE"
echo ""

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token. Please check if:"
  echo "   - Server is running on port 3000"
  echo "   - Super admin user was created"
  echo "   - Login endpoint is working"
  exit 1
fi

echo "✅ Token received: ${TOKEN:0:50}..."
echo ""

echo "2️⃣ Testing Clinic Creation..."
echo "POST $BASE_URL/api/v1/clinics"
CLINIC_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/clinics" \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test API Clinic",
    "clinicType": "HUMAN",
    "isActive": true,
    "phone": "9876543210",
    "email": "test@clinic.com",
    "address": {
      "address": "123 Test Street",
      "townCode": "T001",
      "town": "Test Town",
      "pin": "123456",
      "subDistrictCode": "SD001",
      "subDistrict": "Test SubDistrict",
      "districtCode": "D001",
      "district": "Test District",
      "stateCode": "TS",
      "state": "Test State",
      "countryId": "IN",
      "countryName": "India",
      "geoLocation": {
        "lat": 18.5204,
        "lng": 73.8567
      }
    }
  }')

echo "Clinic Response: $CLINIC_RESPONSE"
echo ""

if echo "$CLINIC_RESPONSE" | grep -q "success.*true"; then
  echo "✅ Clinic creation successful!"
else
  echo "❌ Clinic creation failed!"
fi

echo ""
echo "3️⃣ Testing Get All Clinics..."
echo "GET $BASE_URL/api/v1/clinics"
GET_CLINICS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/clinics" \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Get Clinics Response: $GET_CLINICS_RESPONSE"
echo ""

echo "4️⃣ Testing Get All Menus..."
echo "GET $BASE_URL/api/v1/menus"
GET_MENUS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/menus" \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Get Menus Response: $GET_MENUS_RESPONSE"
echo ""

echo "5️⃣ Testing Get All Roles..."
echo "GET $BASE_URL/api/v1/roles"
GET_ROLES_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/roles" \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Get Roles Response: $GET_ROLES_RESPONSE"
echo ""

echo "6️⃣ Available Endpoints Summary:"
echo "================================"
echo "✅ POST /api/v1/auth/login"
echo "✅ POST /api/v1/clinics"
echo "✅ GET  /api/v1/clinics"
echo "✅ POST /api/v1/patients" 
echo "✅ GET  /api/v1/patients"
echo "✅ POST /api/v1/menus"
echo "✅ GET  /api/v1/menus"
echo "✅ POST /api/v1/roles"
echo "✅ GET  /api/v1/roles"
echo "✅ GET  /api/v1/users"
echo ""
echo "📚 Swagger UI: $BASE_URL/api-docs"
echo ""

echo "🎯 Your corrected curl command:"
echo "curl -X POST 'http://localhost:3000/api/v1/clinics' \\"
echo "  -H 'accept: application/json' \\"
echo "  -H 'Authorization: Bearer $TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{ \"name\": \"Your Clinic Name\", \"clinicType\": \"HUMAN\" }'"