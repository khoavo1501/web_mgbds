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

function Wait-DockerReady {
    if (Test-DockerReady) {
        Write-Host "Docker is ready." -ForegroundColor Green
        return
    }

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

    Write-Host "Docker is ready." -ForegroundColor Green
}

function Wait-PostgresReady {
    $deadline = (Get-Date).AddSeconds($DbTimeoutSeconds)
    do {
        docker exec mgbds_postgres pg_isready -U postgres -d mgbds_db *> $null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "PostgreSQL is ready." -ForegroundColor Green
            return
        }

        if ((Get-Date) -gt $deadline) {
            throw "Timed out waiting for PostgreSQL container."
        }
        Start-Sleep -Seconds 2
    } while ($true)
}

function Invoke-SqlFile($Path) {
    if (-not (Test-Path $Path)) {
        throw "SQL file not found: $Path"
    }

    Write-Host "Running $Path"
    $containerDir = "/tmp/mgbds-init"
    $containerPath = "$containerDir/$([System.IO.Path]::GetFileName($Path))"

    docker exec mgbds_postgres mkdir -p $containerDir
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create SQL temp directory in container."
    }

    docker cp $Path "mgbds_postgres:$containerPath"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to copy SQL file into container: $Path"
    }

    docker exec -e PGCLIENTENCODING=UTF8 mgbds_postgres psql -v ON_ERROR_STOP=1 -U postgres -d mgbds_db -f $containerPath

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to run SQL file: $Path"
    }
}

Set-Location $PSScriptRoot

Write-Step "Checking Docker"
Wait-DockerReady

Write-Step "Removing existing PostgreSQL container and volume"
docker compose down -v --remove-orphans
if ($LASTEXITCODE -ne 0) {
    throw "docker compose down -v failed."
}

Write-Step "Creating fresh PostgreSQL container"
docker compose up -d
if ($LASTEXITCODE -ne 0) {
    throw "docker compose up -d failed."
}

Write-Step "Waiting for PostgreSQL"
Wait-PostgresReady

Write-Step "Running schema and data"
Invoke-SqlFile (Join-Path $PSScriptRoot "sql\bds.sql")

Write-Step "Database initialized"
docker exec mgbds_postgres psql -U postgres -d mgbds_db -c "select 'users' as table_name, count(*) from users union all select 'properties', count(*) from properties union all select 'appointments', count(*) from appointments union all select 'categories', count(*) from categories order by table_name;"
