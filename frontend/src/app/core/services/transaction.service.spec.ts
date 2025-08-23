import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import { Transaction, TransactionType, TransactionStatus, TransactionStats, PaginatedResponse, ApiResponse } from '../models/financial.model';
import { environment } from '../../../environments/environment';

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
});
