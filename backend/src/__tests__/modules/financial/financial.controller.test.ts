import { FinancialController } from '../../../modules/financial/financial.controller';
import { FinancialService } from '../../../modules/financial/financial.service';
import { Request, Response } from 'express';

// Mock the FinancialService
jest.mock('../../../modules/financial/financial.service');

const mockFinancialService = {
  getFinancialDashboard: jest.fn(),
  generateFinancialReport: jest.fn(),
  getBudgetAnalysis: jest.fn(),
  getFinancialInsights: jest.fn(),
  exportFinancialData: jest.fn(),
} as unknown as jest.Mocked<FinancialService>;

// Mock the constructor to return our mocked instance
jest
  .mocked(FinancialService)
  .mockImplementation(() => mockFinancialService as any);

// Extend the Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

describe('FinancialController', () => {
  let financialController: FinancialController;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create the controller instance
    financialController = new FinancialController();

    // Manually inject our mock service
    (financialController as any).financialService = mockFinancialService;

    // Mock response methods
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock request with user
    mockRequest = {
      user: { userId: 'user123' },
      query: {},
      body: {},
    };
  });

  describe('getFinancialDashboard', () => {
    it('should get financial dashboard successfully', async () => {
      const mockDashboard = {
        overview: {
          totalBalance: 2000,
          monthlyIncome: 5000,
          monthlyExpenses: 3000,
          monthlyNet: 2000,
          pendingTransactions: 2,
          upcomingRecurring: 1,
        },
        recentTransactions: [],
        topCategories: [],
        spendingTrends: [],
        budgetStatus: [],
      };

      mockFinancialService.getFinancialDashboard.mockResolvedValue(
        mockDashboard
      );

      await financialController.getFinancialDashboard(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockFinancialService.getFinancialDashboard).toHaveBeenCalledWith(
        'user123',
        {}
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockDashboard,
      });
    });

    it('should handle query parameters correctly', async () => {
      const mockRequestWithQuery = {
        ...mockRequest,
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          accountId: 'account123',
        },
      };

      const mockDashboard = {
        overview: {
          totalBalance: 2000,
          monthlyIncome: 5000,
          monthlyExpenses: 3000,
          monthlyNet: 2000,
          pendingTransactions: 2,
          upcomingRecurring: 1,
        },
        recentTransactions: [],
        topCategories: [],
        spendingTrends: [],
        budgetStatus: [],
      };

      mockFinancialService.getFinancialDashboard.mockResolvedValue(
        mockDashboard
      );

      await financialController.getFinancialDashboard(
        mockRequestWithQuery as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockFinancialService.getFinancialDashboard).toHaveBeenCalledWith(
        'user123',
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          accountId: 'account123',
        }
      );
    });

    it('should return 401 when user is not authenticated', async () => {
      const mockRequestWithoutUser = {
        ...mockRequest,
        user: undefined,
      };

      await financialController.getFinancialDashboard(
        mockRequestWithoutUser as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Service unavailable');
      mockFinancialService.getFinancialDashboard.mockRejectedValue(error);

      await financialController.getFinancialDashboard(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('generateFinancialReport', () => {
    it('should generate financial report successfully', async () => {
      const mockReport = {
        reportType: 'monthly',
        period: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
        summary: {
          totalIncome: 8000,
          totalExpenses: 5000,
          totalTransfers: 1000,
          netAmount: 3000,
          transactionCount: 15,
        },
        categories: [],
        trends: [],
        projections: [],
        insights: [],
      };

      const mockRequestWithBody = {
        ...mockRequest,
        body: {
          reportType: 'monthly',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeCategories: true,
          includeTrends: true,
          includeProjections: false,
        },
      };

      mockFinancialService.generateFinancialReport.mockResolvedValue(
        mockReport
      );

      await financialController.generateFinancialReport(
        mockRequestWithBody as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockFinancialService.generateFinancialReport).toHaveBeenCalledWith(
        'user123',
        {
          reportType: 'monthly',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          includeCategories: true,
          includeTrends: true,
          includeProjections: false,
        }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Financial report generated successfully',
        data: mockReport,
      });
    });

    it('should return 400 when report type is missing', async () => {
      const mockRequestWithoutReportType = {
        ...mockRequest,
        body: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      await financialController.generateFinancialReport(
        mockRequestWithoutReportType as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Report type is required',
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      const mockRequestWithoutUser = {
        ...mockRequest,
        user: undefined,
      };

      await financialController.generateFinancialReport(
        mockRequestWithoutUser as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Invalid report type');
      mockFinancialService.generateFinancialReport.mockRejectedValue(error);

      const mockRequestWithBody = {
        ...mockRequest,
        body: {
          reportType: 'monthly',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      await financialController.generateFinancialReport(
        mockRequestWithBody as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid report type',
      });
    });

    it('should handle unknown errors gracefully', async () => {
      const error = 'Unknown error';
      mockFinancialService.generateFinancialReport.mockRejectedValue(error);

      const mockRequestWithBody = {
        ...mockRequest,
        body: {
          reportType: 'monthly',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      await financialController.generateFinancialReport(
        mockRequestWithBody as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('getBudgetAnalysis', () => {
    it('should get budget analysis successfully', async () => {
      const mockAnalysis = {
        currentSpending: {
          total: 9000,
          byCategory: [],
          vsBudget: [],
        },
        recommendations: [],
        alerts: [],
      };

      const mockRequestWithQuery = {
        ...mockRequest,
        query: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          categoryId: 'cat123',
        },
      };

      mockFinancialService.getBudgetAnalysis.mockResolvedValue(mockAnalysis);

      await financialController.getBudgetAnalysis(
        mockRequestWithQuery as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockFinancialService.getBudgetAnalysis).toHaveBeenCalledWith(
        'user123',
        {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          categoryId: 'cat123',
        }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAnalysis,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      const mockRequestWithoutUser = {
        ...mockRequest,
        user: undefined,
      };

      await financialController.getBudgetAnalysis(
        mockRequestWithoutUser as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Budget service failed');
      mockFinancialService.getBudgetAnalysis.mockRejectedValue(error);

      await financialController.getBudgetAnalysis(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('getFinancialInsights', () => {
    it('should get financial insights successfully', async () => {
      const mockInsights = {
        period: 'month',
        insights: [],
        trends: [],
        predictions: [],
      };

      const mockRequestWithQuery = {
        ...mockRequest,
        query: {
          period: 'month',
          includePredictions: 'true',
        },
      };

      mockFinancialService.getFinancialInsights.mockResolvedValue(mockInsights);

      await financialController.getFinancialInsights(
        mockRequestWithQuery as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockFinancialService.getFinancialInsights).toHaveBeenCalledWith(
        'user123',
        {
          period: 'month',
          includePredictions: true,
        }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockInsights,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      const mockRequestWithoutUser = {
        ...mockRequest,
        user: undefined,
      };

      await financialController.getFinancialInsights(
        mockRequestWithoutUser as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Insights service failed');
      mockFinancialService.getFinancialInsights.mockRejectedValue(error);

      await financialController.getFinancialInsights(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('exportFinancialData', () => {
    it('should export financial data successfully', async () => {
      const mockExportResult = {
        format: 'json',
        data: {},
        filename: 'financial_data_user123_2024-01-01_2024-01-31.json',
        downloadUrl: undefined,
      };

      const mockRequestWithBody = {
        ...mockRequest,
        body: {
          format: 'json',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          includeCategories: true,
          includeTransactions: true,
          includeStats: true,
        },
      };

      mockFinancialService.exportFinancialData.mockResolvedValue(
        mockExportResult
      );

      await financialController.exportFinancialData(
        mockRequestWithBody as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockFinancialService.exportFinancialData).toHaveBeenCalledWith(
        'user123',
        {
          format: 'json',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          includeCategories: true,
          includeTransactions: true,
          includeStats: true,
        }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Financial data exported successfully',
        data: mockExportResult,
      });
    });

    it('should return 400 when required fields are missing', async () => {
      const mockRequestWithMissingFields = {
        ...mockRequest,
        body: {
          format: 'json',
          startDate: '2024-01-01',
          // endDate is missing
        },
      };

      await financialController.exportFinancialData(
        mockRequestWithMissingFields as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Format, start date, and end date are required',
      });
    });

    it('should return 400 when format is unsupported', async () => {
      const mockRequestWithUnsupportedFormat = {
        ...mockRequest,
        body: {
          format: 'txt',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      await financialController.exportFinancialData(
        mockRequestWithUnsupportedFormat as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unsupported export format. Supported formats: csv, json, pdf',
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      const mockRequestWithoutUser = {
        ...mockRequest,
        user: undefined,
      };

      await financialController.exportFinancialData(
        mockRequestWithoutUser as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle service errors gracefully', async () => {
      const error = new Error('Export service failed');
      mockFinancialService.exportFinancialData.mockRejectedValue(error);

      const mockRequestWithBody = {
        ...mockRequest,
        body: {
          format: 'json',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      };

      await financialController.exportFinancialData(
        mockRequestWithBody as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Export service failed',
      });
    });
  });

  describe('getFinancialSummary', () => {
    it('should get financial summary successfully', async () => {
      const mockInsights = {
        period: 'month',
        insights: [
          {
            type: 'spending' as const,
            title: 'High spending on food',
            description: 'Food expenses are above average',
            value: 500,
            change: 20,
            changeType: 'increase' as const,
          },
          {
            type: 'savings' as const,
            title: 'Good savings rate',
            description: 'You are saving 40% of income',
            value: 2000,
            change: 15,
            changeType: 'increase' as const,
          },
          {
            type: 'trend' as const,
            title: 'Consider investment',
            description: 'Consider investing excess funds',
            value: 1000,
            change: 0,
            changeType: 'stable' as const,
          },
        ],
        trends: [
          {
            category: 'Food',
            trend: 'rising' as const,
            change: 20,
            confidence: 0.8,
          },
          {
            category: 'Transport',
            trend: 'stable' as const,
            change: 5,
            confidence: 0.6,
          },
        ],
        predictions: [],
      };

      const mockDashboardData = {
        overview: {
          totalBalance: 2000,
          monthlyIncome: 5000,
          monthlyExpenses: 3000,
          monthlyNet: 2000,
          pendingTransactions: 2,
          upcomingRecurring: 1,
        },
        recentTransactions: [
          { id: '1', amount: 100 },
          { id: '2', amount: 200 },
        ],
        topCategories: [
          { name: 'Food', amount: 500 },
          { name: 'Transport', amount: 300 },
        ],
        spendingTrends: [],
        budgetStatus: [],
      };

      mockFinancialService.getFinancialInsights.mockResolvedValue(mockInsights);
      mockFinancialService.getFinancialDashboard.mockResolvedValue(
        mockDashboardData
      );

      await financialController.getFinancialSummary(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockFinancialService.getFinancialInsights).toHaveBeenCalledWith(
        'user123',
        {
          period: 'month',
          includePredictions: false,
        }
      );
      expect(mockFinancialService.getFinancialDashboard).toHaveBeenCalledWith(
        'user123',
        {
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          period: 'month',
          overview: {
            totalIncome: 5000,
            totalExpenses: 3000,
            netAmount: 2000,
            transactionCount: 2,
          },
          topInsights: mockInsights.insights.slice(0, 3),
          topCategories: mockDashboardData.topCategories,
        },
      });
    });

    it('should get financial summary with custom period', async () => {
      const mockRequestWithPeriod = {
        ...mockRequest,
        query: { period: 'week' },
      };

      const mockInsights = {
        period: 'week',
        insights: [
          {
            type: 'spending' as const,
            title: 'Weekly spending analysis',
            description: 'Weekly spending is within budget',
            value: 200,
            change: -10,
            changeType: 'decrease' as const,
          },
        ],
        trends: [
          {
            category: 'Food',
            trend: 'stable' as const,
            change: 5,
            confidence: 0.7,
          },
        ],
        predictions: [],
      };

      const mockDashboardData = {
        overview: {
          totalBalance: 400,
          monthlyIncome: 1200,
          monthlyExpenses: 800,
          monthlyNet: 400,
          pendingTransactions: 1,
          upcomingRecurring: 0,
        },
        recentTransactions: [{ id: '1', amount: 50 }],
        topCategories: [{ name: 'Food', amount: 200 }],
        spendingTrends: [],
        budgetStatus: [],
      };

      mockFinancialService.getFinancialInsights.mockResolvedValue(mockInsights);
      mockFinancialService.getFinancialDashboard.mockResolvedValue(
        mockDashboardData
      );

      await financialController.getFinancialSummary(
        mockRequestWithPeriod as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockFinancialService.getFinancialInsights).toHaveBeenCalledWith(
        'user123',
        {
          period: 'week',
          includePredictions: false,
        }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 when user is not authenticated', async () => {
      const mockRequestWithoutUser = {
        ...mockRequest,
        user: undefined,
      };

      await financialController.getFinancialSummary(
        mockRequestWithoutUser as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle service errors gracefully', async () => {
      const mockError = new Error('Service unavailable');
      mockFinancialService.getFinancialInsights.mockRejectedValue(mockError);

      await financialController.getFinancialSummary(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('calculatePeriodDateRange', () => {
    it('should calculate week date range correctly', () => {
      const result = (financialController as any).calculatePeriodDateRange(
        'week'
      );

      // Verify the result has the expected structure and logic
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);

      // Verify week logic: start date should be at the beginning of the week
      const now = new Date();
      const expectedWeekStart = new Date(now);
      expectedWeekStart.setDate(now.getDate() - now.getDay());

      // Allow for small time differences (within 1 second)
      expect(
        Math.abs(result.startDate.getTime() - expectedWeekStart.getTime())
      ).toBeLessThan(1000);
      expect(Math.abs(result.endDate.getTime() - now.getTime())).toBeLessThan(
        1000
      );
    });

    it('should calculate month date range correctly', () => {
      const result = (financialController as any).calculatePeriodDateRange(
        'month'
      );

      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);

      // Verify month logic: start date should be at the beginning of the month
      const now = new Date();
      const expectedMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      expect(
        Math.abs(result.startDate.getTime() - expectedMonthStart.getTime())
      ).toBeLessThan(1000);
      expect(Math.abs(result.endDate.getTime() - now.getTime())).toBeLessThan(
        1000
      );
    });

    it('should calculate quarter date range correctly', () => {
      const result = (financialController as any).calculatePeriodDateRange(
        'quarter'
      );

      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);

      // Verify quarter logic
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      const expectedQuarterStart = new Date(now.getFullYear(), quarter * 3, 1);

      expect(
        Math.abs(result.startDate.getTime() - expectedQuarterStart.getTime())
      ).toBeLessThan(1000);
      expect(Math.abs(result.endDate.getTime() - now.getTime())).toBeLessThan(
        1000
      );
    });

    it('should calculate year date range correctly', () => {
      const result = (financialController as any).calculatePeriodDateRange(
        'year'
      );

      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);

      // Verify year logic: start date should be at the beginning of the year
      const now = new Date();
      const expectedYearStart = new Date(now.getFullYear(), 0, 1);

      expect(
        Math.abs(result.startDate.getTime() - expectedYearStart.getTime())
      ).toBeLessThan(1000);
      expect(result.endDate.getTime() - now.getTime()).toBeLessThan(1000);
    });

    it('should use month as default for unknown period', () => {
      const result = (financialController as any).calculatePeriodDateRange(
        'unknown'
      );

      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);

      // Verify default month logic
      const now = new Date();
      const expectedMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      expect(
        Math.abs(result.startDate.getTime() - expectedMonthStart.getTime())
      ).toBeLessThan(1000);
      expect(Math.abs(result.endDate.getTime() - now.getTime())).toBeLessThan(
        1000
      );
    });
  });
});
