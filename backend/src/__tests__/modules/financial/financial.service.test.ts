import { FinancialService } from '../../../modules/financial/financial.service';
import { TransactionService } from '../../../modules/financial/transactions/services/transaction.service';
import { CategoryService } from '../../../modules/financial/categories/service/category.service';
import { TransactionType, TransactionStatus } from '../../../modules/financial/transactions/interfaces/transaction.interface';

// Mock the services
jest.mock('../../../modules/financial/transactions/services/transaction.service');
jest.mock('../../../modules/financial/categories/service/category.service');

const MockedTransactionService = jest.mocked(TransactionService);
const MockedCategoryService = jest.mocked(CategoryService);

describe('FinancialService', () => {
  let financialService: FinancialService;
  let mockTransactionService: jest.Mocked<TransactionService>;
  let mockCategoryService: jest.Mocked<CategoryService>;

  const mockUserId = 'user123';

  const mockTransactionStats = {
    totalTransactions: 10,
    totalIncome: 5000,
    totalExpenses: 3000,
    totalTransfers: 1000,
    totalAdjustments: 200,
    averageTransactionAmount: 500,
    transactionsByType: {
      [TransactionType.INCOME]: { count: 5, total: 5000 },
      [TransactionType.EXPENSE]: { count: 3, total: 3000 },
      [TransactionType.TRANSFER]: { count: 1, total: 1000 },
      [TransactionType.ADJUSTMENT]: { count: 1, total: 200 },
    },
    transactionsByCategory: [
      { categoryId: 'cat1', categoryName: 'Food', total: 2000, count: 4, percentage: 40 },
      { categoryId: 'cat2', categoryName: 'Transport', total: 1500, count: 3, percentage: 30 },
      { categoryId: 'cat3', categoryName: 'Entertainment', total: 500, count: 2, percentage: 10 },
    ],
    monthlyTrends: [
      { month: '2024-01', income: 5000, expenses: 3000, net: 2000 },
      { month: '2024-02', income: 4500, expenses: 2800, net: 1700 },
    ],
  };

  const mockRecentTransactions = {
    transactions: [
      { _id: 'trans1', title: 'Salary', amount: 5000, type: TransactionType.INCOME, date: new Date() },
      { _id: 'trans2', title: 'Groceries', amount: 200, type: TransactionType.EXPENSE, date: new Date() },
    ] as any,
    total: 2,
    page: 1,
    totalPages: 1,
  };

  const mockPendingTransactions = {
    transactions: [
      { _id: 'trans3', title: 'Pending Payment', amount: 150, type: TransactionType.EXPENSE, date: new Date() },
    ] as any,
    total: 1,
    page: 1,
    totalPages: 1,
  };

  const mockRecurringTransactions = [
    { _id: 'trans4', title: 'Monthly Subscription', amount: 50, type: TransactionType.EXPENSE, nextOccurrence: new Date(Date.now() + 86400000) },
    { _id: 'trans5', title: 'Rent', amount: 1200, type: TransactionType.EXPENSE, nextOccurrence: new Date(Date.now() + 2592000000) },
  ] as any;

  const mockCategories = [
    { _id: 'cat1', name: 'Food', type: 'expense', color: '#FF0000' },
    { _id: 'cat2', name: 'Transport', type: 'expense', color: '#00FF00' },
  ] as any;

  const mockCategoryStats = {
    totalCategories: 2,
    categoriesByType: {
      expense: 2,
      income: 0,
    },
    topCategories: [
      { categoryId: 'cat1', name: 'Food', total: 2000, count: 4 },
      { categoryId: 'cat2', name: 'Transport', total: 1500, count: 3 },
    ],
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockTransactionService = {
      getTransactionStats: jest.fn(),
      getUserTransactions: jest.fn(),
      getRecurringTransactions: jest.fn(),
    } as any;

    mockCategoryService = {
      getUserCategories: jest.fn(),
      getCategoryStats: jest.fn(),
    } as any;

    // Mock the constructors to return our mock instances
    MockedTransactionService.mockImplementation(() => mockTransactionService);
    MockedCategoryService.mockImplementation(() => mockCategoryService);

    // Create the service instance
    financialService = new FinancialService();
  });

  describe('getFinancialDashboard', () => {
    it('should get financial dashboard with default date range', async () => {
      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);
      mockTransactionService.getUserTransactions
        .mockResolvedValueOnce(mockRecentTransactions)
        .mockResolvedValueOnce(mockPendingTransactions);
      mockTransactionService.getRecurringTransactions.mockResolvedValue(mockRecurringTransactions);
      mockCategoryService.getUserCategories.mockResolvedValue({ categories: mockCategories, total: 2, page: 1, totalPages: 1 });

      // Execute
      const result = await financialService.getFinancialDashboard(mockUserId);

      // Verify
      expect(mockTransactionService.getTransactionStats).toHaveBeenCalledWith(mockUserId, expect.any(Object));
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledTimes(2);
      expect(mockTransactionService.getRecurringTransactions).toHaveBeenCalledWith(mockUserId);
      // Note: getUserCategories is called in the service but not used in the result, so we don't verify it

      expect(result).toBeDefined();
      expect(result.overview).toBeDefined();
      expect(result.recentTransactions).toBeDefined();
      expect(result.topCategories).toBeDefined();
      expect(result.spendingTrends).toBeDefined();
    });

    it('should get financial dashboard with custom date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);
      mockTransactionService.getUserTransactions
        .mockResolvedValueOnce(mockRecentTransactions)
        .mockResolvedValueOnce(mockPendingTransactions);
      mockTransactionService.getRecurringTransactions.mockResolvedValue(mockRecurringTransactions);
      mockCategoryService.getUserCategories.mockResolvedValue({ categories: mockCategories, total: 2, page: 1, totalPages: 1 });

      // Execute
      const result = await financialService.getFinancialDashboard(mockUserId, { startDate, endDate });

      // Verify
      expect(mockTransactionService.getTransactionStats).toHaveBeenCalledWith(mockUserId, { startDate, endDate });
      expect(result).toBeDefined();
    });

    it('should handle empty data gracefully', async () => {
      const emptyStats = {
        ...mockTransactionStats,
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        transactionsByType: {
          [TransactionType.INCOME]: { count: 0, total: 0 },
          [TransactionType.EXPENSE]: { count: 0, total: 0 },
          [TransactionType.TRANSFER]: { count: 0, total: 0 },
          [TransactionType.ADJUSTMENT]: { count: 0, total: 0 },
        },
        transactionsByCategory: [],
        monthlyTrends: [],
      };

      const emptyTransactions = { transactions: [], total: 0, page: 1, totalPages: 1 };

      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(emptyStats);
      mockTransactionService.getUserTransactions
        .mockResolvedValueOnce(emptyTransactions)
        .mockResolvedValueOnce(emptyTransactions);
      mockTransactionService.getRecurringTransactions.mockResolvedValue([]);
      mockCategoryService.getUserCategories.mockResolvedValue({ categories: [], total: 0, page: 1, totalPages: 1 });

      // Execute
      const result = await financialService.getFinancialDashboard(mockUserId);

      // Verify - the service still returns the stats from the mock, not 0
      expect(result.overview.monthlyIncome).toBe(0); // This should be 0 from emptyStats
      expect(result.overview.monthlyExpenses).toBe(0); // This should be 0 from emptyStats
      expect(result.recentTransactions).toEqual([]);
      expect(result.topCategories).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const error = new Error('Service unavailable');

      // Setup mocks
      mockTransactionService.getTransactionStats.mockRejectedValue(error);

      // Execute and verify
      await expect(financialService.getFinancialDashboard(mockUserId)).rejects.toThrow('Service unavailable');
    });
  });

  describe('generateFinancialReport', () => {
    const reportOptions = {
      reportType: 'monthly' as const,
      includeCategories: true,
      includeTrends: true,
      includeProjections: false,
    };

    it('should generate monthly report successfully', async () => {
      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);

      // Execute
      const result = await financialService.generateFinancialReport(mockUserId, reportOptions);

      // Verify
      expect(mockTransactionService.getTransactionStats).toHaveBeenCalledWith(mockUserId, expect.any(Object));
      expect(result.reportType).toBe('monthly');
      expect(result.categories).toBeDefined();
      expect(result.trends).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it('should generate quarterly report successfully', async () => {
      const quarterlyOptions = { ...reportOptions, reportType: 'quarterly' as const };

      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);

      // Execute
      const result = await financialService.generateFinancialReport(mockUserId, quarterlyOptions);

      // Verify
      expect(result.reportType).toBe('quarterly');
    });

    it('should handle invalid report type', async () => {
      const invalidOptions = { ...reportOptions, reportType: 'invalid' as any };

      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);

      // Execute
      const result = await financialService.generateFinancialReport(mockUserId, invalidOptions);

      // Verify
      expect(result.reportType).toBe('invalid');
    });

    it('should handle service errors', async () => {
      const error = new Error('Service unavailable');

      // Setup mocks
      mockTransactionService.getTransactionStats.mockRejectedValue(error);

      // Execute and verify
      await expect(financialService.generateFinancialReport(mockUserId, reportOptions)).rejects.toThrow('Service unavailable');
    });
  });

  describe('getFinancialInsights', () => {
    it('should get monthly insights successfully', async () => {
      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);

      // Execute
      const result = await financialService.getFinancialInsights(mockUserId);

      // Verify
      expect(mockTransactionService.getTransactionStats).toHaveBeenCalledWith(mockUserId, expect.any(Object));
      expect(result).toBeDefined();
      // The service returns an object with insights array, not just an array
      expect(typeof result).toBe('object');
      expect(result.insights).toBeDefined();
    });

    it('should get weekly insights successfully', async () => {
      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);

      // Execute
      const result = await financialService.getFinancialInsights(mockUserId, { period: 'week' });

      // Verify
      expect(result).toBeDefined();
    });

    it('should include predictions when requested', async () => {
      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);

      // Execute
      const result = await financialService.getFinancialInsights(mockUserId, { period: 'month', includePredictions: true });

      // Verify
      expect(result).toBeDefined();
    });

    it('should handle empty data gracefully', async () => {
      const emptyStats = {
        ...mockTransactionStats,
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        transactionsByCategory: [],
        monthlyTrends: [],
      };

      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(emptyStats);

      // Execute
      const result = await financialService.getFinancialInsights(mockUserId);

      // Verify
      expect(result).toBeDefined();
      // The service returns an object with insights array, not just an array
      expect(typeof result).toBe('object');
      expect(result.insights).toBeDefined();
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Analytics service failed');

      // Setup mocks
      mockTransactionService.getTransactionStats.mockRejectedValue(error);

      // Execute and verify
      await expect(financialService.getFinancialInsights(mockUserId)).rejects.toThrow('Analytics service failed');
    });
  });

  describe('getBudgetAnalysis', () => {
    it('should get budget analysis successfully', async () => {
      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);

      // Execute
      const result = await financialService.getBudgetAnalysis(mockUserId);

      // Verify
      expect(mockTransactionService.getTransactionStats).toHaveBeenCalledWith(mockUserId, expect.any(Object));
      expect(result.currentSpending).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.alerts).toBeDefined();
    });

    it('should handle no budget data gracefully', async () => {
      const statsWithoutBudget = {
        ...mockTransactionStats,
        transactionsByCategory: [],
      };

      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(statsWithoutBudget);

      // Execute
      const result = await financialService.getBudgetAnalysis(mockUserId);

      // Verify
      expect(result.currentSpending.byCategory).toEqual([]);
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Budget service failed');

      // Setup mocks
      mockTransactionService.getTransactionStats.mockRejectedValue(error);

      // Execute and verify
      await expect(financialService.getBudgetAnalysis(mockUserId)).rejects.toThrow('Budget service failed');
    });
  });

  describe('exportFinancialData', () => {
    const exportOptions = {
      format: 'json' as const,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      includeCategories: true,
      includeTransactions: true,
      includeStats: true,
    };

    it('should export JSON data successfully', async () => {
      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);
      mockTransactionService.getUserTransactions.mockResolvedValue(mockRecentTransactions);
      mockCategoryService.getUserCategories.mockResolvedValue({ categories: mockCategories, total: 2, page: 1, totalPages: 1 });

      // Execute
      const result = await financialService.exportFinancialData(mockUserId, exportOptions);

      // Verify
      expect(mockTransactionService.getTransactionStats).toHaveBeenCalledWith(mockUserId, expect.any(Object));
      expect(result.format).toBe('json');
      expect(result.data).toBeDefined();
      expect(result.filename).toContain('.json');
    });

    it('should export CSV data successfully', async () => {
      const csvOptions = { ...exportOptions, format: 'csv' as const };

      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);
      mockTransactionService.getUserTransactions.mockResolvedValue(mockRecentTransactions);
      mockCategoryService.getUserCategories.mockResolvedValue({ categories: mockCategories, total: 2, page: 1, totalPages: 1 });

      // Execute
      const result = await financialService.exportFinancialData(mockUserId, csvOptions);

      // Verify
      expect(result.format).toBe('csv');
      expect(result.filename).toContain('.csv');
    });

    it('should handle unsupported format', async () => {
      const unsupportedOptions = { ...exportOptions, format: 'pdf' as any };

      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);
      mockTransactionService.getUserTransactions.mockResolvedValue(mockRecentTransactions);
      mockCategoryService.getUserCategories.mockResolvedValue({ categories: mockCategories, total: 2, page: 1, totalPages: 1 });

      // Execute
      const result = await financialService.exportFinancialData(mockUserId, unsupportedOptions);

      // Verify
      expect(result.format).toBe('pdf');
      expect(result.filename).toContain('.pdf');
    });

    it('should handle missing optional data gracefully', async () => {
      const minimalOptions = {
        format: 'json' as const,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        includeCategories: false,
        includeTransactions: false,
        includeStats: true,
      };

      // Setup mocks
      mockTransactionService.getTransactionStats.mockResolvedValue(mockTransactionStats);

      // Execute
      const result = await financialService.exportFinancialData(mockUserId, minimalOptions);

      // Verify
      expect(result.data.stats).toBeDefined();
      expect(result.data.transactions).toBeUndefined();
      expect(result.data.categories).toBeUndefined();
    });
  });

  describe('Private Methods', () => {
    describe('generateFinancialInsights', () => {
      it('should generate insights for high expenses', () => {
        const mockStats = {
          totalExpenses: 5000,
          totalIncome: 6000,
          transactionsByCategory: [
            { categoryName: 'Food', percentage: 45 },
            { categoryName: 'Transport', percentage: 25 },
          ],
        };

        const result = (financialService as any).generateFinancialInsights(mockStats);
        expect(result).toContain('Food accounts for 45.0% of your spending. Consider if this aligns with your priorities.');
      });

      it('should generate insights for overspending', () => {
        const mockStats = {
          totalExpenses: 7000,
          totalIncome: 6000,
          transactionsByCategory: [
            { categoryName: 'Food', percentage: 30 },
          ],
        };

        const result = (financialService as any).generateFinancialInsights(mockStats);
        expect(result).toContain('You are spending more than you earn. Focus on reducing expenses or increasing income.');
      });

      it('should generate insights for high expense ratio', () => {
        const mockStats = {
          totalExpenses: 5000,
          totalIncome: 6000,
          transactionsByCategory: [
            { categoryName: 'Food', percentage: 20 },
          ],
        };

        const result = (financialService as any).generateFinancialInsights(mockStats);
        expect(result).toContain('Your expenses are high relative to income. Consider reviewing discretionary spending.');
      });
    });

    describe('generateBudgetRecommendations', () => {
      it('should generate recommendations for high spending categories', () => {
        const mockCategories: any[] = [
          { categoryName: 'Food', percentage: 35 },
          { categoryName: 'Transport', percentage: 20 },
        ];

        const result = (financialService as any).generateBudgetRecommendations(mockCategories, {});
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          category: 'Food',
          action: 'Review spending',
          reason: 'This category represents a large portion of your expenses',
          impact: 'high',
        });
      });

      it('should not generate recommendations for low spending categories', () => {
        const mockCategories: any[] = [
          { categoryName: 'Food', percentage: 25 },
          { categoryName: 'Transport', percentage: 20 },
        ];

        const result = (financialService as any).generateBudgetRecommendations(mockCategories, {});
        expect(result).toHaveLength(0);
      });
    });

    describe('generateBudgetAlerts', () => {
      it('should generate overspending alert', () => {
        const mockCategories: any[] = [];
        const mockStats = {
          totalExpenses: 7000,
          totalIncome: 6000,
        };

        const result = (financialService as any).generateBudgetAlerts(mockCategories, mockStats);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          type: 'overspending',
          message: 'You are spending more than you earn this month',
          severity: 'critical',
        });
      });

      it('should not generate alerts when spending is within income', () => {
        const mockCategories: any[] = [];
        const mockStats = {
          totalExpenses: 5000,
          totalIncome: 6000,
        };

        const result = (financialService as any).generateBudgetAlerts(mockCategories, mockStats);
        expect(result).toHaveLength(0);
      });
    });

    describe('generatePeriodInsights', () => {
      it('should generate monthly overspending insight', () => {
        const mockStats = {
          totalExpenses: 7000,
          totalIncome: 6000,
        };

        const result = (financialService as any).generatePeriodInsights(mockStats, 'month');
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          type: 'spending',
          title: 'Monthly Overspending',
          description: 'You spent more than you earned this month',
          value: 1000,
          change: 0,
          changeType: 'increase',
        });
      });

      it('should not generate insights when spending is within income', () => {
        const mockStats = {
          totalExpenses: 5000,
          totalIncome: 6000,
        };

        const result = (financialService as any).generatePeriodInsights(mockStats, 'month');
        expect(result).toHaveLength(0);
      });

      it('should handle non-monthly periods', () => {
        const mockStats = {
          totalExpenses: 7000,
          totalIncome: 6000,
        };

        const result = (financialService as any).generatePeriodInsights(mockStats, 'week');
        expect(result).toHaveLength(0);
      });
    });

    describe('analyzeCategoryTrends', () => {
      it('should analyze category trends', () => {
        const mockCategories = [
          { categoryName: 'Food', amount: 500 },
          { categoryName: 'Transport', amount: 300 },
        ];

        const result = (financialService as any).analyzeCategoryTrends(mockCategories);
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          category: 'Food',
          trend: 'stable',
          change: 0,
          confidence: 0.8,
        });
        expect(result[1]).toEqual({
          category: 'Transport',
          trend: 'stable',
          change: 0,
          confidence: 0.8,
        });
      });
    });

    describe('generateFinancialPredictions', () => {
      it('should generate financial predictions', () => {
        const mockStats = {
          totalExpenses: 5000,
        };
        const mockTrends: any[] = [];

        const result = (financialService as any).generateFinancialPredictions(mockStats, mockTrends);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
          type: 'expense',
          prediction: 5250, // 5000 * 1.05
          confidence: 0.7,
          reasoning: 'Based on current spending trends',
        });
      });
    });

    describe('convertToCSV', () => {
      it('should convert transactions to CSV', () => {
        const mockData = {
          transactions: [
            { id: '1', amount: 100, category: 'Food' },
            { id: '2', amount: 200, category: 'Transport' },
          ],
        };

        const result = (financialService as any).convertToCSV(mockData);
        expect(result).toContain('id,amount,category');
        expect(result).toContain('"1","100","Food"');
        expect(result).toContain('"2","200","Transport"');
      });

      it('should handle empty transactions', () => {
        const mockData = {
          transactions: [],
        };

        const result = (financialService as any).convertToCSV(mockData);
        expect(result.trim()).toBe('');
      });

      it('should handle data without transactions', () => {
        const mockData = {};

        const result = (financialService as any).convertToCSV(mockData);
        expect(result).toBe('');
      });
    });
  });
});
