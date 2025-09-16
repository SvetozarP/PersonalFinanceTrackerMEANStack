import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { BudgetManagementComponent } from './budget-management';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { BudgetService } from '../../../../core/services/budget.service';
import { RealtimeBudgetProgressService } from '../../../../core/services/realtime-budget-progress.service';
import { Category, Transaction, TransactionType, PaginatedResponse } from '../../../../core/models/financial.model';

describe('BudgetManagementComponent', () => {
  let component: BudgetManagementComponent;
  let fixture: ComponentFixture<BudgetManagementComponent>;
  let mockFinancialService: jasmine.SpyObj<FinancialService>;
  let mockTransactionService: jasmine.SpyObj<TransactionService>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;
  let mockBudgetService: jasmine.SpyObj<BudgetService>;
  let mockRealtimeBudgetProgressService: jasmine.SpyObj<RealtimeBudgetProgressService>;

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
      date: new Date(),
      timezone: 'UTC',
      paymentMethod: 'debit_card' as any,
      isRecurring: false,
      recurrencePattern: 'none' as any,
      attachments: [],
      source: 'manual',
      userId: 'user1',
      accountId: 'account1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
      isDeleted: false
    }
  ];

  beforeEach(async () => {
    mockFinancialService = jasmine.createSpyObj('FinancialService', ['getFinancialDashboard']);
    mockTransactionService = jasmine.createSpyObj('TransactionService', ['getUserTransactions']);
    mockCategoryService = jasmine.createSpyObj('CategoryService', ['getUserCategories']);
    mockBudgetService = jasmine.createSpyObj('BudgetService', ['getBudgets', 'getBudgetSummary', 'createBudget', 'updateBudget', 'deleteBudget']);
    mockRealtimeBudgetProgressService = jasmine.createSpyObj('RealtimeBudgetProgressService', ['getRealtimeProgress', 'getBudgetStats', 'getAlerts', 'getConnectionStatus']);

    // Setup default return values
    mockCategoryService.getUserCategories.and.returnValue(of(mockCategories));
    mockTransactionService.getUserTransactions.and.returnValue(of({ 
      data: mockTransactions,
      pagination: {
        page: 1,
        limit: 10,
        total: mockTransactions.length,
        totalPages: 1
      }
    }));
    mockBudgetService.getBudgets.and.returnValue(of({ 
      budgets: [], 
      total: 0, 
      page: 1, 
      totalPages: 0 
    }));
    mockBudgetService.getBudgetSummary.and.returnValue(of({
      totalBudgetAmount: 0,
      totalSpentAmount: 0,
      totalRemainingAmount: 0,
      activeBudgetCount: 0,
      overBudgetCount: 0,
      upcomingDeadlines: []
    }));
    mockBudgetService.createBudget.and.returnValue(of({
      _id: 'new-budget',
      name: 'New Budget',
      description: 'Test Budget',
      period: 'monthly',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      totalAmount: 500,
      currency: 'USD',
      categoryAllocations: [],
      status: 'active',
      alertThreshold: 80,
      userId: 'user1',
      isActive: true,
      autoAdjust: false,
      allowRollover: false,
      rolloverAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    mockBudgetService.updateBudget.and.returnValue(of({
      _id: '1',
      name: 'Monthly Household Budget',
      description: 'Monthly budget for household expenses',
      period: 'monthly',
      startDate: new Date(2024, 0, 1),
      endDate: new Date(2024, 11, 31),
      totalAmount: 600,
      currency: 'USD',
      categoryAllocations: [
        { categoryId: '1', allocatedAmount: 500, isFlexible: false, priority: 1 },
        { categoryId: '2', allocatedAmount: 300, isFlexible: false, priority: 2 },
        { categoryId: '3', allocatedAmount: 200, isFlexible: true, priority: 3 }
      ],
      status: 'active',
      alertThreshold: 80,
      userId: 'user1',
      isActive: true,
      autoAdjust: false,
      allowRollover: false,
      rolloverAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Setup RealtimeBudgetProgressService mock return values
    mockRealtimeBudgetProgressService.getRealtimeProgress.and.returnValue(of([]));
    mockRealtimeBudgetProgressService.getBudgetStats.and.returnValue(of(null));
    mockRealtimeBudgetProgressService.getAlerts.and.returnValue(of([]));
    mockRealtimeBudgetProgressService.getConnectionStatus.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [
        BudgetManagementComponent,
        ReactiveFormsModule,
        FormsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: FinancialService, useValue: mockFinancialService },
        { provide: TransactionService, useValue: mockTransactionService },
        { provide: CategoryService, useValue: mockCategoryService },
        { provide: BudgetService, useValue: mockBudgetService },
        { provide: RealtimeBudgetProgressService, useValue: mockRealtimeBudgetProgressService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgetManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    // Clean up any spies to prevent conflicts
    if (window.confirm && (window.confirm as any).and && (window.confirm as any).and.restore) {
      (window.confirm as any).and.restore();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isLoading).toBeFalse();
    expect(component.showAddBudget).toBeFalse();
    expect(component.editingBudgetId).toBeNull();
    expect(component.selectedPeriod).toBe('monthly');
    expect(component.selectedCategory).toBe('');
  });

  it('should load data on initialization', () => {
    // Manually trigger data loading since we prevent it in test environment
    component['loadData']();
    expect(mockCategoryService.getUserCategories).toHaveBeenCalled();
    expect(mockTransactionService.getUserTransactions).toHaveBeenCalled();
  });

  it('should initialize forms correctly', () => {
    expect(component.budgetForm).toBeDefined();
    expect(component.editBudgetForm).toBeDefined();
    expect(component.budgetForm.get('period')?.value).toBe('monthly');
  });

  it('should show add budget form', () => {
    component.showAddBudgetForm();
    expect(component.showAddBudget).toBeTrue();
    expect(component.budgetForm.get('period')?.value).toBe('monthly');
  });

  it('should hide add budget form', () => {
    component.showAddBudget = true;
    component.hideAddBudgetForm();
    expect(component.showAddBudget).toBeFalse();
  });

  it('should create mock budgets', () => {
    const mockBudgets = component['createMockBudgets']();
    expect(mockBudgets.length).toBe(1);
    expect(mockBudgets[0].name).toBe('Monthly Household Budget');
    expect(mockBudgets[0].totalAmount).toBe(2000);
    expect(mockBudgets[0].categoryAllocations.length).toBe(3);
  });

  it('should calculate budget progress correctly', () => {
    // Setup component with mock data
    component.budgets = component['createMockBudgets']();
    component.transactions = mockTransactions;
    
    component['calculateBudgetProgress']();
    
    expect(component.budgetProgress.length).toBe(3);
    expect(component.totalBudget).toBe(2000); // From mock budget totalAmount
    expect(component.totalSpent).toBe(150); // Only one transaction
    expect(component.totalRemaining).toBe(1850); // 2000 - 150
  });

  it('should handle period change', () => {
    component.onPeriodChange('quarterly');
    expect(component.selectedPeriod).toBe('quarterly');
  });

  it('should handle category filter', () => {
    component.onCategoryFilter('1');
    expect(component.selectedCategory).toBe('1');
  });

  it('should get status color correctly', () => {
    expect(component.getStatusColor('under')).toBe('#28a745');
    expect(component.getStatusColor('at')).toBe('#ffc107');
    expect(component.getStatusColor('over')).toBe('#dc3545');
  });

  it('should get status icon correctly', () => {
    expect(component.getStatusIcon('under')).toBe('fas fa-check-circle');
    expect(component.getStatusIcon('at')).toBe('fas fa-exclamation-circle');
    expect(component.getStatusIcon('over')).toBe('fas fa-times-circle');
  });

  it('should get progress bar color correctly', () => {
    expect(component.getProgressBarColor(85)).toBe('#ffc107');
    expect(component.getProgressBarColor(95)).toBe('#dc3545');
    expect(component.getProgressBarColor(50)).toBe('#28a745');
  });

  it('should calculate days remaining correctly', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    
    const daysRemaining = component['calculateDaysRemaining'](futureDate);
    expect(daysRemaining).toBeGreaterThan(0);
    expect(daysRemaining).toBeLessThanOrEqual(10);
  });

  it('should get on track count correctly', () => {
    component.budgetProgress = [
      { status: 'under' } as any,
      { status: 'under' } as any,
      { status: 'over' } as any
    ];
    
    expect(component.getOnTrackCount()).toBe(2);
  });

  it('should get over budget count correctly', () => {
    component.budgetProgress = [
      { status: 'under' } as any,
      { status: 'over' } as any,
      { status: 'over' } as any
    ];
    
    expect(component.getOverBudgetCount()).toBe(2);
  });

  it('should get budget progress by category ID', () => {
    const mockProgress = { categoryId: '1', categoryName: 'Test' } as any;
    component.budgetProgress = [mockProgress];
    
    const result = component.getBudgetProgress('1');
    expect(result).toEqual(mockProgress);
  });

  it('should handle form submission with valid data', () => {
    const mockCategory = mockCategories[0];
    component.categories = mockCategories;
    component.budgetForm.patchValue({
      name: 'Test Budget',
      description: 'Test Description',
      categoryId: '1',
      amount: 500,
      period: 'monthly',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      currency: 'USD'
    });

    const initialBudgetCount = component.budgets.length;
    component.onSubmitBudget();
    
    expect(component.budgets.length).toBe(initialBudgetCount + 1);
    expect(component.showAddBudget).toBeFalse();
  });

  it('should not submit form with invalid data', () => {
    const initialBudgetCount = component.budgets.length;
    component.budgetForm.patchValue({
      categoryId: '',
      amount: -100
    });

    component.onSubmitBudget();
    
    expect(component.budgets.length).toBe(initialBudgetCount);
  });

  it('should edit budget correctly', () => {
    const mockBudget = component['createMockBudgets']()[0];
    component.budgets = [mockBudget];
    
    component.editBudget(mockBudget);
    
    expect(component.editingBudgetId).toBe(mockBudget._id);
    expect(component.editBudgetForm.get('totalAmount')?.value).toBe(mockBudget.totalAmount);
  });

  it('should cancel edit correctly', () => {
    component.editingBudgetId = 'test-id';
    component.cancelEdit();
    
    expect(component.editingBudgetId).toBeNull();
  });

  it('should update budget correctly', () => {
    const mockBudget = component['createMockBudgets']()[0];
    component.budgets = [mockBudget];
    component.categories = mockCategories;
    component.editingBudgetId = mockBudget._id;
    
    component.editBudgetForm.patchValue({
      name: 'Updated Budget',
      description: 'Updated description',
      period: 'monthly',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      totalAmount: 600,
      currency: 'USD'
    });

    component.updateBudget();
    
    expect(component.budgets[0].totalAmount).toBe(600);
    expect(component.editingBudgetId).toBeNull();
  });

  it('should delete budget correctly', () => {
    const mockBudget = component['createMockBudgets']()[0];
    component.budgets = [mockBudget];
    
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(true);
    
    component.deleteBudget(mockBudget._id);
    
    expect(component.budgets.length).toBe(0);
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should toggle budget status correctly', () => {
    const mockBudget = component['createMockBudgets']()[0];
    const initialStatus = mockBudget.isActive;
    
    component.toggleBudgetStatus(mockBudget);
    
    expect(mockBudget.isActive).toBe(!initialStatus);
  });

  it('should export budget report', () => {
    spyOn(console, 'log');
    
    component.exportBudgetReport();
    
    expect(console.log).toHaveBeenCalledWith('Exporting budget report...');
  });

  it('should print budget report', () => {
    spyOn(window, 'print');
    
    component.printBudgetReport();
    
    expect(window.print).toHaveBeenCalled();
  });

  it('should clean up on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
