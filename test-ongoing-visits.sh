#!/bin/bash

# Test script for the ongoing visits API endpoint
# Make sure the server is running before executing this script

BASE_URL="http://localhost:3000/api/v1"
CLINIC_ID="clinic-456"

echo "Testing Ongoing Visits API..."
echo "========================================="

# Check if TOKEN environment variable is set
if [ -z "$TOKEN" ]; then
    echo "❌ ERROR: TOKEN environment variable is not set"
    echo "Please set the TOKEN variable first:"
    echo 'export TOKEN="your-jwt-token-here"'
    exit 1
fi

echo "✅ Using JWT Token: ${TOKEN:0:50}..."
echo ""

# Test the ongoing visits endpoint
echo "🔄 Testing GET ${BASE_URL}/patients/visits/clinic/${CLINIC_ID}/ongoing"
echo ""

curl -s -X GET \
  "${BASE_URL}/patients/visits/clinic/${CLINIC_ID}/ongoing" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "========================================="
echo "✅ Test completed!"
echo ""
echo "Expected response format:"
echo "{"
echo "  \"success\": true,"
echo "  \"message\": \"Ongoing visits retrieved successfully\","
echo "  \"data\": ["
echo "    {"
echo "      \"id\": \"visit-id\","
echo "      \"tenantId\": \"tenant-id\","
echo "      \"clinicId\": \"clinic-id\","
echo "      \"patientId\": \"patient-id\","
echo "      \"visitType\": \"CLINIC\","
echo "      \"startedAt\": \"2025-11-22T10:30:00.000Z\","
echo "      \"endedAt\": null,"
echo "      \"symptoms\": \"symptoms description\","
echo "      \"vitals\": { \"temperature\": 98.6, \"pulse\": 72 },"
echo "      \"workflowState\": \"OPEN\","
echo "      \"patient\": { ... },"
echo "      \"doctor\": { ... },"
echo "      \"clinic\": { ... }"
echo "    }"
echo "  ]"
echo "}"