import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, of, throwError } from 'rxjs';
import { takeUntil, switchMap, catchError, map } from 'rxjs/operators';
import { Budget, CategoryAllocation, Transaction, TransactionType } from '../models/financial.model';
import { BudgetService } from './budget.service';
import { TransactionService } from './transaction.service';
import { CategoryService } from './category.service';

export interface RealtimeBudgetProgress {
  budgetId: string;
  budgetName: string;
  totalAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  status: 'under' | 'at' | 'over' | 'critical';
  daysRemaining: number;
  currency: string; // Add currency field
  categoryProgress: CategoryProgress[];
  lastUpdated: Date;
  alerts: BudgetAlert[];
}

export interface CategoryProgress {
  categoryId: string;
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  status: 'under' | 'at' | 'over' | 'critical';
  trend: 'increasing' | 'decreasing' | 'stable';
  dailyAverage: number;
  projectedOverspend: boolean;
}

export interface BudgetAlert {
  id: string;
  type: 'warning' | 'critical' | 'info' | 'success';
  message: string;
  categoryId?: string;
  categoryName?: string;
  threshold?: number;
  currentValue?: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface RealtimeBudgetStats {
  totalBudgets: number;
  activeBudgets: number;
  onTrackBudgets: number;
  overBudgetBudgets: number;
  criticalBudgets: number;
  totalSpent: number;
  totalBudget: number;
  overallProgress: number;
  averageProgress: number;
  lastUpdated: Date;
  // Currency-separated statistics
  currencyStats: Map<string, {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    overallProgress: number;
    budgetCount: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeBudgetProgressService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private updateInterval$ = interval(60000); // Update every 60 seconds to reduce load
  private realtimeProgress$ = new BehaviorSubject<RealtimeBudgetProgress[]>([]);
  private budgetStats$ = new BehaviorSubject<RealtimeBudgetStats | null>(null);
  private alerts$ = new BehaviorSubject<BudgetAlert[]>([]);
  private isConnected$ = new BehaviorSubject<boolean>(false);
  
  // Real-time update settings
  private readonly UPDATE_INTERVAL = 60000; // 60 seconds
  private readonly CRITICAL_THRESHOLD = 90; // 90% threshold for critical alerts
  private readonly WARNING_THRESHOLD = 75; // 75% threshold for warning alerts
  
  // Flag to prevent auto-initialization during tests
  private static isTestEnvironment = false;

  constructor(
    private budgetService: BudgetService,
    private transactionService: TransactionService,
    private categoryService: CategoryService
  ) {
    // Only auto-initialize if not in test environment
    if (!RealtimeBudgetProgressService.isTestEnvironment) {
      this.initializeRealtimeUpdates();
    }
    
  }

  // Method to set test environment flag
  static setTestEnvironment(isTest: boolean): void {
    RealtimeBudgetProgressService.isTestEnvironment = isTest;
  }

  // Method to manually refresh budget progress (useful after creating new transactions)
  refreshBudgetProgress(): void {
    this.loadRealtimeData().subscribe({
      next: (progress) => {
      },
      error: (error) => {
        console.error('Error refreshing budget progress:', error);
      }
    });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Public observables
  getRealtimeProgress(): Observable<RealtimeBudgetProgress[]> {
    return this.realtimeProgress$.asObservable();
  }

  getBudgetStats(): Observable<RealtimeBudgetStats | null> {
    return this.budgetStats$.asObservable();
  }

  getAlerts(): Observable<BudgetAlert[]> {
    return this.alerts$.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.isConnected$.asObservable();
  }

  // Get currency-separated statistics
  getCurrencyStats(): Observable<Map<string, {
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    overallProgress: number;
    budgetCount: number;
  }> | null> {
    return this.budgetStats$.pipe(
      map(stats => stats?.currencyStats || null)
    );
  }

  // Initialize real-time updates
  private initializeRealtimeUpdates(): void {
    // Subscribe to budget changes for immediate updates
    this.budgetService.budgets$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((budgets) => this.loadRealtimeDataFromBudgets(budgets)),
        catchError(error => {
          console.error('Error in real-time budget updates:', error);
          this.isConnected$.next(false);
          return [];
        })
      )
      .subscribe();

    // Periodic updates every 60 seconds
    this.updateInterval$
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => this.loadRealtimeData()),
        catchError(error => {
          console.error('Error in periodic budget updates:', error);
          this.isConnected$.next(false);
          return [];
        })
      )
      .subscribe();
    
    // Initial load
    this.loadRealtimeData().subscribe();
  }

