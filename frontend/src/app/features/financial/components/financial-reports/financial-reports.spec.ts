import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { FinancialReportsComponent } from './financial-reports';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  FinancialReport,
  PaginatedResponse,
  RecurrencePattern
} from '../../../../core/models/financial.model';

describe('FinancialReportsComponent', () => {
  let component: FinancialReportsComponent;
  let fixture: ComponentFixture<FinancialReportsComponent>;
  let financialService: jasmine.SpyObj<FinancialService>;
  let transactionService: jasmine.SpyObj<TransactionService>;
  let categoryService: jasmine.SpyObj<CategoryService>;

  // Mock data
  const mockCategories: Category[] = [
    {
      _id: 'cat1',
      name: 'Food & Dining',
      description: 'Food and dining expenses',
      color: '#FF6B6B',
      icon: 'fas fa-utensils',
      parentId: undefined,
      path: ['Food & Dining'],
      level: 1,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'cat2',
      name: 'Transportation',
      description: 'Transportation expenses',
      color: '#4ECDC4',
      icon: 'fas fa-car',
      parentId: undefined,
      path: ['Transportation'],
      level: 1,
      isActive: true,
      isSystem: false,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'cat3',
      name: 'Entertainment',
      description: 'Entertainment expenses',
      color: '#45B7D1',
      icon: 'fas fa-film',
      parentId: undefined,
      path: ['Entertainment'],
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
      _id: 'trans1',
      title: 'Grocery Shopping',
      description: 'Weekly groceries',
      amount: 150.00,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: 'completed' as any,
      categoryId: 'cat1',
      subcategoryId: undefined,
      tags: ['groceries', 'food'],
      date: new Date('2024-01-15'),
      time: undefined,
      timezone: 'UTC',
      location: undefined,
      paymentMethod: 'debit_card' as any,
      paymentReference: undefined,
      merchantName: undefined,
      merchantId: undefined,
      originalAmount: undefined,
      originalCurrency: undefined,
      exchangeRate: undefined,
      fees: undefined,
      tax: undefined,
      isRecurring: false,
      recurrencePattern: RecurrencePattern.NONE,
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
      status: 'completed' as any,
      categoryId: 'cat2',
      subcategoryId: undefined,
      tags: ['salary', 'income'],
      date: new Date('2024-01-01'),
      time: undefined,
      timezone: 'UTC',
      location: undefined,
      paymentMethod: 'bank_transfer' as any,
      paymentReference: undefined,
      merchantName: undefined,
      merchantId: undefined,
      originalAmount: undefined,
      originalCurrency: undefined,
      exchangeRate: undefined,
      fees: undefined,
      tax: undefined,
      isRecurring: false,
      recurrencePattern: RecurrencePattern.NONE,
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
      title: 'Gas',
      description: 'Car fuel',
      amount: 45.00,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: 'completed' as any,
      categoryId: 'cat2',
      subcategoryId: undefined,
      tags: ['gas', 'transportation'],
      date: new Date('2024-01-10'),
      time: undefined,
      timezone: 'UTC',
      location: undefined,
      paymentMethod: 'credit_card' as any,
      paymentReference: undefined,
      merchantName: undefined,
      merchantId: undefined,
      originalAmount: undefined,
      originalCurrency: undefined,
      exchangeRate: undefined,
      fees: undefined,
      tax: undefined,
      isRecurring: false,
      recurrencePattern: RecurrencePattern.NONE,
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
      title: 'Movie Tickets',
      description: 'Weekend movie',
      amount: 25.00,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      status: 'completed' as any,
      categoryId: 'cat3',
      subcategoryId: undefined,
      tags: ['entertainment', 'movies'],
      date: new Date('2024-01-20'),
      time: undefined,
      timezone: 'UTC',
      location: undefined,
      paymentMethod: 'credit_card' as any,
      paymentReference: undefined,
      merchantName: undefined,
      merchantId: undefined,
      originalAmount: undefined,
      originalCurrency: undefined,
      exchangeRate: undefined,
      fees: undefined,
      tax: undefined,
      isRecurring: false,
      recurrencePattern: RecurrencePattern.NONE,
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
      title: 'Bank Transfer',
      description: 'Transfer to savings',
      amount: 1000.00,
      currency: 'USD',
      type: TransactionType.TRANSFER,
      status: 'completed' as any,
      categoryId: 'cat1',
      subcategoryId: undefined,
      tags: ['transfer', 'savings'],
      date: new Date('2024-01-05'),
      time: undefined,
      timezone: 'UTC',
      location: undefined,
      paymentMethod: 'bank_transfer' as any,
      paymentReference: undefined,
      merchantName: undefined,
      merchantId: undefined,
      originalAmount: undefined,
      originalCurrency: undefined,
      exchangeRate: undefined,
      fees: undefined,
      tax: undefined,
      isRecurring: false,
      recurrencePattern: RecurrencePattern.NONE,
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

  const mockPaginatedResponse: PaginatedResponse<Transaction> = {
    data: mockTransactions,
    pagination: {
      page: 1,
      limit: 10,
      total: mockTransactions.length,
      totalPages: 1
    }
  };

  beforeEach(async () => {
    // Create spies for services
    const financialServiceSpy = jasmine.createSpyObj('FinancialService', ['getFinancialDashboard']);
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getUserTransactions']);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getUserCategories']);

    // Configure default return values
    transactionServiceSpy.getUserTransactions.and.callFake((params: any) => {
      return of(mockPaginatedResponse);
    });
    categoryServiceSpy.getUserCategories.and.returnValue(of(mockCategories));

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: FinancialService, useValue: financialServiceSpy },
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialReportsComponent);
    component = fixture.componentInstance;
    
    // Get service instances
    financialService = TestBed.inject(FinancialService) as jasmine.SpyObj<FinancialService>;
    transactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;
  });

  afterEach(() => {
    // Clean up spies - access private property through component instance
    if ((component as any).destroy$) {
      (component as any).destroy$.next();
      (component as any).destroy$.complete();
    }
  });

  describe('Component Creation and Lifecycle', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.selectedPeriod).toBe('month');
      expect(component.selectedReportType).toBe('summary');
      expect(component.customDateRange).toBe(false);
      expect(component.isLoading).toBe(false);
      expect(component.showAdvancedOptions).toBe(false);
      expect(component.transactions).toEqual([]);
      expect(component.categories).toEqual([]);
      expect(component.reportData).toBeNull();
    });

    it('should initialize dates and load data on ngOnInit', () => {
      spyOn(component as any, 'initializeDates');
      spyOn(component as any, 'loadData');
      
      component.ngOnInit();
      
      expect((component as any).initializeDates).toHaveBeenCalled();
      expect((component as any).loadData).toHaveBeenCalled();
    });

    it('should complete destroy$ subject on ngOnDestroy', () => {
      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');
      
      component.ngOnDestroy();
      
      expect((component as any).destroy$.next).toHaveBeenCalledWith();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });

  describe('Date Initialization', () => {
    it('should initialize dates for current month', () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      (component as any).initializeDates();
      
      expect(component.startDate).toBe(startOfMonth.toISOString().split('T')[0]);
      expect(component.endDate).toBe(endOfMonth.toISOString().split('T')[0]);
    });
  });

  describe('Data Loading', () => {
    it('should load transactions and categories successfully', () => {
      spyOn(component as any, 'generateReport');
      
      (component as any).loadData();
      
      expect(component.transactions).toEqual(mockTransactions);
      expect(component.categories).toEqual(mockCategories);
      expect((component as any).generateReport).toHaveBeenCalled();
      expect(component.isLoading).toBe(false);
    });

    it('should handle transaction loading error', () => {
      const consoleSpy = spyOn(console, 'error');
      transactionService.getUserTransactions.and.callFake((params: any) => {
        return throwError(() => new Error('API Error'));
      });
      
      (component as any).loadData();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error loading transactions:', jasmine.any(Error));
      expect(component.isLoading).toBe(false);
    });

    it('should handle category loading error', () => {
      const consoleSpy = spyOn(console, 'error');
      categoryService.getUserCategories.and.returnValue(throwError(() => new Error('API Error')));
      
      (component as any).loadData();
      
      expect(consoleSpy).toHaveBeenCalledWith('Error loading categories:', jasmine.any(Error));
    });
  });

  describe('Period and Report Type Changes', () => {
    it('should handle period change for non-custom periods', () => {
      spyOn(component as any, 'updateDateRange');
      spyOn(component as any, 'loadData');
      
      component.onPeriodChange('week');
      
      expect(component.selectedPeriod).toBe('week');
      expect(component.customDateRange).toBe(false);
      expect((component as any).updateDateRange).toHaveBeenCalledWith('week');
      expect((component as any).loadData).toHaveBeenCalled();
    });

    it('should handle period change for custom period', () => {
      spyOn(component as any, 'updateDateRange');
      spyOn(component as any, 'loadData');
      
      component.onPeriodChange('custom');
      
      expect(component.selectedPeriod).toBe('custom');
      expect(component.customDateRange).toBe(true);
      expect((component as any).updateDateRange).not.toHaveBeenCalled();
      expect((component as any).loadData).toHaveBeenCalled();
    });

    it('should handle report type change', () => {
      spyOn(component as any, 'generateReport');
      
      component.onReportTypeChange('detailed');
      
      expect(component.selectedReportType).toBe('detailed');
      expect((component as any).generateReport).toHaveBeenCalled();
    });

    it('should handle date range change', () => {
      spyOn(component as any, 'loadData');
      component.startDate = '2024-01-01';
      component.endDate = '2024-01-31';
      
      component.onDateRangeChange();
      
      expect((component as any).loadData).toHaveBeenCalled();
    });

    it('should not load data when date range is incomplete', () => {
      spyOn(component as any, 'loadData');
      component.startDate = '2024-01-01';
      component.endDate = '';
      
      component.onDateRangeChange();
      
      expect((component as any).loadData).not.toHaveBeenCalled();
    });

    it('should not load data when start date is missing', () => {
      spyOn(component as any, 'loadData');
      component.startDate = '';
      component.endDate = '2024-01-31';
      
      component.onDateRangeChange();
      
      expect((component as any).loadData).not.toHaveBeenCalled();
    });

    it('should not load data when end date is missing', () => {
      spyOn(component as any, 'loadData');
      component.startDate = '2024-01-01';
      component.endDate = '';
      
      component.onDateRangeChange();
      
      expect((component as any).loadData).not.toHaveBeenCalled();
    });
  });

  describe('Date Range Updates', () => {
    it('should update date range for week period', () => {
      const now = new Date('2024-01-15');
      jasmine.clock().mockDate(now);
      
      (component as any).updateDateRange('week');
      
      const expectedStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      expect(component.startDate).toBe(expectedStart.toISOString().split('T')[0]);
      expect(component.endDate).toBe(now.toISOString().split('T')[0]);
    });

    it('should update date range for month period', () => {
      const now = new Date('2024-01-15');
      jasmine.clock().mockDate(now);
      
      (component as any).updateDateRange('month');
      
      const expectedStart = new Date(now.getFullYear(), now.getMonth(), 1);
      expect(component.startDate).toBe(expectedStart.toISOString().split('T')[0]);
      expect(component.endDate).toBe(now.toISOString().split('T')[0]);
    });

    it('should update date range for quarter period', () => {
      const now = new Date('2024-01-15');
      jasmine.clock().mockDate(now);
      
      (component as any).updateDateRange('quarter');
      
      const expectedStart = new Date(now.getFullYear(), 0, 1); // Q1 starts in January
      expect(component.startDate).toBe(expectedStart.toISOString().split('T')[0]);
      expect(component.endDate).toBe(now.toISOString().split('T')[0]);
    });

    it('should update date range for year period', () => {
      const now = new Date('2024-01-15');
      jasmine.clock().mockDate(now);
      
      (component as any).updateDateRange('year');
      
      const expectedStart = new Date(now.getFullYear(), 0, 1);
      expect(component.startDate).toBe(expectedStart.toISOString().split('T')[0]);
      expect(component.endDate).toBe(now.toISOString().split('T')[0]);
    });

    it('should use default month period for unknown period', () => {
      const now = new Date('2024-01-15');
      jasmine.clock().mockDate(now);
      
      (component as any).updateDateRange('unknown');
      
      const expectedStart = new Date(now.getFullYear(), now.getMonth(), 1);
      expect(component.startDate).toBe(expectedStart.toISOString().split('T')[0]);
      expect(component.endDate).toBe(now.toISOString().split('T')[0]);
    });

    it('should handle different months for quarter calculation', () => {
      const now = new Date('2024-04-15'); // April (Q2)
      jasmine.clock().mockDate(now);
      
      (component as any).updateDateRange('quarter');
      
      const expectedStart = new Date(now.getFullYear(), 3, 1); // Q2 starts in April (month 3)
      expect(component.startDate).toBe(expectedStart.toISOString().split('T')[0]);
      expect(component.endDate).toBe(now.toISOString().split('T')[0]);
    });

    it('should handle different months for quarter calculation - Q3', () => {
      const now = new Date('2024-07-15'); // July (Q3)
      jasmine.clock().mockDate(now);
      
      (component as any).updateDateRange('quarter');
      
      const expectedStart = new Date(now.getFullYear(), 6, 1); // Q3 starts in July (month 6)
      expect(component.startDate).toBe(expectedStart.toISOString().split('T')[0]);
      expect(component.endDate).toBe(now.toISOString().split('T')[0]);
    });

    it('should handle different months for quarter calculation - Q4', () => {
      const now = new Date('2024-10-15'); // October (Q4)
      jasmine.clock().mockDate(now);
      
      (component as any).updateDateRange('quarter');
      
      const expectedStart = new Date(now.getFullYear(), 9, 1); // Q4 starts in October (month 9)
      expect(component.startDate).toBe(expectedStart.toISOString().split('T')[0]);
      expect(component.endDate).toBe(now.toISOString().split('T')[0]);
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      component.transactions = mockTransactions;
      component.categories = mockCategories;
    });

    it('should generate report with transaction data', () => {
      (component as any).generateReport();
      
      expect(component.reportData).toBeTruthy();
      expect(component.reportData?.reportType).toBe('summary');
      expect(component.reportData?.summary.transactionCount).toBe(5);
      expect(component.reportData?.categories.length).toBeGreaterThan(0);
      expect(component.reportData?.trends.length).toBeGreaterThan(0);
      expect(component.reportData?.insights.length).toBeGreaterThan(0);
    });

    it('should not generate report when no transactions', () => {
      component.transactions = [];
      
      (component as any).generateReport();
      
      expect(component.reportData).toBeNull();
    });

    it('should generate correct summary statistics', () => {
      const summary = (component as any).generateSummary();
      
      expect(summary.totalIncome).toBe(5000.00);
      expect(summary.totalExpenses).toBe(220.00);
      expect(summary.totalTransfers).toBe(1000.00);
      expect(summary.netAmount).toBe(4780.00);
      expect(summary.transactionCount).toBe(5);
    });

    it('should generate category analysis correctly', () => {
      const categoryAnalysis = (component as any).generateCategoryAnalysis();
      
      expect(categoryAnalysis.length).toBe(3);
      // Categories are sorted by amount (descending), so Food & Dining (150) comes first
      expect(categoryAnalysis[0].name).toBe('Food & Dining');
      expect(categoryAnalysis[0].amount).toBe(150.00);
      expect(categoryAnalysis[1].name).toBe('Transportation');
      expect(categoryAnalysis[1].amount).toBe(45.00);
      expect(categoryAnalysis[2].name).toBe('Entertainment');
      expect(categoryAnalysis[2].amount).toBe(25.00);
    });

    it('should generate trends correctly', () => {
      const trends = (component as any).generateTrends();
      
      expect(trends.length).toBeGreaterThan(0);
      expect(trends[0].month).toBeDefined();
      expect(trends[0].income).toBeDefined();
      expect(trends[0].expenses).toBeDefined();
      expect(trends[0].net).toBeDefined();
      expect(trends[0].change).toBeDefined();
    });

    it('should generate insights correctly', () => {
      const insights = (component as any).generateInsights();
      
      expect(insights.length).toBeGreaterThan(0);
      expect(insights.some((insight: string) => insight.includes('highest spending category'))).toBeTruthy();
    });

    it('should generate insights for negative net amount', () => {
      // Create transactions with expenses > income
      const negativeNetTransactions = [
        {
          ...mockTransactions[1], // Income: 5000
          amount: 1000.00
        },
        {
          ...mockTransactions[0], // Expense: 150
          amount: 6000.00
        }
      ];
      component.transactions = negativeNetTransactions;
      
      const insights = (component as any).generateInsights();
      
      expect(insights.some((insight: string) => insight.includes('expenses exceeded your income'))).toBeTruthy();
    });

    it('should generate insights for high expenses relative to income', () => {
      // Create transactions with expenses > 80% of income
      const highExpenseTransactions = [
        {
          ...mockTransactions[1], // Income: 5000
          amount: 5000.00
        },
        {
          ...mockTransactions[0], // Expense: 150
          amount: 4500.00
        }
      ];
      component.transactions = highExpenseTransactions;
      
      const insights = (component as any).generateInsights();
      
      expect(insights.some((insight: string) => insight.includes('expenses are high relative to income'))).toBeTruthy();
    });

    it('should group transactions by month correctly', () => {
      const monthlyData = (component as any).groupTransactionsByMonth();
      
      expect(monthlyData.length).toBeGreaterThan(0);
      expect(monthlyData[0].month).toBeDefined();
      expect(monthlyData[0].income).toBeDefined();
      expect(monthlyData[0].expenses).toBeDefined();
    });

    it('should handle transactions with different months', () => {
      const multiMonthTransactions = [
        {
          ...mockTransactions[0],
          date: new Date('2024-01-15')
        },
        {
          ...mockTransactions[1],
          date: new Date('2024-02-01')
        },
        {
          ...mockTransactions[2],
          date: new Date('2024-01-10')
        }
      ];
      component.transactions = multiMonthTransactions;
      
      const monthlyData = (component as any).groupTransactionsByMonth();
      
      expect(monthlyData.length).toBe(2); // Should have 2 months
      expect(monthlyData[0].month).toContain('Jan');
      expect(monthlyData[1].month).toContain('Feb');
    });

    it('should calculate change correctly', () => {
      const change = (component as any).calculateChange('Jan 2024', 100);
      
      expect(change).toBe(0); // Simplified implementation returns 0
    });

    it('should get category name correctly', () => {
      const categoryName = (component as any).getCategoryName('cat1');
      
      expect(categoryName).toBe('Food & Dining');
    });

    it('should return unknown category for invalid category ID', () => {
      const categoryName = (component as any).getCategoryName('invalid-id');
      
      expect(categoryName).toBe('Unknown Category');
    });

    it('should get total expenses correctly', () => {
      const totalExpenses = (component as any).getTotalExpenses();
      
      expect(totalExpenses).toBe(220.00);
    });

    it('should get top spending category correctly', () => {
      const topCategory = (component as any).getTopSpendingCategory();
      
      expect(topCategory).toBeTruthy();
      expect(topCategory?.name).toBe('Food & Dining');
      expect(topCategory?.percentage).toBeGreaterThan(0);
    });

    it('should handle empty categories array for top spending category', () => {
      component.categories = [];
      // Need to also clear transactions to avoid generating category analysis
      component.transactions = [];
      const topCategory = (component as any).getTopSpendingCategory();
      
      expect(topCategory).toBeNull();
    });

    it('should handle transactions with only income (no expenses)', () => {
      const incomeOnlyTransactions = mockTransactions.filter(t => t.type === TransactionType.INCOME);
      component.transactions = incomeOnlyTransactions;
      
      const categoryAnalysis = (component as any).generateCategoryAnalysis();
      const totalExpenses = (component as any).getTotalExpenses();
      
      expect(categoryAnalysis.length).toBe(0);
      expect(totalExpenses).toBe(0);
    });

    it('should handle transactions with only expenses (no income)', () => {
      const expenseOnlyTransactions = mockTransactions.filter(t => t.type === TransactionType.EXPENSE);
      component.transactions = expenseOnlyTransactions;
      
      const summary = (component as any).generateSummary();
      
      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(220.00);
      expect(summary.netAmount).toBe(-220.00);
    });

    it('should handle transactions with only transfers', () => {
      const transferOnlyTransactions = mockTransactions.filter(t => t.type === TransactionType.TRANSFER);
      component.transactions = transferOnlyTransactions;
      
      const summary = (component as any).generateSummary();
      
      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.totalTransfers).toBe(1000.00);
      expect(summary.netAmount).toBe(0);
    });

    it('should handle mixed transaction types correctly', () => {
      const mixedTransactions = [
        mockTransactions[0], // Expense: 150
        mockTransactions[1], // Income: 5000
        mockTransactions[4]  // Transfer: 1000
      ];
      component.transactions = mixedTransactions;
      
      const summary = (component as any).generateSummary();
      
      expect(summary.totalIncome).toBe(5000.00);
      expect(summary.totalExpenses).toBe(150.00);
      expect(summary.totalTransfers).toBe(1000.00);
      expect(summary.netAmount).toBe(4850.00);
    });
  });

  describe('User Interactions', () => {
    it('should export report in different formats', () => {
      const consoleSpy = spyOn(console, 'log');
      
      component.exportReport('pdf');
      expect(consoleSpy).toHaveBeenCalledWith('Exporting report in pdf format...');
      
      component.exportReport('csv');
      expect(consoleSpy).toHaveBeenCalledWith('Exporting report in csv format...');
      
      component.exportReport('excel');
      expect(consoleSpy).toHaveBeenCalledWith('Exporting report in excel format...');
    });

    it('should print report', () => {
      const printSpy = spyOn(window, 'print');
      
      component.printReport();
      
      expect(printSpy).toHaveBeenCalled();
    });

    it('should toggle advanced options', () => {
      expect(component.showAdvancedOptions).toBe(false);
      
      component.toggleAdvancedOptions();
      expect(component.showAdvancedOptions).toBe(true);
      
      component.toggleAdvancedOptions();
      expect(component.showAdvancedOptions).toBe(false);
    });

    it('should get current date', () => {
      const currentDate = component.getCurrentDate();
      
      expect(currentDate).toBeInstanceOf(Date);
      // Test that the date is recent (within the last minute)
      const now = new Date();
      const diffInSeconds = Math.abs(now.getTime() - currentDate.getTime()) / 1000;
      expect(diffInSeconds).toBeLessThan(60);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty transactions array', () => {
      component.transactions = [];
      component.categories = mockCategories;
      
      (component as any).generateReport();
      
      expect(component.reportData).toBeNull();
    });

    it('should handle transactions with no expenses', () => {
      const incomeOnlyTransactions = mockTransactions.filter(t => t.type === TransactionType.INCOME);
      component.transactions = incomeOnlyTransactions;
      component.categories = mockCategories;
      
      const summary = (component as any).generateSummary();
      const categoryAnalysis = (component as any).generateCategoryAnalysis();
      
      expect(summary.totalExpenses).toBe(0);
      expect(summary.netAmount).toBe(5000.00);
      expect(categoryAnalysis.length).toBe(0);
    });

    it('should handle transactions with no income', () => {
      const expenseOnlyTransactions = mockTransactions.filter(t => t.type === TransactionType.EXPENSE);
      component.transactions = expenseOnlyTransactions;
      component.categories = mockCategories;
      
      const summary = (component as any).generateSummary();
      
      expect(summary.totalIncome).toBe(0);
      expect(summary.netAmount).toBe(-220.00);
    });

    it('should handle missing category data', () => {
      component.transactions = mockTransactions;
      component.categories = [];
      
      const categoryAnalysis = (component as any).generateCategoryAnalysis();
      
      expect(categoryAnalysis.every((cat: any) => cat.name === 'Unknown Category')).toBeTruthy();
    });

    it('should handle transactions with zero amounts', () => {
      const zeroAmountTransactions = [
        {
          ...mockTransactions[0],
          amount: 0
        },
        {
          ...mockTransactions[1],
          amount: 0
        }
      ];
      component.transactions = zeroAmountTransactions;
      
      const summary = (component as any).generateSummary();
      
      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpenses).toBe(0);
      expect(summary.netAmount).toBe(0);
    });

    it('should handle transactions with negative amounts', () => {
      const negativeAmountTransactions = [
        {
          ...mockTransactions[0],
          amount: -50
        },
        {
          ...mockTransactions[1],
          amount: 1000
        }
      ];
      component.transactions = negativeAmountTransactions;
      
      const summary = (component as any).generateSummary();
      
      expect(summary.totalIncome).toBe(1000);
      expect(summary.totalExpenses).toBe(-50);
      expect(summary.netAmount).toBe(1050);
    });

    it('should handle transactions with very large amounts', () => {
      const largeAmountTransactions = [
        {
          ...mockTransactions[0],
          amount: 999999999.99
        },
        {
          ...mockTransactions[1],
          amount: 1000000000.00
        }
      ];
      component.transactions = largeAmountTransactions;
      
      const summary = (component as any).generateSummary();
      
      expect(summary.totalIncome).toBe(1000000000.00);
      expect(summary.totalExpenses).toBe(999999999.99);
      // Use toBeCloseTo for floating point precision issues
      expect(summary.netAmount).toBeCloseTo(0.01, 2);
    });

    it('should handle transactions with decimal precision', () => {
      const decimalTransactions = [
        {
          ...mockTransactions[0],
          amount: 150.75
        },
        {
          ...mockTransactions[1],
          amount: 5000.25
        }
      ];
      component.transactions = decimalTransactions;
      
      const summary = (component as any).generateSummary();
      
      expect(summary.totalIncome).toBe(5000.25);
      expect(summary.totalExpenses).toBe(150.75);
      expect(summary.netAmount).toBe(4849.50);
    });
  });

  describe('Template Integration', () => {
    it('should display periods correctly', () => {
      expect(component.periods.length).toBe(5);
      expect(component.periods[0].value).toBe('week');
      expect(component.periods[0].label).toBe('This Week');
      expect(component.periods[1].value).toBe('month');
      expect(component.periods[1].label).toBe('This Month');
      expect(component.periods[2].value).toBe('quarter');
      expect(component.periods[2].label).toBe('This Quarter');
      expect(component.periods[3].value).toBe('year');
      expect(component.periods[3].label).toBe('This Year');
      expect(component.periods[4].value).toBe('custom');
      expect(component.periods[4].label).toBe('Custom Range');
    });

    it('should display report types correctly', () => {
      expect(component.reportTypes.length).toBe(5);
      expect(component.reportTypes[0].value).toBe('summary');
      expect(component.reportTypes[0].label).toBe('Summary Report');
      expect(component.reportTypes[0].icon).toBe('fas fa-chart-pie');
      expect(component.reportTypes[1].value).toBe('detailed');
      expect(component.reportTypes[1].label).toBe('Detailed Report');
      expect(component.reportTypes[1].icon).toBe('fas fa-list-alt');
      expect(component.reportTypes[2].value).toBe('category');
      expect(component.reportTypes[2].label).toBe('Category Analysis');
      expect(component.reportTypes[2].icon).toBe('fas fa-tags');
      expect(component.reportTypes[3].value).toBe('trends');
      expect(component.reportTypes[3].label).toBe('Trend Analysis');
      expect(component.reportTypes[3].icon).toBe('fas fa-chart-line');
      expect(component.reportTypes[4].value).toBe('budget');
      expect(component.reportTypes[4].label).toBe('Budget Analysis');
      expect(component.reportTypes[4].icon).toBe('fas fa-balance-scale');
    });
  });
});
