# Superuser Management Scripts

This directory contains scripts for managing superuser accounts in the Personal Finance Tracker application.

## Overview

The superuser scripts allow you to:
- Create superuser accounts with administrative privileges
- List all superuser accounts in the database
- Delete superuser accounts
- Manage user roles and permissions

## Scripts Available

### 1. TypeScript Script (`create-superuser.ts`)
The main script that handles all superuser operations.

### 2. PowerShell Script (`superuser.ps1`)
A PowerShell wrapper for easier usage on Windows systems.

### 3. Batch Script (`superuser.bat`)
A simple batch file for Windows command prompt users.

## User Roles

The application supports three user roles:

- **USER** - Regular user with standard permissions
- **ADMIN** - Administrative user with elevated permissions
- **SUPERUSER** - Superuser with full system access

## Usage

### Using npm scripts (Recommended)

```bash
# Create a superuser (interactive mode)
npm run superuser:create

# List all superusers
npm run superuser:list

# Create superuser with command line arguments
npx ts-node scripts/create-superuser.ts create admin@example.com AdminPass123! Admin User

# List superusers
npx ts-node scripts/create-superuser.ts list

# Delete a superuser
npx ts-node scripts/create-superuser.ts delete admin@example.com
```

### Using PowerShell (Windows)

```powershell
# Interactive superuser creation
.\scripts\superuser.ps1 create

# Create superuser with parameters
.\scripts\superuser.ps1 create -Email admin@example.com -Password AdminPass123! -FirstName Admin -LastName User

# List all superusers
.\scripts\superuser.ps1 list

# Delete a superuser
.\scripts\superuser.ps1 delete -Email admin@example.com
```

### Using Batch File (Windows)

```cmd
# Interactive superuser creation
scripts\superuser.bat create

# Create superuser with parameters
scripts\superuser.bat create admin@example.com AdminPass123! Admin User

# List all superusers
scripts\superuser.bat list

# Delete a superuser
scripts\superuser.bat delete admin@example.com
```

### Direct TypeScript execution

```bash
# Interactive mode
npx ts-node scripts/create-superuser.ts create

# Non-interactive mode
npx ts-node scripts/create-superuser.ts create admin@example.com AdminPass123! Admin User

# List superusers
npx ts-node scripts/create-superuser.ts list

# Delete superuser
npx ts-node scripts/create-superuser.ts delete admin@example.com
```

## Parameters

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `action` | Action to perform: `create`, `list`, `delete`, `help` | Yes | `create` |
| `email` | Email address for the superuser | For create/delete | `admin@example.com` |
| `password` | Password for the superuser | For create | `AdminPass123!` |
| `firstName` | First name of the superuser | For create | `Admin` |
| `lastName` | Last name of the superuser | For create | `User` |

## Interactive Mode

When you run the create command without providing all parameters, the script will prompt you for the missing information:

```
🔐 Creating Superuser Account
============================

Email: admin@example.com
Password: ********
Confirm Password: ********
First Name: Admin
Last Name: User

✅ Superuser created successfully!
================================
📧 Email: admin@example.com
👤 Name: Admin User
🔑 Role: superuser
⭐ Superuser: Yes
🆔 User ID: 68d6fb083447bf459f6279b0
```

## Password Requirements

Superuser passwords must meet the following criteria:
- At least 8 characters long
- Contains at least one letter
- Contains at least one number
- Contains at least one special character

## Security Features

### Password Input
- Passwords are hidden during input (shows asterisks)
- Passwords are confirmed before account creation
- Passwords are hashed using bcrypt with salt rounds of 12

### Email Validation
- Email format validation using regex
- Email uniqueness check before creation
- Email case normalization (converted to lowercase)

### Role Management
- Automatic role assignment (SUPERUSER)
- Superuser flag setting (isSuperuser: true)
- Role-based access control support

## Database Schema

The User model includes the following fields for role management:

```typescript
interface IUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role: UserRole;           // 'user' | 'admin' | 'superuser'
  isSuperuser: boolean;     // true for superusers
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Prerequisites

1. **Node.js and npm** installed
2. **MongoDB** running and accessible
3. **Environment variables** configured (see `.env.example`)
4. **Dependencies** installed (`npm install`)

## Environment Setup

Make sure your `.env` file contains the correct MongoDB connection details:

```env
MONGO_URI=mongodb://username:password@localhost:27017/database_name?authSource=admin
# OR
MONGO_ROOT_USERNAME=your_username
MONGO_ROOT_PASSWORD=your_password
MONGO_DATABASE=your_database_name
```

## Troubleshooting

### Common Issues

1. **Connection Error**
   - Ensure MongoDB is running
   - Check your connection string in `.env`
   - Verify credentials are correct

2. **Permission Denied (PowerShell)**
   - Run PowerShell as Administrator
   - Or change execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

3. **Module Not Found**
   - Run `npm install` to install dependencies
   - Ensure you're in the correct directory (`finance-tracker/backend`)

4. **Email Already Exists**
   - The email address is already in use
   - Use a different email address
   - Or delete the existing user first

5. **Password Validation Failed**
   - Ensure password meets all requirements
   - Check for special characters, numbers, and letters
   - Ensure password is at least 8 characters long

### Logs

The script provides detailed logging:
- ✅ Success messages (green)
- ❌ Error messages (red)
- 🔐 Security-related messages (cyan)
- 📊 Information messages (gray)

## Examples

### Quick Start
```bash
# Create your first superuser
npm run superuser:create
```

### Development Setup
```bash
# Create multiple superusers for testing
npx ts-node scripts/create-superuser.ts create admin1@example.com AdminPass123! Admin One
npx ts-node scripts/create-superuser.ts create admin2@example.com AdminPass123! Admin Two
```

### Production Setup
```bash
# Create production superuser
npx ts-node scripts/create-superuser.ts create admin@yourcompany.com SecurePass123! Production Admin
```

### Cleanup
```bash
# List all superusers
npm run superuser:list

# Delete a specific superuser
npx ts-node scripts/create-superuser.ts delete admin@example.com
```

## Integration with Authentication

The superuser accounts created with these scripts can be used with your authentication system:

```typescript
// Example: Check if user is superuser
const user = await User.findById(userId);
if (user.isSuperuser) {
  // Grant superuser privileges
}

// Example: Check user role
if (user.role === UserRole.SUPERUSER) {
  // Grant superuser privileges
}
```

## Security Best Practices

1. **Use Strong Passwords**: Always use complex passwords for superuser accounts
2. **Limit Superuser Count**: Only create superuser accounts when necessary
3. **Regular Audits**: Periodically review superuser accounts
4. **Secure Storage**: Store superuser credentials securely
5. **Access Logging**: Implement logging for superuser actions
6. **Role Separation**: Use different roles for different privilege levels

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your environment setup
3. Check the console output for specific error messages
4. Ensure all dependencies are properly installed
5. Verify MongoDB connection and permissions









