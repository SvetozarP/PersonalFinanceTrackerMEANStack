@echo off
REM Mock Data Management Script for Personal Finance Tracker
REM Usage: mock-data.bat [action] [userCount] [transactionCount] [budgetCount] [categoryCount]

if "%1"=="" goto :help
if "%1"=="help" goto :help
if "%1"=="insert" goto :insert
if "%1"=="clear" goto :clear
if "%1"=="reset" goto :reset

echo ❌ Invalid action: %1
goto :help

:help
echo Personal Finance Tracker - Mock Data Management
echo ===============================================
echo.
echo Usage: mock-data.bat ^<action^> [options]
echo.
echo Actions:
echo   insert  - Insert mock data into the database
echo   clear   - Clear all data from the database
echo   reset   - Clear database and insert fresh mock data
echo   help    - Show this help message
echo.
echo Options:
echo   userCount        Number of users to create (default: 3)
echo   transactionCount Number of transactions per user (default: 100)
echo   budgetCount      Number of budgets per user (default: 5)
echo   categoryCount    Number of categories per user (default: 20)
echo.
echo Examples:
echo   mock-data.bat insert
echo   mock-data.bat clear
echo   mock-data.bat reset 5 200 10 30
echo.
goto :end

:insert
echo 🚀 Inserting mock data...
npx ts-node scripts/mock-data.ts insert %2 %3 %4 %5
goto :end

:clear
echo 🧹 Clearing database...
npx ts-node scripts/mock-data.ts clear %2 %3 %4 %5
goto :end

:reset
echo 🔄 Resetting database with fresh mock data...
npx ts-node scripts/mock-data.ts both %2 %3 %4 %5
goto :end

:end