  // Load real-time data from existing budgets
  private loadRealtimeDataFromBudgets(budgets: Budget[]): Observable<RealtimeBudgetProgress[]> {
    if (budgets.length === 0) {
      this.realtimeProgress$.next([]);
      this.budgetStats$.next(null);
      return of([]);
    }

    return this.transactionService.getUserTransactions({}).pipe(
      switchMap(transactionResponse => 
        this.categoryService.getUserCategories().pipe(
          switchMap(categories => {
            const transactions = transactionResponse.data || [];
            const progressData = this.calculateRealtimeProgress(budgets, transactions, categories || []);
            this.realtimeProgress$.next(progressData);
            this.updateBudgetStats(progressData);
            this.checkForAlerts(progressData);
            this.isConnected$.next(true);
            return of(progressData);
          })
        )
      ),
      catchError(error => {
        console.error('Error loading real-time data from budgets:', error);
        this.isConnected$.next(false);
        return throwError(() => error);
      })
    );
  }

  // Load real-time data
  private loadRealtimeData(): Observable<RealtimeBudgetProgress[]> {
    return this.budgetService.getBudgets({}, 1, 1000).pipe(
      switchMap(budgetResponse => {
        const budgets = budgetResponse.budgets;
        return this.loadRealtimeDataFromBudgets(budgets);
      }),
      catchError(error => {
        console.error('Error loading real-time data:', error);
        this.isConnected$.next(false);
        return throwError(() => error);
      })
    );
  }

  // Calculate real-time progress for all budgets
  private calculateRealtimeProgress(
    budgets: Budget[], 
    transactions: Transaction[], 
    categories: any[]
  ): RealtimeBudgetProgress[] {
    // Add null checks for input parameters
    if (!budgets || !Array.isArray(budgets)) {
      console.warn('Budgets array is undefined or not an array:', budgets);
      return [];
    }
    
    if (!transactions || !Array.isArray(transactions)) {
      console.warn('Transactions array is undefined or not an array:', transactions);
      return [];
    }
    
    if (!categories || !Array.isArray(categories)) {
      console.warn('Categories array is undefined or not an array:', categories);
      return [];
    }
    
    return budgets
      .filter(budget => budget && budget.isActive)
      .map(budget => {
        const categoryProgress = this.calculateCategoryProgress(
          budget, 
          transactions, 
          categories
        );

        const totalSpent = categoryProgress.reduce((sum, cat) => sum + cat.spentAmount, 0);
        const totalAllocated = budget.totalAmount;
        const remainingAmount = totalAllocated - totalSpent;
        const progressPercentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
        
        const status = this.determineBudgetStatus(progressPercentage, budget.alertThreshold);
        const daysRemaining = this.calculateDaysRemaining(
          typeof budget.endDate === 'string' ? new Date(budget.endDate) : budget.endDate
        );

        return {
          budgetId: budget._id,
          budgetName: budget.name,
          totalAmount: totalAllocated,
          spentAmount: totalSpent,
          remainingAmount,
          progressPercentage,
          status,
          daysRemaining,
          currency: budget.currency, // Add currency from budget
          categoryProgress,
          lastUpdated: new Date(),
          alerts: []
        };
      });
  }

