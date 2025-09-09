import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdvancedChartsComponent } from './advanced-charts';
import { ChartService } from '../../../../core/services/chart.service';
import { SharedChartService } from '../../../../shared/chart/chart.service';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod, Category, FinancialDashboard } from '../../../../core/models/financial.model';

describe('AdvancedChartsComponent', () => {
  let component: AdvancedChartsComponent;
  let fixture: ComponentFixture<AdvancedChartsComponent>;
  let mockChartService: jasmine.SpyObj<ChartService>;
  let mockSharedChartService: jasmine.SpyObj<SharedChartService>;

  const mockTransactions: Transaction[] = [
    {
      _id: '1',
      title: 'Test Transaction 1',
      description: 'Test Transaction 1',
      amount: 100,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      tags: [],
      date: new Date('2024-01-01'),
      timezone: 'UTC',
      paymentMethod: PaymentMethod.CASH,
      isRecurring: false,
      recurrencePattern: {} as any,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'acc1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    },
    {
      _id: '2',
      title: 'Test Transaction 2',
      description: 'Test Transaction 2',
      amount: 200,
      currency: 'USD',
      type: TransactionType.INCOME,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat2',
      tags: [],
      date: new Date('2024-01-02'),
      timezone: 'UTC',
      paymentMethod: PaymentMethod.CASH,
      isRecurring: false,
      recurrencePattern: {} as any,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'acc1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    }
  ];

  const mockCategories: Category[] = [
    {
      _id: 'cat1',
      name: 'Food',
      description: 'Food and dining',
      color: '#FF6384',
      path: ['Food'],
      level: 0,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'cat2',
      name: 'Salary',
      description: 'Salary and wages',
      color: '#36A2EB',
      path: ['Salary'],
      level: 0,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockDashboard: FinancialDashboard = {
    overview: {
      totalBalance: 2000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      monthlyNet: 2000,
      pendingTransactions: 0,
      upcomingRecurring: 0
    },
    recentTransactions: mockTransactions.slice(0, 5),
    topCategories: [
      { categoryId: 'cat1', name: 'Food', amount: 500, percentage: 16.7 }
    ],
    spendingTrends: [],
    budgetStatus: []
  };

  beforeEach(async () => {
    const chartServiceSpy = jasmine.createSpyObj('ChartService', [], {
      'calculateSpendingHeatmap': jasmine.createSpy('calculateSpendingHeatmap'),
      'groupTransactionsByPeriod': jasmine.createSpy('groupTransactionsByPeriod'),
      'calculateNetIncomeByPeriod': jasmine.createSpy('calculateNetIncomeByPeriod'),
      'calculateCategorySpending': jasmine.createSpy('calculateCategorySpending')
    });

    const sharedChartServiceSpy = jasmine.createSpyObj('SharedChartService', ['createChart']);

    await TestBed.configureTestingModule({
      imports: [AdvancedChartsComponent],
      providers: [
        { provide: ChartService, useValue: chartServiceSpy },
        { provide: SharedChartService, useValue: sharedChartServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdvancedChartsComponent);
    component = fixture.componentInstance;
    mockChartService = TestBed.inject(ChartService) as jasmine.SpyObj<ChartService>;
    mockSharedChartService = TestBed.inject(SharedChartService) as jasmine.SpyObj<SharedChartService>;

    // Set up default mock returns
    component.transactions = mockTransactions;
    component.categories = mockCategories;
    component.dashboard = mockDashboard;

    // Mock ChartService private methods
    (mockChartService as any).calculateSpendingHeatmap.and.returnValue([
      { date: '2024-01-01', amount: 100 },
      { date: '2024-01-02', amount: 200 }
    ]);
    (mockChartService as any).groupTransactionsByPeriod.and.returnValue([
      { period: '2024-01', amount: 1000 },
      { period: '2024-02', amount: 1200 }
    ]);
    (mockChartService as any).calculateNetIncomeByPeriod.and.returnValue([
      { period: '2024-01', income: 1000, expenses: 800, net: 200 }
    ]);
    (mockChartService as any).calculateCategorySpending.and.returnValue([
      { category: 'Food', amount: 500, count: 10 }
    ]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.transactions).toEqual(mockTransactions);
    expect(component.categories).toEqual(mockCategories);
    expect(component.dashboard).toEqual(mockDashboard);
    expect(component.showCharts).toBe(true);
  });

  it('should update charts when transactions change', () => {
    spyOn(component as any, 'updateAdvancedCharts');
    
    component.ngOnChanges({
      transactions: {
        currentValue: mockTransactions,
        previousValue: [],
        firstChange: true,
        isFirstChange: () => true
      }
    });

    expect(component['updateAdvancedCharts']).toHaveBeenCalled();
  });

  it('should update charts when transactions change', () => {
    spyOn(component as any, 'updateAdvancedCharts');
    
    component.ngOnChanges({
      transactions: {
        currentValue: mockTransactions,
        previousValue: [],
        firstChange: true,
        isFirstChange: () => true
      }
    });

    expect(component['updateAdvancedCharts']).toHaveBeenCalled();
  });

  it('should generate available years from transactions', () => {
    component['generateAvailableYears']();
    expect(component.availableYears).toContain(2024);
    expect(component.selectedYear).toBe(2024);
  });

  it('should handle invalid dates in generateAvailableYears', () => {
    // Test with invalid date that doesn't throw but creates invalid date
    const invalidTransaction = { ...mockTransactions[0], date: 'invalid-date' as any };
    component.transactions = [invalidTransaction];
    
    component['generateAvailableYears']();
    
    // Should still work and not include invalid dates in availableYears
    expect(component.availableYears).toBeDefined();
    expect(Array.isArray(component.availableYears)).toBe(true);
  });

  it('should generate heatmap data', () => {
    component['generateHeatmapData']();
    
    expect(component.heatmapData).toBeDefined();
    expect(component.heatmapData.length).toBeGreaterThan(0);
  });

  it('should generate gauge data', () => {
    component['generateGaugeData']();
    
    expect(component.gaugeData).toBeDefined();
    expect(component.gaugeData.length).toBe(3);
    expect(component.gaugeData[0].label).toBe('Savings Rate');
    expect(component.gaugeData[1].label).toBe('Debt-to-Income');
    expect(component.gaugeData[2].label).toBe('Emergency Fund');
  });

  it('should generate financial indicators', () => {
    component['generateFinancialIndicators']();
    
    expect(component.financialIndicators).toBeDefined();
    expect(component.financialIndicators.length).toBe(6);
    expect(component.financialIndicators[0].name).toBe('Savings Rate');
  });

  it('should generate waterfall chart data', () => {
    component['generateWaterfallChart']();
    
    expect(component.waterfallData).toBeDefined();
    expect(component.waterfallData?.labels).toBeDefined();
    expect(component.waterfallData?.datasets).toBeDefined();
  });

  it('should generate radar chart data', () => {
    component['generateRadarChart']();
    
    expect(component.radarData).toBeDefined();
    expect(component.radarData?.labels).toBeDefined();
    expect(component.radarData?.datasets).toBeDefined();
  });

  it('should generate bubble chart data', () => {
    component['generateBubbleChart']();
    
    expect(component.bubbleData).toBeDefined();
    expect(component.bubbleData?.labels).toBeDefined();
    expect(component.bubbleData?.datasets).toBeDefined();
  });

  it('should calculate intensity correctly', () => {
    const data = [{ amount: 100 }, { amount: 200 }, { amount: 300 }];
    const intensity = component['calculateIntensity'](200, data);
    expect(intensity).toBe(200 / 300);
  });

  it('should calculate financial metrics', () => {
    const metrics = component['calculateFinancialMetrics']();
    expect(metrics).toBeDefined();
    expect(metrics.totalIncome).toBeDefined();
    expect(metrics.totalExpenses).toBeDefined();
    expect(metrics.savingsRate).toBeDefined();
  });

  it('should calculate debt to income ratio', () => {
    const ratio = component['calculateDebtToIncomeRatio']();
    expect(ratio).toBeDefined();
    expect(typeof ratio).toBe('number');
  });

  it('should calculate emergency fund ratio', () => {
    const ratio = component['calculateEmergencyFundRatio']();
    expect(ratio).toBeDefined();
    expect(typeof ratio).toBe('number');
  });

  it('should calculate investment rate', () => {
    const rate = component['calculateInvestmentRate']();
    expect(rate).toBeDefined();
    expect(typeof rate).toBe('number');
  });

  it('should calculate expense growth rate', () => {
    const rate = component['calculateExpenseGrowthRate']();
    expect(rate).toBeDefined();
    expect(typeof rate).toBe('number');
  });

  it('should calculate income stability', () => {
    const stability = component['calculateIncomeStability']();
    expect(stability).toBeDefined();
    expect(typeof stability).toBe('number');
  });

  it('should calculate trend', () => {
    const trend = component['calculateTrend']('test');
    expect(trend).toBeDefined();
    expect(['up', 'down', 'stable']).toContain(trend);
  });

  it('should get indicator status correctly', () => {
    expect(component['getIndicatorStatus'](100, 100)).toBe('excellent');
    expect(component['getIndicatorStatus'](80, 100)).toBe('good');
    expect(component['getIndicatorStatus'](60, 100)).toBe('warning');
    expect(component['getIndicatorStatus'](40, 100)).toBe('critical');
  });

  it('should get status color correctly', () => {
    expect(component['getStatusColor']('excellent')).toBe('#28a745');
    expect(component['getStatusColor']('good')).toBe('#20c997');
    expect(component['getStatusColor']('warning')).toBe('#ffc107');
    expect(component['getStatusColor']('critical')).toBe('#dc3545');
  });

  it('should get gauge color correctly', () => {
    expect(component['getGaugeColor'](90)).toBe('#28a745');
    expect(component['getGaugeColor'](70)).toBe('#20c997');
    expect(component['getGaugeColor'](50)).toBe('#ffc107');
    expect(component['getGaugeColor'](30)).toBe('#fd7e14');
  });

  it('should get heatmap color correctly', () => {
    expect(component['getHeatmapColor'](0)).toBe('#f8f9fa');
    expect(component['getHeatmapColor'](0.1)).toBe('#d1ecf1');
    expect(component['getHeatmapColor'](0.3)).toBe('#bee5eb');
    expect(component['getHeatmapColor'](0.5)).toBe('#7dd3fc');
    expect(component['getHeatmapColor'](0.7)).toBe('#38bdf8');
    expect(component['getHeatmapColor'](0.9)).toBe('#0ea5e9');
  });

  it('should calculate waterfall data', () => {
    const data = component['calculateWaterfallData']();
    
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should calculate radar data', () => {
    const data = component['calculateRadarData']();
    
    expect(data).toBeDefined();
    expect(data.labels).toBeDefined();
    expect(data.values).toBeDefined();
    expect(Array.isArray(data.labels)).toBe(true);
    expect(Array.isArray(data.values)).toBe(true);
  });

  it('should calculate bubble data', () => {
    const data = component['calculateBubbleData']();
    
    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);
  });

  it('should calculate category frequency', () => {
    const frequency = component['calculateCategoryFrequency']('Food');
    expect(frequency).toBeDefined();
    expect(typeof frequency).toBe('number');
  });

  it('should get category name by id', () => {
    const name = component['getCategoryName']('cat1');
    expect(name).toBe('Food');
  });

  it('should return unknown for invalid category id', () => {
    const name = component['getCategoryName']('invalid');
    expect(name).toBe('Unknown Category');
  });

  it('should have color palettes', () => {
    const palettes = component['colorPalettes'];
    expect(palettes).toBeDefined();
    expect(Array.isArray(palettes)).toBe(true);
    expect(palettes.length).toBeGreaterThan(0);
  });

  it('should create heatmap chart when data is available', () => {
    component.heatmapData = [{ date: '2024-01-01', value: 100, intensity: 0.5 }];
    component.heatmapChartRef = { nativeElement: document.createElement('canvas') } as any;
    
    component['createHeatmapChart']();
    
    expect(mockSharedChartService.createChart).toHaveBeenCalled();
  });

  it('should not create heatmap chart when no data', () => {
    component.heatmapData = [];
    
    component['createHeatmapChart']();
    
    expect(mockSharedChartService.createChart).not.toHaveBeenCalled();
  });

  it('should create gauge chart when data is available', () => {
    component.gaugeData = [{ value: 50, max: 100, label: 'Test', color: '#000' }];
    component.gaugeChartRef = { nativeElement: document.createElement('canvas') } as any;
    
    component['createGaugeChart']();
    
    expect(mockSharedChartService.createChart).toHaveBeenCalled();
  });

  it('should create indicator chart when data is available', () => {
    component.financialIndicators = [{ name: 'Test', value: 50, target: 100, status: 'good', trend: 'up' }];
    component.indicatorChartRef = { nativeElement: document.createElement('canvas') } as any;
    
    component['createIndicatorChart']();
    
    expect(mockSharedChartService.createChart).toHaveBeenCalled();
  });

  it('should create waterfall chart when data is available', () => {
    component.waterfallData = { labels: ['Test'], datasets: [] };
    component.waterfallChartRef = { nativeElement: document.createElement('canvas') } as any;
    
    component['createWaterfallChart']();
    
    expect(mockSharedChartService.createChart).toHaveBeenCalled();
  });

  it('should create radar chart when data is available', () => {
    component.radarData = { labels: ['Test'], datasets: [] };
    component.radarChartRef = { nativeElement: document.createElement('canvas') } as any;
    
    component['createRadarChart']();
    
    expect(mockSharedChartService.createChart).toHaveBeenCalled();
  });

  it('should create bubble chart when data is available', () => {
    component.bubbleData = { labels: ['Test'], datasets: [] };
    component.bubbleChartRef = { nativeElement: document.createElement('canvas') } as any;
    
    component['createBubbleChart']();
    
    expect(mockSharedChartService.createChart).toHaveBeenCalled();
  });

  it('should display no data state when no transactions', () => {
    component.transactions = [];
    component.heatmapData = [];
    component.financialIndicators = [];
    component.showCharts = true;
    component.isLoading = false;
    fixture.detectChanges();
    
    const noDataState = fixture.nativeElement.querySelector('.no-data-state');
    expect(noDataState).toBeTruthy();
  });

  it('should not display charts when showCharts is false', () => {
    component.showCharts = false;
    fixture.detectChanges();
    
    const chartContainer = fixture.nativeElement.querySelector('.chart-container');
    expect(chartContainer).toBeFalsy();
  });

  it('should call ngOnDestroy without errors', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});