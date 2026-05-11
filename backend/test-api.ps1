# PowerShell Script to Test Real Estate Management API

$BaseUrl = "http://localhost:8080/api"

Write-Host "========================================" -ForegroundColor Blue
Write-Host "Testing Real Estate Management API" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
Write-Host ""

# Test 1: Test endpoint
Write-Host "Test 1: Test Auth Endpoint" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$BaseUrl/auth/test" -Method Get
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Register Admin
Write-Host "Test 2: Register Admin User" -ForegroundColor Green
$registerBody = @{
    email = "admin@test.com"
    password = "123456"
    fullName = "Admin Test"
    phone = "0123456789"
    role = "admin"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    $registerResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Login
Write-Host "Test 3: Login" -ForegroundColor Green
$loginBody = @{
    email = "admin@test.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $loginResponse | ConvertTo-Json -Depth 10
    $token = $loginResponse.data.token
    Write-Host "Token: $token" -ForegroundColor Blue
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Properties (Public)
Write-Host "Test 4: Get Properties List (Public)" -ForegroundColor Green
try {
    $propertiesResponse = Invoke-RestMethod -Uri "$BaseUrl/properties?page=0&size=5" -Method Get
    $propertiesResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: Create Property (with token)
if ($token) {
    Write-Host "Test 5: Create New Property (Admin)" -ForegroundColor Green
    $propertyBody = @{
        title = "Căn hộ test API"
        description = "Căn hộ được tạo từ test script"
        propertyType = "apartment"
        province = "Hà Nội"
        district = "Cầu Giấy"
        area = 75.5
        price = 3500000000
        images = @(
            @{
                url = "https://picsum.photos/800/600?random=100"
                isPrimary = $true
            },
            @{
                url = "https://picsum.photos/800/600?random=101"
                isPrimary = $false
            }
        )
    } | ConvertTo-Json -Depth 10

    try {
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        $createResponse = Invoke-RestMethod -Uri "$BaseUrl/properties" -Method Post -Body $propertyBody -Headers $headers
        $createResponse | ConvertTo-Json -Depth 10
        $propertyId = $createResponse.data.propertyId
        Write-Host "Created Property ID: $propertyId" -ForegroundColor Blue
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
    Write-Host ""

    # Test 6: Get Property Detail
    if ($propertyId) {
        Write-Host "Test 6: Get Property Detail" -ForegroundColor Green
        try {
            $propertyDetail = Invoke-RestMethod -Uri "$BaseUrl/properties/$propertyId" -Method Get
            $propertyDetail | ConvertTo-Json -Depth 10
        } catch {
            Write-Host "Error: $_" -ForegroundColor Red
        }
        Write-Host ""
    }
}

# Test 7: Search Properties
Write-Host "Test 7: Search Properties (by province)" -ForegroundColor Green
try {
    $searchResponse = Invoke-RestMethod -Uri "$BaseUrl/properties?province=Hà Nội&page=0&size=5" -Method Get
    $searchResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 8: Register Broker
Write-Host "Test 8: Register Broker User" -ForegroundColor Green
$brokerBody = @{
    email = "broker@test.com"
    password = "123456"
    fullName = "Broker Test"
    phone = "0987654321"
    role = "broker"
} | ConvertTo-Json

try {
    $brokerResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/register" -Method Post -Body $brokerBody -ContentType "application/json"
    $brokerResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# Test 9: Register Customer
Write-Host "Test 9: Register Customer User" -ForegroundColor Green
$customerBody = @{
    email = "customer@test.com"
    password = "123456"
    fullName = "Customer Test"
    phone = "0909123456"
    role = "customer"
} | ConvertTo-Json

try {
    $customerResponse = Invoke-RestMethod -Uri "$BaseUrl/auth/register" -Method Post -Body $customerBody -ContentType "application/json"
    $customerResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Blue
Write-Host "All Tests Completed!" -ForegroundColor Blue
Write-Host "========================================" -ForegroundColor Blue