  // Calculate progress for each category in a budget
  private calculateCategoryProgress(
    budget: Budget, 
    transactions: Transaction[], 
    categories: any[]
  ): CategoryProgress[] {
    // Add null check for budget object
    if (!budget) {
      console.warn('Budget object is undefined or null:', budget);
      return [];
    }
    
    // Add null check for categoryAllocations
    if (!budget.categoryAllocations || !Array.isArray(budget.categoryAllocations)) {
      console.warn('Budget categoryAllocations is undefined or not an array:', budget);
      return [];
    }
    
    
    return budget.categoryAllocations.map(allocation => {
      // Debug: Check all transactions for this category and currency
      const allCategoryTransactions = transactions.filter(t => {
        const transactionCategoryId = typeof t.categoryId === 'string' ? t.categoryId : (t.categoryId as any)?._id || t.categoryId;
        const budgetCategoryId = typeof allocation.categoryId === 'string' ? allocation.categoryId : (allocation.categoryId as any)?._id || allocation.categoryId;
        const matchesCategory = transactionCategoryId === budgetCategoryId;
        const matchesCurrency = t.currency === budget.currency;
        return matchesCategory && matchesCurrency;
      });
      
      const categoryTransactions = transactions.filter(t => {
        // Extract actual ID strings for comparison
        const transactionCategoryId = typeof t.categoryId === 'string' ? t.categoryId : (t.categoryId as any)?._id || t.categoryId;
        const budgetCategoryId = typeof allocation.categoryId === 'string' ? allocation.categoryId : (allocation.categoryId as any)?._id || allocation.categoryId;
        
        const matchesCategory = transactionCategoryId === budgetCategoryId;
        const isExpense = t.type === TransactionType.EXPENSE;
        const inPeriod = this.isTransactionInBudgetPeriod(t, budget);
        const matchesCurrency = t.currency === budget.currency;
        
        
        return matchesCategory && matchesCurrency && isExpense && inPeriod;
      });

      const spentAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remainingAmount = allocation.allocatedAmount - spentAmount;
      const progressPercentage = allocation.allocatedAmount > 0 ? 
        (spentAmount / allocation.allocatedAmount) * 100 : 0;

      const status = this.determineCategoryStatus(progressPercentage, allocation.allocatedAmount, spentAmount);
      const trend = this.calculateSpendingTrend(categoryTransactions);
      const dailyAverage = this.calculateDailyAverage(categoryTransactions, budget);
      const projectedOverspend = this.calculateProjectedOverspend(
        spentAmount, 
        dailyAverage, 
        allocation.allocatedAmount, 
        typeof budget.endDate === 'string' ? new Date(budget.endDate) : budget.endDate
      );

      const category = categories.find(c => c._id === allocation.categoryId);

      return {
        categoryId: allocation.categoryId,
        categoryName: category?.name || 'Unknown Category',
        allocatedAmount: allocation.allocatedAmount,
        spentAmount,
        remainingAmount,
        progressPercentage,
        status,
        trend,
        dailyAverage,
        projectedOverspend
      };
    });
  }

  // Determine budget status based on progress and thresholds
  private determineBudgetStatus(progressPercentage: number, alertThreshold: number): 'under' | 'at' | 'over' | 'critical' {
    if (progressPercentage >= 100) {
      return 'over';
    } else if (progressPercentage >= this.CRITICAL_THRESHOLD) {
      return 'critical';
    } else if (progressPercentage >= alertThreshold) {
      return 'at';
    } else {
      return 'under';
    }
  }

  // Determine category status
  private determineCategoryStatus(
    progressPercentage: number, 
    allocatedAmount: number, 
    spentAmount: number
  ): 'under' | 'at' | 'over' | 'critical' {
    if (spentAmount > allocatedAmount) {
      return 'over';
    } else if (progressPercentage >= this.CRITICAL_THRESHOLD) {
      return 'critical';
    } else if (progressPercentage >= this.WARNING_THRESHOLD) {
      return 'at';
    } else {
      return 'under';
    }
  }

