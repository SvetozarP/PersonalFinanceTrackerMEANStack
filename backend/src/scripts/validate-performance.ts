#!/usr/bin/env ts-node

/**
 * Performance Validation Script
 * 
 * This script validates that the database performance optimizations are working correctly
 * by running basic performance tests and benchmarks.
 * 
 * Usage:
 * npm run validate-performance
 * or
 * ts-node src/scripts/validate-performance.ts
 */

import mongoose from 'mongoose';
import { databaseOptimizationService } from '../shared/services/database-optimization.service';
import { logger } from '../shared/services/logger.service';
import { config } from '../config/environment';
import { Transaction } from '../modules/financial/transactions/models/transaction.model';
import { Category } from '../modules/financial/categories/models/category.model';
import Budget from '../modules/financial/budgets/models/budget.model';

async function validatePerformance() {
  try {
    logger.info('Starting performance validation...');

    // Connect to database
    await mongoose.connect(config.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info('Connected to database successfully');

    // 1. Validate critical indexes
    logger.info('Validating critical indexes...');
    const validation = await databaseOptimizationService.validateCriticalIndexes();
    if (!validation.valid) {
      logger.error('Critical indexes validation failed', { missing: validation.missing });
      process.exit(1);
    }
    logger.info('✅ Critical indexes validation passed');

    // 2. Get database metrics
    logger.info('Getting database metrics...');
    const metrics = await databaseOptimizationService.getDatabaseMetrics();
    logger.info('Database metrics:', {
      collections: metrics.database.collections,
      dataSize: `${Math.round(metrics.database.dataSize / 1024 / 1024 * 100) / 100}MB`,
      totalIndexSize: `${Math.round(metrics.database.totalIndexSize / 1024 / 1024 * 100) / 100}MB`,
      indexCount: metrics.database.indexCount
    });

    // 3. Get index usage statistics
    logger.info('Getting index usage statistics...');
    const indexStats = await databaseOptimizationService.getIndexUsageStats();
    logger.info('Index usage statistics:', {
      transactions: indexStats.transactions?.totalIndexes || 0,
      budgets: indexStats.budgets?.totalIndexes || 0,
      categories: indexStats.categories?.totalIndexes || 0
    });

    // 4. Test query performance
    logger.info('Testing query performance...');
    const testUserId = new mongoose.Types.ObjectId().toString();
    
    // Create test category
    const category = new Category({
      name: 'Performance Test Category',
      userId: testUserId,
      color: '#FF0000',
      icon: 'test'
    });
    await category.save();

    // Create test transactions
    const transactions = [];
    for (let i = 0; i < 100; i++) {
      transactions.push({
        title: `Performance Test Transaction ${i}`,
        amount: Math.random() * 1000,
        type: i % 2 === 0 ? 'income' : 'expense',
        categoryId: category._id,
        userId: testUserId,
        accountId: new mongoose.Types.ObjectId().toString(),
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        paymentMethod: 'credit_card',
        source: 'manual'
      });
    }

    // Test insert performance
    const insertStartTime = Date.now();
    await Transaction.insertMany(transactions);
    const insertDuration = Date.now() - insertStartTime;
    logger.info(`✅ Insert performance: ${insertDuration}ms for 100 transactions`);

    // Test query performance
    const queryStartTime = Date.now();
    const results = await Transaction.find({ userId: testUserId })
      .sort({ date: -1 })
      .limit(50);
    const queryDuration = Date.now() - queryStartTime;
    logger.info(`✅ Query performance: ${queryDuration}ms for user transactions`);

    // Test aggregation performance
    const aggStartTime = Date.now();
    const pipeline = [
      {
        $match: {
          userId: new mongoose.Types.ObjectId(testUserId),
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ];
    await Transaction.aggregate(pipeline);
    const aggDuration = Date.now() - aggStartTime;
    logger.info(`✅ Aggregation performance: ${aggDuration}ms for analytics query`);

    // Test text search performance
    const searchStartTime = Date.now();
    await Transaction.find({
      $text: { $search: 'performance test' },
      userId: testUserId
    }).limit(10);
    const searchDuration = Date.now() - searchStartTime;
    logger.info(`✅ Text search performance: ${searchDuration}ms for text search`);

    // 5. Performance analysis
    logger.info('Analyzing query performance...');
    const analysis = await databaseOptimizationService.analyzeQueryPerformance(
      { userId: testUserId, type: 'expense' },
      'transactions'
    );
    logger.info('Query analysis:', {
      executionTime: `${analysis.executionTime}ms`,
      isIndexUsed: analysis.isIndexUsed,
      efficiency: `${analysis.efficiency}%`
    });

    // 6. Clean up test data
    logger.info('Cleaning up test data...');
    await Transaction.deleteMany({ userId: testUserId });
    await Category.deleteMany({ userId: testUserId });

    // 7. Performance summary
    logger.info('Performance validation completed successfully!');
    logger.info('Performance Summary:', {
      insertPerformance: `${insertDuration}ms (100 transactions)`,
      queryPerformance: `${queryDuration}ms (user query)`,
      aggregationPerformance: `${aggDuration}ms (analytics)`,
      searchPerformance: `${searchDuration}ms (text search)`,
      indexEfficiency: `${analysis.efficiency}%`,
      totalIndexes: (indexStats.transactions?.totalIndexes || 0) + 
                   (indexStats.budgets?.totalIndexes || 0) + 
                   (indexStats.categories?.totalIndexes || 0)
    });

    // Performance thresholds
    const performanceChecks = {
      insertPerformance: insertDuration < 1000, // Less than 1 second for 100 inserts
      queryPerformance: queryDuration < 100,   // Less than 100ms for user query
      aggregationPerformance: aggDuration < 200, // Less than 200ms for aggregation
      searchPerformance: searchDuration < 150,   // Less than 150ms for text search
      indexEfficiency: analysis.efficiency > 50  // More than 50% efficiency
    };

    const allChecksPassed = Object.values(performanceChecks).every(check => check);
    
    if (allChecksPassed) {
      logger.info('🎉 All performance checks passed!');
      process.exit(0);
    } else {
      logger.warn('⚠️ Some performance checks failed:', performanceChecks);
      process.exit(1);
    }

  } catch (error) {
    logger.error('Performance validation failed', { error: String(error) });
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logger.info('Database connection closed');
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validatePerformance();
}

export { validatePerformance };
