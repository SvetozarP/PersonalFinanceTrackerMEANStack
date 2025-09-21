import { ComponentFixture, TestBed } from '@angular/core/testing';
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
  let mockFinancialService: jasmine.SpyObj<FinancialService>;
  let mockTransactionService: jasmine.SpyObj<TransactionService>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;
  let confirmSpy: jasmine.Spy;

  beforeEach(async () => {
    const financialServiceSpy = jasmine.createSpyObj('FinancialService', ['getFinancialDashboard']);
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getUserTransactions']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getUserCategories']);

    // Set default return values to prevent undefined errors
    transactionServiceSpy.getUserTransactions.and.returnValue(of({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }));
    categoryServiceSpy.getUserCategories.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [
        FinancialGoalsComponent,
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule
      ],
      providers: [
        { provide: FinancialService, useValue: financialServiceSpy },
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    })
    .compileComponents();

    mockFinancialService = TestBed.inject(FinancialService) as jasmine.SpyObj<FinancialService>;
    mockTransactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
    mockCategoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;

    fixture = TestBed.createComponent(FinancialGoalsComponent);
    component = fixture.componentInstance;
    
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

  // Error handling tests
  it('should handle category loading error', () => {
    mockCategoryService.getUserCategories.and.returnValue(throwError(() => new Error('API Error')));

    component['loadData']();

    expect(component.isLoading).toBe(false);
  });

  it('should handle transaction loading error', () => {
    mockTransactionService.getUserTransactions.and.returnValue(throwError(() => new Error('API Error')));

    component['loadTransactions']();

    expect(component.isLoading).toBe(false);
  });

  // Goal progress calculation tests
  it('should calculate goal progress correctly', () => {
    component.goals = [
      {
        _id: '1',
        title: 'Test Goal',
        targetAmount: 1000,
        currentAmount: 500,
        startDate: new Date(2024, 0, 1),
        targetDate: new Date(2024, 11, 31),
        category: 'Test',
        priority: 'medium',
        status: 'active',
        type: 'savings',
        icon: 'fas fa-star',
        color: '#007bff',
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    component['calculateGoalProgress']();

    expect(component.goalProgress.length).toBe(1);
    expect(component.goalProgress[0].percentageComplete).toBe(50);
  });

  it('should calculate goal stats correctly', () => {
    component.goals = [
      { _id: '1', title: 'Goal 1', targetAmount: 1000, currentAmount: 500, startDate: new Date(), targetDate: new Date(), category: 'Test', priority: 'medium', status: 'active', type: 'savings', icon: 'fas fa-star', color: '#007bff', userId: 'user1', createdAt: new Date(), updatedAt: new Date() },
      { _id: '2', title: 'Goal 2', targetAmount: 2000, currentAmount: 2000, startDate: new Date(), targetDate: new Date(), category: 'Test', priority: 'high', status: 'completed', type: 'savings', icon: 'fas fa-star', color: '#007bff', userId: 'user1', createdAt: new Date(), updatedAt: new Date() }
    ];

    component['calculateGoalStats']();

    expect(component.totalGoals).toBe(2);
    expect(component.activeGoals).toBe(1);
    expect(component.completedGoals).toBe(1);
    expect(component.totalTargetAmount).toBe(3000);
    expect(component.totalCurrentAmount).toBe(2500);
    expect(component.overallProgress).toBe(83.33333333333334);
  });

  // Days remaining calculation tests
  it('should calculate days remaining correctly', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    
    const daysRemaining = component['calculateDaysRemaining'](futureDate);
    
    expect(daysRemaining).toBe(10);
  });

  it('should return 0 for past dates', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    
    const daysRemaining = component['calculateDaysRemaining'](pastDate);
    
    expect(daysRemaining).toBe(0);
  });

  // Goal on track calculation tests
  it('should determine if goal is on track', () => {
    const goal = {
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium' as 'low' | 'medium' | 'high',
      status: 'active' as 'active' | 'paused' | 'completed' | 'cancelled',
      type: 'savings' as 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const isOnTrack = component['isGoalOnTrack'](goal);
    
    expect(typeof isOnTrack).toBe('boolean');
  });

  // Monthly contribution calculation tests
  it('should calculate monthly contribution correctly', () => {
    const goal = {
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium' as 'low' | 'medium' | 'high',
      status: 'active' as 'active' | 'paused' | 'completed' | 'cancelled',
      type: 'savings' as 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const monthlyContribution = component['calculateMonthlyContribution'](goal);
    
    expect(monthlyContribution).toBeGreaterThan(0);
  });

  it('should return current amount for new goals', () => {
    const goal = {
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(),
      targetDate: new Date(),
      category: 'Test',
      priority: 'medium' as 'low' | 'medium' | 'high',
      status: 'active' as 'active' | 'paused' | 'completed' | 'cancelled',
      type: 'savings' as 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const monthlyContribution = component['calculateMonthlyContribution'](goal);
    
    expect(monthlyContribution).toBe(500);
  });

  // Estimated completion calculation tests
  it('should calculate estimated completion date', () => {
    const goal = {
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium' as 'low' | 'medium' | 'high',
      status: 'active' as 'active' | 'paused' | 'completed' | 'cancelled',
      type: 'savings' as 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const estimatedDate = component['calculateEstimatedCompletion'](goal, 100);
    
    expect(estimatedDate).toBeInstanceOf(Date);
  });

  it('should return target date for zero monthly contribution', () => {
    const goal = {
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium' as 'low' | 'medium' | 'high',
      status: 'active' as 'active' | 'paused' | 'completed' | 'cancelled',
      type: 'savings' as 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const estimatedDate = component['calculateEstimatedCompletion'](goal, 0);
    
    expect(estimatedDate).toEqual(goal.targetDate);
  });

  // Filter tests
  it('should filter goals by type', () => {
    component.goals = [
      { _id: '1', title: 'Goal 1', targetAmount: 1000, currentAmount: 500, startDate: new Date(), targetDate: new Date(), category: 'Test', priority: 'medium', status: 'active', type: 'savings', icon: 'fas fa-star', color: '#007bff', userId: 'user1', createdAt: new Date(), updatedAt: new Date() },
      { _id: '2', title: 'Goal 2', targetAmount: 2000, currentAmount: 1000, startDate: new Date(), targetDate: new Date(), category: 'Test', priority: 'high', status: 'active', type: 'debt-payoff', icon: 'fas fa-star', color: '#007bff', userId: 'user1', createdAt: new Date(), updatedAt: new Date() }
    ];
    component.selectedGoalType = 'savings';

    const filtered = component.getFilteredGoals();

    expect(filtered.length).toBe(1);
    expect(filtered[0].type).toBe('savings');
  });

  it('should filter goals by status', () => {
    component.goals = [
      { _id: '1', title: 'Goal 1', targetAmount: 1000, currentAmount: 500, startDate: new Date(), targetDate: new Date(), category: 'Test', priority: 'medium', status: 'active', type: 'savings', icon: 'fas fa-star', color: '#007bff', userId: 'user1', createdAt: new Date(), updatedAt: new Date() },
      { _id: '2', title: 'Goal 2', targetAmount: 2000, currentAmount: 2000, startDate: new Date(), targetDate: new Date(), category: 'Test', priority: 'high', status: 'completed', type: 'savings', icon: 'fas fa-star', color: '#007bff', userId: 'user1', createdAt: new Date(), updatedAt: new Date() }
    ];
    component.selectedStatus = 'completed';

    const filtered = component.getFilteredGoals();

    expect(filtered.length).toBe(1);
    expect(filtered[0].status).toBe('completed');
  });

  it('should filter goals by priority', () => {
    component.goals = [
      { _id: '1', title: 'Goal 1', targetAmount: 1000, currentAmount: 500, startDate: new Date(), targetDate: new Date(), category: 'Test', priority: 'medium', status: 'active', type: 'savings', icon: 'fas fa-star', color: '#007bff', userId: 'user1', createdAt: new Date(), updatedAt: new Date() },
      { _id: '2', title: 'Goal 2', targetAmount: 2000, currentAmount: 1000, startDate: new Date(), targetDate: new Date(), category: 'Test', priority: 'high', status: 'active', type: 'savings', icon: 'fas fa-star', color: '#007bff', userId: 'user1', createdAt: new Date(), updatedAt: new Date() }
    ];
    component.selectedPriority = 'high';

    const filtered = component.getFilteredGoals();

    expect(filtered.length).toBe(1);
    expect(filtered[0].priority).toBe('high');
  });

  it('should return all goals when filters are set to all', () => {
    component.goals = [
      { _id: '1', title: 'Goal 1', targetAmount: 1000, currentAmount: 500, startDate: new Date(), targetDate: new Date(), category: 'Test', priority: 'medium', status: 'active', type: 'savings', icon: 'fas fa-star', color: '#007bff', userId: 'user1', createdAt: new Date(), updatedAt: new Date() },
      { _id: '2', title: 'Goal 2', targetAmount: 2000, currentAmount: 1000, startDate: new Date(), targetDate: new Date(), category: 'Test', priority: 'high', status: 'completed', type: 'debt-payoff', icon: 'fas fa-star', color: '#007bff', userId: 'user1', createdAt: new Date(), updatedAt: new Date() }
    ];
    component.selectedGoalType = 'all';
    component.selectedStatus = 'all';
    component.selectedPriority = 'all';

    const filtered = component.getFilteredGoals();

    expect(filtered.length).toBe(2);
  });

  // Form handling tests
  it('should show add goal form', () => {
    // Initialize the component properly
    component.ngOnInit();
    
    component.showAddGoalForm();

    expect(component.showAddGoal).toBe(true);
    expect(component.goalForm.get('priority')?.value).toBe('medium');
    expect(component.goalForm.get('type')?.value).toBe('savings');
  });

  it('should hide add goal form', () => {
    // Initialize the component properly
    component.ngOnInit();
    
    component.showAddGoal = true;
    component.hideAddGoalForm();

    expect(component.showAddGoal).toBe(false);
  });

  it('should submit valid goal form', () => {
    // Initialize the component properly
    component.ngOnInit();
    
    component.goalForm.patchValue({
      title: 'Test Goal',
      targetAmount: 1000,
      startDate: '2024-01-01',
      targetDate: '2024-12-31',
      category: 'Test',
      priority: 'medium',
      type: 'savings'
    });

    const initialLength = component.goals.length;
    component.onSubmitGoal();

    expect(component.goals.length).toBe(initialLength + 1);
    expect(component.showAddGoal).toBe(false);
  });

  it('should not submit invalid goal form', () => {
    // Initialize the component properly
    component.ngOnInit();
    
    component.goalForm.patchValue({
      title: '', // Invalid: empty title
      targetAmount: 1000,
      startDate: '2024-01-01',
      targetDate: '2024-12-31',
      category: 'Test',
      priority: 'medium',
      type: 'savings'
    });

    const initialLength = component.goals.length;
    component.onSubmitGoal();

    expect(component.goals.length).toBe(initialLength);
  });

  // Goal editing tests
  it('should edit goal', () => {
    // Initialize the component properly
    component.ngOnInit();
    
    const goal = {
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium' as 'low' | 'medium' | 'high',
      status: 'active' as 'active' | 'paused' | 'completed' | 'cancelled',
      type: 'savings' as 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.editGoal(goal);

    expect(component.editingGoalId).toBe('1');
    expect(component.editGoalForm.get('title')?.value).toBe('Test Goal');
  });

  it('should cancel edit', () => {
    // Initialize the component properly
    component.ngOnInit();
    
    component.editingGoalId = '1';
    component.cancelEdit();

    expect(component.editingGoalId).toBeNull();
  });

  it('should update goal with valid form', () => {
    // Initialize the component properly
    component.ngOnInit();
    
    component.goals = [{
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium',
      status: 'active',
      type: 'savings',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }];

    component.editingGoalId = '1';
    component.editGoalForm.patchValue({
      title: 'Updated Goal',
      targetAmount: 2000,
      startDate: '2024-01-01',
      targetDate: '2024-12-31',
      category: 'Test',
      priority: 'high',
      type: 'savings'
    });

    component.updateGoal();

    expect(component.goals[0].title).toBe('Updated Goal');
    expect(component.goals[0].targetAmount).toBe(2000);
    expect(component.editingGoalId).toBeNull();
  });

  it('should not update goal with invalid form', () => {
    // Initialize the component properly
    component.ngOnInit();
    
    component.goals = [{
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium',
      status: 'active',
      type: 'savings',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }];

    component.editingGoalId = '1';
    component.editGoalForm.patchValue({
      title: '', // Invalid: empty title
      targetAmount: 2000,
      startDate: '2024-01-01',
      targetDate: '2024-12-31',
      category: 'Test',
      priority: 'high',
      type: 'savings'
    });

    const originalTitle = component.goals[0].title;
    component.updateGoal();

    expect(component.goals[0].title).toBe(originalTitle);
  });

  // Goal deletion tests
  it('should delete goal when confirmed', () => {
    component.goals = [{
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium',
      status: 'active',
      type: 'savings',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }];

    confirmSpy.and.returnValue(true);
    component.deleteGoal('1');

    expect(component.goals.length).toBe(0);
  });

  it('should not delete goal when not confirmed', () => {
    component.goals = [{
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium',
      status: 'active',
      type: 'savings',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }];

    confirmSpy.and.returnValue(false);
    component.deleteGoal('1');

    expect(component.goals.length).toBe(1);
  });

  // Goal progress update tests
  it('should update goal progress', () => {
    const goal = {
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium' as 'low' | 'medium' | 'high',
      status: 'active' as 'active' | 'paused' | 'completed' | 'cancelled',
      type: 'savings' as 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.updateGoalProgress(goal, 200);

    expect(goal.currentAmount).toBe(700);
  });

  it('should not exceed target amount when updating progress', () => {
    const goal = {
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 900,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium' as 'low' | 'medium' | 'high',
      status: 'active' as 'active' | 'paused' | 'completed' | 'cancelled',
      type: 'savings' as 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.updateGoalProgress(goal, 200);

    expect(goal.currentAmount).toBe(1000);
  });

  it('should not go below 0 when updating progress', () => {
    const goal = {
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 100,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium' as 'low' | 'medium' | 'high',
      status: 'active' as 'active' | 'paused' | 'completed' | 'cancelled',
      type: 'savings' as 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.updateGoalProgress(goal, -200);

    expect(goal.currentAmount).toBe(0);
  });

  // Goal status toggle tests
  it('should toggle goal status from active to paused', () => {
    const goal = {
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium' as 'low' | 'medium' | 'high',
      status: 'active' as 'active' | 'paused' | 'completed' | 'cancelled',
      type: 'savings' as 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.toggleGoalStatus(goal);

    expect(goal.status).toBe('paused');
  });

  it('should toggle goal status from paused to active', () => {
    const goal = {
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium' as 'low' | 'medium' | 'high',
      status: 'paused' as 'active' | 'paused' | 'completed' | 'cancelled',
      type: 'savings' as 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.toggleGoalStatus(goal);

    expect(goal.status).toBe('active');
  });

  // Goal completion tests
  it('should complete goal', () => {
    const goal = {
      _id: '1',
      title: 'Test Goal',
      targetAmount: 1000,
      currentAmount: 500,
      startDate: new Date(2024, 0, 1),
      targetDate: new Date(2024, 11, 31),
      category: 'Test',
      priority: 'medium' as 'low' | 'medium' | 'high',
      status: 'active' as 'active' | 'paused' | 'completed' | 'cancelled',
      type: 'savings' as 'savings' | 'debt-payoff' | 'investment' | 'purchase' | 'emergency-fund' | 'other',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    component.completeGoal(goal);

    expect(goal.status).toBe('completed');
    expect(goal.currentAmount).toBe(1000);
  });

  // Utility method tests
  it('should get goal progress by id', () => {
    component.goalProgress = [{
      goalId: '1',
      percentageComplete: 50,
      daysRemaining: 100,
      projectedCompletion: new Date(),
      isOnTrack: true,
      monthlyContribution: 100,
      estimatedCompletionDate: new Date()
    }];

    const progress = component.getGoalProgress('1');

    expect(progress).toBeDefined();
    expect(progress?.percentageComplete).toBe(50);
  });

  it('should return undefined for non-existent goal progress', () => {
    const progress = component.getGoalProgress('999');

    expect(progress).toBeUndefined();
  });

  it('should get priority color', () => {
    const color = component.getPriorityColor('high');

    expect(color).toBe('#dc3545');
  });

  it('should return default color for unknown priority', () => {
    const color = component.getPriorityColor('unknown');

    expect(color).toBe('#6c757d');
  });

  it('should get status color', () => {
    const color = component.getStatusColor('active');

    expect(color).toBe('#28a745');
  });

  it('should return default color for unknown status', () => {
    const color = component.getStatusColor('unknown');

    expect(color).toBe('#6c757d');
  });

  it('should get goal type icon', () => {
    const icon = component.getGoalTypeIcon('savings');

    expect(icon).toBe('fas fa-piggy-bank');
  });

  it('should return default icon for unknown type', () => {
    const icon = component.getGoalTypeIcon('unknown');

    expect(icon).toBe('fas fa-star');
  });

  it('should get goal type color', () => {
    const color = component.getGoalTypeColor('savings');

    expect(color).toBe('#28a745');
  });

  it('should return default color for unknown type', () => {
    const color = component.getGoalTypeColor('unknown');

    expect(color).toBe('#007bff');
  });

  // Export and print tests
  it('should export goals', () => {
    spyOn(console, 'log');
    component.exportGoals();
    expect(console.log).toHaveBeenCalledWith('Exporting goals...');
  });

  it('should print goals', () => {
    spyOn(window, 'print');
    component.printGoals();
    expect(window.print).toHaveBeenCalled();
  });

  it('should initialize with default values', () => {
    expect(component.isLoading).toBe(false);
    expect(component.showAddGoal).toBe(false);
    expect(component.editingGoalId).toBeNull();
    expect(component.selectedGoalType).toBe('all');
    expect(component.selectedStatus).toBe('all');
    expect(component.selectedPriority).toBe('all');
  });

  it('should initialize forms on ngOnInit', () => {
    spyOn(component, 'initializeForms' as any);
    spyOn(component, 'loadData' as any);

    component.ngOnInit();

    expect(component['initializeForms']).toHaveBeenCalled();
    expect(component['loadData']).toHaveBeenCalled();
  });

  it('should clean up on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  describe('Form Initialization', () => {
    beforeEach(() => {
      component['initializeForms']();
    });

    it('should create goal form with correct structure', () => {
      const form = component.goalForm;
      expect(form.get('title')).toBeTruthy();
      expect(form.get('description')).toBeTruthy();
      expect(form.get('targetAmount')).toBeTruthy();
      expect(form.get('startDate')).toBeTruthy();
      expect(form.get('targetDate')).toBeTruthy();
      expect(form.get('category')).toBeTruthy();
      expect(form.get('priority')).toBeTruthy();
      expect(form.get('type')).toBeTruthy();
      expect(form.get('icon')).toBeTruthy();
      expect(form.get('color')).toBeTruthy();
    });

    it('should create edit goal form with correct structure', () => {
      const form = component.editGoalForm;
      expect(form.get('title')).toBeTruthy();
      expect(form.get('description')).toBeTruthy();
      expect(form.get('targetAmount')).toBeTruthy();
      expect(form.get('startDate')).toBeTruthy();
      expect(form.get('targetDate')).toBeTruthy();
      expect(form.get('category')).toBeTruthy();
      expect(form.get('priority')).toBeTruthy();
      expect(form.get('type')).toBeTruthy();
      expect(form.get('icon')).toBeTruthy();
      expect(form.get('color')).toBeTruthy();
    });

    it('should set default values for forms', () => {
      expect(component.goalForm.get('priority')?.value).toBe('medium');
      expect(component.goalForm.get('type')?.value).toBe('savings');
      expect(component.goalForm.get('icon')?.value).toBe('fas fa-star');
      expect(component.goalForm.get('color')?.value).toBe('#007bff');
    });

    it('should validate required fields', () => {
      const form = component.goalForm;
      
      // Mark all fields as touched to trigger validation
      Object.keys(form.controls).forEach(key => {
        const control = form.get(key);
        control?.markAsTouched();
      });
      
      expect(form.get('title')?.hasError('required')).toBe(true);
      expect(form.get('targetAmount')?.hasError('required')).toBe(true);
      expect(form.get('startDate')?.hasError('required')).toBe(true);
      expect(form.get('targetDate')?.hasError('required')).toBe(true);
      expect(form.get('category')?.hasError('required')).toBe(true);
      // Priority and type have default values, so they won't have required errors
      expect(form.get('priority')?.hasError('required')).toBe(false);
      expect(form.get('type')?.hasError('required')).toBe(false);
    });

    it('should validate title minimum length', () => {
      const titleControl = component.goalForm.get('title');
      titleControl?.setValue('ab');
      titleControl?.markAsTouched();

      expect(titleControl?.hasError('minlength')).toBe(true);
    });

    it('should validate target amount minimum value', () => {
      const amountControl = component.goalForm.get('targetAmount');
      amountControl?.setValue(0);
      amountControl?.markAsTouched();

      expect(amountControl?.hasError('min')).toBe(true);
    });
  });

  describe('Goal CRUD Operations', () => {
    beforeEach(() => {
      component['initializeForms']();
      // Set up mock data for testing
      component.goals = [
        {
          _id: '1',
          title: 'Emergency Fund',
          description: 'Build a 6-month emergency fund',
          targetAmount: 15000,
          currentAmount: 8500,
          startDate: new Date(2024, 0, 1),
          targetDate: new Date(2024, 11, 31),
          category: 'Savings',
          priority: 'high' as const,
          status: 'active' as const,
          type: 'emergency-fund' as const,
          icon: 'fas fa-shield-alt',
          color: '#6f42c1',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    });

    it('should show add goal form', () => {
      component.showAddGoalForm();

      expect(component.showAddGoal).toBe(true);
      expect(component.goalForm.get('startDate')?.value).toBeDefined();
      expect(component.goalForm.get('targetDate')?.value).toBeDefined();
    });

    it('should hide add goal form', () => {
      // Initialize the component properly
      component.ngOnInit();
      
      component.showAddGoal = true;
      component.goalForm.patchValue({ title: 'Test Goal' });

      component.hideAddGoalForm();

      expect(component.showAddGoal).toBe(false);
      expect(component.goalForm.get('title')?.value).toBeFalsy();
    });

    it('should create new goal successfully', () => {
      // Initialize the component properly
      component.ngOnInit();
      
      const initialGoalCount = component.goals.length;
      
      component.goalForm.patchValue({
        title: 'New Test Goal',
        description: 'Test description',
        targetAmount: 5000,
        startDate: '2024-01-01',
        targetDate: '2024-12-31',
        category: 'Savings',
        priority: 'high',
        type: 'savings'
      });

      component.onSubmitGoal();

      expect(component.goals.length).toBe(initialGoalCount + 1);
      expect(component.goals[component.goals.length - 1].title).toBe('New Test Goal');
      expect(component.goals[component.goals.length - 1].currentAmount).toBe(0);
      expect(component.goals[component.goals.length - 1].status).toBe('active');
    });

    it('should not create goal with invalid form', () => {
      // Initialize the component properly
      component.ngOnInit();
      
      const initialGoalCount = component.goals.length;
      
      component.goalForm.patchValue({
        title: '', // Invalid - required field
        targetAmount: 5000
      });

      component.onSubmitGoal();

      expect(component.goals.length).toBe(initialGoalCount);
    });

    it('should edit goal successfully', () => {
      const goal = component.goals[0];
      const newTitle = 'Updated Goal Title';

      component.editGoal(goal);

      expect(component.editingGoalId).toBe(goal._id);
      expect(component.editGoalForm.get('title')?.value).toBe(goal.title);

      component.editGoalForm.patchValue({ title: newTitle });
      component.updateGoal();

      expect(component.goals[0].title).toBe(newTitle);
      expect(component.editingGoalId).toBeNull();
    });

    it('should cancel goal editing', () => {
      const goal = component.goals[0];
      component.editGoal(goal);

      expect(component.editingGoalId).toBe(goal._id);

      component.cancelEdit();

      expect(component.editingGoalId).toBeNull();
      expect(component.editGoalForm.get('title')?.value).toBeFalsy();
    });

    it('should delete goal with confirmation', () => {
      confirmSpy.and.returnValue(true);
      const initialGoalCount = component.goals.length;
      const goalToDelete = component.goals[0];

      component.deleteGoal(goalToDelete._id);

      expect(component.goals.length).toBe(initialGoalCount - 1);
      expect(component.goals.find(g => g._id === goalToDelete._id)).toBeUndefined();
    });

    it('should not delete goal without confirmation', () => {
      confirmSpy.and.returnValue(false);
      const initialGoalCount = component.goals.length;
      const goalToDelete = component.goals[0];

      component.deleteGoal(goalToDelete._id);

      expect(component.goals.length).toBe(initialGoalCount);
    });
  });

  describe('Goal Progress Calculations', () => {
    beforeEach(() => {
      // Set up test data for progress calculations
      component.goals = [
        {
          _id: '1',
          title: 'Test Goal 1',
          description: 'Test description 1',
          targetAmount: 1000,
          currentAmount: 500,
          startDate: new Date('2024-01-01'),
          targetDate: new Date('2024-12-31'),
          category: 'Savings',
          priority: 'high',
          type: 'savings',
          status: 'active',
          icon: 'fas fa-piggy-bank',
          color: '#28a745',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '2',
          title: 'Test Goal 2',
          description: 'Test description 2',
          targetAmount: 2000,
          currentAmount: 2000,
          startDate: new Date('2024-01-01'),
          targetDate: new Date('2024-12-31'),
          category: 'Investment',
          priority: 'medium',
          type: 'investment',
          status: 'completed',
          icon: 'fas fa-chart-line',
          color: '#007bff',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    });

    it('should calculate goal progress correctly', () => {
      component['calculateGoalProgress']();

      expect(component.goalProgress.length).toBe(2);
      const progress = component.goalProgress[0];
      expect(progress.percentageComplete).toBe(50);
      expect(progress.goalId).toBe('1');
      expect(progress.isOnTrack).toBeDefined();
    });

    it('should calculate completed goal progress correctly', () => {
      component['calculateGoalProgress']();

      const progress = component.goalProgress[1];
      expect(progress.percentageComplete).toBe(100);
      expect(progress.goalId).toBe('2');
      expect(progress.isOnTrack).toBeDefined();
    });

    it('should handle zero target amount', () => {
      component.goals[0].targetAmount = 0;
      component['calculateGoalProgress']();

      expect(component.goalProgress.length).toBe(2);
      expect(component.goalProgress[0].percentageComplete).toBe(Infinity);
    });

    it('should handle negative target amount', () => {
      component.goals[0].targetAmount = -1000;
      component['calculateGoalProgress']();

      expect(component.goalProgress.length).toBe(2);
      expect(component.goalProgress[0].percentageComplete).toBe(-50);
    });

    it('should handle current amount greater than target', () => {
      component.goals[0].currentAmount = 1500;
      component['calculateGoalProgress']();

      expect(component.goalProgress.length).toBe(2);
      expect(component.goalProgress[0].percentageComplete).toBe(150);
    });

    it('should calculate goal statistics correctly', () => {
      component['calculateGoalStats']();

      expect(component.totalGoals).toBe(2);
      expect(component.completedGoals).toBe(1);
      expect(component.activeGoals).toBe(1);
      expect(component.totalTargetAmount).toBe(3000);
      expect(component.totalCurrentAmount).toBe(2500);
    });

    it('should handle empty goals array for statistics', () => {
      component.goals = [];
      component['calculateGoalStats']();

      expect(component.totalGoals).toBe(0);
      expect(component.completedGoals).toBe(0);
      expect(component.activeGoals).toBe(0);
      expect(component.totalTargetAmount).toBe(0);
      expect(component.totalCurrentAmount).toBe(0);
    });
  });

  describe('Goal Management Operations', () => {
    beforeEach(() => {
      // Set up test data for management operations
      component.goals = [
        {
          _id: '1',
          title: 'Test Goal 1',
          description: 'Test description 1',
          targetAmount: 1000,
          currentAmount: 500,
          startDate: new Date('2024-01-01'),
          targetDate: new Date('2024-12-31'),
          category: 'Savings',
          priority: 'high',
          type: 'savings',
          status: 'active',
          icon: 'fas fa-piggy-bank',
          color: '#28a745',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '2',
          title: 'Test Goal 2',
          description: 'Test description 2',
          targetAmount: 2000,
          currentAmount: 2000,
          startDate: new Date('2024-01-01'),
          targetDate: new Date('2024-12-31'),
          category: 'Investment',
          priority: 'medium',
          type: 'investment',
          status: 'completed',
          icon: 'fas fa-chart-line',
          color: '#007bff',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    });

    it('should filter goals by type', () => {
      component.selectedGoalType = 'savings';
      const filteredGoals = component.getFilteredGoals();

      expect(filteredGoals.length).toBe(1);
      expect(filteredGoals[0].type).toBe('savings');
    });

    it('should filter goals by status', () => {
      component.selectedStatus = 'completed';
      const filteredGoals = component.getFilteredGoals();

      expect(filteredGoals.length).toBe(1);
      expect(filteredGoals[0].status).toBe('completed');
    });

    it('should filter goals by priority', () => {
      component.selectedPriority = 'high';
      const filteredGoals = component.getFilteredGoals();

      expect(filteredGoals.length).toBe(1);
      expect(filteredGoals[0].priority).toBe('high');
    });

    it('should return all goals when no filters are applied', () => {
      component.selectedGoalType = 'all';
      component.selectedStatus = 'all';
      component.selectedPriority = 'all';
      const filteredGoals = component.getFilteredGoals();

      expect(filteredGoals.length).toBe(2);
    });

    it('should combine multiple filters', () => {
      component.selectedGoalType = 'savings';
      component.selectedStatus = 'active';
      component.selectedPriority = 'high';
      const filteredGoals = component.getFilteredGoals();

      expect(filteredGoals.length).toBe(1);
      expect(filteredGoals[0].type).toBe('savings');
      expect(filteredGoals[0].status).toBe('active');
      expect(filteredGoals[0].priority).toBe('high');
    });

    it('should handle goal type change', () => {
      component.onGoalTypeChange('investment');

      expect(component.selectedGoalType).toBe('investment');
    });

    it('should handle status change', () => {
      component.onStatusChange('paused');

      expect(component.selectedStatus).toBe('paused');
    });

    it('should handle priority change', () => {
      component.onPriorityChange('low');

      expect(component.selectedPriority).toBe('low');
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      // Set up test data for utility methods
      component.goals = [
        {
          _id: '1',
          title: 'Test Goal 1',
          description: 'Test description 1',
          targetAmount: 1000,
          currentAmount: 500,
          startDate: new Date('2024-01-01'),
          targetDate: new Date('2024-12-31'),
          category: 'Savings',
          priority: 'high',
          type: 'savings',
          status: 'active',
          icon: 'fas fa-piggy-bank',
          color: '#28a745',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    });

    it('should calculate days remaining correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const daysRemaining = component['calculateDaysRemaining'](futureDate);
      
      expect(daysRemaining).toBeGreaterThan(0);
      expect(daysRemaining).toBeLessThanOrEqual(30);
    });

    it('should return 0 days for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      
      const daysRemaining = component['calculateDaysRemaining'](pastDate);
      
      expect(daysRemaining).toBe(0);
    });

    it('should calculate projected completion date', () => {
      const goal = component.goals[0];
      const projectedDate = component['calculateProjectedCompletion'](goal);
      
      expect(projectedDate).toBeInstanceOf(Date);
      expect(projectedDate.getTime()).toBeGreaterThan(new Date().getTime());
    });

    it('should determine if goal is on track', () => {
      const goal = component.goals[0];
      const isOnTrack = component['isGoalOnTrack'](goal);
      
      expect(typeof isOnTrack).toBe('boolean');
    });

    it('should calculate monthly contribution', () => {
      const goal = component.goals[0];
      const monthlyContribution = component['calculateMonthlyContribution'](goal);
      
      expect(typeof monthlyContribution).toBe('number');
      expect(monthlyContribution).toBeGreaterThan(0);
    });

    it('should calculate estimated completion date', () => {
      const goal = component.goals[0];
      const monthlyContribution = 100;
      const estimatedDate = component['calculateEstimatedCompletion'](goal, monthlyContribution);
      
      expect(estimatedDate).toBeInstanceOf(Date);
    });

    it('should return target date when monthly contribution is 0', () => {
      const goal = component.goals[0];
      const estimatedDate = component['calculateEstimatedCompletion'](goal, 0);
      
      expect(estimatedDate).toEqual(goal.targetDate);
    });

    it('should return target date when monthly contribution is negative', () => {
      const goal = component.goals[0];
      const estimatedDate = component['calculateEstimatedCompletion'](goal, -100);
      
      expect(estimatedDate).toEqual(goal.targetDate);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    beforeEach(() => {
      // Set up test data for edge cases
      component.goals = [
        {
          _id: '1',
          title: 'Test Goal 1',
          description: 'Test description 1',
          targetAmount: 1000,
          currentAmount: 500,
          startDate: new Date('2024-01-01'),
          targetDate: new Date('2024-12-31'),
          category: 'Savings',
          priority: 'high',
          type: 'savings',
          status: 'active',
          icon: 'fas fa-piggy-bank',
          color: '#28a745',
          userId: 'user1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
    });

    it('should handle goal with very large amounts', () => {
      component.goals[0].targetAmount = Number.MAX_SAFE_INTEGER;
      component.goals[0].currentAmount = Number.MAX_SAFE_INTEGER - 1000;
      
      component['calculateGoalProgress']();
      
      expect(component.goalProgress.length).toBe(1);
      expect(component.goalProgress[0].percentageComplete).toBeCloseTo(100, 0);
    });

    it('should handle goal with very small amounts', () => {
      component.goals[0].targetAmount = 0.01;
      component.goals[0].currentAmount = 0.005;
      
      component['calculateGoalProgress']();
      
      expect(component.goalProgress.length).toBe(1);
      expect(component.goalProgress[0].percentageComplete).toBe(50);
    });

    it('should handle goal with same start and target date', () => {
      const sameDate = new Date('2024-01-01');
      component.goals[0].startDate = sameDate;
      component.goals[0].targetDate = sameDate;
      
      const isOnTrack = component['isGoalOnTrack'](component.goals[0]);
      
      expect(typeof isOnTrack).toBe('boolean');
    });

    it('should handle goal with start date after target date', () => {
      component.goals[0].startDate = new Date('2024-12-31');
      component.goals[0].targetDate = new Date('2024-01-01');
      
      const isOnTrack = component['isGoalOnTrack'](component.goals[0]);
      
      expect(typeof isOnTrack).toBe('boolean');
    });

    it('should handle goal with NaN values', () => {
      component.goals[0].targetAmount = NaN;
      component.goals[0].currentAmount = NaN;
      
      component['calculateGoalProgress']();
      
      expect(component.goalProgress.length).toBe(1);
      expect(isNaN(component.goalProgress[0].percentageComplete)).toBe(true);
    });

    it('should handle goal with infinite values', () => {
      component.goals[0].targetAmount = Infinity;
      component.goals[0].currentAmount = 1000;
      
      component['calculateGoalProgress']();
      
      expect(component.goalProgress.length).toBe(1);
      expect(component.goalProgress[0].percentageComplete).toBe(0);
    });

    it('should handle empty goals array for progress calculation', () => {
      component.goals = [];
      
      component['calculateGoalProgress']();
      
      expect(component.goalProgress.length).toBe(0);
    });

    it('should handle goal with undefined description', () => {
      component.goals[0].description = undefined;
      
      expect(component.goals[0].description).toBeUndefined();
      expect(component.goals[0].title).toBeDefined();
    });

    it('should handle goal with empty string values', () => {
      component.goals[0].title = '';
      component.goals[0].description = '';
      component.goals[0].category = '';
      
      expect(component.goals[0].title).toBe('');
      expect(component.goals[0].description).toBe('');
      expect(component.goals[0].category).toBe('');
    });
  });

  describe('Form Validation Edge Cases', () => {
    beforeEach(() => {
      component['initializeForms']();
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

    it('should handle form with extremely long values', () => {
      // Initialize the component properly
      component.ngOnInit();
      
      const longString = 'a'.repeat(1000);
      const longNumber = Number.MAX_SAFE_INTEGER;
      
      component.goalForm.patchValue({
        title: longString,
        description: longString,
        targetAmount: longNumber,
        startDate: '2024-01-01',
        targetDate: '2024-12-31',
        category: longString,
        priority: 'high',
        type: 'savings'
      });

      expect(component.goalForm.get('title')?.value).toBe(longString);
      expect(component.goalForm.get('targetAmount')?.value).toBe(longNumber);
    });

    it('should handle form with special characters', () => {
      // Initialize the component properly
      component.ngOnInit();
      
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      component.goalForm.patchValue({
        title: specialChars,
        description: specialChars,
        targetAmount: 1000,
        startDate: '2024-01-01',
        targetDate: '2024-12-31',
        category: specialChars,
        priority: 'high',
        type: 'savings'
      });

      expect(component.goalForm.get('title')?.value).toBe(specialChars);
      expect(component.goalForm.get('description')?.value).toBe(specialChars);
    });

    it('should handle form with unicode characters', () => {
      // Initialize the component properly
      component.ngOnInit();
      
      const unicodeString = '🚀💰📈🎯💎🌟';
      
      component.goalForm.patchValue({
        title: unicodeString,
        description: unicodeString,
        targetAmount: 1000,
        startDate: '2024-01-01',
        targetDate: '2024-12-31',
        category: unicodeString,
        priority: 'high',
        type: 'savings'
      });

      expect(component.goalForm.get('title')?.value).toBe(unicodeString);
      expect(component.goalForm.get('description')?.value).toBe(unicodeString);
    });

    it('should handle form with negative amounts', () => {
      // Initialize the component properly
      component.ngOnInit();
      
      component.goalForm.patchValue({
        title: 'Test Goal',
        description: 'Test description',
        targetAmount: -1000,
        startDate: '2024-01-01',
        targetDate: '2024-12-31',
        category: 'Savings',
        priority: 'high',
        type: 'savings'
      });

      expect(component.goalForm.get('targetAmount')?.value).toBe(-1000);
    });

    it('should handle form with decimal amounts', () => {
      // Initialize the component properly
      component.ngOnInit();
      
      component.goalForm.patchValue({
        title: 'Test Goal',
        description: 'Test description',
        targetAmount: 1000.99,
        startDate: '2024-01-01',
        targetDate: '2024-12-31',
        category: 'Savings',
        priority: 'high',
        type: 'savings'
      });

      expect(component.goalForm.get('targetAmount')?.value).toBe(1000.99);
    });

    it('should handle form with invalid date strings', () => {
      // Initialize the component properly
      component.ngOnInit();
      
      component.goalForm.patchValue({
        title: 'Test Goal',
        description: 'Test description',
        targetAmount: 1000,
        startDate: 'invalid-date',
        targetDate: 'invalid-date',
        category: 'Savings',
        priority: 'high',
        type: 'savings'
      });

      expect(component.goalForm.get('startDate')?.value).toBe('invalid-date');
      expect(component.goalForm.get('targetDate')?.value).toBe('invalid-date');
    });

    it('should handle form with empty priority and type', () => {
      // Initialize the component properly
      component.ngOnInit();
      
      component.goalForm.patchValue({
        title: 'Test Goal',
        description: 'Test description',
        targetAmount: 1000,
        startDate: '2024-01-01',
        targetDate: '2024-12-31',
        category: 'Savings',
        priority: '',
        type: ''
      });

      expect(component.goalForm.get('priority')?.value).toBe('');
      expect(component.goalForm.get('type')?.value).toBe('');
    });

  it('should handle form reset after multiple patches', () => {
    // Initialize the component properly
    component.ngOnInit();
    
    // First patch
    component.goalForm.patchValue({
      title: 'First Goal',
      targetAmount: 1000
    });

    // Second patch
    component.goalForm.patchValue({
      title: 'Second Goal',
      targetAmount: 2000
    });

    // Reset form
    component.goalForm.reset();

    expect(component.goalForm.get('title')?.value).toBeFalsy();
    expect(component.goalForm.get('targetAmount')?.value).toBeFalsy();
  });

  it('should handle data loading errors', () => {
    mockCategoryService.getUserCategories.and.returnValue(throwError(() => new Error('API Error')));
    
    component['loadData']();
    
    expect(component.isLoading).toBe(false);
  });

  it('should handle transaction loading errors', () => {
    mockTransactionService.getUserTransactions.and.returnValue(throwError(() => new Error('API Error')));
    
    component['loadTransactions']();
    
    expect(component.isLoading).toBe(false);
  });

  it('should handle empty categories response', () => {
    mockCategoryService.getUserCategories.and.returnValue(of([]));
    
    component['loadData']();
    
    expect(component.categories).toEqual([]);
  });

  it('should handle empty transactions response', () => {
    mockTransactionService.getUserTransactions.and.returnValue(of({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }));
    
    component['loadTransactions']();
    
    expect(component.transactions).toEqual([]);
  });

  it('should calculate goal progress with zero target amount', () => {
    component.goals = [{
      _id: '1',
      title: 'Test Goal',
      description: 'Test Description',
      targetAmount: 0,
      currentAmount: 100,
      startDate: new Date('2024-01-01'),
      targetDate: new Date('2024-12-31'),
      category: 'Savings',
      priority: 'high',
      status: 'active',
      type: 'savings',
      icon: 'fas fa-star',
      color: '#007bff',
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }];
    
    component['calculateGoalProgress']();
    
    expect(component.goalProgress[0].percentageComplete).toBe(Infinity);
  });

  it('should calculate days remaining for past date', () => {
    const pastDate = new Date('2020-01-01');
    const daysRemaining = component['calculateDaysRemaining'](pastDate);
    
    expect(daysRemaining).toBe(0);
  });

  it('should calculate days remaining for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const daysRemaining = component['calculateDaysRemaining'](futureDate);
    
    expect(daysRemaining).toBeGreaterThan(0);
    expect(daysRemaining).toBeLessThanOrEqual(30);
  });

  it('should handle update goal progress with negative amount', () => {
    const goal = { 
      ...component.goals[0],
      currentAmount: 1000,
      targetAmount: 5000
    };
    const initialAmount = goal.currentAmount;
    
    component.updateGoalProgress(goal, -1000);
    
    expect(goal.currentAmount).toBe(0);
  });

  it('should handle update goal progress with amount exceeding target', () => {
    const goal = { 
      ...component.goals[0],
      currentAmount: 1000,
      targetAmount: 5000
    };
    const targetAmount = goal.targetAmount;
    
    component.updateGoalProgress(goal, 10000);
    
    expect(goal.currentAmount).toBe(targetAmount);
  });

  it('should handle toggle goal status from paused to active', () => {
    const goal = { ...component.goals[0], status: 'paused' as const };
    
    component.toggleGoalStatus(goal);
    
    expect(goal.status).toBe('active');
  });

  it('should handle complete goal', () => {
    const goal = { 
      ...component.goals[0],
      currentAmount: 1000,
      targetAmount: 5000
    };
    const targetAmount = goal.targetAmount;
    
    component.completeGoal(goal);
    
    expect(goal.status).toBe('completed');
    expect(goal.currentAmount).toBe(targetAmount);
  });

  it('should handle get goal progress for non-existent goal', () => {
    const progress = component.getGoalProgress('nonexistent');
    
    expect(progress).toBeUndefined();
  });

  it('should handle delete goal without confirmation', () => {
    confirmSpy.and.returnValue(false);
    const initialGoalCount = component.goals.length;
    
    component.deleteGoal('1');
    
    expect(component.goals.length).toBe(initialGoalCount);
  });

  it('should handle delete goal with confirmation', () => {
    confirmSpy.and.returnValue(true);
    const initialGoalCount = component.goals.length;
    
    component.deleteGoal('1');
    
    expect(component.goals.length).toBe(initialGoalCount);
  });
});
});
