import request from 'supertest';
import express from 'express';
import financialRoutes from '../../../modules/financial/financial.routes';
import { FinancialService } from '../../../modules/financial/financial.service';
import { authenticateToken } from '../../../modules/auth/auth.middleware';
import mongoose from 'mongoose';

// Mock the FinancialService
jest.mock('../../../modules/financial/financial.service');
jest.mock('../../../modules/auth/auth.middleware');

describe('Financial Routes', () => {
  let app: express.Application;
  let mockFinancialService: jest.Mocked<FinancialService>;
  let testUserId: string;

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId().toString();
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock service
    mockFinancialService = {
      getFinancialDashboard: jest.fn(),
      generateFinancialReport: jest.fn(),
      getFinancialInsights: jest.fn(),
      getBudgetAnalysis: jest.fn(),
      exportFinancialData: jest.fn(),
    } as any;

    // Mock the FinancialService constructor
    (FinancialService as jest.MockedClass<typeof FinancialService>).mockImplementation(() => mockFinancialService);
    
    // Mock auth middleware to always pass
    (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
      req.user = { userId: testUserId };
      next();
    });

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/financial', financialRoutes);
  });

  describe('GET /api/financial/dashboard', () => {
    it('should get financial dashboard successfully', async () => {
      const dashboardData = {
        totalIncome: 5000,
        totalExpenses: 3000,
        netAmount: 2000,
        categories: [
          { name: 'Food', amount: 500, percentage: 16.67 },
          { name: 'Transport', amount: 300, percentage: 10 },
        ],
        recentTransactions: [
          { title: 'Groceries', amount: 50, date: new Date() },
        ],
      };

      mockFinancialService.getFinancialDashboard.mockResolvedValue(dashboardData as any);

      const response = await request(app)
        .get('/api/financial/dashboard')
        .expect(200);

      expect(response.body).toEqual(dashboardData);
      expect(mockFinancialService.getFinancialDashboard).toHaveBeenCalledWith(testUserId, {});
    });

    it('should get financial dashboard with date range', async () => {
      const dashboardData = { totalIncome: 2000, totalExpenses: 1500, netAmount: 500 };
      const queryParams = { startDate: '2024-01-01', endDate: '2024-01-31' };

      mockFinancialService.getFinancialDashboard.mockResolvedValue(dashboardData as any);

      const response = await request(app)
        .get('/api/financial/dashboard')
        .query(queryParams)
        .expect(200);

      expect(response.body).toEqual(dashboardData);
      expect(mockFinancialService.getFinancialDashboard).toHaveBeenCalledWith(testUserId, queryParams);
    });

    it('should return 500 when service throws error', async () => {
      const error = new Error('Service error');

      mockFinancialService.getFinancialDashboard.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/financial/dashboard')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.getFinancialDashboard).toHaveBeenCalledWith(testUserId, {});
    });
  });

  describe('POST /api/financial/report', () => {
    it('should generate financial report successfully', async () => {
      const reportData = {
        reportType: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeCategories: true,
        includeTrends: true,
        includeProjections: false,
      };

      const generatedReport = {
        reportId: new mongoose.Types.ObjectId().toString(),
        reportType: 'monthly',
        period: { start: '2024-01-01', end: '2024-01-31' },
        summary: { totalIncome: 5000, totalExpenses: 3000, netAmount: 2000 },
        categories: [{ name: 'Food', amount: 500 }],
        trends: [{ month: 'January', netAmount: 2000 }],
      };

      mockFinancialService.generateFinancialReport.mockResolvedValue(generatedReport as any);

      const response = await request(app)
        .post('/api/financial/report')
        .send(reportData)
        .expect(200);

      expect(response.body).toEqual(generatedReport);
      expect(mockFinancialService.generateFinancialReport).toHaveBeenCalledWith(reportData, testUserId);
    });

    it('should return 400 when report type is missing', async () => {
      const invalidData = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const response = await request(app)
        .post('/api/financial/report')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.generateFinancialReport).not.toHaveBeenCalled();
    });

    it('should return 400 when start date is missing', async () => {
      const invalidData = {
        reportType: 'monthly',
        endDate: '2024-01-31',
      };

      const response = await request(app)
        .post('/api/financial/report')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.generateFinancialReport).not.toHaveBeenCalled();
    });

    it('should return 400 when end date is missing', async () => {
      const invalidData = {
        reportType: 'monthly',
        startDate: '2024-01-01',
      };

      const response = await request(app)
        .post('/api/financial/report')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.generateFinancialReport).not.toHaveBeenCalled();
    });

    it('should return 500 when service throws error', async () => {
      const reportData = {
        reportType: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const error = new Error('Service error');

      mockFinancialService.generateFinancialReport.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/financial/report')
        .send(reportData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.generateFinancialReport).toHaveBeenCalledWith(reportData, testUserId);
    });
  });

  describe('GET /api/financial/insights', () => {
    it('should get financial insights successfully', async () => {
      const insightsData = {
        period: 'month',
        includePredictions: true,
      };

      const insights = {
        spendingPatterns: [
          { category: 'Food', trend: 'increasing', recommendation: 'Consider meal planning' },
        ],
        predictions: [
          { category: 'Transport', predictedAmount: 400, confidence: 0.85 },
        ],
        alerts: [
          { type: 'overspending', message: 'You are spending 20% more than usual on food' },
        ],
      };

      mockFinancialService.getFinancialInsights.mockResolvedValue(insights as any);

      const response = await request(app)
        .get('/api/financial/insights')
        .query(insightsData)
        .expect(200);

      expect(response.body).toEqual(insights);
      expect(mockFinancialService.getFinancialInsights).toHaveBeenCalledWith(testUserId, insightsData);
    });

    it('should get financial insights with default parameters', async () => {
      const insights = { spendingPatterns: [], predictions: [], alerts: [] };

      mockFinancialService.getFinancialInsights.mockResolvedValue(insights as any);

      const response = await request(app)
        .get('/api/financial/insights')
        .expect(200);

      expect(response.body).toEqual(insights);
      expect(mockFinancialService.getFinancialInsights).toHaveBeenCalledWith(testUserId, {});
    });

    it('should return 500 when service throws error', async () => {
      const error = new Error('Service error');

      mockFinancialService.getFinancialInsights.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/financial/insights')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.getFinancialInsights).toHaveBeenCalledWith(testUserId, {});
    });
  });

  describe('GET /api/financial/budget-analysis', () => {
    it('should get budget analysis successfully', async () => {
      const analysisData = {
        period: 'month',
        includeRecommendations: true,
      };

      const analysis = {
        budgetStatus: 'on_track',
        totalBudget: 3000,
        totalSpent: 2500,
        remainingBudget: 500,
        categoryBreakdown: [
          { category: 'Food', budget: 500, spent: 450, remaining: 50 },
        ],
        recommendations: [
          { type: 'savings', message: 'You can save $50 more this month' },
        ],
      };

      mockFinancialService.getBudgetAnalysis.mockResolvedValue(analysis as any);

      const response = await request(app)
        .get('/api/financial/budget-analysis')
        .query(analysisData)
        .expect(200);

      expect(response.body).toEqual(analysis);
      expect(mockFinancialService.getBudgetAnalysis).toHaveBeenCalledWith(testUserId, analysisData);
    });

    it('should get budget analysis with default parameters', async () => {
      const analysis = { budgetStatus: 'on_track', totalBudget: 3000, totalSpent: 2500 };

      mockFinancialService.getBudgetAnalysis.mockResolvedValue(analysis as any);

      const response = await request(app)
        .get('/api/financial/budget-analysis')
        .expect(200);

      expect(response.body).toEqual(analysis);
      expect(mockFinancialService.getBudgetAnalysis).toHaveBeenCalledWith(testUserId, {});
    });

    it('should return 500 when service throws error', async () => {
      const error = new Error('Service error');

      mockFinancialService.getBudgetAnalysis.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/financial/budget-analysis')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.getBudgetAnalysis).toHaveBeenCalledWith(testUserId, {});
    });
  });

  describe('POST /api/financial/export', () => {
    it('should export financial data successfully', async () => {
      const exportData = {
        format: 'json',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeCategories: true,
        includeTransactions: true,
        includeStats: true,
      };

      const exportResult = {
        filename: 'financial_data_user123_2024-01-01_2024-01-31.json',
        format: 'json',
        size: 1024,
        downloadUrl: 'https://example.com/download/file.json',
      };

      mockFinancialService.exportFinancialData.mockResolvedValue(exportResult as any);

      const response = await request(app)
        .post('/api/financial/export')
        .send(exportData)
        .expect(200);

      expect(response.body).toEqual(exportResult);
      expect(mockFinancialService.exportFinancialData).toHaveBeenCalledWith(exportData, testUserId);
    });

    it('should return 400 when format is missing', async () => {
      const invalidData = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const response = await request(app)
        .post('/api/financial/export')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.exportFinancialData).not.toHaveBeenCalled();
    });

    it('should return 400 when start date is missing', async () => {
      const invalidData = {
        format: 'json',
        endDate: '2024-01-31',
      };

      const response = await request(app)
        .post('/api/financial/export')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.exportFinancialData).not.toHaveBeenCalled();
    });

    it('should return 400 when end date is missing', async () => {
      const invalidData = {
        format: 'json',
        startDate: '2024-01-01',
      };

      const response = await request(app)
        .post('/api/financial/export')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.exportFinancialData).not.toHaveBeenCalled();
    });

    it('should return 400 when format is unsupported', async () => {
      const invalidData = {
        format: 'unsupported',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      const response = await request(app)
        .post('/api/financial/export')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.exportFinancialData).not.toHaveBeenCalled();
    });

    it('should return 500 when service throws error', async () => {
      const exportData = {
        format: 'json',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };
      const error = new Error('Service error');

      mockFinancialService.exportFinancialData.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/financial/export')
        .send(exportData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.exportFinancialData).toHaveBeenCalledWith(exportData, testUserId);
    });
  });



      const summaryData = {
        period: 'month',
        includeComparisons: true,
      };

      const summary = {
        period: 'month',
        totalIncome: 5000,
        totalExpenses: 3000,
        netAmount: 2000,
        savingsRate: 0.4,
        comparison: {
          previousPeriod: { netAmount: 1800, change: 0.11 },
        },
      };

      mockFinancialService.getFinancialSummary.mockResolvedValue(summary as any);

      const response = await request(app)
        .get('/api/financial/summary')
        .query(summaryData)
        .expect(200);

      expect(response.body).toEqual(summary);
      expect(mockFinancialService.getFinancialSummary).toHaveBeenCalledWith(testUserId, summaryData);
    });

    it('should get financial summary with default period', async () => {
      const summary = { period: 'month', totalIncome: 5000, totalExpenses: 3000, netAmount: 2000 };

      mockFinancialService.getFinancialSummary.mockResolvedValue(summary as any);

      const response = await request(app)
        .get('/api/financial/summary')
        .expect(200);

      expect(response.body).toEqual(summary);
      expect(mockFinancialService.getFinancialSummary).toHaveBeenCalledWith(testUserId, {});
    });

    it('should return 500 when service throws error', async () => {
      const error = new Error('Service error');

      mockFinancialService.getFinancialSummary.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/financial/summary')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.getFinancialSummary).toHaveBeenCalledWith(testUserId, {});
    });
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock auth middleware to fail
      (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/financial/dashboard')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown errors gracefully', async () => {
      const unknownError = 'Unknown error occurred';

      mockFinancialService.getFinancialDashboard.mockRejectedValue(unknownError);

      const response = await request(app)
        .get('/api/financial/dashboard')
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(mockFinancialService.getFinancialDashboard).toHaveBeenCalledWith(testUserId, {});
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/financial/report')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Route Configuration', () => {
    it('should have all required routes configured', async () => {
      const routes = financialRoutes.stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const expectedRoutes = [
        { path: '/dashboard', methods: ['get'] },
        { path: '/report', methods: ['post'] },
        { path: '/insights', methods: ['get'] },
        { path: '/budget-analysis', methods: ['get'] },
        { path: '/export', methods: ['post'] },
        { path: '/summary', methods: ['get'] },
      ];

      expectedRoutes.forEach(expectedRoute => {
        const foundRoute = routes.find(
          route => route.path === expectedRoute.path
        );
        expect(foundRoute).toBeDefined();
        expectedRoute.methods.forEach(method => {
          expect(foundRoute?.methods).toContain(method);
        });
      });
    });
  });

  describe('Validation', () => {
    it('should validate date format in query parameters', async () => {
      const response = await request(app)
        .get('/api/financial/dashboard')
        .query({ startDate: 'invalid-date' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate date format in request body', async () => {
      const response = await request(app)
        .post('/api/financial/report')
        .send({
          reportType: 'monthly',
          startDate: 'invalid-date',
          endDate: '2024-01-31',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate enum values', async () => {
      const response = await request(app)
        .post('/api/financial/report')
        .send({
          reportType: 'invalid-type',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
