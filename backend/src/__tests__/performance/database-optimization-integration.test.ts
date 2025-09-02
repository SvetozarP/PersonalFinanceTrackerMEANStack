import mongoose from 'mongoose';
import { databaseOptimizationService } from '../../shared/services/database-optimization.service';
import { logger } from '../../shared/services/logger.service';
import { Transaction } from '../../modules/financial/transactions/models/transaction.model';
import { Category } from '../../modules/financial/categories/models/category.model';
import Budget from '../../modules/financial/budgets/models/budget.model';

// Mock logger
jest.mock('../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Database Optimization Integration Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/finance-tracker-test');
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await Transaction.deleteMany({});
    await Category.deleteMany({});
    await Budget.deleteMany({});
    
    // Create text index for transactions
    try {
      await Transaction.collection.createIndex({
        title: 'text',
        description: 'text',
        merchantName: 'text',
        notes: 'text',
        tags: 'text'
      });
    } catch (error) {
      // Text index might already exist, ignore error
    }
  });

  describe('Index Creation and Validation', () => {
    it('should create all required indexes on startup', async () => {
      // Run optimization
      await databaseOptimizationService.optimizePerformance();

      // Validate critical indexes exist
      const validation = await databaseOptimizationService.validateCriticalIndexes();
      expect(validation.valid).toBe(true);
      expect(validation.missing).toEqual([]);
    });

    it('should detect and create missing indexes', async () => {
      // Get initial index stats
      const initialStats = await databaseOptimizationService.getIndexUsageStats();
      
      // Run optimization
      await databaseOptimizationService.optimizePerformance();
      
      // Get final index stats
      const finalStats = await databaseOptimizationService.getIndexUsageStats();
      
      // Should have indexes for all collections
      expect(finalStats.transactions.totalIndexes).toBeGreaterThan(0);
      expect(finalStats.budgets.totalIndexes).toBeGreaterThan(0);
      expect(finalStats.categories.totalIndexes).toBeGreaterThan(0);
    });

    it('should validate index performance', async () => {
      // Create test data
      const testUserId = new mongoose.Types.ObjectId().toString();
      const testCategoryId = new mongoose.Types.ObjectId().toString();
      
      const category = new Category({
        name: 'Test Category',
        userId: testUserId,
        color: '#FF0000',
        icon: 'test'
      });
      await category.save();

      // Create transactions
      const transactions = [];
      for (let i = 0; i < 100; i++) {
        transactions.push({
          title: `Test Transaction ${i}`,
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
      await Transaction.insertMany(transactions);

      // Analyze query performance
      const analysis = await databaseOptimizationService.analyzeQueryPerformance(
        { userId: testUserId, type: 'expense' },
        'transactions'
      );

      expect(analysis).toHaveProperty('collection', 'transactions');
      expect(analysis).toHaveProperty('executionTime');
      expect(analysis).toHaveProperty('isIndexUsed');
      expect(analysis).toHaveProperty('efficiency');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track index usage statistics', async () => {
      // Create test data and perform queries
      const testUserId = new mongoose.Types.ObjectId().toString();
      const testCategoryId = new mongoose.Types.ObjectId().toString();
      
      const category = new Category({
        name: 'Test Category',
        userId: testUserId,
        color: '#FF0000',
        icon: 'test'
      });
      await category.save();

      const transactions = [];
      for (let i = 0; i < 50; i++) {
        transactions.push({
          title: `Test Transaction ${i}`,
          amount: Math.random() * 1000,
          type: 'expense',
          categoryId: category._id,
          userId: testUserId,
          accountId: new mongoose.Types.ObjectId().toString(),
          date: new Date(),
          paymentMethod: 'credit_card',
          source: 'manual'
        });
      }
      await Transaction.insertMany(transactions);

      // Perform queries to generate index usage
      await Transaction.find({ userId: testUserId }).sort({ date: -1 });
      await Transaction.find({ userId: testUserId, type: 'expense' });
      await Transaction.find({ userId: testUserId, categoryId: category._id });

      // Get index usage stats
      const stats = await databaseOptimizationService.getIndexUsageStats();
      
      expect(stats).toHaveProperty('transactions');
      expect(stats.transactions).toHaveProperty('totalIndexes');
      expect(stats.transactions).toHaveProperty('indexes');
      expect(Array.isArray(stats.transactions.indexes)).toBe(true);
    });

    it('should provide database metrics', async () => {
      // Create test data
      const testUserId = new mongoose.Types.ObjectId().toString();
      
      const category = new Category({
        name: 'Test Category',
        userId: testUserId,
        color: '#FF0000',
        icon: 'test'
      });
      await category.save();

      const budget = new Budget({
        name: 'Test Budget',
        userId: testUserId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalAmount: 1000,
        currency: 'USD',
        period: 'monthly',
        categoryAllocations: [{
          categoryId: category._id,
          allocatedAmount: 500,
          isFlexible: false,
          priority: 1
        }]
      });
      await budget.save();

      // Get database metrics
      const metrics = await databaseOptimizationService.getDatabaseMetrics();
      
      expect(metrics).toHaveProperty('database');
      expect(metrics).toHaveProperty('collections');
      expect(metrics.database).toHaveProperty('collections');
      expect(metrics.database).toHaveProperty('dataSize');
      expect(metrics.database).toHaveProperty('totalIndexSize');
      expect(metrics.collections).toHaveProperty('transactions');
      expect(metrics.collections).toHaveProperty('budgets');
      expect(metrics.collections).toHaveProperty('categories');
    });
  });

  describe('Query Performance Analysis', () => {
    it('should analyze simple query performance', async () => {
      const testUserId = new mongoose.Types.ObjectId().toString();
      
      const analysis = await databaseOptimizationService.analyzeQueryPerformance(
        { userId: testUserId },
        'transactions'
      );

      expect(analysis).toHaveProperty('collection', 'transactions');
      expect(analysis).toHaveProperty('query');
      expect(analysis).toHaveProperty('executionTime');
      expect(analysis).toHaveProperty('totalDocsExamined');
      expect(analysis).toHaveProperty('totalDocsReturned');
      expect(analysis).toHaveProperty('indexUsed');
      expect(analysis).toHaveProperty('isIndexUsed');
      expect(analysis).toHaveProperty('efficiency');
    });

    it('should analyze complex query performance', async () => {
      const testUserId = new mongoose.Types.ObjectId().toString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      
      const analysis = await databaseOptimizationService.analyzeQueryPerformance(
        { 
          userId: testUserId,
          date: { $gte: startDate, $lte: endDate },
          type: 'expense'
        },
        'transactions'
      );

      expect(analysis).toHaveProperty('collection', 'transactions');
      expect(analysis).toHaveProperty('executionTime');
      expect(analysis).toHaveProperty('isIndexUsed');
      expect(analysis).toHaveProperty('efficiency');
    });

    it('should handle collection scan detection', async () => {
      const analysis = await databaseOptimizationService.analyzeQueryPerformance(
        { nonIndexedField: 'value' },
        'transactions'
      );

      expect(analysis).toHaveProperty('isIndexUsed');
      expect(analysis).toHaveProperty('indexUsed');
      // Should detect collection scan for non-indexed queries
      if (!analysis.isIndexUsed) {
        expect(analysis.indexUsed).toBe('COLLSCAN');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock database connection error
      const originalDb = mongoose.connection.db;
      (mongoose.connection as any).db = undefined;

      try {
        await databaseOptimizationService.ensureIndexes();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Database connection not established');
      } finally {
        // Restore original database connection
        (mongoose.connection as any).db = originalDb;
      }
    });

    it('should handle missing collections gracefully', async () => {
      const analysis = await databaseOptimizationService.analyzeQueryPerformance(
        { userId: 'nonexistent' },
        'nonexistent_collection'
      );

      expect(analysis).toHaveProperty('collection', 'nonexistent_collection');
      expect(analysis).toHaveProperty('executionTime');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should maintain good performance with large datasets', async () => {
      const testUserId = new mongoose.Types.ObjectId().toString();
      const testCategoryId = new mongoose.Types.ObjectId().toString();
      
      const category = new Category({
        name: 'Test Category',
        userId: testUserId,
        color: '#FF0000',
        icon: 'test'
      });
      await category.save();

      // Create large dataset
      const startTime = Date.now();
      const transactions = [];
      for (let i = 0; i < 1000; i++) {
        transactions.push({
          title: `Performance Test Transaction ${i}`,
          amount: Math.random() * 1000,
          type: i % 2 === 0 ? 'income' : 'expense',
          categoryId: category._id,
          userId: testUserId,
          accountId: new mongoose.Types.ObjectId().toString(),
          date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          paymentMethod: 'credit_card',
          source: 'manual'
        });
      }
      await Transaction.insertMany(transactions);
      const insertTime = Date.now() - startTime;

      // Test query performance
      const queryStartTime = Date.now();
      const results = await Transaction.find({ userId: testUserId })
        .sort({ date: -1 })
        .limit(100);
      const queryTime = Date.now() - queryStartTime;

      // Performance assertions
      expect(insertTime).toBeLessThan(15000); // Less than 15 seconds for 1000 inserts
      expect(queryTime).toBeLessThan(500); // Less than 500ms for query
      expect(results.length).toBe(100);
    });

    it('should handle concurrent optimization requests', async () => {
      // Run multiple optimization requests concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(databaseOptimizationService.optimizePerformance());
      }

      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(30000); // Less than 30 seconds
    });
  });
});
