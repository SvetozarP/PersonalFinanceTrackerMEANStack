@echo off
REM Superuser Management Script for Personal Finance Tracker
REM Usage: superuser.bat [action] [email] [password] [firstName] [lastName]

if "%1"=="" goto :help
if "%1"=="help" goto :help
if "%1"=="create" goto :create
if "%1"=="list" goto :list
if "%1"=="delete" goto :delete

echo ❌ Invalid action: %1
goto :help

:help
echo Personal Finance Tracker - Superuser Management
echo ===============================================
echo.
echo Usage: superuser.bat ^<action^> [options]
echo.
echo Actions:
echo   create  - Create a new superuser account
echo   list    - List all superuser accounts
echo   delete  - Delete a superuser account
echo   help    - Show this help message
echo.
echo Options:
echo   email       Email address for the superuser
echo   password    Password for the superuser
echo   firstName   First name of the superuser
echo   lastName    Last name of the superuser
echo.
echo Examples:
echo   superuser.bat create
echo   superuser.bat create admin@example.com AdminPass123! Admin User
echo   superuser.bat list
echo   superuser.bat delete admin@example.com
echo.
goto :end

:create
echo 🔐 Creating superuser account...
npx ts-node scripts/create-superuser.ts create %2 %3 %4 %5
goto :end

:list
echo 👑 Listing superuser accounts...
npx ts-node scripts/create-superuser.ts list
goto :end

:delete
if "%2"=="" (
    echo ❌ Email is required for delete action
    goto :end
)
echo 🗑️ Deleting superuser account...
npx ts-node scripts/create-superuser.ts delete %2
goto :end

:end










