import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { FinancialDashboard, CategoryStats, Transaction } from '../../core/models/financial.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { FinancialService } from '../../core/services/financial.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // Services
  private dashboardService = inject(DashboardService);
  private financialService = inject(FinancialService);
  private categoryService = inject(CategoryService);
  private transactionService = inject(TransactionService);

  // Component state
  private destroy$ = new Subject<void>();

  // Loading states
  isDashboardLoading = false;
  isChartDataLoading = false;
  isRecentTransactionsLoading = false;
  isCategoryStatsLoading = false;
  isQuickActionsLoading = false;

  // Data properties
  dashboardData: FinancialDashboard | null = null;
  recentTransactions: Transaction[] = [];
  categoryStats: CategoryStats | null = null;
  error: string | null = null;

  // Chart data
  spendingChartData: any[] = [];
  incomeChartData: any[] = [];
  categoryChartData: any[] = [];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.isDashboardLoading = true;
    this.error = null;

    // Load all dashboard data in parallel
    const dashboardData$ = this.financialService.getFinancialDashboard();
    const recentTransactions$ = this.transactionService.getUserTransactions({ limit: 5 });
    const categoryStats$ = this.categoryService.getCategoryStats();

    combineLatest([dashboardData$, recentTransactions$, categoryStats$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([dashboardData, transactionsResponse, stats]) => {
          this.dashboardData = dashboardData;
          this.recentTransactions = transactionsResponse.data;
          this.categoryStats = stats;
          
          // Prepare chart data
          this.prepareChartData();
          
          this.isDashboardLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to load dashboard data';
          console.error('Dashboard loading error:', error);
          this.isDashboardLoading = false;
        }
      });
  }

  private prepareChartData(): void {
    if (this.dashboardData) {
      // Prepare spending trends data - using spendingTrends from FinancialDashboard
      this.spendingChartData = this.dashboardData.spendingTrends?.map(item => ({
        month: item.month,
        amount: item.expenses || 0
      })) || [];

      // Prepare income data - using monthly income from overview
      this.incomeChartData = [{
        month: 'Current Month',
        amount: this.dashboardData.overview?.monthlyIncome || 0
      }];

      // Prepare category data from top categories
      this.categoryChartData = this.dashboardData.topCategories?.map(item => ({
        category: item.name,
        amount: item.amount,
        percentage: item.percentage
      })) || [];
    }
  }

  // Refresh methods
  refreshDashboard(): void {
    this.loadDashboardData();
  }

  refreshTransactions(): void {
    this.isRecentTransactionsLoading = true;
    this.transactionService.getUserTransactions({ limit: 5 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentTransactions = response.data;
          this.isRecentTransactionsLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to refresh transactions';
          console.error('Transaction refresh error:', error);
          this.isRecentTransactionsLoading = false;
        }
      });
  }

  refreshCategoryStats(): void {
    this.isCategoryStatsLoading = true;
    this.categoryService.getCategoryStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.categoryStats = stats;
          this.isCategoryStatsLoading = false;
        },
        error: (error) => {
          this.error = 'Failed to refresh category stats';
          console.error('Category stats refresh error:', error);
          this.isCategoryStatsLoading = false;
        }
      });
  }

  // Helper methods
  getTotalBalance(): number {
    return this.dashboardData?.overview?.totalBalance || 0;
  }

  getTotalIncome(): number {
    return this.dashboardData?.overview?.monthlyIncome || 0;
  }

  getTotalExpenses(): number {
    return this.dashboardData?.overview?.monthlyExpenses || 0;
  }

  getSavingsRate(): number {
    if (!this.dashboardData?.overview?.monthlyIncome) return 0;
    return ((this.dashboardData.overview.monthlyIncome - this.dashboardData.overview.monthlyExpenses) / this.dashboardData.overview.monthlyIncome) * 100;
  }

  getNetWorth(): number {
    return this.dashboardData?.overview?.monthlyNet || 0;
  }

  // Get category name by ID
  getCategoryName(categoryId: string): string {
    if (!categoryId || !this.categoryStats?.topCategories) return 'Unknown';
    const category = this.categoryStats.topCategories.find(cat => cat.categoryId === categoryId);
    return category?.name || 'Unknown';
  }

  // Error handling
  clearError(): void {
    this.error = null;
  }

  // Loading state helpers
  get isLoading(): boolean {
    return this.isDashboardLoading || this.isChartDataLoading || this.isRecentTransactionsLoading || 
           this.isCategoryStatsLoading || this.isQuickActionsLoading;
  }

  get isDataLoaded(): boolean {
    return !this.isLoading && !this.error && this.dashboardData !== null;
  }
}