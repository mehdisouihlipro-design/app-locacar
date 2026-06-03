#!/bin/bash

# LocaCar API Test Script
# Tests authentication endpoints

API_URL="http://localhost:3001/api/v1"
EMAIL="test@locacar.com"
PASSWORD="TestPassword123!"

echo "========================================="
echo "LocaCar API Authentication Tests"
echo "========================================="
echo ""

# Test 1: Register
echo "1. Testing REGISTER endpoint"
echo "   POST $API_URL/auth/register"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"full_name\": \"Test User\"
  }")
echo "$REGISTER_RESPONSE" | jq . 2>/dev/null || echo "$REGISTER_RESPONSE"
echo ""

# Extract user ID from register response
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.data.id' 2>/dev/null)
if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
  echo "✓ User registered: $USER_ID"
else
  echo "✗ Failed to register user"
fi
echo ""

# Test 2: Login
echo "2. Testing LOGIN endpoint"
echo "   POST $API_URL/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\"
  }")
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token from login response
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token' 2>/dev/null)
if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "✓ Login successful, token obtained"
  echo "  Token (first 50 chars): ${TOKEN:0:50}..."
else
  echo "✗ Failed to login"
fi
echo ""

# Test 3: Get current user (with token)
if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "3. Testing GET /me endpoint (authenticated)"
  echo "   GET $API_URL/auth/me (with Authorization header)"
  ME_RESPONSE=$(curl -s -X GET "$API_URL/auth/me" \
    -H "Authorization: Bearer $TOKEN")
  echo "$ME_RESPONSE" | jq . 2>/dev/null || echo "$ME_RESPONSE"
  echo ""
else
  echo "3. Skipping GET /me test (no token available)"
  echo ""
fi

echo "========================================="
echo "Tests completed!"
echo "========================================="
