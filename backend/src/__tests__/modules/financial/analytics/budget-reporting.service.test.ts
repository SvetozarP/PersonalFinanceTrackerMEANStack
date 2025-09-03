/**
 * @jest-environment node
 */

import { AnalyticsService } from '../../../../modules/financial/analytics/services/analytics.service';
import { AnalyticsRepository } from '../../../../modules/financial/analytics/repositories/analytics.repository';
import { TransactionService } from '../../../../modules/financial/transactions/services/transaction.service';
import { CategoryService } from '../../../../modules/financial/categories/service/category.service';
import { BudgetService } from '../../../../modules/financial/budgets/services/budget.service';
import { BudgetRepository } from '../../../../modules/financial/budgets/repositories/budget.repository';
import { TransactionRepository } from '../../../../modules/financial/transactions/repositories/transaction.repository';
import { CategoryRepository } from '../../../../modules/financial/categories/repositories/category.repository';

// Mock all dependencies
jest.mock('../../../../modules/financial/analytics/repositories/analytics.repository');
jest.mock('../../../../modules/financial/transactions/services/transaction.service');
jest.mock('../../../../modules/financial/categories/service/category.service');
jest.mock('../../../../modules/financial/budgets/services/budget.service');
jest.mock('../../../../modules/financial/budgets/repositories/budget.repository');
jest.mock('../../../../modules/financial/transactions/repositories/transaction.repository');
jest.mock('../../../../modules/financial/categories/repositories/category.repository');

const MockedAnalyticsRepository = jest.mocked(AnalyticsRepository);
const MockedTransactionService = jest.mocked(TransactionService);
const MockedCategoryService = jest.mocked(CategoryService);
const MockedBudgetService = jest.mocked(BudgetService);
const MockedBudgetRepository = jest.mocked(BudgetRepository);
const MockedTransactionRepository = jest.mocked(TransactionRepository);
const MockedCategoryRepository = jest.mocked(CategoryRepository);

