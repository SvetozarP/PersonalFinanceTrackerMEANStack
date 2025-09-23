import { FinancialForecastingService } from '../../src/modules/financial/analytics/services/financial-forecasting.service';
import { TransactionRepository } from '../../src/modules/financial/transactions/repositories/transaction.repository';
import { CategoryRepository } from '../../src/modules/financial/categories/repositories/category.repository';
import { BudgetRepository } from '../../src/modules/financial/budgets/repositories/budget.repository';
import { TransactionType } from '../../src/modules/financial/transactions/interfaces/transaction.interface';
import { createMockTransactions, createMockCategories } from './test-utils';

// Mock the repositories
jest.mock('../../src/modules/financial/transactions/repositories/transaction.repository');
jest.mock('../../src/modules/financial/categories/repositories/category.repository');
jest.mock('../../src/modules/financial/budgets/repositories/budget.repository');
jest.mock('../../src/shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('FinancialForecastingService', () => {
  let service: FinancialForecastingService;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;
  let mockCategoryRepository: jest.Mocked<CategoryRepository>;
  let mockBudgetRepository: jest.Mocked<BudgetRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockTransactionRepository = {
      find: jest.fn(),
    } as any;

    mockCategoryRepository = {
      find: jest.fn(),
    } as any;

    mockBudgetRepository = {
      find: jest.fn(),
    } as any;

    // Mock the constructor dependencies
    (TransactionRepository as jest.Mock).mockImplementation(() => mockTransactionRepository);
    (CategoryRepository as jest.Mock).mockImplementation(() => mockCategoryRepository);
    (BudgetRepository as jest.Mock).mockImplementation(() => mockBudgetRepository);

    service = new FinancialForecastingService();
  });

  describe('generateFinancialForecast', () => {
    const mockQuery = {
      userId: 'user123',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-04-30'),
      categories: undefined,
      transactionTypes: undefined,
      accounts: undefined,
      includeRecurring: true,
      confidenceThreshold: 0.7,
      modelType: 'forecasting' as const,
      algorithm: undefined,
    };

    it('should generate comprehensive financial forecast with sufficient data', async () => {
      const mockTransactions = createMockTransactions(365, Array.from({ length: 365 }, (_, i) => ({
        amount: 100 + Math.random() * 50,
        date: new Date(Date.now() - (365 - i) * 24 * 60 * 60 * 1000),
        type: i % 3 === 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.generateFinancialForecast(mockQuery);

      expect(result).toBeDefined();
      expect(result.forecastPeriod).toEqual({
        startDate: mockQuery.startDate,
        endDate: mockQuery.endDate,
      });
      expect(result.baseScenario).toBeDefined();
      expect(result.baseScenario.projectedIncome).toBeGreaterThan(0);
      expect(result.baseScenario.projectedExpenses).toBeGreaterThan(0);
      expect(result.baseScenario.projectedNetWorth).toBeDefined();
      expect(result.baseScenario.projectedSavings).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(result.baseScenario.confidence);
      
      expect(result.scenarios).toBeDefined();
      expect(result.scenarios.length).toBe(3); // optimistic, realistic, pessimistic
      expect(result.scenarios[0].name).toBe('optimistic');
      expect(result.scenarios[1].name).toBe('realistic');
      expect(result.scenarios[2].name).toBe('pessimistic');
      
      expect(result.categoryForecasts).toBeDefined();
      expect(Array.isArray(result.categoryForecasts)).toBe(true);
      
      expect(result.monthlyProjections).toBeDefined();
      expect(Array.isArray(result.monthlyProjections)).toBe(true);
      
      expect(result.riskFactors).toBeDefined();
      expect(Array.isArray(result.riskFactors)).toBe(true);
      
      expect(result.methodology).toBeDefined();
      expect(result.methodology.algorithm).toBeDefined();
      expect(result.methodology.accuracy).toBeGreaterThan(0);
    });

    it('should throw error when insufficient historical data', async () => {
      const mockTransactions = createMockTransactions(10, Array.from({ length: 10 }, (_, i) => ({
        amount: 100,
        date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000),
        type: TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      await expect(service.generateFinancialForecast(mockQuery)).rejects.toThrow(
        'Insufficient historical data for accurate forecasting. Need at least 30 days of data.'
      );
    });

    it('should generate realistic scenarios with proper probabilities', async () => {
      const mockTransactions = createMockTransactions(365, Array.from({ length: 365 }, (_, i) => ({
        amount: 100 + Math.random() * 50,
        date: new Date(Date.now() - (365 - i) * 24 * 60 * 60 * 1000),
        type: i % 3 === 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.generateFinancialForecast(mockQuery);

      expect(result.scenarios).toBeDefined();
      expect(result.scenarios.length).toBe(3);
      
      const probabilities = result.scenarios.map(s => s.probability);
      const totalProbability = probabilities.reduce((sum, prob) => sum + prob, 0);
      expect(totalProbability).toBeCloseTo(1.0, 1);
      
      expect(probabilities[0]).toBe(0.2); // optimistic
      expect(probabilities[1]).toBe(0.6); // realistic
      expect(probabilities[2]).toBe(0.2); // pessimistic
    });

    it('should identify risk factors correctly', async () => {
      // Create data with high volatility
      const mockTransactions = createMockTransactions(365, Array.from({ length: 365 }, (_, i) => ({
        amount: 100 + Math.random() * 200, // High volatility
        date: new Date(Date.now() - (365 - i) * 24 * 60 * 60 * 1000),
        type: i % 3 === 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.generateFinancialForecast(mockQuery);

      expect(result.riskFactors).toBeDefined();
      expect(Array.isArray(result.riskFactors)).toBe(true);
      
      const incomeVolatilityRisk = result.riskFactors.find(r => r.factor === 'income_volatility');
      const expenseVolatilityRisk = result.riskFactors.find(r => r.factor === 'expense_volatility');
      
      expect(incomeVolatilityRisk || expenseVolatilityRisk).toBeDefined();
    });
  });

  describe('generateCashFlowPrediction', () => {
    const mockQuery = {
      userId: 'user123',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-29'),
      categories: undefined,
      transactionTypes: undefined,
      accounts: undefined,
      includeRecurring: true,
      confidenceThreshold: 0.7,
      modelType: 'forecasting' as const,
      algorithm: undefined,
    };

    it('should generate cash flow prediction with sufficient data', async () => {
      const mockTransactions = createMockTransactions(90, Array.from({ length: 90 }, (_, i) => ({
        amount: 100 + Math.random() * 50,
        date: new Date(Date.now() - (90 - i) * 24 * 60 * 60 * 1000),
        type: i % 3 === 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.generateCashFlowPrediction(mockQuery);

      expect(result).toBeDefined();
      expect(result.predictionPeriod).toEqual({
        startDate: mockQuery.startDate,
        endDate: mockQuery.endDate,
      });
      expect(result.currentBalance).toBeDefined();
      expect(result.predictions).toBeDefined();
      expect(result.predictions.projectedInflows).toBeGreaterThan(0);
      expect(result.predictions.projectedOutflows).toBeGreaterThan(0);
      expect(result.predictions.projectedNetCashFlow).toBeDefined();
      expect(result.predictions.projectedEndingBalance).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(result.predictions.confidence);
      
      expect(result.monthlyProjections).toBeDefined();
      expect(Array.isArray(result.monthlyProjections)).toBe(true);
      
      expect(result.categoryProjections).toBeDefined();
      expect(Array.isArray(result.categoryProjections)).toBe(true);
      
      expect(result.riskFactors).toBeDefined();
      expect(Array.isArray(result.riskFactors)).toBe(true);
      
      expect(result.scenarios).toBeDefined();
      expect(result.scenarios.length).toBe(3);
      
      expect(result.methodology).toBeDefined();
      expect(result.methodology.algorithm).toBeDefined();
      expect(result.methodology.accuracy).toBeGreaterThan(0);
    });

    it('should throw error when insufficient historical data for cash flow', async () => {
      const mockTransactions = createMockTransactions(10, Array.from({ length: 10 }, (_, i) => ({
        amount: 100,
        date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000),
        type: TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      await expect(service.generateCashFlowPrediction(mockQuery)).rejects.toThrow(
        'Insufficient historical data for accurate cash flow prediction. Need at least 30 days of data.'
      );
    });

    it('should generate scenarios with proper probabilities', async () => {
      const mockTransactions = createMockTransactions(90, Array.from({ length: 90 }, (_, i) => ({
        amount: 100 + Math.random() * 50,
        date: new Date(Date.now() - (90 - i) * 24 * 60 * 60 * 1000),
        type: i % 3 === 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.generateCashFlowPrediction(mockQuery);

      expect(result.scenarios).toBeDefined();
      expect(result.scenarios.length).toBe(3);
      
      const probabilities = result.scenarios.map(s => s.probability);
      const totalProbability = probabilities.reduce((sum, prob) => sum + prob, 0);
      expect(totalProbability).toBeCloseTo(1.0, 1);
    });
  });

  describe('private methods', () => {
    it('should group transactions by date correctly', () => {
      const transactions = [
        {
          _id: '1',
          amount: 100,
          date: new Date('2024-01-01'),
          type: TransactionType.INCOME,
        },
        {
          _id: '2',
          amount: 200,
          date: new Date('2024-01-01'),
          type: TransactionType.EXPENSE,
        },
        {
          _id: '3',
          amount: 150,
          date: new Date('2024-01-02'),
          type: TransactionType.INCOME,
        },
      ];

      const result = (service as any).groupTransactionsByDate(transactions);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: '2024-01-01',
        inflows: 100,
        outflows: 200,
        netFlow: -100,
      });
      expect(result[1]).toEqual({
        date: '2024-01-02',
        inflows: 150,
        outflows: 0,
        netFlow: 150,
      });
    });

    it('should calculate monthly average correctly', () => {
      const transactions = [
        { amount: 100, date: new Date('2024-01-01') },
        { amount: 200, date: new Date('2024-01-15') },
        { amount: 150, date: new Date('2024-02-01') },
      ];

      const result = (service as any).calculateMonthlyAverage(transactions);

      expect(result).toBeGreaterThan(0);
      expect(Number.isFinite(result)).toBe(true);
    });

    it('should calculate months difference correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-31');

      const result = (service as any).calculateMonthsDifference(startDate, endDate);

      expect(result).toBe(3);
    });

    it('should calculate consistency correctly', () => {
      const transactions = [
        { amount: 100 },
        { amount: 105 },
        { amount: 95 },
        { amount: 102 },
        { amount: 98 },
      ];

      const result = (service as any).calculateConsistency(transactions);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should detect seasonality correctly', () => {
      const transactions = Array.from({ length: 365 }, (_, i) => ({
        amount: 100 + Math.sin((i / 365) * 2 * Math.PI) * 50, // Seasonal pattern
      }));

      const result = (service as any).detectSeasonality(transactions);

      expect(typeof result).toBe('boolean');
    });

    it('should detect trend correctly', () => {
      const transactions = Array.from({ length: 30 }, (_, i) => ({
        amount: 100 + (i * 2), // Strong increasing trend
      }));

      const result = (service as any).detectTrend(transactions);

      expect(result).toBe(true);
    });

    it('should select best forecasting algorithm correctly', () => {
      const historicalData = {
        expenseTransactions: Array.from({ length: 100 }, (_, i) => ({
          amount: 100 + Math.sin((i / 100) * 2 * Math.PI) * 50 + (i * 0.5),
        })),
      };

      const result = (service as any).selectBestForecastingAlgorithm(historicalData);

      expect(['arima', 'exponential_smoothing', 'linear_regression', 'neural_network', 'hybrid']).toContain(result);
    });

    it('should calculate forecasting accuracy correctly', () => {
      const historicalData = {
        incomeTransactions: Array.from({ length: 30 }, () => ({ amount: 100 })),
        expenseTransactions: Array.from({ length: 30 }, () => ({ amount: 80 })),
      };

      const result = (service as any).calculateForecastingAccuracy(historicalData);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should calculate cash flow confidence correctly', () => {
      const historicalData = Array.from({ length: 30 }, (_, i) => ({
        netFlow: 100 + Math.random() * 20,
      }));

      const result = (service as any).calculateCashFlowConfidence(historicalData);

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    const mockQuery = {
      userId: 'user123',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-04-30'),
      categories: undefined,
      transactionTypes: undefined,
      accounts: undefined,
      includeRecurring: true,
      confidenceThreshold: 0.7,
      modelType: 'forecasting' as const,
      algorithm: undefined,
    };

    it('should handle empty transaction data', async () => {
      mockTransactionRepository.find.mockResolvedValue([]);

      await expect(service.generateFinancialForecast(mockQuery)).rejects.toThrow(
        'Insufficient historical data for accurate forecasting. Need at least 30 days of data.'
      );
    });

    it('should handle null/undefined query parameters', async () => {
      const invalidQuery = {
        userId: 'user123',
        startDate: null as any,
        endDate: undefined as any,
      };

      await expect(service.generateFinancialForecast(invalidQuery as any)).rejects.toThrow();
    });

    it('should handle very large amounts', async () => {
      const mockTransactions = createMockTransactions(365, Array.from({ length: 365 }, (_, i) => ({
        amount: 1000000 + Math.random() * 100000,
        date: new Date(Date.now() - (365 - i) * 24 * 60 * 60 * 1000),
        type: i % 3 === 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.generateFinancialForecast(mockQuery);

      expect(result).toBeDefined();
      expect(Number.isFinite(result.baseScenario.projectedIncome)).toBe(true);
      expect(Number.isFinite(result.baseScenario.projectedExpenses)).toBe(true);
    });

    it('should handle zero amounts', async () => {
      const mockTransactions = createMockTransactions(365, Array.from({ length: 365 }, (_, i) => ({
        amount: 0,
        date: new Date(Date.now() - (365 - i) * 24 * 60 * 60 * 1000),
        type: i % 3 === 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
      })));

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.generateFinancialForecast(mockQuery);

      expect(result).toBeDefined();
      expect(result.baseScenario.projectedIncome).toBe(0);
      expect(result.baseScenario.projectedExpenses).toBe(0);
    });

    it('should handle single transaction', async () => {
      const mockTransactions = createMockTransactions(1, [{
        amount: 100,
        date: new Date('2024-01-01'),
        type: TransactionType.EXPENSE,
      }]);

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      await expect(service.generateFinancialForecast(mockQuery)).rejects.toThrow(
        'Insufficient historical data for accurate forecasting. Need at least 30 days of data.'
      );
    });
  });
});
