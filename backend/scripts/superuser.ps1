# Superuser Management Script for Personal Finance Tracker
# Usage: .\superuser.ps1 [action] [options]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("create", "list", "delete", "help")]
    [string]$Action,
    
    [string]$Email,
    [string]$Password,
    [string]$FirstName,
    [string]$LastName
)

function Show-Help {
    Write-Host "Personal Finance Tracker - Superuser Management" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\superuser.ps1 <action> [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Green
    Write-Host "  create  - Create a new superuser account"
    Write-Host "  list    - List all superuser accounts"
    Write-Host "  delete  - Delete a superuser account"
    Write-Host "  help    - Show this help message"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Green
    Write-Host "  -Email       Email address for the superuser"
    Write-Host "  -Password    Password for the superuser"
    Write-Host "  -FirstName   First name of the superuser"
    Write-Host "  -LastName    Last name of the superuser"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\superuser.ps1 create"
    Write-Host "  .\superuser.ps1 create -Email admin@example.com -Password AdminPass123! -FirstName Admin -LastName User"
    Write-Host "  .\superuser.ps1 list"
    Write-Host "  .\superuser.ps1 delete -Email admin@example.com"
    Write-Host ""
}

function Test-NodeModules {
    if (-not (Test-Path "node_modules")) {
        Write-Host "node_modules not found. Please run 'npm install' first." -ForegroundColor Red
        exit 1
    }
}

function Test-EnvironmentFile {
    if (-not (Test-Path ".env")) {
        Write-Host ".env file not found. Please create one based on env.example" -ForegroundColor Red
        exit 1
    }
}

function Invoke-SuperuserScript {
    param(
        [string]$Action,
        [string]$Email,
        [string]$Password,
        [string]$FirstName,
        [string]$LastName
    )
    
    Write-Host "Managing superuser accounts: $Action" -ForegroundColor Cyan
    Write-Host ""
    
    $arguments = @("scripts/create-superuser.ts", $Action)
    
    if ($Email) { $arguments += $Email }
    if ($Password) { $arguments += $Password }
    if ($FirstName) { $arguments += $FirstName }
    if ($LastName) { $arguments += $LastName }
    
    try {
        $command = "npx ts-node " + ($arguments -join " ")
        Invoke-Expression $command
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Operation completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "Operation failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            exit $LASTEXITCODE
        }
    } catch {
        Write-Host "Error running superuser script: $_" -ForegroundColor Red
        exit 1
    }
}

# Main execution
if ($Action -eq "help") {
    Show-Help
    exit 0
}

# Validate environment
Test-NodeModules
Test-EnvironmentFile

# Execute the appropriate action
switch ($Action) {
    "create" {
        Invoke-SuperuserScript -Action "create" -Email $Email -Password $Password -FirstName $FirstName -LastName $LastName
    }
    "list" {
        Invoke-SuperuserScript -Action "list"
    }
    "delete" {
        if (-not $Email) {
            Write-Host "Email is required for delete action" -ForegroundColor Red
            exit 1
        }
        Invoke-SuperuserScript -Action "delete" -Email $Email
    }
    default {
        Write-Host "Invalid action: $Action" -ForegroundColor Red
        Show-Help
        exit 1
    }
}