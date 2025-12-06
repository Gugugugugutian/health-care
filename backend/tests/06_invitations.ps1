Write-Host "=== Test 6: Invitations Functionality ===" -ForegroundColor Green
Write-Host "Requirements:" -ForegroundColor Cyan
Write-Host "1. Send to email/phone not associated with account = invitation to new user" -ForegroundColor Yellow
Write-Host "2. 15-day expiration" -ForegroundColor Yellow
Write-Host "3. Accept by signing up within 15 days" -ForegroundColor Yellow
Write-Host "4. Record initiation and completion dates" -ForegroundColor Yellow
Write-Host "5. Same for unverified contact info" -ForegroundColor Yellow
Write-Host ""

$BASE_URL = "http://localhost:3000/api"

# Create test user for sending invitations
Write-Host "Creating test user for sending invitations..." -ForegroundColor Cyan
$body = @{
    health_id = "HT_INVITE_1"
    name = "Invitation Sender"
    phone = "+15550000400"
    password = "Password123"
    email = "sender@invite.com"
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

# First create a challenge to invite to
Write-Host "Creating challenge for invitation test..." -ForegroundColor Cyan
$body = @{
    title = "Invitation Test Challenge"
    description = "Challenge for testing invitation system"
    goal = "Test invitation acceptance"
    start_date = "2025-12-10"
    end_date = "2025-12-20"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/challenges" -Method Post -Body $body -Headers $headers
    $challengeId = $response.challenge.id
    Write-Host "✓ Challenge created: $($response.challenge.title)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create challenge: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6.1: Send invitation to non-existent email (new user invitation)
Write-Host "6.1 Testing invitation to non-existent email..." -ForegroundColor Cyan
$body = @{
    email = "newuser@example.com"
    invitation_type = "challenge"
    related_id = $challengeId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/invitations" -Method Post -Body $body -Headers $headers
    $invitationUid = $response.invitation.invitation_uid
    Write-Host "✓ Invitation sent to non-existent email:" -ForegroundColor Green
    Write-Host "  UID: $invitationUid" -ForegroundColor Gray
    Write-Host "  Status: $($response.invitation.status)" -ForegroundColor Gray
    Write-Host "  Expires: $($response.invitation.expires_at)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to send invitation: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6.2: Send invitation to phone
Write-Host "6.2 Testing invitation to phone..." -ForegroundColor Cyan
$body = @{
    phone = "+15550000499"
    invitation_type = "challenge"
    related_id = $challengeId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/invitations" -Method Post -Body $body -Headers $headers
    Write-Host "✓ Invitation sent to phone" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to send invitation: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6.3: Get sent invitations
Write-Host "6.3 Testing get sent invitations..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/invitations" -Method Get -Headers $headers
    Write-Host "✓ User has sent $($response.count) invitation(s):" -ForegroundColor Green
    foreach ($inv in $response.invitations) {
        Write-Host "  - To: $($inv.email)$($inv.phone) (Type: $($inv.invitation_type), Status: $($inv.status))" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to get sent invitations: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6.4: Create a new user with the invited email
Write-Host "6.4 Testing new user registration with invited email..." -ForegroundColor Cyan
$body = @{
    health_id = "HT_INVITE_2"
    name = "New Invited User"
    phone = "+15550000401"
    password = "Password123"
    email = "newuser@example.com"  # Same email as invitation
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/auth/register" -Method Post -Body $body -ContentType "application/json"
    $token2 = $response.token
    $userId2 = $response.user.id
    Write-Host "✓ New user created with invited email: $($response.user.name)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create new user: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

$headers2 = @{
    "Authorization" = "Bearer $token2"
    "Content-Type" = "application/json"
}

# Test 6.5: Get invitations for new user
Write-Host "6.5 Testing get invitations for new user..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/invitations/mine" -Method Get -Headers $headers2
    Write-Host "✓ New user has $($response.count) pending invitation(s):" -ForegroundColor Green
    foreach ($inv in $response.invitations) {
        Write-Host "  - From: $($inv.sender_name) (Challenge: $($inv.related_name))" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to get invitations: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6.6: Accept invitation
Write-Host "6.6 Testing accept invitation..." -ForegroundColor Cyan
if ($invitationUid) {
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/invitations/$invitationUid/accept" -Method Put -Headers $headers2
        Write-Host "✓ Invitation accepted successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to accept invitation: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 6.7: Verify user is now in challenge
Write-Host "6.7 Testing user participation after accepting invitation..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/challenges" -Method Get -Headers $headers2
    Write-Host "✓ User now has $($response.count) challenge(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get challenges: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6.8: Cancel invitation
Write-Host "6.8 Testing cancel invitation..." -ForegroundColor Cyan
# First send another invitation
$body = @{
    email = "tocancel@example.com"
    invitation_type = "challenge"
    related_id = $challengeId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/invitations" -Method Post -Body $body -Headers $headers
    $cancelInvId = $response.invitation.invitation_id
    Write-Host "✓ Created invitation to cancel (ID: $cancelInvId)" -ForegroundColor Green

    # Now cancel it
    $cancelResponse = Invoke-RestMethod -Uri "$BASE_URL/invitations/$cancelInvId" -Method Delete -Headers $headers
    Write-Host "✓ Invitation cancelled successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to test cancellation: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6.9: Get invitation statistics
Write-Host "6.9 Testing invitation statistics..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/invitations/stats" -Method Get -Headers $headers
    Write-Host "✓ Invitation statistics:" -ForegroundColor Green
    Write-Host "  Total: $($response.stats.total)" -ForegroundColor Gray
    Write-Host "  Pending: $($response.stats.pending)" -ForegroundColor Gray
    Write-Host "  Accepted: $($response.stats.accepted)" -ForegroundColor Gray
    Write-Host "  Expired: $($response.stats.expired)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to get statistics: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Invitations Tests Complete ===" -ForegroundColor Green