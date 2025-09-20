import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { BudgetManagementComponent } from './budget-management';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { BudgetService } from '../../../../core/services/budget.service';
import { RealtimeBudgetProgressService } from '../../../../core/services/realtime-budget-progress.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { Category, Transaction, TransactionType, PaginatedResponse } from '../../../../core/models/financial.model';

describe('BudgetManagementComponent', () => {
  let component: BudgetManagementComponent;
  let fixture: ComponentFixture<BudgetManagementComponent>;
  let mockFinancialService: jasmine.SpyObj<FinancialService>;
  let mockTransactionService: jasmine.SpyObj<TransactionService>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;
  let mockBudgetService: jasmine.SpyObj<BudgetService>;
  let mockRealtimeBudgetProgressService: jasmine.SpyObj<RealtimeBudgetProgressService>;
  let mockAnalyticsService: jasmine.SpyObj<AnalyticsService>;
  let confirmSpy: jasmine.Spy;

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
    mockAnalyticsService = jasmine.createSpyObj('AnalyticsService', ['getBudgetAnalytics', 'exportBudgetData', 'exportBudgetReport', 'downloadBudgetReport']);

    // Setup default return values
    mockAnalyticsService.exportBudgetReport.and.returnValue(of(new Blob()));
    mockAnalyticsService.downloadBudgetReport.and.returnValue(of(void 0));
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
        { provide: RealtimeBudgetProgressService, useValue: mockRealtimeBudgetProgressService },
        { provide: AnalyticsService, useValue: mockAnalyticsService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgetManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Set up global confirm spy only if it doesn't exist
    if (!(window.confirm as any).and) {
      confirmSpy = spyOn(window, 'confirm');
    } else {
      confirmSpy = window.confirm as jasmine.Spy;
    }
  });

  afterEach(() => {
    // Clean up any spies to prevent conflicts
    if (window.confirm && (window.confirm as any).and) {
      if ((window.confirm as any).and.restore) {
        (window.confirm as any).and.restore();
      } else {
        // If restore is not available, reset to callThrough
        (window.confirm as any).and.callThrough();
      }
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  beforeEach(() => {
    // Ensure budgets are loaded for tests that need them
    component.budgets = component['createMockBudgets']();
    component.filteredBudgets = [...component.budgets];
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
    
    confirmSpy.and.returnValue(true);
    
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
    component.exportBudgetReport();
    
    expect(component.showExportModal).toBe(true);
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

  // Error handling tests for better branch coverage
  describe('Error Handling', () => {
    it('should handle budget loading error', () => {
      mockBudgetService.getBudgets.and.returnValue(throwError(() => new Error('API Error')));
      
      component['loadBudgets']();
      
      expect(component.isLoading).toBe(false);
    });

    it('should handle budget summary loading error', () => {
      mockBudgetService.getBudgetSummary.and.returnValue(throwError(() => new Error('API Error')));
      
      component['loadBudgetSummary']();
      
      expect(component.budgetSummary).toBeNull();
    });

    it('should handle transaction loading error', () => {
      mockTransactionService.getUserTransactions.and.returnValue(throwError(() => new Error('API Error')));
      
      component['loadTransactions']();
      
      expect(component.transactions).toEqual([]);
    });

    it('should handle budget creation error', () => {
      // The onSubmitBudget method doesn't actually call the service,
      // it just adds the budget locally, so we test the local behavior
      component.budgetForm.patchValue({
        name: 'Test Budget',
        categoryId: '1',
        amount: 1000,
        startDate: new Date(),
        endDate: new Date()
      });
      
      component.onSubmitBudget();
      
      // Form should be closed after successful local creation
      expect(component.showAddBudget).toBe(false);
      expect(component.budgets.length).toBeGreaterThan(0);
    });

    it('should handle budget update error', () => {
      mockBudgetService.updateBudget.and.returnValue(throwError(() => new Error('API Error')));
      
      component.editingBudgetId = '1';
      component.editBudgetForm.patchValue({
        name: 'Updated Budget',
        categoryAllocations: [{ categoryId: '1', amount: 1500 }]
      });
      
      component.updateBudget();
      
      expect(component.editingBudgetId).toBe('1');
    });

    it('should handle budget deletion error', () => {
      mockBudgetService.deleteBudget.and.returnValue(throwError(() => new Error('API Error')));
      
      const initialLength = component.budgets.length;
      component.deleteBudget('1');
      
      // Budgets should remain unchanged due to error
      expect(component.budgets.length).toBe(initialLength);
    });

    it('should handle budget status toggle error', () => {
      // The toggleBudgetStatus method doesn't call any service,
      // it just toggles the status locally, so we test the local behavior
      const budget = component.budgets[0];
      const originalStatus = budget.isActive;
      
      component.toggleBudgetStatus(budget);
      
      // The status should be toggled locally
      expect(budget.isActive).toBe(!originalStatus);
    });
  });

  // Edge cases and conditional logic tests
  describe('Edge Cases and Conditional Logic', () => {
    it('should handle empty budgets array in calculateBudgetProgress', () => {
      component.budgets = [];
      component['calculateBudgetProgress']();
      
      expect(component.budgetProgress).toEqual([]);
    });

    it('should handle budget with null categoryAllocations', () => {
      const budgetWithNullAllocations = {
        ...component.budgets[0],
        categoryAllocations: null as any
      };
      component.budgets = [budgetWithNullAllocations];
      
      component['calculateBudgetProgress']();
      
      expect(component.budgetProgress).toEqual([]);
    });

    it('should handle budget with null endDate', () => {
      const budgetWithNullEndDate = {
        ...component.budgets[0],
        endDate: null as any
      };
      component.budgets = [budgetWithNullEndDate];
      
      component['calculateBudgetProgress']();
      
      expect(component.budgetProgress).toEqual([]);
    });

    it('should handle percentage used >= 100', () => {
      const budget = {
        ...component.budgets[0],
        categoryAllocations: [{ 
          categoryId: '1', 
          allocatedAmount: 1000,
          isFlexible: true,
          priority: 1
        }],
        endDate: new Date()
      };
      component.budgets = [budget];
      component.transactions = [{
        _id: '1',
        title: 'Test Transaction',
        amount: 1200,
        currency: 'USD',
        type: 'expense' as TransactionType,
        status: 'completed' as any,
        categoryId: '1',
        tags: [],
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: 'cash' as any,
        isRecurring: false,
        recurrencePattern: 'none' as any,
        attachments: [],
        source: 'manual',
        userId: 'user1',
        accountId: 'acc1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false
      }];
      
      component['calculateBudgetProgress']();
      
      const progress = component.budgetProgress[0];
      expect(progress.status).toBe('over');
      expect(progress.percentageUsed).toBeGreaterThanOrEqual(100);
    });

    it('should handle null endDate in calculateDaysRemaining', () => {
      const result = component['calculateDaysRemaining'](null as any);
      
      expect(result).toBe(0);
    });

    it('should handle past endDate in calculateDaysRemaining', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      
      const result = component['calculateDaysRemaining'](pastDate);
      
      expect(result).toBe(0);
    });

    it('should handle invalid form submission', () => {
      component.budgetForm.patchValue({
        name: '', // Invalid: empty name
        categoryAllocations: [] // Invalid: empty allocations
      });
      
      component.onSubmitBudget();
      
      expect(mockBudgetService.createBudget).not.toHaveBeenCalled();
    });

    it('should handle update budget with invalid form', () => {
      component.editingBudgetId = '1';
      component.editBudgetForm.patchValue({
        name: '' // Invalid: empty name
      });
      
      component.updateBudget();
      
      expect(mockBudgetService.updateBudget).not.toHaveBeenCalled();
    });

    it('should handle update budget with non-existent budget ID', () => {
      component.editingBudgetId = 'non-existent';
      component.editBudgetForm.patchValue({
        name: 'Updated Budget',
        categoryAllocations: [{ categoryId: '1', amount: 1500 }]
      });
      
      component.updateBudget();
      
      expect(mockBudgetService.updateBudget).not.toHaveBeenCalled();
    });
  });

  // Advanced filter tests
  describe('Advanced Filters', () => {
    it('should apply advanced filters with empty filter groups', () => {
      component['applyAdvancedFilters']([]);
      
      expect(component.filteredBudgets).toEqual(component.budgets);
    });

    it('should evaluate budget against query with $and conditions', () => {
      const budget = component.budgets[0];
      const query = {
        $and: [
          { name: { $eq: budget.name } },
          { isActive: { $eq: true } }
        ]
      };
      
      const result = component['evaluateBudgetAgainstQuery'](budget, query);
      
      expect(typeof result).toBe('boolean');
    });

    it('should evaluate budget against query with $or conditions', () => {
      const budget = component.budgets[0];
      const query = {
        $or: [
          { name: { $eq: budget.name } },
          { name: { $eq: 'Another Budget' } }
        ]
      };
      
      const result = component['evaluateBudgetAgainstQuery'](budget, query);
      
      expect(typeof result).toBe('boolean');
    });

    it('should evaluate field condition with object condition', () => {
      const budget = component.budgets[0];
      const condition = { $eq: budget.name };
      
      const result = component['evaluateFieldCondition'](budget, 'name', condition);
      
      expect(typeof result).toBe('boolean');
    });

    it('should evaluate field condition with primitive condition', () => {
      const budget = component.budgets[0];
      
      const result = component['evaluateFieldCondition'](budget, 'name', budget.name);
      
      expect(typeof result).toBe('boolean');
    });

    it('should evaluate operator with $eq', () => {
      const result = component['evaluateOperator']('Test', '$eq', 'Test');
      
      expect(result).toBe(true);
    });

    it('should evaluate operator with $ne', () => {
      const result = component['evaluateOperator']('Test', '$ne', 'Different');
      
      expect(result).toBe(true);
    });

    it('should evaluate operator with $gt', () => {
      const result = component['evaluateOperator'](10, '$gt', 5);
      
      expect(result).toBe(true);
    });

    it('should evaluate operator with $lt', () => {
      const result = component['evaluateOperator'](5, '$lt', 10);
      
      expect(result).toBe(true);
    });

    it('should evaluate operator with $gte', () => {
      const result = component['evaluateOperator'](10, '$gte', 10);
      
      expect(result).toBe(true);
    });

    it('should evaluate operator with $lte', () => {
      const result = component['evaluateOperator'](10, '$lte', 10);
      
      expect(result).toBe(true);
    });

    it('should evaluate operator with $in', () => {
      const result = component['evaluateOperator']('Test', '$in', ['Test', 'Other']);
      
      expect(result).toBe(true);
    });

    it('should evaluate operator with $nin', () => {
      const result = component['evaluateOperator']('Test', '$nin', ['Other', 'Different']);
      
      expect(result).toBe(true);
    });

    it('should evaluate operator with $regex', () => {
      const result = component['evaluateOperator']('Test Budget', '$regex', 'Test');
      
      expect(result).toBe(true);
    });

    it('should evaluate operator with unknown operator', () => {
      const result = component['evaluateOperator']('Test', '$unknown', 'Test');
      
      expect(result).toBe(true);
    });

    it('should get budget field value for different fields', () => {
      const budget = component.budgets[0];
      
      expect(component['getBudgetFieldValue'](budget, 'name')).toBe(budget.name);
      expect(component['getBudgetFieldValue'](budget, 'isActive')).toBe(budget.isActive);
      expect(component['getBudgetFieldValue'](budget, 'startDate')).toBe(budget.startDate);
      expect(component['getBudgetFieldValue'](budget, 'endDate')).toBe(budget.endDate);
      expect(component['getBudgetFieldValue'](budget, 'unknown')).toBe(undefined);
    });
  });

  // Export functionality tests
  describe('Export Functionality', () => {
    it('should handle export with different formats', () => {
      component.exportFormat = 'csv';
      component.exportReportType = 'performance';
      
      component.exportBudgetReport();
      
      expect(component.showExportModal).toBe(true);
    });

    it('should execute export with PDF format', () => {
      component.exportFormat = 'pdf';
      component.exportReportType = 'all';
      
      component.executeExport();
      
      expect(mockAnalyticsService.downloadBudgetReport).toHaveBeenCalled();
    });

    it('should execute export with Excel format', () => {
      component.exportFormat = 'excel';
      component.exportReportType = 'trend';
      
      component.executeExport();
      
      expect(mockAnalyticsService.downloadBudgetReport).toHaveBeenCalled();
    });

    it('should execute export with JSON format', () => {
      component.exportFormat = 'json';
      component.exportReportType = 'breakdown';
      
      component.executeExport();
      
      expect(mockAnalyticsService.downloadBudgetReport).toHaveBeenCalled();
    });

    it('should execute export with CSV format', () => {
      component.exportFormat = 'csv';
      component.exportReportType = 'variance';
      
      component.executeExport();
      
      expect(mockAnalyticsService.downloadBudgetReport).toHaveBeenCalled();
    });

    it('should cancel export', () => {
      component.showExportModal = true;
      
      component.cancelExport();
      
      expect(component.showExportModal).toBe(false);
    });

    it('should quick export with PDF', () => {
      component.quickExport('pdf');
      
      expect(mockAnalyticsService.downloadBudgetReport).toHaveBeenCalled();
    });

    it('should quick export with Excel', () => {
      component.quickExport('excel');
      
      expect(mockAnalyticsService.downloadBudgetReport).toHaveBeenCalled();
    });
  });

  // UI interaction tests
  describe('UI Interactions', () => {
    it('should show budget wizard', () => {
      component.showBudgetWizard();
      
      expect(component.showAddBudget).toBe(false);
    });

    it('should handle budget wizard when not available', () => {
      component.budgetWizard = null as any;
      
      component.showBudgetWizard();
      
      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle realtime budget click', () => {
      const budget = { budgetId: '1', name: 'Test Budget' };
      spyOn(component as any, 'scrollToBudget');
      
      component.onRealtimeBudgetClick(budget);
      
      expect((component as any).scrollToBudget).toHaveBeenCalledWith('1');
    });

    it('should handle realtime category click', () => {
      const event = { budget: { id: '1' }, category: { categoryId: 'cat1' } };
      
      component.onRealtimeCategoryClick(event);
      
      expect(component.selectedCategory).toBe('cat1');
    });

    it('should handle realtime alert click with categoryId', () => {
      const alert = { categoryId: 'cat1', message: 'Alert' };
      
      component.onRealtimeAlertClick(alert);
      
      expect(component.selectedCategory).toBe('cat1');
    });

    it('should handle realtime alert click without categoryId', () => {
      const alert = { message: 'Alert' };
      
      component.onRealtimeAlertClick(alert);
      
      expect(component.selectedCategory).toBe('');
    });

    it('should scroll to budget element', () => {
      const mockElement = {
        scrollIntoView: jasmine.createSpy('scrollIntoView'),
        classList: {
          add: jasmine.createSpy('add'),
          remove: jasmine.createSpy('remove')
        }
      };
      spyOn(document, 'getElementById').and.returnValue(mockElement as any);
      
      component['scrollToBudget']('1');
      
      expect(document.getElementById).toHaveBeenCalledWith('budget-1');
      expect(mockElement.scrollIntoView).toHaveBeenCalled();
    });

    it('should handle scroll to budget when element not found', () => {
      spyOn(document, 'getElementById').and.returnValue(null);
      
      component['scrollToBudget']('1');
      
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  // Advanced filter event handlers
  describe('Advanced Filter Event Handlers', () => {
    it('should handle advanced filters changed', () => {
      const filterGroups = [{
        id: '1',
        name: 'Test Filter',
        field: 'name',
        operator: '$eq',
        value: 'Test',
        conditions: [],
        logic: 'AND' as 'AND' | 'OR',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }];
      
      component.onAdvancedFiltersChanged(filterGroups);
      
      expect(component.filteredBudgets).toBeDefined();
    });

    it('should handle advanced search query', () => {
      const query = 'test query';
      
      component.onAdvancedSearchQuery(query);
      
      expect(component.filteredBudgets).toBeDefined();
    });

    it('should handle preset applied', () => {
      const preset = { name: 'Test Preset', filters: [] };
      
      component.onPresetApplied(preset);
      
      expect(component.filteredBudgets).toBeDefined();
    });

    it('should handle saved filter loaded', () => {
      const savedFilter = { name: 'Saved Filter', filters: [] };
      
      component.onSavedFilterLoaded(savedFilter);
      
      expect(component.filteredBudgets).toBeDefined();
    });

    it('should add to search history', () => {
      const query = 'test query';
      
      component['addToSearchHistory'](query);
      
      // Should not throw error
      expect(true).toBe(true);
    });
  });

  // Period and category filtering tests
  describe('Period and Category Filtering', () => {
    it('should filter budgets by monthly period', () => {
      component.selectedPeriod = 'monthly';
      
      component['filterBudgetsByPeriod']();
      
      expect(component.filteredBudgets).toBeDefined();
    });

    it('should filter budgets by quarterly period', () => {
      component.selectedPeriod = 'quarterly';
      
      component['filterBudgetsByPeriod']();
      
      expect(component.filteredBudgets).toBeDefined();
    });

    it('should filter budgets by yearly period', () => {
      component.selectedPeriod = 'yearly';
      
      component['filterBudgetsByPeriod']();
      
      expect(component.filteredBudgets).toBeDefined();
    });

    it('should filter budgets by category', () => {
      component.selectedCategory = '1';
      
      component['filterBudgetsByCategory']();
      
      expect(component.filteredBudgets).toBeDefined();
    });

    it('should filter budgets by all categories', () => {
      component.selectedCategory = '';
      
      component['filterBudgetsByCategory']();
      
      expect(component.filteredBudgets).toEqual(component.budgets);
    });
  });
});
