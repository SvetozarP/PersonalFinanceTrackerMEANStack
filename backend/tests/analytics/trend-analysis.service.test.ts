import { TrendAnalysisService } from '../../src/modules/financial/analytics/services/trend-analysis.service';
import { TransactionRepository } from '../../src/modules/financial/transactions/repositories/transaction.repository';
import { CategoryRepository } from '../../src/modules/financial/categories/repositories/category.repository';
import { TransactionType } from '../../src/modules/financial/transactions/interfaces/transaction.interface';
import { createMockTransactions, createMockCategories } from './test-utils';

// Mock the repositories
jest.mock('../../src/modules/financial/transactions/repositories/transaction.repository');
jest.mock('../../src/modules/financial/categories/repositories/category.repository');
jest.mock('../../src/shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('TrendAnalysisService', () => {
  let service: TrendAnalysisService;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTransactionRepository = {
      find: jest.fn(),
    } as any;

    mockCategoryRepository = {
      find: jest.fn(),
    } as any;

    // Mock the constructor dependencies
    (TransactionRepository as jest.Mock).mockImplementation(() => mockTransactionRepository);
    (CategoryRepository as jest.Mock).mockImplementation(() => mockCategoryRepository);

    service = new TrendAnalysisService();
  });

  describe('analyzeTrends', () => {
    const mockQuery = {
      userId: 'user123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      categories: undefined,
      transactionTypes: undefined,
      accounts: undefined,
      includeRecurring: true,
      confidenceThreshold: 0.7,
      modelType: 'trend_analysis' as const,
      algorithm: undefined,
    };

    it('should analyze trends with sufficient data', async () => {
      const mockTransactions = createMockTransactions(180, Array.from({ length: 180 }, (_, i) => ({
        amount: 100 + (i * 0.5), // Increasing trend
        date: new Date(Date.now() - (180 - i) * 24 * 60 * 60 * 1000),
        type: TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockCategoryRepository.find.mockResolvedValue(createMockCategories(1, [{ name: 'Food' }]));

      const result = await service.analyzeTrends(mockQuery);

      expect(result).toBeDefined();
      expect(result.analysisPeriod).toEqual({
        startDate: mockQuery.startDate,
        endDate: mockQuery.endDate,
      });
      expect(result.overallTrend).toBeDefined();
      expect(['increasing', 'decreasing', 'stable', 'volatile']).toContain(result.overallTrend.direction);
      expect(['weak', 'moderate', 'strong']).toContain(result.overallTrend.strength);
      expect(result.overallTrend.confidence).toBeGreaterThan(0);
      expect(result.overallTrend.description).toBeDefined();
      
      expect(result.categoryTrends).toBeDefined();
      expect(Array.isArray(result.categoryTrends)).toBe(true);
      
      expect(result.spendingPatterns).toBeDefined();
      expect(result.spendingPatterns.weeklyPattern).toBeDefined();
      expect(result.spendingPatterns.monthlyPattern).toBeDefined();
      expect(result.spendingPatterns.seasonalPattern).toBeDefined();
      
      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      
      expect(result.methodology).toBeDefined();
      expect(result.methodology.algorithm).toBeDefined();
      expect(result.methodology.accuracy).toBeGreaterThan(0);
    });

    it('should throw error when insufficient historical data', async () => {
      const mockTransactions = createMockTransactions(5, Array.from({ length: 5 }, (_, i) => ({
        amount: 100,
        date: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000),
        type: TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      await expect(service.analyzeTrends(mockQuery)).rejects.toThrow(
        'Insufficient historical data for trend analysis. Need at least 14 days of data.'
      );
    });

    it('should detect increasing trend correctly', async () => {
      const mockTransactions = createMockTransactions(180, Array.from({ length: 180 }, (_, i) => ({
        amount: 100 + (i * 2), // Strong increasing trend
        date: new Date(Date.now() - (180 - i) * 24 * 60 * 60 * 1000),
        type: TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockCategoryRepository.find.mockResolvedValue(createMockCategories(1, [{ name: 'Food' }]));

      const result = await service.analyzeTrends(mockQuery);

      expect(result.overallTrend.direction).toBe('increasing');
      expect(result.overallTrend.strength).toBe('strong');
    });

    it('should detect decreasing trend correctly', async () => {
      const mockTransactions = createMockTransactions(180, Array.from({ length: 180 }, (_, i) => ({
        amount: 500 - (i * 2), // Strong decreasing trend
        date: new Date(Date.now() - (180 - i) * 24 * 60 * 60 * 1000),
        type: TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockCategoryRepository.find.mockResolvedValue(createMockCategories(1, [{ name: 'Food' }]));

      const result = await service.analyzeTrends(mockQuery);

      expect(result.overallTrend.direction).toBe('decreasing');
      expect(result.overallTrend.strength).toBe('strong');
    });

    it('should detect stable trend correctly', async () => {
      const mockTransactions = createMockTransactions(180, Array.from({ length: 180 }, (_, i) => ({
        amount: 100, // Completely stable - no variations
        date: new Date(Date.now() - (180 - i) * 24 * 60 * 60 * 1000),
        type: TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockCategoryRepository.find.mockResolvedValue(createMockCategories(1, [{ name: 'Food' }]));

      const result = await service.analyzeTrends(mockQuery);

      expect(result.overallTrend.direction).toBe('stable');
    });

    it('should analyze category trends correctly', async () => {
      const mockCategory = createMockCategories(1, [{ name: 'Food' }])[0];
      const mockTransactions = createMockTransactions(180, Array.from({ length: 180 }, (_, i) => ({
        amount: 100 + (i * 0.5),
        date: new Date(Date.now() - (180 - i) * 24 * 60 * 60 * 1000),
        type: TransactionType.EXPENSE,
        categoryId: mockCategory._id as any,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockCategoryRepository.find.mockResolvedValue([mockCategory]);

      const result = await service.analyzeTrends(mockQuery);

      expect(result.categoryTrends).toBeDefined();
      expect(result.categoryTrends.length).toBeGreaterThan(0);
      
      const categoryTrend = result.categoryTrends[0];
      expect(categoryTrend.categoryId).toBeDefined();
      expect(categoryTrend.categoryName).toBe('Food');
      expect(categoryTrend.trend).toBeDefined();
      expect(categoryTrend.data).toBeDefined();
      expect(categoryTrend.seasonalPattern).toBeDefined();
      expect(categoryTrend.forecast).toBeDefined();
    });

    it('should analyze spending patterns correctly', async () => {
      const mockTransactions = createMockTransactions(180, Array.from({ length: 180 }, (_, i) => {
        const dayOfWeek = i % 7;
        const baseAmount = 100;
        const dayFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 1.5 : 1.0; // Higher on weekends
        return {
          amount: baseAmount * dayFactor,
          date: new Date(Date.now() - (180 - i) * 24 * 60 * 60 * 1000),
          type: TransactionType.EXPENSE,
        };
      }));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockCategoryRepository.find.mockResolvedValue(createMockCategories(1, [{ name: 'Food' }]));

      const result = await service.analyzeTrends(mockQuery);

      expect(result.spendingPatterns.weeklyPattern).toBeDefined();
      expect(result.spendingPatterns.weeklyPattern.length).toBe(7);
      
      expect(result.spendingPatterns.monthlyPattern).toBeDefined();
      expect(Array.isArray(result.spendingPatterns.monthlyPattern)).toBe(true);
      
      expect(result.spendingPatterns.seasonalPattern).toBeDefined();
    });

    it('should generate insights correctly', async () => {
      const mockTransactions = createMockTransactions(180, Array.from({ length: 180 }, (_, i) => ({
        amount: 100 + (i * 2), // Strong increasing trend
        date: new Date(Date.now() - (180 - i) * 24 * 60 * 60 * 1000),
        type: TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockCategoryRepository.find.mockResolvedValue(createMockCategories(1, [{ name: 'Food' }]));

      const result = await service.analyzeTrends(mockQuery);

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      
      if (result.insights.length > 0) {
        const insight = result.insights[0];
        expect(insight.type).toBeDefined();
        expect(insight.priority).toBeDefined();
        expect(insight.message).toBeDefined();
        expect(['trend', 'pattern', 'anomaly', 'opportunity']).toContain(insight.type);
        expect(['high', 'medium', 'low']).toContain(insight.priority);
      }
    });
  });

  describe('private methods', () => {
    it('should group transactions by date correctly', () => {
      const transactions = [
        { _id: '1', amount: 100, date: new Date('2024-01-01'), type: TransactionType.EXPENSE },
        { _id: '2', amount: 200, date: new Date('2024-01-01'), type: TransactionType.EXPENSE },
        { _id: '3', amount: 150, date: new Date('2024-01-02'), type: TransactionType.EXPENSE },
      ];

      const result = (service as any).groupTransactionsByDate(transactions);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        amount: 300,
        count: 2,
        transactions: expect.any(Array),
      });
      expect(result[1]).toEqual({
        date: '2024-01-02',
        amount: 150,
        count: 1,
        transactions: expect.any(Array),
      });
    });

    it('should calculate linear trend correctly', () => {
      const amounts = [100, 102, 104, 106, 108];
      const dates = amounts.map((_, i) => new Date(Date.now() - (4 - i) * 24 * 60 * 60 * 1000));

      const trend = (service as any).calculateLinearTrend(amounts, dates);

      expect(trend).toBeDefined();
      expect(trend.slope).toBeCloseTo(2, 1); // Should be close to 2
      expect(trend.intercept).toBeDefined();
    });

    it('should calculate trend strength correctly', () => {
      const amounts = [100, 102, 104, 106, 108];
      const trend = { slope: 2, intercept: 98 };

      const strength = (service as any).calculateTrendStrength(amounts, trend);

      expect(strength).toBeGreaterThan(0);
      expect(strength).toBeLessThanOrEqual(1);
    });

    it('should calculate trend confidence correctly', () => {
      const amounts = [100, 102, 104, 106, 108];
      const trend = { slope: 2, intercept: 98 };

      const confidence = (service as any).calculateTrendConfidence(amounts, trend);

      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });

    it('should generate trend description correctly', () => {
      const direction = 'increasing';
      const strength = 'strong';
      const slope = 2.5;

      const description = (service as any).generateTrendDescription(direction, strength, slope);

      expect(description).toBeDefined();
      expect(typeof description).toBe('string');
      expect(description).toContain('increasing');
      expect(description).toContain('strong');
    });

    it('should group by category correctly', () => {
      const historicalData = [
        { date: '2024-01-01', transactions: [{ categoryId: 'cat1', amount: 100, categoryName: 'Food' }] },
        { date: '2024-01-02', transactions: [{ categoryId: 'cat1', amount: 200, categoryName: 'Food' }] },
        { date: '2024-01-03', transactions: [{ categoryId: 'cat2', amount: 150, categoryName: 'Transport' }] },
      ];

      const result = (service as any).groupByCategory(historicalData);

      expect(result).toBeDefined();
      expect(result.cat1).toBeDefined();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should generate trend data points correctly', () => {
      const amounts = [100, 102, 104, 106, 108];
      const dates = amounts.map((_, i) => new Date(Date.now() - (4 - i) * 24 * 60 * 60 * 1000));
      const trend = { slope: 2, intercept: 98 };

      const dataPoints = (service as any).generateTrendDataPoints(amounts, dates, trend);

      expect(dataPoints).toBeDefined();
      expect(Array.isArray(dataPoints)).toBe(true);
      expect(dataPoints.length).toBe(amounts.length);
      
      dataPoints.forEach((point: any, index: number) => {
        expect(point.period).toBeDefined();
        expect(point.amount).toBe(amounts[index]);
        expect(point.change).toBeDefined();
        expect(point.percentageChange).toBeDefined();
      });
    });

    it('should generate category forecast correctly', () => {
      const amounts = [100, 102, 104, 106, 108];
      const trend = { slope: 2, intercept: 98 };
      const confidence = 0.8;

      const forecast = (service as any).generateCategoryForecast(amounts, trend, confidence);

      expect(forecast).toBeDefined();
      expect(forecast.nextPeriodPrediction).toBeGreaterThan(0);
      expect(forecast.confidence).toBe(confidence);
      expect(['continuing', 'reversing', 'stabilizing']).toContain(forecast.trend);
    });

    it('should detect seasonality correctly', () => {
      const amounts = Array.from({ length: 28 }, (_, i) => 100 + Math.sin((i / 7) * 2 * Math.PI) * 20);

      const hasSeasonality = (service as any).detectSeasonality(amounts);

      expect(typeof hasSeasonality).toBe('boolean');
    });

    it('should detect trend correctly', () => {
      const amounts = Array.from({ length: 30 }, (_, i) => 100 + (i * 2));

      const hasTrend = (service as any).detectTrend(amounts);

      expect(typeof hasTrend).toBe('boolean');
    });

    it('should select best trend algorithm correctly', () => {
      const historicalData = Array.from({ length: 100 }, (_, i) => ({
        amount: 100 + Math.sin((i / 100) * 2 * Math.PI) * 50 + (i * 0.5),
      }));

      const algorithm = (service as any).selectBestTrendAlgorithm(historicalData);

      expect(['linear_regression', 'moving_average', 'exponential_smoothing', 'seasonal_decomposition', 'hybrid']).toContain(algorithm);
    });

    it('should calculate trend accuracy correctly', () => {
      const historicalData = Array.from({ length: 30 }, () => ({
        amount: 100 + Math.random() * 20,
      }));

      const accuracy = (service as any).calculateTrendAccuracy(historicalData);

      expect(accuracy).toBeGreaterThan(0);
      expect(accuracy).toBeLessThanOrEqual(1);
    });

    it('should calculate time window correctly', () => {
      const historicalData = [
        { date: '2024-01-01' },
        { date: '2024-01-15' },
        { date: '2024-01-30' },
      ];

      const timeWindow = (service as any).calculateTimeWindow(historicalData);

      expect(timeWindow).toBeGreaterThan(0);
    });

    it('should get month name correctly', () => {
      const monthName = (service as any).getMonthName(0);

      expect(monthName).toBe('January');
    });
  });

  describe('edge cases', () => {
    const mockQuery = {
      userId: 'user123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      categories: ['cat1'],
      transactionTypes: [TransactionType.EXPENSE],
      accounts: ['account1'],
      includeRecurring: true,
      confidenceThreshold: 0.8,
      modelType: 'trend_analysis' as const,
      algorithm: undefined,
    };

    it('should handle empty transaction data', async () => {
      mockTransactionRepository.find.mockResolvedValue([]);

      await expect(service.analyzeTrends(mockQuery)).rejects.toThrow(
        'Insufficient historical data for trend analysis. Need at least 14 days of data.'
      );
    });

    it('should handle null/undefined query parameters', async () => {
      const invalidQuery = {
        userId: 'user123',
        startDate: null as any,
        endDate: undefined as any,
      };

      await expect(service.analyzeTrends(invalidQuery as any)).rejects.toThrow();
    });

    it('should handle very large amounts', async () => {
      const mockTransactions = createMockTransactions(180, Array.from({ length: 180 }, (_, i) => ({
        amount: 1000000 + (i * 1000),
        date: new Date(Date.now() - (180 - i) * 24 * 60 * 60 * 1000),
        type: TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockCategoryRepository.find.mockResolvedValue(createMockCategories(1, [{ name: 'Food' }]));

      const result = await service.analyzeTrends(mockQuery);

      expect(result).toBeDefined();
      expect(Number.isFinite(result.overallTrend.confidence)).toBe(true);
    });

    it('should handle zero amounts', async () => {
      const mockTransactions = createMockTransactions(180, Array.from({ length: 180 }, (_, i) => ({
        amount: 0,
        date: new Date(Date.now() - (180 - i) * 24 * 60 * 60 * 1000),
        type: TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);
      mockCategoryRepository.find.mockResolvedValue(createMockCategories(1, [{ name: 'Food' }]));

      const result = await service.analyzeTrends(mockQuery);

      expect(result).toBeDefined();
      expect(result.overallTrend.direction).toBe('stable');
    });

    it('should handle single transaction', async () => {
      const mockTransactions = createMockTransactions(1, [{
        amount: 100,
        date: new Date('2024-01-01'),
        type: TransactionType.EXPENSE,
      }]);

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      await expect(service.analyzeTrends(mockQuery)).rejects.toThrow(
        'Insufficient historical data for trend analysis. Need at least 14 days of data.'
      );
    });
  });
});
