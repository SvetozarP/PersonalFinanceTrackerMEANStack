import mongoose from 'mongoose';
import { Transaction } from '../../modules/financial/transactions/models/transaction.model';
import { Category } from '../../modules/financial/categories/models/category.model';
import Budget from '../../modules/financial/budgets/models/budget.model';
import { databaseOptimizationService } from '../../shared/services/database-optimization.service';

describe('Performance Benchmark Tests', () => {
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
      name: 'Benchmark Test Category',
      userId: testUserId,
      color: '#FF0000',
      icon: 'benchmark'
    });
    await category.save();
    testCategoryId = (category._id as any).toString();

    // Create test budget
    const budget = new Budget({
      name: 'Benchmark Test Budget',
      userId: testUserId,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      totalAmount: 10000,
      currency: 'USD',
      period: 'monthly',
      categoryAllocations: [{
        categoryId: testCategoryId,
        allocatedAmount: 5000,
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

  describe('Transaction Performance Benchmarks', () => {
    it('should insert transactions efficiently', async () => {
      const transactionCount = 1000;
      const transactions = [];

      // Prepare test data
      for (let i = 0; i < transactionCount; i++) {
        transactions.push({
          title: `Benchmark Transaction ${i}`,
          amount: Math.random() * 1000,
          type: i % 2 === 0 ? 'income' : 'expense',
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: new mongoose.Types.ObjectId().toString(),
          date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          paymentMethod: 'credit_card',
          source: 'manual'
        });
      }

      // Benchmark insert performance
      const startTime = Date.now();
      await Transaction.insertMany(transactions);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(10000); // Less than 10 seconds for 1000 inserts
      
      const transactionsPerSecond = transactionCount / (duration / 1000);
      expect(transactionsPerSecond).toBeGreaterThan(50); // At least 50 transactions per second
    });

    it('should query transactions by user efficiently', async () => {
      // Create test data
      const transactions = [];
      for (let i = 0; i < 500; i++) {
        transactions.push({
          title: `Query Test Transaction ${i}`,
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

      // Benchmark query performance
      const startTime = Date.now();
      const results = await Transaction.find({ userId: testUserId })
        .sort({ date: -1 })
        .limit(100);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(200); // Less than 200ms (more realistic for test environment)
      expect(results.length).toBe(100);
    });

    it('should query transactions by date range efficiently', async () => {
      // Create test data with various dates
      const transactions = [];
      for (let i = 0; i < 1000; i++) {
        transactions.push({
          title: `Date Range Test Transaction ${i}`,
          amount: Math.random() * 1000,
          type: 'expense',
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: new mongoose.Types.ObjectId().toString(),
          date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Last 90 days
          paymentMethod: 'credit_card',
          source: 'manual'
        });
      }
      await Transaction.insertMany(transactions);

      // Benchmark date range query
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endDate = new Date();

      const startTime = Date.now();
      const results = await Transaction.find({
        userId: testUserId,
        date: { $gte: startDate, $lte: endDate }
      }).sort({ date: -1 });
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThanOrEqual(250); // Less than or equal to 250ms
      expect(results.length).toBeGreaterThan(0);
    });

    it('should perform aggregation queries efficiently', async () => {
      // Create test data
      const transactions = [];
      for (let i = 0; i < 2000; i++) {
        transactions.push({
          title: `Aggregation Test Transaction ${i}`,
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

      // Benchmark aggregation performance
      const startTime = Date.now();
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
            avgAmount: { $avg: '$amount' },
            minAmount: { $min: '$amount' },
            maxAmount: { $max: '$amount' }
          }
        },
        {
          $sort: { totalAmount: -1 as 1 | -1 }
        }
      ];

      const results = await Transaction.aggregate(pipeline);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(500); // Less than 500ms
      expect(results.length).toBeGreaterThan(0);
    });

    it('should perform text search efficiently', async () => {
      // Create test data with searchable content
      const transactions = [];
      const searchTerms = ['grocery', 'restaurant', 'gas station', 'shopping', 'entertainment', 'utilities'];
      
      for (let i = 0; i < 1000; i++) {
        const term = searchTerms[i % searchTerms.length];
        transactions.push({
          title: `${term} transaction ${i}`,
          description: `This is a ${term} related transaction for benchmarking`,
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

      // Benchmark text search performance
      const startTime = Date.now();
      const results = await Transaction.find({
        $text: { $search: 'grocery restaurant shopping' },
        userId: testUserId
      }).sort({ score: { $meta: 'textScore' } }).limit(50);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(300); // Less than 300ms
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Budget Performance Benchmarks', () => {
    it('should query active budgets efficiently', async () => {
      // Create multiple budgets
      const budgets = [];
      for (let i = 0; i < 100; i++) {
        budgets.push({
          name: `Benchmark Budget ${i}`,
          userId: testUserId,
          startDate: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000),
          totalAmount: Math.random() * 10000,
          currency: 'USD',
          period: 'monthly',
          status: i % 3 === 0 ? 'active' : 'paused',
          categoryAllocations: [{
            categoryId: testCategoryId,
            allocatedAmount: Math.random() * 2000,
            isFlexible: false,
            priority: 1
          }]
        });
      }
      await Budget.insertMany(budgets);

      // Benchmark active budget query
      const startTime = Date.now();
      const results = await Budget.find({
        userId: testUserId,
        status: 'active'
      }).sort({ startDate: -1 });
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(100); // Less than 100ms
      expect(results.length).toBeGreaterThan(0);
    });

    it('should query budgets by date range efficiently', async () => {
      // Create budgets with various date ranges
      const budgets = [];
      for (let i = 0; i < 200; i++) {
        budgets.push({
          name: `Date Range Budget ${i}`,
          userId: testUserId,
          startDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + Math.random() * 180 * 24 * 60 * 60 * 1000),
          totalAmount: Math.random() * 5000,
          currency: 'USD',
          period: 'monthly',
          status: 'active',
          categoryAllocations: [{
            categoryId: testCategoryId,
            allocatedAmount: Math.random() * 1000,
            isFlexible: false,
            priority: 1
          }]
        });
      }
      await Budget.insertMany(budgets);

      // Benchmark date range query
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const startTime = Date.now();
      const results = await Budget.find({
        userId: testUserId,
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(150); // Less than 150ms
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Category Performance Benchmarks', () => {
    it('should build category tree efficiently', async () => {
      // Create hierarchical categories
      const parentCategories = [];
      for (let i = 0; i < 10; i++) {
        parentCategories.push({
          name: `Parent Category ${i}`,
          userId: testUserId,
          color: '#FF0000',
          icon: 'parent'
        });
      }
      const parents = await Category.insertMany(parentCategories);

      // Create child categories
      const childCategories = [];
      for (let i = 0; i < 100; i++) {
        const parentIndex = i % parents.length;
        childCategories.push({
          name: `Child Category ${i}`,
          userId: testUserId,
          parentId: parents[parentIndex]._id,
          color: '#00FF00',
          icon: 'child'
        });
      }
      await Category.insertMany(childCategories);

      // Benchmark category tree building
      const startTime = Date.now();
      const categories = await Category.find({ userId: testUserId })
        .sort({ level: 1, name: 1 });
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(200); // Less than 200ms
      expect(categories.length).toBeGreaterThanOrEqual(110); // 10 parents + 100 children (may have more from other tests)
    });

    it('should query categories by level efficiently', async () => {
      // Create categories at different levels
      const parentCategory = new Category({
        name: 'Root Category Benchmark',
        userId: testUserId,
        color: '#FF0000',
        icon: 'root'
      });
      await parentCategory.save();

      // Create child categories one by one to ensure level calculation
      const childCategories = [];
      for (let i = 0; i < 200; i++) {
        const childCategory = new Category({
          name: `Level 1 Category Benchmark ${i}`,
          userId: testUserId,
          parentId: parentCategory._id,
          color: '#00FF00',
          icon: 'level1'
        });
        await childCategory.save();
        childCategories.push(childCategory);
      }

      // Benchmark level-based query
      const startTime = Date.now();
      const results = await Category.find({
        userId: testUserId,
        level: 1
      });
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(100); // Less than 100ms
      expect(results.length).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Concurrent Performance Benchmarks', () => {
    it('should handle concurrent read operations efficiently', async () => {
      // Create test data
      const transactions = [];
      for (let i = 0; i < 1000; i++) {
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

      // Benchmark concurrent queries
      const startTime = Date.now();
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          Transaction.find({ userId: testUserId })
            .sort({ date: -1 })
            .limit(50)
        );
      }

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(1000); // Less than 1 second for 20 concurrent queries
      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result.length).toBeLessThanOrEqual(50);
      });
    });

    it('should handle concurrent write operations efficiently', async () => {
      // Benchmark concurrent inserts
      const startTime = Date.now();
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        const transactions = [];
        for (let j = 0; j < 100; j++) {
          transactions.push({
            title: `Concurrent Write Transaction ${i}-${j}`,
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
        promises.push(Transaction.insertMany(transactions));
      }

      await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Performance assertions
      expect(duration).toBeLessThan(5000); // Less than 5 seconds for 1000 concurrent inserts
    });
  });

  describe('Memory Usage Benchmarks', () => {
    it('should maintain reasonable memory usage during large operations', async () => {
      const initialMemory = process.memoryUsage();

      // Create large dataset
      const transactions = [];
      for (let i = 0; i < 5000; i++) {
        transactions.push({
          title: `Memory Test Transaction ${i}`,
          amount: Math.random() * 1000,
          type: 'expense',
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: new mongoose.Types.ObjectId().toString(),
          date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          paymentMethod: 'credit_card',
          source: 'manual'
        });
      }

      await Transaction.insertMany(transactions);

      // Perform memory-intensive operations
      const results = await Transaction.find({ userId: testUserId })
        .sort({ date: -1 })
        .limit(1000);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Performance assertions
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB increase
      expect(results.length).toBe(1000);
    });
  });
});
