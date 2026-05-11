#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8080/api"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Testing Real Estate Management API${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: Test endpoint
echo -e "${GREEN}Test 1: Test Auth Endpoint${NC}"
curl -s -X GET "$BASE_URL/auth/test" | jq '.'
echo ""
echo ""

# Test 2: Register Admin
echo -e "${GREEN}Test 2: Register Admin User${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "123456",
    "fullName": "Admin Test",
    "phone": "0123456789",
    "role": "admin"
  }')
echo "$REGISTER_RESPONSE" | jq '.'
echo ""
echo ""

# Test 3: Login
echo -e "${GREEN}Test 3: Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "123456"
  }')
echo "$LOGIN_RESPONSE" | jq '.'

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.token')
echo ""
echo -e "${BLUE}Token: $TOKEN${NC}"
echo ""
echo ""

# Test 4: Get Properties (Public)
echo -e "${GREEN}Test 4: Get Properties List (Public)${NC}"
curl -s -X GET "$BASE_URL/properties?page=0&size=5" | jq '.'
echo ""
echo ""

# Test 5: Create Property (with token)
echo -e "${GREEN}Test 5: Create New Property (Admin)${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/properties" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Căn hộ test API",
    "description": "Căn hộ được tạo từ test script",
    "propertyType": "apartment",
    "province": "Hà Nội",
    "district": "Cầu Giấy",
    "area": 75.5,
    "price": 3500000000,
    "images": [
      {
        "url": "https://picsum.photos/800/600?random=100",
        "isPrimary": true
      },
      {
        "url": "https://picsum.photos/800/600?random=101",
        "isPrimary": false
      }
    ]
  }')
echo "$CREATE_RESPONSE" | jq '.'

# Extract property ID
PROPERTY_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.propertyId')
echo ""
echo -e "${BLUE}Created Property ID: $PROPERTY_ID${NC}"
echo ""
echo ""

# Test 6: Get Property Detail
if [ "$PROPERTY_ID" != "null" ]; then
  echo -e "${GREEN}Test 6: Get Property Detail${NC}"
  curl -s -X GET "$BASE_URL/properties/$PROPERTY_ID" | jq '.'
  echo ""
  echo ""
fi

# Test 7: Search Properties
echo -e "${GREEN}Test 7: Search Properties (by province)${NC}"
curl -s -X GET "$BASE_URL/properties?province=Hà%20Nội&page=0&size=5" | jq '.'
echo ""
echo ""

# Test 8: Register Broker
echo -e "${GREEN}Test 8: Register Broker User${NC}"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "broker@test.com",
    "password": "123456",
    "fullName": "Broker Test",
    "phone": "0987654321",
    "role": "broker"
  }' | jq '.'
echo ""
echo ""

# Test 9: Register Customer
echo -e "${GREEN}Test 9: Register Customer User${NC}"
curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@test.com",
    "password": "123456",
    "fullName": "Customer Test",
    "phone": "0909123456",
    "role": "customer"
  }' | jq '.'
echo ""
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}All Tests Completed!${NC}"
echo -e "${BLUE}========================================${NC}"
