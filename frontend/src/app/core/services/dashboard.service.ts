import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of, throwError } from 'rxjs';
import { map, switchMap, tap, shareReplay, catchError } from 'rxjs/operators';
import { FinancialService } from './financial.service';
import { CategoryService } from './category.service';
import { TransactionService } from './transaction.service';
import { 
  FinancialDashboard, 
  Category, 
  Transaction, 
  TransactionStats,
  CategoryStats 
} from '../models/financial.model';

export interface DashboardState {
  dashboard: FinancialDashboard | null;
  categories: Category[];
  recentTransactions: Transaction[];
  stats: TransactionStats | null;
  categoryStats: CategoryStats | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // Inject dependencies using @inject()
  private financialService = inject(FinancialService);
  private categoryService = inject(CategoryService);
  private transactionService = inject(TransactionService);
  
  // Reactive state management
  private dashboardStateSubject = new BehaviorSubject<DashboardState>({
    dashboard: null,
    categories: [],
    recentTransactions: [],
    stats: null,
    categoryStats: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  // Public observables
  public readonly dashboardState$ = this.dashboardStateSubject.asObservable();
  public readonly dashboard$ = this.dashboardState$.pipe(
    map(state => state.dashboard)
  );
  public readonly categories$ = this.dashboardState$.pipe(
    map(state => state.categories)
  );
  public readonly recentTransactions$ = this.dashboardState$.pipe(
    map(state => state.recentTransactions)
  );
  public readonly stats$ = this.dashboardState$.pipe(
    map(state => state.stats)
  );
  public readonly categoryStats$ = this.dashboardState$.pipe(
    map(state => state.categoryStats)
  );
  public readonly isLoading$ = this.dashboardState$.pipe(
    map(state => state.isLoading)
  );
  public readonly error$ = this.dashboardState$.pipe(
    map(state => state.error)
  );

  // Combined observables for reactive UI updates
  public readonly dashboardOverview$ = this.dashboard$.pipe(
    map(dashboard => dashboard?.overview || null)
  );

  public readonly topCategories$ = this.dashboard$.pipe(
    map(dashboard => dashboard?.topCategories || [])
  );

  public readonly spendingTrends$ = this.dashboard$.pipe(
    map(dashboard => dashboard?.spendingTrends || [])
  );

  public readonly budgetStatus$ = this.dashboard$.pipe(
    map(dashboard => dashboard?.budgetStatus || [])
  );

  public readonly pendingTransactionsCount$ = this.dashboard$.pipe(
    map(dashboard => dashboard?.overview.pendingTransactions || 0)
  );

  public readonly upcomingRecurringCount$ = this.dashboard$.pipe(
    map(dashboard => dashboard?.overview.upcomingRecurring || 0)
  );

  public readonly monthlyNet$ = this.dashboard$.pipe(
    map(dashboard => dashboard?.overview.monthlyNet || 0)
  );

  public readonly monthlyIncome$ = this.dashboard$.pipe(
    map(dashboard => dashboard?.overview.monthlyIncome || 0)
  );

  public readonly monthlyExpenses$ = this.dashboard$.pipe(
    map(dashboard => dashboard?.overview.monthlyExpenses || 0)
  );

  public readonly totalBalance$ = this.dashboard$.pipe(
    map(dashboard => dashboard?.overview.totalBalance || 0)
  );

  constructor() {
    // Subscribe to individual service states to keep dashboard state in sync
    this.setupStateSync();
  }

  /**
   * Initialize dashboard with all necessary data
   */
  initializeDashboard(options: {
    startDate?: Date;
    endDate?: Date;
    accountId?: string;
    forceRefresh?: boolean;
  } = {}): Observable<DashboardState> {
    this.updateDashboardState({
      isLoading: true,
      error: null
    });

    // Combine multiple API calls
    return combineLatest([
      this.financialService.getFinancialDashboard(options),
      this.categoryService.getUserCategories(),
      this.transactionService.getTransactionStats(options),
      this.categoryService.getCategoryStats()
    ]).pipe(
      map(([dashboard, categories, stats, categoryStats]) => {
        const dashboardState: DashboardState = {
          dashboard,
          categories,
          recentTransactions: dashboard.recentTransactions,
          stats,
          categoryStats,
          isLoading: false,
          error: null,
          lastUpdated: new Date()
        };

        this.updateDashboardState(dashboardState);
        return dashboardState;
      }),
      catchError(error => {
        const errorMessage = error.message || 'Failed to initialize dashboard';
        this.updateDashboardState({
          isLoading: false,
          error: errorMessage
        });
        return throwError(() => new Error(errorMessage));
      }),
      shareReplay(1)
    );
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(options: {
    startDate?: Date;
    endDate?: Date;
    accountId?: string;
  } = {}): Observable<DashboardState> {
    return this.initializeDashboard({ ...options, forceRefresh: true });
  }

  /**
   * Get dashboard overview data
   */
  getDashboardOverview(): Observable<FinancialDashboard['overview'] | null> {
    return this.dashboardOverview$;
  }

  /**
   * Get recent transactions
   */
  getRecentTransactions(): Observable<Transaction[]> {
    return this.recentTransactions$;
  }

  /**
   * Get top spending categories
   */
  getTopCategories(): Observable<any[]> {
    return this.topCategories$;
  }

  /**
   * Get spending trends
   */
  getSpendingTrends(): Observable<any[]> {
    return this.spendingTrends$;
  }

  /**
   * Get budget status
   */
  getBudgetStatus(): Observable<any[]> {
    return this.budgetStatus$;
  }

  /**
   * Get categories with transaction counts
   */
  getCategoriesWithTransactionCounts(): Observable<Array<Category & { transactionCount: number; totalAmount: number }>> {
    return combineLatest([
      this.categories$,
      this.stats$
    ]).pipe(
      map(([categories, stats]) => {
        if (!categories || !stats) return [];
        
        return categories.map(category => {
          const categoryStats = stats.transactionsByCategory.find(
            stat => stat.categoryId === category._id
          );
          
          return {
            ...category,
            transactionCount: categoryStats?.count || 0,
            totalAmount: categoryStats?.total || 0
          };
        }).sort((a, b) => b.totalAmount - a.totalAmount);
      })
    );
  }

  /**
   * Get income vs expenses comparison
   */
  getIncomeVsExpenses(): Observable<{ income: number; expenses: number; net: number }> {
    return this.stats$.pipe(
      map(stats => {
        if (!stats) return { income: 0, expenses: 0, net: 0 };
        
        return {
          income: stats.totalIncome,
          expenses: stats.totalExpenses,
          net: stats.totalIncome - stats.totalExpenses
        };
      })
    );
  }

  /**
   * Get monthly spending breakdown
   */
  getMonthlySpendingBreakdown(): Observable<Array<{ month: string; income: number; expenses: number; net: number }>> {
    return this.stats$.pipe(
      map(stats => {
        if (!stats?.monthlyTrends) return [];
        return stats.monthlyTrends;
      })
    );
  }

  /**
   * Get category spending breakdown
   */
  getCategorySpendingBreakdown(): Observable<Array<{ 
    categoryId: string; 
    categoryName: string; 
    amount: number; 
    percentage: number;
    color: string;
    icon: string;
  }>> {
    return this.stats$.pipe(
      map(stats => {
        if (!stats?.transactionsByCategory) return [];
        return stats.transactionsByCategory.map(item => ({
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          amount: item.total, // Map 'total' to 'amount'
          percentage: item.percentage,
          color: item.color,
          icon: item.icon
        }));
      })
    );
  }

  /**
   * Get transactions by category
   */
  getTransactionsByCategory(categoryId: string): Observable<Transaction[]> {
    return this.recentTransactions$.pipe(
      map(transactions => 
        transactions.filter(t => t.categoryId === categoryId)
      )
    );
  }

  /**
   * Get transactions by type
   */
  getTransactionsByType(type: 'income' | 'expense' | 'transfer'): Observable<Transaction[]> {
    return this.recentTransactions$.pipe(
      map(transactions => 
        transactions.filter(t => t.type === type)
      )
    );
  }

  /**
   * Get dashboard summary
   */
  getDashboardSummary(): Observable<{
    totalTransactions: number;
    totalCategories: number;
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    pendingTransactions: number;
    upcomingRecurring: number;
  }> {
    return combineLatest([
      this.stats$,
      this.categories$,
      this.dashboard$
    ]).pipe(
      map(([stats, categories, dashboard]) => {
        return {
          totalTransactions: stats?.totalTransactions || 0,
          totalCategories: categories?.length || 0,
          totalIncome: stats?.totalIncome || 0,
          totalExpenses: stats?.totalExpenses || 0,
          netAmount: (stats?.totalIncome || 0) - (stats?.totalExpenses || 0),
          pendingTransactions: dashboard?.overview.pendingTransactions || 0,
          upcomingRecurring: dashboard?.overview.upcomingRecurring || 0
        };
      })
    );
  }

  /**
   * Clear dashboard state
   */
  clearDashboardState(): void {
    this.updateDashboardState({
      dashboard: null,
      categories: [],
      recentTransactions: [],
      stats: null,
      categoryStats: null,
      isLoading: false,
      error: null,
      lastUpdated: null
    });
  }

  /**
   * Get current dashboard state
   */
  getCurrentDashboardState(): DashboardState {
    return this.dashboardStateSubject.value;
  }

  /**
   * Private methods
   */
  private setupStateSync(): void {
    // Subscribe to individual service states to keep dashboard state in sync
    this.financialService.dashboardState$.subscribe(state => {
      if (state.dashboard) {
        this.updateDashboardState({
          dashboard: state.dashboard,
          recentTransactions: state.dashboard.recentTransactions,
          lastUpdated: new Date()
        });
      }
    });

    this.categoryService.categoryState$.subscribe(state => {
      this.updateDashboardState({
        categories: state.categories,
        lastUpdated: new Date()
      });
    });

    this.transactionService.transactionState$.subscribe(state => {
      this.updateDashboardState({
        stats: state.stats,
        lastUpdated: new Date()
      });
    });
  }

  private updateDashboardState(partialState: Partial<DashboardState>): void {
    const currentState = this.dashboardStateSubject.value;
    this.dashboardStateSubject.next({ ...currentState, ...partialState });
  }
}