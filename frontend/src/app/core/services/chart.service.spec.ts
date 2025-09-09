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
});