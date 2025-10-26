import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil, timeout } from 'rxjs';
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
  selectedGranularity: string = 'auto'; // auto, days, weeks, months, quarters
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
  private _cachedOverallTrendAnalysis: string | null = null;

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

  // Available granularity options (simplified)
  granularityOptions = [
    { value: 'days', label: 'Daily', description: 'Show data by days' },
    { value: 'months', label: 'Monthly', description: 'Show data by months' }
  ];

  ngOnInit(): void {
    this.initializeDates();
    
    // Set default granularity based on initial period
    if (this.selectedPeriod === 'month') {
      this.selectedGranularity = 'days';
    }
    
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
        separateByCurrency: true, // Enable currency separation
        granularity: this.selectedGranularity // Add granularity option
    };

      console.log('Generating report with options:', reportOptions);

    this.financialService.generateFinancialReport(reportOptions).pipe(
      takeUntil(this.destroy$),
      timeout(30000) // 30 second timeout
    ).subscribe({
      next: (report) => {
        // Clear cached values when new data arrives
        this.clearCachedValues();
          
          console.log('Report response received:', report);
        console.log('Report type:', typeof report);
        console.log('Report keys:', report ? Object.keys(report) : 'null');
        
        // Check if the response is currency-separated
        // Currency-separated reports are objects with currency keys (USD, EUR, etc.)
        // Single currency reports have a reportType property
        if (report && typeof report === 'object' && !(report as any).reportType && Object.keys(report).length > 0) {
          // Check if keys look like currency codes (3 letters)
          const keys = Object.keys(report);
          const hasCurrencyKeys = keys.some(key => key.length === 3 && key === key.toUpperCase());
          
          console.log('Keys found:', keys);
          console.log('Has currency keys:', hasCurrencyKeys);
          
          if (hasCurrencyKeys) {
            // This is a currency-separated response
            console.log('Currency-separated response detected');
            this.currencyReports = report as unknown as {[currency: string]: FinancialReport};
            this.reportData = null; // Clear single currency report
            // Set the currency with the most transactions as selected
            const currencies = Object.keys(this.currencyReports);
            if (currencies.length > 0) {
              this.selectedCurrency = this.getPrimaryCurrency(currencies);
            }
            console.log('Available currencies:', currencies);
          } else {
            // This is a single currency response
            console.log('Single currency response detected');
            this.reportData = report as FinancialReport;
            this.currencyReports = {}; // Clear currency reports
            this.selectedCurrency = '';
          }
        } else {
          // This is a single currency response
          console.log('Single currency response (fallback)');
          this.reportData = report as FinancialReport;
          this.currencyReports = {}; // Clear currency reports
          this.selectedCurrency = '';
        }
        // Clear all caches before triggering change detection
        this.clearCachedValues();
        this.isLoading = false;
        
        // Use setTimeout to avoid change detection issues
        setTimeout(() => {
        this.cdr.detectChanges();
        }, 0);
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
    
    // Set appropriate default granularity based on period
    if (period === 'month') {
      this.selectedGranularity = 'days'; // Daily for monthly view
    } else if (period === 'quarter') {
      this.selectedGranularity = 'days'; // Daily for quarterly view  
    } else if (period === 'year') {
      this.selectedGranularity = 'months'; // Monthly for yearly view
    } else {
      this.selectedGranularity = 'days'; // Default to daily
    }
    
    this.clearCachedValues();
    this.loadData();
  }

  onReportTypeChange(reportType: string): void {
    this.selectedReportType = reportType;
    this.clearCachedValues();
    this.loadData(); // Reload data from API instead of local generation
  }

  onGranularityChange(granularity: string): void {
    console.log('Granularity changed to:', granularity);
    this.selectedGranularity = granularity;
    this.clearCachedValues();
    
    // Force reload with new granularity
    this.isLoading = true;
    this.loadData();
  }

  getGranularityDescription(granularity: string): string {
    const option = this.granularityOptions.find(opt => opt.value === granularity);
    return option ? option.description : '';
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
        // Last 3 months from today
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
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
    const categoryMap = new Map<string, { income: number; expenses: number; count: number }>();

    // Process all transactions (both income and expenses) to calculate net amounts per category
    this.transactions.forEach(transaction => {
      const categoryName = this.getCategoryName(transaction.categoryId);
      const current = categoryMap.get(categoryName) || { income: 0, expenses: 0, count: 0 };
      
      if (transaction.type === TransactionType.INCOME) {
        current.income += transaction.amount;
      } else if (transaction.type === TransactionType.EXPENSE) {
        current.expenses += transaction.amount;
      }
      current.count += 1;
      categoryMap.set(categoryName, current);
    });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => {
        const netAmount = data.income - data.expenses;
        const totalAmount = Math.abs(netAmount);
        const totalExpenses = this.getTotalExpenses();
        
        return {
          name,
          amount: netAmount, // Net amount (income - expenses)
          income: data.income,
          expenses: data.expenses,
          count: data.count,
          percentage: totalExpenses > 0 ? (totalAmount / totalExpenses) * 100 : 0,
          isPositive: netAmount >= 0 // Flag to determine color
        };
      })
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)); // Sort by absolute value to show largest impact first
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
    this._cachedOverallTrendAnalysis = null;
  }

  // Clear cached values when currency changes
  onCurrencyChange(currency: string): void {
    this.selectedCurrency = currency;
    this.clearCachedValues();
    
    // Use setTimeout to avoid change detection issues
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 0);
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
    // Use a more stable approach to avoid change detection issues
    try {
      return this.currencyReports && Object.keys(this.currencyReports).length > 1;
    } catch (error) {
      return false;
    }
  }

  getReportForCurrency(currency: string): FinancialReport | null {
    return this.currencyReports[currency] || null;
  }

  // Get the current report data (either single currency or selected currency)
  getCurrentReportData(): any {
    try {
      if (this.hasMultipleCurrencies() && this.selectedCurrency) {
        return this.getReportForCurrency(this.selectedCurrency);
      }
      return this.reportData;
    } catch (error) {
      console.error('Error in getCurrentReportData:', error);
      return null;
    }
  }

  // Get the current summary data (either single currency or selected currency)
  getCurrentSummary(): any {
    try {
      const currentReport = this.getCurrentReportData();
      return currentReport?.summary;
    } catch (error) {
      console.error('Error in getCurrentSummary:', error);
      return null;
    }
  }

  // Get the current currency (either from selected currency or default)
  getCurrentCurrency(): string {
    try {
      if (this.hasMultipleCurrencies() && this.selectedCurrency) {
        return this.selectedCurrency;
      }
      // Default to USD if no currency is selected
      return 'USD';
    } catch (error) {
      console.error('Error in getCurrentCurrency:', error);
      return 'USD';
    }
  }

  // Get the primary currency (the one with the most transactions or highest total)
  getPrimaryCurrency(currencies: string[]): string {
    if (currencies.length === 0) return 'USD';
    if (currencies.length === 1) return currencies[0];

    let primaryCurrency = currencies[0];
    let maxTransactions = 0;
    let maxTotal = 0;

    for (const currency of currencies) {
      const report = this.currencyReports[currency];
      if (report?.summary) {
        const transactionCount = report.summary.transactionCount || 0;
        const totalAmount = (report.summary.totalIncome || 0) + (report.summary.totalExpenses || 0);
        
        // Prioritize currency with most transactions, then highest total
        if (transactionCount > maxTransactions || 
            (transactionCount === maxTransactions && totalAmount > maxTotal)) {
          primaryCurrency = currency;
          maxTransactions = transactionCount;
          maxTotal = totalAmount;
        }
      }
    }

    return primaryCurrency;
  }

  // Helper methods for detailed report
  getIncomePercentage(): number {
    if (this._cachedIncomePercentage !== null) {
      return this._cachedIncomePercentage;
    }
    const summary = this.getCurrentSummary();
    const total = (summary?.totalIncome ?? 0) + (summary?.totalExpenses ?? 0);
    this._cachedIncomePercentage = total > 0 ? ((summary?.totalIncome ?? 0) / total) * 100 : 0;
    return this._cachedIncomePercentage;
  }

  getExpensePercentage(): number {
    if (this._cachedExpensePercentage !== null) {
      return this._cachedExpensePercentage;
    }
    const summary = this.getCurrentSummary();
    const total = (summary?.totalIncome ?? 0) + (summary?.totalExpenses ?? 0);
    this._cachedExpensePercentage = total > 0 ? ((summary?.totalExpenses ?? 0) / total) * 100 : 0;
    return this._cachedExpensePercentage;
  }

  // Helper methods for trend analysis
  getTotalIncome(): number {
    if (this._cachedTotalIncome !== null) {
      return this._cachedTotalIncome;
    }
    const currentReport = this.getCurrentReportData();
    if (!currentReport?.trends) {
      this._cachedTotalIncome = 0;
      return 0;
    }
    this._cachedTotalIncome = currentReport.trends.reduce((sum: number, trend: any) => sum + (trend.income || 0), 0);
    return this._cachedTotalIncome!;
  }

  getTotalExpensesForTrends(): number {
    if (this._cachedTotalExpenses !== null) {
      return this._cachedTotalExpenses;
    }
    const currentReport = this.getCurrentReportData();
    if (!currentReport?.trends) {
      this._cachedTotalExpenses = 0;
      return 0;
    }
    this._cachedTotalExpenses = currentReport.trends.reduce((sum: number, trend: any) => sum + (trend.expenses || 0), 0);
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
    try {
      const currentReport = this.getCurrentReportData();
      if (!currentReport?.trends || currentReport.trends.length < 2) return 0;
      
      // For trend analysis, compare current period with a meaningful baseline
      // Use the most recent period vs a previous period (not just the immediate previous)
    const currentNet = trend.net || 0;
      
      // Find a meaningful comparison point based on data length
      let comparisonIndex: number;
      if (currentReport.trends.length <= 7) {
        // For small datasets, compare with the last entry
        comparisonIndex = currentReport.trends.length - 1;
      } else if (currentReport.trends.length <= 30) {
        // For medium datasets, compare with 7 periods ago (weekly comparison)
        comparisonIndex = Math.max(0, index - 7);
      } else {
        // For large datasets, compare with 30 periods ago (monthly comparison)
        comparisonIndex = Math.max(0, index - 30);
      }
      
      // Don't compare with self
      if (comparisonIndex === index) {
        comparisonIndex = Math.max(0, index - 1);
      }
      
      const comparisonTrend = currentReport.trends[comparisonIndex];
      if (!comparisonTrend) return 0;
      
      const comparisonNet = comparisonTrend.net || 0;
      
      // Handle edge cases
      if (comparisonNet === 0) {
        return currentNet > 0 ? 100 : (currentNet < 0 ? -100 : 0);
      }
      
      // Calculate percentage change: ((new - old) / |old|) * 100
      const change = ((currentNet - comparisonNet) / Math.abs(comparisonNet)) * 100;
      
      // Ensure the result is a valid number
      if (isNaN(change) || !isFinite(change)) {
        return 0;
      }
      
      return change;
    } catch (error) {
      console.error('Error in getTrendChange:', error);
      return 0;
    }
  }

  // Get income trend change
  getIncomeTrendChange(trend: any, index: number): number {
    const currentReport = this.getCurrentReportData();
    if (!currentReport?.trends || index === 0) return 0;
    const previousTrend = currentReport.trends[index - 1];
    if (!previousTrend) return 0;
    
    const currentIncome = trend.income || 0;
    const previousIncome = previousTrend.income || 0;
    
    if (previousIncome === 0) {
      return currentIncome > 0 ? 100 : 0;
    }
    
    return ((currentIncome - previousIncome) / previousIncome) * 100;
  }

  // Get expense trend change
  getExpenseTrendChange(trend: any, index: number): number {
    const currentReport = this.getCurrentReportData();
    if (!currentReport?.trends || index === 0) return 0;
    const previousTrend = currentReport.trends[index - 1];
    if (!previousTrend) return 0;
    
    const currentExpense = trend.expenses || 0;
    const previousExpense = previousTrend.expenses || 0;
    
    if (previousExpense === 0) {
      return currentExpense > 0 ? 100 : 0;
    }
    
    return ((currentExpense - previousExpense) / previousExpense) * 100;
  }

  // Get trend direction (improving, declining, stable)
  getTrendDirection(trend: any, index: number): 'improving' | 'declining' | 'stable' {
    const change = this.getTrendChange(trend, index);
    
    // For the first month (current), base direction on net value, not change
    if (index === 0) {
      const netValue = trend.net || 0;
      if (netValue > 0) return 'improving';
      if (netValue < 0) return 'declining';
      return 'stable';
    }
    
    // For subsequent months, use percentage change
    if (Math.abs(change) < 5) return 'stable';
    
    // For net values: positive change means improving financial position
    return change > 0 ? 'improving' : 'declining';
  }

  // Get overall trend analysis
  getOverallTrendAnalysis(): string {
    if (this._cachedOverallTrendAnalysis !== null) {
      return this._cachedOverallTrendAnalysis;
    }
    
    try {
      const currentReport = this.getCurrentReportData();
      if (!currentReport?.trends || currentReport.trends.length === 0) {
        this._cachedOverallTrendAnalysis = 'Insufficient data';
        return this._cachedOverallTrendAnalysis;
      }
      
      const trends = currentReport.trends;
      
      // For single period, base analysis on net value
      if (trends.length === 1) {
        const netValue = trends[0].net || 0;
        if (netValue > 1000) this._cachedOverallTrendAnalysis = 'Strong Growth';
        else if (netValue > 0) this._cachedOverallTrendAnalysis = 'Growing';
        else if (netValue > -1000) this._cachedOverallTrendAnalysis = 'Declining';
        else this._cachedOverallTrendAnalysis = 'Strong Decline';
        return this._cachedOverallTrendAnalysis;
      }
      
      // For multiple periods, analyze total net value (not average)
      const netValues = trends.map((trend: any) => trend.net || 0);
      const totalNet = netValues.reduce((sum: number, net: number) => sum + net, 0);
      
      if (totalNet > 1000) this._cachedOverallTrendAnalysis = 'Strong Growth';
      else if (totalNet > 0) this._cachedOverallTrendAnalysis = 'Growing';
      else if (totalNet > -1000) this._cachedOverallTrendAnalysis = 'Declining';
      else this._cachedOverallTrendAnalysis = 'Strong Decline';
      
      return this._cachedOverallTrendAnalysis;
      
    } catch (error) {
      console.error('Error in getOverallTrendAnalysis:', error);
      this._cachedOverallTrendAnalysis = 'Analysis Error';
      return this._cachedOverallTrendAnalysis;
    }
  }

  // Get period length in months for display
  getPeriodLength(): number {
    // Return period length based on selected period, not actual data
    switch (this.selectedPeriod) {
      case 'week':
        return 1; // 1 week = ~0.25 months, but show as 1 for simplicity
      case 'month':
        return 1;
      case 'quarter':
        return 3;
      case 'year':
        return 12;
      default:
        return 1;
    }
  }

  // Get latest change as absolute value (not percentage)
  getLatestChangeAbsolute(): number {
    const currentReport = this.getCurrentReportData();
    if (!currentReport?.trends || currentReport.trends.length === 0) return 0;
    
    // Calculate total net for the entire period
    const totalNet = currentReport.trends.reduce((sum: number, trend: any) => sum + (trend.net || 0), 0);
    return totalNet;
  }

  // Get max net value for percentage calculation
  getMaxNetValue(): number {
    const currentReport = this.getCurrentReportData();
    if (!currentReport?.trends || currentReport.trends.length === 0) return 1;
    
    const maxValue = Math.max(...currentReport.trends.map((t: any) => Math.abs(t.net || 0)));
    return Math.max(maxValue, 1); // Ensure we don't divide by 0
  }

  // Get net percentage for a trend
  getNetPercentage(trend: any): number {
    const maxValue = this.getMaxNetValue();
    return Math.min((Math.abs(trend.net || 0) / maxValue) * 100, 100);
  }

  // Format date based on granularity
  formatTrendDate(trend: any): string {
    if (!trend.month) return '';
    
    const date = new Date(trend.month);
    
    // Check if we have daily granularity by looking at the period field
    if (trend.period && trend.period.includes('-') && trend.period.length === 10) {
      // Daily data - show full date
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }); // Format: "25 Oct 2025"
    } else {
      // Monthly data - show month and year
      return date.toLocaleDateString('en-GB', {
        month: 'short',
        year: 'numeric'
      }); // Format: "Oct 2025"
    }
  }

  // Get trend indicator icon
  getTrendIcon(trend: any, index: number): string {
    const direction = this.getTrendDirection(trend, index);
    switch (direction) {
      case 'improving': return 'fas fa-arrow-up';
      case 'declining': return 'fas fa-arrow-down';
      default: return 'fas fa-minus';
    }
  }

  // Get trend color class
  getTrendColorClass(trend: any, index: number): string {
    const direction = this.getTrendDirection(trend, index);
    switch (direction) {
      case 'improving': return 'trend-improving';
      case 'declining': return 'trend-declining';
      default: return 'trend-stable';
    }
  }

  // Get overall trend color class
  getOverallTrendColorClass(): string {
    try {
      const analysis = this.getOverallTrendAnalysis();
      switch (analysis) {
        case 'Strong Growth':
        case 'Growing':
          return 'trend-improving';
        case 'Declining':
        case 'Strong Decline':
          return 'trend-declining';
        default:
          return 'trend-stable';
      }
    } catch (error) {
      console.error('Error in getOverallTrendColorClass:', error);
      return 'trend-stable';
    }
  }

  // Get Y-axis tick values for the line chart
  getYAxisTicks(): number[] {
    const currentReport = this.getCurrentReportData();
    if (!currentReport?.trends || currentReport.trends.length === 0) return [0, 1000, 2000, 3000, 4000, 5000];
    
    // Find max value across all trends
    const maxValue = Math.max(...currentReport.trends.map((trend: any) => 
      Math.max(Math.abs(trend.income || 0), Math.abs(trend.expenses || 0), Math.abs(trend.net || 0))
    ));
    
    if (maxValue === 0) return [0, 1000, 2000, 3000, 4000, 5000];
    
    // Generate nice round numbers
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
    const normalizedMax = Math.ceil(maxValue / magnitude) * magnitude;
    const step = normalizedMax / 5;
    
    return [0, step, step * 2, step * 3, step * 4, normalizedMax];
  }

  // Get Y-axis position for a value
  getYAxisPosition(value: number): number {
    const currentReport = this.getCurrentReportData();
    if (!currentReport?.trends || currentReport.trends.length === 0) return 400;
    
    const maxValue = Math.max(...currentReport.trends.map((trend: any) => 
      Math.max(Math.abs(trend.income || 0), Math.abs(trend.expenses || 0), Math.abs(trend.net || 0))
    ));
    
    if (maxValue === 0) return 400;
    
    // Convert value to Y position (inverted for SVG)
    // Use full chart height (50 to 400)
    const percentage = Math.abs(value) / maxValue;
    const yPos = 400 - (percentage * 350); // 400 is bottom, 50 is top
    return Math.max(50, Math.min(400, yPos)); // Clamp between 50 and 400
  }

  // Get X-axis position for an index
  getXAxisPosition(index: number): number {
    const currentReport = this.getCurrentReportData();
    if (!currentReport?.trends || currentReport.trends.length === 0) return 200;
    
    const totalPoints = currentReport.trends.length;
    const startX = 100; // Use more space
    const endX = 800;   // Use more space
    const step = totalPoints > 1 ? (endX - startX) / (totalPoints - 1) : 0;
    
    const xPos = startX + (index * step);
    return Math.max(100, Math.min(800, xPos)); // Clamp between 100 and 800
  }

  // Get line chart points for a specific type
  getLineChartPoints(type: 'income' | 'expense' | 'net'): string {
    const currentReport = this.getCurrentReportData();
    if (!currentReport?.trends || currentReport.trends.length === 0) return '';
    
    const points: string[] = [];
    
    currentReport.trends.forEach((trend: any, index: number) => {
      let value = 0;
      switch (type) {
        case 'income': value = trend.income || 0; break;
        case 'expense': value = trend.expenses || 0; break;
        case 'net': value = trend.net || 0; break;
      }
      
      const x = this.getXAxisPosition(index);
      const y = this.getYAxisPosition(value);
      points.push(`${x},${y}`);
    });
    
    return points.join(' ');
  }

  // Generate SVG path points for trend lines
  getTrendLinePoints(type: 'income' | 'expense' | 'net'): string {
    const currentReport = this.getCurrentReportData();
    if (!currentReport?.trends || currentReport.trends.length < 2) return '';
    
    const trends = currentReport.trends;
    const points: string[] = [];
    
    // Find max and min values for proper scaling
    const values = trends.map((trend: any) => {
      switch (type) {
        case 'income': return Math.abs(trend.income || 0);
        case 'expense': return Math.abs(trend.expenses || 0);
        case 'net': return Math.abs(trend.net || 0);
        default: return 0;
      }
    });
    
    const maxValue = Math.max(...values);
    if (maxValue === 0) return '';
    
    trends.forEach((trend: any, index: number) => {
      let value = 0;
      switch (type) {
        case 'income': value = Math.abs(trend.income || 0); break;
        case 'expense': value = Math.abs(trend.expenses || 0); break;
        case 'net': value = Math.abs(trend.net || 0); break;
      }
      
      // Calculate position with proper alignment to match bars
      const barWidth = 80; // Width of each bar area
      const barSpacing = 20; // Space between bars
      const totalWidth = (trends.length - 1) * (barWidth + barSpacing) + barWidth;
      const startX = (100 - totalWidth) / 2; // Center the bars
      
      const x = startX + index * (barWidth + barSpacing) + barWidth / 2; // Center of each bar
      const y = 90 - (value / maxValue) * 80; // 10% to 90% of height, inverted
      
      points.push(`${x},${y}`);
    });
    
    return points.join(' ');
  }

  // Helper methods for budget analysis
  getBudgetAmount(): number {
    if (this._cachedBudgetAmount !== null) {
      return this._cachedBudgetAmount;
    }
    // For now, use total expenses as budget amount
    // In a real implementation, this would come from budget data
    const summary = this.getCurrentSummary();
    this._cachedBudgetAmount = (summary?.totalExpenses ?? 0) * 1.2; // 20% buffer
    return this._cachedBudgetAmount;
  }

  getBudgetUtilization(): number {
    if (this._cachedBudgetUtilization !== null) {
      return this._cachedBudgetUtilization;
    }
    const budget = this.getBudgetAmount();
    const summary = this.getCurrentSummary();
    const actual = summary?.totalExpenses ?? 0;
    this._cachedBudgetUtilization = budget > 0 ? (actual / budget) * 100 : 0;
    return this._cachedBudgetUtilization;
  }

  getBudgetVariance(): number {
    if (this._cachedBudgetVariance !== null) {
      return this._cachedBudgetVariance;
    }
    const summary = this.getCurrentSummary();
    this._cachedBudgetVariance = (summary?.totalExpenses ?? 0) - this.getBudgetAmount();
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
    const summary = this.getCurrentSummary();
    const totalExpenses = summary?.totalExpenses ?? 0;
    return totalExpenses > 0 ? (categoryAmount / totalExpenses) * 100 : 0;
  }

  // Math utility for template
  Math = Math;

}