Write-Host "=== Testing Authenticated API Endpoints ===" -ForegroundColor Green
Write-Host ""

# Get token from login
Write-Host "Getting authentication token..." -ForegroundColor Cyan
$body = @{
    identifier = "HT005"
    password = "Password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$TOKEN = $loginResponse.token
Write-Host "Token obtained: $($TOKEN.Substring(0, 20))..."
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "1. Testing user profile:" -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/profile" -Method Get -Headers $headers
$response | ConvertTo-Json
Write-Host ""

Write-Host "2. Testing get user's providers:" -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/providers/user/mine" -Method Get -Headers $headers
$response | ConvertTo-Json
Write-Host ""

Write-Host "3. Testing link provider (link to provider ID 1):" -ForegroundColor Cyan
$body = @{
    provider_id = 1
    is_primary = $true
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/providers/link" -Method Post -Body $body -Headers $headers
$response | ConvertTo-Json
Write-Host ""

Write-Host "4. Testing get user's providers again:" -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/providers/user/mine" -Method Get -Headers $headers
foreach ($provider in $response.providers) {
    Write-Host "  - $($provider.name)"
}
Write-Host ""

Write-Host "5. Testing create appointment:" -ForegroundColor Cyan
$body = @{
    provider_id = 1
    appointment_date = "2025-12-15"
    appointment_time = "14:30:00"
    consultation_type = "In-Person"
    memo = "Windows test appointment"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/appointments" -Method Post -Body $body -Headers $headers
$response | ConvertTo-Json
Write-Host ""

Write-Host "6. Testing get user's appointments:" -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/appointments" -Method Get -Headers $headers
if ($response.appointments) {
    foreach ($appointment in $response.appointments) {
        Write-Host "  - $($appointment.appointment_uid): $($appointment.appointment_date) $($appointment.appointment_time)"
    }
} else {
    Write-Host "  No appointments found"
}
Write-Host ""

Write-Host "7. Testing create wellness challenge:" -ForegroundColor Cyan
$body = @{
    title = "Windows Test Challenge"
    description = "A test wellness challenge from PowerShell"
    goal = "Walk 10,000 steps daily for 7 days"
    start_date = "2025-12-10"
    end_date = "2025-12-17"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/challenges" -Method Post -Body $body -Headers $headers
$response | ConvertTo-Json
Write-Host ""

Write-Host "8. Testing get user's challenges:" -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/challenges" -Method Get -Headers $headers
if ($response.challenges) {
    foreach ($challenge in $response.challenges) {
        Write-Host "  - $($challenge.title) (Status: $($challenge.status))"
    }
} else {
    Write-Host "  No challenges found"
}
Write-Host ""

Write-Host "9. Testing add health metric:" -ForegroundColor Cyan
$body = @{
    metric_date = "2025-12-04"
    metric_type = "steps"
    value = 8500
    unit = "steps"
    notes = "Daily steps from PowerShell"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/health-metrics" -Method Post -Body $body -Headers $headers
$response | ConvertTo-Json
Write-Host ""

Write-Host "10. Testing get health metrics:" -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/health-metrics" -Method Get -Headers $headers
if ($response.metrics) {
    foreach ($metric in $response.metrics) {
        Write-Host "  - $($metric.metric_type): $($metric.value) $($metric.unit) on $($metric.metric_date)"
    }
} else {
    Write-Host "  No metrics found"
}
Write-Host ""

Write-Host "=== Authenticated tests completed ===" -ForegroundColor Green