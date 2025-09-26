#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User, UserRole } from '../src/modules/users/user.model';
import { Category } from '../src/modules/financial/categories/models/category.model';
import { Transaction } from '../src/modules/financial/transactions/models/transaction.model';
import Budget from '../src/modules/financial/budgets/models/budget.model';
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  RecurrencePattern,
} from '../src/modules/financial/transactions/interfaces/transaction.interface';

interface MockDataOptions {
  action: 'insert' | 'clear' | 'both';
  userCount?: number;
  transactionCount?: number;
  budgetCount?: number;
  categoryCount?: number;
}

class MockDataGenerator {
  private users: any[] = [];
  private categories: any[] = [];
  private transactions: any[] = [];
  private budgets: any[] = [];

  constructor(private options: MockDataOptions) {}

  async connect(): Promise<void> {
    try {
      const mongoUri = this.buildMongoUri();
      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      });
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  private buildMongoUri(): string {
    if (config.MONGO_URI.includes('mongodb://') && config.MONGO_URI.includes('@')) {
      return config.MONGO_URI;
    }
    const { MONGO_ROOT_USERNAME, MONGO_ROOT_PASSWORD, MONGO_DATABASE } = config;
    return `mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@localhost:27017/${MONGO_DATABASE}?authSource=admin`;
  }

  async clearDatabase(): Promise<void> {
    console.log('🧹 Clearing mock data (preserving users)...');
    
    try {
      await Promise.all([
        Category.deleteMany({}),
        Transaction.deleteMany({}),
        Budget.deleteMany({}),
      ]);
      console.log('✅ Mock data cleared successfully (users preserved)');
    } catch (error) {
      console.error('❌ Error clearing mock data:', error);
      throw error;
    }
  }

  async loadExistingUsers(): Promise<void> {
    console.log('👥 Loading existing users...');
    
    try {
      const existingUsers = await User.find({ isActive: true }).limit(this.options.userCount || 10);
      
      if (existingUsers.length === 0) {
        console.log('⚠️  No existing users found. Please create users first using the superuser script.');
        throw new Error('No existing users found');
      }
      
      this.users = existingUsers;
      console.log(`  ✅ Loaded ${existingUsers.length} existing users`);
      existingUsers.forEach(user => {
        console.log(`    - ${user.email} (${user.firstName} ${user.lastName})`);
      });
    } catch (error) {
      console.error('❌ Error loading existing users:', error);
      throw error;
    }
  }

  async generateCategories(): Promise<void> {
    console.log('📁 Loading/Generating categories...');
    
    const baseCategories = [
      // Income Categories
      { name: 'Salary', type: 'income', color: '#10B981', icon: 'briefcase' },
      { name: 'Freelance', type: 'income', color: '#3B82F6', icon: 'laptop' },
      { name: 'Investment', type: 'income', color: '#8B5CF6', icon: 'trending-up' },
      { name: 'Business', type: 'income', color: '#F59E0B', icon: 'building' },
      
      // Expense Categories
      { name: 'Food & Dining', type: 'expense', color: '#EF4444', icon: 'utensils' },
      { name: 'Transportation', type: 'expense', color: '#06B6D4', icon: 'car' },
      { name: 'Housing', type: 'expense', color: '#84CC16', icon: 'home' },
      { name: 'Utilities', type: 'expense', color: '#F97316', icon: 'zap' },
      { name: 'Healthcare', type: 'expense', color: '#EC4899', icon: 'heart' },
      { name: 'Entertainment', type: 'expense', color: '#8B5CF6', icon: 'film' },
      { name: 'Shopping', type: 'expense', color: '#6366F1', icon: 'shopping-bag' },
      { name: 'Education', type: 'expense', color: '#14B8A6', icon: 'book' },
      { name: 'Travel', type: 'expense', color: '#F59E0B', icon: 'plane' },
      { name: 'Insurance', type: 'expense', color: '#6B7280', icon: 'shield' },
      { name: 'Savings', type: 'expense', color: '#10B981', icon: 'piggy-bank' },
      { name: 'Miscellaneous', type: 'expense', color: '#9CA3AF', icon: 'more-horizontal' },
    ];

    this.categories = [];

    for (const user of this.users) {
      // Check existing categories for this user
      const existingCategories = await Category.find({ userId: user._id });
      const existingCategoryNames = existingCategories.map(cat => cat.name);
      
      // Add existing categories to our array
      this.categories.push(...existingCategories);
      
      // Create missing categories
      for (const categoryData of baseCategories) {
        if (!existingCategoryNames.includes(categoryData.name)) {
          const category = new Category({
            ...categoryData,
            userId: user._id,
            description: `Default ${categoryData.name.toLowerCase()} category`,
            isActive: true,
            isSystem: false,
          });

          await category.save();
          this.categories.push(category);
          console.log(`  ✅ Created category: ${category.name} for ${user.email}`);
        } else {
          console.log(`  ⏭️  Skipped existing category: ${categoryData.name} for ${user.email}`);
        }
      }
    }
    
    console.log(`  ✅ Total categories: ${this.categories.length}`);
  }

