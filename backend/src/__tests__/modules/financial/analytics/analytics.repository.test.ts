import mongoose from 'mongoose';
import { AnalyticsRepository } from '../../../../modules/financial/analytics/repositories/analytics.repository';
import { IAnalyticsQuery } from '../../../../modules/financial/analytics/interfaces/analytics.interface';

// Mock the logger service
jest.mock('../../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Analytics Repository - Simple Tests', () => {
  let analyticsRepository: AnalyticsRepository;
  let testUserId: mongoose.Types.ObjectId;
  let testCategoryId: mongoose.Types.ObjectId;
  let testBudgetId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId();
    testCategoryId = new mongoose.Types.ObjectId();
    testBudgetId = new mongoose.Types.ObjectId();
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create the actual repository instance
    analyticsRepository = new AnalyticsRepository();
  });

  describe('getSpendingAnalysis', () => {
    it('should get spending analysis with empty results', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

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
  });

  describe('getBudgetAnalytics', () => {
    it('should handle budget not found gracefully', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await expect(
        analyticsRepository.getBudgetAnalytics(
          testUserId.toString(),
          testBudgetId.toString(),
          startDate,
          endDate
        )
      ).rejects.toThrow('Budget not found');
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

      await expect(analyticsRepository.getSpendingAnalysis(query)).rejects.toThrow();
    });

    it('should handle invalid date range', async () => {
      const query: IAnalyticsQuery = {
        userId: testUserId.toString(),
        startDate: new Date('2024-12-31'),
        endDate: new Date('2024-01-01'), // End date before start date
        groupBy: 'month',
      };

      // The method should still work but return empty results
      const result = await analyticsRepository.getSpendingAnalysis(query);
      expect(result).toBeDefined();
      expect(result.totalSpent).toBe(0);
    });
  });
});
