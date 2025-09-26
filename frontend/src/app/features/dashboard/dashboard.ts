import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { FinancialDashboard, CategoryStats, Transaction } from '../../core/models/financial.model';
import { DashboardService } from '../../core/services/dashboard.service';
import { FinancialService } from '../../core/services/financial.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner';
import { AuthService } from '../../features/auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent,
    RouterLink,
    RouterModule,
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
  private authService = inject(AuthService);
  private router = inject(Router);

  // Component state
  private destroy$ = new Subject<void>();

  // Loading states
  isDashboardLoading = signal(false);
  isChartDataLoading = signal(false);
  isRecentTransactionsLoading = signal(false);
  isCategoryStatsLoading = signal(false);
  isQuickActionsLoading = signal(false);

  // Data properties
  dashboardData = signal<FinancialDashboard | null>(null);
  recentTransactions = signal<Transaction[]>([]);
  categoryStats = signal<CategoryStats | null>(null);
  error = signal<string | null>(null);

  // Chart data
  spendingChartData = signal<any[]>([]);
  incomeChartData = signal<any[]>([]);
  categoryChartData = signal<any[]>([]);

  // Computed properties
  isLoading = computed(() => 
    this.isDashboardLoading() || this.isChartDataLoading() || this.isRecentTransactionsLoading() || 
    this.isCategoryStatsLoading() || this.isQuickActionsLoading()
  );

  isDataLoaded = computed(() => 
    !this.isLoading() && !this.error() && this.dashboardData() !== null
  );

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.isDashboardLoading.set(true);
    this.error.set(null);

    // Load all dashboard data in parallel
    const dashboardData$ = this.financialService.getFinancialDashboard();
    const recentTransactions$ = this.transactionService.getUserTransactions({ limit: 5 });
    const categoryStats$ = this.categoryService.getCategoryStats();

    combineLatest([dashboardData$, recentTransactions$, categoryStats$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([dashboardData, transactionsResponse, stats]) => {
          this.dashboardData.set(dashboardData);
          this.recentTransactions.set(transactionsResponse.data);
          this.categoryStats.set(stats);
          
          // Prepare chart data
          this.prepareChartData();
          
          this.isDashboardLoading.set(false);
        },
        error: (error) => {
          this.error.set('Failed to load dashboard data');
          console.error('Dashboard loading error:', error);
          this.isDashboardLoading.set(false);
        }
      });
  }

  private prepareChartData(): void {
    const dashboardData = this.dashboardData();
    if (dashboardData) {
      // Prepare spending trends data - using spendingTrends from FinancialDashboard
      this.spendingChartData.set(dashboardData.spendingTrends?.map(item => ({
        month: item.month,
        amount: item.expenses || 0
      })) || []);

      // Prepare income data - using monthly income from overview
      this.incomeChartData.set([{
        month: 'Current Month',
        amount: dashboardData.overview?.monthlyIncome || 0
      }]);

      // Prepare category data from top categories
      this.categoryChartData.set(dashboardData.topCategories?.map(item => ({
        category: item.name,
        amount: item.totalAmount || item.amount || 0,
        percentage: item.percentage
      })) || []);
    }
  }

  private updateCategoryChartData(): void {
    const categoryStats = this.categoryStats();
    if (categoryStats?.topCategories) {
      this.categoryChartData.set(categoryStats.topCategories.map(item => ({
        category: item.name,
        amount: item.totalAmount,
        percentage: item.percentage
      })));
    }
  }

  // Refresh methods
  refreshDashboard(): void {
    this.loadDashboardData();
  }

  refreshTransactions(): void {
    this.isRecentTransactionsLoading.set(true);
    this.transactionService.getUserTransactions({ limit: 5 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentTransactions.set(response.data);
          this.isRecentTransactionsLoading.set(false);
        },
        error: (error) => {
          this.error.set('Failed to refresh transactions');
          console.error('Transaction refresh error:', error);
          this.isRecentTransactionsLoading.set(false);
        }
      });
  }

  refreshCategoryStats(): void {
    this.isCategoryStatsLoading.set(true);
    this.categoryService.getCategoryStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.categoryStats.set(stats);
          // Update the chart data when category stats are refreshed
          this.updateCategoryChartData();
          
          // Also try to refresh the dashboard data to get updated topCategories
          this.financialService.getFinancialDashboard()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (dashboardData) => {
                this.dashboardData.set(dashboardData);
                // Update category chart data from dashboard data if available
                if (dashboardData.topCategories) {
                  this.categoryChartData.set(dashboardData.topCategories.map(item => ({
                    category: item.name || item.category || 'Unknown',
                    amount: item.totalAmount || item.amount || 0,
                    percentage: item.percentage || 0
                  })));
                }
                this.isCategoryStatsLoading.set(false);
              },
              error: (error) => {
                console.error('Failed to refresh dashboard data:', error);
                this.isCategoryStatsLoading.set(false);
              }
            });
        },
        error: (error) => {
          this.error.set('Failed to refresh category stats');
          console.error('Category stats refresh error:', error);
          this.isCategoryStatsLoading.set(false);
        }
      });
  }

  // Helper methods
  getTotalBalance(): number {
    return this.dashboardData()?.overview?.totalBalance || 0;
  }

  getTotalIncome(): number {
    return this.dashboardData()?.overview?.monthlyIncome || 0;
  }

  getTotalExpenses(): number {
    return this.dashboardData()?.overview?.monthlyExpenses || 0;
  }

  getSavingsRate(): number {
    const dashboardData = this.dashboardData();
    if (!dashboardData?.overview?.monthlyIncome) return 0;
    return ((dashboardData.overview.monthlyIncome - dashboardData.overview.monthlyExpenses) / dashboardData.overview.monthlyIncome) * 100;
  }

  getNetWorth(): number {
    return this.dashboardData()?.overview?.monthlyNet || 0;
  }

  // Get category name by ID
  getCategoryName(categoryId: string): string {
    if (!categoryId || !this.categoryStats()?.topCategories) return 'Unknown';
    const category = this.categoryStats()!.topCategories.find(cat => cat.categoryId === categoryId);
    return category?.name || 'Unknown';
  }

  // Error handling
  clearError(): void {
    this.error.set(null);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}