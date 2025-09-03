/**
 * @jest-environment node
 */

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

describe('AnalyticsController - Budget Reporting Endpoints', () => {
  let analyticsController: AnalyticsController;
  let mockAnalyticsService: jest.Mocked<AnalyticsService>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  const mockUserId = 'user123';
  const mockBudgetId = 'budget123';
  const mockStartDate = '2024-01-01';
  const mockEndDate = '2024-01-31';

  const mockBudgetPerformanceReport = {
    budgetId: mockBudgetId,
    budgetName: 'Monthly Budget',
    period: {
      startDate: new Date(mockStartDate),
      endDate: new Date(mockEndDate)
    },
    performance: {
      totalAllocated: 4000,
      totalSpent: 3000,
      remainingAmount: 1000,
      utilizationPercentage: 75,
      varianceAmount: -1000,
      variancePercentage: -25,
      status: 'under' as const
    },
    categoryPerformance: [
      {
        categoryId: 'cat1',
        categoryName: 'Food',
        allocatedAmount: 2000,
        spentAmount: 1500,
        remainingAmount: 500,
        utilizationPercentage: 75,
        varianceAmount: -500,
        variancePercentage: -25,
        status: 'under' as const,
        topTransactions: [
          {
            id: 'txn1',
            amount: 100,
            date: new Date('2024-01-15'),
            description: 'Grocery shopping'
          }
        ]
      }
    ],
    trends: {
      dailySpending: [
        {
          date: '2024-01-15',
          allocatedAmount: 100,
          spentAmount: 80,
          cumulativeSpent: 1500,
          remainingAmount: 500
        }
      ],
      weeklyTrends: [
        {
          week: '2024-W03',
          allocatedAmount: 1000,
          spentAmount: 750,
          varianceAmount: -250,
          variancePercentage: -25
        }
      ]
    },
    insights: [
      {
        type: 'performance' as const,
        priority: 'medium' as const,
        message: 'Budget is under by 25% - consider reallocating funds',
        data: { varianceAmount: -1000, variancePercentage: -25 }
      }
    ]
  };

  const mockBudgetVsActualReport = {
    budgetId: mockBudgetId,
    budgetName: 'Monthly Budget',
    period: {
      startDate: new Date(mockStartDate),
      endDate: new Date(mockEndDate)
    },
    summary: {
      totalBudgeted: 4000,
      totalActual: 3000,
      variance: -1000,
      variancePercentage: -25,
      status: 'under' as const
    },
    categoryComparison: [
      {
        categoryId: 'cat1',
        categoryName: 'Food',
        budgetedAmount: 2000,
        actualAmount: 1500,
        variance: -500,
        variancePercentage: -25,
        status: 'under' as const,
        efficiency: 0.75
      }
    ],
    monthlyBreakdown: [
      {
        month: '2024-01',
        budgetedAmount: 4000,
        actualAmount: 3000,
        variance: -1000,
        variancePercentage: -25,
        cumulativeVariance: -1000
      }
    ],
    topVariances: [
      {
        categoryId: 'cat1',
        categoryName: 'Food',
        variance: -500,
        variancePercentage: -25,
        type: 'under' as const
      }
    ],
    recommendations: [
      {
        type: 'budget_adjustment' as const,
        priority: 'medium' as const,
        message: 'Consider reallocating unused budget to other categories',
        potentialSavings: 1000,
        suggestedAction: 'Review category allocations'
      }
    ]
  };

  const mockBudgetTrendAnalysis = {
    budgetId: mockBudgetId,
    budgetName: 'Monthly Budget',
    analysisPeriod: {
      startDate: new Date(mockStartDate),
      endDate: new Date(mockEndDate)
    },
    trends: {
      utilizationTrend: [
        {
          period: '2024-01',
          utilizationPercentage: 75,
          trend: 'stable' as const
        }
      ],
      spendingVelocity: [
        {
          period: '2024-01',
          dailyAverageSpending: 100,
          projectedEndOfPeriodSpending: 3100,
          confidence: 'high' as const
        }
      ],
      categoryTrends: [
        {
          categoryId: 'cat1',
          categoryName: 'Food',
          trend: [
            {
              period: '2024-01',
              utilizationPercentage: 75,
              trend: 'stable' as const
            }
          ]
        }
      ]
    },
    projections: {
      endOfPeriodProjection: {
        projectedSpending: 3100,
        projectedVariance: -900,
        confidence: 'high' as const,
        basedOnTrend: 'last_week' as const
      },
      categoryProjections: [
        {
          categoryId: 'cat1',
          categoryName: 'Food',
          projectedSpending: 1550,
          projectedVariance: -450,
          confidence: 'high' as const
        }
      ]
    },
    insights: [
      {
        type: 'trend' as const,
        priority: 'low' as const,
        message: 'Spending trends are stable and predictable',
        data: { trend: 'stable' }
      }
    ]
  };

  const mockBudgetVarianceAnalysis = {
    budgetId: mockBudgetId,
    budgetName: 'Monthly Budget',
    period: {
      startDate: new Date(mockStartDate),
      endDate: new Date(mockEndDate)
    },
    varianceSummary: {
      totalVariance: -1000,
      totalVariancePercentage: -25,
      favorableVariances: 1000,
      unfavorableVariances: 0,
      netVariance: -1000
    },
    categoryVariances: [
      {
        categoryId: 'cat1',
        categoryName: 'Food',
        budgetedAmount: 2000,
        actualAmount: 1500,
        variance: -500,
        variancePercentage: -25,
        varianceType: 'favorable' as const,
        impact: 'medium' as const,
        rootCause: 'Lower than expected spending in this category'
      }
    ],
    varianceDrivers: [
      {
        categoryId: 'cat1',
        categoryName: 'Food',
        varianceContribution: -500,
        varianceContributionPercentage: 50,
        type: 'positive' as const
      }
    ],
    varianceTrends: [
      {
        period: '2024-01',
        totalVariance: -1000,
        favorableVariances: 1000,
        unfavorableVariances: 0,
        netVariance: -1000
      }
    ],
    recommendations: [
      {
        type: 'budget_revision' as const,
        priority: 'medium' as const,
        message: 'Consider revising budget allocations based on actual spending patterns',
        expectedImpact: 1000,
        actionRequired: 'Review and adjust category allocations'
      }
    ]
  };

  const mockBudgetForecast = {
    budgetId: mockBudgetId,
    budgetName: 'Monthly Budget',
    forecastPeriod: {
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-29')
    },
    forecast: {
      projectedSpending: 3200,
      projectedVariance: -800,
      confidence: 'high' as const,
      methodology: 'historical' as const
    },
    categoryForecasts: [
      {
        categoryId: 'cat1',
        categoryName: 'Food',
        projectedSpending: 1600,
        projectedVariance: -400,
        confidence: 'high' as const,
        factors: [
          {
            factor: 'Historical spending pattern',
            impact: 0.8,
            weight: 0.7
          }
        ]
      }
    ],
    scenarios: [
      {
        scenario: 'optimistic' as const,
        projectedSpending: 2560,
        projectedVariance: -1440,
        probability: 0.2,
        keyAssumptions: ['Reduced discretionary spending', 'No unexpected expenses']
      },
      {
        scenario: 'realistic' as const,
        projectedSpending: 3200,
        projectedVariance: -800,
        probability: 0.6,
        keyAssumptions: ['Current spending patterns continue', 'Normal seasonal variations']
      },
      {
        scenario: 'pessimistic' as const,
        projectedSpending: 3840,
        projectedVariance: -160,
        probability: 0.2,
        keyAssumptions: ['Increased discretionary spending', 'Unexpected expenses occur']
      }
    ],
    riskFactors: [
      {
        factor: 'Seasonal spending variations',
        impact: 'medium' as const,
        probability: 'high' as const,
        description: 'Historical data shows seasonal patterns in spending',
        mitigation: 'Adjust forecasts based on seasonal factors'
      }
    ],
    recommendations: [
      {
        type: 'spending_control' as const,
        priority: 'low' as const,
        message: 'Current spending patterns are within acceptable limits',
        expectedOutcome: 'Maintain current spending levels',
        actionRequired: 'Continue monitoring spending patterns'
      }
    ]
  };

  const mockBudgetCategoryBreakdown = {
    budgetId: mockBudgetId,
    budgetName: 'Monthly Budget',
    period: {
      startDate: new Date(mockStartDate),
      endDate: new Date(mockEndDate)
    },
    categoryBreakdown: [
      {
        categoryId: 'cat1',
        categoryName: 'Food',
        categoryPath: 'Food',
        allocatedAmount: 2000,
        spentAmount: 1500,
        remainingAmount: 500,
        utilizationPercentage: 75,
        transactionCount: 15,
        averageTransactionAmount: 100,
        largestTransaction: 300,
        smallestTransaction: 25,
        status: 'under' as const
      }
    ],
    spendingPatterns: {
      topSpendingCategories: [
        {
          categoryId: 'cat1',
          categoryName: 'Food',
          amount: 1500,
          percentage: 50
        }
      ],
      mostActiveCategories: [
        {
          categoryId: 'cat1',
          categoryName: 'Food',
          transactionCount: 15,
          averageAmount: 100
        }
      ],
      categoryEfficiency: [
        {
          categoryId: 'cat1',
          categoryName: 'Food',
          efficiency: 0.75,
          status: 'efficient' as const
        }
      ]
    },
    insights: [
      {
        type: 'allocation' as const,
        priority: 'medium' as const,
        message: 'Food category is under-utilized by 25%',
        data: { utilizationPercentage: 75 }
      }
    ]
  };

  const mockBudgetAlerts = [
    {
      id: 'alert-123',
      budgetId: mockBudgetId,
      budgetName: 'Monthly Budget',
      type: 'threshold' as const,
      severity: 'warning' as const,
      message: 'Budget utilization is at 90%',
      triggeredAt: new Date('2024-01-25'),
      data: {
        currentValue: 90,
        threshold: 90,
        variance: 0,
        variancePercentage: 0
      },
      actions: [],
      resolved: false
    }
  ];

  const mockExportResult = {
    data: JSON.stringify(mockBudgetPerformanceReport, null, 2),
    format: 'application/json',
    filename: 'budget-report-performance-2024-01-01.json'
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock service
    mockAnalyticsService = {
      getBudgetPerformanceReport: jest.fn().mockResolvedValue(mockBudgetPerformanceReport),
      getBudgetVsActualReport: jest.fn().mockResolvedValue(mockBudgetVsActualReport),
      getBudgetTrendAnalysis: jest.fn().mockResolvedValue(mockBudgetTrendAnalysis),
      getBudgetVarianceAnalysis: jest.fn().mockResolvedValue(mockBudgetVarianceAnalysis),
      getBudgetForecast: jest.fn().mockResolvedValue(mockBudgetForecast),
      getBudgetCategoryBreakdown: jest.fn().mockResolvedValue(mockBudgetCategoryBreakdown),
      getBudgetAlerts: jest.fn().mockResolvedValue(mockBudgetAlerts),
      exportBudgetReport: jest.fn().mockResolvedValue(mockExportResult)
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
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('getBudgetPerformanceReport', () => {
    it('should get budget performance report successfully', async () => {
      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getBudgetPerformanceReport(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetPerformanceReport).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBudgetPerformanceReport
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getBudgetPerformanceReport(
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

      await analyticsController.getBudgetPerformanceReport(
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

      await analyticsController.getBudgetPerformanceReport(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetPerformanceReport).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockAnalyticsService.getBudgetPerformanceReport.mockRejectedValue(error);

      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getBudgetPerformanceReport(
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

  describe('getBudgetVsActualReport', () => {
    it('should get budget vs actual report successfully', async () => {
      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getBudgetVsActualReport(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetVsActualReport).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBudgetVsActualReport
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getBudgetVsActualReport(
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

      await analyticsController.getBudgetVsActualReport(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Budget ID is required'
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockAnalyticsService.getBudgetVsActualReport.mockRejectedValue(error);

      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getBudgetVsActualReport(
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

  describe('getBudgetTrendAnalysis', () => {
    it('should get budget trend analysis successfully', async () => {
      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getBudgetTrendAnalysis(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetTrendAnalysis).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBudgetTrendAnalysis
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getBudgetTrendAnalysis(
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

      await analyticsController.getBudgetTrendAnalysis(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Budget ID is required'
      });
    });

    it('should use default date range (last 6 months) when dates are not provided', async () => {
      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {};

      await analyticsController.getBudgetTrendAnalysis(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetTrendAnalysis).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockAnalyticsService.getBudgetTrendAnalysis.mockRejectedValue(error);

      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getBudgetTrendAnalysis(
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

  describe('getBudgetVarianceAnalysis', () => {
    it('should get budget variance analysis successfully', async () => {
      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getBudgetVarianceAnalysis(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetVarianceAnalysis).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBudgetVarianceAnalysis
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getBudgetVarianceAnalysis(
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

      await analyticsController.getBudgetVarianceAnalysis(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Budget ID is required'
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockAnalyticsService.getBudgetVarianceAnalysis.mockRejectedValue(error);

      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getBudgetVarianceAnalysis(
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

  describe('getBudgetForecast', () => {
    it('should get budget forecast successfully', async () => {
      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        forecastStartDate: '2024-02-01',
        forecastEndDate: '2024-02-29'
      };

      await analyticsController.getBudgetForecast(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetForecast).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBudgetForecast
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getBudgetForecast(
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

      await analyticsController.getBudgetForecast(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Budget ID is required'
      });
    });

    it('should use default forecast period (next month) when dates are not provided', async () => {
      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {};

      await analyticsController.getBudgetForecast(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetForecast).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockAnalyticsService.getBudgetForecast.mockRejectedValue(error);

      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        forecastStartDate: '2024-02-01',
        forecastEndDate: '2024-02-29'
      };

      await analyticsController.getBudgetForecast(
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

  describe('getBudgetCategoryBreakdown', () => {
    it('should get budget category breakdown successfully', async () => {
      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getBudgetCategoryBreakdown(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetCategoryBreakdown).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId,
        expect.any(Date),
        expect.any(Date)
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBudgetCategoryBreakdown
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getBudgetCategoryBreakdown(
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

      await analyticsController.getBudgetCategoryBreakdown(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Budget ID is required'
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockAnalyticsService.getBudgetCategoryBreakdown.mockRejectedValue(error);

      mockRequest.params = { budgetId: mockBudgetId };
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.getBudgetCategoryBreakdown(
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

  describe('getBudgetAlerts', () => {
    it('should get budget alerts successfully', async () => {
      mockRequest.query = {};

      await analyticsController.getBudgetAlerts(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetAlerts).toHaveBeenCalledWith(
        mockUserId,
        undefined
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBudgetAlerts
      });
    });

    it('should get budget alerts for specific budget', async () => {
      mockRequest.query = { budgetId: mockBudgetId };

      await analyticsController.getBudgetAlerts(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.getBudgetAlerts).toHaveBeenCalledWith(
        mockUserId,
        mockBudgetId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBudgetAlerts
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.getBudgetAlerts(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockAnalyticsService.getBudgetAlerts.mockRejectedValue(error);

      mockRequest.query = {};

      await analyticsController.getBudgetAlerts(
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

  describe('exportBudgetReport', () => {
    it('should export budget report successfully', async () => {
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate,
        format: 'json',
        reportType: 'performance',
        includeCharts: 'false',
        includeDetails: 'true',
        budgetIds: mockBudgetId,
        categories: 'cat1,cat2'
      };

      await analyticsController.exportBudgetReport(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.exportBudgetReport).toHaveBeenCalledWith(
        mockUserId,
        {
          format: 'json',
          reportType: 'performance',
          includeCharts: false,
          includeDetails: true,
          dateRange: {
            startDate: new Date(mockStartDate),
            endDate: new Date(mockEndDate)
          },
          budgetIds: [mockBudgetId],
          categories: ['cat1', 'cat2']
        }
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="budget-report-performance-2024-01-01.json"');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(mockExportResult.data);
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await analyticsController.exportBudgetReport(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
    });

    it('should return 400 when start date is missing', async () => {
      mockRequest.query = {
        endDate: mockEndDate,
        format: 'json',
        reportType: 'performance'
      };

      await analyticsController.exportBudgetReport(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should return 400 when end date is missing', async () => {
      mockRequest.query = {
        startDate: mockStartDate,
        format: 'json',
        reportType: 'performance'
      };

      await analyticsController.exportBudgetReport(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required'
      });
    });

    it('should use default values for optional parameters', async () => {
      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate
      };

      await analyticsController.exportBudgetReport(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockAnalyticsService.exportBudgetReport).toHaveBeenCalledWith(
        mockUserId,
        {
          format: 'json',
          reportType: 'all',
          includeCharts: false,
          includeDetails: true,
          dateRange: {
            startDate: new Date(mockStartDate),
            endDate: new Date(mockEndDate)
          },
          budgetIds: undefined,
          categories: undefined
        }
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Service error');
      mockAnalyticsService.exportBudgetReport.mockRejectedValue(error);

      mockRequest.query = {
        startDate: mockStartDate,
        endDate: mockEndDate,
        format: 'json',
        reportType: 'performance'
      };

      await analyticsController.exportBudgetReport(
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
});
