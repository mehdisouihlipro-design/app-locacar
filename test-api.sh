#!/bin/bash
# API Testing Script for LocaCar Backend
# This script tests the authentication and cars endpoints

API_URL="http://localhost:3001/api/v1"
ADMIN_EMAIL="admin@locacar.test"
ADMIN_PASSWORD="SecurePassword123!"

echo "=========================================="
echo "LocaCar API Testing Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. HEALTH CHECK
echo -e "${YELLOW}1. Health Check${NC}"
curl -s "$API_URL/health" | jq . 2>/dev/null || echo "Server not responding - make sure it's running on port 3001"
echo ""

# 2. REGISTER ADMIN USER
echo -e "${YELLOW}2. Register Admin User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"full_name\": \"Admin User\",
    \"role\": \"admin\"
  }")

echo "$REGISTER_RESPONSE" | jq .
echo ""

# 3. LOGIN AND GET TOKEN
echo -e "${YELLOW}3. Login and Get JWT Token${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\"
  }")

echo "$LOGIN_RESPONSE" | jq .
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo -e "${RED}Failed to get token!${NC}"
  exit 1
fi

echo -e "${GREEN}Token received: ${TOKEN:0:20}...${NC}"
echo ""

# 4. GET CURRENT USER INFO
echo -e "${YELLOW}4. Get Current User Info${NC}"
curl -s "$API_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 5. GET ALL CARS (EMPTY)
echo -e "${YELLOW}5. Get All Cars (should be empty)${NC}"
curl -s "$API_URL/cars" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 6. CREATE A CAR
echo -e "${YELLOW}6. Create a Test Car${NC}"
CAR_RESPONSE=$(curl -s -X POST "$API_URL/cars" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plate": "TUN-2024-001",
    "model": "BMW 320i",
    "brand": "BMW",
    "vin": "WBABC1234567890",
    "registration_number": "123456",
    "fuel_type": "Diesel",
    "color": "Black",
    "purchase_price": 25000,
    "location": "Tunis",
    "status": "disponible",
    "notes": "Test car"
  }')

echo "$CAR_RESPONSE" | jq .
CAR_ID=$(echo "$CAR_RESPONSE" | jq -r '.data.id' 2>/dev/null)
echo -e "${GREEN}Car ID: $CAR_ID${NC}"
echo ""

# 7. GET CAR BY ID
echo -e "${YELLOW}7. Get Car by ID${NC}"
curl -s "$API_URL/cars/$CAR_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 8. UPDATE CAR
echo -e "${YELLOW}8. Update Car${NC}"
curl -s -X PUT "$API_URL/cars/$CAR_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "location": "Sfax",
    "status": "location"
  }' | jq .
echo ""

# 9. CREATE ANOTHER CAR
echo -e "${YELLOW}9. Create Second Car${NC}"
CAR_RESPONSE_2=$(curl -s -X POST "$API_URL/cars" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plate": "TUN-2024-002",
    "model": "Mercedes C-Class",
    "brand": "Mercedes",
    "fuel_type": "Gasoline",
    "color": "Silver",
    "location": "Sousse",
    "status": "disponible"
  }')

echo "$CAR_RESPONSE_2" | jq .
CAR_ID_2=$(echo "$CAR_RESPONSE_2" | jq -r '.data.id' 2>/dev/null)
echo ""

# 10. GET ALL CARS WITH PAGINATION
echo -e "${YELLOW}10. Get All Cars (with pagination)${NC}"
curl -s "$API_URL/cars?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 11. SEARCH CARS
echo -e "${YELLOW}11. Search Cars by Plate${NC}"
curl -s "$API_URL/cars/search/TUN" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 12. UPDATE GPS LOCATION
echo -e "${YELLOW}12. Update GPS Location${NC}"
curl -s -X PATCH "$API_URL/cars/$CAR_ID/gps" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "gps_lat": 36.8065,
    "gps_lng": 10.1956,
    "gps_speed": 45
  }' | jq .
echo ""

# 13. DELETE CAR
echo -e "${YELLOW}13. Delete First Car${NC}"
curl -s -X DELETE "$API_URL/cars/$CAR_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 14. GET REMAINING CARS
echo -e "${YELLOW}14. Get Remaining Cars${NC}"
curl -s "$API_URL/cars" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo -e "${GREEN}=========================================="
echo "Testing Complete!"
echo "==========================================${NC}"
