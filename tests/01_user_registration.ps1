Write-Host "=== Test 1: User Registration Functionality ===" -ForegroundColor Green
Write-Host "Requirements:" -ForegroundColor Cyan
Write-Host "1. Name, unique Health ID, email, phone" -ForegroundColor Yellow
Write-Host "2. One phone, multiple emails" -ForegroundColor Yellow
Write-Host "3. Verified/unverified contact info" -ForegroundColor Yellow
Write-Host ""

# Base URL
$BASE_URL = "http://localhost:3000/api"

# Test 1.1: Basic registration
Write-Host "1.1 Testing basic user registration..." -ForegroundColor Cyan
$body = @{
    health_id = "HT_TEST_001"
    name = "Test User One"
    phone = "+15550000001"
    password = "Password123"
    email = "test1@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Registration successful: $($response.user.health_id)" -ForegroundColor Green
    $userId1 = $response.user.id
    $token1 = $response.token
} catch {
    Write-Host "✗ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 1.2: Duplicate health ID should fail
Write-Host "1.2 Testing duplicate Health ID rejection..." -ForegroundColor Cyan
$body = @{
    health_id = "HT_TEST_001"  # Same as above
    name = "Test User Two"
    phone = "+15550000002"
    password = "Password123"
    email = "test2@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✗ Should have rejected duplicate Health ID" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctly rejected duplicate Health ID" -ForegroundColor Green
}
Write-Host ""

# Test 1.3: Add multiple emails to user
Write-Host "1.3 Testing adding multiple emails to user..." -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer $token1"
    "Content-Type" = "application/json"
}

$body = @{
    email = "test1_work@example.com"
    is_primary = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/emails" -Method Post -Body $body -Headers $headers
    Write-Host "✓ Added secondary email: $($response.email)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add email: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 1.4: Get user profile to see emails
Write-Host "1.4 Testing user profile with multiple emails..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/profile" -Method Get -Headers $headers
    $emailCount = $response.user.emails.Count
    Write-Host "✓ User has $emailCount email(s):" -ForegroundColor Green
    foreach ($email in $response.user.emails) {
        Write-Host "  - $($email.email) (Primary: $($email.is_primary), Verified: $($email.verified))" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to get profile: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 1.5: Verify email
Write-Host "1.5 Testing email verification..." -ForegroundColor Cyan
try {
    # Get first email ID
    $profile = Invoke-RestMethod -Uri "$BASE_URL/auth/profile" -Method Get -Headers $headers
    $emailId = $profile.user.emails[0].email_id

    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/emails/$emailId/verify" -Method Put -Headers $headers
    Write-Host "✓ Email verification endpoint exists" -ForegroundColor Green
} catch {
    Write-Host "✗ Email verification failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 1.6: Verify phone
Write-Host "1.6 Testing phone verification..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/phone/verify" -Method Put -Headers $headers
    Write-Host "✓ Phone verification endpoint exists" -ForegroundColor Green
} catch {
    Write-Host "✗ Phone verification failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== User Registration Tests Complete ===" -ForegroundColor Green