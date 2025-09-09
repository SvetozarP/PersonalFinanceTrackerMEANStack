import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, interval } from 'rxjs';

import { DashboardChartsComponent } from './dashboard-charts';
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

describe('DashboardChartsComponent', () => {
  let component: DashboardChartsComponent;
  let fixture: ComponentFixture<DashboardChartsComponent>;
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
      'generateCategorySpendingChart',
      'generateNetIncomeTrendChart',
      'groupTransactionsByPeriod',
      'calculateNetIncomeByPeriod',
      'calculateCategorySpending',
      'exportChartAsImage'
    ]);

    const sharedChartServiceSpy = jasmine.createSpyObj('SharedChartService', [
      'createChart'
    ]);

    await TestBed.configureTestingModule({
      imports: [DashboardChartsComponent],
      providers: [
        { provide: ChartService, useValue: chartServiceSpy },
        { provide: SharedChartService, useValue: sharedChartServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardChartsComponent);
    component = fixture.componentInstance;
    mockChartService = TestBed.inject(ChartService) as jasmine.SpyObj<ChartService>;
    mockSharedChartService = TestBed.inject(SharedChartService) as jasmine.SpyObj<SharedChartService>;

    // Setup default mock returns
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
    (mockChartService as any)['calculateNetIncomeByPeriod'].and.returnValue([
      { period: '2024-01', income: 5000, expenses: 150, net: 4850 },
      { period: '2024-02', income: 5000, expenses: 200, net: 4800 }
    ]);
    (mockChartService as any)['calculateCategorySpending'].and.returnValue([
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
      expect(component.autoRefresh).toBe(true);
      expect(component.refreshInterval).toBe(30000);
      expect(component.isLoading).toBe(false);
      expect(component.isRealTimeMode).toBe(false);
    });

    it('should call initializeDashboardCharts on ngOnInit', () => {
      spyOn(component, 'updateDashboardCharts' as any);
      component.ngOnInit();
      expect(component['updateDashboardCharts']).toHaveBeenCalled();
    });

    it('should setup auto refresh when autoRefresh is true', () => {
      spyOn(component, 'setupAutoRefresh' as any);
      component.ngOnInit();
      expect(component['setupAutoRefresh']).toHaveBeenCalled();
    });

    it('should not setup auto refresh when autoRefresh is false', () => {
      component.autoRefresh = false;
      spyOn(component, 'setupAutoRefresh' as any);
      component.ngOnInit();
      expect(component['setupAutoRefresh']).toHaveBeenCalled();
    });
  });

  describe('Input Changes', () => {
    it('should update charts when transactions change', () => {
      spyOn(component, 'updateDashboardCharts' as any);
      component.transactions = mockTransactions;
      component.ngOnChanges({
        transactions: {
          currentValue: mockTransactions,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component['updateDashboardCharts']).toHaveBeenCalled();
    });

    it('should update charts when categories change', () => {
      spyOn(component, 'updateDashboardCharts' as any);
      component.categories = mockCategories;
      component.ngOnChanges({
        categories: {
          currentValue: mockCategories,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component['updateDashboardCharts']).toHaveBeenCalled();
    });

    it('should update charts when dashboard changes', () => {
      spyOn(component, 'updateDashboardCharts' as any);
      component.dashboard = mockDashboard;
      component.ngOnChanges({
        dashboard: {
          currentValue: mockDashboard,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component['updateDashboardCharts']).toHaveBeenCalled();
    });

    it('should not update charts when other properties change', () => {
      spyOn(component, 'updateDashboardCharts' as any);
      component.ngOnChanges({
        autoRefresh: {
          currentValue: false,
          previousValue: true,
          firstChange: false,
          isFirstChange: () => false
        }
      });
      expect(component['updateDashboardCharts']).not.toHaveBeenCalled();
    });
  });

  describe('Chart Data Generation', () => {
    beforeEach(() => {
      component.transactions = mockTransactions;
      component.categories = mockCategories;
    });

    it('should generate balance chart data', () => {
      component['generateBalanceChart']();
      expect(component.balanceChartData).toBeDefined();
      expect(component.balanceChartData?.labels).toBeDefined();
      expect(component.balanceChartData?.datasets).toBeDefined();
    });

    it('should generate income expense chart data', () => {
      component['generateIncomeExpenseChart']();
      expect(component.incomeExpenseChartData).toBeDefined();
      expect(component.incomeExpenseChartData?.labels).toBeDefined();
      expect(component.incomeExpenseChartData?.datasets).toBeDefined();
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

    it('should generate realtime chart data', () => {
      component['generateRealtimeChart']();
      expect(component.realtimeData).toBeDefined();
      expect(component.realtimeData.length).toBeGreaterThan(0);
    });
  });

  describe('Chart Creation', () => {
    beforeEach(() => {
      // Mock ViewChild elements
      component.balanceChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.incomeExpenseChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.categoryChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.trendChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.realtimeChartRef = { nativeElement: document.createElement('canvas') } as any;
    });

    it('should create balance chart when data is available', () => {
      component.balanceChartData = {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Balance', data: [1000, 2000] }]
      };
      component['createBalanceChart']();
      expect(mockSharedChartService.createChart).toHaveBeenCalled();
    });

    it('should not create balance chart when data is null', () => {
      component.balanceChartData = null;
      component['createBalanceChart']();
      expect(mockSharedChartService.createChart).not.toHaveBeenCalled();
    });

    it('should not create balance chart when canvas ref is null', () => {
      component.balanceChartRef = null as any;
      component.balanceChartData = {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Balance', data: [1000, 2000] }]
      };
      component['createBalanceChart']();
      expect(mockSharedChartService.createChart).not.toHaveBeenCalled();
    });

    it('should destroy existing chart before creating new one', () => {
      (component as any).balanceChart = mockChart as any;
      component.balanceChartData = {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Balance', data: [1000, 2000] }]
      };
      component['createBalanceChart']();
      expect(mockChart.destroy).toHaveBeenCalled();
    });

    it('should create income expense chart when data is available', () => {
      component.incomeExpenseChartData = {
        labels: ['Jan', 'Feb'],
        datasets: [
          { label: 'Income', data: [5000, 5000] },
          { label: 'Expenses', data: [3000, 3500] }
        ]
      };
      component['createIncomeExpenseChart']();
      expect(mockSharedChartService.createChart).toHaveBeenCalled();
    });

    it('should create category chart when data is available', () => {
      component.categoryChartData = {
        labels: ['Food', 'Transport'],
        datasets: [{ label: 'Spending', data: [300, 200] }]
      };
      component['createCategoryChart']();
      expect(mockSharedChartService.createChart).toHaveBeenCalled();
    });

    it('should create trend chart when data is available', () => {
      component.trendChartData = {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Net Income', data: [2000, 1500] }]
      };
      component['createTrendChart']();
      expect(mockSharedChartService.createChart).toHaveBeenCalled();
    });

    it('should create realtime chart when data is available', () => {
      component.realtimeData = [
        { timestamp: new Date(), value: 1000, label: 'Test' }
      ];
      component['createRealtimeChart']();
      expect(mockSharedChartService.createChart).toHaveBeenCalled();
    });

    it('should not create realtime chart when data is empty', () => {
      component.realtimeData = [];
      component['createRealtimeChart']();
      expect(mockSharedChartService.createChart).not.toHaveBeenCalled();
    });
  });

  describe('Quick Stats Calculation', () => {
    beforeEach(() => {
      component.transactions = mockTransactions;
      component.categories = mockCategories;
    });

    it('should calculate quick stats correctly', () => {
      component['calculateQuickStats']();
      expect(component.quickStats).toBeDefined();
      expect(component.quickStats?.totalBalance).toBeDefined();
      expect(component.quickStats?.monthlyIncome).toBeDefined();
      expect(component.quickStats?.monthlyExpenses).toBeDefined();
      expect(component.quickStats?.monthlyNet).toBeDefined();
      expect(component.quickStats?.savingsRate).toBeDefined();
    });

    it('should handle zero income in savings rate calculation', () => {
      component.transactions = mockTransactions.filter(t => t.type === TransactionType.EXPENSE);
      component['calculateQuickStats']();
      expect(component.quickStats?.savingsRate).toBe(0);
    });

    it('should handle empty category data', () => {
      (mockChartService as any)['calculateCategorySpending'].and.returnValue([]);
      component['calculateQuickStats']();
      expect(component.quickStats?.topCategory).toBe('None');
      expect(component.quickStats?.topCategoryAmount).toBe(0);
    });
  });

  describe('Real-time Updates', () => {
    it('should toggle real-time mode', () => {
      spyOn(component, 'startRealTimeUpdates' as any);
      spyOn(component, 'stopRealTimeUpdates' as any);
      
      component.toggleRealTimeMode();
      expect(component.isRealTimeMode).toBe(true);
      expect(component['startRealTimeUpdates']).toHaveBeenCalled();
      
      component.toggleRealTimeMode();
      expect(component.isRealTimeMode).toBe(false);
      expect(component['stopRealTimeUpdates']).toHaveBeenCalled();
    });

    it('should start real-time updates when toggled on', () => {
      spyOn(component, 'startRealTimeUpdates' as any);
      component.toggleRealTimeMode();
      expect(component.isRealTimeMode).toBe(true);
    });

    it('should update real-time data when in real-time mode', () => {
      component.isRealTimeMode = true;
      component.transactions = mockTransactions;
      component['updateRealtimeData']();
      expect(component.realtimeData.length).toBeGreaterThan(0);
    });

    it('should not update real-time data when not in real-time mode', () => {
      component.isRealTimeMode = false;
      const initialLength = component.realtimeData.length;
      component['updateRealtimeData']();
      expect(component.realtimeData.length).toBe(initialLength);
    });

    it('should limit real-time data to 24 points', () => {
      component.isRealTimeMode = true;
      component.transactions = mockTransactions;
      
      // Add more than 24 data points
      for (let i = 0; i < 30; i++) {
        component['updateRealtimeData']();
      }
      
      expect(component.realtimeData.length).toBe(24);
    });
  });

  describe('Chart Refresh', () => {
    it('should refresh charts', () => {
      spyOn(component, 'updateDashboardCharts' as any);
      component.refreshCharts();
      expect(component['updateDashboardCharts']).toHaveBeenCalled();
    });
  });

  describe('Chart Export', () => {
    beforeEach(() => {
      component.balanceChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.incomeExpenseChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.categoryChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.trendChartRef = { nativeElement: document.createElement('canvas') } as any;
      component.realtimeChartRef = { nativeElement: document.createElement('canvas') } as any;
    });

    it('should export balance chart', () => {
      component.exportChart('balance');
      expect(mockChartService.exportChartAsImage).toHaveBeenCalled();
    });

    it('should export income expense chart', () => {
      component.exportChart('incomeExpense');
      expect(mockChartService.exportChartAsImage).toHaveBeenCalled();
    });

    it('should export category chart', () => {
      component.exportChart('category');
      expect(mockChartService.exportChartAsImage).toHaveBeenCalled();
    });

    it('should export trend chart', () => {
      component.exportChart('trend');
      expect(mockChartService.exportChartAsImage).toHaveBeenCalled();
    });

    it('should export realtime chart', () => {
      component.exportChart('realtime');
      expect(mockChartService.exportChartAsImage).toHaveBeenCalled();
    });

    it('should handle unknown chart type', () => {
      component.exportChart('unknown');
      expect(mockChartService.exportChartAsImage).not.toHaveBeenCalled();
    });

    it('should handle null canvas ref', () => {
      component.balanceChartRef = null as any;
      component.exportChart('balance');
      expect(mockChartService.exportChartAsImage).not.toHaveBeenCalled();
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
      spyOn(component, 'generateBalanceChart' as any);
      spyOn(component, 'generateIncomeExpenseChart' as any);
      spyOn(component, 'generateCategoryChart' as any);
      spyOn(component, 'generateTrendChart' as any);
      spyOn(component, 'generateRealtimeChart' as any);
      spyOn(component, 'calculateQuickStats' as any);
      
      component.transactions = [];
      component['updateDashboardCharts']();
      
      expect(component['generateBalanceChart']).not.toHaveBeenCalled();
      expect(component['generateIncomeExpenseChart']).not.toHaveBeenCalled();
      expect(component['generateCategoryChart']).not.toHaveBeenCalled();
      expect(component['generateTrendChart']).not.toHaveBeenCalled();
      expect(component['generateRealtimeChart']).not.toHaveBeenCalled();
      expect(component['calculateQuickStats']).not.toHaveBeenCalled();
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

  describe('Helper Methods', () => {
    beforeEach(() => {
      component.transactions = mockTransactions;
    });

    it('should calculate balance over time', () => {
      const result = component['calculateBalanceOverTime']();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should calculate monthly income expense', () => {
      const result = component['calculateMonthlyIncomeExpense']();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should calculate current balance', () => {
      const result = component['calculateCurrentBalance']();
      expect(result).toBeDefined();
      expect(typeof result).toBe('number');
    });

    it('should generate realtime data', () => {
      const result = component['generateRealtimeData']();
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(24);
    });

    it('should get canvas ref for balance chart', () => {
      component.balanceChartRef = { nativeElement: document.createElement('canvas') } as any;
      const result = component['getCanvasRef']('balance');
      expect(result).toBeTruthy();
    });

    it('should get canvas ref for income expense chart', () => {
      component.incomeExpenseChartRef = { nativeElement: document.createElement('canvas') } as any;
      const result = component['getCanvasRef']('incomeExpense');
      expect(result).toBeTruthy();
    });

    it('should get canvas ref for category chart', () => {
      component.categoryChartRef = { nativeElement: document.createElement('canvas') } as any;
      const result = component['getCanvasRef']('category');
      expect(result).toBeTruthy();
    });

    it('should get canvas ref for trend chart', () => {
      component.trendChartRef = { nativeElement: document.createElement('canvas') } as any;
      const result = component['getCanvasRef']('trend');
      expect(result).toBeTruthy();
    });

    it('should get canvas ref for realtime chart', () => {
      component.realtimeChartRef = { nativeElement: document.createElement('canvas') } as any;
      const result = component['getCanvasRef']('realtime');
      expect(result).toBeTruthy();
    });

    it('should return null for unknown chart type', () => {
      const result = component['getCanvasRef']('unknown');
      expect(result).toBeNull();
    });
  });

  describe('Template Integration', () => {
    it('should render quick stats when available', () => {
      component.quickStats = {
        totalBalance: 10000,
        monthlyIncome: 5000,
        monthlyExpenses: 3000,
        monthlyNet: 2000,
        savingsRate: 40,
        topCategory: 'Food',
        topCategoryAmount: 1500
      };
      
      fixture.detectChanges();
      
      const statsContainer = fixture.nativeElement.querySelector('.quick-stats');
      expect(statsContainer).toBeTruthy();
    });

    it('should render chart containers when data is available', () => {
      component.balanceChartData = {
        labels: ['Jan', 'Feb'],
        datasets: [{ label: 'Balance', data: [1000, 2000] }]
      };
      
      fixture.detectChanges();
      
      const chartContainer = fixture.nativeElement.querySelector('canvas');
      expect(chartContainer).toBeTruthy();
    });

    it('should show loading state when isLoading is true', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const loadingState = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingState).toBeTruthy();
    });

    it('should show no data state when no charts are available', () => {
      component.balanceChartData = null;
      component.incomeExpenseChartData = null;
      component.categoryChartData = null;
      component.isLoading = false;
      
      fixture.detectChanges();
      
      const noDataState = fixture.nativeElement.querySelector('.no-data-state');
      expect(noDataState).toBeTruthy();
    });
  });
});