#!/bin/bash

# Patient Creation Test Script
echo "🧪 Testing Patient Creation"
echo "=========================="
echo ""

BASE_URL="http://localhost:3000"

# First, get authentication token
echo "1️⃣ Getting authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@1234"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  exit 1
fi

echo "✅ Token obtained successfully"
echo ""

# Test patient creation with your payload
echo "2️⃣ Testing Patient Creation..."
echo "POST $BASE_URL/api/v1/patients"
echo ""

# Testing with the exact payload you provided that was failing
PATIENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/patients" \
  -H "accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "01HW5BCKHXPVMRQ7XE8YVG82QJ",
    "clinicId": "01HW5BCKHXJ4MVBX6N9DWJ82QB",
    "type": "HUMAN",
    "age": 32,
    "sex": "MALE",
    "hasIdentifyingInfo": true,
    "address": {
      "address": "123 Main St",
      "town": "Springfield",
      "pin": "12345",
      "state": "IL",
      "district": "Sangamon",
      "countryName": "United States"
    },
    "person": {
      "fullName": "John Doe",
      "phone": "+1-555-0123",
      "email": "john.doe@example.com",
      "dateOfBirth": "1992-01-15",
      "sex": "MALE"
    }
  }')

echo "📋 Patient Creation Response:"
echo "$PATIENT_RESPONSE"
echo ""

# Check if creation was successful
if echo "$PATIENT_RESPONSE" | grep -q '"success": true'; then
  echo "✅ Patient created successfully!"
  
  # Extract patient ID for further testing
  PATIENT_ID=$(echo "$PATIENT_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  if [ ! -z "$PATIENT_ID" ]; then
    echo "📝 Patient ID: $PATIENT_ID"
    
    # Test getting the created patient
    echo ""
    echo "3️⃣ Testing Get Patient by ID..."
    GET_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/patients/$PATIENT_ID" \
      -H "accept: application/json" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "📋 Get Patient Response:"
    echo "$GET_RESPONSE"
  fi
  
else
  echo "❌ Patient creation failed!"
  
  # Show detailed error information
  if echo "$PATIENT_RESPONSE" | grep -q "error"; then
    echo ""
    echo "🔍 Error Details:"
    echo "$PATIENT_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4
  fi
fi

echo ""
echo "🎯 What was fixed in the validator:"
echo "1. Made clinicId required instead of optional"
echo "2. Made tenantId optional (can be derived from clinic)"
echo "3. Made pseudonymId optional (can be auto-generated)"
echo "4. Added support for both firstName/lastName and fullName in person"
echo "5. Added support for both ISO date and YYYY-MM-DD date format"
echo "6. Added proper geoLocation object structure"
echo "7. Added support for both gender and sex fields"