  // Calculate spending trend
  private calculateSpendingTrend(transactions: Transaction[]): 'increasing' | 'decreasing' | 'stable' {
    if (transactions.length < 2) return 'stable';

    const sortedTransactions = transactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const recent = sortedTransactions.slice(-7); // Last 7 transactions
    const older = sortedTransactions.slice(-14, -7); // Previous 7 transactions

    const recentAverage = recent.reduce((sum, t) => sum + t.amount, 0) / recent.length;
    const olderAverage = older.reduce((sum, t) => sum + t.amount, 0) / older.length;

    const change = ((recentAverage - olderAverage) / olderAverage) * 100;

    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  // Calculate daily average spending
  private calculateDailyAverage(transactions: Transaction[], budget: Budget): number {
    const startDate = typeof budget.startDate === 'string' ? new Date(budget.startDate) : budget.startDate;
    const endDate = typeof budget.endDate === 'string' ? new Date(budget.endDate) : budget.endDate;
    const budgetDuration = this.calculateBudgetDuration(startDate, endDate);
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    return budgetDuration > 0 ? totalSpent / budgetDuration : 0;
  }

  // Calculate projected overspend
  private calculateProjectedOverspend(
    spentAmount: number, 
    dailyAverage: number, 
    allocatedAmount: number, 
    endDate: Date
  ): boolean {
    const daysRemaining = this.calculateDaysRemaining(endDate);
    const projectedTotal = spentAmount + (dailyAverage * daysRemaining);
    return projectedTotal > allocatedAmount;
  }

  // Check if transaction is within budget period
  private isTransactionInBudgetPeriod(transaction: Transaction, budget: Budget): boolean {
    const transactionDate = new Date(transaction.date);
    
    // Handle both Date objects and ISO strings for budget dates
    const startDate = typeof budget.startDate === 'string' ? new Date(budget.startDate) : budget.startDate;
    const endDate = typeof budget.endDate === 'string' ? new Date(budget.endDate) : budget.endDate;
    
    // Set time to start of day for proper comparison
    const transactionDateOnly = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
    const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    const isInPeriod = transactionDateOnly >= startDateOnly && transactionDateOnly <= endDateOnly;
    
    
    return isInPeriod;
  }

  // Calculate days remaining
  private calculateDaysRemaining(endDate: Date, startDate?: Date): number {
    const now = new Date();
    const end = new Date(endDate);
    const start = startDate ? new Date(startDate) : now;
    
    const timeDiff = end.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff);
  }

  private calculateBudgetDuration(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const timeDiff = end.getTime() - start.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(1, daysDiff); // At least 1 day
  }

  // Update budget statistics
  private updateBudgetStats(progressData: RealtimeBudgetProgress[]): void {
    const totalBudgets = progressData.length;
    const activeBudgets = progressData.filter(p => p.status !== 'over').length;
    const onTrackBudgets = progressData.filter(p => p.status === 'under').length;
    const overBudgetBudgets = progressData.filter(p => p.status === 'over').length;
    const criticalBudgets = progressData.filter(p => p.status === 'critical').length;
    
    const totalSpent = progressData.reduce((sum, p) => sum + p.spentAmount, 0);
    const totalBudget = progressData.reduce((sum, p) => sum + p.totalAmount, 0);
    const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const averageProgress = totalBudgets > 0 ? 
      progressData.reduce((sum, p) => sum + p.progressPercentage, 0) / totalBudgets : 0;

    // Calculate currency-separated statistics
    const currencyStats = new Map<string, {
      totalBudget: number;
      totalSpent: number;
      totalRemaining: number;
      overallProgress: number;
      budgetCount: number;
    }>();

    // Group by currency
    progressData.forEach(progress => {
      const currency = progress.currency || 'USD';
      if (!currencyStats.has(currency)) {
        currencyStats.set(currency, {
          totalBudget: 0,
          totalSpent: 0,
          totalRemaining: 0,
          overallProgress: 0,
          budgetCount: 0
        });
      }

      const stats = currencyStats.get(currency)!;
      stats.totalBudget += progress.totalAmount;
      stats.totalSpent += progress.spentAmount;
      stats.budgetCount += 1;
    });

    // Calculate remaining amounts and progress for each currency
    currencyStats.forEach((stats, currency) => {
      stats.totalRemaining = stats.totalBudget - stats.totalSpent;
      stats.overallProgress = stats.totalBudget > 0 ? (stats.totalSpent / stats.totalBudget) * 100 : 0;
    });

    const stats: RealtimeBudgetStats = {
      totalBudgets,
      activeBudgets,
      onTrackBudgets,
      overBudgetBudgets,
      criticalBudgets,
      totalSpent,
      totalBudget,
      overallProgress,
      averageProgress,
      lastUpdated: new Date(),
      currencyStats
    };

    this.budgetStats$.next(stats);
  }

