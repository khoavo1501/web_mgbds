param(
    [int]$DockerTimeoutSeconds = 120,
    [int]$DbTimeoutSeconds = 60
)

$ErrorActionPreference = "Stop"

function Write-Step($Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-DockerReady {
    try {
        docker info *> $null
        return $LASTEXITCODE -eq 0
    } catch {
        return $false
    }
}

function Test-TcpPortOpen($HostName, $Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $result = $client.BeginConnect($HostName, $Port, $null, $null)
        if (-not $result.AsyncWaitHandle.WaitOne(1000, $false)) {
            return $false
        }
        $client.EndConnect($result)
        return $true
    } catch {
        return $false
    } finally {
        $client.Close()
    }
}

function Import-DotEnv($Path) {
    if (-not (Test-Path $Path)) {
        return
    }

    Write-Step "Loading backend environment"
    foreach ($rawLine in Get-Content $Path) {
        $line = $rawLine.Trim()
        if (-not $line -or $line.StartsWith("#")) {
            continue
        }

        $key, $value = $line -split "=", 2
        if (-not $key) {
            continue
        }

        [Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), "Process")
    }
    Write-Host "Loaded .env." -ForegroundColor Green
}

Set-Location $PSScriptRoot
Import-DotEnv (Join-Path $PSScriptRoot ".env")

Write-Step "Checking Docker"
if (-not (Test-DockerReady)) {
    $dockerDesktop = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerDesktop) {
        Write-Host "Docker is not ready. Starting Docker Desktop..."
        Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
    } else {
        throw "Docker is not ready and Docker Desktop was not found at $dockerDesktop"
    }

    $deadline = (Get-Date).AddSeconds($DockerTimeoutSeconds)
    while (-not (Test-DockerReady)) {
        if ((Get-Date) -gt $deadline) {
            throw "Timed out waiting for Docker. Open Docker Desktop manually, then run this script again."
        }
        Start-Sleep -Seconds 3
    }
}
Write-Host "Docker is ready." -ForegroundColor Green

Write-Step "Starting PostgreSQL container"
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    throw "docker compose up -d failed."
}

Write-Step "Waiting for PostgreSQL"
$deadline = (Get-Date).AddSeconds($DbTimeoutSeconds)
do {
    docker exec mgbds_postgres pg_isready -U postgres -d mgbds_db *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL is ready." -ForegroundColor Green
        break
    }

    if ((Get-Date) -gt $deadline) {
        throw "Timed out waiting for PostgreSQL container."
    }
    Start-Sleep -Seconds 2
} while ($true)

Write-Step "Running Spring Boot backend"
Write-Host "Backend URL: http://localhost:8080" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the backend." -ForegroundColor Yellow

if (Test-TcpPortOpen "localhost" 8080) {
    Write-Host "Port 8080 is already in use. Backend may already be running." -ForegroundColor Yellow
    Write-Host "Open http://localhost:8080 or stop the current process before running this script again." -ForegroundColor Yellow
    exit 0
}

mvn spring-boot:run
