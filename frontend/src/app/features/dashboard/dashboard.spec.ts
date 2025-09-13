import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
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

  it('should logout and navigate to login', () => {
    component.logout();
    expect(authService.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should complete destroy$ on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});