import { TestBed } from '@angular/core/testing';
import { ChartConfigService } from './chart-config.service';
import { ChartService } from './chart.service';
import { ChartStylesService } from './chart-styles.service';
import { ChartInteractionService } from './chart-interaction.service';
import { ChartExportService } from './chart-export.service';
import { Transaction, TransactionType, Category } from '../models/financial.model';

describe('ChartConfigService', () => {
  let service: ChartConfigService;
  let mockChartService: jasmine.SpyObj<ChartService>;
  let mockStylesService: jasmine.SpyObj<ChartStylesService>;
  let mockInteractionService: jasmine.SpyObj<ChartInteractionService>;
  let mockExportService: jasmine.SpyObj<ChartExportService>;

  const mockTransactions: Transaction[] = [
    {
      _id: '1',
      title: 'Test transaction',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: 'completed' as any,
      categoryId: '1',
      tags: [],
      date: new Date('2024-01-01'),
      timezone: 'UTC',
      paymentMethod: 'cash' as any,
      isRecurring: false,
      recurrencePattern: 'none' as any,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'account1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    }
  ];

  const mockCategories: Category[] = [
    {
      _id: '1',
      name: 'Food',
      color: '#FF6384',
      path: ['Food'],
      level: 0,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    const chartServiceSpy = jasmine.createSpyObj('ChartService', [
      'generateExpenseTrendChart',
      'generateIncomeTrendChart',
      'generateCategorySpendingChart',
      'generateNetIncomeTrendChart',
      'generateSavingsRateChart',
      'generateIncomeExpenseScatter',
      'getChartOptions'
    ]);
    
    const stylesServiceSpy = jasmine.createSpyObj('ChartStylesService', [
      'getCurrentTheme',
      'getThemeColors',
      'getResponsiveChartConfig',
      'getCurrentChartOptions'
    ]);
    
    const interactionServiceSpy = jasmine.createSpyObj('ChartInteractionService', [
      'createInteractiveChart',
      'addZoomControls',
      'addDrillDownBreadcrumb',
      'enableRealTimeUpdates',
      'addExportControls',
      'addFullscreenControl'
    ]);
    
    const exportServiceSpy = jasmine.createSpyObj('ChartExportService', [
      'exportChartAsImage',
      'exportChartAsCSV',
      'exportChartAsPDF'
    ]);

    TestBed.configureTestingModule({
      providers: [
        ChartConfigService,
        { provide: ChartService, useValue: chartServiceSpy },
        { provide: ChartStylesService, useValue: stylesServiceSpy },
        { provide: ChartInteractionService, useValue: interactionServiceSpy },
        { provide: ChartExportService, useValue: exportServiceSpy }
      ]
    });

    service = TestBed.inject(ChartConfigService);
    mockChartService = TestBed.inject(ChartService) as jasmine.SpyObj<ChartService>;
    mockStylesService = TestBed.inject(ChartStylesService) as jasmine.SpyObj<ChartStylesService>;
    mockInteractionService = TestBed.inject(ChartInteractionService) as jasmine.SpyObj<ChartInteractionService>;
    mockExportService = TestBed.inject(ChartExportService) as jasmine.SpyObj<ChartExportService>;

    // Setup mock return values
    mockChartService.generateExpenseTrendChart.and.returnValue({
      labels: ['Jan', 'Feb'],
      datasets: [{ label: 'Expenses', data: [100, 200] }]
    });
    mockChartService.generateIncomeTrendChart.and.returnValue({
      labels: ['Jan', 'Feb'],
      datasets: [{ label: 'Income', data: [500, 600] }]
    });
    mockChartService.generateCategorySpendingChart.and.returnValue({
      labels: ['Food', 'Transport'],
      datasets: [{ label: 'Spending', data: [100, 50] }]
    });
    mockChartService.generateNetIncomeTrendChart.and.returnValue({
      labels: ['Jan', 'Feb'],
      datasets: [
        { label: 'Net Income', data: [400, 500] },
        { label: 'Income', data: [500, 600] },
        { label: 'Expenses', data: [100, 100] }
      ]
    });
    mockChartService.generateIncomeExpenseScatter.and.returnValue({
      labels: ['Jan', 'Feb'],
      datasets: [{ label: 'Income vs Expenses', data: [{ x: 500, y: 100 }, { x: 600, y: 100 }] }]
    });
    mockChartService.getChartOptions.and.returnValue({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#fff',
          borderWidth: 1,
          cornerRadius: 4,
          displayColors: true
        }
      }
    });

    mockStylesService.getCurrentTheme.and.returnValue('light' as any);
    mockStylesService.getResponsiveChartConfig.and.returnValue({
      responsive: true,
      maintainAspectRatio: false
    } as any);
    mockStylesService.getCurrentChartOptions.and.returnValue({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#fff',
          borderWidth: 1,
          cornerRadius: 4,
          displayColors: true
        }
      }
    } as any);

    mockInteractionService.createInteractiveChart.and.returnValue({
      type: 'line',
      data: { labels: [], datasets: [] },
      options: { responsive: true }
    });
  });

  describe('Service Creation', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('Financial Chart Configuration', () => {
    it('should create expense chart configuration', () => {
      const config = service.createFinancialChartConfig('expense', mockTransactions);
      
      expect(config).toBeDefined();
      expect(config.type).toBe('line');
      expect(config.data).toBeDefined();
      expect(config.options).toBeDefined();
      expect(mockChartService.generateExpenseTrendChart).toHaveBeenCalledWith(mockTransactions);
    });

    it('should create income chart configuration', () => {
      const config = service.createFinancialChartConfig('income', mockTransactions);
      
      expect(config).toBeDefined();
      expect(config.type).toBe('line');
      expect(mockChartService.generateIncomeTrendChart).toHaveBeenCalledWith(mockTransactions);
    });

    it('should create category chart configuration', () => {
      const config = service.createFinancialChartConfig('category', mockTransactions);
      
      expect(config).toBeDefined();
      expect(config.type).toBe('doughnut');
      expect(mockChartService.generateCategorySpendingChart).toHaveBeenCalledWith(mockTransactions, []);
    });
  });

  describe('Dashboard Chart Configuration', () => {
    it('should create balance chart configuration', () => {
      const config = service.createDashboardChartConfig('balance', mockTransactions);
      
      expect(config).toBeDefined();
      expect(config.type).toBe('line');
      expect(config.data).toBeDefined();
    });

    it('should create income vs expense chart configuration', () => {
      const config = service.createDashboardChartConfig('incomeExpense', mockTransactions);
      
      expect(config).toBeDefined();
      expect(config.type).toBe('bar');
      expect(config.data).toBeDefined();
    });
  });

  describe('Advanced Chart Configuration', () => {
    it('should create heatmap chart configuration', () => {
      const config = service.createAdvancedChartConfig('heatmap', mockTransactions);
      
      expect(config).toBeDefined();
      expect(config.type).toBe('bar');
      expect(config.data).toBeDefined();
    });

    it('should create gauge chart configuration', () => {
      const config = service.createAdvancedChartConfig('gauge', mockTransactions);
      
      expect(config).toBeDefined();
      expect(config.type).toBe('doughnut');
      expect(config.data).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid chart type', () => {
      const config = service.createFinancialChartConfig('invalid' as any, mockTransactions);
      
      expect(config).toBeDefined();
      expect(config.type).toBe('line'); // Default fallback
    });

    it('should handle empty transactions', () => {
      const config = service.createFinancialChartConfig('expense', []);
      
      expect(config).toBeDefined();
      expect(config.data).toBeDefined();
    });
  });
});