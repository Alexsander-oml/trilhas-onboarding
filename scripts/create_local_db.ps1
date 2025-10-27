param(
    [string]$DBName = "onboarding",
    [string]$DBUser = "postgres",
    [string]$DBPassword = "admin",
    [string]$AdminPassword = $null, # password for existing superuser if needed
    [string]$PSQLPath = $null,
    [string]$ServiceName = $null,
    [int]$Port = 5432,
    [string]$DBHost = 'localhost'
)

function Find-PSQL {
    param()
    # try Get-Command
    $cmd = Get-Command psql -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }

    # search common Program Files paths
    $possible = @("C:\Program Files\PostgreSQL\*\bin\psql.exe","C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe")
    foreach ($p in $possible) {
        $found = Get-ChildItem -Path $p -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) { return $found.FullName }
    }
    return $null
}

function Find-PostgresService {
    # heuristic: find a service with name or display name containing 'postgres'
    $s = Get-Service | Where-Object { ($_.Name -like '*postgres*') -or ($_.DisplayName -like '*PostgreSQL*') } | Select-Object -First 1
    return $s
}

if (-not $PSQLPath) {
    $PSQLPath = Find-PSQL
}

if (-not $PSQLPath) {
    Write-Host "psql not found in PATH or common locations. Please install PostgreSQL or provide -PSQLPath path to psql.exe." -ForegroundColor Yellow
    exit 2
}

Write-Host "Using psql at: $PSQLPath"

# Start service if necessary
if (-not $ServiceName) {
    $svc = Find-PostgresService
    if ($svc) { $ServiceName = $svc.Name }
}

if ($ServiceName) {
    $s = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($s) {
        if ($s.Status -ne 'Running') {
            Write-Host "Starting PostgreSQL service '$ServiceName'..."
            try {
                Start-Service -Name $ServiceName -ErrorAction Stop
                Write-Host "Service started."
            } catch {
                Write-Host "Failed to start service '$ServiceName'. Try running PowerShell as Administrator." -ForegroundColor Red
                Write-Host $_.Exception.Message -ForegroundColor Red
            }
        } else {
            Write-Host "PostgreSQL service '$ServiceName' is already running."
        }
    }
} else {
    Write-Host "Could not auto-detect a PostgreSQL Windows service. If PostgreSQL is installed as a service, provide -ServiceName 'postgresql-x64-14' or similar." -ForegroundColor Yellow
}

# Helper to run psql with provided SQL
function Run-SQL($sql) {
    $env:PGPASSWORD = $AdminPassword
    try {
    & "$PSQLPath" -h $DBHost -p $Port -U postgres -c $sql
        $rc = $LASTEXITCODE
        if ($rc -ne 0) {
            Write-Host "psql returned exit code $rc" -ForegroundColor Red
        }
    } finally {
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    }
}

# Create DB
Write-Host "Creating database '$DBName' (if not exists)..."
# Safe create: check exists first
$checkDb = "SELECT 1 FROM pg_database WHERE datname='$DBName';"
 $exists = & "$PSQLPath" -h $DBHost -p $Port -U postgres -t -c $checkDb 2>$null | ForEach-Object { $_.Trim() } 
if ($exists -eq '1') {
    Write-Host "Database '$DBName' already exists." -ForegroundColor Cyan
} else {
    Write-Host "Running CREATE DATABASE..."
    $createDbSql = 'CREATE DATABASE "' + $DBName + '";'
    $env:PGPASSWORD = $AdminPassword
    try {
    & "$PSQLPath" -h $DBHost -p $Port -U postgres -c $createDbSql
        if ($LASTEXITCODE -eq 0) { Write-Host "Database created." -ForegroundColor Green } else { Write-Host "Failed to create database." -ForegroundColor Red }
    } finally { Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue }
}

# Create or alter user
Write-Host "Creating/altering user '$DBUser'..."
$createUserSql = 'DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = ''' + $DBUser + ''') THEN CREATE ROLE "' + $DBUser + '" WITH LOGIN PASSWORD ''' + $DBPassword + '''; ELSE ALTER ROLE "' + $DBUser + '" WITH PASSWORD ''' + $DBPassword + '''; END IF; END $$;'
$env:PGPASSWORD = $AdminPassword
try {
    & "$PSQLPath" -h $DBHost -p $Port -U postgres -c $createUserSql
    if ($LASTEXITCODE -eq 0) { Write-Host "User created/updated." -ForegroundColor Green } else { Write-Host "Failed to create/alter user." -ForegroundColor Red }
} finally { Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue }

# Grant privileges
Write-Host "Granting privileges on database '$DBName' to '$DBUser'..."
$grantSql = 'GRANT ALL PRIVILEGES ON DATABASE "' + $DBName + '" TO "' + $DBUser + '";'
$env:PGPASSWORD = $AdminPassword
try {
    & "$PSQLPath" -h $DBHost -p $Port -U postgres -c $grantSql
    if ($LASTEXITCODE -eq 0) { Write-Host "Privileges granted." -ForegroundColor Green } else { Write-Host "Failed to grant privileges." -ForegroundColor Yellow }
} finally { Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue }

Write-Host "Done. If there were errors, please inspect the messages above. If authentication failed, try running this script with -AdminPassword '<postgres_superuser_password>' or run with a PostgreSQL superuser local connection." -ForegroundColor Cyan

# Close any accidentally opened block comment
#>
