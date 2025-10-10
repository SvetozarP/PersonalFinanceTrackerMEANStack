# User Deletion Script for Personal Finance Tracker
# Usage: .\delete-user.ps1 [action] [identifier] [options]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("delete", "list", "delete-all", "help")]
    [string]$Action,
    
    [string]$Identifier,
    [switch]$Force
)

function Show-Help {
    Write-Host "Personal Finance Tracker - User Management" -ForegroundColor Cyan
    Write-Host "==========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\delete-user.ps1 <action> [identifier] [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Green
    Write-Host "  delete      - Delete a specific user"
    Write-Host "  list        - List all users"
    Write-Host "  delete-all  - Delete ALL users (DANGEROUS)"
    Write-Host "  help        - Show this help message"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Green
    Write-Host "  -Identifier  Email or user ID to delete"
    Write-Host "  -Force       Skip confirmation prompts"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\delete-user.ps1 list"
    Write-Host "  .\delete-user.ps1 delete -Identifier admin@example.com"
    Write-Host "  .\delete-user.ps1 delete -Identifier 507f1f77bcf86cd799439011"
    Write-Host "  .\delete-user.ps1 delete -Identifier admin@example.com -Force"
    Write-Host "  .\delete-user.ps1 delete-all -Force"
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

function Invoke-DeleteUserScript {
    param(
        [string]$Action,
        [string]$Identifier,
        [switch]$Force
    )
    
    Write-Host "Managing users: $Action" -ForegroundColor Cyan
    Write-Host ""
    
    $arguments = @("scripts/delete-user.ts", $Action)
    
    if ($Identifier) { $arguments += $Identifier }
    if ($Force) { $arguments += "--force" }
    
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
        Write-Host "Error running delete user script: $_" -ForegroundColor Red
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
    "delete" {
        Invoke-DeleteUserScript -Action "delete" -Identifier $Identifier -Force:$Force
    }
    "list" {
        Invoke-DeleteUserScript -Action "list"
    }
    "delete-all" {
        Invoke-DeleteUserScript -Action "delete-all" -Force:$Force
    }
    default {
        Write-Host "Invalid action: $Action" -ForegroundColor Red
        Show-Help
        exit 1
    }
}




