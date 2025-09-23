import { PredictiveAnalyticsService } from '../../src/modules/financial/analytics/services/predictive-analytics.service';
import { SpendingPredictionService } from '../../src/modules/financial/analytics/services/spending-prediction.service';
import { AnomalyDetectionService } from '../../src/modules/financial/analytics/services/anomaly-detection.service';
import { FinancialForecastingService } from '../../src/modules/financial/analytics/services/financial-forecasting.service';
import { TrendAnalysisService } from '../../src/modules/financial/analytics/services/trend-analysis.service';

// Mock the services
jest.mock('../../src/modules/financial/analytics/services/spending-prediction.service');
jest.mock('../../src/modules/financial/analytics/services/anomaly-detection.service');
jest.mock('../../src/modules/financial/analytics/services/financial-forecasting.service');
jest.mock('../../src/modules/financial/analytics/services/trend-analysis.service');
jest.mock('../../src/shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('PredictiveAnalyticsService', () => {
  let service: PredictiveAnalyticsService;
  let mockSpendingPredictionService: jest.Mocked<SpendingPredictionService>;
  let mockAnomalyDetectionService: jest.Mocked<AnomalyDetectionService>;
  let mockFinancialForecastingService: jest.Mocked<FinancialForecastingService>;
  let mockTrendAnalysisService: jest.Mocked<TrendAnalysisService>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSpendingPredictionService = {
      predictSpending: jest.fn(),
      trainModel: jest.fn(),
    } as any;

    mockAnomalyDetectionService = {
      detectAnomalies: jest.fn(),
    } as any;

    mockFinancialForecastingService = {
      generateFinancialForecast: jest.fn(),
      generateCashFlowPrediction: jest.fn(),
    } as any;

    mockTrendAnalysisService = {
      analyzeTrends: jest.fn(),
    } as any;

    // Mock the constructor dependencies
    (SpendingPredictionService as jest.Mock).mockImplementation(() => mockSpendingPredictionService);
    (AnomalyDetectionService as jest.Mock).mockImplementation(() => mockAnomalyDetectionService);
    (FinancialForecastingService as jest.Mock).mockImplementation(() => mockFinancialForecastingService);
    (TrendAnalysisService as jest.Mock).mockImplementation(() => mockTrendAnalysisService);

    service = new PredictiveAnalyticsService();
  });

  describe('getPredictiveInsights', () => {
    const mockQuery = {
      userId: 'user123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      categories: undefined,
      transactionTypes: undefined,
      accounts: undefined,
      includeRecurring: true,
      confidenceThreshold: 0.7,
      modelType: 'spending_prediction' as const,
      algorithm: undefined,
    };

    it('should generate comprehensive predictive insights', async () => {
      const mockSpendingPrediction = {
        period: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        predictions: [],
        totalPredictedAmount: 1000,
        averageDailyPrediction: 32.26,
        confidence: 'high' as const,
        methodology: 'linear_regression' as const,
        accuracy: { historicalAccuracy: 0.8, lastPredictionAccuracy: 0.8, trendAccuracy: 0.8 },
        riskFactors: [],
      };

      const mockAnomalyDetection = {
        period: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        anomalies: [],
        summary: { totalAnomalies: 0, criticalAnomalies: 0, highSeverityAnomalies: 0, averageConfidence: 0, detectionAccuracy: 0.85 },
        model: { algorithm: 'hybrid' as const, parameters: {}, trainingDataSize: 0, lastTrained: new Date() },
      };

      const mockFinancialForecast = {
        forecastPeriod: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        baseScenario: { projectedIncome: 5000, projectedExpenses: 3000, projectedNetWorth: 2000, projectedSavings: 400, confidence: 'high' as const },
        scenarios: [],
        categoryForecasts: [],
        monthlyProjections: [],
        riskFactors: [],
        methodology: { algorithm: 'arima' as const, parameters: {}, trainingPeriod: { startDate: new Date(), endDate: new Date() }, accuracy: 0.8 },
      };

      const mockTrendAnalysis = {
        analysisPeriod: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        overallTrend: { direction: 'increasing' as const, strength: 'moderate' as const, confidence: 0.7, description: 'Test trend' },
        categoryTrends: [],
        spendingPatterns: { weeklyPattern: [], monthlyPattern: [], seasonalPattern: [{ season: 'unknown', averageAmount: 0, trend: 'stable' as const }] },
        insights: [],
        methodology: { algorithm: 'linear_regression' as const, parameters: {}, accuracy: 0.8 },
      };

      mockSpendingPredictionService.predictSpending.mockResolvedValue(mockSpendingPrediction);
      mockAnomalyDetectionService.detectAnomalies.mockResolvedValue(mockAnomalyDetection);
      mockFinancialForecastingService.generateFinancialForecast.mockResolvedValue(mockFinancialForecast);
      mockTrendAnalysisService.analyzeTrends.mockResolvedValue(mockTrendAnalysis);

      const result = await service.getPredictiveInsights(mockQuery);

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.summary.totalInsights).toBeGreaterThanOrEqual(0);
      expect(result.summary.highPriorityInsights).toBeGreaterThanOrEqual(0);
      expect(result.summary.criticalInsights).toBeGreaterThanOrEqual(0);
      
      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.insights)).toBe(true);
      
      expect(result.trends).toBeDefined();
      expect(Array.isArray(result.trends)).toBe(true);
      
      expect(result.risks).toBeDefined();
      expect(Array.isArray(result.risks)).toBe(true);
      
      expect(result.opportunities).toBeDefined();
      expect(Array.isArray(result.opportunities)).toBe(true);

      // Verify all services were called
      expect(mockSpendingPredictionService.predictSpending).toHaveBeenCalledWith(mockQuery);
      expect(mockAnomalyDetectionService.detectAnomalies).toHaveBeenCalledWith(mockQuery);
      expect(mockFinancialForecastingService.generateFinancialForecast).toHaveBeenCalledWith(mockQuery);
      expect(mockTrendAnalysisService.analyzeTrends).toHaveBeenCalledWith(mockQuery);
    });

    it('should handle service errors gracefully', async () => {
      mockSpendingPredictionService.predictSpending.mockRejectedValue(new Error('Spending prediction failed'));
      mockAnomalyDetectionService.detectAnomalies.mockResolvedValue({
        period: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        anomalies: [],
        summary: { totalAnomalies: 0, criticalAnomalies: 0, highSeverityAnomalies: 0, averageConfidence: 0, detectionAccuracy: 0.85 },
        model: { algorithm: 'hybrid' as const, parameters: {}, trainingDataSize: 0, lastTrained: new Date() },
      });
      mockFinancialForecastingService.generateFinancialForecast.mockResolvedValue({
        forecastPeriod: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        baseScenario: { projectedIncome: 5000, projectedExpenses: 3000, projectedNetWorth: 2000, projectedSavings: 400, confidence: 'high' as const },
        scenarios: [],
        categoryForecasts: [],
        monthlyProjections: [],
        riskFactors: [],
        methodology: { algorithm: 'arima' as const, parameters: {}, trainingPeriod: { startDate: new Date(), endDate: new Date() }, accuracy: 0.8 },
      });
      mockTrendAnalysisService.analyzeTrends.mockResolvedValue({
        analysisPeriod: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        overallTrend: { direction: 'increasing' as const, strength: 'moderate' as const, confidence: 0.7, description: 'Test trend' },
        categoryTrends: [],
        spendingPatterns: { weeklyPattern: [], monthlyPattern: [], seasonalPattern: [{ season: 'unknown', averageAmount: 0, trend: 'stable' as const }] },
        insights: [],
        methodology: { algorithm: 'linear_regression' as const, parameters: {}, accuracy: 0.8 },
      });

      await expect(service.getPredictiveInsights(mockQuery)).rejects.toThrow('Spending prediction failed');
    });
  });

  describe('getSpendingPrediction', () => {
    const mockQuery = {
      userId: 'user123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should get spending prediction', async () => {
      const mockPrediction = {
        period: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        predictions: [],
        totalPredictedAmount: 1000,
        averageDailyPrediction: 32.26,
        confidence: 'high' as const,
        methodology: 'linear_regression' as const,
        accuracy: { historicalAccuracy: 0.8, lastPredictionAccuracy: 0.8, trendAccuracy: 0.8 },
        riskFactors: [],
      };

      mockSpendingPredictionService.predictSpending.mockResolvedValue(mockPrediction);

      const result = await service.getSpendingPrediction(mockQuery);

      expect(result).toBeDefined();
      expect(result).toEqual(mockPrediction);
      expect(mockSpendingPredictionService.predictSpending).toHaveBeenCalledWith(mockQuery);
    });

    it('should handle errors', async () => {
      mockSpendingPredictionService.predictSpending.mockRejectedValue(new Error('Prediction failed'));

      await expect(service.getSpendingPrediction(mockQuery)).rejects.toThrow('Prediction failed');
    });
  });

  describe('getAnomalyDetection', () => {
    const mockQuery = {
      userId: 'user123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should get anomaly detection results', async () => {
      const mockAnomalies = {
        period: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        anomalies: [],
        summary: { totalAnomalies: 0, criticalAnomalies: 0, highSeverityAnomalies: 0, averageConfidence: 0, detectionAccuracy: 0.85 },
        model: { algorithm: 'hybrid' as const, parameters: {}, trainingDataSize: 0, lastTrained: new Date() },
      };

      mockAnomalyDetectionService.detectAnomalies.mockResolvedValue(mockAnomalies);

      const result = await service.getAnomalyDetection(mockQuery);

      expect(result).toBeDefined();
      expect(result).toEqual(mockAnomalies);
      expect(mockAnomalyDetectionService.detectAnomalies).toHaveBeenCalledWith(mockQuery);
    });

    it('should handle errors', async () => {
      mockAnomalyDetectionService.detectAnomalies.mockRejectedValue(new Error('Detection failed'));

      await expect(service.getAnomalyDetection(mockQuery)).rejects.toThrow('Detection failed');
    });
  });

  describe('getFinancialForecast', () => {
    const mockQuery = {
      userId: 'user123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should get financial forecast', async () => {
      const mockForecast = {
        forecastPeriod: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        baseScenario: { projectedIncome: 5000, projectedExpenses: 3000, projectedNetWorth: 2000, projectedSavings: 400, confidence: 'high' as const },
        scenarios: [],
        categoryForecasts: [],
        monthlyProjections: [],
        riskFactors: [],
        methodology: { algorithm: 'arima' as const, parameters: {}, trainingPeriod: { startDate: new Date(), endDate: new Date() }, accuracy: 0.8 },
      };

      mockFinancialForecastingService.generateFinancialForecast.mockResolvedValue(mockForecast);

      const result = await service.getFinancialForecast(mockQuery);

      expect(result).toBeDefined();
      expect(result).toEqual(mockForecast);
      expect(mockFinancialForecastingService.generateFinancialForecast).toHaveBeenCalledWith(mockQuery);
    });

    it('should handle errors', async () => {
      mockFinancialForecastingService.generateFinancialForecast.mockRejectedValue(new Error('Forecast failed'));

      await expect(service.getFinancialForecast(mockQuery)).rejects.toThrow('Forecast failed');
    });
  });

  describe('getCashFlowPrediction', () => {
    const mockQuery = {
      userId: 'user123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should get cash flow prediction', async () => {
      const mockPrediction = {
        predictionPeriod: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        currentBalance: 1000,
        predictions: { projectedInflows: 5000, projectedOutflows: 3000, projectedNetCashFlow: 2000, projectedEndingBalance: 3000, confidence: 'high' as const },
        monthlyProjections: [],
        categoryProjections: [],
        riskFactors: [],
        scenarios: [],
        methodology: { algorithm: 'exponential_smoothing' as const, parameters: {}, accuracy: 0.8 },
      };

      mockFinancialForecastingService.generateCashFlowPrediction.mockResolvedValue(mockPrediction);

      const result = await service.getCashFlowPrediction(mockQuery);

      expect(result).toBeDefined();
      expect(result).toEqual(mockPrediction);
      expect(mockFinancialForecastingService.generateCashFlowPrediction).toHaveBeenCalledWith(mockQuery);
    });

    it('should handle errors', async () => {
      mockFinancialForecastingService.generateCashFlowPrediction.mockRejectedValue(new Error('Cash flow prediction failed'));

      await expect(service.getCashFlowPrediction(mockQuery)).rejects.toThrow('Cash flow prediction failed');
    });
  });

  describe('getTrendAnalysis', () => {
    const mockQuery = {
      userId: 'user123',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    };

    it('should get trend analysis', async () => {
      const mockTrends = {
        analysisPeriod: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        overallTrend: { direction: 'increasing' as const, strength: 'moderate' as const, confidence: 0.7, description: 'Test trend' },
        categoryTrends: [],
        spendingPatterns: { weeklyPattern: [], monthlyPattern: [], seasonalPattern: [{ season: 'unknown', averageAmount: 0, trend: 'stable' as const }] },
        insights: [],
        methodology: { algorithm: 'linear_regression' as const, parameters: {}, accuracy: 0.8 },
      };

      mockTrendAnalysisService.analyzeTrends.mockResolvedValue(mockTrends);

      const result = await service.getTrendAnalysis(mockQuery);

      expect(result).toBeDefined();
      expect(result).toEqual(mockTrends);
      expect(mockTrendAnalysisService.analyzeTrends).toHaveBeenCalledWith(mockQuery);
    });

    it('should handle errors', async () => {
      mockTrendAnalysisService.analyzeTrends.mockRejectedValue(new Error('Trend analysis failed'));

      await expect(service.getTrendAnalysis(mockQuery)).rejects.toThrow('Trend analysis failed');
    });
  });

  describe('trainModel', () => {
    it('should train a spending prediction model', async () => {
      const userId = 'user123';
      const modelType = 'spending_prediction';
      const parameters = { algorithm: 'linear_regression' as const };

      const mockModel = {
        id: 'model123',
        name: 'spending_prediction_user123',
        type: 'spending_prediction' as const,
        algorithm: 'linear_regression' as const,
        parameters,
        trainingData: { startDate: new Date(), endDate: new Date(), recordCount: 100 },
        performance: { accuracy: 0.8, precision: 0.8, recall: 0.8, f1Score: 0.8, lastEvaluated: new Date() },
        status: 'ready' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastTrained: new Date(),
      };

      mockSpendingPredictionService.trainModel.mockResolvedValue(mockModel);

      const result = await service.trainModel(userId, modelType, parameters);

      expect(result).toBeDefined();
      expect(result).toEqual(mockModel);
      expect(mockSpendingPredictionService.trainModel).toHaveBeenCalledWith(userId, modelType, parameters);
    });

    it('should handle unsupported model types', async () => {
      const userId = 'user123';
      const modelType = 'unsupported_type';
      const parameters = {};

      await expect(service.trainModel(userId, modelType, parameters)).rejects.toThrow('Unsupported model type: unsupported_type');
    });

    it('should handle training errors', async () => {
      const userId = 'user123';
      const modelType = 'spending_prediction';
      const parameters = {};

      mockSpendingPredictionService.trainModel.mockRejectedValue(new Error('Training failed'));

      await expect(service.trainModel(userId, modelType, parameters)).rejects.toThrow('Training failed');
    });
  });

  describe('private methods', () => {
    it('should generate comprehensive insights correctly', async () => {
      const mockSpendingPrediction = {
        period: { startDate: new Date(), endDate: new Date() },
        predictions: [],
        totalPredictedAmount: 1000,
        averageDailyPrediction: 32.26,
        confidence: 'high' as const,
        methodology: 'linear_regression' as const,
        accuracy: { historicalAccuracy: 0.8, lastPredictionAccuracy: 0.8, trendAccuracy: 0.8 },
        riskFactors: [],
      };

      const mockAnomalyDetection = {
        period: { startDate: new Date(), endDate: new Date() },
        anomalies: [],
        summary: { totalAnomalies: 0, criticalAnomalies: 0, highSeverityAnomalies: 0, averageConfidence: 0, detectionAccuracy: 0.85 },
        model: { algorithm: 'hybrid' as const, parameters: {}, trainingDataSize: 0, lastTrained: new Date() },
      };

      const mockFinancialForecast = {
        forecastPeriod: { startDate: new Date(), endDate: new Date() },
        baseScenario: { projectedIncome: 5000, projectedExpenses: 3000, projectedNetWorth: 2000, projectedSavings: 400, confidence: 'high' as const },
        scenarios: [],
        categoryForecasts: [],
        monthlyProjections: [],
        riskFactors: [],
        methodology: { algorithm: 'arima' as const, parameters: {}, trainingPeriod: { startDate: new Date(), endDate: new Date() }, accuracy: 0.8 },
      };

      const mockTrendAnalysis = {
        analysisPeriod: { startDate: new Date(), endDate: new Date() },
        overallTrend: { direction: 'increasing' as const, strength: 'moderate' as const, confidence: 0.7, description: 'Test trend' },
        categoryTrends: [],
        spendingPatterns: { weeklyPattern: [], monthlyPattern: [], seasonalPattern: [{ season: 'unknown', averageAmount: 0, trend: 'stable' as const }] },
        insights: [],
        methodology: { algorithm: 'linear_regression' as const, parameters: {}, accuracy: 0.8 },
      };

      const mockQuery = { userId: 'user123', startDate: new Date(), endDate: new Date() };

      const insights = await (service as any).generateComprehensiveInsights(
        mockSpendingPrediction,
        mockAnomalyDetection,
        mockFinancialForecast,
        mockTrendAnalysis,
        mockQuery
      );

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
    });

    it('should extract trends correctly', () => {
      const mockTrendAnalysis = {
        categoryTrends: [
          {
            categoryId: 'cat1',
            categoryName: 'Food',
            trend: { direction: 'increasing', strength: 'moderate', confidence: 0.7 },
          },
        ],
      };

      const trends = (service as any).extractTrends(mockTrendAnalysis);

      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);
      expect(trends.length).toBe(1);
      expect(trends[0].categoryId).toBe('cat1');
      expect(trends[0].categoryName).toBe('Food');
      expect(trends[0].trend).toBe('increasing');
    });

    it('should extract risks correctly', () => {
      const mockAnomalyDetection = {
        summary: { criticalAnomalies: 1, totalAnomalies: 5 },
      };

      const mockFinancialForecast = {
        riskFactors: [
          {
            factor: 'income_volatility',
            impact: 'high',
            probability: 0.8,
            description: 'High income volatility',
            mitigation: 'Diversify income sources',
          },
        ],
      };

      const risks = (service as any).extractRisks(mockAnomalyDetection, mockFinancialForecast);

      expect(risks).toBeDefined();
      expect(Array.isArray(risks)).toBe(true);
      expect(risks.length).toBeGreaterThan(0);
    });

    it('should extract opportunities correctly', () => {
      const mockSpendingPrediction = {
        totalPredictedAmount: 1000,
        confidence: 'high' as const,
      };

      const mockFinancialForecast = {
        baseScenario: { projectedSavings: 500 },
      };

      const opportunities = (service as any).extractOpportunities(mockSpendingPrediction, mockFinancialForecast);

      expect(opportunities).toBeDefined();
      expect(Array.isArray(opportunities)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined query parameters', async () => {
      const invalidQuery = {
        userId: 'user123',
        startDate: null as any,
        endDate: undefined as any,
      };

      await expect(service.getPredictiveInsights(invalidQuery as any)).rejects.toThrow();
    });

    it('should handle empty results from services', async () => {
      const mockQuery = {
        userId: 'user123',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      const emptySpendingPrediction = {
        period: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        predictions: [],
        totalPredictedAmount: 0,
        averageDailyPrediction: 0,
        confidence: 'low' as const,
        methodology: 'linear_regression' as const,
        accuracy: { historicalAccuracy: 0, lastPredictionAccuracy: 0, trendAccuracy: 0 },
        riskFactors: [],
      };

      const emptyAnomalyDetection = {
        period: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        anomalies: [],
        summary: { totalAnomalies: 0, criticalAnomalies: 0, highSeverityAnomalies: 0, averageConfidence: 0, detectionAccuracy: 0 },
        model: { algorithm: 'hybrid' as const, parameters: {}, trainingDataSize: 0, lastTrained: new Date() },
      };

      const emptyFinancialForecast = {
        forecastPeriod: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        baseScenario: { projectedIncome: 0, projectedExpenses: 0, projectedNetWorth: 0, projectedSavings: 0, confidence: 'low' as const },
        scenarios: [],
        categoryForecasts: [],
        monthlyProjections: [],
        riskFactors: [],
        methodology: { algorithm: 'arima' as const, parameters: {}, trainingPeriod: { startDate: new Date(), endDate: new Date() }, accuracy: 0 },
      };

      const emptyTrendAnalysis = {
        analysisPeriod: { startDate: mockQuery.startDate, endDate: mockQuery.endDate },
        overallTrend: { direction: 'stable' as const, strength: 'weak' as const, confidence: 0, description: 'No trend' },
        categoryTrends: [],
        spendingPatterns: { weeklyPattern: [], monthlyPattern: [], seasonalPattern: [{ season: 'unknown', averageAmount: 0, trend: 'stable' as const }] },
        insights: [],
        methodology: { algorithm: 'linear_regression' as const, parameters: {}, accuracy: 0 },
      };

      mockSpendingPredictionService.predictSpending.mockResolvedValue(emptySpendingPrediction);
      mockAnomalyDetectionService.detectAnomalies.mockResolvedValue(emptyAnomalyDetection);
      mockFinancialForecastingService.generateFinancialForecast.mockResolvedValue(emptyFinancialForecast);
      mockTrendAnalysisService.analyzeTrends.mockResolvedValue(emptyTrendAnalysis);

      const result = await service.getPredictiveInsights(mockQuery);

      expect(result).toBeDefined();
      expect(result.summary.totalInsights).toBe(0);
      expect(result.insights).toEqual([]);
      expect(result.trends).toEqual([]);
      expect(result.risks).toEqual([]);
      expect(result.opportunities).toEqual([]);
    });
  });
});
