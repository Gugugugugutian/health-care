Write-Host "=== Test 3: Family Groups Functionality ===" -ForegroundColor Green
Write-Host "Requirements:" -ForegroundColor Cyan
Write-Host "1. Two or more users in Family Group" -ForegroundColor Yellow
Write-Host "2. Permission management (e.g., parent manages child)" -ForegroundColor Yellow
Write-Host ""

$BASE_URL = "http://localhost:3000/api"

# Create two test users
Write-Host "Creating test users for family group..." -ForegroundColor Cyan

# User 1 (Parent)
$body1 = @{
    health_id = "HT_FAMILY_1"
    name = "Family Parent"
    phone = "+15550000100"
    password = "Password123"
    email = "parent@family.com"
} | ConvertTo-Json

# User 2 (Child)
$body2 = @{
    health_id = "HT_FAMILY_2"
    name = "Family Child"
    phone = "+15550000101"
    password = "Password123"
    email = "child@family.com"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -Body $body1 -ContentType "application/json"
    $token1 = $response1.token
    $userId1 = $response1.user.id
    Write-Host "✓ Created parent user: $($response1.user.name)" -ForegroundColor Green

    $response2 = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -Body $body2 -ContentType "application/json"
    $token2 = $response2.token
    $userId2 = $response2.user.id
    Write-Host "✓ Created child user: $($response2.user.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create test users: $($_.Exception.Message)" -ForegroundColor Red
    exit
}
Write-Host ""

$headers1 = @{
    "Authorization" = "Bearer $token1"
    "Content-Type" = "application/json"
}

$headers2 = @{
    "Authorization" = "Bearer $token2"
    "Content-Type" = "application/json"
}

# Test 3.1: Create family group
Write-Host "3.1 Testing create family group..." -ForegroundColor Cyan
$body = @{
    group_name = "Smith Family"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/family" -Method Post -Body $body -Headers $headers1
    $familyId = $response.family_group.id
    Write-Host "✓ Created family group: $($response.family_group.group_name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create family group: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3.2: Get user's family groups
Write-Host "3.2 Testing get user's family groups..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/family" -Method Get -Headers $headers1
    Write-Host "✓ User has $($response.count) family group(s)" -ForegroundColor Green
    foreach ($family in $response.family_groups) {
        Write-Host "  - $($family.group_name) (Can manage: $($family.can_manage))" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to get family groups: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3.3: Add child to family group
Write-Host "3.3 Testing add member to family group..." -ForegroundColor Cyan
$body = @{
    user_id = $userId2
    relationship = "Child"
    can_manage = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/family/$familyId/members" -Method Post -Body $body -Headers $headers1
    Write-Host "✓ Added child to family group" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add member: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3.4: Get family group details
Write-Host "3.4 Testing get family group details..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/family/$familyId" -Method Get -Headers $headers1
    Write-Host "✓ Family group details:" -ForegroundColor Green
    Write-Host "  Name: $($response.family_group.group_name)" -ForegroundColor Gray
    Write-Host "  Members: $($response.member_count)" -ForegroundColor Gray
    foreach ($member in $response.members) {
        $manageStatus = if ($member.can_manage) { "Can manage" } else { "Cannot manage" }
        Write-Host "  - $($member.name) ($($member.relationship), $manageStatus)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to get family details: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3.5: Child should also see the family group
Write-Host "3.5 Testing child's view of family group..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/family" -Method Get -Headers $headers2
    Write-Host "✓ Child sees $($response.count) family group(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Child failed to get family groups: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3.6: Update member relationship
Write-Host "3.6 Testing update member relationship..." -ForegroundColor Cyan
$body = @{
    relationship = "Teenager"
    can_manage = $false
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/family/$familyId/members/$userId2" -Method Put -Body $body -Headers $headers1
    Write-Host "✓ Updated child's relationship to 'Teenager'" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to update member: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3.7: Remove member (child leaves family)
Write-Host "3.7 Testing remove member from family..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/family/$familyId/members/$userId2" -Method Delete -Headers $headers2
    Write-Host "✓ Child left family group" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to remove member: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3.8: Verify member count after removal
Write-Host "3.8 Testing member count after removal..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/family/$familyId" -Method Get -Headers $headers1
    Write-Host "✓ Family now has $($response.member_count) member(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to verify member count: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3.9: Delete family group
Write-Host "3.9 Testing delete family group..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/family/$familyId" -Method Delete -Headers $headers1
    Write-Host "✓ Deleted family group" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to delete family group: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Family Groups Tests Complete ===" -ForegroundColor Green