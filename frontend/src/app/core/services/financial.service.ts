import { inject, Injectable } from "@angular/core";
import { ApiResponse, BudgetAnalysis, FinancialDashboard, FinancialInsights, FinancialReport } from "../models/financial.model";
import { environment } from "../../../environments/environment";
import { BehaviorSubject, catchError, map, Observable, of, shareReplay, tap, throwError } from "rxjs";
import { HttpClient, HttpParams } from "@angular/common/http";

export interface FinancialState {
    dashboard: FinancialDashboard | null;
    currencyDashboards: Map<string, FinancialDashboard> | null;
    isLoading: boolean;
    error: string | null;
    lastUpdated: Date | null;
}

@Injectable({
    providedIn: 'root',
})
export class FinancialService {
   private readonly baseUrl = `${environment.apiUrl}/financial`;

   // Dependendency injection of the HttpClient
   private http = inject(HttpClient);

   // Reactive State Management
   private dashboardStateSubject = new BehaviorSubject<FinancialState>({
    dashboard: null,
    currencyDashboards: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
   });

   // Public observables
   public readonly dashboardState$ = this.dashboardStateSubject.asObservable();
   public readonly dashboard$ = this.dashboardState$.pipe(
    map((state) => state.dashboard),
   );

   public readonly currencyDashboards$ = this.dashboardState$.pipe(
    map((state) => state.currencyDashboards),
   );

   public readonly isLoading$ = this.dashboardState$.pipe(
    map((state) => state.isLoading),
   );

   public readonly error$ = this.dashboardState$.pipe(
    map((state) => state.error),
   );


   // Cache for dashboard data
   private dashboardCache: FinancialDashboard | null = null;
   private cacheExpiry = 5 * 60 * 1000; // 5 minutes

   /**
   * Get financial dashboard data with reactive state management
   */
  getFinancialDashboard(options: {
    startDate?: Date;
    endDate?: Date;
    accountId?: string;
    forceRefresh?: boolean;
  } = {}): Observable<FinancialDashboard> {
    const {forceRefresh = false} = options;

    // Check cache first (unless forced refresh)
    if (!forceRefresh && this.dashboardCache && this.isCacheValid()) {
        this.updateDashboardState({
            dashboard: this.dashboardCache,
            isLoading: false,
            error: null,
            lastUpdated: new Date(),
        });
        return of(this.dashboardCache);
  }

  // Set loading state
  this.updateDashboardState({
    dashboard: this.dashboardCache,
    isLoading: true,
    error: null,
    lastUpdated: this.dashboardStateSubject.value.lastUpdated,
  });

  // Build query parameters
  let params = new HttpParams();
  if (options.startDate) {
    params = params.set('startDate', options.startDate.toISOString());
  }
  if (options.endDate) {
    params = params.set('endDate', options.endDate.toISOString());
  }
  if (options.accountId) {
    params = params.set('accountId', options.accountId);
  }

  return this.http.get<ApiResponse<FinancialDashboard>>(`${this.baseUrl}/dashboard`, {params})
  .pipe(
    map(response => response.data),
    tap((dashboard) => {
        // Update cache
        this.dashboardCache = dashboard;
        // Update state
        this.updateDashboardState({
            dashboard: dashboard,
            isLoading: false,
            error: null,
            lastUpdated: new Date(),
        });
    }),
    catchError((error) => {
        const errorMessage = this.handleError(error);
    
        // Update error state
        this.updateDashboardState({
            dashboard: null,
            isLoading: false,
            error: errorMessage,
            lastUpdated: this.dashboardStateSubject.value.lastUpdated,
        });
        // Propagate error to the caller
        return throwError(() => error);
    }),
    shareReplay(1)
  );
}

  /**
   * Get currency-separated financial dashboard data
   */
  getCurrencySeparatedDashboard(options: {
    startDate?: Date;
    endDate?: Date;
    accountId?: string;
    forceRefresh?: boolean;
  } = {}): Observable<Map<string, FinancialDashboard>> {
    const {forceRefresh = false} = options;

    // Check cache first (unless forced refresh)
    if (!forceRefresh && this.dashboardStateSubject.value.currencyDashboards && this.isCacheValid()) {
        this.updateDashboardState({
            currencyDashboards: this.dashboardStateSubject.value.currencyDashboards,
            isLoading: false,
            error: null,
            lastUpdated: new Date(),
        });
        return of(this.dashboardStateSubject.value.currencyDashboards!);
    }

    // Set loading state
    this.updateDashboardState({
      currencyDashboards: this.dashboardStateSubject.value.currencyDashboards,
      isLoading: true,
      error: null,
      lastUpdated: this.dashboardStateSubject.value.lastUpdated,
    });

    // Build query parameters
    let params = new HttpParams();
    if (options.startDate) {
      params = params.set('startDate', options.startDate.toISOString());
    }
    if (options.endDate) {
      params = params.set('endDate', options.endDate.toISOString());
    }
    if (options.accountId) {
      params = params.set('accountId', options.accountId);
    }
    params = params.set('separateByCurrency', 'true');

    return this.http.get<ApiResponse<{[currency: string]: FinancialDashboard}>>(`${this.baseUrl}/dashboard`, {params})
    .pipe(
      map(response => {
        // Convert object to Map
        const currencyMap = new Map<string, FinancialDashboard>();
        Object.entries(response.data).forEach(([currency, dashboard]) => {
          currencyMap.set(currency, dashboard);
        });
        return currencyMap;
      }),
      tap((currencyDashboards) => {
        // Update state
        this.updateDashboardState({
            currencyDashboards: currencyDashboards,
            isLoading: false,
            error: null,
            lastUpdated: new Date(),
        });
    }),
    catchError((error) => {
        const errorMessage = this.handleError(error);
    
        // Update error state
        this.updateDashboardState({
            currencyDashboards: null,
            isLoading: false,
            error: errorMessage,
            lastUpdated: this.dashboardStateSubject.value.lastUpdated,
        });
        // Propagate error to the caller
        return throwError(() => error);
    }),
    shareReplay(1)
  );
}

