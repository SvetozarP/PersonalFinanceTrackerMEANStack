import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface BudgetExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'excel';
  reportType: 'performance' | 'variance' | 'trend' | 'forecast' | 'breakdown' | 'all';
  includeCharts?: boolean;
  includeDetails?: boolean;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  budgetIds?: string[];
  categories?: string[];
}

export interface BudgetPerformanceReport {
  budgetId: string;
  budgetName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  performance: {
    totalAllocated: number;
    totalSpent: number;
    remainingAmount: number;
    utilizationPercentage: number;
    varianceAmount: number;
    variancePercentage: number;
    status: 'under' | 'on-track' | 'over' | 'critical';
  };
  categoryPerformance: Array<{
    categoryId: string;
    categoryName: string;
    allocatedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    utilizationPercentage: number;
    varianceAmount: number;
    variancePercentage: number;
    status: 'under' | 'on-track' | 'over' | 'critical';
    topTransactions: Array<{
      id: string;
      amount: number;
      date: Date;
      description: string;
    }>;
  }>;
  trends: {
    dailySpending: Array<{
      date: string;
      allocatedAmount: number;
      spentAmount: number;
      cumulativeSpent: number;
      remainingAmount: number;
    }>;
    weeklyTrends: Array<{
      week: string;
      allocatedAmount: number;
      spentAmount: number;
      varianceAmount: number;
      variancePercentage: number;
    }>;
  };
  insights: Array<{
    type: 'performance' | 'trend' | 'alert' | 'recommendation';
    priority: 'high' | 'medium' | 'low';
    message: string;
    data?: any;
  }>;
}

export interface BudgetVsActualReport {
  budgetId: string;
  budgetName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalBudgeted: number;
    totalActual: number;
    variance: number;
    variancePercentage: number;
    status: 'under' | 'on-track' | 'over' | 'critical';
  };
  categoryComparison: Array<{
    categoryId: string;
    categoryName: string;
    budgetedAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
    status: 'under' | 'on-track' | 'over' | 'critical';
    efficiency: number;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    budgetedAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
    cumulativeVariance: number;
  }>;
  topVariances: Array<{
    categoryId: string;
    categoryName: string;
    variance: number;
    variancePercentage: number;
    type: 'over' | 'under';
  }>;
  recommendations: Array<{
    type: 'budget_adjustment' | 'spending_control' | 'category_reallocation';
    priority: 'high' | 'medium' | 'low';
    message: string;
    potentialSavings?: number;
    suggestedAction: string;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly baseUrl = `${environment.apiUrl}/analytics`;
  private http = inject(HttpClient);

  /**
   * Get budget performance report
   */
  getBudgetPerformanceReport(
    budgetId: string,
    startDate: Date,
    endDate: Date
  ): Observable<BudgetPerformanceReport> {
    const params = new HttpParams()
      .set('budgetId', budgetId)
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http.get<ApiResponse<BudgetPerformanceReport>>(
      `${this.baseUrl}/budgets/performance`,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => throwError(() => new Error(this.handleError(error))))
    );
  }

  /**
   * Get budget vs actual report
   */
  getBudgetVsActualReport(
    budgetId: string,
    startDate: Date,
    endDate: Date
  ): Observable<BudgetVsActualReport> {
    const params = new HttpParams()
      .set('budgetId', budgetId)
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http.get<ApiResponse<BudgetVsActualReport>>(
      `${this.baseUrl}/budgets/variance`,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => throwError(() => new Error(this.handleError(error))))
    );
  }

  /**
   * Export budget report in various formats
   */
  exportBudgetReport(options: BudgetExportOptions): Observable<Blob> {
    const params = new HttpParams()
      .set('startDate', options.dateRange.startDate.toISOString())
      .set('endDate', options.dateRange.endDate.toISOString())
      .set('format', options.format)
      .set('reportType', options.reportType)
      .set('includeCharts', options.includeCharts?.toString() || 'false')
      .set('includeDetails', options.includeDetails?.toString() || 'true')
      .set('budgetIds', options.budgetIds?.join(',') || '')
      .set('categories', options.categories?.join(',') || '');

    return this.http.get(`${this.baseUrl}/budgets/export`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(error => throwError(() => new Error(this.handleError(error))))
    );
  }

  /**
   * Download budget report file
   */
  downloadBudgetReport(options: BudgetExportOptions): Observable<void> {
    return this.exportBudgetReport(options).pipe(
      map(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Generate filename based on options
        const dateStr = options.dateRange.startDate.toISOString().split('T')[0];
        const filename = `budget-report-${options.reportType}-${dateStr}.${options.format}`;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }),
      catchError(error => throwError(() => new Error(this.handleError(error))))
    );
  }

  /**
   * Get budget analytics summary
   */
  getBudgetAnalyticsSummary(
    startDate: Date,
    endDate: Date,
    budgetIds?: string[]
  ): Observable<any> {
    let params = new HttpParams()
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    if (budgetIds && budgetIds.length > 0) {
      params = params.set('budgetIds', budgetIds.join(','));
    }

    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/budgets/summary`,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => throwError(() => new Error(this.handleError(error))))
    );
  }

  /**
   * Get budget trends analysis
   */
  getBudgetTrends(
    budgetId: string,
    startDate: Date,
    endDate: Date
  ): Observable<any> {
    const params = new HttpParams()
      .set('budgetId', budgetId)
      .set('startDate', startDate.toISOString())
      .set('endDate', endDate.toISOString());

    return this.http.get<ApiResponse<any>>(
      `${this.baseUrl}/budgets/trends`,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => throwError(() => new Error(this.handleError(error))))
    );
  }

  /**
   * Get budget alerts
   */
  getBudgetAlerts(budgetId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (budgetId) {
      params = params.set('budgetId', budgetId);
    }

    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/budgets/alerts`,
      { params }
    ).pipe(
      map(response => response.data),
      catchError(error => throwError(() => new Error(this.handleError(error))))
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): string {
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      return `Error: ${error.error.message}`;
    } else {
      // Server-side error
      return `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
  }
}
