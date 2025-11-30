#!/bin/bash

# Test Master Data API
# This script tests all master data endpoints

API_BASE_URL="http://localhost:3000/api/v1"
JWT_TOKEN="your-jwt-token-here"

echo "🩺 Testing Master Data API..."
echo "==============================="

echo ""
echo "📝 Note: Replace 'your-jwt-token-here' with a valid JWT token from login"

echo ""
echo "1️⃣ Get Available Collections:"
echo "curl -X GET \"$API_BASE_URL/master\" \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

echo "Expected Response:"
cat << 'EOF'
{
  "success": true,
  "message": "Available master data collections retrieved successfully",
  "data": {
    "collections": [
      "human_disease_master",
      "account_types",
      "patient_types",
      "visit_types",
      "gender_options",
      "blood_groups",
      "marital_status"
    ],
    "count": 7
  }
}
EOF

echo ""
echo "2️⃣ Get Human Disease Master:"
echo "curl -X GET \"$API_BASE_URL/master/human_disease_master\" \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

echo "Expected Response (partial):"
cat << 'EOF'
{
  "success": true,
  "message": "human_disease_master master data retrieved successfully",
  "data": {
    "collection": "human_disease_master",
    "items": [
      {
        "value": "type_2_diabetes",
        "label": "Type 2 Diabetes Mellitus",
        "snomedId": "44054006",
        "icdCode": "E11",
        "diseaseType": "Metabolic",
        "metadata": {
          "commonSymptoms": [
            "Increased thirst (Polydipsia)",
            "Frequent urination (Polyuria)",
            "Fatigue",
            "Unexplained weight loss"
          ]
        }
      }
    ],
    "count": 53
  }
}
EOF

echo ""
echo "3️⃣ Get Account Types:"
echo "curl -X GET \"$API_BASE_URL/master/account_types\" \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

echo "Expected Response:"
cat << 'EOF'
{
  "success": true,
  "message": "account_types master data retrieved successfully",
  "data": {
    "collection": "account_types",
    "items": [
      {
        "value": "saving",
        "label": "Saving Account"
      },
      {
        "value": "current",
        "label": "Current Account"
      }
    ],
    "count": 4
  }
}
EOF

echo ""
echo "4️⃣ Search for Diabetes in Human Disease Master:"
echo "curl -X GET \"$API_BASE_URL/master/human_disease_master/search?q=diabetes\" \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

echo "Expected Response:"
cat << 'EOF'
{
  "success": true,
  "message": "Search results for 'diabetes' in human_disease_master",
  "data": {
    "collection": "human_disease_master",
    "items": [
      {
        "value": "type_2_diabetes",
        "label": "Type 2 Diabetes Mellitus",
        "snomedId": "44054006",
        "icdCode": "E11",
        "diseaseType": "Metabolic"
      }
    ],
    "count": 1
  }
}
EOF

echo ""
echo "5️⃣ Search for Cardiovascular diseases:"
echo "curl -X GET \"$API_BASE_URL/master/human_disease_master/search?q=cardiovascular\" \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

echo "6️⃣ Get Patient Types:"
echo "curl -X GET \"$API_BASE_URL/master/patient_types\" \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

echo "7️⃣ Get Blood Groups:"
echo "curl -X GET \"$API_BASE_URL/master/blood_groups\" \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

echo "8️⃣ Search for 'O' in Blood Groups:"
echo "curl -X GET \"$API_BASE_URL/master/blood_groups/search?q=O\" \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

echo "9️⃣ Test Invalid Collection:"
echo "curl -X GET \"$API_BASE_URL/master/invalid_collection\" \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

echo "Expected Error Response:"
cat << 'EOF'
{
  "success": false,
  "message": "Master data collection 'invalid_collection' not found"
}
EOF

echo ""
echo "🔟 Test Search without Query:"
echo "curl -X GET \"$API_BASE_URL/master/human_disease_master/search\" \\"
echo "  -H \"Authorization: Bearer \$JWT_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

echo "Expected Error Response:"
cat << 'EOF'
{
  "success": false,
  "message": "Search term is required"
}
EOF

echo ""
echo "📋 **Available Collections:**"
echo "• human_disease_master - Comprehensive list of human diseases with ICD-10, SNOMED CT codes"
echo "• account_types - Banking account types"
echo "• patient_types - Types of patients (human, pet, livestock)"
echo "• visit_types - Types of medical visits"
echo "• gender_options - Gender options"
echo "• blood_groups - Blood group types"
echo "• marital_status - Marital status options"

echo ""
echo "🔍 **Search Features:**"
echo "• Search by disease label (e.g., 'diabetes', 'cancer')"
echo "• Search by disease type (e.g., 'cardiovascular', 'respiratory')"
echo "• Search by ICD code (e.g., 'E11', 'I10')"
echo "• Search by symptoms (e.g., 'fatigue', 'headache')"

echo ""
echo "🩺 **Human Disease Master Features:**"
echo "• 53+ common diseases with complete medical information"
echo "• SNOMED CT identifiers for international compatibility"
echo "• ICD-10 codes for medical billing and records"
echo "• Disease type classification (Metabolic, Cardiovascular, etc.)"
echo "• Common symptoms for each disease"
echo "• Searchable across all fields"

echo ""
echo "📡 **Interactive Testing:**"
echo "• Swagger UI: http://localhost:3000/api-docs"
echo "• Look for 'Master Data' section"
echo "• Use 'Try it out' to test endpoints interactively"

echo ""
echo "🔑 **Authentication Required:**"
echo "• All endpoints require valid JWT token"
echo "• Get token from POST /api/v1/auth/login"
echo "• Include in Authorization header: 'Bearer <token>'"

echo ""
echo "✅ **Success Responses:**"
echo "• 200: Data retrieved successfully"
echo "• Standard response format with success, message, and data"
echo "• Count field shows number of items returned"

echo ""
echo "❌ **Error Responses:**"
echo "• 400: Invalid collection name or missing search term"
echo "• 401: Missing or invalid JWT token"
echo "• 404: Collection not found"
echo "• 500: Internal server error"

echo ""
echo "💡 **Usage Tips:**"
echo "• Use /master endpoint first to see all available collections"
echo "• Search is case-insensitive and matches partial terms"
echo "• All responses include item count for frontend pagination"
echo "• Disease data includes rich metadata for clinical applications"

echo ""
echo "🎯 **Use Cases:**"
echo "• Populate dropdown menus in frontend"
echo "• Medical diagnosis autocomplete"
echo "• Patient registration forms"
echo "• Clinical data entry systems"
echo "• Medical billing applications"
echo "• Healthcare analytics and reporting"

echo ""
echo "🚀 **Performance:**"
echo "• In-memory data storage for fast response times"
echo "• No database queries required"
echo "• Optimized search across multiple fields"
echo "• Consistent response format across all endpoints"

echo ""
echo "🔄 **Next Steps:**"
echo "1. Get your JWT token from login endpoint"
echo "2. Test /master to see available collections"
echo "3. Try human_disease_master for comprehensive disease data"
echo "4. Use search endpoints to find specific items"
echo "5. Integrate with your frontend application"

echo ""
echo "📚 **Documentation:**"
echo "• Complete Swagger documentation available"
echo "• Each endpoint includes example requests/responses"
echo "• Schema definitions for all data structures"
echo "• Interactive testing environment"

echo ""
echo "🎊 Master Data API Testing Guide Complete!"
echo "Visit http://localhost:3000/api-docs for interactive testing!"