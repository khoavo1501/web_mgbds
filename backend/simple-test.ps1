# Simple API Test

Write-Host "Test 1: Auth Test Endpoint" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/test" -Method Get -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Blue
    Write-Host "Content: $($response.Content)" -ForegroundColor Yellow
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}
Write-Host ""

Write-Host "Test 2: Get Properties" -ForegroundColor Green
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/properties" -Method Get -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Blue
    Write-Host "Content: $($response.Content)" -ForegroundColor Yellow
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}
