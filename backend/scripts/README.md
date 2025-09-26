# Mock Data Scripts

This directory contains scripts for managing mock data in the Personal Finance Tracker application.

## Overview

The mock data scripts allow you to:
- Insert realistic test data into your database
- Clear all data from the database
- Reset the database with fresh mock data

## Scripts Available

### 1. TypeScript Script (`mock-data.ts`)
The main script that handles all database operations.

### 2. PowerShell Script (`mock-data.ps1`)
A PowerShell wrapper for easier usage on Windows systems.

### 3. Batch Script (`mock-data.bat`)
A simple batch file for Windows command prompt users.

## Usage

### Using npm scripts (Recommended)

```bash
# Insert mock data
npm run mock-data:insert

# Clear all data
npm run mock-data:clear

# Reset database (clear + insert)
npm run mock-data:reset

# Run with custom parameters
npx ts-node scripts/mock-data.ts insert 5 200 10 30
```

### Using PowerShell (Windows)

```powershell
# Basic usage
.\scripts\mock-data.ps1 insert
.\scripts\mock-data.ps1 clear
.\scripts\mock-data.ps1 reset

# With custom parameters
.\scripts\mock-data.ps1 reset -UserCount 5 -TransactionCount 200 -BudgetCount 10 -CategoryCount 30
```

### Using Batch File (Windows)

```cmd
# Basic usage
scripts\mock-data.bat insert
scripts\mock-data.bat clear
scripts\mock-data.bat reset

# With custom parameters
scripts\mock-data.bat reset 5 200 10 30
```

### Direct TypeScript execution

```bash
# Insert mock data
npx ts-node scripts/mock-data.ts insert

# Clear all data
npx ts-node scripts/mock-data.ts clear

# Reset database
npx ts-node scripts/mock-data.ts both

# With custom parameters
npx ts-node scripts/mock-data.ts insert 5 200 10 30
```

## Parameters

| Parameter | Description | Default | Example |
|-----------|-------------|---------|---------|
| `action` | Action to perform: `insert`, `clear`, or `both` | Required | `insert` |
| `userCount` | Number of users to create | 3 | `5` |
| `transactionCount` | Number of transactions per user | 100 | `200` |
| `budgetCount` | Number of budgets per user | 5 | `10` |
| `categoryCount` | Number of categories per user | 20 | `30` |

## Mock Data Generated

### Users
- **Uses existing users** from the database
- **Does not create new users** - create users first using the superuser script
- Loads all active users and generates data for them

### Categories
- **Income Categories**: Salary, Freelance, Investment, Business
- **Expense Categories**: Food & Dining, Transportation, Housing, Utilities, Healthcare, Entertainment, Shopping, Education, Travel, Insurance, Savings, Miscellaneous
- Each category has appropriate colors, icons, and descriptions
- **Smart handling**: Skips existing categories, creates missing ones

### Transactions
- Mix of income (20%) and expense (80%) transactions
- Realistic amounts: Income $1000-$6000, Expenses $10-$510
- Random dates within the last 90 days
- Various payment methods, merchants, and locations
- Some transactions include fees and tax
- 10% of transactions are marked as recurring

### Budgets
- Monthly budgets with realistic names
- Category allocations based on expense categories
- Random total amounts between $2000-$7000
- Some budgets have auto-adjust and rollover features

## Prerequisites

1. **Node.js and npm** installed
2. **MongoDB** running and accessible
3. **Environment variables** configured (see `.env.example`)
4. **Dependencies** installed (`npm install`)
5. **Users created** using the superuser script (`npm run superuser:create`)

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

4. **TypeScript Errors**
   - Ensure TypeScript is installed: `npm install -g typescript`
   - Check that `ts-node` is available: `npm install -g ts-node`

### Logs

The script provides detailed logging:
- ✅ Success messages (green)
- ❌ Error messages (red)
- 🚀 Progress indicators (cyan)
- 📊 Summary statistics

## Examples

### Quick Start
```bash
# Reset database with default data
npm run mock-data:reset
```

### Development Testing
```bash
# Create more data for testing
npx ts-node scripts/mock-data.ts insert 10 500 20 50
```

### Clean Slate
```bash
# Clear everything and start fresh
npm run mock-data:clear
npm run mock-data:insert
```

## Data Relationships

The mock data maintains proper relationships:
- Users own categories, transactions, and budgets
- Transactions reference categories
- Budgets allocate amounts to categories
- All data is properly linked with ObjectIds

## Security Note

⚠️ **Important**: The mock data script uses default passwords (`Password123!`) for all users. In production, ensure you change these passwords or use proper authentication mechanisms.

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your environment setup
3. Check the console output for specific error messages
4. Ensure all dependencies are properly installed
