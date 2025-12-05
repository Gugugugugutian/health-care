#!/bin/bash

echo "=== Testing Authenticated API Endpoints ==="
echo

# Get token from login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "HT004", "password": "Password123"}' | jq -r '.token')

echo "Token obtained: ${TOKEN:0:20}..."
echo

echo "1. Testing user profile:"
curl -s http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "2. Testing get user's providers (should be empty initially):"
curl -s http://localhost:3000/api/providers/user/mine \
  -H "Authorization: Bearer $TOKEN" | jq .
echo

echo "3. Testing link provider (link to provider ID 1):"
curl -s -X POST http://localhost:3000/api/providers/link \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"provider_id": 1, "is_primary": true}' | jq .
echo

echo "4. Testing get user's providers again:"
curl -s http://localhost:3000/api/providers/user/mine \
  -H "Authorization: Bearer $TOKEN" | jq '.providers[].name'
echo

echo "5. Testing create appointment:"
curl -s -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"provider_id": 1, "appointment_date": "2024-12-20", "appointment_time": "14:30:00", "consultation_type": "In-Person", "memo": "Test appointment"}' | jq .
echo

echo "6. Testing get user's appointments:"
curl -s http://localhost:3000/api/appointments \
  -H "Authorization: Bearer $TOKEN" | jq '.appointments[].appointment_uid'
echo

echo "7. Testing create wellness challenge:"
curl -s -X POST http://localhost:3000/api/challenges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Test Challenge", "description": "A test wellness challenge", "goal": "Walk 10,000 steps daily for 7 days", "start_date": "2024-12-05", "end_date": "2024-12-11"}' | jq .
echo

echo "8. Testing get user's challenges:"
curl -s http://localhost:3000/api/challenges \
  -H "Authorization: Bearer $TOKEN" | jq '.challenges[].title'
echo

echo "9. Testing add health metric:"
curl -s -X POST http://localhost:3000/api/health-metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"metric_date": "2024-12-04", "metric_type": "steps", "value": 8500, "unit": "steps", "notes": "Daily steps"}' | jq .
echo

echo "10. Testing get health metrics:"
curl -s http://localhost:3000/api/health-metrics \
  -H "Authorization: Bearer $TOKEN" | jq '.metrics[].metric_type'
echo

echo "=== Authenticated tests completed ==="