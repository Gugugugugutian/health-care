Write-Host "=== Test 7: Health Data and Reports ===" -ForegroundColor Green
Write-Host "Requirements:" -ForegroundColor Cyan
Write-Host "1. Monthly summary reports" -ForegroundColor Yellow
Write-Host "2. Search functionality" -ForegroundColor Yellow
Write-Host "3. Track health metrics" -ForegroundColor Yellow
Write-Host ""

$BASE_URL = "http://localhost:3000/api"

# Create test user
Write-Host "Creating test user for health data..." -ForegroundColor Cyan
$body = @{
    health_id = "HT_HEALTH_1"
    name = "Health Data User"
    phone = "+15550000500"
    password = "Password123"
    email = "health@data.com"
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

# Test 7.1: Add health metrics
Write-Host "7.1 Testing add health metrics..." -ForegroundColor Cyan
$metrics = @(
    @{
        metric_date = "2025-12-01"
        metric_type = "steps"
        value = 8500
        unit = "steps"
        notes = "Morning walk"
    },
    @{
        metric_date = "2025-12-01"
        metric_type = "weight"
        value = 75.5
        unit = "kg"
        notes = "Morning weight"
    },
    @{
        metric_date = "2025-12-02"
        metric_type = "steps"
        value = 9200
        unit = "steps"
        notes = "Daily steps"
    },
    @{
        metric_date = "2025-12-02"
        metric_type = "blood_pressure"
        value = 120
        unit = "mmHg"
        notes = "Systolic"
    },
    @{
        metric_date = "2025-12-03"
        metric_type = "steps"
        value = 7800
        unit = "steps"
        notes = "Rest day"
    }
)

$addedMetrics = 0
foreach ($metric in $metrics) {
    $body = $metric | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri "$BASE_URL/health-metrics" -Method Post -Body $body -Headers $headers
        $addedMetrics++
    } catch {
        Write-Host "  ✗ Failed to add metric: $($metric.metric_type)" -ForegroundColor Red
    }
}
Write-Host "✓ Added $addedMetrics health metrics" -ForegroundColor Green
Write-Host ""

# Test 7.2: Get all health metrics
Write-Host "7.2 Testing get health metrics..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health-metrics" -Method Get -Headers $headers
    Write-Host "✓ User has $($response.count) health metric(s)" -ForegroundColor Green
    foreach ($metric in $response.metrics | Select-Object -First 3) {
        Write-Host "  - $($metric.metric_type): $($metric.value) $($metric.unit) on $($metric.metric_date)" -ForegroundColor Gray
    }
    if ($response.metrics.Count -gt 3) {
        Write-Host "  ... and $($response.metrics.Count - 3) more" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to get health metrics: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7.3: Get monthly summary
Write-Host "7.3 Testing monthly summary report..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health-metrics/summary/monthly?year=2025&month=12" -Method Get -Headers $headers
    Write-Host "✓ Monthly summary for December 2025:" -ForegroundColor Green
    foreach ($summary in $response.summary) {
        Write-Host "  - $($summary.metric_type):" -ForegroundColor Gray
        Write-Host "    Count: $($summary.count), Avg: $([math]::Round($summary.avg_value, 2)), Range: $($summary.min_value)-$($summary.max_value)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to get monthly summary: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7.4: Search health metrics
Write-Host "7.4 Testing search health metrics..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health-metrics/search?q=steps" -Method Get -Headers $headers
    Write-Host "✓ Search found $($response.count) metric(s) for 'steps':" -ForegroundColor Green
    foreach ($metric in $response.metrics) {
        Write-Host "  - $($metric.value) $($metric.unit) on $($metric.metric_date)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to search metrics: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7.5: Get latest metrics
Write-Host "7.5 Testing get latest metrics..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health-metrics/latest?limit=3" -Method Get -Headers $headers
    Write-Host "✓ Latest $($response.count) metric(s):" -ForegroundColor Green
    foreach ($metric in $response.metrics) {
        Write-Host "  - $($metric.metric_type): $($metric.value) $($metric.unit) on $($metric.metric_date)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Failed to get latest metrics: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7.6: Get health metric statistics
Write-Host "7.6 Testing health metric statistics..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health-metrics/stats" -Method Get -Headers $headers
    Write-Host "✓ Health metric statistics:" -ForegroundColor Green
    Write-Host "  Total entries: $($response.stats.total_entries)" -ForegroundColor Gray
    Write-Host "  Metric types: $($response.stats.metric_types)" -ForegroundColor Gray
    Write-Host "  First record: $($response.stats.first_record)" -ForegroundColor Gray
    Write-Host "  Last record: $($response.stats.last_record)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to get statistics: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7.7: Update a health metric
Write-Host "7.7 Testing update health metric..." -ForegroundColor Cyan
# First get a metric to update
try {
    $metricsResponse = Invoke-RestMethod -Uri "$BASE_URL/health-metrics" -Method Get -Headers $headers
    if ($metricsResponse.metrics.Count -gt 0) {
        $metricToUpdate = $metricsResponse.metrics[0]
        $metricId = $metricToUpdate.metric_id

        $body = @{
            value = 9000
            notes = "Updated step count"
        } | ConvertTo-Json

        $updateResponse = Invoke-RestMethod -Uri "$BASE_URL/health-metrics/$metricId" -Method Put -Body $body -Headers $headers
        Write-Host "✓ Updated metric ID $metricId" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Failed to update metric: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7.8: Delete a health metric
Write-Host "7.8 Testing delete health metric..." -ForegroundColor Cyan
# First get a metric to delete
try {
    $metricsResponse = Invoke-RestMethod -Uri "$BASE_URL/health-metrics" -Method Get -Headers $headers
    if ($metricsResponse.metrics.Count -gt 0) {
        $metricToDelete = $metricsResponse.metrics[-1]  # Last one
        $metricId = $metricToDelete.metric_id

        $deleteResponse = Invoke-RestMethod -Uri "$BASE_URL/health-metrics/$metricId" -Method Delete -Headers $headers
        Write-Host "✓ Deleted metric ID $metricId" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Failed to delete metric: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7.9: Get metrics by date range
Write-Host "7.9 Testing get metrics by date range..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health-metrics?start_date=2025-12-01&end_date=2025-12-02" -Method Get -Headers $headers
    Write-Host "✓ Found $($response.count) metric(s) between Dec 1-2, 2025" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get metrics by date: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7.10: Get metrics by type
Write-Host "7.10 Testing get metrics by type..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health-metrics?metric_type=steps" -Method Get -Headers $headers
    Write-Host "✓ Found $($response.count) step metric(s)" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get metrics by type: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Health Data Tests Complete ===" -ForegroundColor Green