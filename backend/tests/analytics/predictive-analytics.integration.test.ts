import request from 'supertest';
import express from 'express';
import analyticsRoutes from '../../src/modules/financial/analytics/routes/analytics.routes';
import { authenticateToken } from '../../src/modules/auth/auth.middleware';

// Mock the authentication middleware
jest.mock('../../src/modules/auth/auth.middleware', () => ({
  authenticateToken: jest.fn((req: any, res: any, next: any) => {
    req.user = { userId: 'test-user-123' };
    next();
  }),
}));

// Mock the analytics services
const mockService = {
  getPredictiveInsights: jest.fn(),
  getSpendingPrediction: jest.fn(),
  getAnomalyDetection: jest.fn(),
  getFinancialForecast: jest.fn(),
  getCashFlowPrediction: jest.fn(),
  getTrendAnalysis: jest.fn(),
  trainModel: jest.fn(),
};

jest.mock('../../src/modules/financial/analytics/services/predictive-analytics.service', () => ({
  PredictiveAnalyticsService: jest.fn().mockImplementation(() => ({
    getPredictiveInsights: jest.fn(),
    getSpendingPrediction: jest.fn(),
    getAnomalyDetection: jest.fn(),
    getFinancialForecast: jest.fn(),
    getCashFlowPrediction: jest.fn(),
    getTrendAnalysis: jest.fn(),
    trainModel: jest.fn(),
  })),
}));

// Mock the analytics service
jest.mock('../../src/modules/financial/analytics/services/analytics.service', () => ({
  AnalyticsService: jest.fn().mockImplementation(() => ({
    getSpendingAnalysis: jest.fn(),
    getBudgetAnalytics: jest.fn(),
    getAllBudgetAnalytics: jest.fn(),
    getFinancialInsights: jest.fn(),
    getCashFlowAnalysis: jest.fn(),
    getComparisonAnalysis: jest.fn(),
    getCategoryPerformance: jest.fn(),
    exportBudgetReport: jest.fn(),
  })),
}));

