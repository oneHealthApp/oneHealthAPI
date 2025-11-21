#!/bin/bash

# Test script for Staff User Creation API
# This script tests the POST /users/staff endpoint

API_BASE_URL="http://localhost:3000/api/v1"

echo "🧪 Testing Staff User Creation API..."
echo "=================================="

# First, we need to login to get access token (assuming you have existing user)
echo "📝 Note: You need to provide a valid JWT token to test this endpoint"
echo "💡 Use your login endpoint to get the token first"

# Example test data
TEST_DATA='{
  "tenantId": "your-tenant-id",
  "clinicId": "your-clinic-id", 
  "name": "John Doe",
  "phoneNumber": "1234567890",
  "email": "john.doe@example.com",
  "username": "johndoe_staff",
  "password": "SecurePass123!",
  "sex": "MALE",
  "roleId": "your-staff-role-id"
}'

echo "📤 Test Data:"
echo "$TEST_DATA" | jq .

echo ""
echo "📡 Example cURL command:"
echo "curl -X POST \\"
echo "  $API_BASE_URL/users/staff \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  -d '$TEST_DATA'"

echo ""
echo "✅ Expected Response (201):"
cat << 'EOF'
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "generated-user-id",
      "username": "johndoe_staff",
      "emailId": "john.doe@example.com",
      "mobileNumber": "1234567890",
      "tenantId": "your-tenant-id",
      "personId": "generated-person-id",
      "createdAt": "2025-11-21T..."
    },
    "person": {
      "id": "generated-person-id",
      "tenantId": "your-tenant-id",
      "type": "USER",
      "fullName": "John Doe",
      "phone": "1234567890",
      "email": "john.doe@example.com",
      "sex": "MALE",
      "createdAt": "2025-11-21T..."
    },
    "userRole": {
      "id": "generated-user-role-id",
      "userId": "generated-user-id",
      "roleId": "your-staff-role-id",
      "priority": 1
    },
    "userClinic": {
      "id": "generated-user-clinic-id",
      "userId": "generated-user-id",
      "clinicId": "your-clinic-id",
      "roleInClinic": "STAFF"
    }
  }
}
EOF

echo ""
echo "❌ Error Cases:"
echo "• 400 - Validation errors (missing fields, invalid email/phone format)"
echo "• 409 - Conflict (username, email, or phone already exists)"
echo "• 401 - Unauthorized (missing or invalid JWT token)"
echo "• 500 - Internal server error"

echo ""
echo "🔑 Required Setup:"
echo "1. Ensure you have a valid Tenant record"
echo "2. Ensure you have a valid Clinic record"
echo "3. Ensure you have a Role with roleName='STAFF' (for Person creation)"
echo "4. Get a valid JWT token from login endpoint"
echo "5. Replace placeholder values in the test data"

echo ""
echo "📚 Swagger Documentation:"
echo "• Interactive API docs: http://localhost:3000/api-docs"
echo "• Find 'Staff Management' section"
echo "• Click 'POST /users/staff' endpoint"
echo "• Use 'Try it out' button to test directly"
echo "• Comprehensive request/response examples included"
echo "• Built-in JWT token management"

echo ""
echo "💾 Database Changes:"
echo "• Creates User record with hashed password"
echo "• Creates Person record (only if role is 'STAFF')"
echo "• Creates UserRole linking user to role"
echo "• Creates UserClinic linking user to clinic"
echo "• All operations are wrapped in a transaction for data consistency"