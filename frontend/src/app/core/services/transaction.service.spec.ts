import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import { Transaction, TransactionType, TransactionStatus, TransactionStats, PaginatedResponse, ApiResponse } from '../models/financial.model';
import { environment } from '../../../environments/environment';
import { of, throwError } from 'rxjs';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;

  const mockTransaction: Transaction = {
    _id: '1',
    title: 'Test Transaction',
    description: 'Test Description',
    amount: 100,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    status: TransactionStatus.COMPLETED,
    categoryId: 'cat1',
    tags: ['test', 'expense'],
    date: new Date('2024-01-01'),
    timezone: 'UTC',
    paymentMethod: 'cash' as any,
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

  const mockTransactionStats: TransactionStats = {
    totalTransactions: 100,
    totalIncome: 5000,
    totalExpenses: 3000,
    totalTransfers: 0,
    transactionsByType: {
      income: { count: 20, total: 5000 },
      expense: { count: 80, total: 3000 }
    },
    transactionsByCategory: [],
    monthlyTrends: []
  };

  const mockPaginatedResponse: PaginatedResponse<Transaction> = {
    data: [mockTransaction],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TransactionService]
    });
    service = TestBed.inject(TransactionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    if (httpMock) {
      httpMock.verify();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUserTransactions', () => {
    it('should get user transactions with basic options', () => {
      const options = { page: 1, limit: 10, sortBy: 'date', sortOrder: 'desc' as const };

      service.getUserTransactions(options).subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/transactions` &&
        request.params.get('page') === '1' &&
        request.params.get('limit') === '10' &&
        request.params.get('sortBy') === 'date' &&
        request.params.get('sortOrder') === 'desc'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockPaginatedResponse });
    });

    it('should get user transactions with advanced filtering', () => {
      const options = {
        type: TransactionType.EXPENSE,
        status: TransactionStatus.COMPLETED,
        categoryId: 'cat1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        minAmount: 50,
        maxAmount: 200,
        tags: ['test', 'expense']
      };

      service.getUserTransactions(options).subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/transactions` &&
        request.params.get('type') === TransactionType.EXPENSE &&
        request.params.get('status') === TransactionStatus.COMPLETED &&
        request.params.get('categoryId') === 'cat1' &&
        request.params.get('startDate') === options.startDate.toISOString() &&
        request.params.get('endDate') === options.endDate.toISOString() &&
        request.params.get('minAmount') === '50' &&
        request.params.get('maxAmount') === '200' &&
        (request.params.getAll('tags')?.includes('test') ?? false) &&
        (request.params.getAll('tags')?.includes('expense') ?? false)
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockPaginatedResponse });
    });

    it('should handle errors', () => {
      service.getUserTransactions().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getTransactionStats', () => {
    it('should get transaction statistics', () => {
      const options = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        categoryId: 'cat1',
        type: TransactionType.EXPENSE
      };

      service.getTransactionStats(options).subscribe(stats => {
        expect(stats).toEqual(mockTransactionStats);
      });

      const req = httpMock.expectOne(request => 
        request.url === `${environment.apiUrl}/transactions/stats` &&
        request.params.get('startDate') === options.startDate.toISOString() &&
        request.params.get('endDate') === options.endDate.toISOString() &&
        request.params.get('categoryId') === options.categoryId &&
        request.params.get('type') === options.type
      );
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockTransactionStats });
    });

    it('should handle errors', () => {
      service.getTransactionStats().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/stats`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getRecurringTransactions', () => {
    it('should get recurring transactions', () => {
      service.getRecurringTransactions().subscribe(transactions => {
        expect(transactions).toEqual([mockTransaction]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/recurring`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: [mockTransaction] });
    });
  });

  describe('getTransactionById', () => {
    it('should get transaction by ID', () => {
      const id = '1';

      service.getTransactionById(id).subscribe(transaction => {
        expect(transaction).toEqual(mockTransaction);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/${id}`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockTransaction });
    });
  });

  describe('createTransaction', () => {
    it('should create new transaction', () => {
      const transactionData = {
        title: 'New Transaction',
        amount: 150,
        type: TransactionType.EXPENSE,
        categoryId: 'cat1'
      };

      service.createTransaction(transactionData).subscribe(transaction => {
        expect(transaction).toEqual(mockTransaction);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(transactionData);
      req.flush({ success: true, data: mockTransaction });
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction', () => {
      const id = '1';
      const updateData = { title: 'Updated Transaction' };

      service.updateTransaction(id, updateData).subscribe(transaction => {
        expect(transaction).toEqual(mockTransaction);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/${id}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateData);
      req.flush({ success: true, data: mockTransaction });
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction', () => {
      const id = '1';

      service.deleteTransaction(id).subscribe(result => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/${id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true, data: true });
    });
  });

  describe('bulkCreateTransactions', () => {
    it('should bulk create transactions', () => {
      const transactions = [
        { title: 'Transaction 1', amount: 100, type: TransactionType.EXPENSE, categoryId: 'cat1' },
        { title: 'Transaction 2', amount: 200, type: TransactionType.INCOME, categoryId: 'cat2' }
      ];

      service.bulkCreateTransactions(transactions).subscribe(result => {
        expect(result).toEqual([mockTransaction]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions/bulk`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ transactions });
      req.flush({ success: true, data: [mockTransaction] });
    });
  });

  describe('Filtered Queries', () => {
    beforeEach(() => {
      // Set up some transactions in the service state for filtering tests
      service['transactionStateSubject'].next({
        transactions: [mockTransaction],
        stats: null,
        recurringTransactions: [],
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
    });

    it('should get transactions by type', () => {
      service.getTransactionsByType(TransactionType.EXPENSE).subscribe(transactions => {
        expect(transactions).toEqual([mockTransaction]);
      });
    });

    it('should get transactions by category', () => {
      service.getTransactionsByCategory('cat1').subscribe(transactions => {
        expect(transactions).toEqual([mockTransaction]);
      });
    });

    it('should get transactions by date range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      service.getTransactionsByDateRange(startDate, endDate).subscribe(transactions => {
        expect(transactions).toEqual([mockTransaction]);
      });
    });

    it('should search transactions', () => {
      service.searchTransactions('Test').subscribe(transactions => {
        expect(transactions).toEqual([mockTransaction]);
      });
    });
  });

  describe('refreshTransactions', () => {
    it('should refresh all transaction data', () => {
      service.refreshTransactions().subscribe(response => {
        expect(response).toEqual(mockPaginatedResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockPaginatedResponse });
    });
  });

  describe('State Management', () => {
    it('should provide transaction state observable', () => {
      service.transactionState$.subscribe(state => {
        expect(state).toBeDefined();
        expect(state.transactions).toEqual([]);
        expect(state.isLoading).toBe(false);
        expect(state.error).toBeNull();
      });
    });

    it('should provide transactions observable', () => {
      service.transactions$.subscribe(transactions => {
        expect(transactions).toEqual([]);
      });
    });

    it('should provide stats observable', () => {
      service.stats$.subscribe(stats => {
        expect(stats).toBeNull();
      });
    });

    it('should provide loading state observable', () => {
      service.isLoading$.subscribe(isLoading => {
        expect(typeof isLoading).toBe('boolean');
      });
    });

    it('should provide error state observable', () => {
      service.error$.subscribe(error => {
        expect(error).toBeDefined();
      });
    });

    it('should get current transaction state', () => {
      const state = service.getCurrentTransactionState();
      expect(state).toBeDefined();
      expect(state.transactions).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should clear cache', () => {
      service.clearCache();
      const state = service.getCurrentTransactionState();
      expect(state.transactions).toEqual([]);
      expect(state.stats).toBeNull();
      expect(state.recurringTransactions).toEqual([]);
      expect(state.lastUpdated).toBeNull();
    });
  });

  describe('Enhanced Branch Coverage Tests', () => {
    describe('Cache Management', () => {
      it('should handle cache initialization when caches are null', () => {
        // Force caches to be null
        service['_transactionsCache'] = null as any;
        service['_statsCache'] = null as any;
        service['_recurringCache'] = null as any;

        // Call ensureCacheInitialized
        service['ensureCacheInitialized']();

        expect(service['_transactionsCache']).toEqual([]);
        expect(service['_statsCache']).toBeNull();
        expect(service['_recurringCache']).toEqual([]);
      });

      it('should handle cache getters when caches are null', () => {
        // Force caches to be null
        service['_transactionsCache'] = null as any;
        service['_recurringCache'] = null as any;

        // Access getters
        const transactionsCache = service['transactionsCache'];
        const recurringCache = service['recurringCache'];

        expect(transactionsCache).toEqual([]);
        expect(recurringCache).toEqual([]);
      });

      it('should return cached data when cache is valid', () => {
        const mockCachedTransactions = [mockTransaction];
        const mockCachedStats = mockTransactionStats;
        const mockCachedRecurring = [mockTransaction];

        // Set up cache
        service['_transactionsCache'] = mockCachedTransactions;
        service['_statsCache'] = mockCachedStats;
        service['_recurringCache'] = mockCachedRecurring;

        // Mock isCacheValid to return true
        spyOn(service as any, 'isCacheValid').and.returnValue(true);

        // Test getUserTransactions with basic query
        service.getUserTransactions({ page: 1, limit: 10 }).subscribe(response => {
          expect(response.data).toEqual(mockCachedTransactions);
        });

        // Test getTransactionStats
        service.getTransactionStats().subscribe(stats => {
          expect(stats).toEqual(mockCachedStats);
        });

        // Test getRecurringTransactions
        service.getRecurringTransactions().subscribe(transactions => {
          expect(transactions).toEqual(mockCachedRecurring);
        });
      });

      it('should handle cache invalidation', () => {
        // Set up cache with old timestamp
        service['_transactionsCache'] = [mockTransaction];
        service['transactionStateSubject'].next({
          transactions: [],
          stats: null,
          recurringTransactions: [],
          isLoading: false,
          error: null,
          lastUpdated: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
        });

        // Mock isCacheValid to return false
        spyOn(service as any, 'isCacheValid').and.returnValue(false);

        service.getUserTransactions().subscribe(response => {
          expect(response).toEqual(mockPaginatedResponse);
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
        expect(req.request.method).toBe('GET');
        req.flush({ success: true, data: mockPaginatedResponse });
      });
    });

    describe('Parameter Handling', () => {
      it('should handle all optional parameters in getUserTransactions', () => {
        const options = {
          page: 1,
          limit: 10,
          sortBy: 'amount',
          sortOrder: 'asc' as const,
          search: 'test search',
          type: TransactionType.INCOME,
          status: TransactionStatus.PENDING,
          categoryId: 'cat1',
          subcategoryId: 'subcat1',
          paymentMethod: 'credit_card',
          isRecurring: true,
          source: 'import',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          minAmount: 100,
          maxAmount: 1000,
          tags: ['tag1', 'tag2']
        };

        service.getUserTransactions(options).subscribe(response => {
          expect(response).toEqual(mockPaginatedResponse);
        });

        const req = httpMock.expectOne(request => {
          const tags = request.params.getAll('tags');
          return request.url === `${environment.apiUrl}/transactions` &&
            request.params.get('page') === '1' &&
            request.params.get('limit') === '10' &&
            request.params.get('sortBy') === 'amount' &&
            request.params.get('sortOrder') === 'asc' &&
            request.params.get('search') === 'test search' &&
            request.params.get('type') === TransactionType.INCOME &&
            request.params.get('status') === TransactionStatus.PENDING &&
            request.params.get('categoryId') === 'cat1' &&
            request.params.get('subcategoryId') === 'subcat1' &&
            request.params.get('paymentMethod') === 'credit_card' &&
            request.params.get('isRecurring') === 'true' &&
            request.params.get('source') === 'import' &&
            request.params.get('startDate') === options.startDate.toISOString() &&
            request.params.get('endDate') === options.endDate.toISOString() &&
            request.params.get('minAmount') === '100' &&
            request.params.get('maxAmount') === '1000' &&
            (tags?.includes('tag1') ?? false) &&
            (tags?.includes('tag2') ?? false);
        });
        expect(req.request.method).toBe('GET');

        req.flush({ success: true, data: mockPaginatedResponse });
      });

      it('should handle isRecurring as false', () => {
        const options = { isRecurring: false };

        service.getUserTransactions(options).subscribe(response => {
          expect(response).toEqual(mockPaginatedResponse);
        });

        const req = httpMock.expectOne(request => 
          request.url === `${environment.apiUrl}/transactions` &&
          request.params.get('isRecurring') === 'false'
        );
        expect(req.request.method).toBe('GET');

        req.flush({ success: true, data: mockPaginatedResponse });
      });

      it('should handle empty tags array', () => {
        const options = { tags: [] };

        service.getUserTransactions(options).subscribe(response => {
          expect(response).toEqual(mockPaginatedResponse);
        });

        const req = httpMock.expectOne(request => 
          request.url === `${environment.apiUrl}/transactions` &&
          !request.params.has('tags')
        );
        expect(req.request.method).toBe('GET');

        req.flush({ success: true, data: mockPaginatedResponse });
      });
    });

    describe('Error Handling', () => {
      it('should handle client-side errors', () => {
        const errorEvent = new ErrorEvent('Network error', {
          message: 'Client-side error message'
        });
        const httpError = { error: errorEvent };

        const result = service['handleError'](httpError);
        expect(result).toBe('Client-side error message');
      });

      it('should handle server-side errors with message', () => {
        const httpError = {
          error: { message: 'Server error message' },
          message: 'HTTP error'
        };

        const result = service['handleError'](httpError);
        expect(result).toBe('Server error message');
      });

      it('should handle server-side errors without message', () => {
        const httpError = {
          error: null,
          message: 'HTTP error message'
        };

        const result = service['handleError'](httpError);
        expect(result).toBe('HTTP error message');
      });

      it('should handle server-side errors with no message at all', () => {
        const httpError = {
          error: null,
          message: null
        };

        const result = service['handleError'](httpError);
        expect(result).toBe('An error occurred');
      });

      it('should handle server-side errors with undefined error', () => {
        const httpError = {
          error: undefined,
          message: undefined
        };

        const result = service['handleError'](httpError);
        expect(result).toBe('An error occurred');
      });
    });

    describe('Search Functionality', () => {
      beforeEach(() => {
        const transactionWithDescription = {
          ...mockTransaction,
          _id: '2',
          title: 'Transaction 2',
          description: 'Unique description search'
        };
        const transactionWithTags = {
          ...mockTransaction,
          _id: '3',
          title: 'Transaction 3',
          tags: ['unique-tag', 'other']
        };

        const transactionWithUniqueTitle = {
          ...mockTransaction,
          _id: '1',
          title: 'Unique Title Search'
        };

        service['transactionStateSubject'].next({
          transactions: [transactionWithUniqueTitle, transactionWithDescription, transactionWithTags],
          stats: null,
          recurringTransactions: [],
          isLoading: false,
          error: null,
          lastUpdated: new Date()
        });
      });

      it('should search by title', () => {
        service.searchTransactions('Unique Title Search').subscribe(transactions => {
          expect(transactions.length).toBe(1);
          expect(transactions[0]._id).toBe('1');
        });
      });

      it('should search by description', () => {
        service.searchTransactions('Unique description search').subscribe(transactions => {
          expect(transactions.length).toBe(1);
          expect(transactions[0]._id).toBe('2');
        });
      });

      it('should search by tags', () => {
        service.searchTransactions('unique-tag').subscribe(transactions => {
          expect(transactions.length).toBe(1);
          expect(transactions[0]._id).toBe('3');
        });
      });

      it('should handle case-insensitive search', () => {
        service.searchTransactions('test').subscribe(transactions => {
          expect(transactions.length).toBe(3); // All transactions match
        });
      });

      it('should handle transactions without description', () => {
        const transactionWithoutDescription = {
          ...mockTransaction,
          _id: '4',
          description: undefined
        };

        service['transactionStateSubject'].next({
          transactions: [transactionWithoutDescription],
          stats: null,
          recurringTransactions: [],
          isLoading: false,
          error: null,
          lastUpdated: new Date()
        });

        service.searchTransactions('Test').subscribe(transactions => {
          expect(transactions.length).toBe(1);
        });
      });
    });

    describe('State Management Edge Cases', () => {
      it('should handle null current state in updateTransactionState', () => {
        // Force current state to be null
        service['transactionStateSubject'].next(null as any);

        service['updateTransactionState']({
          transactions: [mockTransaction],
          isLoading: true
        });

        const state = service.getCurrentTransactionState();
        expect(state.transactions).toEqual([mockTransaction]);
        expect(state.isLoading).toBe(true);
        expect(state.stats).toBeNull();
        expect(state.recurringTransactions).toEqual([]);
        expect(state.error).toBeNull();
        expect(state.lastUpdated).toBeNull();
      });

      it('should handle cache validity check with null lastUpdated', () => {
        service['transactionStateSubject'].next({
          transactions: [],
          stats: null,
          recurringTransactions: [],
          isLoading: false,
          error: null,
          lastUpdated: null
        });

        const isValid = service['isCacheValid']();
        expect(isValid).toBe(false);
      });

      it('should handle cache validity check with expired cache', () => {
        service['transactionStateSubject'].next({
          transactions: [],
          stats: null,
          recurringTransactions: [],
          isLoading: false,
          error: null,
          lastUpdated: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
        });

        const isValid = service['isCacheValid']();
        expect(isValid).toBe(false);
      });

      it('should handle cache validity check with valid cache', () => {
        service['transactionStateSubject'].next({
          transactions: [],
          stats: null,
          recurringTransactions: [],
          isLoading: false,
          error: null,
          lastUpdated: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
        });

        const isValid = service['isCacheValid']();
        expect(isValid).toBe(true);
      });
    });

    describe('Basic Query Detection', () => {
      it('should identify basic queries correctly', () => {
        const basicQuery = { page: 1, limit: 10, sortBy: 'date', sortOrder: 'desc' };
        const advancedQuery = { page: 1, limit: 10, type: TransactionType.EXPENSE };

        expect(service['isBasicQuery'](basicQuery)).toBe(true);
        expect(service['isBasicQuery'](advancedQuery)).toBe(false);
      });

      it('should handle empty query options', () => {
        expect(service['isBasicQuery']({})).toBe(true);
      });
    });

    describe('Cache Operations', () => {
      it('should reinitialize cache', () => {
        // Force caches to be null
        service['_transactionsCache'] = null as any;
        service['_statsCache'] = null as any;
        service['_recurringCache'] = null as any;

        service.reinitializeCache();

        expect(service['_transactionsCache']).toEqual([]);
        expect(service['_statsCache']).toBeNull();
        expect(service['_recurringCache']).toEqual([]);
      });
    });

    describe('Error Scenarios in CRUD Operations', () => {
      it('should handle errors in getTransactionById', () => {
        service.getTransactionById('1').subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/transactions/1`);
        req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      });

      it('should handle errors in createTransaction', () => {
        service.createTransaction({ title: 'Test' }).subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/transactions`);
        req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      });

      it('should handle errors in updateTransaction', () => {
        service.updateTransaction('1', { title: 'Updated' }).subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/transactions/1`);
        req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      });

      it('should handle errors in deleteTransaction', () => {
        service.deleteTransaction('1').subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/transactions/1`);
        req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      });

      it('should handle errors in bulkCreateTransactions', () => {
        service.bulkCreateTransactions([{ title: 'Test' }]).subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/transactions/bulk`);
        req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      });

      it('should handle errors in getRecurringTransactions', () => {
        service.getRecurringTransactions().subscribe({
          next: () => fail('should have failed'),
          error: (error) => {
            expect(error).toBeDefined();
          }
        });

        const req = httpMock.expectOne(`${environment.apiUrl}/transactions/recurring`);
        req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      });
    });

    describe('Observable Streams', () => {
      it('should provide recurring transactions observable', () => {
        service['transactionStateSubject'].next({
          transactions: [],
          stats: null,
          recurringTransactions: [mockTransaction],
          isLoading: false,
          error: null,
          lastUpdated: new Date()
        });

        service.recurringTransactions$.subscribe(transactions => {
          expect(transactions).toEqual([mockTransaction]);
        });
      });
    });
  });
});