describe('AnalyticsService - Budget Reporting Methods', () => {
  let analyticsService: AnalyticsService;
  let mockAnalyticsRepository: jest.Mocked<AnalyticsRepository>;
  let mockTransactionService: jest.Mocked<TransactionService>;
  let mockCategoryService: jest.Mocked<CategoryService>;
  let mockBudgetService: jest.Mocked<BudgetService>;

  const mockUserId = 'user123';
  const mockBudgetId = 'budget123';
  const mockStartDate = new Date('2024-01-01');
  const mockEndDate = new Date('2024-01-31');

  const mockBudget = {
    _id: mockBudgetId,
    name: 'Monthly Budget',
    totalAmount: 4000,
    currency: 'USD',
    startDate: mockStartDate,
    endDate: mockEndDate,
    categoryAllocations: [
      {
        categoryId: 'cat1',
        allocatedAmount: 2000
      }
    ]
  };

  const mockBudgetAnalytics = {
    budgetId: mockBudgetId,
    budgetName: 'Monthly Budget',
    totalAllocated: 4000,
    totalSpent: 3000,
    remainingAmount: 1000,
    utilizationPercentage: 75,
    status: 'under' as const,
    categoryBreakdown: [
      {
        categoryId: 'cat1',
        categoryName: 'Food',
        allocatedAmount: 2000,
        spentAmount: 1500,
        remainingAmount: 500,
        utilizationPercentage: 75,
        status: 'under' as const,
        transactions: [
          {
            id: 'txn1',
            amount: 100,
            date: new Date('2024-01-15'),
            description: 'Grocery shopping'
          }
        ]
      }
    ],
    dailyProgress: [],
    alerts: []
  };

  const mockTransactions = {
    transactions: [
      {
        id: 'txn1',
        amount: 100,
        date: new Date('2024-01-15'),
        description: 'Grocery shopping',
        categoryId: 'cat1'
      }
    ],
    total: 1,
    page: 1,
    limit: 1000
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock repository
    mockAnalyticsRepository = {
      getSpendingAnalysis: jest.fn(),
      getBudgetAnalytics: jest.fn().mockResolvedValue(mockBudgetAnalytics)
    } as any;

    // Setup mock services
    mockTransactionService = {
      getUserTransactions: jest.fn().mockResolvedValue(mockTransactions)
    } as any;

    mockCategoryService = {
      getUserCategories: jest.fn().mockResolvedValue({
        categories: [
          {
            _id: 'cat1',
            name: 'Food',
            path: 'Food'
          }
        ]
      })
    } as any;

    mockBudgetService = {
      getBudgetById: jest.fn().mockResolvedValue(mockBudget),
      getBudgets: jest.fn().mockResolvedValue({
        budgets: [mockBudget]
      })
    } as any;

    // Mock constructors
    MockedAnalyticsRepository.mockImplementation(() => mockAnalyticsRepository);
    MockedTransactionService.mockImplementation(() => mockTransactionService);
    MockedCategoryService.mockImplementation(() => mockCategoryService);
    MockedBudgetService.mockImplementation(() => mockBudgetService);
    MockedBudgetRepository.mockImplementation(() => ({} as any));
    MockedTransactionRepository.mockImplementation(() => ({} as any));
    MockedCategoryRepository.mockImplementation(() => ({} as any));

    // Create service instance
    analyticsService = new AnalyticsService();
  });

  describe('getBudgetPerformanceReport', () => {
    it('should get budget performance report successfully', async () => {
      const result = await analyticsService.getBudgetPerformanceReport(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      expect(mockBudgetService.getBudgetById).toHaveBeenCalledWith(mockUserId, mockBudgetId);
      expect(mockAnalyticsRepository.getBudgetAnalytics).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith(mockUserId, {
        startDate: mockStartDate,
        endDate: mockEndDate,

        limit: 1000
      });

      expect(result).toBeDefined();
      expect(result.budgetId).toBe(mockBudgetId);
      expect(result.budgetName).toBe('Monthly Budget');
      expect(result.performance.totalAllocated).toBe(4000);
      expect(result.performance.totalSpent).toBe(3000);
      expect(result.performance.utilizationPercentage).toBe(75);
      expect(result.performance.varianceAmount).toBe(-1000);
      expect(result.performance.variancePercentage).toBe(-25);
      expect(result.performance.status).toBe('under');
    });

    it('should throw error when budget is not found', async () => {
      mockBudgetService.getBudgetById.mockResolvedValue(null as any);

      await expect(
        analyticsService.getBudgetPerformanceReport(
          mockUserId,
          mockBudgetId,
          mockStartDate,
          mockEndDate
        )
      ).rejects.toThrow('Budget not found');
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockBudgetService.getBudgetById.mockRejectedValue(error);

      await expect(
        analyticsService.getBudgetPerformanceReport(
          mockUserId,
          mockBudgetId,
          mockStartDate,
          mockEndDate
        )
      ).rejects.toThrow('Service error');
    });
  });

  describe('getBudgetVsActualReport', () => {
    it('should get budget vs actual report successfully', async () => {
      const result = await analyticsService.getBudgetVsActualReport(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      expect(mockBudgetService.getBudgetById).toHaveBeenCalledWith(mockUserId, mockBudgetId);
      expect(mockAnalyticsRepository.getBudgetAnalytics).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      expect(result).toBeDefined();
      expect(result.budgetId).toBe(mockBudgetId);
      expect(result.budgetName).toBe('Monthly Budget');
      expect(result.summary.totalBudgeted).toBe(4000);
      expect(result.summary.totalActual).toBe(3000);
      expect(result.summary.variance).toBe(-1000);
      expect(result.summary.variancePercentage).toBe(-25);
      expect(result.summary.status).toBe('under');
      expect(result.categoryComparison).toHaveLength(1);
      expect(result.categoryComparison[0].efficiency).toBe(0.75);
    });

    it('should throw error when budget is not found', async () => {
      mockBudgetService.getBudgetById.mockResolvedValue(null as any);

      await expect(
        analyticsService.getBudgetVsActualReport(
          mockUserId,
          mockBudgetId,
          mockStartDate,
          mockEndDate
        )
      ).rejects.toThrow('Budget not found');
    });
  });

  describe('getBudgetTrendAnalysis', () => {
    it('should get budget trend analysis successfully', async () => {
      const result = await analyticsService.getBudgetTrendAnalysis(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      expect(mockBudgetService.getBudgetById).toHaveBeenCalledWith(mockUserId, mockBudgetId);
      expect(mockAnalyticsRepository.getBudgetAnalytics).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      expect(result).toBeDefined();
      expect(result.budgetId).toBe(mockBudgetId);
      expect(result.budgetName).toBe('Monthly Budget');
      expect(result.analysisPeriod.startDate).toEqual(mockStartDate);
      expect(result.analysisPeriod.endDate).toEqual(mockEndDate);
      expect(result.trends).toBeDefined();
      expect(result.projections).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it('should throw error when budget is not found', async () => {
      mockBudgetService.getBudgetById.mockResolvedValue(null as any);

      await expect(
        analyticsService.getBudgetTrendAnalysis(
          mockUserId,
          mockBudgetId,
          mockStartDate,
          mockEndDate
        )
      ).rejects.toThrow('Budget not found');
    });
  });

  describe('getBudgetVarianceAnalysis', () => {
    it('should get budget variance analysis successfully', async () => {
      const result = await analyticsService.getBudgetVarianceAnalysis(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      expect(mockBudgetService.getBudgetById).toHaveBeenCalledWith(mockUserId, mockBudgetId);
      expect(mockAnalyticsRepository.getBudgetAnalytics).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      expect(result).toBeDefined();
      expect(result.budgetId).toBe(mockBudgetId);
      expect(result.budgetName).toBe('Monthly Budget');
      expect(result.period.startDate).toEqual(mockStartDate);
      expect(result.period.endDate).toEqual(mockEndDate);
      expect(result.varianceSummary.totalVariance).toBe(-500);
      expect(result.varianceSummary.totalVariancePercentage).toBe(-12.5);
      expect(result.varianceSummary.favorableVariances).toBe(500);
      expect(result.varianceSummary.unfavorableVariances).toBe(0);
      expect(result.varianceSummary.netVariance).toBe(-500);
      expect(result.categoryVariances).toHaveLength(1);
      expect(result.categoryVariances[0].varianceType).toBe('favorable');
      expect(result.categoryVariances[0].impact).toBe('high');
    });

    it('should throw error when budget is not found', async () => {
      mockBudgetService.getBudgetById.mockResolvedValue(null as any);

      await expect(
        analyticsService.getBudgetVarianceAnalysis(
          mockUserId,
          mockBudgetId,
          mockStartDate,
          mockEndDate
        )
      ).rejects.toThrow('Budget not found');
    });
  });

  describe('getBudgetForecast', () => {
    it('should get budget forecast successfully', async () => {
      const forecastStartDate = new Date('2024-02-01');
      const forecastEndDate = new Date('2024-02-29');

      const result = await analyticsService.getBudgetForecast(
        mockUserId,
        mockBudgetId,
        forecastStartDate,
        forecastEndDate
      );

      expect(mockBudgetService.getBudgetById).toHaveBeenCalledWith(mockUserId, mockBudgetId);
      expect(mockAnalyticsRepository.getBudgetAnalytics).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        expect.any(Date), // Historical start date (6 months before forecast)
        forecastStartDate
      );

      expect(result).toBeDefined();
      expect(result.budgetId).toBe(mockBudgetId);
      expect(result.budgetName).toBe('Monthly Budget');
      expect(result.forecastPeriod.startDate).toEqual(forecastStartDate);
      expect(result.forecastPeriod.endDate).toEqual(forecastEndDate);
      expect(result.forecast).toBeDefined();
      expect(result.forecast.methodology).toBe('historical');
      expect(result.categoryForecasts).toBeDefined();
      expect(result.scenarios).toHaveLength(3);
      expect(result.scenarios[0].scenario).toBe('optimistic');
      expect(result.scenarios[1].scenario).toBe('realistic');
      expect(result.scenarios[2].scenario).toBe('pessimistic');
      expect(result.riskFactors).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should throw error when budget is not found', async () => {
      mockBudgetService.getBudgetById.mockResolvedValue(null as any);

      await expect(
        analyticsService.getBudgetForecast(
          mockUserId,
          mockBudgetId,
          new Date('2024-02-01'),
          new Date('2024-02-29')
        )
      ).rejects.toThrow('Budget not found');
    });
  });

  describe('getBudgetCategoryBreakdown', () => {
    it('should get budget category breakdown successfully', async () => {
      const result = await analyticsService.getBudgetCategoryBreakdown(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      expect(mockBudgetService.getBudgetById).toHaveBeenCalledWith(mockUserId, mockBudgetId);
      expect(mockAnalyticsRepository.getBudgetAnalytics).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith(mockUserId, {
        startDate: mockStartDate,
        endDate: mockEndDate,

        limit: 1000
      });

      expect(result).toBeDefined();
      expect(result.budgetId).toBe(mockBudgetId);
      expect(result.budgetName).toBe('Monthly Budget');
      expect(result.period.startDate).toEqual(mockStartDate);
      expect(result.period.endDate).toEqual(mockEndDate);
      expect(result.categoryBreakdown).toHaveLength(1);
      expect(result.categoryBreakdown[0].transactionCount).toBe(1);
      expect(result.categoryBreakdown[0].averageTransactionAmount).toBe(100);
      expect(result.categoryBreakdown[0].largestTransaction).toBe(100);
      expect(result.categoryBreakdown[0].smallestTransaction).toBe(100);
      expect(result.spendingPatterns).toBeDefined();
      expect(result.spendingPatterns.topSpendingCategories).toBeDefined();
      expect(result.spendingPatterns.mostActiveCategories).toBeDefined();
      expect(result.spendingPatterns.categoryEfficiency).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it('should throw error when budget is not found', async () => {
      mockBudgetService.getBudgetById.mockResolvedValue(null as any);

      await expect(
        analyticsService.getBudgetCategoryBreakdown(
          mockUserId,
          mockBudgetId,
          mockStartDate,
          mockEndDate
        )
      ).rejects.toThrow('Budget not found');
    });
  });

  describe('getBudgetAlerts', () => {
    it('should get budget alerts for all budgets successfully', async () => {
      const result = await analyticsService.getBudgetAlerts(mockUserId);

      expect(mockBudgetService.getBudgets).toHaveBeenCalledWith(mockUserId);
      expect(mockAnalyticsRepository.getBudgetAnalytics).toHaveBeenCalled();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should get budget alerts for specific budget successfully', async () => {
      const result = await analyticsService.getBudgetAlerts(mockUserId, mockBudgetId);

      expect(mockBudgetService.getBudgetById).toHaveBeenCalledWith(mockUserId, mockBudgetId);
      expect(mockAnalyticsRepository.getBudgetAnalytics).toHaveBeenCalled();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle errors when checking budget alerts', async () => {
      const error = new Error('Database error');
      mockAnalyticsRepository.getBudgetAnalytics.mockRejectedValue(error);

      const result = await analyticsService.getBudgetAlerts(mockUserId, mockBudgetId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('exportBudgetReport', () => {
    it('should export budget report successfully', async () => {
      const exportOptions = {
        format: 'json' as const,
        reportType: 'performance' as const,
        includeCharts: false,
        includeDetails: true,
        dateRange: {
          startDate: mockStartDate,
          endDate: mockEndDate
        },
        budgetIds: [mockBudgetId],
        categories: ['cat1']
      };

      const result = await analyticsService.exportBudgetReport(mockUserId, exportOptions);

      expect(mockBudgetService.getBudgetById).toHaveBeenCalledWith(mockUserId, mockBudgetId);
      expect(mockAnalyticsRepository.getBudgetAnalytics).toHaveBeenCalled();

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.format).toBe('application/json');
      expect(result.filename).toContain('budget-report-performance');
      expect(result.filename).toContain('.json');
    });

    it('should export all report types when reportType is "all"', async () => {
      const exportOptions = {
        format: 'json' as const,
        reportType: 'all' as const,
        includeCharts: false,
        includeDetails: true,
        dateRange: {
          startDate: mockStartDate,
          endDate: mockEndDate
        },
        budgetIds: [mockBudgetId],
        categories: ['cat1']
      };

      const result = await analyticsService.exportBudgetReport(mockUserId, exportOptions);

      expect(mockBudgetService.getBudgetById).toHaveBeenCalledTimes(2); // performance + variance
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should handle export errors', async () => {
      const error = new Error('Export error');
      mockBudgetService.getBudgetById.mockRejectedValue(error);

      const exportOptions = {
        format: 'json' as const,
        reportType: 'performance' as const,
        includeCharts: false,
        includeDetails: true,
        dateRange: {
          startDate: mockStartDate,
          endDate: mockEndDate
        },
        budgetIds: [mockBudgetId],
        categories: ['cat1']
      };

      await expect(
        analyticsService.exportBudgetReport(mockUserId, exportOptions)
      ).rejects.toThrow('Export error');
    });
  });

  describe('Private helper methods', () => {
    it('should calculate budget performance metrics correctly', async () => {
      const result = await analyticsService.getBudgetPerformanceReport(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      // Test performance calculations
      expect(result.performance.varianceAmount).toBe(-1000); // spent - allocated
      expect(result.performance.variancePercentage).toBe(-25); // (variance / allocated) * 100
      expect(result.performance.status).toBe('under');

      // Test category performance calculations
      expect(result.categoryPerformance[0].varianceAmount).toBe(-500);
      expect(result.categoryPerformance[0].variancePercentage).toBe(-25);
      expect(result.categoryPerformance[0].status).toBe('under');
    });

    it('should generate performance insights correctly', async () => {
      const result = await analyticsService.getBudgetPerformanceReport(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      expect(result.insights[0].type).toBe('recommendation');
      expect(result.insights[0].priority).toBe('medium');
      expect(result.insights[0].message).toContain('Budget is under by');
    });

    it('should calculate variance analysis correctly', async () => {
      const result = await analyticsService.getBudgetVarianceAnalysis(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      // Test variance summary calculations
      expect(result.varianceSummary.totalVariance).toBe(-500);
      expect(result.varianceSummary.totalVariancePercentage).toBe(-12.5);
      expect(result.varianceSummary.favorableVariances).toBe(500);
      expect(result.varianceSummary.unfavorableVariances).toBe(0);
      expect(result.varianceSummary.netVariance).toBe(-500);

      // Test category variance calculations
      expect(result.categoryVariances[0].variance).toBe(-500);
      expect(result.categoryVariances[0].variancePercentage).toBe(-25);
      expect(result.categoryVariances[0].varianceType).toBe('favorable');
      expect(result.categoryVariances[0].impact).toBe('high');
    });

    it('should generate forecast scenarios correctly', async () => {
      const result = await analyticsService.getBudgetForecast(
        mockUserId,
        mockBudgetId,
        new Date('2024-02-01'),
        new Date('2024-02-29')
      );

      expect(result.scenarios).toHaveLength(3);
      expect(result.scenarios[0].scenario).toBe('optimistic');
      expect(result.scenarios[0].probability).toBe(0.2);
      expect(result.scenarios[1].scenario).toBe('realistic');
      expect(result.scenarios[1].probability).toBe(0.6);
      expect(result.scenarios[2].scenario).toBe('pessimistic');
      expect(result.scenarios[2].probability).toBe(0.2);
    });

    it('should calculate category efficiency correctly', async () => {
      const result = await analyticsService.getBudgetCategoryBreakdown(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      expect(result.spendingPatterns.categoryEfficiency).toBeDefined();
      expect(result.spendingPatterns.categoryEfficiency[0].efficiency).toBe(0.75);
      expect(result.spendingPatterns.categoryEfficiency[0].status).toBe('efficient');
    });
  });
});
