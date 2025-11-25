#!/bin/bash

# Test script for the enhanced visit details API with lab orders
# This tests the /api/v1/patients/visits/details endpoint with lab orders

BASE_URL="http://localhost:3000/api/v1"

echo "Testing Enhanced Visit Details API with Lab Orders..."
echo "=============================================================="

# Check if TOKEN environment variable is set
if [ -z "$TOKEN" ]; then
    echo "❌ ERROR: TOKEN environment variable is not set"
    echo "Please set the TOKEN variable first:"
    echo 'export TOKEN="your-jwt-token-here"'
    exit 1
fi

echo "✅ Using JWT Token: ${TOKEN:0:50}..."
echo ""

# Test 1: Add only lab orders to a visit
echo "🔬 Test 1: Adding only lab orders to a visit"
echo "================================================"

LAB_ORDERS_PAYLOAD='{
  "visitId": "visit-test-123",
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
      "notes": "Routine checkup labs"
    },
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
      "notes": "Follow-up from previous visit"
    }
  ]
}'

echo "📤 Request payload:"
echo "$LAB_ORDERS_PAYLOAD" | jq '.'
echo ""

curl -s -X POST \
  "${BASE_URL}/patients/visits/details" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$LAB_ORDERS_PAYLOAD" | jq '.'

echo ""
echo "================================================"

# Test 2: Add diagnoses, prescriptions, and lab orders together
echo "🏥 Test 2: Adding diagnoses, prescriptions, and lab orders together"
echo "=================================================================="

FULL_PAYLOAD='{
  "visitId": "visit-test-456",
  "diagnoses": [
    {
      "providerId": "doctor-123",
      "icdCode": "R50.9",
      "snomedId": "386661006",
      "label": "Fever",
      "primary": true,
      "confidence": 0.9,
      "status": "confirmed",
      "notes": "High fever with chills"
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
        },
        {
          "medicine": "Azithromycin",
          "dose": "250 mg",
          "frequency": "once/day",
          "duration": "3 days"
        }
      ],
      "instructions": "Take after meals. Complete the full course of antibiotics."
    }
  ],
  "labOrders": [
    {
      "tests": [
        {
          "testName": "Complete Blood Count with Differential",
          "testCode": "CBC-DIFF",
          "category": "Hematology",
          "instructions": "Collect in EDTA tube"
        },
        {
          "testName": "C-Reactive Protein",
          "testCode": "CRP",
          "category": "Immunology",
          "instructions": "Fasting not required"
        },
        {
          "testName": "Blood Culture",
          "testCode": "BC",
          "category": "Microbiology",
          "instructions": "Collect before antibiotic administration"
        }
      ],
      "status": "PENDING",
      "notes": "URGENT - Suspected bacterial infection"
    }
  ]
}'

echo "📤 Request payload:"
echo "$FULL_PAYLOAD" | jq '.'
echo ""

curl -s -X POST \
  "${BASE_URL}/patients/visits/details" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$FULL_PAYLOAD" | jq '.'

echo ""
echo "=================================================================="

# Test 3: Test validation - empty request
echo "❌ Test 3: Testing validation with empty request"
echo "================================================="

EMPTY_PAYLOAD='{
  "visitId": "visit-test-789"
}'

echo "📤 Request payload:"
echo "$EMPTY_PAYLOAD" | jq '.'
echo ""

curl -s -X POST \
  "${BASE_URL}/patients/visits/details" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$EMPTY_PAYLOAD" | jq '.'

echo ""
echo "================================================="

# Test 4: Test validation - invalid lab order structure
echo "❌ Test 4: Testing validation with invalid lab order"
echo "===================================================="

INVALID_PAYLOAD='{
  "visitId": "visit-test-999",
  "labOrders": [
    {
      "tests": [
        {
          "category": "Hematology",
          "instructions": "Missing testName - should fail validation"
        }
      ],
      "status": "INVALID_STATUS"
    }
  ]
}'

echo "📤 Request payload:"
echo "$INVALID_PAYLOAD" | jq '.'
echo ""

curl -s -X POST \
  "${BASE_URL}/patients/visits/details" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$INVALID_PAYLOAD" | jq '.'

echo ""
echo "===================================================="
echo "✅ All tests completed!"
echo ""
echo "Expected behaviors:"
echo "- Test 1: Should succeed and return lab orders data"
echo "- Test 2: Should succeed and return all three types of data"
echo "- Test 3: Should fail with validation error (no data provided)"
echo "- Test 4: Should fail with validation error (missing required fields)"
echo ""
echo "Note: Visit IDs used in tests may not exist in your database."
echo "Adjust visit IDs to match existing visits for successful testing."