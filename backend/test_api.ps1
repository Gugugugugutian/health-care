Write-Host "=== Testing HealthTrack API ===" -ForegroundColor Green
Write-Host ""

Write-Host "1. Testing health endpoint:" -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
$response | ConvertTo-Json
Write-Host ""

Write-Host "2. Testing providers endpoint (public):" -ForegroundColor Cyan
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/providers" -Method Get
Write-Host "Number of providers: $($response.providers.Count)"
foreach ($provider in $response.providers) {
    Write-Host "  - $($provider.name)"
}
Write-Host ""

Write-Host "3. Testing user registration:" -ForegroundColor Cyan
$body = @{
    health_id = "HT005"
    name = "Windows User"
    phone = "+15559876543"
    password = "Password123"
    email = "windows@example.com"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
$response | ConvertTo-Json
Write-Host ""

Write-Host "4. Testing login:" -ForegroundColor Cyan
$body = @{
    identifier = "HT005"
    password = "Password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
$response | ConvertTo-Json
Write-Host ""

Write-Host "=== Test completed ===" -ForegroundColor Green