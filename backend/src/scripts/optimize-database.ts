#!/usr/bin/env ts-node

/**
 * Database Optimization Script
 * 
 * This script optimizes database performance by:
 * 1. Creating missing indexes
 * 2. Validating index performance
 * 3. Analyzing query patterns
 * 4. Generating performance reports
 * 
 * Usage:
 * npm run optimize-db
 * or
 * ts-node src/scripts/optimize-database.ts
 */

import mongoose from 'mongoose';
import { databaseOptimizationService } from '../shared/services/database-optimization.service';
import { logger } from '../shared/services/logger.service';
import { config } from '../config/environment';

async function optimizeDatabase() {
  try {
    logger.info('Starting database optimization process...');

    // Connect to database
    await mongoose.connect(config.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('Connected to database successfully');

    // Run optimization
    await databaseOptimizationService.optimizePerformance();

    // Validate critical indexes
    const validation = await databaseOptimizationService.validateCriticalIndexes();
    if (!validation.valid) {
      logger.error('Critical indexes validation failed', { missing: validation.missing });
      process.exit(1);
    }

    // Get performance metrics
    const metrics = await databaseOptimizationService.getDatabaseMetrics();
    logger.info('Database optimization completed successfully', { metrics });

    // Get index usage statistics
    const indexStats = await databaseOptimizationService.getIndexUsageStats();
    logger.info('Index usage statistics', { indexStats });

    logger.info('Database optimization process completed successfully');
    process.exit(0);

  } catch (error) {
    logger.error('Database optimization failed', { error: String(error) });
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Database connection closed');
  }
}

// Run optimization if this script is executed directly
if (require.main === module) {
  optimizeDatabase();
}

export { optimizeDatabase };
