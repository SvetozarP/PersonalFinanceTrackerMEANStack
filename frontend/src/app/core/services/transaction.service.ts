import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { 
  Transaction, 
  TransactionStats, 
  ApiResponse, 
  PaginatedResponse, 
  QueryOptions,
  TransactionType,
  TransactionStatus 
} from '../models/financial.model';

export interface TransactionState {
  transactions: Transaction[];
  stats: TransactionStats | null;
  recurringTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly baseUrl = `${environment.apiUrl}/transactions`;
  
  // Inject dependencies using @inject()
  private http = inject(HttpClient);
  
  // Reactive state management
  private transactionStateSubject = new BehaviorSubject<TransactionState>({
    transactions: [],
    stats: null,
    recurringTransactions: [],
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  // Public observables
  public readonly transactionState$ = this.transactionStateSubject.asObservable();
  public readonly transactions$ = this.transactionState$.pipe(
    map(state => state.transactions)
  );
  public readonly stats$ = this.transactionState$.pipe(
    map(state => state.stats)
  );
  public readonly recurringTransactions$ = this.transactionState$.pipe(
    map(state => state.recurringTransactions)
  );
  public readonly isLoading$ = this.transactionState$.pipe(
    map(state => state.isLoading)
  );
  public readonly error$ = this.transactionState$.pipe(
    map(state => state.error)
  );

  // Cache
  private _transactionsCache: Transaction[] = [];
  private _statsCache: TransactionStats | null = null;
  private _recurringCache: Transaction[] = [];
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  // Getters with safety checks
  private get transactionsCache(): Transaction[] {
    if (!this._transactionsCache) {
      this._transactionsCache = [];
    }
    return this._transactionsCache;
  }

  private get statsCache(): TransactionStats | null {
    return this._statsCache;
  }

  private get recurringCache(): Transaction[] {
    if (!this._recurringCache) {
      this._recurringCache = [];
    }
    return this._recurringCache;
  }

  // Setters
  private set transactionsCache(value: Transaction[]) {
    this._transactionsCache = value;
  }

  private set statsCache(value: TransactionStats | null) {
    this._statsCache = value;
  }

  private set recurringCache(value: Transaction[]) {
    this._recurringCache = value;
  }

  /**
   * Ensure cache is initialized
   */
  private ensureCacheInitialized(): void {
    if (!this._transactionsCache) {
      this._transactionsCache = [];
    }
    if (!this._statsCache) {
      this._statsCache = null;
    }
    if (!this._recurringCache) {
      this._recurringCache = [];
    }
  }

  /**
   * Get user transactions with filtering and pagination
   */
  getUserTransactions(options: QueryOptions & {
    type?: TransactionType;
    status?: TransactionStatus;
    categoryId?: string;
    subcategoryId?: string;
    paymentMethod?: string;
    isRecurring?: boolean;
    source?: string;
    startDate?: Date;
    endDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    tags?: string[];
  } = {}): Observable<PaginatedResponse<Transaction>> {
    // Ensure cache is initialized
    this.ensureCacheInitialized();
    
    // Check cache first for basic queries
    if (this.transactionsCache && this.transactionsCache.length > 0 && this.isCacheValid() && this.isBasicQuery(options)) {
      this.updateTransactionState({
        transactions: this.transactionsCache,
        isLoading: false,
        error: null,
        lastUpdated: new Date()
      });
      return of({
        data: this.transactionsCache || [],
        pagination: {
          page: 1,
          limit: (this.transactionsCache || []).length,
          total: (this.transactionsCache || []).length,
          totalPages: 1
        }
      });
    }

    // Set loading state
          this.updateTransactionState({
        transactions: this.transactionsCache || [],
        isLoading: true,
        error: null,
        lastUpdated: this.transactionStateSubject.value.lastUpdated
      });

    // Build query parameters
    let params = new HttpParams();
    if (options.page) params = params.set('page', options.page.toString());
    if (options.limit) params = params.set('limit', options.limit.toString());
    if (options.sortBy) params = params.set('sortBy', options.sortBy);
    if (options.sortOrder) params = params.set('sortOrder', options.sortOrder);
    if (options.search) params = params.set('search', options.search);
    if (options.type) params = params.set('type', options.type);
    if (options.status) params = params.set('status', options.status);
    if (options.categoryId) params = params.set('categoryId', options.categoryId);
    if (options.subcategoryId) params = params.set('subcategoryId', options.subcategoryId);
    if (options.paymentMethod) params = params.set('paymentMethod', options.paymentMethod);
    if (options.isRecurring !== undefined) params = params.set('isRecurring', options.isRecurring.toString());
    if (options.source) params = params.set('source', options.source);
    if (options.startDate) params = params.set('startDate', options.startDate.toISOString());
    if (options.endDate) params = params.set('endDate', options.endDate.toISOString());
    if (options.minAmount) params = params.set('minAmount', options.minAmount.toString());
    if (options.maxAmount) params = params.set('maxAmount', options.maxAmount.toString());
    if (options.tags && options.tags.length > 0) {
      options.tags.forEach(tag => params = params.append('tags', tag));
    }

    return this.http.get<ApiResponse<PaginatedResponse<Transaction>>>(this.baseUrl, { params })
      .pipe(
        map(response => response.data),
        tap(result => {
          // Update cache for basic queries
          if (this.isBasicQuery(options)) {
            this.transactionsCache = result.data;
          }
          this.updateTransactionState({
            transactions: result.data,
            isLoading: false,
            error: null,
            lastUpdated: new Date()
          });
        }),
        catchError(error => {
          const errorMessage = this.handleError(error);
                  this.updateTransactionState({
          transactions: this.transactionsCache || [],
          isLoading: false,
          error: errorMessage,
          lastUpdated: this.transactionStateSubject.value.lastUpdated
        });
          return throwError(() => new Error(errorMessage));
        }),
        shareReplay(1)
      );
  }

  /**
   * Get transaction statistics
   */
  getTransactionStats(options: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
    type?: TransactionType;
  } = {}): Observable<TransactionStats> {
    // Ensure cache is initialized
    this.ensureCacheInitialized();
    
    // Check cache first
    if (this.statsCache && this.isCacheValid()) {
      this.updateTransactionState({
        stats: this.statsCache,
        lastUpdated: new Date()
      });
      return of(this.statsCache);
    }

    let params = new HttpParams();
    if (options.startDate) params = params.set('startDate', options.startDate.toISOString());
    if (options.endDate) params = params.set('endDate', options.endDate.toISOString());
    if (options.categoryId) params = params.set('categoryId', options.categoryId);
    if (options.type) params = params.set('type', options.type);

    return this.http.get<ApiResponse<TransactionStats>>(`${this.baseUrl}/stats`, { params })
      .pipe(
        map(response => response.data),
        tap(stats => {
          this.statsCache = stats;
          this.updateTransactionState({
            stats,
            lastUpdated: new Date()
          });
        }),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Get recurring transactions
   */
  getRecurringTransactions(): Observable<Transaction[]> {
    // Ensure cache is initialized
    this.ensureCacheInitialized();
    
    // Check cache first
    if (this.recurringCache && this.recurringCache.length > 0 && this.isCacheValid()) {
      this.updateTransactionState({
        recurringTransactions: this.recurringCache,
        lastUpdated: new Date()
      });
      return of(this.recurringCache);
    }

    return this.http.get<ApiResponse<Transaction[]>>(`${this.baseUrl}/recurring`)
      .pipe(
        map(response => response.data),
        tap(transactions => {
          this.recurringCache = transactions;
          this.updateTransactionState({
            recurringTransactions: transactions,
            lastUpdated: new Date()
          });
        }),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Get transaction by ID
   */
  getTransactionById(id: string): Observable<Transaction> {
    return this.http.get<ApiResponse<Transaction>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(response => response.data),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Create new transaction
   */
  createTransaction(transactionData: Partial<Transaction>): Observable<Transaction> {
    return this.http.post<ApiResponse<Transaction>>(this.baseUrl, transactionData)
      .pipe(
        map(response => response.data),
        tap(transaction => {
          // Ensure cache is initialized
          this.ensureCacheInitialized();
          
          // Add to cache
          this.transactionsCache = [transaction, ...this.transactionsCache];
          this.updateTransactionState({
            transactions: this.transactionsCache,
            lastUpdated: new Date()
          });
          // Clear stats cache as it needs to be recalculated
          this.statsCache = null;
        }),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Update transaction
   */
  updateTransaction(id: string, transactionData: Partial<Transaction>): Observable<Transaction> {
    return this.http.put<ApiResponse<Transaction>>(`${this.baseUrl}/${id}`, transactionData)
      .pipe(
        map(response => response.data),
        tap(updatedTransaction => {
          // Ensure cache is initialized
          this.ensureCacheInitialized();
          
          // Update cache
          this.transactionsCache = this.transactionsCache.map(t => 
            t._id === id ? updatedTransaction : t
          );
          this.updateTransactionState({
            transactions: this.transactionsCache,
            lastUpdated: new Date()
          });
          // Clear stats cache as it needs to be recalculated
          this.statsCache = null;
        }),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Delete transaction
   */
  deleteTransaction(id: string): Observable<boolean> {
    return this.http.delete<ApiResponse<boolean>>(`${this.baseUrl}/${id}`)
      .pipe(
        map(response => response.data),
        tap(() => {
          // Ensure cache is initialized
          this.ensureCacheInitialized();
          
          // Remove from cache
          this.transactionsCache = this.transactionsCache.filter(t => t._id !== id);
          this.updateTransactionState({
            transactions: this.transactionsCache,
            lastUpdated: new Date()
          });
          // Clear stats cache as it needs to be recalculated
          this.statsCache = null;
        }),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Bulk create transactions
   */
  bulkCreateTransactions(transactions: Partial<Transaction>[]): Observable<Transaction[]> {
    return this.http.post<ApiResponse<Transaction[]>>(`${this.baseUrl}/bulk`, { transactions })
      .pipe(
        map(response => response.data),
        tap(newTransactions => {
          // Ensure cache is initialized
          this.ensureCacheInitialized();
          
          // Add to cache
          this.transactionsCache = [...newTransactions, ...this.transactionsCache];
          this.updateTransactionState({
            transactions: this.transactionsCache,
            lastUpdated: new Date()
          });
          // Clear stats cache as it needs to be recalculated
          this.statsCache = null;
        }),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Get transactions by type
   */
  getTransactionsByType(type: TransactionType): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(transactions => transactions.filter(t => t.type === type))
    );
  }

  /**
   * Get transactions by category
   */
  getTransactionsByCategory(categoryId: string): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(transactions => transactions.filter(t => t.categoryId === categoryId))
    );
  }

  /**
   * Get transactions by date range
   */
  getTransactionsByDateRange(startDate: Date, endDate: Date): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(transactions => 
        transactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        })
      )
    );
  }

  /**
   * Search transactions
   */
  searchTransactions(searchTerm: string): Observable<Transaction[]> {
    return this.transactions$.pipe(
      map(transactions => 
        transactions.filter(t => 
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      )
    );
  }

  /**
   * Refresh all transaction data
   */
  refreshTransactions(): Observable<PaginatedResponse<Transaction>> {
    this.clearCache();
    return this.getUserTransactions();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this._transactionsCache = [];
    this._statsCache = null;
    this._recurringCache = [];
    this.updateTransactionState({
      transactions: [],
      stats: null,
      recurringTransactions: [],
      isLoading: false,
      error: null,
      lastUpdated: null
    });
  }

  /**
   * Force reinitialize cache
   */
  reinitializeCache(): void {
    this.ensureCacheInitialized();
  }

  /**
   * Get current transaction state
   */
  getCurrentTransactionState(): TransactionState {
    return this.transactionStateSubject.value;
  }

  /**
   * Private methods
   */
  private updateTransactionState(partialState: Partial<TransactionState>): void {
    const currentState = this.transactionStateSubject.value;
    if (!currentState) {
      // Initialize with default state if undefined
      const defaultState: TransactionState = {
        transactions: [],
        stats: null,
        recurringTransactions: [],
        isLoading: false,
        error: null,
        lastUpdated: null
      };
      this.transactionStateSubject.next({ ...defaultState, ...partialState });
    } else {
      this.transactionStateSubject.next({ ...currentState, ...partialState });
    }
  }

  private isCacheValid(): boolean {
    if (!this.transactionStateSubject.value.lastUpdated) return false;
    const now = new Date().getTime();
    const lastUpdated = this.transactionStateSubject.value.lastUpdated.getTime();
    return (now - lastUpdated) < this.cacheExpiry;
  }

  private isBasicQuery(options: any): boolean {
    // Consider a query basic if it only has pagination/sorting options
    const basicKeys = ['page', 'limit', 'sortBy', 'sortOrder', 'search'];
    const optionKeys = Object.keys(options);
    return optionKeys.every(key => basicKeys.includes(key));
  }

  private handleError(error: any): string {
    if (error.error instanceof ErrorEvent) {
      return error.error.message;
    } else {
      return error.error?.message || error.message || 'An error occurred';
    }
  }
}