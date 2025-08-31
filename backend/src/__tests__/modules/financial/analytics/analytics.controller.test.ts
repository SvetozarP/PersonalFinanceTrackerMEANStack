import { AnalyticsController } from '../../../../modules/financial/analytics/controllers/analytics.controller';
import { AnalyticsService } from '../../../../modules/financial/analytics/services/analytics.service';
import { Request, Response } from 'express';

// Mock the analytics service
jest.mock('../../../../modules/financial/analytics/services/analytics.service');

const MockedAnalyticsService = jest.mocked(AnalyticsService);

// Extend the Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

describe('AnalyticsController', () => {
  let analyticsController: AnalyticsController;
  let mockAnalyticsService: jest.Mocked<AnalyticsService>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  const mockUserId = 'user123';
  const mockBudgetId = 'budget123';
  const mockStartDate = '2024-01-01';
  const mockEndDate = '2024-01-31';

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
      }
    ],
    spendingByDay: [],
    spendingByMonth: [],
    topSpendingDays: []
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

  const mockFinancialInsights = {
    spendingPatterns: {
      mostExpensiveDay: '2024-01-15',
      mostExpensiveMonth: '2024-01',
      leastExpensiveDay: '2024-01-01',
      leastExpensiveMonth: '2024-01',
      averageTransactionAmount: 1500,
      largestTransaction: 2000,
      smallestTransaction: 500
    },
    categoryInsights: {
      highestSpendingCategory: 'Food',
      lowestSpendingCategory: 'Transport',
      mostFrequentCategory: 'Food',
      categoryGrowthRates: []
    },
    timeInsights: {
      peakSpendingTime: '15:00',
      peakSpendingDay: 'Monday',
      seasonalPatterns: []
    },
    recommendations: [
      {
        type: 'spending',
        priority: 'high',
        message: 'Your spending is very high relative to your income.',
        action: 'Review and adjust your monthly budget',
        potentialSavings: 300
      }
    ]
  };

  const mockCashFlowAnalysis = {
    period: 'monthly',
    openingBalance: 0,
    closingBalance: 2000,
    totalInflows: 5000,
    totalOutflows: 3000,
    netCashFlow: 2000,
    cashFlowByType: [],
    cashFlowByCategory: [],
    cashFlowByPeriod: [],
    projections: []
  };

  const mockPeriodComparison = {
    currentPeriod: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      data: mockSpendingAnalysis
    },
    previousPeriod: {
      startDate: new Date('2023-12-01'),
      endDate: new Date('2023-12-31'),
      data: mockSpendingAnalysis
    },
    changes: {
      totalSpent: { amount: 0, percentage: 0, trend: 'no-change' },
      totalIncome: { amount: 0, percentage: 0, trend: 'no-change' },
      netAmount: { amount: 0, percentage: 0, trend: 'no-change' },
      categoryChanges: []
    },
    insights: []
  };

  const mockCategoryPerformance = [
    {
      categoryId: 'cat1',
      categoryName: 'Food',
      amount: 1500,
      percentage: 50,
      averageAmount: 1500,
      transactionCount: 10,
      categoryColor: '#FF6B6B',
      categoryIcon: 'food',
      performance: 'normal'
    }
  ];

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock service
    mockAnalyticsService = {
      getSpendingAnalysis: jest.fn().mockResolvedValue(mockSpendingAnalysis),
      getBudgetAnalytics: jest.fn().mockResolvedValue(mockBudgetAnalytics),
      getAllBudgetAnalytics: jest.fn().mockResolvedValue([mockBudgetAnalytics]),
      getFinancialInsights: jest.fn().mockResolvedValue(mockFinancialInsights),
      getCashFlowAnalysis: jest.fn().mockResolvedValue(mockCashFlowAnalysis),
      getPeriodComparison: jest.fn().mockResolvedValue(mockPeriodComparison),
      getCategoryPerformance: jest.fn().mockResolvedValue(mockCategoryPerformance)
    } as any;

    // Mock the constructor
    MockedAnalyticsService.mockImplementation(() => mockAnalyticsService);

    // Create controller instance
    analyticsController = new AnalyticsController();

    // Setup mock request and response
    mockRequest = {
      user: { userId: mockUserId },
      query: {},
      params: {},
      body: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('getSpendingAnalysis', () => {
    it('should get spending analysis successfully', async () => {
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate,
        groupBy: 'month'
      };

      await analyticsController.getSpendingAnalysis(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getSpendingAnalysis).toHaveBeenCalledWith({
        userId: mockUserId,
        startDate: new Date(mockStartDate),
        endDate: new Date(mockEndDate),
        groupBy: 'month',
        includeRecurring: true,
        includePending: true
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockSpendingAnalysis
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getSpendingAnalysis(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });

    it('should return 400 when query validation fails', async () => {
      mockRequest.query = {
        startDate: 'invalid-date',
        endDate: mockEndDate
      };

      await analyticsController.getSpendingAnalysis(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid query parameters',
        errors: expect.any(Array)
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockAnalyticsService.getSpendingAnalysis.mockRejectedValue(error);

      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getSpendingAnalysis(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('getBudgetAnalytics', () => {
    it('should get budget analytics successfully', async () => {
      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getBudgetAnalytics(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetAnalytics).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBudgetAnalytics
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getBudgetAnalytics(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });

    it('should return 400 when budget ID is missing', async () => {
      mockRequest.params = {};

      await analyticsController.getBudgetAnalytics(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Budget ID is required'
      });
    });

    it('should use default date range when dates are not provided', async () => {
      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {};

      await analyticsController.getBudgetAnalytics(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetAnalytics).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        expect.any(Date),
        expect.any(Date)
      );
    });
  });

  describe('getAllBudgetAnalytics', () => {
    it('should get all budget analytics successfully', async () => {
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getAllBudgetAnalytics(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getAllBudgetAnalytics).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [mockBudgetAnalytics]
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getAllBudgetAnalytics(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });
  });

  describe('getFinancialInsights', () => {
    it('should get financial insights successfully', async () => {
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getFinancialInsights(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getFinancialInsights).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockFinancialInsights
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getFinancialInsights(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });
  });

  describe('getCashFlowAnalysis', () => {
    it('should get cash flow analysis successfully', async () => {
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate,
        groupBy: 'month'
      };

      await analyticsController.getCashFlowAnalysis(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getCashFlowAnalysis).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Date),
        expect.any(Date),
        'month'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCashFlowAnalysis
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getCashFlowAnalysis(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });
  });

  describe('getPeriodComparison', () => {
    it('should get period comparison successfully', async () => {
      mockRequest.body = {
        currentStart: '2024-01-01',
        currentEnd: '2024-01-31',
        previousStart: '2023-12-01',
        previousEnd: '2023-12-31'
      };

      await analyticsController.getPeriodComparison(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getPeriodComparison).toHaveBeenCalledWith(
        mockUserId,
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        new Date('2023-12-01'),
        new Date('2023-12-31')
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockPeriodComparison
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getPeriodComparison(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });

    it('should return 400 when required date parameters are missing', async () => {
      mockRequest.body = {
        currentStart: '2024-01-01',
        currentEnd: '2024-01-31'
        // Missing previousStart and previousEnd
      };

      await analyticsController.getPeriodComparison(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'All date parameters are required: currentStart, currentEnd, previousStart, previousEnd'
      });
    });
  });

  describe('getCategoryPerformance', () => {
    it('should get category performance successfully', async () => {
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getCategoryPerformance(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getCategoryPerformance).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCategoryPerformance
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getCategoryPerformance(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });
  });
});
