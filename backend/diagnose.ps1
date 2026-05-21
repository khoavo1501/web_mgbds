Write-Host "=== DIAGNOSING BACKEND ISSUES ===" -ForegroundColor Cyan

# Check Java version
Write-Host "`n1. Checking Java version..." -ForegroundColor Yellow
java -version

# Check Maven version
Write-Host "`n2. Checking Maven version..." -ForegroundColor Yellow
mvn -version

# Check PostgreSQL service
Write-Host "`n3. Checking PostgreSQL service..." -ForegroundColor Yellow
Get-Service -Name postgresql* -ErrorAction SilentlyContinue

# Try to compile
Write-Host "`n4. Attempting to compile..." -ForegroundColor Yellow
mvn clean compile -e

Write-Host "`n=== DIAGNOSIS COMPLETE ===" -ForegroundColor Cyan
Write-Host "Please copy the error messages above and send to me." -ForegroundColor Green
