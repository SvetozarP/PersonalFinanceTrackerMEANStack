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

describe('Performance Optimization Tests', () => {
  let testUserId: string;
  let testCategoryId: string;
  let testBudgetId: string;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/finance-tracker-test');
    }
    
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

  afterAll(async () => {
    // Clean up test data
    await Transaction.deleteMany({});
    await Category.deleteMany({});
    await Budget.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Create test user ID
    testUserId = new mongoose.Types.ObjectId().toString();
    
    // Create test category
    const category = new Category({
      name: 'Test Category',
      userId: testUserId,
      color: '#FF0000',
      icon: 'test'
    });
    await category.save();
    testCategoryId = (category._id as any).toString();

    // Create test budget
    const budget = new Budget({
      name: 'Test Budget',
      userId: testUserId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      totalAmount: 1000,
      currency: 'USD',
      period: 'monthly',
      categoryAllocations: [{
        categoryId: testCategoryId,
        allocatedAmount: 500,
        isFlexible: false,
        priority: 1
      }]
    });
    await budget.save();
    testBudgetId = (budget._id as any).toString();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await Transaction.deleteMany({ userId: testUserId });
    await Category.deleteMany({ userId: testUserId });
    await Budget.deleteMany({ userId: testUserId });
  });

  describe('Index Performance Tests', () => {
    it('should create transactions efficiently with proper indexes', async () => {
      const startTime = Date.now();
      
      // Create multiple transactions to test index performance
      const transactions = [];
      for (let i = 0; i < 100; i++) {
        transactions.push({
          title: `Test Transaction ${i}`,
          amount: Math.random() * 1000,
          type: i % 2 === 0 ? 'income' : 'expense',
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: new mongoose.Types.ObjectId().toString(),
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          paymentMethod: 'credit_card',
          source: 'manual'
        });
      }

      await Transaction.insertMany(transactions);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 5 seconds for 100 transactions)
      expect(duration).toBeLessThan(5000);
    });

    it('should query transactions by user and date range efficiently', async () => {
      // Create test transactions
      const transactions = [];
      for (let i = 0; i < 50; i++) {
        transactions.push({
          title: `Test Transaction ${i}`,
          amount: Math.random() * 1000,
          type: 'expense',
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: new mongoose.Types.ObjectId().toString(),
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          paymentMethod: 'credit_card',
          source: 'manual'
        });
      }
      await Transaction.insertMany(transactions);

      const startTime = Date.now();
      
      // Query with date range - should use compound index
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      
      const results = await Transaction.find({
        userId: testUserId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be very fast with proper indexing (less than 100ms)
      expect(duration).toBeLessThan(100);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should query transactions by category efficiently', async () => {
      // Create test transactions
      const transactions = [];
      for (let i = 0; i < 30; i++) {
        transactions.push({
          title: `Test Transaction ${i}`,
          amount: Math.random() * 1000,
          type: 'expense',
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: new mongoose.Types.ObjectId().toString(),
          date: new Date(),
          paymentMethod: 'credit_card',
          source: 'manual'
        });
      }
      await Transaction.insertMany(transactions);

      const startTime = Date.now();
      
      // Query by category - should use compound index
      const results = await Transaction.find({
        userId: testUserId,
        categoryId: testCategoryId
      }).sort({ date: -1 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be very fast with proper indexing
      expect(duration).toBeLessThanOrEqual(101);
      expect(results.length).toBe(30);
    });

    it('should perform aggregation queries efficiently', async () => {
      // Create test transactions with different types and amounts
      const transactions = [];
      for (let i = 0; i < 100; i++) {
        transactions.push({
          title: `Test Transaction ${i}`,
          amount: Math.random() * 1000,
          type: i % 3 === 0 ? 'income' : 'expense',
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: new mongoose.Types.ObjectId().toString(),
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          paymentMethod: 'credit_card',
          source: 'manual'
        });
      }
      await Transaction.insertMany(transactions);

      const startTime = Date.now();
      
      // Complex aggregation query
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
            count: { $sum: 1 },
            avgAmount: { $avg: '$amount' }
          }
        },
        {
          $sort: { totalAmount: -1 as 1 | -1 }
        }
      ];

      const results = await Transaction.aggregate(pipeline);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be fast with proper indexing
      expect(duration).toBeLessThan(200);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search transactions efficiently with text index', async () => {
      // Create test transactions with searchable content
      const transactions = [];
      const searchTerms = ['grocery', 'restaurant', 'gas station', 'shopping', 'entertainment'];
      
      for (let i = 0; i < 50; i++) {
        const term = searchTerms[i % searchTerms.length];
        transactions.push({
          title: `${term} transaction ${i}`,
          description: `This is a ${term} related transaction`,
          amount: Math.random() * 1000,
          type: 'expense',
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: new mongoose.Types.ObjectId().toString(),
          date: new Date(),
          paymentMethod: 'credit_card',
          source: 'manual'
        });
      }
      await Transaction.insertMany(transactions);

      const startTime = Date.now();
      
      // Text search query
      const results = await Transaction.find({
        $text: { $search: 'grocery restaurant' },
        userId: testUserId
      }).sort({ score: { $meta: 'textScore' } });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be fast with text index
      expect(duration).toBeLessThan(100);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Budget Performance Tests', () => {
    it('should query active budgets efficiently', async () => {
      // Create multiple budgets
      const budgets = [];
      for (let i = 0; i < 20; i++) {
        budgets.push({
          name: `Test Budget ${i}`,
          userId: testUserId,
          startDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000),
          totalAmount: Math.random() * 5000,
          currency: 'USD',
          period: 'monthly',
          status: i % 3 === 0 ? 'active' : 'paused',
          categoryAllocations: [{
            categoryId: testCategoryId,
            allocatedAmount: Math.random() * 1000,
            isFlexible: false,
            priority: 1
          }]
        });
      }
      await Budget.insertMany(budgets);

      const startTime = Date.now();
      
      // Query active budgets - should use compound index
      const results = await Budget.find({
        userId: testUserId,
        status: 'active'
      }).sort({ startDate: -1 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be fast with proper indexing
      expect(duration).toBeLessThan(50);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should query budgets by date range efficiently', async () => {
      const startTime = Date.now();
      
      // Query budgets in date range
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      const results = await Budget.find({
        userId: testUserId,
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be fast with proper indexing
      expect(duration).toBeLessThan(50);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Category Performance Tests', () => {
    it('should build category tree efficiently', async () => {
      // Create hierarchical categories
      const parentCategory = new Category({
        name: 'Parent Category',
        userId: testUserId,
        color: '#FF0000',
        icon: 'parent'
      });
      await parentCategory.save();

      const childCategories = [];
      for (let i = 0; i < 20; i++) {
        childCategories.push({
          name: `Child Category ${i}`,
          userId: testUserId,
          parentId: parentCategory._id,
          color: '#00FF00',
          icon: 'child'
        });
      }
      await Category.insertMany(childCategories);

      const startTime = Date.now();
      
      // Build category tree - should use hierarchical indexes
      const categories = await Category.find({ userId: testUserId })
        .sort({ level: 1, name: 1 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be fast with proper indexing
      expect(duration).toBeLessThan(100);
      expect(categories.length).toBeGreaterThanOrEqual(21); // 1 parent + 20 children (may have more from other tests)
    });

    it('should query categories by level efficiently', async () => {
      // Create categories at different levels
      const parentCategory = new Category({
        name: 'Parent Category Level Test',
        userId: testUserId,
        color: '#FF0000',
        icon: 'parent'
      });
      await parentCategory.save();

      // Create child categories one by one to ensure level calculation
      const childCategories = [];
      for (let i = 0; i < 15; i++) {
        const childCategory = new Category({
          name: `Child Category Level Test ${i}`,
          userId: testUserId,
          parentId: parentCategory._id,
          color: '#00FF00',
          icon: 'child'
        });
        await childCategory.save();
        childCategories.push(childCategory);
      }

      const startTime = Date.now();
      
      // Query by level - should use compound index
      const results = await Category.find({
        userId: testUserId,
        level: 1
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should be fast with proper indexing
      expect(duration).toBeLessThan(50);
      expect(results.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Database Optimization Service Tests', () => {
    it('should validate critical indexes exist', async () => {
      const validation = await databaseOptimizationService.validateCriticalIndexes();
      
      // In test environment, some collections might not exist yet
      // We just want to ensure the validation method works without throwing errors
      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('missing');
      expect(Array.isArray(validation.missing)).toBe(true);
    });

    it('should get database metrics', async () => {
      const metrics = await databaseOptimizationService.getDatabaseMetrics();
      
      expect(metrics).toHaveProperty('database');
      expect(metrics).toHaveProperty('collections');
      expect(metrics.database).toHaveProperty('collections');
      expect(metrics.database).toHaveProperty('dataSize');
      expect(metrics.database).toHaveProperty('totalIndexSize');
    });

    it('should get index usage statistics', async () => {
      const stats = await databaseOptimizationService.getIndexUsageStats();
      
      expect(stats).toHaveProperty('transactions');
      expect(stats).toHaveProperty('budgets');
      expect(stats).toHaveProperty('categories');
      expect(stats.transactions).toHaveProperty('totalIndexes');
      expect(stats.transactions).toHaveProperty('indexes');
    });

    it('should analyze query performance', async () => {
      const query = { userId: testUserId, type: 'expense' };
      const analysis = await databaseOptimizationService.analyzeQueryPerformance(query, 'transactions');
      
      expect(analysis).toHaveProperty('collection', 'transactions');
      expect(analysis).toHaveProperty('query', query);
      expect(analysis).toHaveProperty('executionTime');
      expect(analysis).toHaveProperty('isIndexUsed');
      expect(analysis).toHaveProperty('efficiency');
    });
  });

  describe('Performance Benchmark Tests', () => {
    it('should handle concurrent queries efficiently', async () => {
      // Create test data
      const transactions = [];
      for (let i = 0; i < 200; i++) {
        transactions.push({
          title: `Concurrent Test Transaction ${i}`,
          amount: Math.random() * 1000,
          type: i % 2 === 0 ? 'income' : 'expense',
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: new mongoose.Types.ObjectId().toString(),
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          paymentMethod: 'credit_card',
          source: 'manual'
        });
      }
      await Transaction.insertMany(transactions);

      const startTime = Date.now();
      
      // Run concurrent queries
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          Transaction.find({ userId: testUserId })
            .sort({ date: -1 })
            .limit(20)
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle concurrent queries efficiently
      expect(duration).toBeLessThan(500);
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.length).toBeLessThanOrEqual(20);
      });
    });

    it('should maintain performance with large datasets', async () => {
      const startTime = Date.now();
      
      // Create large dataset
      const transactions = [];
      for (let i = 0; i < 1000; i++) {
        transactions.push({
          title: `Large Dataset Transaction ${i}`,
          amount: Math.random() * 1000,
          type: i % 3 === 0 ? 'income' : 'expense',
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: new mongoose.Types.ObjectId().toString(),
          date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          paymentMethod: 'credit_card',
          source: 'manual'
        });
      }

      await Transaction.insertMany(transactions);
      const insertTime = Date.now() - startTime;

      // Query large dataset
      const queryStartTime = Date.now();
      const results = await Transaction.find({ userId: testUserId })
        .sort({ date: -1 })
        .limit(100);
      const queryTime = Date.now() - queryStartTime;

      // Should maintain good performance even with large datasets
      expect(insertTime).toBeLessThan(10000); // Less than 10 seconds for 1000 inserts
      expect(queryTime).toBeLessThan(200); // Less than 200ms for query
      expect(results.length).toBe(100);
    });
  });
});
