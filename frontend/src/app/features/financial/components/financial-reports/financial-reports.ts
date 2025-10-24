import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  FinancialReport,
  FinancialDashboard,
  TransactionStats,
  CategoryStats
} from '../../../../core/models/financial.model';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { TokenService } from '../../../auth/services/token.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './financial-reports.html',
  styleUrls: ['./financial-reports.scss']
})
export class FinancialReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private financialService = inject(FinancialService);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private tokenService = inject(TokenService);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  // Report configuration
  selectedPeriod: string = 'month';
  selectedReportType: string = 'summary';
  startDate: string = '';
  endDate: string = '';
  customDateRange: boolean = false;

  // Data
  transactions: Transaction[] = [];
  categories: Category[] = [];
  reportData: FinancialReport | null = null;
  currencyReports: {[currency: string]: FinancialReport} = {};
  selectedCurrency: string = '';
  transactionStats: TransactionStats | null = null;
  categoryStats: CategoryStats | null = null;

  // Cached computed values to prevent ExpressionChangedAfterItHasBeenCheckedError
  private _cachedIncomePercentage: number | null = null;
  private _cachedExpensePercentage: number | null = null;
  private _cachedTotalIncome: number | null = null;
  private _cachedTotalExpenses: number | null = null;
  private _cachedNetTrend: number | null = null;
  private _cachedBudgetAmount: number | null = null;
  private _cachedBudgetUtilization: number | null = null;
  private _cachedBudgetVariance: number | null = null;

  // UI State
  isLoading: boolean = false;
  showAdvancedOptions: boolean = false;

  // Available periods
  periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Available report types
  reportTypes = [
    { value: 'summary', label: 'Summary Report', icon: 'fas fa-chart-pie' },
    { value: 'detailed', label: 'Detailed Report', icon: 'fas fa-list-alt' },
    { value: 'category', label: 'Category Analysis', icon: 'fas fa-tags' },
    { value: 'trends', label: 'Trend Analysis', icon: 'fas fa-chart-line' },
    { value: 'budget', label: 'Budget Analysis', icon: 'fas fa-balance-scale' }
  ];

  ngOnInit(): void {
    this.initializeDates();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDates(): void {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.startDate = startOfMonth.toISOString().split('T')[0];
    this.endDate = endOfMonth.toISOString().split('T')[0];
  }

  private loadData(): void {
    this.isLoading = true;
    this.reportData = null; // Reset report data

    // Generate report using backend API
    const reportOptions = {
      reportType: this.mapPeriodToReportType(this.selectedPeriod),
      startDate: new Date(this.startDate),
      endDate: new Date(this.endDate),
      includeCategories: true,
      includeTrends: true,
      includeProjections: false,
      separateByCurrency: true // Enable currency separation
    };

    this.financialService.generateFinancialReport(reportOptions).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (report) => {
        // Clear cached values when new data arrives
        this.clearCachedValues();
        
        // Check if the response is currency-separated
        // Currency-separated reports are objects with currency keys (USD, EUR, etc.)
        // Single currency reports have a reportType property
        if (report && typeof report === 'object' && !(report as any).reportType && Object.keys(report).length > 0) {
          // Check if keys look like currency codes (3 letters)
          const keys = Object.keys(report);
          const hasCurrencyKeys = keys.some(key => key.length === 3 && key === key.toUpperCase());
          
          if (hasCurrencyKeys) {
            // This is a currency-separated response
            this.currencyReports = report as unknown as {[currency: string]: FinancialReport};
            this.reportData = null; // Clear single currency report
            // Set the first currency as selected
            const currencies = Object.keys(this.currencyReports);
            if (currencies.length > 0) {
              this.selectedCurrency = currencies[0];
            }
          } else {
            // This is a single currency response
            this.reportData = report as FinancialReport;
            this.currencyReports = {}; // Clear currency reports
            this.selectedCurrency = '';
          }
        } else {
          // This is a single currency response
          this.reportData = report as FinancialReport;
          this.currencyReports = {}; // Clear currency reports
          this.selectedCurrency = '';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error generating report:', error);
        
        // Check if it's an authentication error
        if (error.status === 401) {
          this.isLoading = false;
          alert('Authentication failed. Please log in again.');
          this.cdr.detectChanges();
          return;
        }
        
        // Check if it's a server error
        if (error.status >= 500) {
          this.isLoading = false;
          alert('Server error. Please try again later.');
          this.cdr.detectChanges();
          return;
        }
        
        // Fallback to local generation if API fails
        console.log('Falling back to local report generation...');
        this.loadTransactionsForFallback();
      }
    });

    // Load categories for local fallback
    this.categoryService.getUserCategories().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (categories) => {
        this.categories = categories || [];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  private loadTransactionsForFallback(): void {
    // Fallback to local report generation
    this.transactionService.getUserTransactions({
      startDate: new Date(this.startDate),
      endDate: new Date(this.endDate)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.transactions = response.data || [];
        this.generateReport();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    this.customDateRange = period === 'custom';
    
    if (period !== 'custom') {
      this.updateDateRange(period);
    }
    
    this.loadData();
  }

  onReportTypeChange(reportType: string): void {
    this.selectedReportType = reportType;
    this.clearCachedValues();
    this.loadData(); // Reload data from API instead of local generation
  }

  onDateRangeChange(): void {
    if (this.startDate && this.endDate) {
      this.loadData();
    }
  }

  private updateDateRange(period: string): void {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    this.startDate = startDate.toISOString().split('T')[0];
    this.endDate = endDate.toISOString().split('T')[0];
  }

  private generateReport(): void {
    if (this.transactions.length === 0) {
      this.reportData = null;
      return;
    }

    // Generate summary statistics
    const summary = this.generateSummary();
    
    // Generate category analysis
    const categories = this.generateCategoryAnalysis();
    
    // Generate trends
    const trends = this.generateTrends();
    
    // Generate insights
    const insights = this.generateInsights();

    this.reportData = {
      reportType: this.selectedReportType,
      period: {
        start: new Date(this.startDate),
        end: new Date(this.endDate)
      },
      summary,
      categories,
      trends,
      projections: [],
      insights
    };
    this.cdr.detectChanges();
  }

  private generateSummary(): any {
    const totalIncome = this.transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = this.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTransfers = this.transactions
      .filter(t => t.type === TransactionType.TRANSFER)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      totalTransfers,
      netAmount: totalIncome - totalExpenses,
      transactionCount: this.transactions.length
    };
  }

  private generateCategoryAnalysis(): any[] {
    const categoryMap = new Map<string, { amount: number; count: number }>();

    this.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(transaction => {
        const categoryName = this.getCategoryName(transaction.categoryId);
        const current = categoryMap.get(categoryName) || { amount: 0, count: 0 };
        current.amount += transaction.amount;
        current.count += 1;
        categoryMap.set(categoryName, current);
      });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: (data.amount / this.getTotalExpenses()) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  private generateTrends(): any[] {
    const monthlyData = this.groupTransactionsByMonth();
    
    return monthlyData.map(data => ({
      month: data.month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
      change: this.calculateChange(data.month, data.income - data.expenses)
    }));
  }

  private generateInsights(): string[] {
    const insights: string[] = [];
    const summary = this.generateSummary();

    if (summary.netAmount < 0) {
      insights.push('Your expenses exceeded your income this period. Consider reviewing your spending habits.');
    }

    if (summary.totalExpenses > summary.totalIncome * 0.8) {
      insights.push('Your expenses are high relative to income. Focus on increasing savings.');
    }

    const topCategory = this.getTopSpendingCategory();
    if (topCategory) {
      insights.push(`Your highest spending category is ${topCategory.name} (${topCategory.percentage.toFixed(1)}% of total expenses).`);
    }

    return insights;
  }

  private groupTransactionsByMonth(): { month: string; income: number; expenses: number }[] {
    const monthlyMap = new Map<string, { income: number; expenses: number }>();

    this.transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const current = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };

      if (transaction.type === TransactionType.INCOME) {
        current.income += transaction.amount;
      } else if (transaction.type === TransactionType.EXPENSE) {
        current.expenses += transaction.amount;
      }

      monthlyMap.set(monthKey, current);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }

  private calculateChange(month: string, currentValue: number): number {
    // Simplified change calculation - in a real app, you'd compare with previous period
    return 0;
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  private clearCachedValues(): void {
    this._cachedIncomePercentage = null;
    this._cachedExpensePercentage = null;
    this._cachedTotalIncome = null;
    this._cachedTotalExpenses = null;
    this._cachedNetTrend = null;
    this._cachedBudgetAmount = null;
    this._cachedBudgetUtilization = null;
    this._cachedBudgetVariance = null;
  }

  private getTotalExpenses(): number {
    return this.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getTopSpendingCategory(): { name: string; percentage: number } | null {
    const categoryAnalysis = this.generateCategoryAnalysis();
    return categoryAnalysis.length > 0 ? categoryAnalysis[0] : null;
  }

  exportReport(format: 'pdf' | 'csv' | 'excel'): void {
    if (!this.reportData) {
      console.error('No report data available for export');
      return;
    }

    this.isLoading = true;

    // Use the new analytics API for report generation
    const reportOptions = {
      format: format,
      reportType: 'comprehensive',
      startDate: new Date(this.startDate),
      endDate: new Date(this.endDate),
      includeCharts: false,
      includeInsights: true,
      includeRecommendations: true
    };

    // Call the analytics API for report generation
    this.http.post(`${environment.apiUrl}/analytics/reports/generate`, reportOptions, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${this.tokenService.getAccessToken()}`
      }
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `financial-report-${this.selectedReportType}-${new Date().toISOString().split('T')[0]}.${format}`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error exporting report:', error);
        this.isLoading = false;
        alert('Failed to export report. Please try again.');
      }
    });
  }

  printReport(): void {
    window.print();
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  getCurrentDate(): Date {
    return new Date();
  }

  private mapPeriodToReportType(period: string): 'monthly' | 'quarterly' | 'yearly' | 'custom' {
    switch (period) {
      case 'week':
      case 'month':
        return 'monthly';
      case 'quarter':
        return 'quarterly';
      case 'year':
        return 'yearly';
      case 'custom':
        return 'custom';
      default:
        return 'monthly';
    }
  }

  getAvailableCurrencies(): string[] {
    return Object.keys(this.currencyReports);
  }

  hasMultipleCurrencies(): boolean {
    return Object.keys(this.currencyReports).length > 1;
  }

  getReportForCurrency(currency: string): FinancialReport | null {
    return this.currencyReports[currency] || null;
  }

  // Helper methods for detailed report
  getIncomePercentage(): number {
    if (this._cachedIncomePercentage !== null) {
      return this._cachedIncomePercentage;
    }
    const total = (this.reportData?.summary?.totalIncome ?? 0) + (this.reportData?.summary?.totalExpenses ?? 0);
    this._cachedIncomePercentage = total > 0 ? ((this.reportData?.summary?.totalIncome ?? 0) / total) * 100 : 0;
    return this._cachedIncomePercentage;
  }

  getExpensePercentage(): number {
    if (this._cachedExpensePercentage !== null) {
      return this._cachedExpensePercentage;
    }
    const total = (this.reportData?.summary?.totalIncome ?? 0) + (this.reportData?.summary?.totalExpenses ?? 0);
    this._cachedExpensePercentage = total > 0 ? ((this.reportData?.summary?.totalExpenses ?? 0) / total) * 100 : 0;
    return this._cachedExpensePercentage;
  }

  // Helper methods for trend analysis
  getTotalIncome(): number {
    if (this._cachedTotalIncome !== null) {
      return this._cachedTotalIncome;
    }
    if (!this.reportData?.trends) {
      this._cachedTotalIncome = 0;
      return 0;
    }
    this._cachedTotalIncome = this.reportData.trends.reduce((sum, trend) => sum + (trend.income || 0), 0);
    return this._cachedTotalIncome!;
  }

  getTotalExpensesForTrends(): number {
    if (this._cachedTotalExpenses !== null) {
      return this._cachedTotalExpenses;
    }
    if (!this.reportData?.trends) {
      this._cachedTotalExpenses = 0;
      return 0;
    }
    this._cachedTotalExpenses = this.reportData.trends.reduce((sum, trend) => sum + (trend.expenses || 0), 0);
    return this._cachedTotalExpenses!;
  }

  getNetTrend(): number {
    if (this._cachedNetTrend !== null) {
      return this._cachedNetTrend;
    }
    this._cachedNetTrend = this.getTotalIncome() - this.getTotalExpensesForTrends();
    return this._cachedNetTrend;
  }

  getBarHeight(value: number, type: string): number {
    const maxValue = Math.max(
      this.getTotalIncome(),
      this.getTotalExpensesForTrends(),
      Math.abs(this.getNetTrend())
    );
    return maxValue > 0 ? (Math.abs(value) / maxValue) * 100 : 0;
  }

  getTrendChange(trend: any, index: number): number {
    if (!this.reportData?.trends || index === 0) return 0;
    const previousTrend = this.reportData.trends[index - 1];
    if (!previousTrend) return 0;
    
    const currentNet = trend.net || 0;
    const previousNet = previousTrend.net || 0;
    
    if (previousNet === 0) return 0;
    return ((currentNet - previousNet) / Math.abs(previousNet)) * 100;
  }

  // Helper methods for budget analysis
  getBudgetAmount(): number {
    if (this._cachedBudgetAmount !== null) {
      return this._cachedBudgetAmount;
    }
    // For now, use total expenses as budget amount
    // In a real implementation, this would come from budget data
    this._cachedBudgetAmount = (this.reportData?.summary?.totalExpenses ?? 0) * 1.2; // 20% buffer
    return this._cachedBudgetAmount;
  }

  getBudgetUtilization(): number {
    if (this._cachedBudgetUtilization !== null) {
      return this._cachedBudgetUtilization;
    }
    const budget = this.getBudgetAmount();
    const actual = this.reportData?.summary?.totalExpenses ?? 0;
    this._cachedBudgetUtilization = budget > 0 ? (actual / budget) * 100 : 0;
    return this._cachedBudgetUtilization;
  }

  getBudgetVariance(): number {
    if (this._cachedBudgetVariance !== null) {
      return this._cachedBudgetVariance;
    }
    this._cachedBudgetVariance = (this.reportData?.summary?.totalExpenses ?? 0) - this.getBudgetAmount();
    return this._cachedBudgetVariance;
  }

  getBudgetPercentage(): number {
    return 100; // Budget is always 100% of itself
  }

  getActualPercentage(): number {
    return this.getBudgetUtilization();
  }

  getCategoryBudgetPercentage(category: any): number {
    const categoryAmount = category.total || category.amount || 0;
    const totalExpenses = this.reportData?.summary?.totalExpenses ?? 0;
    return totalExpenses > 0 ? (categoryAmount / totalExpenses) * 100 : 0;
  }

  // Math utility for template
  Math = Math;

}