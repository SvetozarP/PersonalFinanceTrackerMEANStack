import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, interval } from 'rxjs';
import { 
  FinancialDashboard, 
  Transaction, 
  TransactionType, 
  TransactionStatus,
  Category 
} from '../../../../core/models/financial.model';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { FormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-financial-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './financial-dashboard.html',
  styleUrls: ['./financial-dashboard.scss']
})
export class FinancialDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private financialService = inject(FinancialService);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);

  dashboard: FinancialDashboard | null = null;
  recentTransactions: Transaction[] = [];
  categories: Category[] = [];
  
  // Granular loading states
  isDashboardLoading = false;
  isTransactionsLoading = false;
  isCategoriesLoading = false;
  isRefreshing = false;
  
  error: string | null = null;
  
  // Date range for dashboard
  selectedPeriod: 'week' | 'month' | 'quarter' | 'year' = 'month';
  customDateRange = { start: '', end: '' };
  
  // Auto-refresh interval (5 minutes)
  private refreshInterval = 5 * 60 * 1000;

  ngOnInit(): void {
    this.loadDashboard();
    this.loadRecentTransactions();
    this.loadCategories();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupAutoRefresh(): void {
    interval(this.refreshInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.refreshDashboard();
      });
  }

  private loadDashboard(): void {
    this.isDashboardLoading = true;
    this.error = null;

    const options = {
      startDate: this.getStartDate(),
      endDate: new Date(),
      accountId: undefined // Will use default account
    };

    this.financialService.getFinancialDashboard(options)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dashboard) => {
          this.dashboard = dashboard;
          this.isDashboardLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load dashboard';
          this.isDashboardLoading = false;
          console.error('Error loading dashboard:', error);
        }
      });
  }

  private loadRecentTransactions(): void {
    this.isTransactionsLoading = true;
    
    this.transactionService.getUserTransactions({ limit: 10 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentTransactions = response.data;
          this.isTransactionsLoading = false;
        },
        error: (error) => {
          console.error('Error loading recent transactions:', error);
          this.isTransactionsLoading = false;
        }
      });
  }

  private loadCategories(): void {
    this.isCategoriesLoading = true;
    
    this.categoryService.getUserCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.isCategoriesLoading = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.isCategoriesLoading = false;
        }
      });
  }

  private refreshDashboard(): void {
    this.isRefreshing = true;
    
    // Load all data in parallel
    Promise.all([
      this.loadDashboardAsync(),
      this.loadRecentTransactionsAsync(),
      this.loadCategoriesAsync()
    ]).finally(() => {
      this.isRefreshing = false;
    });
  }

  // Synchronous version for testing compatibility
  private refreshDashboardSync(): void {
    this.loadDashboard();
    this.loadRecentTransactions();
    this.loadCategories();
  }

  private async loadDashboardAsync(): Promise<void> {
    return new Promise((resolve) => {
      const options = {
        startDate: this.getStartDate(),
        endDate: new Date(),
        accountId: undefined
      };

      this.financialService.getFinancialDashboard(options)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (dashboard) => {
            this.dashboard = dashboard;
            resolve();
          },
          error: (error) => {
            this.error = 'Failed to refresh dashboard';
            console.error('Error refreshing dashboard:', error);
            resolve();
          }
        });
    });
  }

  private async loadRecentTransactionsAsync(): Promise<void> {
    return new Promise((resolve) => {
      this.transactionService.getUserTransactions({ limit: 10 })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.recentTransactions = response.data;
            resolve();
          },
          error: (error) => {
            console.error('Error refreshing recent transactions:', error);
            resolve();
          }
        });
    });
  }

  private async loadCategoriesAsync(): Promise<void> {
    return new Promise((resolve) => {
      this.categoryService.getUserCategories()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (categories) => {
            this.categories = categories;
            resolve();
          },
          error: (error) => {
            console.error('Error refreshing categories:', error);
            resolve();
          }
        });
    });
  }

  onPeriodChange(period: 'week' | 'month' | 'quarter' | 'year'): void {
    this.selectedPeriod = period;
    this.loadDashboard();
  }

  onCustomDateChange(): void {
    if (this.customDateRange.start && this.customDateRange.end) {
      this.loadDashboard();
    }
  }

  onRefresh(): void {
    this.refreshDashboard();
  }

  // Helper methods for template
  private getStartDate(): Date {
    const now = new Date();
    const startDate = new Date(now);

    switch (this.selectedPeriod) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return startDate;
  }

  // Budget progress helper method
  getBudgetProgressPercentage(spent: number, budget: number): number {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  }

  // Formatting methods
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatPercentage(value: number, total: number): string {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(1)}%`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  // Transaction helpers
  getTransactionTypeIcon(type: TransactionType): string {
    switch (type) {
      case TransactionType.INCOME: return '💰';
      case TransactionType.EXPENSE: return '💸';
      case TransactionType.TRANSFER: return '🔄';
      case TransactionType.ADJUSTMENT: return '⚖️';
      default: return '';
    }
  }

  getTransactionStatusClass(status: TransactionStatus): string {
    switch (status) {
      case TransactionStatus.COMPLETED: return 'status-completed';
      case TransactionStatus.PENDING: return 'status-pending';
      case TransactionStatus.FAILED: return 'status-failed';
      case TransactionStatus.CANCELLED: return 'status-cancelled';
      default: return 'status-unknown';
    }
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown';
  }

  getCategoryColor(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category?.color || '#667eea';
  }

  // Dashboard data helpers - using safe navigation
  getTotalBalance(): number {
    return this.dashboard?.overview?.totalBalance || 0;
  }

  getMonthlyIncome(): number {
    return this.dashboard?.overview?.monthlyIncome || 0;
  }

  getMonthlyExpenses(): number {
    return this.dashboard?.overview?.monthlyExpenses || 0;
  }

  getMonthlyNet(): number {
    return this.dashboard?.overview?.monthlyNet || 0;
  }

  getPendingTransactionsCount(): number {
    return this.dashboard?.overview?.pendingTransactions || 0;
  }

  getUpcomingRecurringCount(): number {
    return this.dashboard?.overview?.upcomingRecurring || 0;
  }

  // Chart data helpers - using safe navigation
  getTopCategories(): any[] {
    return this.dashboard?.topCategories || [];
  }

  getSpendingTrends(): any[] {
    return this.dashboard?.spendingTrends || [];
  }

  getBudgetStatus(): any[] {
    return this.dashboard?.budgetStatus || [];
  }

  // Navigation helpers
  navigateToTransactions(): void {
    // This would use Router to navigate to transactions page
    console.log('Navigate to transactions');
  }

  navigateToCategories(): void {
    // This would use Router to navigate to categories page
    console.log('Navigate to categories');
  }

  navigateToReports(): void {
    // This would use Router to navigate to reports page
    console.log('Navigate to reports');
  }

  // Utility methods
  isPositive(value: number): boolean {
    return value >= 0;
  }

  getChangeIndicator(value: number): string {
    if (value > 0) return '↗️';
    if (value < 0) return '↘️';
    return '→';
  }

  getChangeClass(value: number): string {
    if (value > 0) return 'change-positive';
    if (value < 0) return 'change-negative';
    return 'change-neutral';
  }

  // Quick actions
  addTransaction(): void {
    // This would navigate to add transaction form
    console.log('Add transaction');
  }

  addCategory(): void {
    // This would navigate to add category form
    console.log('Add category');
  }

  exportData(): void {
    // This would trigger data export
    console.log('Export data');
  }

  // Check if any data is loading
  get isLoading(): boolean {
    return this.isDashboardLoading || this.isTransactionsLoading || this.isCategoriesLoading;
  }

  // Check if any specific section is loading
  get isOverviewLoading(): boolean {
    return this.isDashboardLoading;
  }

  get isTransactionsSectionLoading(): boolean {
    return this.isTransactionsLoading;
  }

  get isCategoriesSectionLoading(): boolean {
    return this.isCategoriesLoading;
  }
}