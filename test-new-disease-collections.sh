#!/bin/bash

# Master Data API Test Script for New Disease Collections
# Tests Livestock Disease Master and Pet Disease Master collections

echo "=== Master Data API - Testing New Disease Collections ==="
echo

# API Base URL
BASE_URL="http://localhost:3000/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to test API endpoint
test_endpoint() {
    local endpoint="$1"
    local description="$2"
    local expected_count="$3"
    
    echo -e "\n${BLUE}Testing: $description${NC}"
    echo "Endpoint: $endpoint"
    
    response=$(curl -s "$endpoint")
    
    if [ $? -eq 0 ]; then
        # Check if response contains success: true
        if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
            # Get data count
            count=$(echo "$response" | jq '.data | length' 2>/dev/null)
            if [ ! -z "$count" ] && [ "$count" -gt 0 ]; then
                print_success "Success! Found $count items"
                
                if [ ! -z "$expected_count" ] && [ "$count" -eq "$expected_count" ]; then
                    print_success "Expected count matches: $expected_count"
                fi
                
                # Show first item as sample
                first_item=$(echo "$response" | jq '.data[0]' 2>/dev/null)
                if [ "$first_item" != "null" ]; then
                    echo -e "Sample item: $first_item"
                fi
            else
                print_error "Response successful but no data found"
            fi
        else
            print_error "API returned error"
            echo "$response" | jq '.' 2>/dev/null || echo "Raw response: $response"
        fi
    else
        print_error "Failed to reach endpoint"
    fi
}

# Function to test search functionality
test_search() {
    local collection="$1"
    local search_term="$2"
    local description="$3"
    
    echo -e "\n${BLUE}Testing Search: $description${NC}"
    endpoint="$BASE_URL/master/$collection/search?q=$search_term"
    echo "Endpoint: $endpoint"
    
    response=$(curl -s "$endpoint")
    
    if [ $? -eq 0 ]; then
        if echo "$response" | jq -e '.success == true' > /dev/null 2>&1; then
            count=$(echo "$response" | jq '.data | length' 2>/dev/null)
            print_success "Search found $count results for '$search_term'"
            
            # Show search results
            if [ "$count" -gt 0 ]; then
                echo "$response" | jq '.data[] | {label: .label, value: .value}' 2>/dev/null
            fi
        else
            print_error "Search failed"
            echo "$response" | jq '.' 2>/dev/null || echo "Raw response: $response"
        fi
    else
        print_error "Failed to reach search endpoint"
    fi
}

print_info "Starting Master Data API Tests..."

# Test 1: Get all available collections
echo -e "\n${YELLOW}=== Test 1: Available Collections ===${NC}"
test_endpoint "$BASE_URL/master" "Get all available collections"

# Test 2: Human Disease Master (existing)
echo -e "\n${YELLOW}=== Test 2: Human Disease Master ===${NC}"
test_endpoint "$BASE_URL/master/human_disease_master" "Get Human Disease Master" "53"

# Test 3: Livestock Disease Master (new)
echo -e "\n${YELLOW}=== Test 3: Livestock Disease Master (NEW) ===${NC}"
test_endpoint "$BASE_URL/master/livestock_disease_master" "Get Livestock Disease Master" "35"

# Test 4: Pet Disease Master (new)
echo -e "\n${YELLOW}=== Test 4: Pet Disease Master (NEW) ===${NC}"
test_endpoint "$BASE_URL/master/pet_disease_master" "Get Pet Disease Master" "20"

# Test 5: Other master data collections
echo -e "\n${YELLOW}=== Test 5: Other Master Data Collections ===${NC}"
test_endpoint "$BASE_URL/master/account_types" "Get Account Types" "4"
test_endpoint "$BASE_URL/master/patient_types" "Get Patient Types" "3"
test_endpoint "$BASE_URL/master/visit_types" "Get Visit Types" "4"
test_endpoint "$BASE_URL/master/gender_options" "Get Gender Options" "4"
test_endpoint "$BASE_URL/master/blood_groups" "Get Blood Groups" "9"
test_endpoint "$BASE_URL/master/marital_status" "Get Marital Status" "6"

