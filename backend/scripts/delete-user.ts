#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/modules/users/user.model';
import { Category } from '../src/modules/financial/categories/models/category.model';
import { Transaction } from '../src/modules/financial/transactions/models/transaction.model';
import Budget from '../src/modules/financial/budgets/models/budget.model';
import * as readline from 'readline';

interface DeleteUserOptions {
  email?: string;
  userId?: string;
  interactive?: boolean;
  force?: boolean;
}

class UserDeleter {
  private rl: readline.Interface;

  constructor(private options: DeleteUserOptions) {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

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

  private async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async listUsers(): Promise<void> {
    try {
      const users = await User.find({}).select('-password');
      
      if (users.length === 0) {
        console.log('📭 No users found in the database');
        return;
      }

      console.log('👥 Users in Database');
      console.log('==================');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Role: ${user.role}`);
        console.log(`   ⭐ Superuser: ${user.isSuperuser ? 'Yes' : 'No'}`);
        console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
        console.log(`   🆔 ID: ${user._id}`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error listing users:', error);
      throw error;
    }
  }

  async findUser(identifier: string): Promise<any> {
    try {
      let user;
      
      // Try to find by email first
      user = await User.findOne({ email: identifier.toLowerCase() });
      
      // If not found by email, try by ObjectId
      if (!user && mongoose.Types.ObjectId.isValid(identifier)) {
        user = await User.findById(identifier);
      }
      
      return user;
    } catch (error) {
      console.error('❌ Error finding user:', error);
      throw error;
    }
  }

  async getUserDataCounts(userId: string): Promise<{
    categories: number;
    transactions: number;
    budgets: number;
  }> {
    try {
      const [categories, transactions, budgets] = await Promise.all([
        Category.countDocuments({ userId }),
        Transaction.countDocuments({ userId }),
        Budget.countDocuments({ userId }),
      ]);

      return { categories, transactions, budgets };
    } catch (error) {
      console.error('❌ Error counting user data:', error);
      throw error;
    }
  }

  async deleteUser(): Promise<void> {
    try {
      let user;
      let identifier = this.options.email || this.options.userId;

      if (this.options.interactive || !identifier) {
        // Interactive mode
        console.log('🗑️  Delete User Account');
        console.log('======================');
        console.log('');

        // List users first
        await this.listUsers();

        identifier = await this.prompt('Enter email or user ID to delete: ');
        if (!identifier) {
          console.log('❌ No identifier provided');
          return;
        }
      }

      // Find the user
      user = await this.findUser(identifier);
      if (!user) {
        console.log(`❌ User not found: ${identifier}`);
        return;
      }

      // Get data counts
      const dataCounts = await this.getUserDataCounts(user._id);

      console.log('');
      console.log('⚠️  User Deletion Warning');
      console.log('=========================');
      console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`🔑 Role: ${user.role}`);
      console.log(`⭐ Superuser: ${user.isSuperuser ? 'Yes' : 'No'}`);
      console.log('');
      console.log('📊 Associated Data:');
      console.log(`   📁 Categories: ${dataCounts.categories}`);
      console.log(`   💰 Transactions: ${dataCounts.transactions}`);
      console.log(`   📊 Budgets: ${dataCounts.budgets}`);
      console.log('');

      if (!this.options.force) {
        const confirm = await this.prompt('Are you sure you want to delete this user and ALL their data? (y/N): ');
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
          console.log('❌ User deletion cancelled.');
          return;
        }
      }

      // Delete user and all associated data
      console.log('🗑️  Deleting user and associated data...');
      
      await Promise.all([
        Category.deleteMany({ userId: user._id }),
        Transaction.deleteMany({ userId: user._id }),
        Budget.deleteMany({ userId: user._id }),
        User.findByIdAndDelete(user._id),
      ]);

      console.log('');
      console.log('✅ User deleted successfully!');
      console.log('============================');
      console.log(`👤 Deleted: ${user.firstName} ${user.lastName} (${user.email})`);
      console.log(`📁 Categories deleted: ${dataCounts.categories}`);
      console.log(`💰 Transactions deleted: ${dataCounts.transactions}`);
      console.log(`📊 Budgets deleted: ${dataCounts.budgets}`);
      console.log('');

    } catch (error) {
      console.error('❌ Error deleting user:', error);
      throw error;
    }
  }

  async deleteAllUsers(): Promise<void> {
    try {
      const users = await User.find({});
      
      if (users.length === 0) {
        console.log('📭 No users found to delete');
        return;
      }

      console.log('⚠️  DANGER: Delete ALL Users');
      console.log('============================');
      console.log(`Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      });
      console.log('');

      if (!this.options.force) {
        const confirm = await this.prompt('Are you sure you want to delete ALL users and ALL their data? (type "DELETE ALL" to confirm): ');
        if (confirm !== 'DELETE ALL') {
          console.log('❌ User deletion cancelled.');
          return;
        }
      }

      console.log('🗑️  Deleting all users and associated data...');
      
      // Delete all data first
      await Promise.all([
        Category.deleteMany({}),
        Transaction.deleteMany({}),
        Budget.deleteMany({}),
        User.deleteMany({}),
      ]);

      console.log('');
      console.log('✅ All users deleted successfully!');
      console.log('==================================');
      console.log(`👥 Users deleted: ${users.length}`);
      console.log('📁 All categories deleted');
      console.log('💰 All transactions deleted');
      console.log('📊 All budgets deleted');
      console.log('');

    } catch (error) {
      console.error('❌ Error deleting all users:', error);
      throw error;
    }
  }

  close(): void {
    this.rl.close();
  }
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] as 'delete' | 'list' | 'delete-all' | 'help';
  const identifier = args[1];
  const force = args[2] === '--force';

  if (!action || !['delete', 'list', 'delete-all', 'help'].includes(action)) {
    console.log('Personal Finance Tracker - User Management');
    console.log('==========================================');
    console.log('');
    console.log('Usage: ts-node delete-user.ts <action> [identifier] [--force]');
    console.log('');
    console.log('Actions:');
    console.log('  delete [email|userId] [--force]  - Delete a specific user');
    console.log('  list                             - List all users');
    console.log('  delete-all [--force]             - Delete ALL users (DANGEROUS)');
    console.log('  help                             - Show this help');
    console.log('');
    console.log('Options:');
    console.log('  --force  Skip confirmation prompts');
    console.log('');
    console.log('Examples:');
    console.log('  ts-node delete-user.ts list');
    console.log('  ts-node delete-user.ts delete admin@example.com');
    console.log('  ts-node delete-user.ts delete 507f1f77bcf86cd799439011');
    console.log('  ts-node delete-user.ts delete admin@example.com --force');
    console.log('  ts-node delete-user.ts delete-all --force');
    console.log('');
    process.exit(1);
  }

  const deleter = new UserDeleter({
    email: identifier,
    userId: identifier,
    interactive: !identifier,
    force,
  });

  try {
    await deleter.connect();

    switch (action) {
      case 'delete':
        await deleter.deleteUser();
        break;
      case 'list':
        await deleter.listUsers();
        break;
      case 'delete-all':
        await deleter.deleteAllUsers();
        break;
      case 'help':
        console.log('Personal Finance Tracker - User Management');
        console.log('==========================================');
        console.log('');
        console.log('Usage: ts-node delete-user.ts <action> [identifier] [--force]');
        console.log('');
        console.log('Actions:');
        console.log('  delete [email|userId] [--force]  - Delete a specific user');
        console.log('  list                             - List all users');
        console.log('  delete-all [--force]             - Delete ALL users (DANGEROUS)');
        console.log('  help                             - Show this help');
        console.log('');
        console.log('Options:');
        console.log('  --force  Skip confirmation prompts');
        console.log('');
        console.log('Examples:');
        console.log('  ts-node delete-user.ts list');
        console.log('  ts-node delete-user.ts delete admin@example.com');
        console.log('  ts-node delete-user.ts delete 507f1f77bcf86cd799439011');
        console.log('  ts-node delete-user.ts delete admin@example.com --force');
        console.log('  ts-node delete-user.ts delete-all --force');
        console.log('');
        break;
    }

    console.log('🎉 Operation completed successfully!');
  } catch (error) {
    console.error('💥 Operation failed:', error);
    process.exit(1);
  } finally {
    deleter.close();
    await deleter.disconnect();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { UserDeleter };