// Mock logger
jest.mock('../../src/shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Predictive Analytics API Integration Tests', () => {
  let app: express.Application;
  let mockService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/analytics', analyticsRoutes);
    
    // Get the mocked service instance
    const { PredictiveAnalyticsService } = require('../../src/modules/financial/analytics/services/predictive-analytics.service');
    mockService = new PredictiveAnalyticsService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // Set timeout for all tests
  jest.setTimeout(10000);

  describe('GET /api/analytics/predictive/insights', () => {
    it('should return comprehensive predictive insights', async () => {
      const mockInsights = {
        summary: {
          totalInsights: 5,
          highPriorityInsights: 2,
          criticalInsights: 1,
        },
        insights: [
          {
            id: 'insight1',
            type: 'prediction',
            priority: 'high',
            title: 'Spending Prediction Available',
            description: 'Based on historical data, your projected spending is $2,500 per month with high confidence.',
            data: {
              totalPredictedAmount: 2500,
              averageDailyPrediction: 80.65,
              confidence: 'high',
              methodology: 'linear_regression',
            },
            recommendations: [
              {
                action: 'Review predicted spending against your budget',
                priority: 'high',
                expectedImpact: 'Better budget planning and control',
                effort: 'low',
              },
            ],
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
        trends: [
          {
            categoryId: 'cat1',
            categoryName: 'Food',
            trend: 'increasing',
            strength: 'moderate',
            confidence: 0.7,
            description: 'Category Food shows increasing trend with moderate strength',
          },
        ],
        risks: [
          {
            type: 'spending_risk',
            severity: 'medium',
            description: 'Moderate spending risk detected',
            probability: 0.6,
            impact: 0.5,
          },
        ],
        opportunities: [
          {
            type: 'saving_opportunity',
            potential: 'medium',
            description: 'Potential savings of $250 through spending optimization',
            expectedBenefit: 250,
            effort: 'medium',
            action: 'Implement spending controls and budget optimization',
          },
        ],
      };

      mockService.getPredictiveInsights.mockResolvedValue(mockInsights);

      const response = await request(app)
        .get('/api/analytics/predictive/insights')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockInsights);
      expect(mockService.getPredictiveInsights).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123',
          startDate: expect.any(Date),
          endDate: expect.any(Date),
        })
      );
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .get('/api/analytics/predictive/insights')
        .query({
          startDate: 'invalid-date',
          endDate: '2024-01-31',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid query parameters');
    });

    it('should handle service errors', async () => {
      mockService.getPredictiveInsights.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .get('/api/analytics/predictive/insights')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('GET /api/analytics/predictive/spending', () => {
    it('should return spending prediction', async () => {
      const mockPrediction = {
        period: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T00:00:00.000Z',
        },
        predictions: [
          {
            date: '2024-01-01',
            predictedAmount: 80.65,
            confidence: 0.8,
            factors: [
              { factor: 'historical_trend', impact: 2, weight: 0.7 },
              { factor: 'seasonal_adjustment', impact: 0, weight: 0.3 },
            ],
          },
        ],
        totalPredictedAmount: 2500,
        averageDailyPrediction: 80.65,
        confidence: 'high',
        methodology: 'linear_regression',
        accuracy: {
          historicalAccuracy: 0.8,
          lastPredictionAccuracy: 0.8,
          trendAccuracy: 0.8,
        },
        riskFactors: [],
      };

      mockService.getSpendingPrediction.mockResolvedValue(mockPrediction);

      const response = await request(app)
        .get('/api/analytics/predictive/spending')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockPrediction);
      expect(mockService.getSpendingPrediction).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/predictive/anomalies', () => {
    it('should return anomaly detection results', async () => {
      const mockAnomalies = {
        period: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T00:00:00.000Z',
        },
        anomalies: [
          {
            id: 'anomaly1',
            type: 'amount_anomaly',
            severity: 'high',
            detectedAt: '2024-01-15T10:00:00.000Z',
            transactionId: 'txn123',
            description: 'Unusual transaction amount: $500.00 (+400% from average)',
            data: {
              expectedValue: 100,
              actualValue: 500,
              deviation: 400,
              deviationPercentage: 400,
              categoryId: 'cat1',
              categoryName: 'Food',
              date: '2024-01-15T00:00:00.000Z',
            },
            confidence: 0.9,
            explanation: 'This transaction amount is 4.0 standard deviations from the mean.',
            recommendations: [
              {
                action: 'Review transaction details',
                priority: 'high',
                expectedImpact: 'Verify if this is a legitimate expense or potential error',
              },
            ],
          },
        ],
        summary: {
          totalAnomalies: 1,
          criticalAnomalies: 0,
          highSeverityAnomalies: 1,
          averageConfidence: 0.9,
          detectionAccuracy: 0.85,
        },
        model: {
          algorithm: 'hybrid',
          parameters: {
            zScoreThreshold: 2.5,
            iqrMultiplier: 1.5,
            timeWindow: 7,
            minTransactions: 10,
          },
          trainingDataSize: 100,
          lastTrained: '2024-01-01T00:00:00.000Z',
        },
      };

      mockService.getAnomalyDetection.mockResolvedValue(mockAnomalies);

      const response = await request(app)
        .get('/api/analytics/predictive/anomalies')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAnomalies);
      expect(mockService.getAnomalyDetection).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/predictive/forecast', () => {
    it('should return financial forecast', async () => {
      const mockForecast = {
        forecastPeriod: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-03-31T00:00:00.000Z',
        },
        baseScenario: {
          projectedIncome: 15000,
          projectedExpenses: 12000,
          projectedNetWorth: 3000,
          projectedSavings: 600,
          confidence: 'high',
        },
        scenarios: [
          {
            name: 'optimistic',
            probability: 0.2,
            projectedIncome: 18000,
            projectedExpenses: 10800,
            projectedNetWorth: 7200,
            projectedSavings: 1440,
            keyAssumptions: [
              { assumption: 'Income increases by 20%', impact: 0.3, confidence: 0.6 },
            ],
          },
          {
            name: 'realistic',
            probability: 0.6,
            projectedIncome: 15000,
            projectedExpenses: 12000,
            projectedNetWorth: 3000,
            projectedSavings: 600,
            keyAssumptions: [
              { assumption: 'Historical trends continue', impact: 0.4, confidence: 0.8 },
            ],
          },
          {
            name: 'pessimistic',
            probability: 0.2,
            projectedIncome: 13500,
            projectedExpenses: 14400,
            projectedNetWorth: -900,
            projectedSavings: -180,
            keyAssumptions: [
              { assumption: 'Income decreases by 10%', impact: 0.3, confidence: 0.5 },
            ],
          },
        ],
        categoryForecasts: [
          {
            categoryId: 'cat1',
            categoryName: 'Food',
            projectedAmount: 3000,
            confidence: 'high',
            trend: 'increasing',
            factors: [
              { factor: 'historical_average', impact: 100, weight: 0.7 },
              { factor: 'trend_adjustment', impact: 10, weight: 0.3 },
            ],
          },
        ],
        monthlyProjections: [
          {
            month: '2024-01',
            projectedIncome: 5000,
            projectedExpenses: 4000,
            projectedNetWorth: 1000,
            projectedSavings: 200,
            confidence: 0.8,
          },
        ],
        riskFactors: [
          {
            factor: 'income_volatility',
            impact: 'high',
            probability: 0.3,
            description: 'Income shows high volatility, making predictions less reliable',
            mitigation: 'Consider building emergency fund and diversifying income sources',
          },
        ],
        methodology: {
          algorithm: 'arima',
          parameters: {
            historicalPeriod: 12,
            forecastPeriod: 3,
            confidenceThreshold: 0.7,
          },
          trainingPeriod: {
            startDate: '2023-01-01T00:00:00.000Z',
            endDate: '2023-12-31T00:00:00.000Z',
          },
          accuracy: 0.8,
        },
      };

      mockService.getFinancialForecast.mockResolvedValue(mockForecast);

      const response = await request(app)
        .get('/api/analytics/predictive/forecast')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-03-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockForecast);
      expect(mockService.getFinancialForecast).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/predictive/cashflow', () => {
    it('should return cash flow prediction', async () => {
      const mockCashFlow = {
        predictionPeriod: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T00:00:00.000Z',
        },
        currentBalance: 5000,
        predictions: {
          projectedInflows: 8000,
          projectedOutflows: 6000,
          projectedNetCashFlow: 2000,
          projectedEndingBalance: 7000,
          confidence: 'high',
        },
        monthlyProjections: [
          {
            month: '2024-01',
            projectedInflows: 8000,
            projectedOutflows: 6000,
            projectedNetCashFlow: 2000,
            projectedBalance: 7000,
            confidence: 0.8,
          },
        ],
        categoryProjections: [
          {
            categoryId: 'cat1',
            categoryName: 'Food',
            projectedInflows: 0,
            projectedOutflows: 2000,
            projectedNetAmount: -2000,
            confidence: 'high',
          },
        ],
        riskFactors: [
          {
            factor: 'cash_flow_volatility',
            impact: 'medium',
            probability: 0.4,
            description: 'Cash flow shows moderate volatility',
            mitigation: 'Maintain adequate cash reserves',
          },
        ],
        scenarios: [
          {
            name: 'optimistic',
            probability: 0.2,
            projectedEndingBalance: 8400,
            keyAssumptions: ['Higher than expected income', 'Lower than expected expenses'],
          },
          {
            name: 'realistic',
            probability: 0.6,
            projectedEndingBalance: 7000,
            keyAssumptions: ['Historical patterns continue', 'No major changes'],
          },
          {
            name: 'pessimistic',
            probability: 0.2,
            projectedEndingBalance: 5600,
            keyAssumptions: ['Lower than expected income', 'Higher than expected expenses'],
          },
        ],
        methodology: {
          algorithm: 'exponential_smoothing',
          parameters: {
            alpha: 0.3,
            historicalDays: 90,
            forecastDays: 31,
          },
          accuracy: 0.8,
        },
      };

      mockService.getCashFlowPrediction.mockResolvedValue(mockCashFlow);

      const response = await request(app)
        .get('/api/analytics/predictive/cashflow')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCashFlow);
      expect(mockService.getCashFlowPrediction).toHaveBeenCalled();
    });
  });

  describe('GET /api/analytics/predictive/trends', () => {
    it('should return trend analysis', async () => {
      const mockTrends = {
        analysisPeriod: {
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-31T00:00:00.000Z',
        },
        overallTrend: {
          direction: 'increasing',
          strength: 'moderate',
          confidence: 0.7,
          description: 'Spending shows a moderate increasing trend with a slope of 0.5000.',
        },
        categoryTrends: [
          {
            categoryId: 'cat1',
            categoryName: 'Food',
            trend: {
              direction: 'increasing',
              strength: 'moderate',
              confidence: 0.7,
            },
            data: [
              {
                period: '2024-01-01',
                amount: 100,
                change: 0,
                percentageChange: 0,
              },
            ],
            seasonalPattern: {
              hasSeasonality: false,
              peakMonths: [],
              lowMonths: [],
              seasonalStrength: 0,
            },
            forecast: {
              nextPeriodPrediction: 102,
              confidence: 0.7,
              trend: 'continuing',
            },
          },
        ],
        spendingPatterns: {
          weeklyPattern: [
            {
              day: 'Monday',
              averageAmount: 100,
              frequency: 4,
              trend: 'stable',
            },
          ],
          monthlyPattern: [
            {
              month: '2024-01',
              averageAmount: 100,
              trend: 'stable',
            },
          ],
          seasonalPattern: {
            season: 'unknown',
            averageAmount: 100,
            trend: 'stable',
          },
        },
        insights: [
          {
            type: 'trend',
            priority: 'high',
            message: 'Strong increasing spending trend detected. Consider reviewing budget allocations.',
            data: {
              direction: 'increasing',
              strength: 'strong',
            },
            recommendations: [
              {
                action: 'Review and adjust budget categories',
                priority: 'high',
                expectedImpact: 'Better control over spending growth',
              },
            ],
          },
        ],
        methodology: {
          algorithm: 'linear_regression',
          parameters: {
            dataPoints: 180,
            timeWindow: 180,
            confidenceThreshold: 0.7,
          },
          accuracy: 0.8,
        },
      };

      mockService.getTrendAnalysis.mockResolvedValue(mockTrends);

      const response = await request(app)
        .get('/api/analytics/predictive/trends')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTrends);
      expect(mockService.getTrendAnalysis).toHaveBeenCalled();
    });
  });

  describe('POST /api/analytics/predictive/train', () => {
    it('should train a predictive model', async () => {
      const mockModel = {
        id: 'model_1234567890',
        name: 'spending_prediction_test-user-123',
        type: 'spending_prediction',
        algorithm: 'linear_regression',
        parameters: {
          algorithm: 'linear_regression',
        },
        trainingData: {
          startDate: '2023-01-01T00:00:00.000Z',
          endDate: '2024-01-01T00:00:00.000Z',
          recordCount: 0,
        },
        performance: {
          accuracy: 0.8,
          precision: 0.8,
          recall: 0.8,
          f1Score: 0.8,
          lastEvaluated: '2024-01-01T00:00:00.000Z',
        },
        status: 'ready',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        lastTrained: '2024-01-01T00:00:00.000Z',
      };

      mockService.trainModel.mockResolvedValue(mockModel);

      const response = await request(app)
        .post('/api/analytics/predictive/train')
        .send({
          modelType: 'spending_prediction',
          parameters: {
            algorithm: 'linear_regression',
          },
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockModel);
      expect(mockService.trainModel).toHaveBeenCalledWith(
        'test-user-123',
        'spending_prediction',
        { algorithm: 'linear_regression' }
      );
    });

    it('should handle validation errors for model training', async () => {
      const response = await request(app)
        .post('/api/analytics/predictive/train')
        .send({
          modelType: 'invalid_type',
          parameters: {},
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid request body');
    });

    it('should handle missing model type', async () => {
      const response = await request(app)
        .post('/api/analytics/predictive/train')
        .send({
          parameters: {},
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid request body');
    });

    it('should handle training errors', async () => {
      mockService.trainModel.mockRejectedValue(new Error('Training failed'));

      const response = await request(app)
        .post('/api/analytics/predictive/train')
        .send({
          modelType: 'spending_prediction',
          parameters: {},
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      // Mock authenticateToken to throw error
      (authenticateToken as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      });

      const endpoints = [
        '/api/analytics/predictive/insights',
        '/api/analytics/predictive/spending',
        '/api/analytics/predictive/anomalies',
        '/api/analytics/predictive/forecast',
        '/api/analytics/predictive/cashflow',
        '/api/analytics/predictive/trends',
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Authentication required');
      }

      const postResponse = await request(app)
        .post('/api/analytics/predictive/train')
        .send({ modelType: 'spending_prediction' })
        .expect(401);

      expect(postResponse.body.success).toBe(false);
      expect(postResponse.body.message).toBe('Authentication required');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Reset authenticateToken mock
      (authenticateToken as jest.Mock).mockImplementation((req: any, res: any, next: any) => {
        req.user = { userId: 'test-user-123' };
        next();
      });
    });

    it('should handle service errors gracefully', async () => {
      mockService.getPredictiveInsights.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/api/analytics/predictive/insights')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
    });

    it('should handle malformed JSON in POST requests', async () => {
      const response = await request(app)
        .post('/api/analytics/predictive/train')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
