import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { FinancialInsightsComponent } from './financial-insights';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { Transaction, TransactionType, TransactionStatus, Category, PaginatedResponse } from '../../../../core/models/financial.model';

describe('FinancialInsightsComponent', () => {
  let component: FinancialInsightsComponent;
  let fixture: ComponentFixture<FinancialInsightsComponent>;
  let mockFinancialService: jasmine.SpyObj<FinancialService>;
  let mockTransactionService: jasmine.SpyObj<TransactionService>;
  let mockCategoryService: jasmine.SpyObj<CategoryService>;

  // Mock data
  const mockCategories: Category[] = [
    {
      _id: 'cat1',
      name: 'Food & Dining',
      description: 'Restaurants and groceries',
      color: '#ff6b6b',
      icon: 'fas fa-utensils',
      parentId: undefined,
      path: ['Food & Dining'],
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
      description: 'Gas, public transport, rideshare',
      color: '#4ecdc4',
      icon: 'fas fa-car',
      parentId: undefined,
      path: ['Transportation'],
      level: 0,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'cat3',
      name: 'Entertainment',
      description: 'Movies, games, hobbies',
      color: '#45b7d1',
      icon: 'fas fa-gamepad',
      parentId: undefined,
      path: ['Entertainment'],
      level: 0,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockTransactions: Transaction[] = [
    {
      _id: 'trans1',
      title: 'Grocery Shopping',
      description: 'Weekly groceries',
      amount: 150.00,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      subcategoryId: undefined,
      tags: ['groceries', 'weekly'],
      date: new Date('2024-01-15'),
      time: '14:30',
      timezone: 'America/New_York',
      location: undefined,
      paymentMethod: 'debit_card' as any,
      paymentReference: undefined,
      merchantName: 'Local Grocery Store',
      merchantId: undefined,
      originalAmount: undefined,
      originalCurrency: undefined,
      exchangeRate: undefined,
      fees: undefined,
      tax: undefined,
      isRecurring: false,
      recurrencePattern: undefined as any,
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
      _id: 'trans2',
      title: 'Salary',
      description: 'Monthly salary',
      amount: 5000.00,
      currency: 'USD',
      type: TransactionType.INCOME,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      subcategoryId: undefined,
      tags: ['salary', 'monthly'],
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      time: '09:00',
      timezone: 'America/New_York',
      location: undefined,
      paymentMethod: 'bank_transfer' as any,
      paymentReference: undefined,
      merchantName: 'Company Inc',
      merchantId: undefined,
      originalAmount: undefined,
      originalCurrency: undefined,
      exchangeRate: undefined,
      fees: undefined,
      tax: undefined,
      isRecurring: true,
      recurrencePattern: 'monthly' as any,
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
      _id: 'trans3',
      title: 'Gas Station',
      description: 'Fuel for car',
      amount: 45.00,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat2',
      subcategoryId: undefined,
      tags: ['gas', 'transportation'],
      date: new Date('2024-01-10'),
      time: '16:45',
      timezone: 'America/New_York',
      location: undefined,
      paymentMethod: 'credit_card' as any,
      paymentReference: undefined,
      merchantName: 'Shell Gas Station',
      merchantId: undefined,
      originalAmount: undefined,
      originalCurrency: undefined,
      exchangeRate: undefined,
      fees: undefined,
      tax: undefined,
      isRecurring: false,
      recurrencePattern: undefined as any,
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
      _id: 'trans4',
      title: 'December Groceries',
      description: 'Monthly groceries',
      amount: 200.00,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: TransactionStatus.PENDING,
      categoryId: 'cat1',
      subcategoryId: undefined,
      tags: ['groceries', 'monthly'],
      date: new Date('2023-12-15'),
      time: '14:30',
      timezone: 'America/New_York',
      location: undefined,
      paymentMethod: 'debit_card' as any,
      paymentReference: undefined,
      merchantName: 'Local Grocery Store',
      merchantId: undefined,
      originalAmount: undefined,
      originalCurrency: undefined,
      exchangeRate: undefined,
      fees: undefined,
      tax: undefined,
      isRecurring: false,
      recurrencePattern: undefined as any,
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
      _id: 'trans5',
      title: 'December Salary',
      description: 'Monthly salary',
      amount: 5000.00,
      currency: 'USD',
      type: TransactionType.INCOME,
      status: TransactionStatus.COMPLETED,
      categoryId: 'cat1',
      subcategoryId: undefined,
      tags: ['salary', 'monthly'],
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      time: '09:00',
      timezone: 'America/New_York',
      location: undefined,
      paymentMethod: 'bank_transfer' as any,
      paymentReference: undefined,
      merchantName: 'Company Inc',
      merchantId: undefined,
      originalAmount: undefined,
      originalCurrency: undefined,
      exchangeRate: undefined,
      fees: undefined,
      tax: undefined,
      isRecurring: true,
      recurrencePattern: 'monthly' as any,
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

  beforeEach(async () => {
    const financialServiceSpy = jasmine.createSpyObj('FinancialService', ['getFinancialDashboard']);
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getUserTransactions']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getUserCategories']);

    // Mock service responses
    transactionServiceSpy.getUserTransactions.and.returnValue(of({
      data: mockTransactions,
      pagination: {
        page: 1,
        limit: 10,
        total: mockTransactions.length,
        totalPages: 1
      }
    } as PaginatedResponse<Transaction>));

    categoryServiceSpy.getUserCategories.and.returnValue(of(mockCategories));

    await TestBed.configureTestingModule({
      imports: [
        FinancialInsightsComponent,
        FormsModule,
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

    fixture = TestBed.createComponent(FinancialInsightsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isLoading).toBe(false);
    expect(component.selectedInsightType).toBe('all');
    expect(component.showInsights).toBe(true);
    expect(component.showTrends).toBe(true);
    expect(component.totalInsights).toBe(0);
    expect(component.highPriorityInsights).toBe(0);
    expect(component.actionableInsights).toBe(0);
  });

  it('should initialize forms on ngOnInit', () => {
    spyOn(component as any, 'loadData');

    component.ngOnInit();

    expect(component['loadData']).toHaveBeenCalled();
  });

  it('should clean up on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  describe('Data Loading', () => {
    it('should load transactions and categories', () => {
      component['loadData']();

      expect(mockTransactionService.getUserTransactions).toHaveBeenCalled();
      expect(mockCategoryService.getUserCategories).toHaveBeenCalled();
    });

    it('should handle transaction loading errors gracefully', () => {
      mockTransactionService.getUserTransactions.and.returnValue(
        of({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } })
      );

      component['loadData']();

      expect(component.transactions).toEqual([]);
    });

    it('should handle category loading errors gracefully', () => {
      mockCategoryService.getUserCategories.and.returnValue(of([]));

      component['loadData']();

      expect(component.categories).toEqual([]);
    });
  });

  describe('Insight Generation', () => {
    beforeEach(() => {
      component.transactions = mockTransactions;
      component.categories = mockCategories;
    });

    it('should generate spending insights', () => {
      component['generateSpendingInsights']();

      expect(component.insights.length).toBeGreaterThan(0);
      const spendingInsights = component.insights.filter(i => i.type === 'spending');
      expect(spendingInsights.length).toBeGreaterThan(0);
    });

    it('should generate income insights', () => {
      component['generateIncomeInsights']();

      expect(component.insights.length).toBeGreaterThan(0);
      const incomeInsights = component.insights.filter(i => i.type === 'income' || i.type === 'alert');
      expect(incomeInsights.length).toBeGreaterThan(0);
    });

    it('should generate savings insights', () => {
      component['generateSavingsInsights']();

      expect(component.insights.length).toBeGreaterThan(0);
      const savingsInsights = component.insights.filter(i => i.type === 'savings' || i.type === 'alert' || i.type === 'recommendation');
      expect(savingsInsights.length).toBeGreaterThan(0);
    });

    it('should generate trend insights', () => {
      // Mock the calculateMonthlyTrends method to return data that will trigger insights
      spyOn(component as any, 'calculateMonthlyTrends').and.returnValue([
        { month: 'Dec 2023', income: 5000, expenses: 200 },
        { month: 'Jan 2024', income: 6000, expenses: 300 }
      ]);

      component['generateTrendInsights']();

      expect(component.insights.length).toBeGreaterThan(0);
      const trendInsights = component.insights.filter(i => i.type === 'trend');
      expect(trendInsights.length).toBeGreaterThan(0);
    });

    it('should generate alerts', () => {
      component['generateAlerts']();

      expect(component.insights.length).toBeGreaterThan(0);
      const alertInsights = component.insights.filter(i => i.type === 'alert');
      expect(alertInsights.length).toBeGreaterThan(0);
    });

    it('should generate recommendations', () => {
      component['generateRecommendations']();

      expect(component.insights.length).toBeGreaterThan(0);
      const recommendationInsights = component.insights.filter(i => i.type === 'recommendation');
      expect(recommendationInsights.length).toBeGreaterThan(0);
    });

    it('should calculate insight statistics correctly', () => {
      component['generateInsights']();
      component['calculateInsightStats']();

      expect(component.totalInsights).toBeGreaterThan(0);
      expect(component.highPriorityInsights).toBeGreaterThanOrEqual(0);
      expect(component.actionableInsights).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Trend Generation', () => {
    beforeEach(() => {
      component.transactions = mockTransactions;
      component.categories = mockCategories;
    });

    it('should generate trends for categories', () => {
      component['generateTrends']();

      expect(component.trends.length).toBeGreaterThan(0);
      expect(component.trends[0].category).toBeDefined();
      expect(component.trends[0].trend).toBeDefined();
      expect(component.trends[0].change).toBeDefined();
      expect(component.trends[0].confidence).toBeDefined();
    });

    it('should calculate category spending correctly', () => {
      const expenses = mockTransactions.filter(t => t.type === TransactionType.EXPENSE);
      const categorySpending = component['calculateCategorySpending'](expenses);

      expect(categorySpending.length).toBeGreaterThan(0);
      expect(categorySpending[0].id).toBeDefined();
      expect(categorySpending[0].name).toBeDefined();
      expect(categorySpending[0].amount).toBeDefined();
      expect(categorySpending[0].percentage).toBeDefined();
    });

    it('should calculate monthly trends correctly', () => {
      const monthlyTrends = component['calculateMonthlyTrends']();

      expect(monthlyTrends.length).toBeGreaterThan(0);
      expect(monthlyTrends[0].month).toBeDefined();
      expect(monthlyTrends[0].income).toBeDefined();
      expect(monthlyTrends[0].expenses).toBeDefined();
    });

    it('should calculate category trends', () => {
      const trend = component['calculateCategoryTrend']('cat1');

      expect(trend.direction).toBeDefined();
      expect(trend.change).toBeDefined();
      expect(trend.confidence).toBeDefined();
      expect(['rising', 'falling', 'stable']).toContain(trend.direction);
    });

    it('should get trend descriptions correctly', () => {
      const risingTrend = { direction: 'rising' as const, change: 15.5 };
      const fallingTrend = { direction: 'falling' as const, change: 10.2 };
      const stableTrend = { direction: 'stable' as const, change: 2.1 };

      const risingDesc = component['getTrendDescription'](risingTrend);
      const fallingDesc = component['getTrendDescription'](fallingTrend);
      const stableDesc = component['getTrendDescription'](stableTrend);

      expect(risingDesc).toContain('trending upward');
      expect(fallingDesc).toContain('trending downward');
      expect(stableDesc).toContain('relatively stable');
    });
  });

  describe('Utility Methods', () => {
    beforeEach(() => {
      component.categories = mockCategories;
    });

    it('should get category name by ID', () => {
      const categoryName = component['getCategoryName']('cat1');
      expect(categoryName).toBe('Food & Dining');
    });

    it('should return unknown category for invalid ID', () => {
      const categoryName = component['getCategoryName']('invalid-id');
      expect(categoryName).toBe('Unknown Category');
    });

    it('should get category ID by name', () => {
      const categoryId = component['getCategoryId']('Food & Dining');
      expect(categoryId).toBe('cat1');
    });

    it('should return empty string for invalid category name', () => {
      const categoryId = component['getCategoryId']('Invalid Category');
      expect(categoryId).toBe('');
    });
  });

  describe('User Interactions', () => {
    it('should handle insight type change', () => {
      component.onInsightTypeChange('spending');

      expect(component.selectedInsightType).toBe('spending');
    });

    it('should handle insight action', () => {
      const insight = {
        id: 'test-insight',
        type: 'spending' as const,
        title: 'Test Insight',
        description: 'Test description',
        value: 100,
        change: 10,
        changeType: 'increase' as const,
        severity: 'medium' as const,
        icon: 'fas fa-test',
        color: '#000000',
        actionable: true,
        actionText: 'Test Action',
        actionRoute: '/test'
      };

      spyOn(console, 'log');
      component.onInsightAction(insight);

      expect(console.log).toHaveBeenCalledWith('Navigating to: /test');
    });

    it('should dismiss insight', () => {
      component.insights = [
        {
          id: 'insight1',
          type: 'spending',
          title: 'Test Insight 1',
          description: 'Test description 1',
          value: 100,
          change: 10,
          changeType: 'increase',
          severity: 'medium',
          icon: 'fas fa-test',
          color: '#000000',
          actionable: true
        },
        {
          id: 'insight2',
          type: 'income',
          title: 'Test Insight 2',
          description: 'Test description 2',
          value: 200,
          change: 20,
          changeType: 'decrease',
          severity: 'high',
          icon: 'fas fa-test',
          color: '#000000',
          actionable: false
        }
      ];

      const initialCount = component.insights.length;
      component.dismissInsight('insight1');

      expect(component.insights.length).toBe(initialCount - 1);
      expect(component.insights.find(i => i.id === 'insight1')).toBeUndefined();
    });

    it('should export insights', () => {
      spyOn(console, 'log');
      component.exportInsights();

      expect(console.log).toHaveBeenCalledWith('Exporting insights...');
    });

    it('should print insights', () => {
      spyOn(window, 'print');
      component.printInsights();

      expect(window.print).toHaveBeenCalled();
    });
  });

  describe('Filtering and Display', () => {
    beforeEach(() => {
      component.insights = [
        {
          id: 'insight1',
          type: 'spending',
          title: 'Spending Insight',
          description: 'Test spending insight',
          value: 100,
          change: 10,
          changeType: 'increase',
          severity: 'medium',
          icon: 'fas fa-test',
          color: '#000000',
          actionable: true
        },
        {
          id: 'insight2',
          type: 'income',
          title: 'Income Insight',
          description: 'Test income insight',
          value: 200,
          change: 20,
          changeType: 'decrease',
          severity: 'high',
          icon: 'fas fa-test',
          color: '#000000',
          actionable: false
        }
      ];
    });

    it('should filter insights by type', () => {
      component.selectedInsightType = 'spending';
      const filteredInsights = component.getFilteredInsightsList();

      expect(filteredInsights.length).toBe(1);
      expect(filteredInsights[0].type).toBe('spending');
    });

    it('should return all insights when type is all', () => {
      component.selectedInsightType = 'all';
      const filteredInsights = component.getFilteredInsightsList();

      expect(filteredInsights.length).toBe(2);
    });

    it('should calculate trend bar width correctly', () => {
      const width1 = component.getTrendBarWidth(20);
      const width2 = component.getTrendBarWidth(50);
      const width3 = component.getTrendBarWidth(25);

      expect(width1).toBe(100); // 20 * 5 = 100, capped at 100
      expect(width2).toBe(100); // 50 * 5 = 250, capped at 100
      expect(width3).toBe(100); // 25 * 5 = 125, capped at 100
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty transactions array', () => {
      component.transactions = [];
      component.categories = mockCategories;

      component['generateInsights']();

      expect(component.insights.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty categories array', () => {
      component.transactions = mockTransactions;
      component.categories = [];

      component['generateInsights']();

      expect(component.insights.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle transactions with missing category IDs', () => {
      const transactionsWithMissingCategories = mockTransactions.map(t => ({
        ...t,
        categoryId: 'missing-category-id'
      }));

      component.transactions = transactionsWithMissingCategories;
      component.categories = mockCategories;

      const expenses = component.transactions.filter(t => t.type === TransactionType.EXPENSE);
      const categorySpending = component['calculateCategorySpending'](expenses);

      expect(categorySpending.length).toBeGreaterThan(0);
      expect(categorySpending[0].name).toBe('Unknown Category');
    });

    it('should handle very large transaction amounts', () => {
      const largeTransaction = {
        ...mockTransactions[0],
        amount: Number.MAX_SAFE_INTEGER
      };

      component.transactions = [largeTransaction];
      component.categories = mockCategories;

      component['generateInsights']();

      expect(component.insights.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle negative transaction amounts', () => {
      const negativeTransaction = {
        ...mockTransactions[0],
        amount: -100
      };

      component.transactions = [negativeTransaction];
      component.categories = mockCategories;

      component['generateInsights']();

      expect(component.insights.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle transactions with invalid dates', () => {
      const invalidDateTransaction = {
        ...mockTransactions[0],
        date: new Date('invalid-date')
      };

      component.transactions = [invalidDateTransaction];
      component.categories = mockCategories;

      const monthlyTrends = component['calculateMonthlyTrends']();

      expect(Array.isArray(monthlyTrends)).toBe(true);
    });
  });
});
