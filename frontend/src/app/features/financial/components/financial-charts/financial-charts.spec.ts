import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { FinancialChartsComponent } from './financial-charts';
import { ChartService } from '../../../../core/services/chart.service';
import { SharedChartService } from '../../../../shared/chart/chart.service';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  FinancialDashboard
} from '../../../../core/models/financial.model';

// Mock Chart.js
const mockChart = {
  destroy: jasmine.createSpy('destroy'),
  update: jasmine.createSpy('update'),
  resize: jasmine.createSpy('resize'),
  canvas: {
    toDataURL: jasmine.createSpy('toDataURL').and.returnValue('data:image/png;base64,mock')
  },
  width: 400,
  height: 300
};

// Mock Chart.js module
const mockChartJS = {
  Chart: {
    register: jasmine.createSpy('register'),
    getChart: jasmine.createSpy('getChart').and.returnValue(mockChart)
  },
  __esModule: true,
  default: jasmine.createSpy('Chart').and.returnValue(mockChart)
};

// Mock the module
(window as any).Chart = mockChart;

describe('FinancialChartsComponent', () => {
  let component: FinancialChartsComponent;
  let fixture: ComponentFixture<FinancialChartsComponent>;
  let mockChartService: jasmine.SpyObj<ChartService>;
  let mockSharedChartService: jasmine.SpyObj<SharedChartService>;

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

  const mockDashboard: FinancialDashboard = {
    overview: {
      totalBalance: 10000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      monthlyNet: 2000,
      pendingTransactions: 0,
      upcomingRecurring: 0
    },
    recentTransactions: mockTransactions,
    spendingTrends: [],
    budgetStatus: [],
    topCategories: []
  };

  beforeEach(async () => {
    const chartServiceSpy = jasmine.createSpyObj('ChartService', [
      'generateExpenseTrendChart',
      'generateIncomeTrendChart',
      'generateCategorySpendingChart',
      'generateNetIncomeTrendChart',
      'generateSavingsRateChart',
      'generateIncomeExpenseScatter',
      'getChartOptions',
      'exportChartDataToCSV',
      'exportChartAsImage'
    ]);

    const sharedChartServiceSpy = jasmine.createSpyObj('SharedChartService', [
      'createChart'
    ]);

    await TestBed.configureTestingModule({
      imports: [FinancialChartsComponent, FormsModule],
      providers: [
        { provide: ChartService, useValue: chartServiceSpy },
        { provide: SharedChartService, useValue: sharedChartServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialChartsComponent);
    component = fixture.componentInstance;
    mockChartService = TestBed.inject(ChartService) as jasmine.SpyObj<ChartService>;
    mockSharedChartService = TestBed.inject(SharedChartService) as jasmine.SpyObj<SharedChartService>;
    
    // Initialize the component's chart options
    component.chartOptions = mockChartService.getChartOptions('line');
    component.barChartOptions = mockChartService.getChartOptions('bar');
    component.pieChartOptions = mockChartService.getChartOptions('pie');
    component.scatterChartOptions = mockChartService.getChartOptions('scatter');
    
    // Force the component to reinitialize its chart options
    component.ngOnInit();

    // Setup default mock returns
    mockChartService.generateExpenseTrendChart.and.returnValue({
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [{ label: 'Expenses', data: [100, 200, 150] }]
    });
    mockChartService.generateIncomeTrendChart.and.returnValue({
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [{ label: 'Income', data: [5000, 5000, 5000] }]
    });
    mockChartService.generateCategorySpendingChart.and.returnValue({
      labels: ['Food', 'Transport'],
      datasets: [{ label: 'Spending', data: [300, 200] }]
    });
    mockChartService.generateNetIncomeTrendChart.and.returnValue({
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [
        { label: 'Net Income', data: [4900, 4800, 4850] },
        { label: 'Income', data: [5000, 5000, 5000] },
        { label: 'Expenses', data: [100, 200, 150] }
      ]
    });
    mockChartService.generateSavingsRateChart.and.returnValue({
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [{ label: 'Savings Rate', data: [98, 96, 97] }]
    });
    mockChartService.generateIncomeExpenseScatter.and.returnValue({
      labels: ['Jan', 'Feb', 'Mar'],
      datasets: [{ label: 'Income vs Expenses', data: [100, 200, 150] }]
    });
    mockChartService.getChartOptions.and.returnValue({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' as const, labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
        tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: 'white', bodyColor: 'white', borderColor: 'rgba(255, 255, 255, 0.2)', borderWidth: 1, cornerRadius: 8, displayColors: true }
      }
    });
    (mockChartService as any)['calculateCategorySpending'] = jasmine.createSpy('calculateCategorySpending').and.returnValue([
      { name: 'Food & Dining', value: 300 },
      { name: 'Transportation', value: 200 }
    ]);
    mockSharedChartService.createChart.and.returnValue(mockChart as any);
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.transactions).toEqual([]);
      expect(component.categories).toEqual([]);
      expect(component.dashboard).toBeNull();
      expect(component.period).toBe('month');
      expect(component.showCharts).toBe(true);
    });

    it('should call initializeCharts on ngOnInit', () => {
      spyOn(component, 'updateCharts' as any);
      component.ngOnInit();
      expect(component['updateCharts']).toHaveBeenCalled();
    });
  });

  describe('Input Changes', () => {
    it('should update charts when transactions change', () => {
      spyOn(component, 'updateCharts' as any);
      component.transactions = mockTransactions;
      component.ngOnChanges({
        transactions: {
          currentValue: mockTransactions,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component['updateCharts']).toHaveBeenCalled();
    });

    it('should update charts when categories change', () => {
      spyOn(component, 'updateCharts' as any);
      component.categories = mockCategories;
      component.ngOnChanges({
        categories: {
          currentValue: mockCategories,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component['updateCharts']).toHaveBeenCalled();
    });

    it('should update charts when dashboard changes', () => {
      spyOn(component, 'updateCharts' as any);
      component.dashboard = mockDashboard;
      component.ngOnChanges({
        dashboard: {
          currentValue: mockDashboard,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component['updateCharts']).toHaveBeenCalled();
    });

    it('should update charts when period changes', () => {
      spyOn(component, 'updateCharts' as any);
      component.period = 'year';
      component.ngOnChanges({
        period: {
          currentValue: 'year',
          previousValue: 'month',
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component['updateCharts']).toHaveBeenCalled();
    });

    it('should not update charts when other properties change', () => {
      spyOn(component, 'updateCharts' as any);
      component.ngOnChanges({
        showCharts: {
          currentValue: false,
          previousValue: true,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component['updateCharts']).not.toHaveBeenCalled();
    });
  });

  describe('Chart Data Generation', () => {
    beforeEach(() => {
      component.transactions = mockTransactions;
      component.categories = mockCategories;
    });

    it('should generate expense chart data', () => {
      component['generateExpenseChart']();
      expect(component.expenseChartData).toBeDefined();
      expect(mockChartService.generateExpenseTrendChart).toHaveBeenCalledWith(mockTransactions, 'month');
    });

    it('should generate income chart data', () => {
      component['generateIncomeChart']();
      expect(component.incomeChartData).toBeDefined();
      expect(mockChartService.generateIncomeTrendChart).toHaveBeenCalledWith(mockTransactions, 'month');
    });

    it('should generate category chart data', () => {
      component['generateCategoryChart']();
      expect(component.categoryChartData).toBeDefined();
      expect(mockChartService.generateCategorySpendingChart).toHaveBeenCalledWith(mockTransactions, mockCategories);
    });

    it('should generate trend chart data', () => {
      component['generateTrendChart']();
      expect(component.trendChartData).toBeDefined();
      expect(mockChartService.generateNetIncomeTrendChart).toHaveBeenCalledWith(mockTransactions, 'month');
    });

    it('should generate savings chart data', () => {
      component['generateSavingsChart']();
      expect(component.savingsChartData).toBeDefined();
      expect(mockChartService.generateSavingsRateChart).toHaveBeenCalledWith(mockTransactions, 'month');
    });

    it('should generate scatter chart data', () => {
      component['generateScatterChart']();
      expect(component.scatterChartData).toBeDefined();
      expect(mockChartService.generateIncomeExpenseScatter).toHaveBeenCalledWith(mockTransactions);
    });
  });

  describe('Chart Creation', () => {
    beforeEach(() => {
      // Mock ViewChild elements
      component.expenseChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.incomeChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.categoryChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.trendChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.savingsChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.scatterChartRef = { nativeElement: document.createElement('canvas') } as any;
    });

    it('should create chart when data is available', () => {
      const mockData = {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Test', data: [100, 200] }]
      };
      component['createChart']('expense', mockData, 'line');
      expect(mockSharedChartService.createChart).toHaveBeenCalled();
    });

    it('should not create chart when data is null', () => {
      component['createChart']('expense', null as any, 'line');
      expect(mockSharedChartService.createChart).not.toHaveBeenCalled();
    });

    it('should not create chart when data has no labels', () => {
      const mockData = {
        labels: [],
        datasets: [{ label: 'Test', data: [100, 200] }]
      };
      component['createChart']('expense', mockData, 'line');
      expect(mockSharedChartService.createChart).not.toHaveBeenCalled();
    });

    it('should not create chart when canvas ref is null', () => {
      component.expenseChartRef = null as any;
      const mockData = {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Test', data: [100, 200] }]
      };
      component['createChart']('expense', mockData, 'line');
      expect(mockSharedChartService.createChart).not.toHaveBeenCalled();
    });

    it('should destroy existing chart before creating new one', () => {
      (component as any).expenseChart = mockChart as any;
      const mockData = {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Test', data: [100, 200] }]
      };
      component['createChart']('expense', mockData, 'line');
      expect(mockChart.destroy).toHaveBeenCalled();
    });


    it('should return correct chart options for line type', () => {
      const options = component['getChartOptionsForType']('line');
      expect(options).toBe(component.chartOptions);
    });

    it('should return correct chart options for bar type', () => {
      const options = component['getChartOptionsForType']('bar');
      expect(options).toBe(component.barChartOptions);
    });

    it('should return correct chart options for pie type', () => {
      const options = component['getChartOptionsForType']('pie');
      expect(options).toBe(component.pieChartOptions);
    });

    it('should return correct chart options for doughnut type', () => {
      const options = component['getChartOptionsForType']('doughnut');
      expect(options).toBe(component.pieChartOptions);
    });

    it('should return correct chart options for scatter type', () => {
      const options = component['getChartOptionsForType']('scatter');
      expect(options).toBe(component.scatterChartOptions);
    });

    it('should return default chart options for unknown type', () => {
      const options = component['getChartOptionsForType']('unknown' as any);
      expect(options).toBe(component.chartOptions);
    });
  });

  describe('Canvas Reference Methods', () => {
    beforeEach(() => {
      component.expenseChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.incomeChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.categoryChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.trendChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.savingsChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.scatterChartRef = { nativeElement: document.createElement('canvas') } as any;
    });

    it('should get expense canvas ref', () => {
      const result = component['getCanvasRef']('expense');
      expect(result).toBeTruthy();
    });

    it('should get income canvas ref', () => {
      const result = component['getCanvasRef']('income');
      expect(result).toBeTruthy();
    });

    it('should get category canvas ref', () => {
      const result = component['getCanvasRef']('category');
      expect(result).toBeTruthy();
    });

    it('should get trend canvas ref', () => {
      const result = component['getCanvasRef']('trend');
      expect(result).toBeTruthy();
    });

    it('should get savings canvas ref', () => {
      const result = component['getCanvasRef']('savings');
      expect(result).toBeTruthy();
    });

    it('should get scatter canvas ref', () => {
      const result = component['getCanvasRef']('scatter');
      expect(result).toBeTruthy();
    });

    it('should return null for unknown chart type', () => {
      const result = component['getCanvasRef']('unknown');
      expect(result).toBeNull();
    });

    it('should return null when canvas ref is null', () => {
      component.expenseChartRef = null as any;
      const result = component['getCanvasRef']('expense');
      expect(result).toBeNull();
    });
  });

  describe('Chart Instance Management', () => {
    beforeEach(() => {
      (component as any).expenseChart = mockChart as any;
      (component as any).incomeChart = mockChart as any;
    });

    it('should get expense chart instance', () => {
      const result = component['getChartInstance']('expense');
      expect(result).toBe(mockChart as any);
    });

    it('should get income chart instance', () => {
      const result = component['getChartInstance']('income');
      expect(result).toBe(mockChart as any);
    });

    it('should return null for unknown chart type', () => {
      const result = component['getChartInstance']('unknown');
      expect(result).toBeNull();
    });

    it('should set expense chart instance', () => {
      const newChart = { ...mockChart };
      component['setChartInstance']('expense', newChart as any);
      expect((component as any).expenseChart).toBe(newChart);
    });

    it('should set income chart instance', () => {
      const newChart = { ...mockChart };
      component['setChartInstance']('income', newChart as any);
      expect((component as any).incomeChart).toBe(newChart);
    });
  });

  describe('Financial Metrics Calculation', () => {
    beforeEach(() => {
      component.transactions = mockTransactions;
      component.categories = mockCategories;
    });

    it('should calculate financial metrics correctly', () => {
      component['calculateFinancialMetrics']();
      expect(component.financialMetrics).toBeDefined();
      expect(component.financialMetrics?.totalIncome).toBe(5000);
      expect(component.financialMetrics?.totalExpenses).toBe(150);
      expect(component.financialMetrics?.netIncome).toBe(4850);
      expect(component.financialMetrics?.savingsRate).toBe(97);
    });

    it('should handle zero income in savings rate calculation', () => {
      component.transactions = mockTransactions.filter(t => t.type === TransactionType.EXPENSE);
      component['calculateFinancialMetrics']();
      expect(component.financialMetrics?.savingsRate).toBe(0);
    });

    it('should handle empty category data', () => {
      (mockChartService as any)['calculateCategorySpending'].and.returnValue([]);
      component['calculateFinancialMetrics']();
      expect(component.financialMetrics?.topCategory).toBe('None');
      expect(component.financialMetrics?.topCategoryAmount).toBe(0);
    });
  });

  describe('Chart Interaction', () => {
    it('should handle chart click events', () => {
      spyOn(console, 'log');
      const mockEvent = { target: 'test' };
      component.onChartClick(mockEvent);
      expect(console.log).toHaveBeenCalledWith('Chart clicked:', mockEvent);
    });

    it('should handle chart hover events', () => {
      const mockEvent = { target: 'test' };
      expect(() => component.onChartHover(mockEvent)).not.toThrow();
    });
  });

  describe('Export Functionality', () => {
    it('should export chart data as CSV when data is available', () => {
      component.expenseChartData = {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Expenses', data: [100, 200] }]
      };
      
      component.exportChartData();
      expect(mockChartService.exportChartDataToCSV).toHaveBeenCalled();
    });

    it('should not export chart data when data is null', () => {
      component.expenseChartData = null;
      component.exportChartData();
      expect(mockChartService.exportChartDataToCSV).not.toHaveBeenCalled();
    });

    it('should export chart as image when canvas ref is available', () => {
      component.expenseChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.exportChartAsImage('expense');
      expect(mockChartService.exportChartAsImage).toHaveBeenCalled();
    });

    it('should not export chart as image when canvas ref is null', () => {
      component.expenseChartRef = null as any;
      component.exportChartAsImage('expense');
      expect(mockChartService.exportChartAsImage).not.toHaveBeenCalled();
    });
  });

  describe('Chart Refresh', () => {
    it('should refresh charts', () => {
      spyOn(component, 'updateCharts' as any);
      component.refreshCharts();
      expect(component['updateCharts']).toHaveBeenCalled();
    });

    it('should change period and update charts', () => {
      spyOn(component, 'updateCharts' as any);
      component.onPeriodChange('year');
      expect(component.period).toBe('year');
      expect(component['updateCharts']).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty transactions gracefully', () => {
      component.transactions = [];
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle null transactions gracefully', () => {
      component.transactions = null as any;
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle non-array transactions gracefully', () => {
      component.transactions = 'invalid' as any;
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should not update charts when transactions are invalid', () => {
      spyOn(component, 'generateExpenseChart' as any);
      spyOn(component, 'generateIncomeChart' as any);
      spyOn(component, 'generateCategoryChart' as any);
      spyOn(component, 'generateTrendChart' as any);
      spyOn(component, 'generateSavingsChart' as any);
      spyOn(component, 'generateScatterChart' as any);
      spyOn(component, 'calculateFinancialMetrics' as any);
      
      component.transactions = [];
      component['updateCharts']();
      
      expect(component['generateExpenseChart']).not.toHaveBeenCalled();
      expect(component['generateIncomeChart']).not.toHaveBeenCalled();
      expect(component['generateCategoryChart']).not.toHaveBeenCalled();
      expect(component['generateTrendChart']).not.toHaveBeenCalled();
      expect(component['generateSavingsChart']).not.toHaveBeenCalled();
      expect(component['generateScatterChart']).not.toHaveBeenCalled();
      expect(component['calculateFinancialMetrics']).not.toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should complete destroy subject on ngOnDestroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('Template Integration', () => {
    it('should render chart containers when data is available', () => {
      component.expenseChartData = {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Expenses', data: [100, 200] }]
      };
      
      fixture.detectChanges();
      
      const chartContainer = fixture.nativeElement.querySelector('[data-chart="expense"]');
      expect(chartContainer).toBeTruthy();
    });

    it('should show no data state when no charts are available', () => {
      component.expenseChartData = null;
      component.incomeChartData = null;
      component.categoryChartData = null;
      component.trendChartData = null;
      
      fixture.detectChanges();
      
      const noDataState = fixture.nativeElement.querySelector('.no-data-state');
      expect(noDataState).toBeTruthy();
    });

    it('should show loading state when transactions are empty', () => {
      component.transactions = [];
      fixture.detectChanges();
      
      const loadingState = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingState).toBeTruthy();
    });
  });

  describe('Financial Metrics Display', () => {
    beforeEach(() => {
      component.financialMetrics = {
        totalIncome: 5000,
        totalExpenses: 3000,
        netIncome: 2000,
        savingsRate: 40,
        averageMonthlyIncome: 416.67,
        averageMonthlyExpenses: 250,
        topCategory: 'Food',
        topCategoryAmount: 1500
      };
    });

    it('should display financial metrics when available', () => {
      fixture.detectChanges();
      
      const metricsContainer = fixture.nativeElement.querySelector('.metrics-summary');
      expect(metricsContainer).toBeTruthy();
    });

    it('should apply correct CSS classes for positive net income', () => {
      fixture.detectChanges();
      
      const netIncomeCard = fixture.nativeElement.querySelector('.metric-card.positive');
      expect(netIncomeCard).toBeTruthy();
    });

    it('should apply correct CSS classes for savings rate', () => {
      fixture.detectChanges();
      
      const savingsCard = fixture.nativeElement.querySelector('.metric-card.positive');
      expect(savingsCard).toBeTruthy();
    });
  });
});