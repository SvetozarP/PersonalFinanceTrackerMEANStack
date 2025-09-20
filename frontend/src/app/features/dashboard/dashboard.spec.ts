import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideZonelessChangeDetection } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';

import { DashboardComponent } from './dashboard';
import { DashboardService } from '../../core/services/dashboard.service';
import { FinancialService } from '../../core/services/financial.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { AuthService } from '../../features/auth/services/auth.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let financialService: jasmine.SpyObj<FinancialService>;
  let categoryService: jasmine.SpyObj<CategoryService>;
  let transactionService: jasmine.SpyObj<TransactionService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getDashboardData']);
    const financialServiceSpy = jasmine.createSpyObj('FinancialService', ['getFinancialDashboard']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategoryStats']);
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getUserTransactions']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        RouterTestingModule
      ],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceSpy },
        { provide: FinancialService, useValue: financialServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy },
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        provideZonelessChangeDetection()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    dashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
    financialService = TestBed.inject(FinancialService) as jasmine.SpyObj<FinancialService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
    transactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default return values
    financialService.getFinancialDashboard.and.returnValue(of({} as any));
    transactionService.getUserTransactions.and.returnValue(of({ data: [], total: 0, page: 1, totalPages: 0, pagination: {} } as any));
    categoryService.getCategoryStats.and.returnValue(of({} as any));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isDashboardLoading).toBe(false);
    expect(component.isChartDataLoading).toBe(false);
    expect(component.isRecentTransactionsLoading).toBe(false);
    expect(component.isCategoryStatsLoading).toBe(false);
    expect(component.isQuickActionsLoading).toBe(false);
    expect(component.dashboardData).toBeNull();
    expect(component.recentTransactions).toEqual([]);
    expect(component.categoryStats).toBeNull();
    expect(component.error).toBeNull();
  });

  it('should load dashboard data on init', () => {
    spyOn(component as any, 'loadDashboardData');
    
    component.ngOnInit();
    
    expect((component as any).loadDashboardData).toHaveBeenCalled();
  });

  it('should refresh dashboard', () => {
    spyOn(component as any, 'loadDashboardData');
    
    component.refreshDashboard();
    
    expect((component as any).loadDashboardData).toHaveBeenCalled();
  });

  it('should get total balance', () => {
    component.dashboardData = { overview: { totalBalance: 1000 } } as any;
    expect(component.getTotalBalance()).toBe(1000);
  });

  it('should get total income', () => {
    component.dashboardData = { overview: { monthlyIncome: 5000 } } as any;
    expect(component.getTotalIncome()).toBe(5000);
  });

  it('should get total expenses', () => {
    component.dashboardData = { overview: { monthlyExpenses: 3000 } } as any;
    expect(component.getTotalExpenses()).toBe(3000);
  });

  it('should calculate savings rate', () => {
    component.dashboardData = { overview: { monthlyIncome: 5000, monthlyExpenses: 3000 } } as any;
    expect(component.getSavingsRate()).toBe(40);
  });

  it('should get net worth', () => {
    component.dashboardData = { overview: { monthlyNet: 2000 } } as any;
    expect(component.getNetWorth()).toBe(2000);
  });

  it('should get category name by ID', () => {
    component.categoryStats = { topCategories: [{ categoryId: 'cat1', name: 'Food' }] } as any;
    expect(component.getCategoryName('cat1')).toBe('Food');
    expect(component.getCategoryName('unknown')).toBe('Unknown');
  });

  it('should clear error', () => {
    component.error = 'Test error';
    component.clearError();
    expect(component.error).toBeNull();
  });

  it('should check loading state', () => {
    component.isDashboardLoading = true;
    expect(component.isLoading).toBe(true);
    
    component.isDashboardLoading = false;
    expect(component.isLoading).toBe(false);
  });

  it('should check data loaded state', () => {
    component.isDashboardLoading = false;
    component.error = null;
    component.dashboardData = {} as any;
    expect(component.isDataLoaded).toBe(true);
    
    component.dashboardData = null;
    expect(component.isDataLoaded).toBe(false);
  });

  describe('Error handling', () => {
    it('should handle dashboard data loading error', () => {
      const error = new Error('API Error');
      financialService.getFinancialDashboard.and.returnValue(throwError(() => error));
      
      component.ngOnInit();
      
      expect(component.error).toBe('Failed to load dashboard data');
      expect(component.isDashboardLoading).toBe(false);
    });

    it('should handle transaction refresh error', () => {
      const error = new Error('Transaction Error');
      transactionService.getUserTransactions.and.returnValue(throwError(() => error));
      
      component.refreshTransactions();
      
      expect(component.error).toBe('Failed to refresh transactions');
      expect(component.isRecentTransactionsLoading).toBe(false);
    });

    it('should handle category stats refresh error', () => {
      const error = new Error('Category Error');
      categoryService.getCategoryStats.and.returnValue(throwError(() => error));
      
      component.refreshCategoryStats();
      
      expect(component.error).toBe('Failed to refresh category stats');
      expect(component.isCategoryStatsLoading).toBe(false);
    });

    it('should handle dashboard data refresh error in category stats', () => {
      const categoryStats = { 
        totalCategories: 5,
        activeCategories: 3,
        categoriesByLevel: { 1: 2, 2: 1 },
        topCategories: [{ 
          categoryId: 'cat1', 
          name: 'Food', 
          transactionCount: 10,
          totalAmount: 100, 
          percentage: 25 
        }] 
      };
      const error = new Error('Dashboard Error');
      
      categoryService.getCategoryStats.and.returnValue(of(categoryStats));
      financialService.getFinancialDashboard.and.returnValue(throwError(() => error));
      
      component.refreshCategoryStats();
      
      expect(component.categoryStats).toEqual(categoryStats);
      expect(component.isCategoryStatsLoading).toBe(false);
    });
  });

  describe('Edge cases and conditional logic', () => {
    it('should handle null dashboard data in prepareChartData', () => {
      component.dashboardData = null;
      
      component['prepareChartData']();
      
      expect(component.spendingChartData).toEqual([]);
      expect(component.incomeChartData).toEqual([]);
      expect(component.categoryChartData).toEqual([]);
    });

    it('should handle missing spending trends in prepareChartData', () => {
      component.dashboardData = { overview: { monthlyIncome: 1000 } } as any;
      
      component['prepareChartData']();
      
      expect(component.spendingChartData).toEqual([]);
      expect(component.incomeChartData).toEqual([{ month: 'Current Month', amount: 1000 }]);
    });

    it('should handle missing top categories in prepareChartData', () => {
      component.dashboardData = { 
        overview: { monthlyIncome: 1000 },
        spendingTrends: [{ month: 'Jan', expenses: 500 }]
      } as any;
      
      component['prepareChartData']();
      
      expect(component.categoryChartData).toEqual([]);
    });

    it('should handle null category stats in updateCategoryChartData', () => {
      component.categoryStats = null;
      
      component['updateCategoryChartData']();
      
      expect(component.categoryChartData).toEqual([]);
    });

    it('should handle missing top categories in updateCategoryChartData', () => {
      component.categoryStats = { topCategories: null } as any;
      
      component['updateCategoryChartData']();
      
      expect(component.categoryChartData).toEqual([]);
    });

    it('should handle savings rate calculation with zero income', () => {
      component.dashboardData = { overview: { monthlyIncome: 0, monthlyExpenses: 1000 } } as any;
      expect(component.getSavingsRate()).toBe(0);
    });

    it('should handle savings rate calculation with null income', () => {
      component.dashboardData = { overview: { monthlyIncome: null, monthlyExpenses: 1000 } } as any;
      expect(component.getSavingsRate()).toBe(0);
    });

    it('should handle getCategoryName with null categoryId', () => {
      component.categoryStats = { topCategories: [{ categoryId: 'cat1', name: 'Food' }] } as any;
      expect(component.getCategoryName(null as any)).toBe('Unknown');
    });

    it('should handle getCategoryName with empty categoryId', () => {
      component.categoryStats = { topCategories: [{ categoryId: 'cat1', name: 'Food' }] } as any;
      expect(component.getCategoryName('')).toBe('Unknown');
    });

    it('should handle getCategoryName with null categoryStats', () => {
      component.categoryStats = null;
      expect(component.getCategoryName('cat1')).toBe('Unknown');
    });

    it('should handle getCategoryName with missing topCategories', () => {
      component.categoryStats = { topCategories: null } as any;
      expect(component.getCategoryName('cat1')).toBe('Unknown');
    });

    it('should handle getCategoryName with category not found', () => {
      component.categoryStats = { topCategories: [{ categoryId: 'cat1', name: 'Food' }] } as any;
      expect(component.getCategoryName('cat2')).toBe('Unknown');
    });

    it('should handle getCategoryName with category found but no name', () => {
      component.categoryStats = { topCategories: [{ categoryId: 'cat1', name: null }] } as any;
      expect(component.getCategoryName('cat1')).toBe('Unknown');
    });
  });

  describe('Loading state combinations', () => {
    it('should return true for isLoading when any loading state is true', () => {
      component.isDashboardLoading = false;
      component.isChartDataLoading = true;
      component.isRecentTransactionsLoading = false;
      component.isCategoryStatsLoading = false;
      component.isQuickActionsLoading = false;
      
      expect(component.isLoading).toBe(true);
    });

    it('should return true for isLoading when recent transactions loading', () => {
      component.isDashboardLoading = false;
      component.isChartDataLoading = false;
      component.isRecentTransactionsLoading = true;
      component.isCategoryStatsLoading = false;
      component.isQuickActionsLoading = false;
      
      expect(component.isLoading).toBe(true);
    });

    it('should return true for isLoading when category stats loading', () => {
      component.isDashboardLoading = false;
      component.isChartDataLoading = false;
      component.isRecentTransactionsLoading = false;
      component.isCategoryStatsLoading = true;
      component.isQuickActionsLoading = false;
      
      expect(component.isLoading).toBe(true);
    });

    it('should return true for isLoading when quick actions loading', () => {
      component.isDashboardLoading = false;
      component.isChartDataLoading = false;
      component.isRecentTransactionsLoading = false;
      component.isCategoryStatsLoading = false;
      component.isQuickActionsLoading = true;
      
      expect(component.isLoading).toBe(true);
    });

    it('should return false for isDataLoaded when loading', () => {
      component.isDashboardLoading = true;
      component.error = null;
      component.dashboardData = {} as any;
      
      expect(component.isDataLoaded).toBe(false);
    });

    it('should return false for isDataLoaded when error exists', () => {
      component.isDashboardLoading = false;
      component.error = 'Test error';
      component.dashboardData = {} as any;
      
      expect(component.isDataLoaded).toBe(false);
    });
  });

  describe('Chart data preparation with complex data', () => {
    it('should prepare chart data with complete dashboard data', () => {
      const mockDashboardData = {
        overview: { monthlyIncome: 5000 },
        spendingTrends: [
          { month: 'Jan', expenses: 2000 },
          { month: 'Feb', expenses: 1500 }
        ],
        topCategories: [
          { name: 'Food', totalAmount: 800, percentage: 40 },
          { name: 'Transport', amount: 600, percentage: 30 }
        ]
      };
      
      component.dashboardData = mockDashboardData as any;
      component['prepareChartData']();
      
      expect(component.spendingChartData).toEqual([
        { month: 'Jan', amount: 2000 },
        { month: 'Feb', amount: 1500 }
      ]);
      expect(component.incomeChartData).toEqual([
        { month: 'Current Month', amount: 5000 }
      ]);
      expect(component.categoryChartData).toEqual([
        { category: 'Food', amount: 800, percentage: 40 },
        { category: 'Transport', amount: 600, percentage: 30 }
      ]);
    });

    it('should handle category data with missing totalAmount but present amount', () => {
      const mockDashboardData = {
        overview: { monthlyIncome: 5000 },
        topCategories: [
          { name: 'Food', amount: 800, percentage: 40 }
        ]
      };
      
      component.dashboardData = mockDashboardData as any;
      component['prepareChartData']();
      
      expect(component.categoryChartData).toEqual([
        { category: 'Food', amount: 800, percentage: 40 }
      ]);
    });
  });

  describe('Category stats refresh with dashboard data update', () => {
    it('should update category chart data from dashboard data', () => {
      const categoryStats = { 
        totalCategories: 5,
        activeCategories: 3,
        categoriesByLevel: { 1: 2, 2: 1 },
        topCategories: [{ 
          categoryId: 'cat1', 
          name: 'Food', 
          transactionCount: 10,
          totalAmount: 100, 
          percentage: 25 
        }] 
      };
      const dashboardData = {
        overview: { totalBalance: 1000, monthlyIncome: 5000, monthlyExpenses: 3000, monthlyNet: 2000, pendingTransactions: 0, upcomingRecurring: 0 },
        recentTransactions: [],
        spendingTrends: [],
        budgetStatus: [],
        topCategories: [
          { name: 'Food', totalAmount: 200, percentage: 50 }
        ]
      };
      
      categoryService.getCategoryStats.and.returnValue(of(categoryStats));
      financialService.getFinancialDashboard.and.returnValue(of(dashboardData));
      
      component.refreshCategoryStats();
      
      expect(component.categoryStats).toEqual(categoryStats);
      expect(component.dashboardData).toEqual(dashboardData);
      expect(component.categoryChartData).toEqual([
        { category: 'Food', amount: 200, percentage: 50 }
      ]);
      expect(component.isCategoryStatsLoading).toBe(false);
    });

    it('should handle dashboard data with missing category names', () => {
      const categoryStats = { 
        totalCategories: 5,
        activeCategories: 3,
        categoriesByLevel: { 1: 2, 2: 1 },
        topCategories: [{ 
          categoryId: 'cat1', 
          name: 'Food', 
          transactionCount: 10,
          totalAmount: 100, 
          percentage: 25 
        }] 
      };
      const dashboardData = {
        overview: { totalBalance: 1000, monthlyIncome: 5000, monthlyExpenses: 3000, monthlyNet: 2000, pendingTransactions: 0, upcomingRecurring: 0 },
        recentTransactions: [],
        spendingTrends: [],
        budgetStatus: [],
        topCategories: [
          { category: 'Food', totalAmount: 200, percentage: 50 }
        ]
      };
      
      categoryService.getCategoryStats.and.returnValue(of(categoryStats));
      financialService.getFinancialDashboard.and.returnValue(of(dashboardData));
      
      component.refreshCategoryStats();
      
      expect(component.categoryChartData).toEqual([
        { category: 'Food', amount: 200, percentage: 50 }
      ]);
    });

    it('should handle dashboard data with missing amounts and percentages', () => {
      const categoryStats = { 
        totalCategories: 5,
        activeCategories: 3,
        categoriesByLevel: { 1: 2, 2: 1 },
        topCategories: [{ 
          categoryId: 'cat1', 
          name: 'Food', 
          transactionCount: 10,
          totalAmount: 100, 
          percentage: 25 
        }] 
      };
      const dashboardData = {
        overview: { totalBalance: 1000, monthlyIncome: 5000, monthlyExpenses: 3000, monthlyNet: 2000, pendingTransactions: 0, upcomingRecurring: 0 },
        recentTransactions: [],
        spendingTrends: [],
        budgetStatus: [],
        topCategories: [
          { name: 'Food' }
        ]
      };
      
      categoryService.getCategoryStats.and.returnValue(of(categoryStats));
      financialService.getFinancialDashboard.and.returnValue(of(dashboardData));
      
      component.refreshCategoryStats();
      
      expect(component.categoryChartData).toEqual([
        { category: 'Food', amount: 0, percentage: 0 }
      ]);
    });
  });

  describe('Logout functionality', () => {
    it('should call authService logout and navigate to login', () => {
      component.logout();
      
      expect(authService.logout).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
    });
  });

  it('should complete destroy$ on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});