  // Check for alerts and notifications
  private checkForAlerts(progressData: RealtimeBudgetProgress[]): void {
    const newAlerts: BudgetAlert[] = [];
    const currentAlerts = this.alerts$.value;

    progressData.forEach(budget => {
      // Budget-level alerts
      if (budget.status === 'critical' && budget.progressPercentage >= this.CRITICAL_THRESHOLD) {
        const alertId = `budget-critical-${budget.budgetId}`;
        if (!currentAlerts.find(a => a.id === alertId)) {
          newAlerts.push({
            id: alertId,
            type: 'critical',
            message: `Critical: ${budget.budgetName} is at ${budget.progressPercentage.toFixed(1)}% of budget`,
            threshold: this.CRITICAL_THRESHOLD,
            currentValue: budget.progressPercentage,
            timestamp: new Date(),
            acknowledged: false
          });
        }
      }

      // Category-level alerts
      budget.categoryProgress.forEach(category => {
        if (category.status === 'over') {
          const alertId = `category-over-${budget.budgetId}-${category.categoryId}`;
          if (!currentAlerts.find(a => a.id === alertId)) {
            newAlerts.push({
              id: alertId,
              type: 'critical',
              message: `Over budget: ${category.categoryName} in ${budget.budgetName}`,
              categoryId: category.categoryId,
              categoryName: category.categoryName,
              threshold: 100,
              currentValue: category.progressPercentage,
              timestamp: new Date(),
              acknowledged: false
            });
          }
        } else if (category.projectedOverspend) {
          const alertId = `category-projected-${budget.budgetId}-${category.categoryId}`;
          if (!currentAlerts.find(a => a.id === alertId)) {
            newAlerts.push({
              id: alertId,
              type: 'warning',
              message: `Projected overspend: ${category.categoryName} in ${budget.budgetName}`,
              categoryId: category.categoryId,
              categoryName: category.categoryName,
              timestamp: new Date(),
              acknowledged: false
            });
          }
        }
      });
    });

    // Add new alerts to existing ones
    const allAlerts = [...currentAlerts, ...newAlerts];
    this.alerts$.next(allAlerts);
  }

  // Manual refresh
  refreshData(): void {
    this.loadRealtimeData().subscribe();
  }

  // Acknowledge alert
  acknowledgeAlert(alertId: string): void {
    const currentAlerts = this.alerts$.value;
    const updatedAlerts = currentAlerts.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    );
    this.alerts$.next(updatedAlerts);
  }

  // Clear all alerts
  clearAllAlerts(): void {
    this.alerts$.next([]);
  }

  // Get progress for specific budget
  getBudgetProgress(budgetId: string): RealtimeBudgetProgress | undefined {
    return this.realtimeProgress$.value.find(p => p.budgetId === budgetId);
  }

  // Get progress for specific category
  getCategoryProgress(budgetId: string, categoryId: string): CategoryProgress | undefined {
    const budgetProgress = this.getBudgetProgress(budgetId);
    return budgetProgress?.categoryProgress.find(cp => cp.categoryId === categoryId);
  }
}
