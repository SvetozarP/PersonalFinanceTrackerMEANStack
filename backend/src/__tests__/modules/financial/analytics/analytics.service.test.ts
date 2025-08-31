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
    spendingByCategory: [
      {
        categoryId: 'cat1',
        categoryName: 'Food',
        amount: 1500,
        percentage: 50,
        averageAmount: 1500,
        transactionCount: 10
      },
      {
        categoryId: 'cat2',
        categoryName: 'Transport',
        amount: 1000,
        percentage: 33.33,
        averageAmount: 1000,
        transactionCount: 5
      }
    ],
    spendingByDay: [
      { date: '2024-01-15', amount: 200 },
      { date: '2024-01-16', amount: 150 }
    ],
    spendingByMonth: [
      { month: '2024-01', amount: 3000 }
    ],
    topSpendingDays: [
      { date: '2024-01-15', amount: 200 }
    ]
  };

  const mockBudgetAnalytics = {
    budgetId: mockBudgetId,
    budgetName: 'Monthly Budget',
    totalBudget: 4000,
    totalSpent: 3000,
    remainingBudget: 1000,
    utilizationPercentage: 75,
    status: 'on-track',
    spendingByCategory: [],
    monthlyTrends: [],
    alerts: []
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
      getBudgets: jest.fn().mockResolvedValue(mockBudgets)
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
});
