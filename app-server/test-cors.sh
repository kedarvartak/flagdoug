#!/bin/bash

# CORS and Security Testing Script
# This script tests the CORS and security headers configuration
# Prerequisites: Server must be running on http://localhost:3000

echo "=========================================="
echo "CORS and Security Configuration Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "Checking if server is running..."
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${RED}✗ Server is not running on http://localhost:3000${NC}"
    echo "Please start the server with: npm run start:dev"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Test 1: CORS Headers with Allowed Origin
echo "Test 1: CORS Headers with Allowed Origin"
echo "----------------------------------------"
RESPONSE=$(curl -s -i -X GET http://localhost:3000/health \
  -H "Origin: http://localhost:5173" 2>&1)

if echo "$RESPONSE" | grep -q "access-control-allow-origin: http://localhost:5173"; then
    echo -e "${GREEN}✓ CORS origin header present${NC}"
else
    echo -e "${RED}✗ CORS origin header missing${NC}"
fi

if echo "$RESPONSE" | grep -q "access-control-allow-credentials: true"; then
    echo -e "${GREEN}✓ CORS credentials header present${NC}"
else
    echo -e "${RED}✗ CORS credentials header missing${NC}"
fi
echo ""

# Test 2: Preflight OPTIONS Request
echo "Test 2: Preflight OPTIONS Request"
echo "----------------------------------------"
RESPONSE=$(curl -s -i -X OPTIONS http://localhost:3000/api/flags \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" 2>&1)

if echo "$RESPONSE" | grep -q "HTTP/.*204"; then
    echo -e "${GREEN}✓ Preflight returns 204 status${NC}"
else
    echo -e "${RED}✗ Preflight did not return 204 status${NC}"
fi

if echo "$RESPONSE" | grep -q "access-control-allow-methods:.*POST"; then
    echo -e "${GREEN}✓ POST method allowed${NC}"
else
    echo -e "${RED}✗ POST method not allowed${NC}"
fi

if echo "$RESPONSE" | grep -q "access-control-max-age: 3600"; then
    echo -e "${GREEN}✓ Max age set to 3600${NC}"
else
    echo -e "${RED}✗ Max age not set correctly${NC}"
fi
echo ""

# Test 3: Security Headers (Helmet)
echo "Test 3: Security Headers (Helmet)"
echo "----------------------------------------"
RESPONSE=$(curl -s -i -X GET http://localhost:3000/health 2>&1)

if echo "$RESPONSE" | grep -qi "x-content-type-options: nosniff"; then
    echo -e "${GREEN}✓ X-Content-Type-Options header present${NC}"
else
    echo -e "${RED}✗ X-Content-Type-Options header missing${NC}"
fi

if echo "$RESPONSE" | grep -qi "x-frame-options"; then
    echo -e "${GREEN}✓ X-Frame-Options header present${NC}"
else
    echo -e "${RED}✗ X-Frame-Options header missing${NC}"
fi

if echo "$RESPONSE" | grep -qi "strict-transport-security"; then
    echo -e "${GREEN}✓ Strict-Transport-Security header present${NC}"
else
    echo -e "${RED}✗ Strict-Transport-Security header missing${NC}"
fi

if echo "$RESPONSE" | grep -qi "content-security-policy"; then
    echo -e "${GREEN}✓ Content-Security-Policy header present${NC}"
else
    echo -e "${RED}✗ Content-Security-Policy header missing${NC}"
fi
echo ""

# Test 4: Request Logging
echo "Test 4: Request Logging"
echo "----------------------------------------"
echo -e "${YELLOW}ℹ Check server console for log entries:${NC}"
echo "  - Incoming Request: GET /health"
echo "  - Outgoing Response: GET /health - Status: 200"
echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "All tests completed. Check results above."
echo ""
echo "For detailed testing instructions, see:"
echo "  app-server/CORS_TESTING_GUIDE.md"
