# Mock Data Management Script for Personal Finance Tracker
# Usage: .\mock-data.ps1 [action] [options]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("insert", "clear", "reset", "help")]
    [string]$Action,
    
    [int]$UserCount = 3,
    [int]$TransactionCount = 100,
    [int]$BudgetCount = 5,
    [int]$CategoryCount = 20
)

function Show-Help {
    Write-Host "Personal Finance Tracker - Mock Data Management" -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\mock-data.ps1 <action> [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor Green
    Write-Host "  insert  - Insert mock data into the database"
    Write-Host "  clear   - Clear all data from the database"
    Write-Host "  reset   - Clear database and insert fresh mock data"
    Write-Host "  help    - Show this help message"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Green
    Write-Host "  -UserCount        Number of users to create (default: 3)"
    Write-Host "  -TransactionCount Number of transactions per user (default: 100)"
    Write-Host "  -BudgetCount      Number of budgets per user (default: 5)"
    Write-Host "  -CategoryCount    Number of categories per user (default: 20)"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\mock-data.ps1 insert"
    Write-Host "  .\mock-data.ps1 clear"
    Write-Host "  .\mock-data.ps1 reset -UserCount 5 -TransactionCount 200"
    Write-Host ""
}

function Test-NodeModules {
    if (-not (Test-Path "node_modules")) {
        Write-Host "❌ node_modules not found. Please run 'npm install' first." -ForegroundColor Red
        exit 1
    }
}

function Test-EnvironmentFile {
    if (-not (Test-Path ".env")) {
        Write-Host "❌ .env file not found. Please create one based on env.example" -ForegroundColor Red
        exit 1
    }
}

function Invoke-MockDataScript {
    param(
        [string]$Action,
        [int]$UserCount,
        [int]$TransactionCount,
        [int]$BudgetCount,
        [int]$CategoryCount
    )
    
    Write-Host "🚀 Starting mock data operation: $Action" -ForegroundColor Cyan
    Write-Host "   Users: $UserCount" -ForegroundColor Gray
    Write-Host "   Transactions per user: $TransactionCount" -ForegroundColor Gray
    Write-Host "   Budgets per user: $BudgetCount" -ForegroundColor Gray
    Write-Host "   Categories per user: $CategoryCount" -ForegroundColor Gray
    Write-Host ""
    
    $arguments = @(
        "scripts/mock-data.ts",
        $Action,
        $UserCount.ToString(),
        $TransactionCount.ToString(),
        $BudgetCount.ToString(),
        $CategoryCount.ToString()
    )
    
    try {
        & npx ts-node @arguments
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Operation completed successfully!" -ForegroundColor Green
        } else {
            Write-Host "❌ Operation failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            exit $LASTEXITCODE
        }
    } catch {
        Write-Host "❌ Error running mock data script: $_" -ForegroundColor Red
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
    "insert" {
        Invoke-MockDataScript -Action "insert" -UserCount $UserCount -TransactionCount $TransactionCount -BudgetCount $BudgetCount -CategoryCount $CategoryCount
    }
    "clear" {
        Invoke-MockDataScript -Action "clear" -UserCount $UserCount -TransactionCount $TransactionCount -BudgetCount $BudgetCount -CategoryCount $CategoryCount
    }
    "reset" {
        Invoke-MockDataScript -Action "both" -UserCount $UserCount -TransactionCount $TransactionCount -BudgetCount $BudgetCount -CategoryCount $CategoryCount
    }
    default {
        Write-Host "❌ Invalid action: $Action" -ForegroundColor Red
        Show-Help
        exit 1
    }
}









