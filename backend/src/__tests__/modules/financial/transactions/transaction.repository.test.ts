import mongoose from 'mongoose';
import { TransactionRepository } from '../../../../modules/financial/transactions/repositories/transaction.repository';
import { Transaction } from '../../../../modules/financial/transactions/models/transaction.model';
import {
  ITransaction,
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  RecurrencePattern,
} from '../../../../modules/financial/transactions/interfaces/transaction.interface';

// Mock the logger service
jest.mock('../../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Transaction Repository', () => {
  let transactionRepository: TransactionRepository;
  let testUserId: mongoose.Types.ObjectId;
  let testAccountId: mongoose.Types.ObjectId;
  let testCategoryId: mongoose.Types.ObjectId;

  // Helper function to create valid transaction data
  const createValidTransactionData = (
    overrides: Partial<ITransaction> = {}
  ) => ({
    amount: 100,
    type: TransactionType.EXPENSE,
    status: TransactionStatus.COMPLETED,
    date: new Date(),
    description: 'Test Transaction',
    title: 'Test Transaction',
    userId: testUserId,
    accountId: testAccountId,
    categoryId: testCategoryId,
    paymentMethod: PaymentMethod.CASH,
    source: 'manual',
    currency: 'USD',
    isDeleted: false,
    tags: [],
    timezone: 'UTC',
    isRecurring: false,
    recurrencePattern: RecurrencePattern.NONE,
    attachments: [],
    ...overrides,
  });

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId();
    testAccountId = new mongoose.Types.ObjectId();
    testCategoryId = new mongoose.Types.ObjectId();
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create the actual repository instance
    transactionRepository = new TransactionRepository();

    // Clear any existing test data
    await Transaction.deleteMany({});
  });

  afterEach(async () => {
    // Clean up test data
    await Transaction.deleteMany({});
  });

  describe('findByUserId', () => {
    it('should find transactions by user ID with pagination', async () => {
      // Create test transactions
      const transaction1 = await Transaction.create(
        createValidTransactionData({
          description: 'Test Transaction 1',
          amount: 100,
        })
      );

      const transaction2 = await Transaction.create(
        createValidTransactionData({
          description: 'Test Transaction 2',
          amount: 200,
          type: TransactionType.INCOME,
        })
      );

      const result = await transactionRepository.findByUserId(
        testUserId.toString(),
        {
          page: 1,
          limit: 10,
          populate: [],
        }
      );

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.transactions).toContainEqual(
        expect.objectContaining({ description: 'Test Transaction 1' })
      );
      expect(result.transactions).toContainEqual(
        expect.objectContaining({ description: 'Test Transaction 2' })
      );
    });

    it('should handle pagination correctly', async () => {
      // Create 15 transactions
      for (let i = 0; i < 15; i++) {
        await Transaction.create(
          createValidTransactionData({
            description: `Transaction ${i + 1}`,
            amount: 100 + i,
          })
        );
      }

      const result = await transactionRepository.findByUserId(
        testUserId.toString(),
        {
          page: 2,
          limit: 10,
          populate: [],
        }
      );

      expect(result.transactions).toHaveLength(5);
      expect(result.total).toBe(15);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should handle custom sorting', async () => {
      const transaction1 = await Transaction.create(
        createValidTransactionData({
          amount: 100,
          date: new Date('2023-01-01'),
        })
      );
      const transaction2 = await Transaction.create(
        createValidTransactionData({
          amount: 200,
          date: new Date('2023-01-02'),
        })
      );

      const result = await transactionRepository.findByUserId(
        testUserId.toString(),
        {
          page: 1,
          limit: 10,
          sort: { amount: 1 }, // Sort by amount ascending
          populate: [],
        }
      );

      expect(result.transactions[0].amount).toBe(100);
      expect(result.transactions[1].amount).toBe(200);
    });

    it('should handle custom filtering', async () => {
      const transaction1 = await Transaction.create(
        createValidTransactionData({
          type: TransactionType.EXPENSE,
          amount: 100,
        })
      );
      const transaction2 = await Transaction.create(
        createValidTransactionData({
          type: TransactionType.INCOME,
          amount: 200,
        })
      );

      const result = await transactionRepository.findByUserId(
        testUserId.toString(),
        {
          page: 1,
          limit: 10,
          filter: { type: TransactionType.EXPENSE },
          populate: [],
        }
      );

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].type).toBe(TransactionType.EXPENSE);
    });

    it('should handle custom populate options', async () => {
      const transaction = await Transaction.create(
        createValidTransactionData()
      );

      const result = await transactionRepository.findByUserId(
        testUserId.toString(),
        {
          page: 1,
          limit: 10,
          populate: ['categoryId', 'subcategoryId'],
        }
      );

      expect(result.transactions).toHaveLength(1);
    });

    it('should handle default values when options not provided', async () => {
      const transaction = await Transaction.create(
        createValidTransactionData()
      );

      const result = await transactionRepository.findByUserId(
        testUserId.toString(),
        {
          populate: [],
        }
      );

      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle database errors gracefully', async () => {
      // Mock the model to throw an error
      const mockError = new Error('Database connection failed');

      // Create a mock that throws an error when populate is called
      const originalFind = transactionRepository['model'].find;
      transactionRepository['model'].find = jest.fn().mockReturnValue({
        populate: jest.fn().mockImplementation(() => {
          throw mockError;
        }),
      } as any);

      await expect(
        transactionRepository.findByUserId(testUserId.toString(), {
          populate: [],
        })
      ).rejects.toThrow('Database connection failed');

      // Restore the original method
      transactionRepository['model'].find = originalFind;
    });

    it('should handle count errors gracefully', async () => {
      // Mock the countDocuments to throw an error
      const mockError = new Error('Count failed');
      jest
        .spyOn(transactionRepository['model'], 'countDocuments')
        .mockRejectedValueOnce(mockError);

      await expect(
        transactionRepository.findByUserId(testUserId.toString(), {
          populate: [],
        })
      ).rejects.toThrow('Count failed');
    });

    it('should handle edge case pagination values', async () => {
      // Create 5 transactions
      for (let i = 0; i < 5; i++) {
        await Transaction.create(
          createValidTransactionData({
            description: `Transaction ${i + 1}`,
          })
        );
      }

      // Test with page 1, limit 3
      const result1 = await transactionRepository.findByUserId(
        testUserId.toString(),
        {
          page: 1,
          limit: 3,
          populate: [],
        }
      );

      expect(result1.transactions).toHaveLength(3);
      expect(result1.totalPages).toBe(2);

      // Test with page 2, limit 3
      const result2 = await transactionRepository.findByUserId(
        testUserId.toString(),
        {
          page: 2,
          limit: 3,
          populate: [],
        }
      );

      expect(result2.transactions).toHaveLength(2);
      expect(result2.totalPages).toBe(2);
    });
  });

  describe('findByAccountId', () => {
    it('should find transactions by account ID successfully', async () => {
      const transaction = await Transaction.create(
        createValidTransactionData()
      );

      const result = await transactionRepository.findByAccountId(
        testAccountId.toString(),
        testUserId.toString(),
        {
          page: 1,
          limit: 10,
        }
      );

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle default options for findByAccountId', async () => {
      const transaction = await Transaction.create(
        createValidTransactionData()
      );

      const result = await transactionRepository.findByAccountId(
        testAccountId.toString(),
        testUserId.toString()
      );

      expect(result.transactions).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle database errors in findByAccountId', async () => {
      const mockError = new Error('Database error');

      // Create a mock that throws an error when populate is called
      const originalFind = transactionRepository['model'].find;
      transactionRepository['model'].find = jest.fn().mockReturnValue({
        populate: jest.fn().mockImplementation(() => {
          throw mockError;
        }),
      } as any);

      await expect(
        transactionRepository.findByAccountId(
          testAccountId.toString(),
          testUserId.toString()
        )
      ).rejects.toThrow('Database error');

      // Restore the original method
      transactionRepository['model'].find = originalFind;
    });
  });

  describe('findByDateRange', () => {
    it('should find transactions by date range successfully', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const transaction = await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
        })
      );

      const result = await transactionRepository.findByDateRange(
        testUserId.toString(),
        startDate,
        endDate
      );

      expect(result).toHaveLength(1);
    });

    it('should handle all optional filters in findByDateRange', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const transaction = await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          accountId: testAccountId,
          categoryId: testCategoryId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.COMPLETED,
          amount: 150,
          tags: ['test'],
        })
      );

      const result = await transactionRepository.findByDateRange(
        testUserId.toString(),
        startDate,
        endDate,
        {
          accountId: testAccountId.toString(),
          categoryId: testCategoryId.toString(),
          type: TransactionType.EXPENSE,
          status: TransactionStatus.COMPLETED,
          minAmount: 100,
          maxAmount: 200,
          tags: ['test'],
          populate: ['categoryId'],
        }
      );

      expect(result).toHaveLength(1);
    });

    it('should handle amount range filtering correctly', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      // Create transactions with different amounts
      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          amount: 50,
        })
      );
      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-16'),
          amount: 150,
        })
      );
      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-17'),
          amount: 250,
        })
      );

      // Test with only min amount
      const result1 = await transactionRepository.findByDateRange(
        testUserId.toString(),
        startDate,
        endDate,
        { minAmount: 100 }
      );
      expect(result1).toHaveLength(2);

      // Test with only max amount
      const result2 = await transactionRepository.findByDateRange(
        testUserId.toString(),
        startDate,
        endDate,
        { maxAmount: 200 }
      );
      expect(result2).toHaveLength(2);

      // Test with both min and max
      const result3 = await transactionRepository.findByDateRange(
        testUserId.toString(),
        startDate,
        endDate,
        { minAmount: 100, maxAmount: 200 }
      );
      expect(result3).toHaveLength(1);
    });

    it('should handle tags filtering correctly', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          tags: ['food', 'groceries'],
        })
      );
      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-16'),
          tags: ['entertainment'],
        })
      );

      const result = await transactionRepository.findByDateRange(
        testUserId.toString(),
        startDate,
        endDate,
        { tags: ['food'] }
      );

      expect(result).toHaveLength(1);
      expect(result[0].tags).toContain('food');
    });

    it('should handle database errors in findByDateRange', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const mockError = new Error('Database error');

      // Create a mock that throws an error when populate is called
      const originalFind = transactionRepository['model'].find;
      transactionRepository['model'].find = jest.fn().mockReturnValue({
        populate: jest.fn().mockImplementation(() => {
          throw mockError;
        }),
      } as any);

      await expect(
        transactionRepository.findByDateRange(
          testUserId.toString(),
          startDate,
          endDate
        )
      ).rejects.toThrow('Database error');

      // Restore the original method
      transactionRepository['model'].find = originalFind;
    });
  });

  describe('getTransactionStats', () => {
    it('should generate category statistics successfully', async () => {
      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.EXPENSE,
          amount: 100,
        })
      );
      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.INCOME,
          amount: 200,
        })
      );

      const result = await transactionRepository.getTransactionStats(
        testUserId.toString(),
        { groupBy: 'category' }
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle all groupBy options correctly', async () => {
      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.EXPENSE,
          amount: 100,
          paymentMethod: PaymentMethod.CASH,
          date: new Date('2023-06-15'),
        })
      );

      // Test type grouping
      const typeResult = await transactionRepository.getTransactionStats(
        testUserId.toString(),
        { groupBy: 'type' }
      );
      expect(typeResult).toBeDefined();

      // Test month grouping
      const monthResult = await transactionRepository.getTransactionStats(
        testUserId.toString(),
        { groupBy: 'month' }
      );
      expect(monthResult).toBeDefined();

      // Test day grouping
      const dayResult = await transactionRepository.getTransactionStats(
        testUserId.toString(),
        { groupBy: 'day' }
      );
      expect(dayResult).toBeDefined();

      // Test payment method grouping
      const paymentResult = await transactionRepository.getTransactionStats(
        testUserId.toString(),
        { groupBy: 'paymentMethod' }
      );
      expect(paymentResult).toBeDefined();

      // Test default grouping
      const defaultResult = await transactionRepository.getTransactionStats(
        testUserId.toString(),
        {}
      );
      expect(defaultResult).toBeDefined();
    });

    it('should handle date range filtering in statistics', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          amount: 100,
        })
      );

      const result = await transactionRepository.getTransactionStats(
        testUserId.toString(),
        {
          startDate,
          endDate,
          groupBy: 'category',
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle account filtering in statistics', async () => {
      await Transaction.create(
        createValidTransactionData({
          amount: 100,
        })
      );

      const result = await transactionRepository.getTransactionStats(
        testUserId.toString(),
        {
          accountId: testAccountId.toString(),
          groupBy: 'category',
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle includeSubcategories option', async () => {
      await Transaction.create(
        createValidTransactionData({
          amount: 100,
        })
      );

      const result = await transactionRepository.getTransactionStats(
        testUserId.toString(),
        {
          groupBy: 'category',
          includeSubcategories: true,
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle database errors in getTransactionStats', async () => {
      const mockError = new Error('Aggregation failed');
      jest
        .spyOn(transactionRepository['model'], 'aggregate')
        .mockRejectedValueOnce(mockError);

      await expect(
        transactionRepository.getTransactionStats(testUserId.toString())
      ).rejects.toThrow('Aggregation failed');
    });
  });

  describe('getCashFlowAnalysis', () => {
    it('should generate daily cash flow analysis', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          type: TransactionType.INCOME,
          amount: 200,
        })
      );
      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          type: TransactionType.EXPENSE,
          amount: 100,
        })
      );

      const result = await transactionRepository.getCashFlowAnalysis(
        testUserId.toString(),
        {
          startDate,
          endDate,
          interval: 'daily',
        }
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle weekly interval correctly', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          amount: 100,
        })
      );

      const result = await transactionRepository.getCashFlowAnalysis(
        testUserId.toString(),
        {
          startDate,
          endDate,
          interval: 'weekly',
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle monthly interval correctly', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          amount: 100,
        })
      );

      const result = await transactionRepository.getCashFlowAnalysis(
        testUserId.toString(),
        {
          startDate,
          endDate,
          interval: 'monthly',
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle default interval (monthly)', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          amount: 100,
        })
      );

      const result = await transactionRepository.getCashFlowAnalysis(
        testUserId.toString(),
        {
          startDate,
          endDate,
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle account filtering in cash flow analysis', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          amount: 100,
        })
      );

      const result = await transactionRepository.getCashFlowAnalysis(
        testUserId.toString(),
        {
          startDate,
          endDate,
          accountId: testAccountId.toString(),
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle database errors in getCashFlowAnalysis', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const mockError = new Error('Aggregation failed');
      jest
        .spyOn(transactionRepository['model'], 'aggregate')
        .mockRejectedValueOnce(mockError);

      await expect(
        transactionRepository.getCashFlowAnalysis(testUserId.toString(), {
          startDate,
          endDate,
        })
      ).rejects.toThrow('Aggregation failed');
    });
  });

  describe('getSpendingInsights', () => {
    it('should generate spending insights successfully', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          type: TransactionType.EXPENSE,
          amount: 100,
        })
      );

      const result = await transactionRepository.getSpendingInsights(
        testUserId.toString(),
        {
          startDate,
          endDate,
        }
      );

      expect(result).toBeDefined();
      expect(result.topCategories).toBeDefined();
      expect(result.totalSpent).toBeDefined();
      expect(result.totalTransactions).toBeDefined();
    });

    it('should handle account filtering in spending insights', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          type: TransactionType.EXPENSE,
          amount: 100,
        })
      );

      const result = await transactionRepository.getSpendingInsights(
        testUserId.toString(),
        {
          startDate,
          endDate,
          accountId: testAccountId.toString(),
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle custom top categories limit', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          type: TransactionType.EXPENSE,
          amount: 100,
        })
      );

      const result = await transactionRepository.getSpendingInsights(
        testUserId.toString(),
        {
          startDate,
          endDate,
          topCategories: 3,
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle database errors in getSpendingInsights', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const mockError = new Error('Aggregation failed');
      jest
        .spyOn(transactionRepository['model'], 'aggregate')
        .mockRejectedValueOnce(mockError);

      await expect(
        transactionRepository.getSpendingInsights(testUserId.toString(), {
          startDate,
          endDate,
        })
      ).rejects.toThrow('Aggregation failed');
    });
  });

  describe('getTransactionsByTags', () => {
    it('should generate transactions by tags analysis successfully', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          tags: ['food', 'groceries'],
        })
      );

      const result = await transactionRepository.getTransactionsByTags(
        testUserId.toString(),
        ['food'],
        {
          startDate,
          endDate,
          groupBy: 'category',
        }
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle different groupBy options for tags analysis', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          tags: ['food'],
        })
      );

      // Test tag grouping
      const tagResult = await transactionRepository.getTransactionsByTags(
        testUserId.toString(),
        ['food'],
        {
          startDate,
          endDate,
          groupBy: 'tag',
        }
      );
      expect(tagResult).toBeDefined();

      // Test month grouping
      const monthResult = await transactionRepository.getTransactionsByTags(
        testUserId.toString(),
        ['food'],
        {
          startDate,
          endDate,
          groupBy: 'month',
        }
      );
      expect(monthResult).toBeDefined();

      // Test default grouping
      const defaultResult = await transactionRepository.getTransactionsByTags(
        testUserId.toString(),
        ['food'],
        {
          startDate,
          endDate,
        }
      );
      expect(defaultResult).toBeDefined();
    });

    it('should handle date range filtering in tags analysis', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          tags: ['food'],
        })
      );

      const result = await transactionRepository.getTransactionsByTags(
        testUserId.toString(),
        ['food'],
        {
          startDate,
          endDate,
          groupBy: 'category',
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle database errors in getTransactionsByTags', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      const mockError = new Error('Aggregation failed');
      jest
        .spyOn(transactionRepository['model'], 'aggregate')
        .mockRejectedValueOnce(mockError);

      await expect(
        transactionRepository.getTransactionsByTags(
          testUserId.toString(),
          ['food'],
          {
            startDate,
            endDate,
          }
        )
      ).rejects.toThrow('Aggregation failed');
    });
  });

  describe('createRecurringSeries', () => {
    it('should create recurring transaction series successfully', async () => {
      const transactionData = createValidTransactionData({
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
      });

      // Mock the model's createRecurringSeries method
      const mockSeries = [
        { ...transactionData, _id: new mongoose.Types.ObjectId() },
        { ...transactionData, _id: new mongoose.Types.ObjectId() },
      ];

      jest
        .spyOn(transactionRepository['model'], 'createRecurringSeries')
        .mockResolvedValueOnce(mockSeries as any);

      const result = await transactionRepository.createRecurringSeries(
        transactionData,
        'monthly',
        new Date('2023-12-31')
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
    });

    it('should handle database errors in createRecurringSeries', async () => {
      const transactionData = createValidTransactionData();
      const mockError = new Error('Series creation failed');

      jest
        .spyOn(transactionRepository['model'], 'createRecurringSeries')
        .mockRejectedValueOnce(mockError);

      await expect(
        transactionRepository.createRecurringSeries(
          transactionData,
          'monthly',
          new Date('2023-12-31')
        )
      ).rejects.toThrow('Series creation failed');
    });
  });

  describe('Inherited Base Repository Methods', () => {
    describe('findById', () => {
      it('should find transaction by ID', async () => {
        const transaction = await Transaction.create(
          createValidTransactionData()
        );

        const foundTransaction = await transactionRepository.findById(
          (transaction._id as mongoose.Types.ObjectId).toString()
        );

        expect(foundTransaction).toBeDefined();
        expect(foundTransaction?.description).toBe('Test Transaction');
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const foundTransaction = await transactionRepository.findById(
          nonExistentId.toString()
        );

        expect(foundTransaction).toBeNull();
      });
    });

    describe('create', () => {
      it('should create a new transaction', async () => {
        const newTransactionData = createValidTransactionData({
          description: 'New Transaction',
        });

        const newTransaction =
          await transactionRepository.create(newTransactionData);

        expect(newTransaction.description).toBe('New Transaction');
        expect(newTransaction.userId).toEqual(testUserId);
        expect(newTransaction._id).toBeDefined();
      });
    });

    describe('updateById', () => {
      it('should update transaction by ID', async () => {
        const transaction = await Transaction.create(
          createValidTransactionData({
            description: 'Original Description',
          })
        );

        const updateData = { description: 'Updated Description' };
        const updatedTransaction = await transactionRepository.updateById(
          (transaction._id as mongoose.Types.ObjectId).toString(),
          updateData
        );

        expect(updatedTransaction).toBeDefined();
        expect(updatedTransaction?.description).toBe('Updated Description');
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const updatedTransaction = await transactionRepository.updateById(
          nonExistentId.toString(),
          { description: 'Updated' }
        );

        expect(updatedTransaction).toBeNull();
      });
    });

    describe('deleteById', () => {
      it('should delete transaction by ID', async () => {
        const transaction = await Transaction.create(
          createValidTransactionData()
        );

        const deletedTransaction = await transactionRepository.deleteById(
          (transaction._id as mongoose.Types.ObjectId).toString()
        );

        expect(deletedTransaction).toBeDefined();
        expect(deletedTransaction?.description).toBe('Test Transaction');
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const deletedTransaction = await transactionRepository.deleteById(
          nonExistentId.toString()
        );

        expect(deletedTransaction).toBeNull();
      });
    });

    describe('find', () => {
      it('should find transactions with filter', async () => {
        await Transaction.create(
          createValidTransactionData({
            description: 'Active Transaction',
            isDeleted: false,
          })
        );

        await Transaction.create(
          createValidTransactionData({
            description: 'Inactive Transaction',
            isDeleted: true,
          })
        );

        const transactions = await transactionRepository.find({
          isDeleted: false,
        });

        expect(transactions).toHaveLength(1);
        expect(transactions[0].description).toBe('Active Transaction');
      });

      it('should return empty array for no matches', async () => {
        const transactions = await transactionRepository.find({
          isDeleted: true,
        });

        expect(transactions).toHaveLength(0);
      });
    });

    describe('findOne', () => {
      it('should find one transaction with filter', async () => {
        await Transaction.create(createValidTransactionData());

        const transaction = await transactionRepository.findOne({
          description: 'Test Transaction',
        });

        expect(transaction).toBeDefined();
        expect(transaction?.description).toBe('Test Transaction');
      });

      it('should return null for no matches', async () => {
        const transaction = await transactionRepository.findOne({
          description: 'Non-existent',
        });

        expect(transaction).toBeNull();
      });
    });

    describe('count', () => {
      it('should count transactions with filter', async () => {
        await Transaction.create(
          createValidTransactionData({
            description: 'Active Transaction',
            isDeleted: false,
          })
        );

        await Transaction.create(
          createValidTransactionData({
            description: 'Inactive Transaction',
            isDeleted: true,
          })
        );

        const count = await transactionRepository.count({ isDeleted: false });

        expect(count).toBe(1);
      });

      it('should return 0 for no matches', async () => {
        const count = await transactionRepository.count({ isDeleted: true });

        expect(count).toBe(0);
      });
    });

    describe('exists', () => {
      it('should return true for existing transaction', async () => {
        const transaction = await Transaction.create(
          createValidTransactionData()
        );

        const exists = await transactionRepository.exists({
          _id: transaction._id as mongoose.Types.ObjectId,
        });

        expect(exists).toBe(true);
      });

      it('should return false for non-existent transaction', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();

        const exists = await transactionRepository.exists({
          _id: nonExistentId,
        });

        expect(exists).toBe(false);
      });
    });

    describe('updateMany', () => {
      it('should update many transactions', async () => {
        await Transaction.create(
          createValidTransactionData({
            description: 'Transaction 1',
          })
        );

        await Transaction.create(
          createValidTransactionData({
            description: 'Transaction 2',
          })
        );

        const result = await transactionRepository.updateMany(
          { userId: testUserId },
          { status: TransactionStatus.PENDING }
        );

        expect(result.modifiedCount).toBe(2);
      });
    });

    describe('deleteMany', () => {
      it('should delete many transactions', async () => {
        await Transaction.create(
          createValidTransactionData({
            description: 'Transaction 1',
          })
        );

        await Transaction.create(
          createValidTransactionData({
            description: 'Transaction 2',
          })
        );

        const result = await transactionRepository.deleteMany({
          userId: testUserId,
        });

        expect(result.deletedCount).toBe(2);
      });
    });

    describe('aggregate', () => {
      it('should execute aggregation pipeline', async () => {
        await Transaction.create(
          createValidTransactionData({
            description: 'Transaction 1',
          })
        );

        await Transaction.create(
          createValidTransactionData({
            description: 'Transaction 2',
          })
        );

        const result = await transactionRepository.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(testUserId.toString()),
            },
          },
          { $group: { _id: null, total: { $sum: 1 } } },
        ]);

        expect(result).toHaveLength(1);
        expect(result[0].total).toBe(2);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock the model to throw an error
      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest
                .fn()
                .mockRejectedValue(new Error('Connection failed')),
            }),
          }),
        }),
      });
      const originalFind = transactionRepository['model'].find;

      transactionRepository['model'].find = mockFind;

      await expect(
        transactionRepository.findByUserId(testUserId.toString(), {
          populate: [],
        })
      ).rejects.toThrow('Connection failed');

      // Restore the original method
      transactionRepository['model'].find = originalFind;
    });

    it('should handle validation errors gracefully', async () => {
      const invalidData = { amount: 'invalid' } as any;

      await expect(transactionRepository.create(invalidData)).rejects.toThrow();
    });
  });

  describe('getTransactionStats edge cases', () => {
    it('should handle type grouping correctly', async () => {
      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.EXPENSE,
          amount: 100,
        })
      );

      const result = await transactionRepository.getTransactionStats(
        testUserId.toString(),
        { groupBy: 'type' }
      );

      expect(result).toBeDefined();
    });

    it('should handle payment method grouping correctly', async () => {
      await Transaction.create(
        createValidTransactionData({
          paymentMethod: PaymentMethod.CASH,
          amount: 100,
        })
      );

      const result = await transactionRepository.getTransactionStats(
        testUserId.toString(),
        { groupBy: 'paymentMethod' }
      );

      expect(result).toBeDefined();
    });

    it('should handle includeSubcategories option correctly', async () => {
      await Transaction.create(
        createValidTransactionData({
          amount: 100,
        })
      );

      const result = await transactionRepository.getTransactionStats(
        testUserId.toString(),
        {
          groupBy: 'category',
          includeSubcategories: true,
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe('getCashFlowAnalysis edge cases', () => {
    it('should handle weekly interval correctly', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          amount: 100,
        })
      );

      const result = await transactionRepository.getCashFlowAnalysis(
        testUserId.toString(),
        {
          startDate,
          endDate,
          interval: 'weekly',
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle daily interval correctly', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          amount: 100,
        })
      );

      const result = await transactionRepository.getCashFlowAnalysis(
        testUserId.toString(),
        {
          startDate,
          endDate,
          interval: 'daily',
        }
      );

      expect(result).toBeDefined();
    });

    it('should handle account filtering in cash flow analysis', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          amount: 100,
        })
      );

      const result = await transactionRepository.getCashFlowAnalysis(
        testUserId.toString(),
        {
          startDate,
          endDate,
          accountId: testAccountId.toString(),
        }
      );

      expect(result).toBeDefined();
    });
  });

  describe('findByDateRange edge cases', () => {
    it('should handle populate option in date range search', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          date: new Date('2023-01-15'),
          amount: 100,
        })
      );

      const result = await transactionRepository.findByDateRange(
        testUserId.toString(),
        startDate,
        endDate,
        {
          populate: ['categoryId'],
        }
      );

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
    });
  });

  describe('findByUserId edge cases', () => {
    it('should handle empty results gracefully', async () => {
      const result = await transactionRepository.findByUserId(
        testUserId.toString(),
        {
          page: 1,
          limit: 10,
          populate: [],
        }
      );

      expect(result.transactions).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(0);
    });

    it('should handle custom sort options', async () => {
      const transaction1 = await Transaction.create(
        createValidTransactionData({
          amount: 100,
          date: new Date('2023-01-01'),
        })
      );
      const transaction2 = await Transaction.create(
        createValidTransactionData({
          amount: 200,
          date: new Date('2023-01-02'),
        })
      );

      const result = await transactionRepository.findByUserId(
        testUserId.toString(),
        {
          page: 1,
          limit: 10,
          sort: { amount: -1 }, // Sort by amount descending
          populate: [],
        }
      );

      expect(result.transactions[0].amount).toBe(200);
      expect(result.transactions[1].amount).toBe(100);
    });

    it('should handle custom filter options', async () => {
      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.EXPENSE,
          amount: 100,
        })
      );
      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.INCOME,
          amount: 200,
        })
      );

      const result = await transactionRepository.findByUserId(
        testUserId.toString(),
        {
          page: 1,
          limit: 10,
          filter: { type: TransactionType.INCOME },
          populate: [],
        }
      );

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].type).toBe(TransactionType.INCOME);
    });
  });

  describe('findByAccountId edge cases', () => {
    it('should handle custom sort options', async () => {
      const transaction1 = await Transaction.create(
        createValidTransactionData({
          amount: 100,
          date: new Date('2023-01-01'),
        })
      );
      const transaction2 = await Transaction.create(
        createValidTransactionData({
          amount: 200,
          date: new Date('2023-01-02'),
        })
      );

      const result = await transactionRepository.findByAccountId(
        testAccountId.toString(),
        testUserId.toString(),
        {
          page: 1,
          limit: 10,
          sort: { amount: -1 },
        }
      );

      expect(result.transactions[0].amount).toBe(200);
      expect(result.transactions[1].amount).toBe(100);
    });

    it('should handle custom filter options', async () => {
      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.EXPENSE,
          amount: 100,
        })
      );
      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.INCOME,
          amount: 200,
        })
      );

      const result = await transactionRepository.findByAccountId(
        testAccountId.toString(),
        testUserId.toString(),
        {
          page: 1,
          limit: 10,
          filter: { type: TransactionType.EXPENSE },
        }
      );

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].type).toBe(TransactionType.EXPENSE);
    });
  });

  describe('getRecurringTransactionAnalysis', () => {
    it('should generate recurring transaction analysis successfully', async () => {
      await Transaction.create(
        createValidTransactionData({
          isRecurring: true,
          recurrencePattern: RecurrencePattern.MONTHLY,
          amount: 100,
          status: TransactionStatus.COMPLETED,
        })
      );

      const result =
        await transactionRepository.getRecurringTransactionAnalysis(
          testUserId.toString()
        );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle account filtering in recurring analysis', async () => {
      await Transaction.create(
        createValidTransactionData({
          isRecurring: true,
          recurrencePattern: RecurrencePattern.WEEKLY,
          amount: 50,
          status: TransactionStatus.COMPLETED,
        })
      );

      const result =
        await transactionRepository.getRecurringTransactionAnalysis(
          testUserId.toString(),
          { accountId: testAccountId.toString() }
        );

      expect(result).toBeDefined();
    });

    it('should handle includeInactive option', async () => {
      await Transaction.create(
        createValidTransactionData({
          isRecurring: true,
          recurrencePattern: RecurrencePattern.BIWEEKLY,
          amount: 75,
          status: TransactionStatus.PENDING,
        })
      );

      const result =
        await transactionRepository.getRecurringTransactionAnalysis(
          testUserId.toString(),
          { includeInactive: true }
        );

      expect(result).toBeDefined();
    });

    it('should handle database errors in recurring analysis', async () => {
      const mockError = new Error('Aggregation failed');
      jest
        .spyOn(transactionRepository['model'], 'aggregate')
        .mockRejectedValueOnce(mockError);

      await expect(
        transactionRepository.getRecurringTransactionAnalysis(
          testUserId.toString()
        )
      ).rejects.toThrow('Aggregation failed');
    });
  });

  describe('getDashboardSummary', () => {
    it('should generate dashboard summary successfully', async () => {
      // Create transactions within the last 30 days (default)
      const now = new Date();

      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.INCOME,
          amount: 1000,
          date: now,
        })
      );

      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.EXPENSE,
          amount: 300,
          date: now,
        })
      );

      const result = await transactionRepository.getDashboardSummary(
        testUserId.toString()
      );

      expect(result).toBeDefined();
      expect(result.totalIncome).toBe(1000);
      expect(result.totalExpenses).toBe(300);
      expect(result.netIncome).toBe(700);
      // The savingsRate is calculated as (netIncome / totalIncome) * 100
      // (700 / 1000) * 100 = 70
      expect(result.savingsRate).toBe(70);
    });

    it('should handle account filtering in dashboard summary', async () => {
      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.INCOME,
          amount: 500,
          date: new Date(),
        })
      );

      const result = await transactionRepository.getDashboardSummary(
        testUserId.toString(),
        { accountId: testAccountId.toString() }
      );

      expect(result).toBeDefined();
    });

    it('should handle custom days option', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);

      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.EXPENSE,
          amount: 200,
          date: oldDate,
        })
      );

      const result = await transactionRepository.getDashboardSummary(
        testUserId.toString(),
        { days: 30 }
      );

      expect(result).toBeDefined();
      expect(result.totalExpenses).toBe(0); // Should not include old transaction
    });

    it('should handle zero income case for savings rate', async () => {
      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.EXPENSE,
          amount: 100,
          date: new Date(),
        })
      );

      const result = await transactionRepository.getDashboardSummary(
        testUserId.toString()
      );

      expect(result).toBeDefined();
      expect(result.totalIncome).toBe(0);
      expect(result.savingsRate).toBe(0);
    });

    it('should handle database errors in dashboard summary', async () => {
      const mockError = new Error('Aggregation failed');
      jest
        .spyOn(transactionRepository['model'], 'aggregate')
        .mockRejectedValueOnce(mockError);

      await expect(
        transactionRepository.getDashboardSummary(testUserId.toString())
      ).rejects.toThrow('Aggregation failed');
    });
  });

  describe('searchTransactions', () => {
    it('should search transactions successfully', async () => {
      await Transaction.create(
        createValidTransactionData({
          title: 'Grocery Shopping',
          description: 'Weekly groceries',
          tags: ['food', 'essential'],
        })
      );

      const result = await transactionRepository.searchTransactions(
        testUserId.toString(),
        'grocery'
      );

      expect(result).toBeDefined();
      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle account filtering in search', async () => {
      await Transaction.create(
        createValidTransactionData({
          title: 'Restaurant',
          description: 'Dinner out',
        })
      );

      const result = await transactionRepository.searchTransactions(
        testUserId.toString(),
        'restaurant',
        { accountId: testAccountId.toString() }
      );

      expect(result).toBeDefined();
    });

    it('should handle category filtering in search', async () => {
      await Transaction.create(
        createValidTransactionData({
          title: 'Gas Station',
          description: 'Fuel',
        })
      );

      const result = await transactionRepository.searchTransactions(
        testUserId.toString(),
        'gas',
        { categoryId: testCategoryId.toString() }
      );

      expect(result).toBeDefined();
    });

    it('should handle type filtering in search', async () => {
      await Transaction.create(
        createValidTransactionData({
          title: 'Salary',
          type: TransactionType.INCOME,
        })
      );

      const result = await transactionRepository.searchTransactions(
        testUserId.toString(),
        'salary',
        { type: TransactionType.INCOME }
      );

      expect(result).toBeDefined();
    });

    it('should handle date range filtering in search', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          title: 'January Transaction',
          date: new Date('2023-01-15'),
        })
      );

      const result = await transactionRepository.searchTransactions(
        testUserId.toString(),
        'january',
        { startDate, endDate }
      );

      expect(result).toBeDefined();
    });

    it('should handle pagination in search', async () => {
      // Create multiple transactions
      for (let i = 0; i < 15; i++) {
        await Transaction.create(
          createValidTransactionData({
            title: `Transaction ${i + 1}`,
            description: `Description ${i + 1}`,
          })
        );
      }

      const result = await transactionRepository.searchTransactions(
        testUserId.toString(),
        'transaction',
        { page: 2, limit: 10 }
      );

      expect(result).toBeDefined();
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('should handle search with tags', async () => {
      await Transaction.create(
        createValidTransactionData({
          title: 'Tagged Transaction',
          tags: ['important', 'business'],
        })
      );

      const result = await transactionRepository.searchTransactions(
        testUserId.toString(),
        'important'
      );

      expect(result).toBeDefined();
      expect(result.transactions).toHaveLength(1);
    });

    it('should handle search with populate options', async () => {
      await Transaction.create(
        createValidTransactionData({
          title: 'Populated Transaction',
        })
      );

      const result = await transactionRepository.searchTransactions(
        testUserId.toString(),
        'populated',
        { populate: ['categoryId', 'subcategoryId'] }
      );

      expect(result).toBeDefined();
    });

    it('should handle database errors in search', async () => {
      const mockError = new Error('Search failed');
      jest.spyOn(transactionRepository['model'], 'find').mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockImplementation(() => {
                throw mockError;
              }),
            }),
          }),
        }),
      } as any);

      await expect(
        transactionRepository.searchTransactions(testUserId.toString(), 'test')
      ).rejects.toThrow('Search failed');
    });

    it('should handle count errors in search', async () => {
      const mockError = new Error('Count failed');
      jest
        .spyOn(transactionRepository['model'], 'countDocuments')
        .mockRejectedValueOnce(mockError);

      await expect(
        transactionRepository.searchTransactions(testUserId.toString(), 'test')
      ).rejects.toThrow('Count failed');
    });
  });

  describe('getTransactionsByTags edge cases', () => {
    it('should handle different groupBy options', async () => {
      await Transaction.create(
        createValidTransactionData({
          tags: ['food', 'groceries'],
          date: new Date('2023-01-15'),
        })
      );

      // Test groupBy: 'category'
      const result1 = await transactionRepository.getTransactionsByTags(
        testUserId.toString(),
        ['food'],
        { groupBy: 'category' }
      );

      expect(result1).toBeDefined();

      // Test groupBy: 'month'
      const result2 = await transactionRepository.getTransactionsByTags(
        testUserId.toString(),
        ['food'],
        { groupBy: 'month' }
      );

      expect(result2).toBeDefined();

      // Test groupBy: 'tag' (default)
      const result3 = await transactionRepository.getTransactionsByTags(
        testUserId.toString(),
        ['food']
      );

      expect(result3).toBeDefined();
    });

    it('should handle empty tags array', async () => {
      const result = await transactionRepository.getTransactionsByTags(
        testUserId.toString(),
        []
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle date range filtering with tags', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');

      await Transaction.create(
        createValidTransactionData({
          tags: ['monthly'],
          date: new Date('2023-01-15'),
        })
      );

      const result = await transactionRepository.getTransactionsByTags(
        testUserId.toString(),
        ['monthly'],
        { startDate, endDate }
      );

      expect(result).toBeDefined();
    });
  });

  describe('getCashFlowAnalysis edge cases', () => {
    it('should handle different interval options', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');

      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.INCOME,
          amount: 1000,
          date: new Date('2023-06-15'),
        })
      );

      // Test daily interval
      const result1 = await transactionRepository.getCashFlowAnalysis(
        testUserId.toString(),
        { startDate, endDate, interval: 'daily' }
      );

      expect(result1).toBeDefined();

      // Test weekly interval
      const result2 = await transactionRepository.getCashFlowAnalysis(
        testUserId.toString(),
        { startDate, endDate, interval: 'weekly' }
      );

      expect(result2).toBeDefined();

      // Test monthly interval (default)
      const result3 = await transactionRepository.getCashFlowAnalysis(
        testUserId.toString(),
        { startDate, endDate }
      );

      expect(result3).toBeDefined();
    });

    it('should handle account filtering in cash flow analysis', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');

      await Transaction.create(
        createValidTransactionData({
          type: TransactionType.EXPENSE,
          amount: 500,
          date: new Date('2023-06-15'),
        })
      );

      const result = await transactionRepository.getCashFlowAnalysis(
        testUserId.toString(),
        { startDate, endDate, accountId: testAccountId.toString() }
      );

      expect(result).toBeDefined();
    });
  });
});
