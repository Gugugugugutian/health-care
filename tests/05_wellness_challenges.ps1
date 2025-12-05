Write-Host "=== Test 5: Wellness Challenges Functionality ===" -ForegroundColor Green
Write-Host "Requirements:" -ForegroundColor Cyan
Write-Host "1. Create challenge with goal, start/end dates" -ForegroundColor Yellow
Write-Host "2. Invite by email or phone" -ForegroundColor Yellow
Write-Host "3. Unique challenge ID" -ForegroundColor Yellow
Write-Host "4. Track participant progress" -ForegroundColor Yellow
Write-Host ""

$BASE_URL = "http://localhost:3000/api"

# Create test user
Write-Host "Creating test user for challenges..." -ForegroundColor Cyan
$body = @{
    health_id = "HT_CHALLENGE_1"
    name = "Challenge Creator"
    phone = "+15550000300"
    password = "Password123"
    email = "creator@challenge.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -Body $body -ContentType "application/json"
    $token = $response.token
    $userId = $response.user.id
    Write-Host "✓ Test user created: $($response.user.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create test user: $($_.Exception.Message)" -ForegroundColor Red
    exit
}
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 5.1: Create wellness challenge
Write-Host "5.1 Testing create wellness challenge..." -ForegroundColor Cyan
$body = @{
    title = "30-Day Fitness Challenge"
    description = "Get fit in 30 days with daily exercises"
    goal = "Complete 30 workout sessions in 30 days"
    start_date = "2025-12-10"
    end_date = "2026-01-08"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/challenges" -Method Post -Body $body -Headers $headers
    $challengeId = $response.challenge.id
    $challengeUid = $response.challenge.challenge_uid
    Write-Host "✓ Challenge created:" -ForegroundColor Green
    Write-Host "  Title: $($response.challenge.title)" -ForegroundColor Gray
    Write-Host "  Goal: $($response.challenge.goal)" -ForegroundColor Gray
    Write-Host "  UID: $challengeUid" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to create challenge: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5.2: Get user's challenges
Write-Host "5.2 Testing get user's challenges..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/challenges" -Method Get -Headers $headers
    Write-Host "✓ User has $($response.count) challenge(s):" -ForegroundColor Green
    foreach ($challenge in $response.challenges) {
        Write-Host "  - $($challenge.title) (Role: $($challenge.user_role), Progress: $($challenge.progress))" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to get challenges: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5.3: Get challenge details
Write-Host "5.3 Testing get challenge details..." -ForegroundColor Cyan
if ($challengeId) {
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/challenges/$challengeId" -Method Get -Headers $headers
        Write-Host "✓ Challenge details:" -ForegroundColor Green
        Write-Host "  Creator: $($response.challenge.creator_name)" -ForegroundColor Gray
        Write-Host "  Participants: $($response.participant_count)" -ForegroundColor Gray
        Write-Host "  Status: $($response.challenge.status)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Failed to get challenge details: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5.4: Update progress
Write-Host "5.4 Testing update progress..." -ForegroundColor Cyan
if ($challengeId) {
    $body = @{
        progress = 5
        notes = "Completed first 5 workouts"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/challenges/$challengeId/progress" -Method Put -Body $body -Headers $headers
        Write-Host "✓ Progress updated to 5/30" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to update progress: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5.5: Invite to challenge by email
Write-Host "5.5 Testing invite to challenge by email..." -ForegroundColor Cyan
if ($challengeId) {
    $body = @{
        email = "friend@example.com"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/challenges/$challengeId/invite" -Method Post -Body $body -Headers $headers
        Write-Host "✓ Invitation sent to email" -ForegroundColor Green
        Write-Host "  Invitation UID: $($response.invitation.invitation_uid)" -ForegroundColor Gray
        Write-Host "  Expires: $($response.invitation.expires_at)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Failed to send invitation: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5.6: Search challenges
Write-Host "5.6 Testing search challenges..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/challenges/search?q=Fitness" -Method Get
    Write-Host "✓ Search found $($response.count) challenge(s) for 'Fitness'" -ForegroundColor Green
    foreach ($challenge in $response.challenges) {
        Write-Host "  - $($challenge.title) by $($challenge.creator_name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to search challenges: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5.7: Get active challenges
Write-Host "5.7 Testing get active challenges..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/challenges/active" -Method Get
    Write-Host "✓ Found $($response.count) active challenge(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get active challenges: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5.8: Get challenge statistics
Write-Host "5.8 Testing challenge statistics..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/challenges/stats" -Method Get -Headers $headers
    Write-Host "✓ Challenge statistics:" -ForegroundColor Green
    Write-Host "  Total challenges: $($response.stats.total_challenges)" -ForegroundColor Gray
    Write-Host "  Created: $($response.stats.created)" -ForegroundColor Gray
    Write-Host "  Participating: $($response.stats.participating)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to get statistics: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Create another user to test joining
Write-Host "Creating second user to test joining..." -ForegroundColor Cyan
$body = @{
    health_id = "HT_CHALLENGE_2"
    name = "Challenge Joiner"
    phone = "+15550000301"
    password = "Password123"
    email = "joiner@challenge.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -Body $body -ContentType "application/json"
    $token2 = $response.token
    $userId2 = $response.user.id
    Write-Host "✓ Second user created: $($response.user.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create second user: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

$headers2 = @{
    "Authorization" = "Bearer $token2"
    "Content-Type" = "application/json"
}

# Test 5.9: Join challenge
Write-Host "5.9 Testing join challenge..." -ForegroundColor Cyan
if ($challengeId) {
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/challenges/$challengeId/join" -Method Post -Headers $headers2
        Write-Host "✓ User joined challenge successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to join challenge: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "=== Wellness Challenges Tests Complete ===" -ForegroundColor Green