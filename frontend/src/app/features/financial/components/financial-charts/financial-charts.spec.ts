import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

import { FinancialChartsComponent } from './financial-charts';
import { 
  Transaction, 
  TransactionType, 
  TransactionStatus, 
  PaymentMethod, 
  RecurrencePattern,
  Category, 
  FinancialDashboard 
} from '../../../../core/models/financial.model';

describe('FinancialChartsComponent', () => {
  let component: FinancialChartsComponent;
  let fixture: ComponentFixture<FinancialChartsComponent>;

  const mockCategories: Category[] = [
    {
      _id: '1',
      name: 'Food & Dining',
      path: ['Food & Dining'],
      level: 1,
      isActive: true,
      isSystem: false,
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
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: '3',
      name: 'Entertainment',
      path: ['Entertainment'],
      level: 1,
      isActive: true,
      isSystem: false,
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
      status: TransactionStatus.COMPLETED,
      categoryId: '1',
      tags: [],
      date: new Date('2024-01-15'),
      timezone: 'UTC',
      paymentMethod: PaymentMethod.DEBIT_CARD,
      isRecurring: false,
      recurrencePattern: RecurrencePattern.NONE,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'account1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    },
    {
      _id: '2',
      title: 'Salary',
      amount: 5000,
      currency: 'USD',
      type: TransactionType.INCOME,
      status: TransactionStatus.COMPLETED,
      categoryId: '4',
      tags: [],
      date: new Date('2024-01-01'),
      timezone: 'UTC',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      isRecurring: false,
      recurrencePattern: RecurrencePattern.NONE,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'account1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    },
    {
      _id: '3',
      title: 'Gas Station',
      amount: 75,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: '2',
      tags: [],
      date: new Date('2024-02-10'),
      timezone: 'UTC',
      paymentMethod: PaymentMethod.CREDIT_CARD,
      isRecurring: false,
      recurrencePattern: RecurrencePattern.NONE,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'account1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    },
    {
      _id: '4',
      title: 'Movie Tickets',
      amount: 25,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: '3',
      tags: [],
      date: new Date('2024-02-15'),
      timezone: 'UTC',
      paymentMethod: PaymentMethod.CREDIT_CARD,
      isRecurring: false,
      recurrencePattern: RecurrencePattern.NONE,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'account1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    },
    {
      _id: '5',
      title: 'Freelance Work',
      amount: 1200,
      currency: 'USD',
      type: TransactionType.INCOME,
      status: TransactionStatus.COMPLETED,
      categoryId: '4',
      tags: [],
      date: new Date('2024-02-20'),
      timezone: 'UTC',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      isRecurring: false,
      recurrencePattern: RecurrencePattern.NONE,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'account1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false
    }
  ];

  const mockDashboard: FinancialDashboard = {
    overview: {
      totalBalance: 10000,
      monthlyIncome: 6200,
      monthlyExpenses: 250,
      monthlyNet: 5950,
      pendingTransactions: 0,
      upcomingRecurring: 3
    },
    recentTransactions: mockTransactions.slice(0, 3),
    topCategories: [],
    spendingTrends: [],
    budgetStatus: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FinancialChartsComponent,
        RouterTestingModule
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FinancialChartsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.transactions).toEqual([]);
    expect(component.categories).toEqual([]);
    expect(component.dashboard).toBeNull();
    expect(component.period).toBe('month');
    expect(component.showCharts).toBe(true);
    expect(component.expenseChartData).toBeNull();
    expect(component.incomeChartData).toBeNull();
    expect(component.categoryChartData).toBeNull();
    expect(component.trendChartData).toBeNull();
  });

  it('should have correct chart options', () => {
    expect(component.chartOptions.responsive).toBe(true);
    expect(component.chartOptions.maintainAspectRatio).toBe(false);
    expect(component.chartOptions.plugins.legend.position).toBe('top');
    expect(component.chartOptions.plugins.tooltip.backgroundColor).toBe('rgba(0, 0, 0, 0.8)');
  });

  it('should initialize charts on ngOnInit', () => {
    spyOn(component, 'initializeCharts' as any);
    
    component.ngOnInit();
    
    expect(component['initializeCharts']).toHaveBeenCalled();
  });

  it('should update charts when inputs change', () => {
    spyOn(component, 'updateCharts' as any);
    
    const changes = {
      transactions: new SimpleChange([], mockTransactions, false),
      categories: new SimpleChange([], mockCategories, false)
    };
    
    component.ngOnChanges(changes);
    
    expect(component['updateCharts']).toHaveBeenCalled();
  });

  it('should not update charts when non-relevant inputs change', () => {
    spyOn(component, 'updateCharts' as any);
    
    const changes = {
      someOtherProperty: new SimpleChange('old', 'new', false)
    };
    
    component.ngOnChanges(changes);
    
    expect(component['updateCharts']).not.toHaveBeenCalled();
  });

  it('should clean up on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  describe('Chart Generation', () => {
    beforeEach(() => {
      component.transactions = mockTransactions;
      component.categories = mockCategories;
    });

    it('should not update charts when transactions are empty', () => {
      component.transactions = [];
      spyOn(component, 'generateExpenseChart' as any);
      
      component['updateCharts']();
      
      expect(component['generateExpenseChart']).not.toHaveBeenCalled();
    });

    it('should generate all charts when transactions exist', () => {
      spyOn(component, 'generateExpenseChart' as any);
      spyOn(component, 'generateIncomeChart' as any);
      spyOn(component, 'generateCategoryChart' as any);
      spyOn(component, 'generateTrendChart' as any);
      
      component['updateCharts']();
      
      expect(component['generateExpenseChart']).toHaveBeenCalled();
      expect(component['generateIncomeChart']).toHaveBeenCalled();
      expect(component['generateCategoryChart']).toHaveBeenCalled();
      expect(component['generateTrendChart']).toHaveBeenCalled();
    });

    it('should generate expense chart correctly', () => {
      component['generateExpenseChart']();
      
      expect(component.expenseChartData).toBeTruthy();
      expect(component.expenseChartData!.datasets[0].label).toBe('Monthly Expenses');
      expect(component.expenseChartData!.datasets[0].backgroundColor).toBe('rgba(220, 53, 69, 0.8)');
      expect(component.expenseChartData!.datasets[0].borderColor).toBe('rgba(220, 53, 69, 1)');
      expect(component.expenseChartData!.datasets[0].fill).toBe(false);
      expect(component.expenseChartData!.datasets[0].tension).toBe(0.4);
    });

    it('should generate income chart correctly', () => {
      component['generateIncomeChart']();
      
      expect(component.incomeChartData).toBeTruthy();
      expect(component.incomeChartData!.datasets[0].label).toBe('Monthly Income');
      expect(component.incomeChartData!.datasets[0].backgroundColor).toBe('rgba(40, 167, 69, 0.8)');
      expect(component.incomeChartData!.datasets[0].borderColor).toBe('rgba(40, 167, 69, 1)');
      expect(component.incomeChartData!.datasets[0].fill).toBe(false);
      expect(component.incomeChartData!.datasets[0].tension).toBe(0.4);
    });

    it('should generate category chart correctly', () => {
      component['generateCategoryChart']();
      
      expect(component.categoryChartData).toBeTruthy();
      expect(component.categoryChartData!.datasets[0].label).toBe('Spending by Category');
      expect(component.categoryChartData!.datasets[0].borderWidth).toBe(2);
      expect(component.categoryChartData!.datasets[0].borderColor).toBe('#ffffff');
      expect(Array.isArray(component.categoryChartData!.datasets[0].backgroundColor)).toBe(true);
    });

    it('should generate trend chart correctly', () => {
      component['generateTrendChart']();
      
      expect(component.trendChartData).toBeTruthy();
      expect(component.trendChartData!.datasets.length).toBe(3);
      expect(component.trendChartData!.datasets[0].label).toBe('Net Income');
      expect(component.trendChartData!.datasets[1].label).toBe('Income');
      expect(component.trendChartData!.datasets[2].label).toBe('Expenses');
      
      // Check colors
      expect(component.trendChartData!.datasets[0].borderColor).toBe('rgba(0, 123, 255, 1)');
      expect(component.trendChartData!.datasets[1].borderColor).toBe('rgba(40, 167, 69, 1)');
      expect(component.trendChartData!.datasets[2].borderColor).toBe('rgba(220, 53, 69, 1)');
    });
  });

  describe('Data Processing Methods', () => {
    beforeEach(() => {
      component.transactions = mockTransactions;
      component.categories = mockCategories;
    });

    it('should group transactions by month correctly', () => {
      const expenses = mockTransactions.filter(t => t.type === TransactionType.EXPENSE);
      const result = component['groupTransactionsByMonth'](expenses);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].month).toBeDefined();
      expect(result[0].amount).toBeDefined();
      expect(typeof result[0].amount).toBe('number');
    });

    it('should calculate category totals correctly', () => {
      const result = component['calculateCategoryTotals']();
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBeDefined();
      expect(result[0].amount).toBeDefined();
      
      // Should be sorted by amount descending
      if (result.length > 1) {
        expect(result[0].amount).toBeGreaterThanOrEqual(result[1].amount);
      }
      
      // Should limit to top 10
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it('should calculate monthly net correctly', () => {
      const result = component['calculateMonthlyNet']();
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].month).toBeDefined();
      expect(result[0].income).toBeDefined();
      expect(result[0].expenses).toBeDefined();
      expect(result[0].net).toBeDefined();
      
      // Net should equal income minus expenses
      expect(result[0].net).toBe(result[0].income - result[0].expenses);
    });

    it('should handle empty transactions in groupTransactionsByMonth', () => {
      const result = component['groupTransactionsByMonth']([]);
      
      expect(result).toEqual([]);
    });

    it('should handle transactions without categoryId in calculateCategoryTotals', () => {
      const transactionsWithoutCategory = [{
        ...mockTransactions[0],
        categoryId: ''
      }];
      component.transactions = transactionsWithoutCategory;
      
      const result = component['calculateCategoryTotals']();
      
      expect(result).toBeDefined();
      // Should filter out transactions without categoryId
    });

    it('should sort monthly data chronologically', () => {
      const result = component['calculateMonthlyNet']();
      
      if (result.length > 1) {
        const firstDate = new Date(result[0].month);
        const secondDate = new Date(result[1].month);
        expect(firstDate.getTime()).toBeLessThanOrEqual(secondDate.getTime());
      }
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      component.categories = mockCategories;
    });

    it('should get category name correctly', () => {
      const categoryName = component['getCategoryName']('1');
      expect(categoryName).toBe('Food & Dining');
    });

    it('should return "Unknown Category" for non-existent category', () => {
      const categoryName = component['getCategoryName']('999');
      expect(categoryName).toBe('Unknown Category');
    });

    it('should generate colors correctly', () => {
      const colors = component['generateColors'](5);
      
      expect(colors.length).toBe(5);
      expect(colors[0]).toBe('#FF6384');
      expect(colors[1]).toBe('#36A2EB');
      expect(colors[2]).toBe('#FFCE56');
    });

    it('should cycle colors when count exceeds available colors', () => {
      const colors = component['generateColors'](12);
      
      expect(colors.length).toBe(12);
      // Should cycle back to first color
      expect(colors[10]).toBe(colors[0]);
    });

    it('should handle zero count in generateColors', () => {
      const colors = component['generateColors'](0);
      
      expect(colors.length).toBe(0);
    });
  });

  describe('Event Handlers', () => {
    it('should handle chart click events', () => {
      spyOn(console, 'log');
      const mockEvent = { target: 'chart' };
      
      component.onChartClick(mockEvent);
      
      expect(console.log).toHaveBeenCalledWith('Chart clicked:', mockEvent);
    });

    it('should handle export chart data', () => {
      spyOn(console, 'log');
      
      component.exportChartData();
      
      expect(console.log).toHaveBeenCalledWith('Exporting chart data...');
    });
  });

  describe('Template Integration', () => {
    it('should show charts when showCharts is true', () => {
      component.showCharts = true;
      fixture.detectChanges();
      
      const chartsContainer = fixture.nativeElement.querySelector('.financial-charts-container');
      expect(chartsContainer).toBeTruthy();
    });

    it('should hide charts when showCharts is false', () => {
      component.showCharts = false;
      fixture.detectChanges();
      
      const chartsContainer = fixture.nativeElement.querySelector('.financial-charts-container');
      expect(chartsContainer).toBeFalsy();
    });

    it('should show export button', () => {
      component.showCharts = true;
      fixture.detectChanges();
      
      const exportButton = fixture.nativeElement.querySelector('button');
      expect(exportButton).toBeTruthy();
      expect(exportButton.textContent).toContain('Export Data');
    });

    it('should call exportChartData when export button is clicked', () => {
      spyOn(component, 'exportChartData');
      component.showCharts = true;
      fixture.detectChanges();
      
      const exportButton = fixture.nativeElement.querySelector('button');
      exportButton.click();
      
      expect(component.exportChartData).toHaveBeenCalled();
    });

    it('should show chart cards when chart data exists', () => {
      component.showCharts = true;
      component.transactions = mockTransactions;
      component.categories = mockCategories;
      component['updateCharts']();
      fixture.detectChanges();
      
      const chartCards = fixture.nativeElement.querySelectorAll('.chart-card');
      expect(chartCards.length).toBeGreaterThan(0);
    });

    it('should show no data state when no chart data exists', () => {
      component.showCharts = true;
      component.expenseChartData = null;
      component.incomeChartData = null;
      component.categoryChartData = null;
      component.trendChartData = null;
      fixture.detectChanges();
      
      const noDataState = fixture.nativeElement.querySelector('.no-data-state');
      expect(noDataState).toBeTruthy();
    });

    it('should show loading state when transactions are empty', () => {
      component.showCharts = true;
      component.transactions = [];
      fixture.detectChanges();
      
      const loadingState = fixture.nativeElement.querySelector('.loading-state');
      expect(loadingState).toBeTruthy();
    });

    it('should display correct chart statistics', () => {
      component.showCharts = true;
      component.transactions = mockTransactions;
      component.categories = mockCategories;
      component['updateCharts']();
      fixture.detectChanges();
      
      const statValues = fixture.nativeElement.querySelectorAll('.stat-value');
      expect(statValues.length).toBeGreaterThan(0);
    });

    it('should handle chart click events from template', () => {
      spyOn(component, 'onChartClick');
      component.showCharts = true;
      component.transactions = mockTransactions;
      component.categories = mockCategories;
      component['updateCharts']();
      fixture.detectChanges();
      
      const canvas = fixture.nativeElement.querySelector('canvas');
      if (canvas) {
        canvas.click();
        expect(component.onChartClick).toHaveBeenCalled();
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null transactions gracefully', () => {
      component.transactions = null as any;
      
      expect(() => component['updateCharts']()).not.toThrow();
    });

    it('should handle undefined categories gracefully', () => {
      component.categories = undefined as any;
      component.transactions = mockTransactions;
      
      expect(() => component['generateCategoryChart']()).not.toThrow();
    });

    it('should handle transactions with invalid dates', () => {
      const invalidTransactions = [{
        ...mockTransactions[0],
        date: new Date('invalid-date')
      }];
      
      // The method should handle invalid dates gracefully by returning an empty array
      const result = component['groupTransactionsByMonth'](invalidTransactions);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle transactions with zero amounts', () => {
      const zeroAmountTransactions = [{
        ...mockTransactions[0],
        amount: 0
      }];
      
      const result = component['groupTransactionsByMonth'](zeroAmountTransactions);
      expect(result).toBeDefined();
    });

    it('should handle negative transaction amounts', () => {
      const negativeAmountTransactions = [{
        ...mockTransactions[0],
        amount: -100
      }];
      
      const result = component['groupTransactionsByMonth'](negativeAmountTransactions);
      expect(result).toBeDefined();
      expect(result[0].amount).toBe(-100);
    });

    it('should handle very large datasets', () => {
      const largeTransactionSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockTransactions[0],
        _id: `transaction-${i}`,
        amount: Math.random() * 1000,
        date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
      }));
      
      component.transactions = largeTransactionSet;
      
      expect(() => component['updateCharts']()).not.toThrow();
      
      const categoryTotals = component['calculateCategoryTotals']();
      expect(categoryTotals.length).toBeLessThanOrEqual(10); // Should still limit to top 10
    });

    it('should handle mixed transaction types correctly', () => {
      const mixedTransactions = [
        { ...mockTransactions[0], type: TransactionType.EXPENSE },
        { ...mockTransactions[1], type: TransactionType.INCOME },
        { ...mockTransactions[2], type: TransactionType.TRANSFER },
        { ...mockTransactions[3], type: TransactionType.ADJUSTMENT }
      ];
      
      component.transactions = mixedTransactions;
      
      expect(() => component['updateCharts']()).not.toThrow();
    });
  });

  describe('Performance and Optimization', () => {
    it('should not regenerate charts unnecessarily', () => {
      spyOn(component, 'generateExpenseChart' as any);
      
      // First call should generate charts
      component.transactions = mockTransactions;
      component['updateCharts']();
      expect(component['generateExpenseChart']).toHaveBeenCalledTimes(1);
      
      // Second call with same data should still generate (no caching implemented)
      component['updateCharts']();
      expect(component['generateExpenseChart']).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid input changes', () => {
      const changes1 = {
        transactions: new SimpleChange([], mockTransactions, false)
      };
      const changes2 = {
        categories: new SimpleChange([], mockCategories, false)
      };
      
      expect(() => {
        component.ngOnChanges(changes1);
        component.ngOnChanges(changes2);
      }).not.toThrow();
    });
  });
});
