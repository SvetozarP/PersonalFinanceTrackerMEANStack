import { AnalyticsService } from '../../../../modules/financial/analytics/services/analytics.service';
import { AnalyticsRepository } from '../../../../modules/financial/analytics/repositories/analytics.repository';
import { TransactionService } from '../../../../modules/financial/transactions/services/transaction.service';
import { CategoryService } from '../../../../modules/financial/categories/service/category.service';
import { BudgetService } from '../../../../modules/financial/budgets/services/budget.service';
import { BudgetRepository } from '../../../../modules/financial/budgets/repositories/budget.repository';
import { TransactionRepository } from '../../../../modules/financial/transactions/repositories/transaction.repository';
import { CategoryRepository } from '../../../../modules/financial/categories/repositories/category.repository';
import { TransactionType } from '../../../../modules/financial/transactions/interfaces/transaction.interface';

// Mock the services
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

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockAnalyticsRepository: jest.Mocked<AnalyticsRepository>;
  let mockTransactionService: jest.Mocked<TransactionService>;
  let mockCategoryService: jest.Mocked<CategoryService>;
  let mockBudgetService: jest.Mocked<BudgetService>;

  const mockUserId = 'user123';
  const mockBudgetId = 'budget123';
  const mockStartDate = new Date('2024-01-01');
  const mockEndDate = new Date('2024-01-31');

  const mockSpendingAnalysis = {
    totalSpent: 3000,
    totalIncome: 5000,
    netAmount: 2000,
    averageDailySpending: 100,
    averageMonthlySpending: 3000,
    spendingByCategory: [
      {
        categoryId: 'cat1',
        categoryName: 'Food',
        categoryPath: 'Food',
        amount: 1500,
        percentage: 50,
        averageAmount: 1500,
        transactionCount: 10
      },
      {
        categoryId: 'cat2',
        categoryName: 'Transport',
        categoryPath: 'Transport',
        amount: 1000,
        percentage: 33.33,
        averageAmount: 1000,
        transactionCount: 5
      }
    ],
    spendingByDay: [
      { date: '2024-01-15', amount: 200, transactionCount: 2 },
      { date: '2024-01-16', amount: 150, transactionCount: 1 }
    ],
    spendingByMonth: [
      { month: '2024-01', amount: 3000, transactionCount: 15, averageAmount: 200 }
    ],
    topSpendingDays: [
      { date: '2024-01-15', amount: 200, transactionCount: 2 }
    ],
    spendingTrends: [
      { period: '2024-01', amount: 3000, change: 500, percentageChange: 20 }
    ]
  };

  const mockBudgetAnalytics = {
    budgetId: mockBudgetId,
    budgetName: 'Monthly Budget',
    totalAllocated: 3000,
    totalSpent: 3000,
    remainingAmount: 0,
    utilizationPercentage: 75,
    status: 'on-track' as const,
    categoryBreakdown: [
      {
        categoryId: 'cat1',
        categoryName: 'Food',
        allocatedAmount: 2000,
        spentAmount: 1500,
        remainingAmount: 500,
        utilizationPercentage: 75,
        status: 'on-track' as const,
        transactions: [
          {
            id: 'trans1',
            amount: 1500,
            date: new Date('2024-01-15'),
            description: 'Groceries'
          }
        ]
      },
      {
        categoryId: 'cat2',
        categoryName: 'Transport',
        allocatedAmount: 1000,
        spentAmount: 1000,
        remainingAmount: 0,
        utilizationPercentage: 100,
        status: 'over' as const,
        transactions: [
          {
            id: 'trans2',
            amount: 1000,
            date: new Date('2024-01-16'),
            description: 'Gas'
          }
        ]
      }
    ],
    dailyProgress: [
      {
        date: '2024-01-15',
        allocatedAmount: 100,
        spentAmount: 75,
        remainingAmount: 25
      }
    ],
    alerts: [
      {
        type: 'warning' as const,
        message: 'Budget utilization is high',
        threshold: 80,
        currentValue: 75
      }
    ]
  };

  const mockTransactions = {
    transactions: [
      {
        _id: 'trans1',
        title: 'Salary',
        amount: 5000,
        type: TransactionType.INCOME,
        date: new Date('2024-01-15'),
        categoryId: 'cat1'
      },
      {
        _id: 'trans2',
        title: 'Groceries',
        amount: 200,
        type: TransactionType.EXPENSE,
        date: new Date('2024-01-16'),
        categoryId: 'cat2'
      }
    ],
    total: 2,
    page: 1,
    totalPages: 1
  };

  const mockCategories = {
    categories: [
      {
        _id: 'cat1',
        name: 'Food',
        color: '#FF6B6B',
        icon: 'food'
      },
      {
        _id: 'cat2',
        name: 'Transport',
        color: '#4ECDC4',
        icon: 'car'
      }
    ],
    total: 2,
    page: 1,
    totalPages: 1
  };

  const mockBudgets = {
    budgets: [
      {
        _id: 'budget1',
        name: 'Monthly Budget',
        amount: 4000,
        userId: mockUserId
      }
    ],
    total: 1,
    page: 1,
    totalPages: 1
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockAnalyticsRepository = {
      getSpendingAnalysis: jest.fn().mockResolvedValue(mockSpendingAnalysis),
      getBudgetAnalytics: jest.fn().mockResolvedValue(mockBudgetAnalytics)
    } as any;

    mockTransactionService = {
      getUserTransactions: jest.fn().mockResolvedValue(mockTransactions)
    } as any;

    mockCategoryService = {
      getUserCategories: jest.fn().mockResolvedValue(mockCategories)
    } as any;

    mockBudgetService = {
      getBudgets: jest.fn().mockResolvedValue(mockBudgets),
      getBudgetById: jest.fn().mockResolvedValue({
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
      })
    } as any;

    // Mock the constructor calls
    MockedAnalyticsRepository.mockImplementation(() => mockAnalyticsRepository);
    MockedTransactionService.mockImplementation(() => mockTransactionService);
    MockedCategoryService.mockImplementation(() => mockCategoryService);
    MockedBudgetRepository.mockImplementation(() => ({} as any));
    MockedTransactionRepository.mockImplementation(() => ({} as any));
    MockedCategoryRepository.mockImplementation(() => ({} as any));
    MockedBudgetService.mockImplementation(() => mockBudgetService);

    analyticsService = new AnalyticsService();
  });

  describe('getSpendingAnalysis', () => {
    it('should get spending analysis successfully', async () => {
      const query = {
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
        groupBy: 'month' as const
      };

      const result = await analyticsService.getSpendingAnalysis(query);

      expect(mockAnalyticsRepository.getSpendingAnalysis).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockSpendingAnalysis);
    });

    it('should handle errors when getting spending analysis', async () => {
      const error = new Error('Database error');
      mockAnalyticsRepository.getSpendingAnalysis.mockRejectedValue(error);

      const query = {
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
        groupBy: 'month' as const
      };

      await expect(analyticsService.getSpendingAnalysis(query)).rejects.toThrow('Database error');
    });
  });

  describe('getBudgetAnalytics', () => {
    it('should get budget analytics successfully', async () => {
      const result = await analyticsService.getBudgetAnalytics(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );

      expect(mockAnalyticsRepository.getBudgetAnalytics).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        mockStartDate,
        mockEndDate
      );
      expect(result).toEqual(mockBudgetAnalytics);
    });

    it('should handle errors when getting budget analytics', async () => {
      const error = new Error('Budget not found');
      mockAnalyticsRepository.getBudgetAnalytics.mockRejectedValue(error);

      await expect(
        analyticsService.getBudgetAnalytics(mockUserId, mockBudgetId, mockStartDate, mockEndDate)
      ).rejects.toThrow('Budget not found');
    });
  });

  describe('getAllBudgetAnalytics', () => {
    it('should get all budget analytics successfully', async () => {
      const result = await analyticsService.getAllBudgetAnalytics(
        mockUserId,
        mockStartDate,
        mockEndDate
      );

      expect(mockBudgetService.getBudgets).toHaveBeenCalledWith(mockUserId);
      expect(mockAnalyticsRepository.getBudgetAnalytics).toHaveBeenCalledWith(
        mockUserId,
        'budget1',
        mockStartDate,
        mockEndDate
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockBudgetAnalytics);
    });

    it('should handle errors when getting all budget analytics', async () => {
      const error = new Error('Failed to get budgets');
      mockBudgetService.getBudgets.mockRejectedValue(error);

      await expect(
        analyticsService.getAllBudgetAnalytics(mockUserId, mockStartDate, mockEndDate)
      ).rejects.toThrow('Failed to get budgets');
    });
  });

  describe('getFinancialInsights', () => {
    it('should get financial insights successfully', async () => {
      const result = await analyticsService.getFinancialInsights(
        mockUserId,
        mockStartDate,
        mockEndDate
      );

      expect(mockAnalyticsRepository.getSpendingAnalysis).toHaveBeenCalledWith({
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
        groupBy: 'month'
      });
      expect(result).toHaveProperty('spendingPatterns');
      expect(result).toHaveProperty('categoryInsights');
      expect(result).toHaveProperty('timeInsights');
      expect(result).toHaveProperty('recommendations');
    });

    it('should handle errors when getting financial insights', async () => {
      const error = new Error('Failed to get spending analysis');
      mockAnalyticsRepository.getSpendingAnalysis.mockRejectedValue(error);

      await expect(
        analyticsService.getFinancialInsights(mockUserId, mockStartDate, mockEndDate)
      ).rejects.toThrow('Failed to get spending analysis');
    });

    it('should handle insights with empty spending data', async () => {
      const emptySpendingAnalysis = {
        ...mockSpendingAnalysis,
        topSpendingDays: [],
        spendingByDay: [],
        spendingByMonth: []
      };
      mockAnalyticsRepository.getSpendingAnalysis.mockResolvedValue(emptySpendingAnalysis);
      mockAnalyticsRepository.getBudgetAnalytics.mockResolvedValue({
        ...mockBudgetAnalytics,
        remainingAmount: 200
      });

      const result = await analyticsService.getFinancialInsights(mockUserId, mockStartDate, mockEndDate);

      expect(result).toBeDefined();
      expect(result.spendingPatterns.mostExpensiveDay).toBe('');
      expect(result.spendingPatterns.leastExpensiveDay).toBe('');
    });

    it('should handle high spending alert when spending > 80% of income', async () => {
      const highSpendingAnalysis = {
        ...mockSpendingAnalysis,
        totalSpent: 4000, // 80% of 5000 income
        totalIncome: 5000
      };
      mockAnalyticsRepository.getSpendingAnalysis.mockResolvedValue(highSpendingAnalysis);
      mockAnalyticsRepository.getBudgetAnalytics.mockResolvedValue({
        ...mockBudgetAnalytics,
        remainingAmount: 200
      });

      const result = await analyticsService.getFinancialInsights(mockUserId, mockStartDate, mockEndDate);

      expect(result).toBeDefined();
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'category',
          priority: 'medium'
        })
      );
    });

    it('should handle category spending recommendations for high percentage categories', async () => {
      const categorySpendingAnalysis = {
        ...mockSpendingAnalysis,
        spendingByCategory: [
          {
            categoryId: 'cat1',
            categoryName: 'Food',
            categoryPath: 'Food',
            amount: 1500,
            percentage: 35, // > 30%
            averageAmount: 1500,
            transactionCount: 10
          }
        ]
      };
      mockAnalyticsRepository.getSpendingAnalysis.mockResolvedValue(categorySpendingAnalysis);
      mockAnalyticsRepository.getBudgetAnalytics.mockResolvedValue({
        ...mockBudgetAnalytics,
        remainingAmount: 200
      });

      const result = await analyticsService.getFinancialInsights(mockUserId, mockStartDate, mockEndDate);

      expect(result).toBeDefined();
      expect(result.recommendations).toContainEqual(
        expect.objectContaining({
          type: 'category',
          priority: 'medium'
        })
      );
    });
  });

  describe('getCashFlowAnalysis', () => {
    it('should get cash flow analysis successfully', async () => {
      const result = await analyticsService.getCashFlowAnalysis(
        mockUserId,
        mockStartDate,
        mockEndDate,
        'month'
      );

      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith(mockUserId, {
        startDate: mockStartDate,
        endDate: mockEndDate,
        limit: 10000
      });
      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('totalInflows');
      expect(result).toHaveProperty('totalOutflows');
      expect(result).toHaveProperty('netCashFlow');
    });

    it('should handle errors when getting cash flow analysis', async () => {
      const error = new Error('Failed to get transactions');
      mockTransactionService.getUserTransactions.mockRejectedValue(error);

      await expect(
        analyticsService.getCashFlowAnalysis(mockUserId, mockStartDate, mockEndDate, 'month')
      ).rejects.toThrow('Failed to get transactions');
    });
  });

  describe('getPeriodComparison', () => {
    it('should get period comparison successfully', async () => {
      const currentStart = new Date('2024-01-01');
      const currentEnd = new Date('2024-01-31');
      const previousStart = new Date('2023-12-01');
      const previousEnd = new Date('2023-12-31');

      const result = await analyticsService.getPeriodComparison(
        mockUserId,
        currentStart,
        currentEnd,
        previousStart,
        previousEnd
      );

      expect(mockAnalyticsRepository.getSpendingAnalysis).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('currentPeriod');
      expect(result).toHaveProperty('previousPeriod');
      expect(result).toHaveProperty('changes');
      expect(result).toHaveProperty('insights');
    });

    it('should handle errors when getting period comparison', async () => {
      const error = new Error('Failed to get spending analysis');
      mockAnalyticsRepository.getSpendingAnalysis.mockRejectedValue(error);

      const currentStart = new Date('2024-01-01');
      const currentEnd = new Date('2024-01-31');
      const previousStart = new Date('2023-12-01');
      const previousEnd = new Date('2023-12-31');

      await expect(
        analyticsService.getPeriodComparison(mockUserId, currentStart, currentEnd, previousStart, previousEnd)
      ).rejects.toThrow('Failed to get spending analysis');
    });
  });

  describe('getCategoryPerformance', () => {
    it('should get category performance successfully', async () => {
      const result = await analyticsService.getCategoryPerformance(
        mockUserId,
        mockStartDate,
        mockEndDate
      );

      expect(mockAnalyticsRepository.getSpendingAnalysis).toHaveBeenCalledWith({
        userId: mockUserId,
        startDate: mockStartDate,
        endDate: mockEndDate,
        groupBy: 'month'
      });
      expect(mockCategoryService.getUserCategories).toHaveBeenCalledWith(mockUserId);
      expect(result).toBeDefined();
    });

    it('should handle errors when getting category performance', async () => {
      const error = new Error('Failed to get spending analysis');
      mockAnalyticsRepository.getSpendingAnalysis.mockRejectedValue(error);

      await expect(
        analyticsService.getCategoryPerformance(mockUserId, mockStartDate, mockEndDate)
      ).rejects.toThrow('Failed to get spending analysis');
    });
  });

  // ==================== BUDGET REPORTING METHODS ====================

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
      expect(result.performance.totalAllocated).toBe(3000);
      expect(result.performance.totalSpent).toBe(3000);
      expect(result.performance.utilizationPercentage).toBe(75);
      expect(result.performance.varianceAmount).toBe(0);
      expect(result.performance.variancePercentage).toBe(0);
      expect(result.performance.status).toBe('on-track');
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
      expect(result.summary.totalBudgeted).toBe(3000);
      expect(result.summary.totalActual).toBe(3000);
      expect(result.summary.variance).toBe(0);
      expect(result.summary.variancePercentage).toBe(0);
      expect(result.summary.status).toBe('on-track');
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
      expect(result.varianceSummary.totalVariancePercentage).toBeCloseTo(-16.67, 2);
      expect(result.varianceSummary.favorableVariances).toBe(500);
      expect(result.varianceSummary.unfavorableVariances).toBe(0);
      expect(result.varianceSummary.netVariance).toBe(-500);
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
      expect(result.riskFactors).toBeDefined();
      expect(result.recommendations).toBeDefined();
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
      expect(result.categoryBreakdown).toBeDefined();
      expect(result.spendingPatterns).toBeDefined();
      expect(result.insights).toBeDefined();
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

    it('should generate utilization alerts when utilization > 90%', async () => {
      const highUtilizationAnalytics = {
        ...mockBudgetAnalytics,
        utilizationPercentage: 95,
        remainingAmount: 200,
        status: 'on-track' as const
      };
      mockAnalyticsRepository.getBudgetAnalytics.mockResolvedValue(highUtilizationAnalytics);

      const result = await analyticsService.getBudgetAlerts(mockUserId, mockBudgetId);

      expect(result).toBeDefined();
      expect(result).toContainEqual(
        expect.objectContaining({
          type: 'threshold',
          severity: 'warning'
        })
      );
    });

    it('should generate critical alerts when utilization > 100%', async () => {
      const overBudgetAnalytics = {
        ...mockBudgetAnalytics,
        utilizationPercentage: 110,
        remainingAmount: -100,
        dailyProgress: [],
        status: 'critical' as const
      };
      mockAnalyticsRepository.getBudgetAnalytics.mockResolvedValue(overBudgetAnalytics);

      const result = await analyticsService.getBudgetAlerts(mockUserId, mockBudgetId);

      expect(result).toBeDefined();
      expect(result).toContainEqual(
        expect.objectContaining({
          type: 'threshold',
          severity: 'critical'
        })
      );
    });

    it('should generate category alerts when category utilization > 100%', async () => {
      const categoryOverBudgetAnalytics = {
        ...mockBudgetAnalytics,
        remainingAmount: 200,
        status: 'on-track' as const,
        categoryBreakdown: [
          {
            categoryId: 'cat1',
            categoryName: 'Food',
            allocatedAmount: 1000,
            spentAmount: 1200,
            remainingAmount: -200,
            utilizationPercentage: 120,
            status: 'critical' as const,
            transactions: []
          }
        ]
      };
      mockAnalyticsRepository.getBudgetAnalytics.mockResolvedValue(categoryOverBudgetAnalytics);

      const result = await analyticsService.getBudgetAlerts(mockUserId, mockBudgetId);

      expect(result).toBeDefined();
      expect(result).toContainEqual(
        expect.objectContaining({
          type: 'variance',
          severity: 'critical'
        })
      );
    });

    it('should skip null budgets in all budgets check', async () => {
      const budgetsWithNull = [
        { _id: 'budget1', name: 'Budget 1' },
        null,
        { _id: 'budget2', name: 'Budget 2' }
      ];
      mockBudgetService.getBudgets.mockResolvedValue({
        budgets: budgetsWithNull as any,
        total: 3,
        page: 1,
        totalPages: 1
      });
      mockAnalyticsRepository.getBudgetAnalytics.mockResolvedValue({
        ...mockBudgetAnalytics,
        remainingAmount: 200,
        status: 'on-track' as const
      });

      const result = await analyticsService.getBudgetAlerts(mockUserId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
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

    it('should export CSV format correctly', async () => {
      const exportOptions = {
        format: 'csv' as const,
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

      expect(result).toBeDefined();
      expect(result.format).toBe('text/csv');
      expect(result.filename).toContain('.csv');
    });

    it('should export PDF format correctly', async () => {
      const exportOptions = {
        format: 'pdf' as const,
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

      expect(result).toBeDefined();
      expect(result.format).toBe('application/json');
      expect(result.filename).toContain('.json');
    });

    it('should export Excel format correctly', async () => {
      const exportOptions = {
        format: 'excel' as const,
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

      expect(result).toBeDefined();
      expect(result.format).toBe('application/json');
      expect(result.filename).toContain('.json');
    });
  });
});
