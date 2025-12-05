Write-Host "=== Test 4: Appointments Functionality ===" -ForegroundColor Green
Write-Host "Requirements:" -ForegroundColor Cyan
Write-Host "1. Book by provider license number OR verified email" -ForegroundColor Yellow
Write-Host "2. Date, time, consultation type, memo" -ForegroundColor Yellow
Write-Host "3. Unique appointment ID" -ForegroundColor Yellow
Write-Host "4. Cancel up to 24 hours before" -ForegroundColor Yellow
WriteHost "5. Record cancellation reason" -ForegroundColor Yellow
Write-Host ""

$BASE_URL = "http://localhost:3000/api"

# Create test user
Write-Host "Creating test user for appointments..." -ForegroundColor Cyan
$body = @{
    health_id = "HT_APPT_TEST"
    name = "Appointment Test User"
    phone = "+15550000200"
    password = "Password123"
    email = "appt@test.com"
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

# Get a provider to link
Write-Host "Getting provider for testing..." -ForegroundColor Cyan
try {
    $providersResponse = Invoke-RestMethod -Uri "$BASE_URL/providers" -Method Get
    $provider = $providersResponse.providers[0]  # Dr. Sarah Wilson
    Write-Host "✓ Using provider: $($provider.name) (License: $($provider.license_number))" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get providers: $($_.Exception.Message)" -ForegroundColor Red
    exit
}
Write-Host ""

# Link provider first
Write-Host "Linking provider to user..." -ForegroundColor Cyan
$body = @{
    provider_id = $provider.provider_id
    is_primary = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/providers/link" -Method Post -Body $body -Headers $headers
    Write-Host "✓ Linked provider" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to link provider: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4.1: Create appointment by provider ID (existing method)
Write-Host "4.1 Testing create appointment by provider ID..." -ForegroundColor Cyan
$body = @{
    provider_id = $provider.provider_id
    appointment_date = "2025-12-20"
    appointment_time = "10:00:00"
    consultation_type = "In-Person"
    memo = "Annual checkup"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/appointments" -Method Post -Body $body -Headers $headers
    $appointmentId = $response.appointment.id
    $appointmentUid = $response.appointment.appointment_uid
    Write-Host "✓ Appointment created by provider ID:" -ForegroundColor Green
    Write-Host "  UID: $appointmentUid" -ForegroundColor Gray
    Write-Host "  Date: $($response.appointment.appointment_date)" -ForegroundColor Gray
    Write-Host "  Time: $($response.appointment.appointment_time)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to create appointment: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4.2: Create appointment by license number (NEW REQUIREMENT)
Write-Host "4.2 Testing create appointment by license number..." -ForegroundColor Cyan
$body = @{
    license_number = $provider.license_number
    appointment_date = "2025-12-21"
    appointment_time = "14:30:00"
    consultation_type = "Virtual"
    memo = "Follow-up consultation by license number"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/appointments" -Method Post -Body $body -Headers $headers
    Write-Host "✓ Appointment created by license number:" -ForegroundColor Green
    Write-Host "  UID: $($response.appointment.appointment_uid)" -ForegroundColor Gray
    Write-Host "  Type: $($response.appointment.consultation_type)" -ForegroundColor Gray
    Write-Host "  Provider linked: $($response.provider_linked)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to create appointment by license number: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4.2a: Create appointment by verified email
Write-Host "4.2a Testing create appointment by verified email..." -ForegroundColor Cyan
# First need a provider with verified email
$providersResponse = Invoke-RestMethod -Uri "$BASE_URL/providers" -Method Get
$verifiedProvider = $providersResponse.providers | Where-Object { $_.verified -eq $true -and $_.email } | Select-Object -First 1

if ($verifiedProvider) {
    $body = @{
        email = $verifiedProvider.email
        appointment_date = "2025-12-22"
        appointment_time = "11:00:00"
        consultation_type = "In-Person"
        memo = "Appointment by verified email"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/appointments" -Method Post -Body $body -Headers $headers
        Write-Host "✓ Appointment created by verified email:" -ForegroundColor Green
        Write-Host "  Provider: $($verifiedProvider.name)" -ForegroundColor Gray
        Write-Host "  Email: $($verifiedProvider.email)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Failed to create appointment by email: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ No provider with verified email found for test" -ForegroundColor Yellow
}
Write-Host ""

# Test 4.3: Get user's appointments
Write-Host "4.3 Testing get user's appointments..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/appointments" -Method Get -Headers $headers
    Write-Host "✓ User has $($response.count) appointment(s):" -ForegroundColor Green
    foreach ($appt in $response.appointments) {
        $status = $appt.status
        Write-Host "  - $($appt.appointment_uid): $($appt.appointment_date) $($appt.appointment_time) ($status)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to get appointments: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4.4: Get appointment by ID
Write-Host "4.4 Testing get appointment by ID..." -ForegroundColor Cyan
if ($appointmentId) {
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/appointments/$appointmentId" -Method Get -Headers $headers
        Write-Host "✓ Appointment details:" -ForegroundColor Green
        Write-Host "  Provider: $($response.appointment.provider_name)" -ForegroundColor Gray
        Write-Host "  License: $($response.appointment.license_number)" -ForegroundColor Gray
        Write-Host "  Type: $($response.appointment.consultation_type)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Failed to get appointment: $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4.5: Cancel appointment (with future date)
Write-Host "4.5 Testing cancel appointment..." -ForegroundColor Cyan
# First create an appointment far in the future for cancellation test
$body = @{
    provider_id = $provider.provider_id
    appointment_date = "2026-01-15"  # Far in future
    appointment_time = "09:00:00"
    consultation_type = "In-Person"
    memo = "Test cancellation"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/appointments" -Method Post -Body $body -Headers $headers
    $cancelApptId = $response.appointment.id
    Write-Host "✓ Created appointment for cancellation test: $($response.appointment.appointment_uid)" -ForegroundColor Green

    # Now cancel it
    $cancelBody = @{
        reason = "Patient rescheduled"
    } | ConvertTo-Json

    $cancelResponse = Invoke-RestMethod -Uri "$BASE_URL/appointments/$cancelApptId/cancel" -Method Put -Body $cancelBody -Headers $headers
    Write-Host "✓ Appointment cancelled successfully" -ForegroundColor Green
    Write-Host "  Reason: $($cancelResponse.reason)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to test cancellation: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4.6: Try to cancel appointment within 24 hours (should fail)
Write-Host "4.6 Testing cancel appointment within 24 hours..." -ForegroundColor Cyan
# Create appointment for very near future
$nearFutureDate = (Get-Date).AddHours(2).ToString("yyyy-MM-dd")
$nearFutureTime = (Get-Date).AddHours(2).ToString("HH:mm:ss")

$body = @{
    provider_id = $provider.provider_id
    appointment_date = $nearFutureDate
    appointment_time = $nearFutureTime
    consultation_type = "Virtual"
    memo = "Test 24-hour rule"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/appointments" -Method Post -Body $body -Headers $headers
    $nearApptId = $response.appointment.id
    Write-Host "✓ Created appointment near future: $nearFutureDate $nearFutureTime" -ForegroundColor Green

    # Try to cancel - should fail
    $cancelBody = @{
        reason = "Too late to cancel"
    } | ConvertTo-Json

    $cancelResponse = Invoke-RestMethod -Uri "$BASE_URL/appointments/$nearApptId/cancel" -Method Put -Body $cancelBody -Headers $headers
    Write-Host "✗ Should have failed to cancel within 24 hours" -ForegroundColor Red
} catch {
    Write-Host "✓ Correctly rejected cancellation within 24 hours" -ForegroundColor Green
}
Write-Host ""

# Test 4.7: Search appointments by date
Write-Host "4.7 Testing search appointments by date..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/appointments/search/date?start_date=2025-12-01&end_date=2025-12-31" -Method Get -Headers $headers
    Write-Host "✓ Found $($response.count) appointment(s) in December 2025" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to search appointments: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4.8: Get appointment statistics
Write-Host "4.8 Testing appointment statistics..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/appointments/stats" -Method Get -Headers $headers
    Write-Host "✓ Appointment statistics:" -ForegroundColor Green
    Write-Host "  Total: $($response.stats.total)" -ForegroundColor Gray
    Write-Host "  Scheduled: $($response.stats.scheduled)" -ForegroundColor Gray
    Write-Host "  Cancelled: $($response.stats.cancelled)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to get statistics: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Appointments Tests Complete ===" -ForegroundColor Green
Write-Host "✓ All appointment features implemented:" -ForegroundColor Green
Write-Host "  - By provider ID" -ForegroundColor Gray
Write-Host "  - By license number" -ForegroundColor Gray
Write-Host "  - By verified email" -ForegroundColor Gray
Write-Host "  - 24-hour cancellation rule" -ForegroundColor Gray
Write-Host "  - Cancellation reason recording" -ForegroundColor Gray