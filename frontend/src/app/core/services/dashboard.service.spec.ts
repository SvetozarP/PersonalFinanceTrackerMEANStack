import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
import { FinancialService } from './financial.service';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { FinancialDashboard, Category, Transaction, TransactionStats, CategoryStats } from '../models/financial.model';
import { of, throwError } from 'rxjs';

describe('DashboardService', () => {
  let service: DashboardService;
  let financialService: jasmine.SpyObj<FinancialService>;
  let categoryService: jasmine.SpyObj<CategoryService>;
  let transactionService: jasmine.SpyObj<TransactionService>;

  const mockDashboard: FinancialDashboard = {
    overview: {
      totalBalance: 10000,
      monthlyIncome: 5000,
      monthlyExpenses: 3000,
      monthlyNet: 2000,
      pendingTransactions: 5,
      upcomingRecurring: 3
    },
    recentTransactions: [],
    topCategories: [],
    spendingTrends: [],
    budgetStatus: []
  };

  const mockCategory: Category = {
    _id: 'cat1',
    name: 'Test Category',
    description: 'Test Description',
    color: '#FF0000',
    icon: 'test-icon',
    path: ['Test Category'],
    level: 1,
    isActive: true,
    isSystem: false,
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTransaction: Transaction = {
    _id: '1',
    title: 'Test Transaction',
    description: 'Test Description',
    amount: 100,
    currency: 'USD',
    type: 'expense' as any,
    status: 'completed' as any,
    categoryId: 'cat1',
    tags: [],
    date: new Date(),
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
  };

  const mockTransactionStats: TransactionStats = {
    totalTransactions: 100,
    totalIncome: 5000,
    totalExpenses: 3000,
    totalTransfers: 0,
    transactionsByType: {
      income: { count: 20, total: 5000 },
      expense: { count: 80, total: 3000 }
    },
    transactionsByCategory: [
      {
        categoryId: 'cat1',
        categoryName: 'Test Category',
        count: 50,
        total: 1000,
        percentage: 25,
        color: '#FF0000',
        icon: 'test-icon'
      }
    ],
    monthlyTrends: [
      {
        month: '2024-01',
        income: 5000,
        expenses: 3000,
        net: 2000
      }
    ]
  };

  const mockCategoryStats: CategoryStats = {
    totalCategories: 10,
    activeCategories: 8,
    categoriesByLevel: { 1: 5, 2: 3, 3: 2 },
    topCategories: [
      {
        categoryId: 'cat1',
        name: 'Test Category',
        transactionCount: 50,
        totalAmount: 1000,
        percentage: 25
      }
    ]
  };

  beforeEach(() => {
    const financialServiceSpy = jasmine.createSpyObj('FinancialService', [
      'getFinancialDashboard'
    ], {
      dashboardState$: of({
        dashboard: mockDashboard,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      })
    });

    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getUserCategories', 'getCategoryStats'
    ], {
      categoryState$: of({
        categories: [mockCategory],
        categoryTree: [mockCategory],
        stats: null,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      })
    });

    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', [
      'getTransactionStats'
    ], {
      transactionState$: of({
        transactions: [mockTransaction],
        stats: mockTransactionStats,
        recurringTransactions: [],
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      })
    });

    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        { provide: FinancialService, useValue: financialServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: TransactionService, useValue: transactionServiceSpy }
      ]
    });

    service = TestBed.inject(DashboardService);
    financialService = TestBed.inject(FinancialService) as jasmine.SpyObj<FinancialService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    transactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initializeDashboard', () => {
    it('should initialize dashboard with all data', () => {
      financialService.getFinancialDashboard.and.returnValue(of(mockDashboard));
      categoryService.getUserCategories.and.returnValue(of([mockCategory]));
      transactionService.getTransactionStats.and.returnValue(of(mockTransactionStats));
      categoryService.getCategoryStats.and.returnValue(of(mockCategoryStats));

      service.initializeDashboard().subscribe(state => {
        expect(state.dashboard).toEqual(mockDashboard);
        expect(state.categories).toEqual([mockCategory]);
        expect(state.stats).toEqual(mockTransactionStats);
        expect(state.categoryStats).toEqual(mockCategoryStats);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
      });

      expect(financialService.getFinancialDashboard).toHaveBeenCalled();
      expect(categoryService.getUserCategories).toHaveBeenCalled();
      expect(transactionService.getTransactionStats).toHaveBeenCalled();
      expect(categoryService.getCategoryStats).toHaveBeenCalled();
    });

    it('should handle errors during initialization', () => {
      const errorMessage = 'Failed to fetch dashboard data';
      financialService.getFinancialDashboard.and.returnValue(throwError(() => new Error(errorMessage)));

      service.initializeDashboard().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe(errorMessage);
        }
      });
    });

    it('should pass options to services', () => {
      const options = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        accountId: 'account1',
        forceRefresh: true
      };

      financialService.getFinancialDashboard.and.returnValue(of(mockDashboard));
      categoryService.getUserCategories.and.returnValue(of([mockCategory]));
      transactionService.getTransactionStats.and.returnValue(of(mockTransactionStats));
      categoryService.getCategoryStats.and.returnValue(of(mockCategoryStats));

      service.initializeDashboard(options).subscribe();

      expect(financialService.getFinancialDashboard).toHaveBeenCalledWith(options);
      expect(transactionService.getTransactionStats).toHaveBeenCalledWith(options);
    });
  });

  describe('refreshDashboard', () => {
    it('should refresh dashboard with force refresh', () => {
      const options = { startDate: new Date('2024-01-01') };
      financialService.getFinancialDashboard.and.returnValue(of(mockDashboard));
      categoryService.getUserCategories.and.returnValue(of([mockCategory]));
      transactionService.getTransactionStats.and.returnValue(of(mockTransactionStats));
      categoryService.getCategoryStats.and.returnValue(of(mockCategoryStats));

      service.refreshDashboard(options).subscribe();

      expect(financialService.getFinancialDashboard).toHaveBeenCalledWith({ ...options, forceRefresh: true });
    });
  });

  describe('Observable Properties', () => {
    it('should provide dashboard observable', () => {
      service.dashboard$.subscribe(dashboard => {
        expect(dashboard).toBeDefined();
      });
    });

    it('should provide categories observable', () => {
      service.categories$.subscribe(categories => {
        expect(categories).toBeDefined();
      });
    });

    it('should provide recent transactions observable', () => {
      service.recentTransactions$.subscribe(transactions => {
        expect(transactions).toBeDefined();
      });
    });

    it('should provide stats observable', () => {
      service.stats$.subscribe(stats => {
        expect(stats).toBeDefined();
      });
    });

    it('should provide category stats observable', () => {
      service.categoryStats$.subscribe(categoryStats => {
        expect(categoryStats).toBeDefined();
      });
    });

    it('should provide loading state observable', () => {
      service.isLoading$.subscribe(isLoading => {
        expect(typeof isLoading).toBe('boolean');
      });
    });

    it('should provide error state observable', () => {
      service.error$.subscribe(error => {
        expect(error).toBeDefined();
      });
    });
  });

  describe('Derived Observables', () => {
    it('should provide dashboard overview observable', () => {
      service.dashboardOverview$.subscribe(overview => {
        expect(overview).toBeDefined();
      });
    });

    it('should provide top categories observable', () => {
      service.topCategories$.subscribe(categories => {
        expect(categories).toBeDefined();
      });
    });

    it('should provide spending trends observable', () => {
      service.spendingTrends$.subscribe(trends => {
        expect(trends).toBeDefined();
      });
    });

    it('should provide budget status observable', () => {
      service.budgetStatus$.subscribe(status => {
        expect(status).toBeDefined();
      });
    });

    it('should provide pending transactions count observable', () => {
      service.pendingTransactionsCount$.subscribe(count => {
        expect(typeof count).toBe('number');
      });
    });

    it('should provide upcoming recurring count observable', () => {
      service.upcomingRecurringCount$.subscribe(count => {
        expect(typeof count).toBe('number');
      });
    });

    it('should provide monthly net observable', () => {
      service.monthlyNet$.subscribe(net => {
        expect(typeof net).toBe('number');
      });
    });

    it('should provide monthly income observable', () => {
      service.monthlyIncome$.subscribe(income => {
        expect(typeof income).toBe('number');
      });
    });

    it('should provide monthly expenses observable', () => {
      service.monthlyExpenses$.subscribe(expenses => {
        expect(typeof expenses).toBe('number');
      });
    });

    it('should provide total balance observable', () => {
      service.totalBalance$.subscribe(balance => {
        expect(typeof balance).toBe('number');
      });
    });
  });

  describe('Data Retrieval Methods', () => {
    it('should get dashboard overview', () => {
      service.getDashboardOverview().subscribe(overview => {
        expect(overview).toBeDefined();
      });
    });

    it('should get recent transactions', () => {
      service.getRecentTransactions().subscribe(transactions => {
        expect(transactions).toBeDefined();
      });
    });

    it('should get top categories', () => {
      service.getTopCategories().subscribe(categories => {
        expect(categories).toBeDefined();
      });
    });

    it('should get spending trends', () => {
      service.getSpendingTrends().subscribe(trends => {
        expect(trends).toBeDefined();
      });
    });

    it('should get budget status', () => {
      service.getBudgetStatus().subscribe(status => {
        expect(status).toBeDefined();
      });
    });
  });

  describe('Combined Data Methods', () => {
    it('should get categories with transaction counts', () => {
      service.getCategoriesWithTransactionCounts().subscribe(categories => {
        expect(categories).toBeDefined();
        if (categories.length > 0) {
          expect(categories[0].transactionCount).toBeDefined();
          expect(categories[0].totalAmount).toBeDefined();
        }
      });
    });

    it('should get income vs expenses comparison', () => {
      service.getIncomeVsExpenses().subscribe(comparison => {
        expect(comparison.income).toBeDefined();
        expect(comparison.expenses).toBeDefined();
        expect(comparison.net).toBeDefined();
      });
    });

    it('should get monthly spending breakdown', () => {
      service.getMonthlySpendingBreakdown().subscribe(breakdown => {
        expect(Array.isArray(breakdown)).toBe(true);
      });
    });

    it('should get category spending breakdown', () => {
      service.getCategorySpendingBreakdown().subscribe(breakdown => {
        expect(Array.isArray(breakdown)).toBe(true);
        if (breakdown.length > 0) {
          expect(breakdown[0].categoryId).toBeDefined();
          expect(breakdown[0].categoryName).toBeDefined();
          expect(breakdown[0].amount).toBeDefined();
          expect(breakdown[0].percentage).toBeDefined();
        }
      });
    });
  });

  describe('Filtered Data Methods', () => {
    it('should get transactions by category', () => {
      service.getTransactionsByCategory('cat1').subscribe(transactions => {
        expect(Array.isArray(transactions)).toBe(true);
      });
    });

    it('should get transactions by type', () => {
      service.getTransactionsByType('expense').subscribe(transactions => {
        expect(Array.isArray(transactions)).toBe(true);
      });
    });
  });

  describe('Dashboard Summary', () => {
    it('should get dashboard summary', () => {
      service.getDashboardSummary().subscribe(summary => {
        expect(summary.totalTransactions).toBeDefined();
        expect(summary.totalCategories).toBeDefined();
        expect(summary.totalIncome).toBeDefined();
        expect(summary.totalExpenses).toBeDefined();
        expect(summary.netAmount).toBeDefined();
        expect(summary.pendingTransactions).toBeDefined();
        expect(summary.upcomingRecurring).toBeDefined();
      });
    });
  });

  describe('State Management', () => {
    it('should get current dashboard state', () => {
      const state = service.getCurrentDashboardState();
      expect(state).toBeDefined();
      expect(state.dashboard).toBeDefined();
      expect(state.categories).toBeDefined();
      expect(state.isLoading).toBeDefined();
      expect(state.error).toBeDefined();
    });

    it('should clear dashboard state', () => {
      service.clearDashboardState();
      const state = service.getCurrentDashboardState();
      expect(state.dashboard).toBeNull();
      expect(state.categories).toEqual([]);
      expect(state.stats).toBeNull();
      expect(state.categoryStats).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
