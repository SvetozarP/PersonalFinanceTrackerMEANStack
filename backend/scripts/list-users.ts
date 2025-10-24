#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import { config } from '../src/config/environment';
import { User } from '../src/modules/users/user.model';

async function listUsers() {
  try {
    const mongoUri = config.MONGO_URI;
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
    console.log('✅ Connected to MongoDB');

    const users = await User.find({ isActive: true });
    console.log(`\n👥 Found ${users.length} active users:`);
    
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}) - Role: ${user.role}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listUsers();