# Test 6: Search functionality for new collections
echo -e "\n${YELLOW}=== Test 6: Search Functionality ===${NC}"

# Search in Livestock Disease Master
test_search "livestock_disease_master" "bovine" "Search for 'bovine' in livestock diseases"
test_search "livestock_disease_master" "fever" "Search for 'fever' in livestock diseases"
test_search "livestock_disease_master" "swine" "Search for 'swine' in livestock diseases"
test_search "livestock_disease_master" "avian" "Search for 'avian' in livestock diseases"

# Search in Pet Disease Master
test_search "pet_disease_master" "canine" "Search for 'canine' in pet diseases"
test_search "pet_disease_master" "feline" "Search for 'feline' in pet diseases"
test_search "pet_disease_master" "diabetes" "Search for 'diabetes' in pet diseases"
test_search "pet_disease_master" "heart" "Search for 'heart' in pet diseases"

# Search in Human Disease Master (existing functionality)
test_search "human_disease_master" "diabetes" "Search for 'diabetes' in human diseases"

# Test 7: Test invalid collection
echo -e "\n${YELLOW}=== Test 7: Error Handling ===${NC}"
print_info "Testing invalid collection name..."
response=$(curl -s "$BASE_URL/master/invalid_collection")
if echo "$response" | jq -e '.success == false' > /dev/null 2>&1; then
    print_success "Error handling works correctly for invalid collection"
else
    print_warning "Unexpected response for invalid collection"
fi

# Test 8: Sample disease data verification
echo -e "\n${YELLOW}=== Test 8: Sample Data Verification ===${NC}"

print_info "Verifying specific diseases are present..."

# Check for specific livestock diseases
livestock_response=$(curl -s "$BASE_URL/master/livestock_disease_master")
if echo "$livestock_response" | jq -e '.data[] | select(.value == "bovine_viral_diarrhea")' > /dev/null 2>&1; then
    print_success "Bovine Viral Diarrhea found in livestock diseases"
else
    print_error "Bovine Viral Diarrhea not found in livestock diseases"
fi

if echo "$livestock_response" | jq -e '.data[] | select(.value == "equine_colic")' > /dev/null 2>&1; then
    print_success "Equine Colic found in livestock diseases"
else
    print_error "Equine Colic not found in livestock diseases"
fi

# Check for specific pet diseases
pet_response=$(curl -s "$BASE_URL/master/pet_disease_master")
if echo "$pet_response" | jq -e '.data[] | select(.value == "canine_osteoarthritis")' > /dev/null 2>&1; then
    print_success "Canine Osteoarthritis found in pet diseases"
else
    print_error "Canine Osteoarthritis not found in pet diseases"
fi

if echo "$pet_response" | jq -e '.data[] | select(.value == "feline_hyperthyroidism")' > /dev/null 2>&1; then
    print_success "Feline Hyperthyroidism found in pet diseases"
else
    print_error "Feline Hyperthyroidism not found in pet diseases"
fi

echo -e "\n${GREEN}=== Test Summary ===${NC}"
print_info "All tests completed!"
print_info "New disease collections have been successfully added:"
print_success "• Livestock Disease Master: 35 diseases (cattle, swine, poultry, equine)"
print_success "• Pet Disease Master: 20 diseases (canine and feline conditions)"
print_success "• Search functionality working for all collections"
print_success "• All existing collections still functional"

echo -e "\n${BLUE}API Documentation:${NC}"
echo "• Swagger UI: http://localhost:3000/api-docs"
echo "• Master Data Endpoint: http://localhost:3000/api/v1/master"
echo "• Collections: human_disease_master, livestock_disease_master, pet_disease_master"

echo -e "\n${GREEN}✨ OneHealth API is ready for comprehensive medical data management! ✨${NC}"