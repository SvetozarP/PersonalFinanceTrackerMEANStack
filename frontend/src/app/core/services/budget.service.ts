import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BaseApiService } from './base-api.service';

// Budget interfaces
export interface Budget {
  _id: string;
  name: string;
  description?: string;
  period: 'monthly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  currency: string;
  categoryAllocations: CategoryAllocation[];
  status: 'active' | 'paused' | 'completed' | 'archived';
  alertThreshold: number;
  userId: string;
  isActive: boolean;
  autoAdjust: boolean;
  allowRollover: boolean;
  rolloverAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryAllocation {
  categoryId: string;
  allocatedAmount: number;
  isFlexible: boolean;
  priority: number;
}

export interface CreateBudgetDto {
  name: string;
  description?: string;
  period: 'monthly' | 'yearly' | 'custom';
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  currency?: string;
  categoryAllocations: CategoryAllocation[];
  alertThreshold?: number;
  autoAdjust?: boolean;
  allowRollover?: boolean;
}

export interface UpdateBudgetDto {
  name?: string;
  description?: string;
  period?: 'monthly' | 'yearly' | 'custom';
  startDate?: Date;
  endDate?: Date;
  totalAmount?: number;
  currency?: string;
  categoryAllocations?: CategoryAllocation[];
  status?: 'active' | 'paused' | 'completed' | 'archived';
  alertThreshold?: number;
  autoAdjust?: boolean;
  allowRollover?: boolean;
  rolloverAmount?: number;
}

export interface BudgetFilters {
  status?: string;
  period?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface BudgetAnalytics {
  budgetId: string;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  progressPercentage: number;
  isOverBudget: boolean;
  categoryBreakdown: CategoryBudgetBreakdown[];
  spendingTrend: SpendingTrend[];
  alerts: BudgetAlert[];
}

export interface CategoryBudgetBreakdown {
  categoryId: string;
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  isOverBudget: boolean;
  isFlexible: boolean;
  priority: number;
}

export interface SpendingTrend {
  date: Date;
  amount: number;
  cumulativeAmount: number;
}

export interface BudgetAlert {
  type: 'threshold' | 'category_overbudget' | 'deadline';
  message: string;
  severity: 'low' | 'medium' | 'high';
  categoryId?: string;
  currentAmount?: number;
  limitAmount?: number;
}

export interface BudgetSummary {
  totalBudgetAmount: number;
  totalSpentAmount: number;
  totalRemainingAmount: number;
  activeBudgetCount: number;
  overBudgetCount: number;
  upcomingDeadlines: {
    budgetId: string;
    budgetName: string;
    endDate: Date;
    remainingAmount: number;
    isOverBudget: boolean;
  }[];
}

export interface BudgetStatistics {
  monthlyStats: {
    month: string;
    year: number;
    totalBudgeted: number;
    totalSpent: number;
    totalSaved: number;
    budgetCount: number;
  }[];
  categoryStats: {
    categoryId: string;
    categoryName: string;
    totalBudgeted: number;
    totalSpent: number;
    averageUtilization: number;
    overBudgetCount: number;
  }[];
  spendingPatterns: {
    pattern: 'consistent' | 'variable' | 'seasonal' | 'trending';
    description: string;
    confidence: number;
    recommendations: string[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService extends BaseApiService<Budget> {
  protected readonly endpoint = 'budgets';
  
  // State management
  private budgetsSubject = new BehaviorSubject<Budget[]>([]);
  private budgetSummarySubject = new BehaviorSubject<BudgetSummary | null>(null);
  private budgetAnalyticsSubject = new BehaviorSubject<Map<string, BudgetAnalytics>>(new Map());
  
  // Public observables
  public budgets$ = this.budgetsSubject.asObservable();
  public budgetSummary$ = this.budgetSummarySubject.asObservable();
  public budgetAnalytics$ = this.budgetAnalyticsSubject.asObservable();

  constructor() {
    super(inject(HttpClient));
  }

  /**
   * Create a new budget
   */
  createBudget(budgetData: CreateBudgetDto): Observable<Budget> {
    return this.http.post<{ success: boolean; data: Budget }>(this.baseUrl, budgetData)
      .pipe(
        map((response: { success: boolean; data: Budget }) => response.data),
        tap((budget: Budget) => {
          const currentBudgets = this.budgetsSubject.value;
          this.budgetsSubject.next([...currentBudgets, budget]);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get all budgets with optional filters
   */
  getBudgets(
    filters: BudgetFilters = {},
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Observable<{ budgets: Budget[]; total: number; page: number; totalPages: number }> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);

    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (value instanceof Date) {
          params = params.set(key, value.toISOString());
        } else {
          params = params.set(key, value.toString());
        }
      }
    });

    return this.http.get<{ success: boolean; data: { budgets: Budget[]; total: number; page: number; totalPages: number } }>(this.baseUrl, { params })
      .pipe(
        map((response: { success: boolean; data: { budgets: Budget[]; total: number; page: number; totalPages: number } }) => response.data),
        tap((data: { budgets: Budget[]; total: number; page: number; totalPages: number }) => {
          this.budgetsSubject.next(data.budgets);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get budget by ID with analytics
   */
  getBudgetById(budgetId: string): Observable<BudgetAnalytics> {
    return this.http.get<{ success: boolean; data: BudgetAnalytics }>(`${this.baseUrl}/${budgetId}/analytics`)
      .pipe(
        map((response: { success: boolean; data: BudgetAnalytics }) => response.data),
        tap((analytics: BudgetAnalytics) => {
          const currentAnalytics = this.budgetAnalyticsSubject.value;
          currentAnalytics.set(budgetId, analytics);
          this.budgetAnalyticsSubject.next(currentAnalytics);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update budget
   */
  updateBudget(budgetId: string, updateData: UpdateBudgetDto): Observable<Budget> {
    return this.http.put<{ success: boolean; data: Budget }>(`${this.baseUrl}/${budgetId}`, updateData)
      .pipe(
        map((response: { success: boolean; data: Budget }) => response.data),
        tap((updatedBudget: Budget) => {
          const currentBudgets = this.budgetsSubject.value;
          const index = currentBudgets.findIndex(b => b._id === budgetId);
          if (index !== -1) {
            currentBudgets[index] = updatedBudget;
            this.budgetsSubject.next([...currentBudgets]);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Delete budget
   */
  deleteBudget(budgetId: string): Observable<boolean> {
    return this.http.delete<{ success: boolean; data: boolean }>(`${this.baseUrl}/${budgetId}`)
      .pipe(
        map((response: { success: boolean; data: boolean }) => response.data),
        tap(() => {
          const currentBudgets = this.budgetsSubject.value;
          this.budgetsSubject.next(currentBudgets.filter(b => b._id !== budgetId));
          
          // Remove analytics for deleted budget
          const currentAnalytics = this.budgetAnalyticsSubject.value;
          currentAnalytics.delete(budgetId);
          this.budgetAnalyticsSubject.next(currentAnalytics);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get budget summary
   */
  getBudgetSummary(): Observable<BudgetSummary> {
    return this.http.get<{ success: boolean; data: BudgetSummary }>(`${this.baseUrl}/summary`)
      .pipe(
        map((response: { success: boolean; data: BudgetSummary }) => response.data),
        tap((summary: BudgetSummary) => {
          this.budgetSummarySubject.next(summary);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get budget statistics for a year
   */
  getBudgetStatistics(year: number): Observable<BudgetStatistics> {
    return this.http.get<{ success: boolean; data: BudgetStatistics }>(`${this.baseUrl}/statistics`, {
      params: { year: year.toString() }
    }).pipe(
      map((response: { success: boolean; data: BudgetStatistics }) => response.data),
      catchError(this.handleError)
    );
  }

  /**
   * Check budget alerts
   */
  checkBudgetAlerts(): Observable<BudgetAlert[]> {
    return this.http.get<{ success: boolean; data: BudgetAlert[] }>(`${this.baseUrl}/alerts`)
      .pipe(
        map((response: { success: boolean; data: BudgetAlert[] }) => response.data),
        catchError(this.handleError)
      );
  }

  /**
   * Get budget analytics for a specific budget
   */
  getBudgetAnalytics(budgetId: string): Observable<BudgetAnalytics> {
    return this.http.get<{ success: boolean; data: BudgetAnalytics }>(`${this.baseUrl}/${budgetId}/analytics`)
      .pipe(
        map((response: { success: boolean; data: BudgetAnalytics }) => response.data),
        tap((analytics: BudgetAnalytics) => {
          const currentAnalytics = this.budgetAnalyticsSubject.value;
          currentAnalytics.set(budgetId, analytics);
          this.budgetAnalyticsSubject.next(currentAnalytics);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Refresh budget data
   */
  refreshBudgets(): void {
    this.getBudgets().subscribe();
  }

  /**
   * Refresh budget summary
   */
  refreshBudgetSummary(): void {
    this.getBudgetSummary().subscribe();
  }

  /**
   * Get current budgets from state
   */
  getCurrentBudgets(): Budget[] {
    return this.budgetsSubject.value;
  }

  /**
   * Get current budget summary from state
   */
  getCurrentBudgetSummary(): BudgetSummary | null {
    return this.budgetSummarySubject.value;
  }

  /**
   * Get budget analytics from state
   */
  getBudgetAnalyticsFromState(budgetId: string): BudgetAnalytics | undefined {
    return this.budgetAnalyticsSubject.value.get(budgetId);
  }

  /**
   * Calculate total allocated amount for category allocations
   */
  calculateTotalAllocated(allocations: CategoryAllocation[]): number {
    return allocations.reduce((total, allocation) => total + allocation.allocatedAmount, 0);
  }

  /**
   * Validate budget data
   */
  validateBudgetData(budgetData: CreateBudgetDto): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!budgetData.name || budgetData.name.trim().length === 0) {
      errors.push('Budget name is required');
    }

    if (!budgetData.startDate || !budgetData.endDate) {
      errors.push('Start date and end date are required');
    } else if (budgetData.startDate >= budgetData.endDate) {
      errors.push('End date must be after start date');
    }

    if (!budgetData.totalAmount || budgetData.totalAmount <= 0) {
      errors.push('Total amount must be greater than 0');
    }

    if (!budgetData.categoryAllocations || budgetData.categoryAllocations.length === 0) {
      errors.push('At least one category allocation is required');
    } else {
      const totalAllocated = this.calculateTotalAllocated(budgetData.categoryAllocations);
      if (Math.abs(totalAllocated - budgetData.totalAmount) > 0.01) {
        errors.push('Total allocated amount must equal total budget amount');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate suggested category allocations based on historical spending
   */
  generateSuggestedAllocations(
    totalAmount: number,
    historicalSpending: { categoryId: string; amount: number; percentage: number }[]
  ): CategoryAllocation[] {
    return historicalSpending.map(item => ({
      categoryId: item.categoryId,
      allocatedAmount: Math.round((totalAmount * item.percentage / 100) * 100) / 100,
      isFlexible: false,
      priority: 1
    }));
  }

  /**
   * Calculate budget period dates
   */
  calculateBudgetPeriodDates(period: 'monthly' | 'yearly' | 'custom', startDate?: Date): { startDate: Date; endDate: Date } {
    const baseDate = startDate || new Date();
    
    switch (period) {
      case 'monthly':
        const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        const endOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        return { startDate: startOfMonth, endDate: endOfMonth };
        
      case 'yearly':
        const startOfYear = new Date(baseDate.getFullYear(), 0, 1);
        const endOfYear = new Date(baseDate.getFullYear(), 11, 31);
        return { startDate: startOfYear, endDate: endOfYear };
        
      case 'custom':
      default:
        return { startDate: baseDate, endDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000) }; // 30 days default
    }
  }
}