  /**
   * Generate financial report
   */
  generateFinancialReport(options: {
    reportType: 'monthly' | 'quarterly' | 'yearly' | 'custom';
    startDate?: Date;
    endDate?: Date;
    includeCategories?: boolean;
    includeTrends?: boolean;
    includeProjections?: boolean;
  }): Observable<FinancialReport> {
    return this.http.post<ApiResponse<FinancialReport>>(`${this.baseUrl}/reports`, options)
      .pipe(
        map(response => response.data),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Get budget analysis
   */
  getBudgetAnalysis(options: {
    startDate?: Date;
    endDate?: Date;
    categoryId?: string;
  } = {}): Observable<BudgetAnalysis> {
    let params = new HttpParams();
    if (options.startDate) {
      params = params.set('startDate', options.startDate.toISOString());
    }
    if (options.endDate) {
      params = params.set('endDate', options.endDate.toISOString());
    }
    if (options.categoryId) {
      params = params.set('categoryId', options.categoryId);
    }

    return this.http.get<ApiResponse<BudgetAnalysis>>(`${this.baseUrl}/budget-analysis`, { params })
      .pipe(
        map(response => response.data),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Get financial insights
   */
  getFinancialInsights(options: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    includePredictions?: boolean;
  } = {}): Observable<FinancialInsights> {
    let params = new HttpParams();
    if (options.period) {
      params = params.set('period', options.period);
    }
    if (options.includePredictions !== undefined) {
      params = params.set('includePredictions', options.includePredictions.toString());
    }

    return this.http.get<ApiResponse<FinancialInsights>>(`${this.baseUrl}/insights`, { params })
      .pipe(
        map(response => response.data),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Export financial data
   */
  exportFinancialData(options: {
    format: 'csv' | 'json' | 'pdf';
    startDate: Date;
    endDate: Date;
    includeCategories?: boolean;
    includeTransactions?: boolean;
    includeStats?: boolean;
  }): Observable<{ format: string; data: any; filename: string; downloadUrl?: string }> {
    return this.http.post<ApiResponse<{ format: string; data: any; filename: string; downloadUrl?: string }>>(
      `${this.baseUrl}/export`, 
      options
    ).pipe(
      map(response => response.data),
      catchError(error => throwError(() => new Error(this.handleError(error))))
    );
  }

  /**
   * Get financial summary
   */
  getFinancialSummary(options: { period?: string } = {}): Observable<any> {
    let params = new HttpParams();
    if (options.period) {
      params = params.set('period', options.period);
    }

    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/summary`, { params })
      .pipe(
        map(response => response.data),
        catchError(error => throwError(() => new Error(this.handleError(error))))
      );
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): Observable<FinancialDashboard> {
    return this.getFinancialDashboard({ forceRefresh: true });
  }

  /**
   * Clear dashboard cache
   */
  clearDashboardCache(): void {
    this.dashboardCache = null;
    this.updateDashboardState({
      dashboard: null,
      currencyDashboards: null,
      isLoading: false,
      error: null,
      lastUpdated: null
    });
  }

  /**
   * Get current dashboard state
   */
  getCurrentDashboardState(): FinancialState {
    return this.dashboardStateSubject.value;
  }

  /**
   * Private methods
   */
  private updateDashboardState(partialState: Partial<FinancialState>): void {
    const currentState = this.dashboardStateSubject.value;
    this.dashboardStateSubject.next({ ...currentState, ...partialState });
  }

  private isCacheValid(): boolean {
    if (!this.dashboardStateSubject.value.lastUpdated) return false;
    const now = new Date().getTime();
    const lastUpdated = this.dashboardStateSubject.value.lastUpdated.getTime();
    return (now - lastUpdated) < this.cacheExpiry;
  }

  private handleError(error: any): string {
    if (error.error instanceof ErrorEvent) {
      return error.error.message;
    } else {
      return error.error?.message || error.message || 'An error occurred';
    }
  }
}