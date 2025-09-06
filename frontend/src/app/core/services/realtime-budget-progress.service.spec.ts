import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RealtimeBudgetProgressService } from './realtime-budget-progress.service';
import { BudgetService } from './budget.service';
import { TransactionService } from './transaction.service';
import { CategoryService } from './category.service';

describe('RealtimeBudgetProgressService', () => {
  let service: RealtimeBudgetProgressService;
  let mockBudgetService: jasmine.SpyObj<BudgetService>;
  let mockTransactionService: jasmine.SpyObj<TransactionService>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;

  const mockBudgets = [
    {
      _id: '1',
      name: 'Test Budget',
      description: 'Test budget description',
      period: 'monthly' as const,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      totalAmount: 1000,
      currency: 'USD',
      categoryAllocations: [
        {
          categoryId: 'cat1',
          allocatedAmount: 400,
          isFlexible: false,
          priority: 1
        },
        {
          categoryId: 'cat2',
          allocatedAmount: 600,
          isFlexible: false,
          priority: 2
        }
      ],
      status: 'active' as const,
      alertThreshold: 80,
      userId: 'user1',
      isActive: true,
      autoAdjust: false,
      allowRollover: false,
      rolloverAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockTransactions = [
    {
      _id: '1',
      title: 'Test Transaction 1',
      description: 'Test transaction',
      amount: 100,
      currency: 'USD',
      type: 'expense' as any,
      status: 'completed' as any,
      categoryId: 'cat1',
      subcategoryId: undefined,
      tags: [],
      date: new Date('2024-01-15'),
      time: undefined,
      timezone: 'UTC',
      location: undefined,
      paymentMethod: 'credit_card' as any,
      paymentReference: undefined,
      merchantName: 'Test Merchant',
      merchantId: undefined,
      originalAmount: undefined,
      originalCurrency: undefined,
      exchangeRate: undefined,
      fees: undefined,
      tax: undefined,
      isRecurring: false,
      recurrencePattern: 'none' as any,
      recurrenceInterval: undefined,
      recurrenceEndDate: undefined,
      nextOccurrence: undefined,
      parentTransactionId: undefined,
      attachments: [],
      notes: undefined,
      source: 'manual',
      externalId: undefined,
      lastSyncedAt: undefined,
      userId: 'user1',
      accountId: 'account1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
      isDeleted: false
    },
    {
      _id: '2',
      title: 'Test Transaction 2',
      description: 'Test transaction',
      amount: 200,
      currency: 'USD',
      type: 'expense' as any,
      status: 'completed' as any,
      categoryId: 'cat2',
      subcategoryId: undefined,
      tags: [],
      date: new Date('2024-01-20'),
      time: undefined,
      timezone: 'UTC',
      location: undefined,
      paymentMethod: 'credit_card' as any,
      paymentReference: undefined,
      merchantName: 'Test Merchant',
      merchantId: undefined,
      originalAmount: undefined,
      originalCurrency: undefined,
      exchangeRate: undefined,
      fees: undefined,
      tax: undefined,
      isRecurring: false,
      recurrencePattern: 'none' as any,
      recurrenceInterval: undefined,
      recurrenceEndDate: undefined,
      nextOccurrence: undefined,
      parentTransactionId: undefined,
      attachments: [],
      notes: undefined,
      source: 'manual',
      externalId: undefined,
      lastSyncedAt: undefined,
      userId: 'user1',
      accountId: 'account1',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
      isDeleted: false
    }
  ];

  const mockCategories = [
    { 
      _id: 'cat1', 
      name: 'Food',
      description: 'Food category',
      color: '#FF5733',
      icon: 'food',
      parentId: undefined,
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
      name: 'Transportation',
      description: 'Transportation category',
      color: '#33A1FF',
      icon: 'transport',
      parentId: undefined,
      path: ['Transportation'],
      level: 0,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    // Set test environment flag to prevent auto-initialization
    RealtimeBudgetProgressService.setTestEnvironment(true);
    
    const budgetServiceSpy = jasmine.createSpyObj('BudgetService', ['getBudgets']);
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getUserTransactions']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getUserCategories']);

    TestBed.configureTestingModule({
      providers: [
        RealtimeBudgetProgressService,
        { provide: BudgetService, useValue: budgetServiceSpy },
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    });

    service = TestBed.inject(RealtimeBudgetProgressService);
    mockBudgetService = TestBed.inject(BudgetService) as jasmine.SpyObj<BudgetService>;
    mockTransactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
    mockCategoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;

    // Setup default mock returns
    mockBudgetService.getBudgets.and.returnValue(of({ budgets: mockBudgets, total: mockBudgets.length, page: 1, totalPages: 1 }));
    mockTransactionService.getUserTransactions.and.returnValue(of({ 
      data: mockTransactions, 
      pagination: { page: 1, limit: 10, total: mockTransactions.length, totalPages: 1 }
    }));
    mockCategoryService.getUserCategories.and.returnValue(of(mockCategories));
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize real-time updates', () => {
    spyOn(service as any, 'loadRealtimeData').and.returnValue(of([]));
    
    service['initializeRealtimeUpdates']();
    
    expect(service['loadRealtimeData']).toHaveBeenCalled();
  });

  it('should load real-time data successfully', (done) => {
    service['loadRealtimeData']().subscribe(result => {
      expect(result).toBeDefined();
      expect(mockBudgetService.getBudgets).toHaveBeenCalled();
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalled();
      expect(mockCategoryService.getUserCategories).toHaveBeenCalled();
      done();
    });
  });

  it('should handle empty budgets', (done) => {
    mockBudgetService.getBudgets.and.returnValue(of({ budgets: [], total: 0, page: 1, totalPages: 0 }));
    
    service['loadRealtimeData']().subscribe(result => {
      expect(result).toEqual([]);
      done();
    });
  });

  it('should handle service errors', (done) => {
    mockBudgetService.getBudgets.and.returnValue(throwError('Service error'));
    
    service['loadRealtimeData']().subscribe({
      next: () => fail('Should have errored'),
      error: (error) => {
        expect(error).toBe('Service error');
        done();
      }
    });
  });

  it('should calculate real-time progress correctly', () => {
    const progress = service['calculateRealtimeProgress'](mockBudgets, mockTransactions, mockCategories);
    
    expect(progress.length).toBe(1);
    expect(progress[0].budgetId).toBe('1');
    expect(progress[0].budgetName).toBe('Test Budget');
    expect(progress[0].totalAmount).toBe(1000);
    expect(progress[0].spentAmount).toBe(300); // 100 + 200
    expect(progress[0].remainingAmount).toBe(700);
    expect(progress[0].progressPercentage).toBe(30);
    expect(progress[0].status).toBe('under');
    expect(progress[0].categoryProgress.length).toBe(2);
  });

  it('should calculate category progress correctly', () => {
    const budget = mockBudgets[0];
    const categoryProgress = service['calculateCategoryProgress'](budget, mockTransactions, mockCategories);
    
    expect(categoryProgress.length).toBe(2);
    
    const foodCategory = categoryProgress.find(cp => cp.categoryId === 'cat1');
    expect(foodCategory).toBeDefined();
    expect(foodCategory?.categoryName).toBe('Food');
    expect(foodCategory?.allocatedAmount).toBe(400);
    expect(foodCategory?.spentAmount).toBe(100);
    expect(foodCategory?.remainingAmount).toBe(300);
    expect(foodCategory?.progressPercentage).toBe(25);
    expect(foodCategory?.status).toBe('under');
  });

  it('should determine budget status correctly', () => {
    expect(service['determineBudgetStatus'](50, 80)).toBe('under');
    expect(service['determineBudgetStatus'](80, 80)).toBe('at');
    expect(service['determineBudgetStatus'](90, 80)).toBe('critical');
    expect(service['determineBudgetStatus'](100, 80)).toBe('over');
  });

  it('should determine category status correctly', () => {
    expect(service['determineCategoryStatus'](50, 100, 50)).toBe('under');
    expect(service['determineCategoryStatus'](75, 100, 75)).toBe('at');
    expect(service['determineCategoryStatus'](90, 100, 90)).toBe('critical');
    expect(service['determineCategoryStatus'](100, 100, 100)).toBe('critical'); // 100% is critical, not over
    expect(service['determineCategoryStatus'](110, 100, 110)).toBe('over'); // spent > allocated
  });

  it('should calculate spending trend correctly', () => {
    // Need at least 14 transactions for trend calculation
    const transactions: any[] = [];
    for (let i = 0; i < 14; i++) {
      transactions.push({
        amount: 50 + (i * 2), // Increasing amounts
        date: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`)
      });
    }
    
    const trend = service['calculateSpendingTrend'](transactions);
    expect(trend).toBe('increasing');
  });

  it('should calculate daily average correctly', () => {
    // Create a budget with future dates for testing
    const futureBudget = {
      ...mockBudgets[0],
      startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      endDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000) // 20 days from now
    };
    const transactions = mockTransactions;
    
    const dailyAverage = service['calculateDailyAverage'](transactions, futureBudget);
    // Budget duration: 30 days (10 days ago to 20 days from now)
    // Total spent: 100 + 200 = 300, so daily average should be 300/30 = 10
    expect(dailyAverage).toBe(10);
  });

  it('should calculate projected overspend correctly', () => {
    const spentAmount = 200;
    const dailyAverage = 20;
    const allocatedAmount = 300;
    const endDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
    
    const projectedOverspend = service['calculateProjectedOverspend'](spentAmount, dailyAverage, allocatedAmount, endDate);
    // 200 + (20 * 5) = 300, which equals allocated amount, so should be false (not overspending)
    expect(projectedOverspend).toBe(false);
  });

  it('should check if transaction is in budget period', () => {
    const budget = mockBudgets[0];
    const transaction = mockTransactions[0];
    
    const isInPeriod = service['isTransactionInBudgetPeriod'](transaction, budget);
    expect(isInPeriod).toBe(true);
  });

  it('should calculate days remaining correctly', () => {
    const endDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days from now
    const daysRemaining = service['calculateDaysRemaining'](endDate);
    expect(daysRemaining).toBe(10);
  });

  it('should update budget statistics', () => {
    const progressData = [
      {
        budgetId: '1',
        budgetName: 'Test Budget',
        totalAmount: 1000,
        spentAmount: 500,
        remainingAmount: 500,
        progressPercentage: 50,
        status: 'under' as any,
        daysRemaining: 15,
        categoryProgress: [],
        lastUpdated: new Date(),
        alerts: []
      }
    ];
    
    service['updateBudgetStats'](progressData);
    
    // Check that budgetStats$ was updated
    service.getBudgetStats().subscribe(stats => {
      expect(stats).toBeDefined();
      expect(stats?.totalBudgets).toBe(1);
      expect(stats?.totalSpent).toBe(500);
      expect(stats?.totalBudget).toBe(1000);
      expect(stats?.overallProgress).toBe(50);
    });
  });

  it('should check for alerts and create new ones', () => {
    const progressData = [
      {
        budgetId: '1',
        budgetName: 'Test Budget',
        totalAmount: 1000,
        spentAmount: 950, // 95% spent
        remainingAmount: 50,
        progressPercentage: 95, // Above critical threshold
        status: 'critical' as any,
        daysRemaining: 15,
        categoryProgress: [
          {
            categoryId: 'cat1',
            categoryName: 'Food',
            allocatedAmount: 400,
            spentAmount: 450, // Over budget
            remainingAmount: -50,
            progressPercentage: 112.5,
            status: 'over' as any,
            trend: 'increasing' as any,
            dailyAverage: 30,
            projectedOverspend: true
          }
        ],
        lastUpdated: new Date(),
        alerts: []
      }
    ];
    
    service['checkForAlerts'](progressData);
    
    // Check that alerts$ was updated
    service.getAlerts().subscribe(alerts => {
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.type === 'critical')).toBe(true);
    });
  });

  it('should refresh data manually', () => {
    spyOn(service as any, 'loadRealtimeData').and.returnValue(of([]));
    
    service.refreshData();
    
    expect(service['loadRealtimeData']).toHaveBeenCalled();
  });

  it('should acknowledge alert', () => {
    const alertId = 'test-alert';
    const currentAlerts = [
      { id: alertId, acknowledged: false } as any,
      { id: 'other', acknowledged: false } as any
    ];
    
    service['alerts$'].next(currentAlerts);
    service.acknowledgeAlert(alertId);
    
    service.getAlerts().subscribe(alerts => {
      const alert = alerts.find(a => a.id === alertId);
      expect(alert?.acknowledged).toBe(true);
    });
  });

  it('should clear all alerts', () => {
    const currentAlerts = [
      { id: '1', acknowledged: false } as any,
      { id: '2', acknowledged: true } as any
    ];
    
    service['alerts$'].next(currentAlerts);
    service.clearAllAlerts();
    
    service.getAlerts().subscribe(alerts => {
      expect(alerts).toEqual([]);
    });
  });

  it('should get budget progress by ID', () => {
    const progressData = [
      { budgetId: '1', budgetName: 'Budget 1' } as any,
      { budgetId: '2', budgetName: 'Budget 2' } as any
    ];
    
    service['realtimeProgress$'].next(progressData);
    
    const budget1 = service.getBudgetProgress('1');
    const budget2 = service.getBudgetProgress('2');
    const budget3 = service.getBudgetProgress('3');
    
    expect(budget1?.budgetName).toBe('Budget 1');
    expect(budget2?.budgetName).toBe('Budget 2');
    expect(budget3).toBeUndefined();
  });

  it('should get category progress by budget and category ID', () => {
    const progressData = [
      {
        budgetId: '1',
        categoryProgress: [
          { categoryId: 'cat1', categoryName: 'Food' } as any,
          { categoryId: 'cat2', categoryName: 'Transport' } as any
        ]
      } as any
    ];
    
    service['realtimeProgress$'].next(progressData);
    
    const category1 = service.getCategoryProgress('1', 'cat1');
    const category2 = service.getCategoryProgress('1', 'cat2');
    const category3 = service.getCategoryProgress('1', 'cat3');
    
    expect(category1?.categoryName).toBe('Food');
    expect(category2?.categoryName).toBe('Transport');
    expect(category3).toBeUndefined();
  });

  it('should handle service destruction', () => {
    spyOn(service['destroy$'], 'next');
    spyOn(service['destroy$'], 'complete');
    
    service.ngOnDestroy();
    
    expect(service['destroy$'].next).toHaveBeenCalled();
    expect(service['destroy$'].complete).toHaveBeenCalled();
  });
});