  async generateTransactions(): Promise<void> {
    console.log('💰 Generating transactions...');
    
    const transactionCount = this.options.transactionCount || 100;
    const merchants = [
      'Starbucks', 'McDonald\'s', 'Walmart', 'Target', 'Amazon', 'Netflix',
      'Spotify', 'Uber', 'Lyft', 'Shell', 'Exxon', 'CVS', 'Walgreens',
      'Whole Foods', 'Trader Joe\'s', 'Costco', 'Home Depot', 'Lowe\'s',
      'Best Buy', 'Apple Store', 'Google Play', 'Microsoft', 'Adobe',
      'Adobe Creative Cloud', 'Dropbox', 'Slack', 'Zoom', 'GitHub',
      'AWS', 'DigitalOcean', 'Vercel', 'Netlify'
    ];

    const locations = [
      { name: 'Downtown Mall', address: '123 Main St, City, State' },
      { name: 'Shopping Center', address: '456 Oak Ave, City, State' },
      { name: 'Gas Station', address: '789 Pine Rd, City, State' },
      { name: 'Grocery Store', address: '321 Elm St, City, State' },
      { name: 'Restaurant', address: '654 Maple Dr, City, State' },
    ];

    const paymentMethods = Object.values(PaymentMethod);
    const transactionTypes = Object.values(TransactionType);
    const transactionStatuses = Object.values(TransactionStatus);

    for (const user of this.users) {
      const userCategories = this.categories.filter(cat => cat.userId.toString() === user._id.toString());
      const expenseCategories = userCategories.filter(cat => cat.name !== 'Salary' && cat.name !== 'Freelance' && cat.name !== 'Investment' && cat.name !== 'Business');
      const incomeCategories = userCategories.filter(cat => cat.name === 'Salary' || cat.name === 'Freelance' || cat.name === 'Investment' || cat.name === 'Business');

      for (let i = 0; i < transactionCount; i++) {
        const isIncome = Math.random() < 0.2; // 20% income, 80% expenses
        const categories = isIncome ? incomeCategories : expenseCategories;
        const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
        
        const amount = isIncome 
          ? Math.random() * 5000 + 1000 // Income: $1000-$6000
          : Math.random() * 500 + 10;   // Expenses: $10-$510

        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90)); // Last 90 days

        const transactionData = {
          title: isIncome 
            ? `${selectedCategory.name} Payment`
            : `${merchants[Math.floor(Math.random() * merchants.length)]} Purchase`,
          description: isIncome
            ? `Monthly ${selectedCategory.name.toLowerCase()} payment`
            : `Purchase at ${merchants[Math.floor(Math.random() * merchants.length)]}`,
          amount: Math.round(amount * 100) / 100,
          currency: 'USD',
          type: isIncome ? TransactionType.INCOME : TransactionType.EXPENSE,
          status: transactionStatuses[Math.floor(Math.random() * transactionStatuses.length)],
          categoryId: selectedCategory._id,
          tags: isIncome ? ['income', 'monthly'] : ['expense', 'purchase'],
          date: date,
          time: `${Math.floor(Math.random() * 24).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          timezone: 'America/New_York',
          location: locations[Math.floor(Math.random() * locations.length)],
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          paymentReference: `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          merchantName: isIncome ? null : merchants[Math.floor(Math.random() * merchants.length)],
          fees: Math.random() < 0.1 ? Math.round(Math.random() * 10 * 100) / 100 : 0,
          tax: Math.random() < 0.3 ? Math.round(amount * 0.08 * 100) / 100 : 0,
          isRecurring: Math.random() < 0.1,
          recurrencePattern: RecurrencePattern.NONE,
          notes: Math.random() < 0.3 ? `Transaction note ${i + 1}` : undefined,
          source: 'manual',
          userId: user._id,
          accountId: user._id, // Using user ID as account ID for simplicity
        };

        const transaction = new Transaction(transactionData);
        await transaction.save();
        this.transactions.push(transaction);
      }
      console.log(`  ✅ Created ${transactionCount} transactions for ${user.email}`);
    }
  }

  async generateBudgets(): Promise<void> {
    console.log('📊 Generating budgets...');
    
    const budgetCount = this.options.budgetCount || 5;
    const budgetNames = [
      'Monthly Budget 2024',
      'Holiday Budget',
      'Emergency Fund',
      'Vacation Savings',
      'Home Improvement',
    ];

    for (const user of this.users) {
      const userCategories = this.categories.filter(cat => cat.userId.toString() === user._id.toString());
      const expenseCategories = userCategories.filter(cat => cat.name !== 'Salary' && cat.name !== 'Freelance' && cat.name !== 'Investment' && cat.name !== 'Business');

      for (let i = 0; i < Math.min(budgetCount, budgetNames.length); i++) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - i);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        // Select 3-5 random categories for this budget
        const selectedCategories = expenseCategories
          .sort(() => 0.5 - Math.random())
          .slice(0, Math.floor(Math.random() * 3) + 3);

        const totalAmount = Math.random() * 5000 + 2000; // $2000-$7000
        const categoryAllocations = selectedCategories.map((category, index) => ({
          categoryId: category._id,
          allocatedAmount: Math.round((totalAmount / selectedCategories.length) * 0.9 * 100) / 100, // Use 90% to ensure we don't exceed total
          isFlexible: Math.random() < 0.5,
          priority: index + 1,
        }));

        const budgetData = {
          name: budgetNames[i],
          description: `Budget for ${budgetNames[i].toLowerCase()}`,
          period: 'monthly' as const,
          startDate: startDate,
          endDate: endDate,
          totalAmount: totalAmount,
          currency: 'USD',
          categoryAllocations: categoryAllocations,
          status: 'active' as const,
          alertThreshold: 80,
          userId: user._id,
          isActive: true,
          autoAdjust: Math.random() < 0.3,
          allowRollover: Math.random() < 0.4,
          rolloverAmount: 0,
        };

        const budget = new Budget(budgetData);
        await budget.save();
        this.budgets.push(budget);
        console.log(`  ✅ Created budget: ${budget.name} for ${user.email}`);
      }
    }
  }

  async generateAllData(): Promise<void> {
    console.log('🚀 Starting mock data generation...');
    
    try {
      // Get existing users instead of creating new ones
      await this.loadExistingUsers();
      await this.generateCategories();
      await this.generateTransactions();
      await this.generateBudgets();
      
      console.log('✅ Mock data generation completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`  - Users: ${this.users.length} (existing)`);
      console.log(`  - Categories: ${this.categories.length}`);
      console.log(`  - Transactions: ${this.transactions.length}`);
      console.log(`  - Budgets: ${this.budgets.length}`);
    } catch (error) {
      console.error('❌ Error generating mock data:', error);
      throw error;
    }
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] as 'insert' | 'clear' | 'both';
  const userCount = parseInt(args[1]) || 3;
  const transactionCount = parseInt(args[2]) || 100;
  const budgetCount = parseInt(args[3]) || 5;
  const categoryCount = parseInt(args[4]) || 20;

  if (!['insert', 'clear', 'both'].includes(action)) {
    console.log('Usage: ts-node mock-data.ts <action> [userCount] [transactionCount] [budgetCount] [categoryCount]');
    console.log('Actions:');
    console.log('  insert - Insert mock data (uses existing users)');
    console.log('  clear  - Clear mock data (preserves users)');
    console.log('  both   - Clear and insert mock data');
    console.log('Examples:');
    console.log('  ts-node mock-data.ts insert');
    console.log('  ts-node mock-data.ts clear');
    console.log('  ts-node mock-data.ts both 5 200 10 30');
    console.log('');
    console.log('Note: This script uses existing users from the database.');
    console.log('Create users first using: npm run superuser:create');
    process.exit(1);
  }

  const generator = new MockDataGenerator({
    action,
    userCount,
    transactionCount,
    budgetCount,
    categoryCount,
  });

  try {
    await generator.connect();

    if (action === 'clear' || action === 'both') {
      await generator.clearDatabase();
    }

    if (action === 'insert' || action === 'both') {
      await generator.generateAllData();
    }

    console.log('🎉 Operation completed successfully!');
  } catch (error) {
    console.error('💥 Operation failed:', error);
    process.exit(1);
  } finally {
    await generator.disconnect();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { MockDataGenerator };
