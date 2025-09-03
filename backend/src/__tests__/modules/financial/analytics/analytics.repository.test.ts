import mongoose from 'mongoose';
import { AnalyticsRepository } from '../../../../modules/financial/analytics/repositories/analytics.repository';
import { IAnalyticsQuery } from '../../../../modules/financial/analytics/interfaces/analytics.interface';
import { TransactionType, TransactionStatus } from '../../../../modules/financial/transactions/interfaces/transaction.interface';

// Mock the logger service
jest.mock('../../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the models
jest.mock('../../../../modules/financial/transactions/models/transaction.model', () => ({
  Transaction: {
    aggregate: jest.fn(),
  },
}));

jest.mock('../../../../modules/financial/budgets/models/budget.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

describe('Analytics Repository - Comprehensive Tests', () => {
  let analyticsRepository: AnalyticsRepository;
  let testUserId: mongoose.Types.ObjectId;
  let testCategoryId: mongoose.Types.ObjectId;
  let testBudgetId: mongoose.Types.ObjectId;
  let mockTransactionAggregate: jest.MockedFunction<any>;
  let mockBudgetFindOne: jest.MockedFunction<any>;
  let mockBudgetFindById: jest.MockedFunction<any>;

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId();
    testCategoryId = new mongoose.Types.ObjectId();
    testBudgetId = new mongoose.Types.ObjectId();
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Get the mocked functions
    const TransactionModel = require('../../../../modules/financial/transactions/models/transaction.model');
    const BudgetModel = require('../../../../modules/financial/budgets/models/budget.model');
    mockTransactionAggregate = TransactionModel.Transaction.aggregate;
    mockBudgetFindOne = BudgetModel.default.findOne;
    mockBudgetFindById = BudgetModel.default.findById;

    // Create the actual repository instance
    analyticsRepository = new AnalyticsRepository();
  });

  describe('getSpendingAnalysis', () => {
    it('should get spending analysis with empty results', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Mock empty aggregation result
      mockTransactionAggregate.mockResolvedValue([{
        overall: [],
        byCategory: [],
        byDay: [],
        byMonth: [],
        topDays: []
      }]);

      const query: IAnalyticsQuery = {
        userId: testUserId.toString(),
        startDate,
        endDate,
        groupBy: 'month',
      };

      const result = await analyticsRepository.getSpendingAnalysis(query);

      expect(result).toBeDefined();
      expect(result.totalSpent).toBe(0);
      expect(result.totalIncome).toBe(0);
      expect(result.netAmount).toBe(0);
      expect(result.spendingByCategory).toBeDefined();
      expect(Array.isArray(result.spendingByCategory)).toBe(true);
    });

    it('should handle different groupBy options', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Mock aggregation result
      mockTransactionAggregate.mockResolvedValue([{
        overall: [],
        byCategory: [],
        byDay: [],
        byMonth: [],
        topDays: []
      }]);

      const groupByOptions = ['day', 'week', 'month', 'quarter', 'year'] as const;

      for (const groupBy of groupByOptions) {
        const query: IAnalyticsQuery = {
          userId: testUserId.toString(),
          startDate,
          endDate,
          groupBy,
        };

        const result = await analyticsRepository.getSpendingAnalysis(query);

        expect(result).toBeDefined();
        expect(result.totalSpent).toBe(0);
        expect(result.totalIncome).toBe(0);
        expect(result.netAmount).toBe(0);
      }
    });

    it('should handle filters correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Mock aggregation result
      mockTransactionAggregate.mockResolvedValue([{
        overall: [],
        byCategory: [],
        byDay: [],
        byMonth: [],
        topDays: []
      }]);

      const query: IAnalyticsQuery = {
        userId: testUserId.toString(),
        startDate,
        endDate,
        groupBy: 'month',
        categories: [testCategoryId.toString()],
        transactionTypes: ['expense'],
        minAmount: 10,
        maxAmount: 1000,
        includeRecurring: false,
        includePending: false,
      };

      const result = await analyticsRepository.getSpendingAnalysis(query);

      expect(result).toBeDefined();
      expect(result.totalSpent).toBe(0);
      expect(result.totalIncome).toBe(0);
      expect(result.netAmount).toBe(0);
    });

    it('should handle spending analysis with data', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Mock aggregation result with data
      mockTransactionAggregate.mockResolvedValue([{
        overall: [{
          totalSpent: 1000,
          totalIncome: 2000,
          transactionCount: 10,
          averageAmount: 100
        }],
        byCategory: [
          {
            _id: testCategoryId,
            categoryName: 'Food',
            categoryPath: 'Food',
            amount: 500,
            transactionCount: 5,
            averageAmount: 100
          }
        ],
        byDay: [
          {
            _id: '2024-01-01',
            amount: 100,
            transactionCount: 1
          }
        ],
        byMonth: [
          {
            _id: '2024-01',
            amount: 1000,
            transactionCount: 10,
            averageAmount: 100
          }
        ],
        topDays: [
          {
            _id: '2024-01-01',
            amount: 100,
            transactionCount: 1
          }
        ]
      }]);

      const query: IAnalyticsQuery = {
        userId: testUserId.toString(),
        startDate,
        endDate,
        groupBy: 'month',
      };

      const result = await analyticsRepository.getSpendingAnalysis(query);

      expect(result).toBeDefined();
      expect(result.totalSpent).toBe(1000);
      expect(result.totalIncome).toBe(2000);
      expect(result.netAmount).toBe(1000);
      expect(result.spendingByCategory).toHaveLength(1);
      expect(result.spendingByCategory[0].percentage).toBe(50); // 500/1000 * 100
    });

    it('should handle different filter combinations', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Mock aggregation result
      mockTransactionAggregate.mockResolvedValue([{
        overall: [],
        byCategory: [],
        byDay: [],
        byMonth: [],
        topDays: []
      }]);

      // Test with only categories filter
      let query: IAnalyticsQuery = {
        userId: testUserId.toString(),
        startDate,
        endDate,
        groupBy: 'month',
        categories: [testCategoryId.toString()],
      };

      await analyticsRepository.getSpendingAnalysis(query);

      // Test with only transaction types filter
      query = {
        userId: testUserId.toString(),
        startDate,
        endDate,
        groupBy: 'month',
        transactionTypes: [TransactionType.EXPENSE],
      };

      await analyticsRepository.getSpendingAnalysis(query);

      // Test with only minAmount filter
      query = {
        userId: testUserId.toString(),
        startDate,
        endDate,
        groupBy: 'month',
        minAmount: 50,
      };

      await analyticsRepository.getSpendingAnalysis(query);

      // Test with only maxAmount filter
      query = {
        userId: testUserId.toString(),
        startDate,
        endDate,
        groupBy: 'month',
        maxAmount: 500,
      };

      await analyticsRepository.getSpendingAnalysis(query);

      // Test with includePending = false
      query = {
        userId: testUserId.toString(),
        startDate,
        endDate,
        groupBy: 'month',
        includePending: false,
      };

      await analyticsRepository.getSpendingAnalysis(query);

      expect(mockTransactionAggregate).toHaveBeenCalledTimes(5);
    });

    it('should handle error in getSpendingAnalysis', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Mock aggregation to throw error
      mockTransactionAggregate.mockRejectedValue(new Error('Database error'));

      const query: IAnalyticsQuery = {
        userId: testUserId.toString(),
        startDate,
        endDate,
        groupBy: 'month',
      };

      await expect(analyticsRepository.getSpendingAnalysis(query)).rejects.toThrow('Database error');
    });
  });

  describe('getBudgetAnalytics', () => {
    it('should handle budget not found gracefully', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Mock budget not found
      mockBudgetFindOne.mockResolvedValue(null);

      await expect(
        analyticsRepository.getBudgetAnalytics(
          testUserId.toString(),
          testBudgetId.toString(),
          startDate,
          endDate
        )
      ).rejects.toThrow('Budget not found');
    });

    it('should get budget analytics successfully', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Mock budget data
      const mockBudgetData = {
        _id: testBudgetId,
        name: 'Test Budget',
        totalAmount: 2000,
        categoryAllocations: [
          {
            categoryId: testCategoryId,
            allocatedAmount: 1000
          }
        ]
      };

      // Mock spending data
      const mockSpendingData = [
        {
          _id: testCategoryId,
          categoryName: 'Food',
          spentAmount: 800,
          transactions: [
            {
              id: new mongoose.Types.ObjectId(),
              amount: 800,
              date: new Date('2024-01-15'),
              description: 'Groceries'
            }
          ]
        }
      ];

      mockBudgetFindOne.mockResolvedValue(mockBudgetData);
      mockTransactionAggregate.mockResolvedValue(mockSpendingData);
      mockBudgetFindById.mockResolvedValue(mockBudgetData);

      const result = await analyticsRepository.getBudgetAnalytics(
        testUserId.toString(),
        testBudgetId.toString(),
        startDate,
        endDate
      );

      expect(result).toBeDefined();
      expect(result.budgetId).toBe(testBudgetId.toString());
      expect(result.budgetName).toBe('Test Budget');
      expect(result.totalAllocated).toBe(2000);
      expect(result.totalSpent).toBe(800);
      expect(result.remainingAmount).toBe(1200);
      expect(result.utilizationPercentage).toBe(40);
      expect(result.status).toBe('under');
      expect(result.categoryBreakdown).toHaveLength(1);
      expect(result.categoryBreakdown[0].utilizationPercentage).toBe(80);
      expect(result.categoryBreakdown[0].status).toBe('on-track');
    });

    it('should handle different budget status scenarios', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Test on-track status (80-95%)
      const mockBudgetData = {
        _id: testBudgetId,
        name: 'Test Budget',
        totalAmount: 1000,
        categoryAllocations: [
          {
            categoryId: testCategoryId,
            allocatedAmount: 1000
          }
        ]
      };

      const mockSpendingData = [
        {
          _id: testCategoryId,
          categoryName: 'Food',
          spentAmount: 900,
          transactions: []
        }
      ];

      mockBudgetFindOne.mockResolvedValue(mockBudgetData);
      mockTransactionAggregate.mockResolvedValue(mockSpendingData);
      mockBudgetFindById.mockResolvedValue(mockBudgetData);

      let result = await analyticsRepository.getBudgetAnalytics(
        testUserId.toString(),
        testBudgetId.toString(),
        startDate,
        endDate
      );

      expect(result.status).toBe('on-track');
      expect(result.utilizationPercentage).toBe(90);

      // Test over status (95-110%)
      mockSpendingData[0].spentAmount = 1000;
      mockTransactionAggregate.mockResolvedValue(mockSpendingData);

      result = await analyticsRepository.getBudgetAnalytics(
        testUserId.toString(),
        testBudgetId.toString(),
        startDate,
        endDate
      );

      expect(result.status).toBe('over');
      expect(result.utilizationPercentage).toBe(100);

      // Test critical status (>110%)
      mockSpendingData[0].spentAmount = 1200;
      mockTransactionAggregate.mockResolvedValue(mockSpendingData);

      result = await analyticsRepository.getBudgetAnalytics(
        testUserId.toString(),
        testBudgetId.toString(),
        startDate,
        endDate
      );

      expect(result.status).toBe('critical');
      expect(result.utilizationPercentage).toBe(120);
    });

    it('should handle category breakdown with different statuses', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockBudgetData = {
        _id: testBudgetId,
        name: 'Test Budget',
        totalAmount: 2000,
        categoryAllocations: [
          {
            categoryId: testCategoryId,
            allocatedAmount: 1000
          },
          {
            categoryId: new mongoose.Types.ObjectId(),
            allocatedAmount: 1000
          }
        ]
      };

      const mockSpendingData = [
        {
          _id: testCategoryId,
          categoryName: 'Food',
          spentAmount: 1200, // 120% - critical
          transactions: []
        }
        // Second category has no spending data
      ];

      mockBudgetFindOne.mockResolvedValue(mockBudgetData);
      mockTransactionAggregate.mockResolvedValue(mockSpendingData);
      mockBudgetFindById.mockResolvedValue(mockBudgetData);

      const result = await analyticsRepository.getBudgetAnalytics(
        testUserId.toString(),
        testBudgetId.toString(),
        startDate,
        endDate
      );

      expect(result.categoryBreakdown).toHaveLength(2);
      expect(result.categoryBreakdown[0].status).toBe('critical');
      expect(result.categoryBreakdown[0].utilizationPercentage).toBe(120);
      expect(result.categoryBreakdown[1].status).toBe('under');
      expect(result.categoryBreakdown[1].utilizationPercentage).toBe(0);
    });

    it('should handle error in getBudgetAnalytics', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      // Mock budget.findOne to throw error
      mockBudgetFindOne.mockRejectedValue(new Error('Database error'));

      await expect(
        analyticsRepository.getBudgetAnalytics(
          testUserId.toString(),
          testBudgetId.toString(),
          startDate,
          endDate
        )
      ).rejects.toThrow('Database error');
    });
  });

  describe('Private Helper Methods', () => {
    it('should calculate spending trends correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');

      // Mock aggregation result with monthly data for trend calculation
      mockTransactionAggregate.mockResolvedValue([{
        overall: [{
          totalSpent: 3000,
          totalIncome: 6000,
          transactionCount: 30,
          averageAmount: 100
        }],
        byCategory: [],
        byDay: [],
        byMonth: [
          {
            _id: '2024-01',
            amount: 1000,
            transactionCount: 10,
            averageAmount: 100
          },
          {
            _id: '2024-02',
            amount: 1200,
            transactionCount: 12,
            averageAmount: 100
          },
          {
            _id: '2024-03',
            amount: 800,
            transactionCount: 8,
            averageAmount: 100
          }
        ],
        topDays: []
      }]);

      const query: IAnalyticsQuery = {
        userId: testUserId.toString(),
        startDate,
        endDate,
        groupBy: 'month',
      };

      const result = await analyticsRepository.getSpendingAnalysis(query);

      expect(result.spendingTrends).toHaveLength(2);
      expect(result.spendingTrends[0].change).toBe(200); // 1200 - 1000
      expect(result.spendingTrends[0].percentageChange).toBe(20); // (200/1000) * 100
      expect(result.spendingTrends[1].change).toBe(-400); // 800 - 1200
      expect(result.spendingTrends[1].percentageChange).toBeCloseTo(-33.33, 2); // (-400/1200) * 100
    });

    it('should generate budget alerts correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Mock budget data with high utilization
      const mockBudgetData = {
        _id: testBudgetId,
        name: 'Test Budget',
        totalAmount: 1000,
        categoryAllocations: [
          {
            categoryId: testCategoryId,
            allocatedAmount: 1000
          }
        ]
      };

      // Mock spending data with high utilization
      const mockSpendingData = [
        {
          _id: testCategoryId,
          categoryName: 'Food',
          spentAmount: 950, // 95% utilization
          transactions: []
        }
      ];

      mockBudgetFindOne.mockResolvedValue(mockBudgetData);
      mockTransactionAggregate.mockResolvedValue(mockSpendingData);
      mockBudgetFindById.mockResolvedValue(mockBudgetData);

      const result = await analyticsRepository.getBudgetAnalytics(
        testUserId.toString(),
        testBudgetId.toString(),
        startDate,
        endDate
      );

      expect(result.alerts).toHaveLength(2); // Overall + category alert
      expect(result.alerts[0].type).toBe('warning');
      expect(result.alerts[0].currentValue).toBe(95);
      expect(result.alerts[1].type).toBe('warning');
      expect(result.alerts[1].currentValue).toBe(95);
    });

    it('should generate critical budget alerts', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Mock budget data with critical utilization
      const mockBudgetData = {
        _id: testBudgetId,
        name: 'Test Budget',
        totalAmount: 1000,
        categoryAllocations: [
          {
            categoryId: testCategoryId,
            allocatedAmount: 1000
          }
        ]
      };

      // Mock spending data with critical utilization
      const mockSpendingData = [
        {
          _id: testCategoryId,
          categoryName: 'Food',
          spentAmount: 1100, // 110% utilization - critical
          transactions: []
        }
      ];

      mockBudgetFindOne.mockResolvedValue(mockBudgetData);
      mockTransactionAggregate.mockResolvedValue(mockSpendingData);
      mockBudgetFindById.mockResolvedValue(mockBudgetData);

      const result = await analyticsRepository.getBudgetAnalytics(
        testUserId.toString(),
        testBudgetId.toString(),
        startDate,
        endDate
      );

      expect(result.alerts).toHaveLength(2); // Overall + category alert
      expect(result.alerts[0].type).toBe('critical');
      expect(result.alerts[0].currentValue).toBeCloseTo(110, 5);
      expect(result.alerts[1].type).toBe('critical');
      expect(result.alerts[1].currentValue).toBeCloseTo(110, 5);
    });

    it('should calculate daily budget progress', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03'); // 3 days

      // Mock budget data
      const mockBudgetData = {
        _id: testBudgetId,
        name: 'Test Budget',
        totalAmount: 300, // 100 per day
        categoryAllocations: [
          {
            categoryId: testCategoryId,
            allocatedAmount: 300
          }
        ]
      };

      // Mock daily spending data
      const mockDailySpending = [
        {
          _id: '2024-01-01',
          spentAmount: 50
        },
        {
          _id: '2024-01-02',
          spentAmount: 75
        }
      ];

      mockBudgetFindOne.mockResolvedValue(mockBudgetData);
      mockTransactionAggregate.mockResolvedValue([]);
      mockBudgetFindById.mockResolvedValue(mockBudgetData);

      // Mock the daily spending aggregation
      mockTransactionAggregate
        .mockResolvedValueOnce([]) // First call for spending data
        .mockResolvedValueOnce(mockDailySpending); // Second call for daily progress

      const result = await analyticsRepository.getBudgetAnalytics(
        testUserId.toString(),
        testBudgetId.toString(),
        startDate,
        endDate
      );

      expect(result.dailyProgress).toHaveLength(2);
      expect(result.dailyProgress[0].allocatedAmount).toBe(150); // Day 1: 150
      expect(result.dailyProgress[0].spentAmount).toBe(50);
      expect(result.dailyProgress[0].remainingAmount).toBe(100);
      expect(result.dailyProgress[1].allocatedAmount).toBe(300); // Day 2: 300
      expect(result.dailyProgress[1].spentAmount).toBe(125); // 50 + 75
      expect(result.dailyProgress[1].remainingAmount).toBe(175);
    });

    it('should handle daily budget progress calculation error', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Mock budget data
      const mockBudgetData = {
        _id: testBudgetId,
        name: 'Test Budget',
        totalAmount: 1000,
        categoryAllocations: [
          {
            categoryId: testCategoryId,
            allocatedAmount: 1000
          }
        ]
      };

      mockBudgetFindOne.mockResolvedValue(mockBudgetData);
      mockTransactionAggregate.mockResolvedValue([]);
      mockBudgetFindById.mockRejectedValue(new Error('Database error'));

      const result = await analyticsRepository.getBudgetAnalytics(
        testUserId.toString(),
        testBudgetId.toString(),
        startDate,
        endDate
      );

      expect(result.dailyProgress).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid user ID', async () => {
      const query: IAnalyticsQuery = {
        userId: 'invalid-id',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        groupBy: 'month',
      };

      // Mock aggregation to throw error for invalid ObjectId
      mockTransactionAggregate.mockRejectedValue(new Error('Cast to ObjectId failed'));

      await expect(analyticsRepository.getSpendingAnalysis(query)).rejects.toThrow('input must be a 24 character hex string');
    });

    it('should handle invalid date range', async () => {
      const query: IAnalyticsQuery = {
        userId: testUserId.toString(),
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'), // End date before start date
        groupBy: 'month',
      };

      // Mock aggregation result
      mockTransactionAggregate.mockResolvedValue([{
        overall: [],
        byCategory: [],
        byDay: [],
        byMonth: [],
        topDays: []
      }]);

      // The method should still work but return empty results
      const result = await analyticsRepository.getSpendingAnalysis(query);
      expect(result).toBeDefined();
      expect(result.totalSpent).toBe(0);
    });

    it('should handle zero total spent in percentage calculation', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Mock aggregation result with zero spending
      mockTransactionAggregate.mockResolvedValue([{
        overall: [{
          totalSpent: 0,
          totalIncome: 0,
          transactionCount: 0,
          averageAmount: 0
        }],
        byCategory: [
          {
            _id: testCategoryId,
            categoryName: 'Food',
            categoryPath: 'Food',
            amount: 0,
            transactionCount: 0,
            averageAmount: 0
          }
        ],
        byDay: [],
        byMonth: [],
        topDays: []
      }]);

      const query: IAnalyticsQuery = {
        userId: testUserId.toString(),
        startDate,
        endDate,
        groupBy: 'month',
      };

      const result = await analyticsRepository.getSpendingAnalysis(query);

      expect(result.totalSpent).toBe(0);
      expect(result.spendingByCategory[0].percentage).toBe(0);
    });
  });
});
