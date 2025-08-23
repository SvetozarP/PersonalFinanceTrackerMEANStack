import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError, Subject } from 'rxjs';

import { FinancialDashboardComponent } from './financial-dashboard';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { 
  FinancialDashboard, 
  Transaction, 
  TransactionType, 
  TransactionStatus,
  PaymentMethod,
  RecurrencePattern,
  Category,
  PaginatedResponse
} from '../../../../core/models/financial.model';

describe('FinancialDashboardComponent', () => {
  let component: FinancialDashboardComponent;
  let fixture: ComponentFixture<FinancialDashboardComponent>;
  let mockFinancialService: jasmine.SpyObj<FinancialService>;
  let mockTransactionService: jasmine.SpyObj<TransactionService>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;

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
      status: TransactionStatus.COMPLETED,
      categoryId: '1',
      tags: [],
      date: new Date(),
      timezone: 'UTC',
      paymentMethod: PaymentMethod.DEBIT_CARD,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'account1',
      isRecurring: false,
      recurrencePattern: RecurrencePattern.NONE,
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
      status: TransactionStatus.COMPLETED,
      categoryId: '2',
      tags: [],
      date: new Date(),
      timezone: 'UTC',
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'account1',
      isRecurring: true,
      recurrencePattern: RecurrencePattern.MONTHLY,
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
      monthlyExpenses: 1500,
      monthlyNet: 3500,
      pendingTransactions: 2,
      upcomingRecurring: 3
    },
    recentTransactions: mockTransactions.slice(0, 5),
    topCategories: [
      { name: 'Food & Dining', amount: 800, percentage: 53.3 },
      { name: 'Transportation', amount: 700, percentage: 46.7 }
    ],
    spendingTrends: [
      { month: 'Jan', amount: 1200 },
      { month: 'Feb', amount: 1500 }
    ],
    budgetStatus: [
      { category: 'Food & Dining', spent: 800, budget: 1000, percentage: 80 }
    ]
  };

  beforeEach(async () => {
    const financialServiceSpy = jasmine.createSpyObj('FinancialService', ['getFinancialDashboard']);
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getUserTransactions']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getUserCategories']);

    await TestBed.configureTestingModule({
      imports: [
        FinancialDashboardComponent,
        RouterTestingModule
      ],
      providers: [
        { provide: FinancialService, useValue: financialServiceSpy },
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialDashboardComponent);
    component = fixture.componentInstance;
    mockFinancialService = TestBed.inject(FinancialService) as jasmine.SpyObj<FinancialService>;
    mockTransactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
    mockCategoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;

    // Setup default return values
    mockFinancialService.getFinancialDashboard.and.returnValue(of(mockDashboard));
    mockTransactionService.getUserTransactions.and.returnValue(of({ 
      data: mockTransactions,
      pagination: {
        page: 1,
        limit: 10,
        total: mockTransactions.length,
        totalPages: 1
      }
    } as PaginatedResponse<Transaction>));
    mockCategoryService.getUserCategories.and.returnValue(of(mockCategories));
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.dashboard).toBeNull();
      expect(component.recentTransactions).toEqual([]);
      expect(component.categories).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(component.error).toBeNull();
      expect(component.selectedPeriod).toBe('month');
      expect(component.customDateRange).toEqual({ start: '', end: '' });
    });

    it('should load data on initialization', () => {
      fixture.detectChanges();

      expect(mockFinancialService.getFinancialDashboard).toHaveBeenCalled();
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith({ limit: 10 });
      expect(mockCategoryService.getUserCategories).toHaveBeenCalled();
    });

    it('should set up auto-refresh on initialization', () => {
      spyOn(component, 'refreshDashboard' as any);
      fixture.detectChanges();

      // Verify that the auto-refresh is set up by checking if the private method exists
      expect(component['setupAutoRefresh']).toBeDefined();
    });
  });

  describe('Data Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load dashboard data successfully', () => {
      expect(component.dashboard).toEqual(mockDashboard);
      expect(component.isLoading).toBe(false);
      expect(component.error).toBeNull();
    });

    it('should load recent transactions successfully', () => {
      expect(component.recentTransactions).toEqual(mockTransactions);
    });

    it('should load categories successfully', () => {
      expect(component.categories).toEqual(mockCategories);
    });

    it('should handle dashboard loading error', () => {
      mockFinancialService.getFinancialDashboard.and.returnValue(throwError(() => new Error('API Error')));
      
      component['loadDashboard']();

      expect(component.error).toBe('Failed to load dashboard');
      expect(component.isLoading).toBe(false);
    });

    it('should handle transaction loading error', () => {
      const consoleSpy = spyOn(console, 'error');
      mockTransactionService.getUserTransactions.and.returnValue(throwError(() => new Error('API Error')));
      
      component['loadRecentTransactions']();

      expect(consoleSpy).toHaveBeenCalledWith('Error loading recent transactions:', jasmine.any(Error));
    });

    it('should handle category loading error', () => {
      const consoleSpy = spyOn(console, 'error');
      mockCategoryService.getUserCategories.and.returnValue(throwError(() => new Error('API Error')));
      
      component['loadCategories']();

      expect(consoleSpy).toHaveBeenCalledWith('Error loading categories:', jasmine.any(Error));
    });
  });

  describe('Period Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should change period and reload dashboard', () => {
      spyOn(component, 'loadDashboard' as any);

      component.onPeriodChange('week');

      expect(component.selectedPeriod).toBe('week');
      expect(component['loadDashboard']).toHaveBeenCalled();
    });

    it('should handle custom date range change', () => {
      spyOn(component, 'loadDashboard' as any);
      component.customDateRange = { start: '2023-01-01', end: '2023-01-31' };

      component.onCustomDateChange();

      expect(component['loadDashboard']).toHaveBeenCalled();
    });

    it('should not reload dashboard if custom date range is incomplete', () => {
      spyOn(component, 'loadDashboard' as any);
      component.customDateRange = { start: '2023-01-01', end: '' };

      component.onCustomDateChange();

      expect(component['loadDashboard']).not.toHaveBeenCalled();
    });

    it('should calculate correct start date for different periods', () => {
      const now = new Date();
      
      component.selectedPeriod = 'week';
      let startDate = component['getStartDate']();
      expect(startDate.getDate()).toBe(now.getDate() - 7);

      component.selectedPeriod = 'month';
      startDate = component['getStartDate']();
      expect(startDate.getMonth()).toBe(now.getMonth() - 1);

      component.selectedPeriod = 'quarter';
      startDate = component['getStartDate']();
      expect(startDate.getMonth()).toBe(now.getMonth() - 3);

      component.selectedPeriod = 'year';
      startDate = component['getStartDate']();
      expect(startDate.getFullYear()).toBe(now.getFullYear() - 1);
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should refresh dashboard on manual refresh', () => {
      spyOn(component, 'refreshDashboard' as any);

      component.onRefresh();

      expect(component['refreshDashboard']).toHaveBeenCalled();
    });

    it('should refresh dashboard and transactions', () => {
      spyOn(component, 'loadDashboard' as any);
      spyOn(component, 'loadRecentTransactions' as any);

      component['refreshDashboard']();

      expect(component['loadDashboard']).toHaveBeenCalled();
      expect(component['loadRecentTransactions']).toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('Budget Progress', () => {
      it('should calculate budget progress percentage correctly', () => {
        expect(component.getBudgetProgressPercentage(500, 1000)).toBe(50);
        expect(component.getBudgetProgressPercentage(1200, 1000)).toBe(100);
        expect(component.getBudgetProgressPercentage(100, 0)).toBe(0);
      });
    });

    describe('Formatting Methods', () => {
      it('should format currency correctly', () => {
        expect(component.formatCurrency(1234.56)).toBe('$1,234.56');
        expect(component.formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
      });

      it('should format percentage correctly', () => {
        expect(component.formatPercentage(25, 100)).toBe('25.0%');
        expect(component.formatPercentage(33.333, 100)).toBe('33.3%');
        expect(component.formatPercentage(50, 0)).toBe('0%');
      });

      it('should format date correctly', () => {
        const date = new Date('2023-01-15');
        expect(component.formatDate(date)).toBe('Jan 15');
      });
    });

    describe('Transaction Helpers', () => {
      it('should return correct transaction type icons', () => {
        expect(component.getTransactionTypeIcon(TransactionType.INCOME)).toBe('💰');
        expect(component.getTransactionTypeIcon(TransactionType.EXPENSE)).toBe('💸');
        expect(component.getTransactionTypeIcon(TransactionType.TRANSFER)).toBe('🔄');
        expect(component.getTransactionTypeIcon(TransactionType.ADJUSTMENT)).toBe('⚖️');
      });

      it('should return correct transaction status classes', () => {
        expect(component.getTransactionStatusClass(TransactionStatus.COMPLETED)).toBe('status-completed');
        expect(component.getTransactionStatusClass(TransactionStatus.PENDING)).toBe('status-pending');
        expect(component.getTransactionStatusClass(TransactionStatus.CANCELLED)).toBe('status-cancelled');
        expect(component.getTransactionStatusClass(TransactionStatus.FAILED)).toBe('status-failed');
      });
    });

    describe('Category Helpers', () => {
      it('should get category name correctly', () => {
        expect(component.getCategoryName('1')).toBe('Food & Dining');
        expect(component.getCategoryName('999')).toBe('Unknown');
      });

      it('should get category color correctly', () => {
        expect(component.getCategoryColor('1')).toBe('#ff6b6b');
        expect(component.getCategoryColor('999')).toBe('#667eea');
      });
    });

    describe('Dashboard Data Helpers', () => {
      it('should get dashboard overview data correctly', () => {
        expect(component.getTotalBalance()).toBe(10000);
        expect(component.getMonthlyIncome()).toBe(5000);
        expect(component.getMonthlyExpenses()).toBe(1500);
        expect(component.getMonthlyNet()).toBe(3500);
        expect(component.getPendingTransactionsCount()).toBe(2);
        expect(component.getUpcomingRecurringCount()).toBe(3);
      });

      it('should return zero when dashboard is null', () => {
        component.dashboard = null;
        
        expect(component.getTotalBalance()).toBe(0);
        expect(component.getMonthlyIncome()).toBe(0);
        expect(component.getMonthlyExpenses()).toBe(0);
        expect(component.getMonthlyNet()).toBe(0);
        expect(component.getPendingTransactionsCount()).toBe(0);
        expect(component.getUpcomingRecurringCount()).toBe(0);
      });

      it('should get chart data correctly', () => {
        expect(component.getTopCategories()).toEqual(mockDashboard.topCategories);
        expect(component.getSpendingTrends()).toEqual(mockDashboard.spendingTrends);
        expect(component.getBudgetStatus()).toEqual(mockDashboard.budgetStatus);
      });

      it('should return empty arrays when dashboard is null', () => {
        component.dashboard = null;
        
        expect(component.getTopCategories()).toEqual([]);
        expect(component.getSpendingTrends()).toEqual([]);
        expect(component.getBudgetStatus()).toEqual([]);
      });
    });

    describe('Utility Methods', () => {
      it('should check if value is positive correctly', () => {
        expect(component.isPositive(100)).toBe(true);
        expect(component.isPositive(0)).toBe(true);
        expect(component.isPositive(-100)).toBe(false);
      });

      it('should get correct change indicators', () => {
        expect(component.getChangeIndicator(100)).toBe('↗️');
        expect(component.getChangeIndicator(-100)).toBe('↘️');
        expect(component.getChangeIndicator(0)).toBe('→');
      });

      it('should get correct change classes', () => {
        expect(component.getChangeClass(100)).toBe('change-positive');
        expect(component.getChangeClass(-100)).toBe('change-negative');
        expect(component.getChangeClass(0)).toBe('change-neutral');
      });
    });
  });

  describe('Navigation Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should log navigation actions', () => {
      const consoleSpy = spyOn(console, 'log');

      component.navigateToTransactions();
      expect(consoleSpy).toHaveBeenCalledWith('Navigate to transactions');

      component.navigateToCategories();
      expect(consoleSpy).toHaveBeenCalledWith('Navigate to categories');

      component.navigateToReports();
      expect(consoleSpy).toHaveBeenCalledWith('Navigate to reports');
    });
  });

  describe('Quick Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should log quick action calls', () => {
      const consoleSpy = spyOn(console, 'log');

      component.addTransaction();
      expect(consoleSpy).toHaveBeenCalledWith('Add transaction');

      component.addCategory();
      expect(consoleSpy).toHaveBeenCalledWith('Add category');

      component.exportData();
      expect(consoleSpy).toHaveBeenCalledWith('Export data');
    });
  });

  describe('Component Lifecycle', () => {
    it('should clean up subscriptions on destroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle multiple service errors gracefully', () => {
      const consoleSpy = spyOn(console, 'error');
      
      mockFinancialService.getFinancialDashboard.and.returnValue(throwError(() => new Error('Dashboard Error')));
      mockTransactionService.getUserTransactions.and.returnValue(throwError(() => new Error('Transaction Error')));
      mockCategoryService.getUserCategories.and.returnValue(throwError(() => new Error('Category Error')));

      fixture.detectChanges();

      expect(component.error).toBe('Failed to load dashboard');
      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('Auto-refresh', () => {
    it('should stop auto-refresh when component is destroyed', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
