#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User, UserRole } from '../src/modules/users/user.model';
import * as readline from 'readline';

interface SuperuserOptions {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  interactive?: boolean;
}

class SuperuserCreator {
  private rl: readline.Interface;

  constructor(private options: SuperuserOptions) {
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

  private validateEmail(email: string): boolean {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  }

  private validatePassword(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    if (!hasLetter) {
      return { isValid: false, message: 'Password must contain at least one letter' };
    }
    if (!hasNumber) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    if (!hasSpecialChar) {
      return { isValid: false, message: 'Password must contain at least one special character' };
    }

    return { isValid: true, message: 'Password is valid' };
  }

  async checkExistingSuperuser(): Promise<boolean> {
    try {
      const existingSuperuser = await User.findOne({ isSuperuser: true });
      return !!existingSuperuser;
    } catch (error) {
      console.error('❌ Error checking for existing superuser:', error);
      throw error;
    }
  }

  async createSuperuser(): Promise<void> {
    try {
      // Check if superuser already exists
      const hasSuperuser = await this.checkExistingSuperuser();
      if (hasSuperuser) {
        console.log('⚠️  A superuser already exists in the database.');
        const overwrite = await this.prompt('Do you want to create another superuser? (y/N): ');
        if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
          console.log('❌ Superuser creation cancelled.');
          return;
        }
      }

      let email: string;
      let password: string;
      let firstName: string;
      let lastName: string;

      if (this.options.interactive || (!this.options.email && !this.options.password)) {
        // Interactive mode
        console.log('🔐 Creating Superuser Account');
        console.log('============================');
        console.log('');

        // Get email
        while (true) {
          email = await this.prompt('Email: ');
          if (!email) {
            console.log('❌ Email is required');
            continue;
          }
          if (!this.validateEmail(email)) {
            console.log('❌ Please enter a valid email address');
            continue;
          }
          
          // Check if email already exists
          const existingUser = await User.findOne({ email: email.toLowerCase() });
          if (existingUser) {
            console.log('❌ A user with this email already exists');
            continue;
          }
          break;
        }

        // Get password (simplified - no hidden input for now)
        while (true) {
          password = await this.prompt('Password: ');
          if (!password) {
            console.log('❌ Password is required');
            continue;
          }
          
          const validation = this.validatePassword(password);
          if (!validation.isValid) {
            console.log(`❌ ${validation.message}`);
            continue;
          }
          
          // Confirm password
          const confirmPassword = await this.prompt('Confirm Password: ');
          if (password !== confirmPassword) {
            console.log('❌ Passwords do not match');
            continue;
          }
          break;
        }

        // Get first name
        while (true) {
          firstName = await this.prompt('First Name: ');
          if (!firstName) {
            console.log('❌ First name is required');
            continue;
          }
          if (firstName.length > 50) {
            console.log('❌ First name cannot exceed 50 characters');
            continue;
          }
          break;
        }

        // Get last name
        while (true) {
          lastName = await this.prompt('Last Name: ');
          if (!lastName) {
            console.log('❌ Last name is required');
            continue;
          }
          if (lastName.length > 50) {
            console.log('❌ Last name cannot exceed 50 characters');
            continue;
          }
          break;
        }
      } else {
        // Non-interactive mode
        email = this.options.email!;
        password = this.options.password!;
        firstName = this.options.firstName || 'Super';
        lastName = this.options.lastName || 'User';

        // Validate inputs
        if (!this.validateEmail(email)) {
          throw new Error('Invalid email address');
        }

        const passwordValidation = this.validatePassword(password);
        if (!passwordValidation.isValid) {
          throw new Error(passwordValidation.message);
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
          throw new Error('A user with this email already exists');
        }
      }

      // Create superuser
      const superuserData = {
        email: email.toLowerCase(),
        password: password,
        firstName: firstName,
        lastName: lastName,
        isActive: true,
        role: UserRole.SUPERUSER,
        isSuperuser: true,
      };

      const superuser = new User(superuserData);
      await superuser.save();

      console.log('');
      console.log('✅ Superuser created successfully!');
      console.log('================================');
      console.log(`📧 Email: ${superuser.email}`);
      console.log(`👤 Name: ${superuser.firstName} ${superuser.lastName}`);
      console.log(`🔑 Role: ${superuser.role}`);
      console.log(`⭐ Superuser: ${superuser.isSuperuser ? 'Yes' : 'No'}`);
      console.log(`🆔 User ID: ${superuser._id}`);
      console.log('');

    } catch (error) {
      console.error('❌ Error creating superuser:', error);
      throw error;
    }
  }

