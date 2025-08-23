import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { FinancialGoalsComponent } from './financial-goals';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';

describe('FinancialGoalsComponent', () => {
  let component: FinancialGoalsComponent;
  let fixture: ComponentFixture<FinancialGoalsComponent>;
  let financialService: jasmine.SpyObj<FinancialService>;
  let transactionService: jasmine.SpyObj<TransactionService>;
  let categoryService: jasmine.SpyObj<CategoryService>;

  const mockGoal = {
    _id: 'goal1',
    title: 'Emergency Fund',
    description: 'Build emergency fund',
    targetAmount: 10000,
    currentAmount: 2500,
    startDate: new Date('2024-01-01'),
    targetDate: new Date('2024-12-31'),
    category: 'savings',
    priority: 'high' as const,
    status: 'active' as const,
    type: 'emergency-fund' as const,
    icon: '🏦',
    color: '#4CAF50',
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockCategories = [
    {
      _id: 'cat1',
      name: 'Savings',
      description: 'Savings category',
      color: '#4CAF50',
      icon: '💰',
      path: ['Savings'],
      level: 1,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(async () => {
    const financialServiceSpy = jasmine.createSpyObj('FinancialService', [
      'getDashboard'
    ]);
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', [
      'getUserTransactions'
    ]);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getUserCategories'
    ]);

    // Setup default return values
    financialServiceSpy.getDashboard.and.returnValue(of({
      totalIncome: 5000,
      totalExpenses: 3000,
      netIncome: 2000,
      savingsRate: 40,
      monthlyBudget: 4000,
      budgetUtilization: 75,
      topCategories: [],
      recentTransactions: [],
      monthlyTrends: [],
      categoryBreakdown: []
    }));
    transactionServiceSpy.getUserTransactions.and.returnValue(of([]));
    categoryServiceSpy.getUserCategories.and.returnValue(of(mockCategories));

    await TestBed.configureTestingModule({
      imports: [
        FinancialGoalsComponent,
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: FinancialService, useValue: financialServiceSpy },
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    })
    .compileComponents();

    financialService = TestBed.inject(FinancialService) as jasmine.SpyObj<FinancialService>;
    transactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;

    fixture = TestBed.createComponent(FinancialGoalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.goals).toEqual([]);
    expect(component.isLoading).toBe(false);
    expect(component.error).toBe(null);
    expect(component.showGoalForm).toBe(false);
    expect(component.selectedGoal).toBe(null);
    expect(component.viewMode).toBe('grid');
    expect(component.filterStatus).toBe('all');
    expect(component.sortBy).toBe('priority');
    expect(component.sortOrder).toBe('desc');
  });

  it('should load data on init', () => {
    expect(financialService.getDashboard).toHaveBeenCalled();
    expect(categoryService.getUserCategories).toHaveBeenCalled();
  });

  it('should create goal form with correct structure', () => {
    const form = component.goalForm;
    expect(form.get('title')).toBeTruthy();
    expect(form.get('description')).toBeTruthy();
    expect(form.get('targetAmount')).toBeTruthy();
    expect(form.get('targetDate')).toBeTruthy();
    expect(form.get('category')).toBeTruthy();
    expect(form.get('priority')).toBeTruthy();
    expect(form.get('type')).toBeTruthy();
    expect(form.get('icon')).toBeTruthy();
    expect(form.get('color')).toBeTruthy();
  });

  it('should handle goal creation', () => {
    component.goalForm.patchValue({
      title: 'New Goal',
      description: 'Test goal',
      targetAmount: 5000,
      targetDate: '2024-12-31',
      category: 'savings',
      priority: 'high',
      type: 'savings',
      icon: '💰',
      color: '#4CAF50'
    });

    component.onSubmitGoal();

    // Should add goal to local array (since no backend service)
    expect(component.goals.length).toBeGreaterThan(0);
  });

  it('should handle goal editing', () => {
    component.goals = [mockGoal];
    component.onEditGoal(mockGoal);

    expect(component.selectedGoal).toBe(mockGoal);
    expect(component.showGoalForm).toBe(true);
    expect(component.goalForm.get('title')?.value).toBe(mockGoal.title);
  });

  it('should handle goal deletion', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.goals = [mockGoal];
    
    component.onDeleteGoal(mockGoal);

    expect(component.goals.length).toBe(0);
  });

  it('should not delete goal when user cancels', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.goals = [mockGoal];
    
    component.onDeleteGoal(mockGoal);

    expect(component.goals.length).toBe(1);
  });

  it('should toggle goal status', () => {
    component.goals = [mockGoal];
    const originalStatus = mockGoal.status;
    
    component.onToggleGoalStatus(mockGoal);

    expect(mockGoal.status).not.toBe(originalStatus);
  });

  it('should calculate goal progress correctly', () => {
    const progress = component.calculateGoalProgress(mockGoal);

    expect(progress.percentageComplete).toBe(25); // 2500/10000 * 100
    expect(progress.isOnTrack).toBeDefined();
    expect(progress.daysRemaining).toBeGreaterThan(0);
  });

  it('should format currency correctly', () => {
    const formatted = component.formatCurrency(1234.56);
    expect(formatted).toContain('$1,234.56');
  });

  it('should format date correctly', () => {
    const testDate = new Date('2024-01-15');
    const formatted = component.formatDate(testDate);
    expect(formatted).toContain('Jan 15, 2024');
  });

  it('should get priority badge class', () => {
    expect(component.getPriorityBadgeClass('high')).toBe('badge-danger');
    expect(component.getPriorityBadgeClass('medium')).toBe('badge-warning');
    expect(component.getPriorityBadgeClass('low')).toBe('badge-success');
  });

  it('should get status badge class', () => {
    expect(component.getStatusBadgeClass('active')).toBe('badge-primary');
    expect(component.getStatusBadgeClass('completed')).toBe('badge-success');
    expect(component.getStatusBadgeClass('paused')).toBe('badge-warning');
    expect(component.getStatusBadgeClass('cancelled')).toBe('badge-secondary');
  });

  it('should filter goals by status', () => {
    component.goals = [
      { ...mockGoal, status: 'active' },
      { ...mockGoal, _id: 'goal2', status: 'completed' }
    ];
    
    component.filterStatus = 'active';
    const filtered = component.getFilteredGoals();
    
    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('active');
  });

  it('should sort goals correctly', () => {
    const goal1 = { ...mockGoal, priority: 'high' };
    const goal2 = { ...mockGoal, _id: 'goal2', priority: 'low' };
    component.goals = [goal2, goal1];
    
    const sorted = component.getSortedGoals(component.goals);
    
    expect(sorted[0].priority).toBe('high');
    expect(sorted[1].priority).toBe('low');
  });

  it('should handle view mode changes', () => {
    component.onViewModeChange('list');
    expect(component.viewMode).toBe('list');

    component.onViewModeChange('grid');
    expect(component.viewMode).toBe('grid');
  });

  it('should handle filter changes', () => {
    component.onFilterChange('completed');
    expect(component.filterStatus).toBe('completed');
  });

  it('should handle sort changes', () => {
    component.onSortChange('targetDate');
    expect(component.sortBy).toBe('targetDate');
  });

  it('should show goal form', () => {
    component.onShowGoalForm();
    expect(component.showGoalForm).toBe(true);
    expect(component.selectedGoal).toBe(null);
  });

  it('should hide goal form', () => {
    component.showGoalForm = true;
    component.onHideGoalForm();
    expect(component.showGoalForm).toBe(false);
  });

  it('should reset form after submission', () => {
    component.goalForm.patchValue({
      title: 'Test Goal',
      targetAmount: 1000
    });

    component.onSubmitGoal();

    expect(component.goalForm.get('title')?.value).toBe('');
    expect(component.showGoalForm).toBe(false);
  });

  it('should handle form validation', () => {
    const form = component.goalForm;

    // Test required field validation
    form.get('title')?.setValue('');
    form.get('title')?.markAsTouched();

    expect(form.get('title')?.hasError('required')).toBe(true);
    expect(form.valid).toBe(false);
  });

  it('should handle error loading data', () => {
    financialService.getDashboard.and.returnValue(throwError(() => new Error('API Error')));
    
    component['loadData']();
    
    expect(component.error).toBe('Failed to load financial data');
  });
});
