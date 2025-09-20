import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { TransactionListComponent } from './transaction-list';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { Transaction, TransactionType, TransactionStatus, PaymentMethod } from '../../../../core/models/financial.model';
import { createWindowSpyWithCleanup } from '../../../../test-utils/test-cleanup';

// Helper function to create mock transactions
function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    _id: '1',
    title: 'Test Transaction',
    amount: 100,
    type: 'expense' as TransactionType,
    status: 'completed' as TransactionStatus,
    categoryId: 'cat1',
    date: new Date(),
    paymentMethod: 'card' as PaymentMethod,
    tags: [],
    isRecurring: false,
    userId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date(),
    currency: 'USD',
    timezone: 'UTC',
    recurrencePattern: 'none' as any,
    attachments: [],
    notes: '',
    location: undefined,
    merchantName: '',
    source: 'manual',
    accountId: 'account1',
    isDeleted: false,
    ...overrides
  };
}

describe('TransactionListComponent', () => {
  let component: TransactionListComponent;
  let fixture: ComponentFixture<TransactionListComponent>;
  let transactionService: jasmine.SpyObj<TransactionService>;
  let categoryService: jasmine.SpyObj<CategoryService>;

  const mockTransaction: Transaction = {
    _id: '1',
    title: 'Test Transaction',
    description: 'Test Description',
    amount: 100,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    status: TransactionStatus.COMPLETED,
    categoryId: 'cat1',
    tags: [],
    date: new Date(),
    timezone: 'UTC',
    paymentMethod: PaymentMethod.CASH,
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

  const mockCategory = {
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

  beforeEach(async () => {
    const transactionServiceSpy = jasmine.createSpyObj('TransactionService', [
      'getUserTransactions', 'deleteTransaction'
    ]);
    const categoryServiceSpy = jasmine.createSpyObj('CategoryService', [
      'getUserCategories'
    ]);

    // Setup default return values
    transactionServiceSpy.getUserTransactions.and.returnValue(of({
      data: [mockTransaction],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1
      }
    }));
    transactionServiceSpy.deleteTransaction.and.returnValue(of(true));
    categoryServiceSpy.getUserCategories.and.returnValue(of([mockCategory]));

    await TestBed.configureTestingModule({
      imports: [
        TransactionListComponent,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: CategoryService, useValue: categoryServiceSpy }
      ]
    })
    .compileComponents();

    transactionService = TestBed.inject(TransactionService) as jasmine.SpyObj<TransactionService>;
    categoryService = TestBed.inject(CategoryService) as jasmine.SpyObj<CategoryService>;

    fixture = TestBed.createComponent(TransactionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Global cleanup is handled in test.ts

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Error handling tests
  it('should handle category loading error', () => {
    categoryService.getUserCategories.and.returnValue(throwError(() => new Error('API Error')));

    component['loadCategories']();

    expect(component.isCategoriesLoading).toBe(false);
  });

  it('should handle transaction loading error', () => {
    transactionService.getUserTransactions.and.returnValue(throwError(() => new Error('API Error')));

    component['loadTransactions']();

    expect(component.error).toBe('Failed to load transactions');
    expect(component.isTransactionsLoading).toBe(false);
  });

  it('should handle transaction deletion error', () => {
    createWindowSpyWithCleanup('confirm').and.returnValue(true);
    transactionService.deleteTransaction.and.returnValue(throwError(() => new Error('API Error')));

    component.deleteTransaction('1');

    expect(component.error).toBe('Failed to delete transaction');
    expect(component.isDeleting).toBe(false);
  });

  // Advanced filter tests
  it('should apply advanced filters with empty filter groups', () => {
    const mockTransaction = createMockTransaction();
    component.transactions = [mockTransaction];

    component['applyAdvancedFilters']([]);

    expect(component.filteredTransactions).toEqual(component.transactions);
  });

  it('should evaluate transaction against query with $and conditions', () => {
    const transaction = createMockTransaction();

    const query = {
      $and: [
        { amount: { $gte: 50 } },
        { type: { $eq: 'expense' } }
      ]
    };

    const result = component['evaluateTransactionAgainstQuery'](transaction, query);
    expect(result).toBe(true);
  });

  it('should evaluate transaction against query with $or conditions', () => {
    const transaction = createMockTransaction();

    const query = {
      $or: [
        { amount: { $lt: 50 } },
        { type: { $eq: 'expense' } }
      ]
    };

    const result = component['evaluateTransactionAgainstQuery'](transaction, query);
    expect(result).toBe(true);
  });

  it('should evaluate transaction against query with empty query', () => {
    const transaction = createMockTransaction();

    const result = component['evaluateTransactionAgainstQuery'](transaction, {});
    expect(result).toBe(true);
  });

  it('should evaluate field condition with direct equality', () => {
    const transaction = createMockTransaction();

    const result = component['evaluateFieldCondition'](transaction, 'type', 'expense');
    expect(result).toBe(true);
  });

  it('should evaluate field condition with object condition', () => {
    const transaction = createMockTransaction();

    const result = component['evaluateFieldCondition'](transaction, 'amount', { $gte: 50 });
    expect(result).toBe(true);
  });

  // Operator evaluation tests
  it('should evaluate $eq operator', () => {
    const result = component['evaluateOperator'](100, '$eq', 100);
    expect(result).toBe(true);
  });

  it('should evaluate $ne operator', () => {
    const result = component['evaluateOperator'](100, '$ne', 50);
    expect(result).toBe(true);
  });

  it('should evaluate $gt operator', () => {
    const result = component['evaluateOperator'](100, '$gt', 50);
    expect(result).toBe(true);
  });

  it('should evaluate $gte operator', () => {
    const result = component['evaluateOperator'](100, '$gte', 100);
    expect(result).toBe(true);
  });

  it('should evaluate $lt operator', () => {
    const result = component['evaluateOperator'](50, '$lt', 100);
    expect(result).toBe(true);
  });

  it('should evaluate $lte operator', () => {
    const result = component['evaluateOperator'](100, '$lte', 100);
    expect(result).toBe(true);
  });

  it('should evaluate $in operator', () => {
    const result = component['evaluateOperator']('expense', '$in', ['expense', 'income']);
    expect(result).toBe(true);
  });

  it('should evaluate $nin operator', () => {
    const result = component['evaluateOperator']('expense', '$nin', ['income', 'transfer']);
    expect(result).toBe(true);
  });

  it('should evaluate $regex operator', () => {
    const result = component['evaluateOperator']('Test Transaction', '$regex', 'Test');
    expect(result).toBe(true);
  });

  it('should evaluate $not operator', () => {
    const result = component['evaluateOperator']('Test Transaction', '$not', 'Other');
    expect(result).toBe(true);
  });

  it('should return true for unknown operator', () => {
    const result = component['evaluateOperator'](100, '$unknown', 50);
    expect(result).toBe(true);
  });

  // Field value getter tests
  it('should get transaction field value for different fields', () => {
    const transaction = createMockTransaction({
      tags: ['test'],
      isRecurring: true
    });

    expect(component['getTransactionFieldValue'](transaction, 'title')).toBe('Test Transaction');
    expect(component['getTransactionFieldValue'](transaction, 'amount')).toBe(100);
    expect(component['getTransactionFieldValue'](transaction, 'type')).toBe('expense');
    expect(component['getTransactionFieldValue'](transaction, 'status')).toBe('completed');
    expect(component['getTransactionFieldValue'](transaction, 'categoryId')).toBe('cat1');
    expect(component['getTransactionFieldValue'](transaction, 'date')).toBe(transaction.date);
    expect(component['getTransactionFieldValue'](transaction, 'paymentMethod')).toBe('card');
    expect(component['getTransactionFieldValue'](transaction, 'tags')).toEqual(['test']);
    expect(component['getTransactionFieldValue'](transaction, 'isRecurring')).toBe(true);
    expect(component['getTransactionFieldValue'](transaction, 'unknown')).toBe(undefined);
  });

  // Pagination tests
  it('should handle pagination when current page becomes empty', () => {
    createWindowSpyWithCleanup('confirm').and.returnValue(true);
    component.transactions = [createMockTransaction({ title: 'Test' })];
    component.currentPage = 2;

    component.deleteTransaction('1');

    expect(component.currentPage).toBe(1);
  });

  it('should not change page when current page is first page', () => {
    createWindowSpyWithCleanup('confirm').and.returnValue(true);
    component.transactions = [createMockTransaction({ title: 'Test' })];
    component.currentPage = 1;

    component.deleteTransaction('1');

    expect(component.currentPage).toBe(1);
  });

  // UI interaction tests
  it('should handle search', () => {
    spyOn(component as any, 'loadTransactions');
    component.onSearch();
    expect(component.isFiltering).toBe(true);
    expect(component.currentPage).toBe(1);
  });

  it('should handle filter change', () => {
    spyOn(component, 'onSearch');
    component.onFilterChange();
    expect(component.onSearch).toHaveBeenCalled();
  });

  it('should handle sort change', () => {
    spyOn(component as any, 'loadTransactions');
    component.onSortChange();
    expect((component as any).loadTransactions).toHaveBeenCalled();
  });

  it('should handle page change', () => {
    spyOn(component as any, 'loadTransactions');
    component.onPageChange(2);
    expect(component.currentPage).toBe(2);
    expect((component as any).loadTransactions).toHaveBeenCalled();
  });

  it('should handle page size change', () => {
    spyOn(component as any, 'loadTransactions');
    component.onPageSizeChange(50);
    expect(component.pageSize).toBe(50);
    expect(component.currentPage).toBe(1);
    expect((component as any).loadTransactions).toHaveBeenCalled();
  });

  it('should handle export transactions', () => {
    spyOn(console, 'log');
    component.exportTransactions();
    expect(component.isExporting).toBe(true);
  });

  it('should clear filters', () => {
    spyOn(component, 'onSearch');
    component.searchTerm = 'test';
    component.selectedType = 'expense' as TransactionType;
    component.selectedStatus = 'completed' as TransactionStatus;
    component.selectedCategory = 'cat1';
    component.dateRange = { start: '2024-01-01', end: '2024-12-31' };
    component.currentPage = 2;

    component.clearFilters();

    expect(component.searchTerm).toBe('');
    expect(component.selectedType).toBe('');
    expect(component.selectedStatus).toBe('');
    expect(component.selectedCategory).toBe('');
    expect(component.dateRange).toEqual({ start: '', end: '' });
    expect(component.currentPage).toBe(1);
    expect(component.onSearch).toHaveBeenCalled();
  });

  // Helper method tests
  it('should get category name', () => {
    component.categories = [
      { _id: 'cat1', name: 'Food', color: '#ff0000' },
      { _id: 'cat2', name: 'Transport', color: '#00ff00' }
    ];

    expect(component.getCategoryName('cat1')).toBe('Food');
    expect(component.getCategoryName('unknown')).toBe('Unknown');
  });

  it('should get category color', () => {
    component.categories = [
      { _id: 'cat1', name: 'Food', color: '#ff0000' },
      { _id: 'cat2', name: 'Transport', color: '#00ff00' }
    ];

    expect(component.getCategoryColor('cat1')).toBe('#ff0000');
    expect(component.getCategoryColor('unknown')).toBe('#667eea');
  });

  it('should format currency', () => {
    expect(component.formatCurrency(100)).toBe('$100.00');
    expect(component.formatCurrency(100, 'EUR')).toBe('€100.00');
  });

  it('should format date', () => {
    const date = new Date('2024-01-15');
    const formatted = component.formatDate(date);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });

  it('should get transaction type icon', () => {
    expect(component.getTransactionTypeIcon('income' as any)).toBe('💰');
    expect(component.getTransactionTypeIcon('expense' as any)).toBe('💸');
    expect(component.getTransactionTypeIcon('transfer' as any)).toBe('🔄');
    expect(component.getTransactionTypeIcon('adjustment' as any)).toBe('⚖️');
    expect(component.getTransactionTypeIcon('unknown' as any)).toBe('');
  });

  it('should get transaction status class', () => {
    expect(component.getTransactionStatusClass('completed' as any)).toBe('status-completed');
    expect(component.getTransactionStatusClass('pending' as any)).toBe('status-pending');
    expect(component.getTransactionStatusClass('failed' as any)).toBe('status-failed');
    expect(component.getTransactionStatusClass('cancelled' as any)).toBe('status-cancelled');
    expect(component.getTransactionStatusClass('unknown' as any)).toBe('status-unknown');
  });

  // Computed property tests
  it('should return loading state', () => {
    component.isTransactionsLoading = true;
    component.isCategoriesLoading = false;
    expect(component.isLoading).toBe(true);

    component.isTransactionsLoading = false;
    component.isCategoriesLoading = true;
    expect(component.isLoading).toBe(true);

    component.isTransactionsLoading = false;
    component.isCategoriesLoading = false;
    expect(component.isLoading).toBe(false);
  });

  it('should return any action loading state', () => {
    component.isFiltering = true;
    component.isDeleting = false;
    component.isExporting = false;
    expect(component.isAnyActionLoading).toBe(true);

    component.isFiltering = false;
    component.isDeleting = true;
    component.isExporting = false;
    expect(component.isAnyActionLoading).toBe(true);

    component.isFiltering = false;
    component.isDeleting = false;
    component.isExporting = true;
    expect(component.isAnyActionLoading).toBe(true);

    component.isFiltering = false;
    component.isDeleting = false;
    component.isExporting = false;
    expect(component.isAnyActionLoading).toBe(false);
  });

  it('should return has transactions', () => {
    component.transactions = [];
    expect(component.hasTransactions).toBe(false);

    component.transactions = [createMockTransaction({ title: 'Test' })];
    expect(component.hasTransactions).toBe(true);
  });

  // Category filter options update test
  it('should update category filter options', () => {
    const categories = [
      { _id: 'cat1', name: 'Food', color: '#ff0000' },
      { _id: 'cat2', name: 'Transport', color: '#00ff00' }
    ];

    component['updateCategoryFilterOptions'](categories);

    const categoryField = component.filterFields.find(field => field.key === 'categoryId');
    expect(categoryField?.options).toEqual([
      { value: 'cat1', label: 'Food' },
      { value: 'cat2', label: 'Transport' }
    ]);
  });

  it('should initialize with default values', () => {
    expect(component.currentPage).toBe(1);
    expect(component.pageSize).toBe(20);
    expect(component.searchTerm).toBe('');
    expect(component.selectedType).toBe('');
    expect(component.selectedStatus).toBe('');
    expect(component.selectedCategory).toBe('');
    expect(component.sortBy).toBe('date');
    expect(component.sortOrder).toBe('desc');
  });

  it('should load categories and transactions on init', () => {
    expect(categoryService.getUserCategories).toHaveBeenCalled();
    expect(transactionService.getUserTransactions).toHaveBeenCalled();
  });

  it('should have transaction types and statuses', () => {
    expect(component.transactionTypes).toEqual(Object.values(TransactionType));
    expect(component.transactionStatuses).toEqual(Object.values(TransactionStatus));
    expect(component.paymentMethods).toEqual(Object.values(PaymentMethod));
  });

  it('should handle search', () => {
    component.searchTerm = 'test';
    component.onSearch();
    
    expect(component.currentPage).toBe(1);
    expect(transactionService.getUserTransactions).toHaveBeenCalled();
  });

  it('should handle filter changes', () => {
    component.selectedType = TransactionType.EXPENSE;
    component.onFilterChange();
    
    expect(component.currentPage).toBe(1);
    expect(transactionService.getUserTransactions).toHaveBeenCalled();
  });

  it('should handle sorting', () => {
    // Test same column sort order change
    component.onSort('date');
    expect(component.sortOrder).toBe('asc');
    
    component.onSort('date');
    expect(component.sortOrder).toBe('desc');
    
    // Test different column
    component.onSort('amount');
    expect(component.sortBy).toBe('amount');
    expect(component.sortOrder).toBe('asc');
  });

  it('should handle page changes', () => {
    component.onPageChange(2);
    expect(component.currentPage).toBe(2);
    expect(transactionService.getUserTransactions).toHaveBeenCalled();
  });

  it('should handle transaction deletion', () => {
    createWindowSpyWithCleanup('confirm').and.returnValue(true);
    component.onTransactionDelete('1');
    
    expect(transactionService.deleteTransaction).toHaveBeenCalledWith('1');
  });

  it('should not delete transaction when user cancels', () => {
    createWindowSpyWithCleanup('confirm').and.returnValue(false);
    component.onTransactionDelete('1');
    
    expect(transactionService.deleteTransaction).not.toHaveBeenCalled();
  });

  it('should calculate pagination correctly', () => {
    component.currentPage = 2;
    component.pageSize = 20;
    component.totalItems = 50;
    
    expect(component.getPaginationStart()).toBe(21);
    expect(component.getPaginationEnd()).toBe(40);
  });

  it('should get correct transaction type icon', () => {
    expect(component.getTransactionTypeIcon(TransactionType.INCOME)).toBe('💰');
    expect(component.getTransactionTypeIcon(TransactionType.EXPENSE)).toBe('💸');
    expect(component.getTransactionTypeIcon(TransactionType.TRANSFER)).toBe('🔄');
    expect(component.getTransactionTypeIcon(TransactionType.ADJUSTMENT)).toBe('⚖️');
  });

  it('should get correct status badge class', () => {
    expect(component.getStatusBadgeClass(TransactionStatus.COMPLETED)).toBe('badge-success');
    expect(component.getStatusBadgeClass(TransactionStatus.PENDING)).toBe('badge-warning');
    expect(component.getStatusBadgeClass(TransactionStatus.CANCELLED)).toBe('badge-danger');
    expect(component.getStatusBadgeClass(TransactionStatus.FAILED)).toBe('badge-danger');
  });

  it('should format amount correctly', () => {
    const formatted = component.formatAmount(1234.56, 'USD');
    expect(formatted).toContain('$1,234.56');
  });

  it('should format date correctly', () => {
    const testDate = new Date('2024-01-15');
    const formatted = component.formatDate(testDate);
    expect(formatted).toContain('Jan 15, 2024');
  });

  it('should get category name correctly', () => {
    const categoryName = component.getCategoryName('cat1');
    expect(categoryName).toBe('Test Category');
  });

  it('should return unknown for non-existent category', () => {
    const categoryName = component.getCategoryName('non-existent');
    expect(categoryName).toBe('Unknown');
  });

  it('should clear filters correctly', () => {
    component.searchTerm = 'test';
    component.selectedType = TransactionType.EXPENSE;
    component.selectedStatus = TransactionStatus.COMPLETED;
    component.selectedCategory = 'cat1';
    component.dateRange = { start: '2024-01-01', end: '2024-12-31' };
    component.currentPage = 3;
    
    component.clearFilters();
    
    expect(component.searchTerm).toBe('');
    expect(component.selectedType).toBe('');
    expect(component.selectedStatus).toBe('');
    expect(component.selectedCategory).toBe('');
    expect(component.dateRange).toEqual({ start: '', end: '' });
    expect(component.currentPage).toBe(1);
    expect(transactionService.getUserTransactions).toHaveBeenCalled();
  });

  describe('error handling', () => {
    it('should handle transaction loading error', (done) => {
      transactionService.getUserTransactions.and.returnValue(throwError(() => new Error('API Error')));
      
      // Test through public method that calls loadTransactions
      component.onSearch();
      
      // Wait for the setTimeout delay in onSearch()
      setTimeout(() => {
        expect(component.error).toBe('Failed to load transactions');
        expect(component.isTransactionsLoading).toBe(false);
        done();
      }, 350);
    });

    it('should handle category loading error', () => {
      categoryService.getUserCategories.and.returnValue(throwError(() => new Error('API Error')));
      
      // Test through ngOnInit which calls loadCategories
      component.ngOnInit();
      
      expect(component.isCategoriesLoading).toBe(false);
    });

    it('should handle transaction deletion error', () => {
      createWindowSpyWithCleanup('confirm').and.returnValue(true);
      transactionService.deleteTransaction.and.returnValue(throwError(() => new Error('API Error')));
      
      component.onTransactionDelete('1');
      
      expect(component.error).toBe('Failed to delete transaction');
      expect(component.isDeleting).toBe(false);
    });
  });

  describe('pagination', () => {
    it('should calculate page numbers correctly for small number of pages', () => {
      component.totalPages = 3;
      component.currentPage = 1;
      
      const pages = component.getPageNumbers();
      expect(pages).toEqual([1, 2, 3]);
    });

    it('should calculate page numbers correctly for large number of pages', () => {
      component.totalPages = 10;
      component.currentPage = 5;
      
      const pages = component.getPageNumbers();
      expect(pages).toEqual([3, 4, 5, 6, 7]);
    });

    it('should handle page size changes', () => {
      component.onPageSizeChange(50);
      
      expect(component.pageSize).toBe(50);
      expect(component.currentPage).toBe(1);
      expect(transactionService.getUserTransactions).toHaveBeenCalled();
    });

    it('should handle pagination when current page becomes empty', () => {
      component.transactions = [mockTransaction];
      component.currentPage = 2;
      component.pageSize = 20;
      component.totalItems = 1;
      component.totalPages = 1;
      
      createWindowSpyWithCleanup('confirm').and.returnValue(true);
      component.onTransactionDelete('1');
      
      expect(component.currentPage).toBe(1);
    });
  });

  describe('computed properties', () => {
    it('should return correct loading state', () => {
      component.isTransactionsLoading = true;
      component.isCategoriesLoading = false;
      expect(component.isLoading).toBe(true);
      
      component.isTransactionsLoading = false;
      component.isCategoriesLoading = true;
      expect(component.isLoading).toBe(true);
      
      component.isTransactionsLoading = false;
      component.isCategoriesLoading = false;
      expect(component.isLoading).toBe(false);
    });

    it('should return correct action loading state', () => {
      component.isFiltering = true;
      expect(component.isAnyActionLoading).toBe(true);
      
      component.isFiltering = false;
      component.isDeleting = true;
      expect(component.isAnyActionLoading).toBe(true);
      
      component.isDeleting = false;
      component.isExporting = true;
      expect(component.isAnyActionLoading).toBe(true);
      
      component.isExporting = false;
      expect(component.isAnyActionLoading).toBe(false);
    });

    it('should return correct hasTransactions state', () => {
      component.transactions = [];
      expect(component.hasTransactions).toBe(false);
      
      component.transactions = [mockTransaction];
      expect(component.hasTransactions).toBe(true);
    });

    it('should return correct hasCategories state', () => {
      component.categories = [];
      expect(component.hasCategories).toBe(false);
      
      component.categories = [mockCategory];
      expect(component.hasCategories).toBe(true);
    });

    it('should return correct showPagination state', () => {
      component.totalPages = 1;
      expect(component.showPagination).toBe(false);
      
      component.totalPages = 2;
      expect(component.showPagination).toBe(true);
    });
  });

  describe('formatting methods', () => {
    it('should format currency correctly', () => {
      const formatted = component.formatCurrency(1234.56, 'USD');
      expect(formatted).toContain('$1,234.56');
    });

    it('should format currency with different currency', () => {
      const formatted = component.formatCurrency(1234.56, 'EUR');
      expect(formatted).toContain('€1,234.56');
    });

    it('should get correct amount class', () => {
      expect(component.getAmountClass(TransactionType.EXPENSE)).toBe('negative');
      expect(component.getAmountClass(TransactionType.INCOME)).toBe('positive');
      expect(component.getAmountClass(TransactionType.TRANSFER)).toBe('neutral');
      expect(component.getAmountClass(TransactionType.ADJUSTMENT)).toBe('neutral');
    });

    it('should get correct status class', () => {
      expect(component.getTransactionStatusClass(TransactionStatus.COMPLETED)).toBe('status-completed');
      expect(component.getTransactionStatusClass(TransactionStatus.PENDING)).toBe('status-pending');
      expect(component.getTransactionStatusClass(TransactionStatus.FAILED)).toBe('status-failed');
      expect(component.getTransactionStatusClass(TransactionStatus.CANCELLED)).toBe('status-cancelled');
    });

    it('should get category color correctly', () => {
      const color = component.getCategoryColor('cat1');
      expect(color).toBe('#FF0000');
    });

    it('should return default color for non-existent category', () => {
      const color = component.getCategoryColor('non-existent');
      expect(color).toBe('#667eea');
    });
  });

  describe('export functionality', () => {
    it('should handle export transactions', (done) => {
      component.exportTransactions();
      
      expect(component.isExporting).toBe(true);
      
      setTimeout(() => {
        expect(component.isExporting).toBe(false);
        done();
      }, 2100);
    });
  });

  describe('transaction loading with pagination', () => {
    it('should handle response without pagination', () => {
      transactionService.getUserTransactions.and.returnValue(of({
        data: [mockTransaction],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1
        }
      }));
      
      // Test through public method that calls loadTransactions
      component.onSearch();
      
      expect(component.totalItems).toBe(1);
      expect(component.totalPages).toBe(1);
    });

    it('should handle response with pagination', (done) => {
      transactionService.getUserTransactions.and.returnValue(of({
        data: [mockTransaction],
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          totalPages: 3
        }
      }));
      
      // Test through public method that calls loadTransactions
      component.onSearch();
      
      // Wait for the setTimeout delay in onSearch()
      setTimeout(() => {
        expect(component.totalItems).toBe(50);
        expect(component.totalPages).toBe(3);
        done();
      }, 350);
    });
  });

  describe('sorting functionality', () => {
    it('should handle sort change', () => {
      component.onSortChange();
      expect(transactionService.getUserTransactions).toHaveBeenCalled();
    });

    it('should toggle sort order for same field', () => {
      component.sortBy = 'amount';
      component.sortOrder = 'asc';
      
      component.onSort('amount');
      expect(component.sortOrder).toBe('desc');
      
      component.onSort('amount');
      expect(component.sortOrder).toBe('asc');
    });

    it('should set new field and reset to asc', () => {
      component.sortBy = 'date';
      component.sortOrder = 'desc';
      
      component.onSort('amount');
      expect(component.sortBy).toBe('amount');
      expect(component.sortOrder).toBe('asc');
    });
  });

  describe('duplicate methods', () => {
    it('should have both getPageNumbers and pageNumbers getter', () => {
      component.totalPages = 5;
      component.currentPage = 3;
      
      const methodResult = component.getPageNumbers();
      const getterResult = component.pageNumbers;
      
      expect(methodResult).toEqual(getterResult);
    });

    it('should have both formatAmount and formatCurrency methods', () => {
      const amount = 1234.56;
      const currency = 'USD';
      
      const formatAmountResult = component.formatAmount(amount, currency);
      const formatCurrencyResult = component.formatCurrency(amount, currency);
      
      expect(formatAmountResult).toEqual(formatCurrencyResult);
    });

    it('should have both deleteTransaction and onTransactionDelete methods', () => {
      createWindowSpyWithCleanup('confirm').and.returnValue(true);
      
      component.deleteTransaction('1');
      expect(transactionService.deleteTransaction).toHaveBeenCalledWith('1');
      
      transactionService.deleteTransaction.calls.reset();
      
      component.onTransactionDelete('1');
      expect(transactionService.deleteTransaction).toHaveBeenCalledWith('1');
    });
  });
});