  async listSuperusers(): Promise<void> {
    try {
      const superusers = await User.find({ isSuperuser: true }).select('-password');
      
      if (superusers.length === 0) {
        console.log('📭 No superusers found in the database');
        return;
      }

      console.log('👑 Superusers in Database');
      console.log('========================');
      superusers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Role: ${user.role}`);
        console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
        console.log(`   🆔 ID: ${user._id}`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error listing superusers:', error);
      throw error;
    }
  }

  async deleteSuperuser(email: string): Promise<void> {
    try {
      const superuser = await User.findOne({ email: email.toLowerCase(), isSuperuser: true });
      
      if (!superuser) {
        console.log(`❌ No superuser found with email: ${email}`);
        return;
      }

      const confirm = await this.prompt(`Are you sure you want to delete superuser ${superuser.firstName} ${superuser.lastName} (${superuser.email})? (y/N): `);
      
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        console.log('❌ Superuser deletion cancelled.');
        return;
      }

      await User.findByIdAndDelete(superuser._id);
      console.log(`✅ Superuser ${superuser.email} deleted successfully`);
    } catch (error) {
      console.error('❌ Error deleting superuser:', error);
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
  const action = args[0] as 'create' | 'list' | 'delete' | 'help';
  const email = args[1];
  const password = args[2];
  const firstName = args[3];
  const lastName = args[4];

  if (!action || !['create', 'list', 'delete', 'help'].includes(action)) {
    console.log('Personal Finance Tracker - Superuser Management');
    console.log('==============================================');
    console.log('');
    console.log('Usage: ts-node create-superuser-simple.ts <action> [options]');
    console.log('');
    console.log('Actions:');
    console.log('  create [email] [password] [firstName] [lastName]  - Create a superuser');
    console.log('  list                                            - List all superusers');
    console.log('  delete [email]                                  - Delete a superuser');
    console.log('  help                                            - Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  ts-node create-superuser-simple.ts create');
    console.log('  ts-node create-superuser-simple.ts create admin@example.com AdminPass123! Admin User');
    console.log('  ts-node create-superuser-simple.ts list');
    console.log('  ts-node create-superuser-simple.ts delete admin@example.com');
    console.log('');
    process.exit(1);
  }

  const creator = new SuperuserCreator({
    email,
    password,
    firstName,
    lastName,
    interactive: !email || !password,
  });

  try {
    await creator.connect();

    switch (action) {
      case 'create':
        await creator.createSuperuser();
        break;
      case 'list':
        await creator.listSuperusers();
        break;
      case 'delete':
        if (!email) {
          console.log('❌ Email is required for delete action');
          process.exit(1);
        }
        await creator.deleteSuperuser(email);
        break;
      case 'help':
        console.log('Personal Finance Tracker - Superuser Management');
        console.log('==============================================');
        console.log('');
        console.log('Usage: ts-node create-superuser-simple.ts <action> [options]');
        console.log('');
        console.log('Actions:');
        console.log('  create [email] [password] [firstName] [lastName]  - Create a superuser');
        console.log('  list                                            - List all superusers');
        console.log('  delete [email]                                  - Delete a superuser');
        console.log('  help                                            - Show this help');
        console.log('');
        console.log('Examples:');
        console.log('  ts-node create-superuser-simple.ts create');
        console.log('  ts-node create-superuser-simple.ts create admin@example.com AdminPass123! Admin User');
        console.log('  ts-node create-superuser-simple.ts list');
        console.log('  ts-node create-superuser-simple.ts delete admin@example.com');
        console.log('');
        break;
    }

    console.log('🎉 Operation completed successfully!');
  } catch (error) {
    console.error('💥 Operation failed:', error);
    process.exit(1);
  } finally {
    creator.close();
    await creator.disconnect();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { SuperuserCreator };
