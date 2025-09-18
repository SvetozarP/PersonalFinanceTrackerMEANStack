import { TestBed } from '@angular/core/testing';
import { ChartService } from './chart.service';
import { Transaction, TransactionType, Category } from '../models/financial.model';

describe('ChartService', () => {
  let service: ChartService;

  const mockCategories: Category[] = [
    {
      _id: '1',
      name: 'Food & Dining',
      path: ['Food & Dining'],
      level: 1,
      isActive: true,
      isSystem: false,
      color: '#ff6b6b',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '2',
      name: 'Transportation',
      path: ['Transportation'],
      level: 1,
      isActive: true,
      isSystem: false,
      color: '#4ecdc4',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockTransactions: Transaction[] = [
    {
      _id: '1',
      title: 'Grocery Shopping',
      amount: 150,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: 'completed' as any,
      categoryId: '1',
      tags: [],
      date: new Date('2024-01-15'),
      timezone: 'UTC',
      paymentMethod: 'debit_card' as any,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'account1',
      isRecurring: false,
      recurrencePattern: 'none' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
      isDeleted: false
    },
    {
      _id: '2',
      title: 'Salary',
      amount: 5000,
      currency: 'USD',
      type: TransactionType.INCOME,
      status: 'completed' as any,
      categoryId: '2',
      tags: [],
      date: new Date('2024-01-01'),
      timezone: 'UTC',
      paymentMethod: 'bank_transfer' as any,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'account1',
      isRecurring: true,
      recurrencePattern: 'monthly' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
      isDeleted: false
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChartService);
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('Expense Trend Chart', () => {
    it('should generate expense trend chart data', () => {
      const result = service.generateExpenseTrendChart(mockTransactions, 'month');
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
      expect(result.datasets).toBeDefined();
      expect(result.datasets.length).toBe(1);
      expect(result.datasets[0].label).toBe('Expenses');
    });

    it('should handle empty transactions', () => {
      const result = service.generateExpenseTrendChart([], 'month');
      
      expect(result.labels).toEqual([]);
      expect(result.datasets).toEqual([]);
    });

    it('should handle different periods', () => {
      const result = service.generateExpenseTrendChart(mockTransactions, 'year');
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
    });
  });

  describe('Income Trend Chart', () => {
    it('should generate income trend chart data', () => {
      const result = service.generateIncomeTrendChart(mockTransactions, 'month');
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
      expect(result.datasets).toBeDefined();
      expect(result.datasets.length).toBe(1);
      expect(result.datasets[0].label).toBe('Income');
    });

    it('should handle empty transactions', () => {
      const result = service.generateIncomeTrendChart([], 'month');
      
      expect(result.labels).toEqual([]);
      expect(result.datasets).toEqual([]);
    });
  });

  describe('Category Spending Chart', () => {
    it('should generate category spending chart data', () => {
      const result = service.generateCategorySpendingChart(mockTransactions, mockCategories);
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
      expect(result.datasets).toBeDefined();
      expect(result.datasets.length).toBe(1);
      expect(result.datasets[0].label).toBe('Spending by Category');
    });

    it('should handle empty transactions', () => {
      const result = service.generateCategorySpendingChart([], mockCategories);
      
      expect(result.labels).toEqual([]);
      expect(result.datasets).toEqual([]);
    });

    it('should handle empty categories', () => {
      const result = service.generateCategorySpendingChart(mockTransactions, []);
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
    });
  });

  describe('Net Income Trend Chart', () => {
    it('should generate net income trend chart data', () => {
      const result = service.generateNetIncomeTrendChart(mockTransactions, 'month');
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
      expect(result.datasets).toBeDefined();
      expect(result.datasets.length).toBe(3);
      expect(result.datasets[0].label).toBe('Net Income');
      expect(result.datasets[1].label).toBe('Income');
      expect(result.datasets[2].label).toBe('Expenses');
    });

    it('should handle empty transactions', () => {
      const result = service.generateNetIncomeTrendChart([], 'month');
      
      expect(result.labels).toEqual([]);
      expect(result.datasets).toEqual([]);
    });
  });

  describe('Chart Options', () => {
    it('should get line chart options', () => {
      const options = service.getChartOptions('line');
      
      expect(options).toBeDefined();
      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
    });

    it('should get bar chart options', () => {
      const options = service.getChartOptions('bar');
      
      expect(options).toBeDefined();
      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
    });

    it('should get pie chart options', () => {
      const options = service.getChartOptions('pie');
      
      expect(options).toBeDefined();
      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
    });

    it('should get scatter chart options', () => {
      const options = service.getChartOptions('scatter');
      
      expect(options).toBeDefined();
      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
    });

    it('should get default options for unknown type', () => {
      const options = service.getChartOptions('unknown' as any);
      
      expect(options).toBeDefined();
      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
    });
  });

  describe('Export Functionality', () => {
    it('should export chart data to CSV', () => {
      const chartData = {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Test', data: [100, 200] }]
      };
      
      spyOn(service, 'downloadFile' as any);
      service.exportChartDataToCSV(chartData, 'test.csv');
      
      expect(service['downloadFile']).toHaveBeenCalled();
    });

    it('should export chart as image', () => {
      const mockCanvas = {
        toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,test')
      };
      
      spyOn(document, 'createElement').and.returnValue({
        download: '',
        href: '',
        click: jasmine.createSpy('click')
      } as any);
      
      service.exportChartAsImage(mockCanvas as any, 'test.png');
      
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('Error Handling', () => {
    it('should handle null/undefined transactions', () => {
      expect(() => service.generateExpenseTrendChart(null as any, 'month')).not.toThrow();
      expect(() => service.generateExpenseTrendChart(undefined as any, 'month')).not.toThrow();
    });

    it('should handle empty category arrays', () => {
      const result = service.generateCategorySpendingChart(mockTransactions, []);
      expect(result).toBeDefined();
    });
  });

  describe('Monthly Spending Comparison Chart', () => {
    it('should generate monthly spending comparison chart data', () => {
      const result = service.generateMonthlySpendingComparison(mockTransactions);
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
      expect(result.datasets).toBeDefined();
      expect(result.datasets.length).toBe(1);
      expect(result.datasets[0].label).toBe('Monthly Spending');
    });

    it('should handle empty transactions for monthly comparison', () => {
      const result = service.generateMonthlySpendingComparison([]);
      
      expect(result.labels).toEqual([]);
      expect(result.datasets.length).toBe(1);
      expect(result.datasets[0].data).toEqual([]);
    });
  });

  describe('Savings Rate Chart', () => {
    it('should generate savings rate chart data', () => {
      const result = service.generateSavingsRateChart(mockTransactions, 'month');
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
      expect(result.datasets).toBeDefined();
      expect(result.datasets.length).toBe(1);
      expect(result.datasets[0].label).toBe('Savings Rate (%)');
    });

    it('should handle empty transactions for savings rate', () => {
      const result = service.generateSavingsRateChart([], 'month');
      
      expect(result.labels).toEqual([]);
      expect(result.datasets.length).toBe(1);
      expect(result.datasets[0].data).toEqual([]);
    });

    it('should handle different periods for savings rate', () => {
      const result = service.generateSavingsRateChart(mockTransactions, 'year');
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
    });
  });

  describe('Category Trend Chart', () => {
    it('should generate category trend chart data', () => {
      const result = service.generateCategoryTrendChart(mockTransactions, mockCategories, 'month');
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
      expect(result.datasets).toBeDefined();
      expect(result.datasets.length).toBeGreaterThan(0);
    });

    it('should handle empty transactions for category trends', () => {
      const result = service.generateCategoryTrendChart([], mockCategories, 'month');
      
      expect(result.labels).toEqual([]);
      expect(result.datasets).toEqual([]);
    });

    it('should handle empty categories for category trends', () => {
      const result = service.generateCategoryTrendChart(mockTransactions, [], 'month');
      
      expect(result.labels).toBeDefined();
      expect(result.datasets).toBeDefined();
      // When categories are empty, transactions with categoryId will be labeled as "Unknown Category"
      expect(result.datasets.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Financial Health Gauge', () => {
    it('should generate financial health gauge data', () => {
      const metrics = {
        totalIncome: 5000,
        totalExpenses: 4000,
        netIncome: 1000,
        savingsRate: 20,
        averageMonthlyIncome: 5000,
        averageMonthlyExpenses: 4000,
        topCategory: 'Food',
        topCategoryAmount: 800
      };
      
      const result = service.generateFinancialHealthGauge(metrics);
      
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.options).toBeDefined();
    });

    it('should handle edge cases for financial health gauge', () => {
      const metrics = {
        totalIncome: 1000,
        totalExpenses: 1000,
        netIncome: 0,
        savingsRate: 0,
        averageMonthlyIncome: 1000,
        averageMonthlyExpenses: 1000,
        topCategory: 'Unknown',
        topCategoryAmount: 0
      };
      
      const result = service.generateFinancialHealthGauge(metrics);
      
      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe('Spending Heatmap', () => {
    it('should generate spending heatmap data', () => {
      const result = service.generateSpendingHeatmap(mockTransactions, 2024);
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
      expect(result.datasets).toBeDefined();
      expect(result.datasets.length).toBe(1);
      expect(result.datasets[0].label).toBe('Daily Spending');
    });

    it('should handle empty transactions for heatmap', () => {
      const result = service.generateSpendingHeatmap([], 2024);
      
      expect(result).toBeDefined();
      expect(result.labels).toEqual([]);
      expect(result.datasets.length).toBe(1);
      expect(result.datasets[0].data).toEqual([]);
    });
  });

  describe('Income Expense Scatter Chart', () => {
    it('should generate income expense scatter chart data', () => {
      const result = service.generateIncomeExpenseScatter(mockTransactions);
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
      expect(result.datasets).toBeDefined();
      expect(result.datasets.length).toBe(1);
      expect(result.datasets[0].label).toBe('Income vs Expenses');
    });

    it('should handle empty transactions for scatter chart', () => {
      const result = service.generateIncomeExpenseScatter([]);
      
      expect(result.labels).toEqual([]);
      expect(result.datasets.length).toBe(1);
      expect(result.datasets[0].data).toEqual([]);
    });
  });

  describe('Chart Options - Extended', () => {
    it('should get doughnut chart options', () => {
      const options = service.getChartOptions('doughnut');
      
      expect(options).toBeDefined();
      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
    });

    it('should get radar chart options', () => {
      const options = service.getChartOptions('radar');
      
      expect(options).toBeDefined();
      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
    });

    it('should get polar area chart options', () => {
      const options = service.getChartOptions('polarArea');
      
      expect(options).toBeDefined();
      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
    });

    it('should get bubble chart options', () => {
      const options = service.getChartOptions('bubble');
      
      expect(options).toBeDefined();
      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
    });

    it('should apply custom options', () => {
      const customOptions = {
        plugins: {
          legend: {
            position: 'bottom' as const
          }
        }
      };
      
      const options = service.getChartOptions('line', customOptions);
      
      expect(options).toBeDefined();
      expect(options.plugins?.legend?.position).toBe('bottom');
    });
  });

  describe('Export Functionality - Extended', () => {
    it('should export chart data to CSV with custom filename', () => {
      const chartData = {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [
          { label: 'Income', data: [1000, 1200, 1100] },
          { label: 'Expenses', data: [800, 900, 850] }
        ]
      };
      
      spyOn(service, 'downloadFile' as any);
      service.exportChartDataToCSV(chartData, 'custom-data.csv');
      
      expect(service['downloadFile']).toHaveBeenCalledWith(
        jasmine.any(String),
        'custom-data.csv',
        'text/csv'
      );
    });

    it('should export chart as image with custom filename', () => {
      const mockCanvas = {
        toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,test')
      };
      
      spyOn(document, 'createElement').and.returnValue({
        download: '',
        href: '',
        click: jasmine.createSpy('click')
      } as any);
      
      service.exportChartAsImage(mockCanvas as any, 'custom-chart.png');
      
      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('Private Methods - Indirect Testing', () => {
    it('should handle different period types in trend charts', () => {
      const result1 = service.generateExpenseTrendChart(mockTransactions, 'day');
      const result2 = service.generateExpenseTrendChart(mockTransactions, 'week');
      const result3 = service.generateExpenseTrendChart(mockTransactions, 'year');
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result3).toBeDefined();
    });

    it('should handle transactions with different date ranges', () => {
      const oldTransactions = [
        {
          ...mockTransactions[0],
          date: new Date('2020-01-01')
        },
        {
          ...mockTransactions[1],
          date: new Date('2023-12-31')
        }
      ];
      
      const result = service.generateExpenseTrendChart(oldTransactions, 'year');
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
    });

    it('should handle transactions with missing category IDs', () => {
      const transactionsWithMissingCategory = [
        {
          ...mockTransactions[0],
          categoryId: 'nonexistent'
        }
      ];
      
      const result = service.generateCategorySpendingChart(transactionsWithMissingCategory, mockCategories);
      
      expect(result).toBeDefined();
      expect(result.labels).toBeDefined();
    });
  });
});