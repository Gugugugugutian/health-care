Write-Host "=== Test 2: Provider Linking Functionality ===" -ForegroundColor Green
Write-Host "Requirements:" -ForegroundColor Cyan
Write-Host "1. Link multiple providers, one primary" -ForegroundColor Yellow
Write-Host "2. Unique medical license number" -ForegroundColor Yellow
Write-Host "3. Provider verification" -ForegroundColor Yellow
Write-Host "4. Link/unlink providers" -ForegroundColor Yellow
Write-Host ""

$BASE_URL = "http://localhost:3000/api"

# First, create a test user
Write-Host "Creating test user..." -ForegroundColor Cyan
$body = @{
    health_id = "HT_TEST_PROV"
    name = "Provider Test User"
    phone = "+15550000011"
    password = "Password123"
    email = "provtest@example.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -Body $body -ContentType "application/json"
    $token = $response.token
    $userId = $response.user.id
    Write-Host "✓ Test user created: $($response.user.health_id)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create test user: $($_.Exception.Message)" -ForegroundColor Red
    exit
}
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 2.1: Get existing providers
Write-Host "2.1 Testing get all providers..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/providers" -Method Get
    $providers = $response.providers
    Write-Host "✓ Found $($providers.Count) providers:" -ForegroundColor Green
    foreach ($provider in $providers) {
        Write-Host "  - $($provider.name) (License: $($provider.license_number), Verified: $($provider.verified))" -ForegroundColor Gray
    }

    # Store provider IDs for later tests
    $provider1 = $providers[0]  # Dr. Sarah Wilson
    $provider2 = $providers[1]  # Dr. Michael Chen
} catch {
    Write-Host "✗ Failed to get providers: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2.2: Link first provider as primary
Write-Host "2.2 Testing link provider as primary..." -ForegroundColor Cyan
$body = @{
    provider_id = $provider1.provider_id
    is_primary = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/providers/link" -Method Post -Body $body -Headers $headers
    Write-Host "✓ Linked provider: $($provider1.name) as primary" -ForegroundColor Green
    $linkId1 = $response.link_id
} catch {
    Write-Host "✗ Failed to link provider: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2.3: Link second provider as non-primary
Write-Host "2.3 Testing link second provider..." -ForegroundColor Cyan
$body = @{
    provider_id = $provider2.provider_id
    is_primary = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/providers/link" -Method Post -Body $body -Headers $headers
    Write-Host "✓ Linked provider: $($provider2.name)" -ForegroundColor Green
    $linkId2 = $response.link_id
} catch {
    Write-Host "✗ Failed to link provider: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2.4: Get user's linked providers
Write-Host "2.4 Testing get user's providers..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/providers/user/mine" -Method Get -Headers $headers
    $userProviders = $response.providers
    Write-Host "✓ User has $($userProviders.Count) linked providers:" -ForegroundColor Green
    foreach ($prov in $userProviders) {
        $primaryStatus = if ($prov.is_primary) { "PRIMARY" } else { "secondary" }
        Write-Host "  - $($prov.name) ($primaryStatus, Verified: $($prov.link_verified))" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to get user providers: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2.5: Get primary provider
Write-Host "2.5 Testing get primary provider..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/providers/user/primary" -Method Get -Headers $headers
    Write-Host "✓ Primary provider: $($response.provider.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get primary provider: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2.6: Unlink a provider
Write-Host "2.6 Testing unlink provider..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/providers/unlink/$($provider2.provider_id)" -Method Delete -Headers $headers
    Write-Host "✓ Unlinked provider: $($provider2.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to unlink provider: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2.7: Verify user's providers after unlinking
Write-Host "2.7 Testing providers after unlinking..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/providers/user/mine" -Method Get -Headers $headers
    $remainingProviders = $response.providers.Count
    Write-Host "✓ User now has $remainingProviders linked provider(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get providers: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2.8: Search providers
Write-Host "2.8 Testing provider search..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/providers/search?q=Wilson" -Method Get
    Write-Host "✓ Search found $($response.count) provider(s) for 'Wilson'" -ForegroundColor Green
    foreach ($prov in $response.providers) {
        Write-Host "  - $($prov.name) ($($prov.specialty))" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Search failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Provider Linking Tests Complete ===" -ForegroundColor Green