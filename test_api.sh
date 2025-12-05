#!/bin/bash

echo "=== Testing HealthTrack API ==="
echo

echo "1. Testing health endpoint:"
curl -s http://localhost:3000/health | jq .
echo

echo "2. Testing providers endpoint (public):"
curl -s http://localhost:3000/api/providers | jq '.providers | length'
echo "Number of providers:"
curl -s http://localhost:3000/api/providers | jq '.providers[].name'
echo

echo "3. Testing user registration:"
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"health_id": "HT004", "name": "Test User", "phone": "+15551234567", "password": "Password123", "email": "test@example.com"}' | jq .
echo

echo "4. Testing login:"
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "HT004", "password": "Password123"}' | jq .
echo

echo "=== Test completed ==="