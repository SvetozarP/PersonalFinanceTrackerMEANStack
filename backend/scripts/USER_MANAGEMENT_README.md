# User Management Scripts

This directory contains scripts for managing users in the Personal Finance Tracker application.

## Overview

The user management scripts allow you to:
- List all users in the database
- Delete specific users and all their associated data
- Delete all users (dangerous operation)
- Manage user accounts safely with confirmation prompts

## Scripts Available

### 1. TypeScript Script (`delete-user.ts`)
The main script that handles all user management operations.

### 2. PowerShell Script (`delete-user.ps1`)
A PowerShell wrapper for easier usage on Windows systems.

## Usage

### Using npm scripts (Recommended)

```bash
# List all users
npm run user:list

# Delete a specific user (interactive)
npm run user:delete

# Delete all users (DANGEROUS)
npm run user:delete-all
```

### Using PowerShell (Windows)

```powershell
# List all users
.\scripts\delete-user.ps1 list

# Delete a specific user
.\scripts\delete-user.ps1 delete -Identifier admin@example.com

# Delete with force (no confirmation)
.\scripts\delete-user.ps1 delete -Identifier admin@example.com -Force

# Delete all users (DANGEROUS)
.\scripts\delete-user.ps1 delete-all -Force
```

### Direct TypeScript execution

```bash
# List all users
npx ts-node scripts/delete-user.ts list

# Delete a specific user by email
npx ts-node scripts/delete-user.ts delete admin@example.com

# Delete a specific user by ID
npx ts-node scripts/delete-user.ts delete 507f1f77bcf86cd799439011

# Delete with force (no confirmation)
npx ts-node scripts/delete-user.ts delete admin@example.com --force

# Delete all users (DANGEROUS)
npx ts-node scripts/delete-user.ts delete-all --force
```

## Parameters

| Parameter | Description | Required | Example |
|-----------|-------------|----------|---------|
| `action` | Action to perform: `delete`, `list`, `delete-all`, `help` | Yes | `delete` |
| `identifier` | Email address or user ID to delete | For delete | `admin@example.com` |
| `--force` | Skip confirmation prompts | No | `--force` |

## Safety Features

### Confirmation Prompts
- **Single User Deletion**: Shows user details and data counts before deletion
- **All Users Deletion**: Requires typing "DELETE ALL" to confirm
- **Force Flag**: Bypasses all confirmation prompts

### Data Deletion
When a user is deleted, **ALL** associated data is also deleted:
- User account
- Categories
- Transactions
- Budgets

### User Information Display
Before deletion, the script shows:
- User name and email
- User role and superuser status
- Count of associated data (categories, transactions, budgets)

## Examples

### List Users
```bash
npm run user:list
```
Output:
```
👥 Users in Database
==================
1. Jane Smith
   📧 Email: jane.smith@example.com
   🔑 Role: user
   ⭐ Superuser: No
   📅 Created: 26/09/2025
   🆔 ID: 68d6fa11c8ad2585ae5bdc60

2. admin admin
   📧 Email: admin@example.com
   🔑 Role: superuser
   ⭐ Superuser: Yes
   📅 Created: 26/09/2025
   🆔 ID: 68d6fe345d9ba6cbc37d20a3
```

### Delete a User
```bash
npm run user:delete
```
Interactive prompt:
```
🗑️  Delete User Account
======================

👥 Users in Database
==================
1. Jane Smith (jane.smith@example.com)
2. admin admin (admin@example.com)

Enter email or user ID to delete: admin@example.com

⚠️  User Deletion Warning
=========================
👤 User: admin admin (admin@example.com)
🔑 Role: superuser
⭐ Superuser: Yes

📊 Associated Data:
   📁 Categories: 16
   💰 Transactions: 100
   📊 Budgets: 5

Are you sure you want to delete this user and ALL their data? (y/N): y

✅ User deleted successfully!
============================
👤 Deleted: admin admin (admin@example.com)
📁 Categories deleted: 16
💰 Transactions deleted: 100
📊 Budgets deleted: 5
```

### Delete All Users (DANGEROUS)
```bash
npm run user:delete-all
```
Interactive prompt:
```
⚠️  DANGER: Delete ALL Users
============================
Found 3 users:
  1. Jane Smith (jane.smith@example.com)
  2. Bob Wilson (bob.wilson@example.com)
  3. admin admin (admin@example.com)

Are you sure you want to delete ALL users and ALL their data? (type "DELETE ALL" to confirm): DELETE ALL

✅ All users deleted successfully!
==================================
👥 Users deleted: 3
📁 All categories deleted
💰 All transactions deleted
📊 All budgets deleted
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

## Safety Warnings

### ⚠️ Important Safety Notes

1. **Irreversible Operation**: User deletion is permanent and cannot be undone
2. **Data Loss**: All user data (categories, transactions, budgets) will be deleted
3. **No Backup**: The script does not create backups before deletion
4. **Superuser Deletion**: You can delete superuser accounts, but this may affect system access

### 🛡️ Best Practices

1. **Backup First**: Always backup your database before mass deletions
2. **Test Environment**: Test user deletion in a development environment first
3. **Verify Users**: Use `npm run user:list` to verify users before deletion
4. **Force Flag**: Only use `--force` in automated scripts, never interactively
5. **Superuser Care**: Be careful when deleting superuser accounts

## Troubleshooting

### Common Issues

1. **Connection Error**
   - Ensure MongoDB is running
   - Check your connection string in `.env`
   - Verify credentials are correct

2. **User Not Found**
   - Verify the email address or user ID
   - Use `npm run user:list` to see available users
   - Check for typos in the identifier

3. **Permission Denied (PowerShell)**
   - Run PowerShell as Administrator
   - Or change execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

4. **Module Not Found**
   - Run `npm install` to install dependencies
   - Ensure you're in the correct directory (`finance-tracker/backend`)

### Logs

The script provides detailed logging:
- ✅ Success messages (green)
- ❌ Error messages (red)
- ⚠️ Warning messages (yellow)
- 📊 Information messages (gray)

## Integration with Mock Data

The user management scripts work seamlessly with the mock data scripts:

1. **Create Users**: Use superuser script to create users
2. **Generate Mock Data**: Use mock data script to populate data for existing users
3. **Delete Users**: Use user deletion script to remove users and their data
4. **Clean Slate**: Delete all users to start fresh

### Workflow Example

```bash
# 1. Create a superuser
npm run superuser:create

# 2. Generate mock data for the user
npm run mock-data:insert

# 3. List users to see what was created
npm run user:list

# 4. Delete a specific user if needed
npm run user:delete

# 5. Or delete all users to start fresh
npm run user:delete-all
```

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your environment setup
3. Check the console output for specific error messages
4. Ensure all dependencies are properly installed
5. Verify MongoDB connection and permissions

## Security Considerations

- **Database Access**: Ensure only authorized personnel can run these scripts
- **Backup Strategy**: Implement regular database backups before user deletions
- **Audit Trail**: Consider logging user deletion operations for audit purposes
- **Access Control**: Restrict access to production databases









