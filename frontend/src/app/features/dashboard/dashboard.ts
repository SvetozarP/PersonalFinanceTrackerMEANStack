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
import { ResponsiveChartComponent } from '../../shared/components/responsive-chart/responsive-chart';
import { AuthService } from '../../features/auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent,
    ResponsiveChartComponent,
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
  
  // Categories for lookup
  categories = signal<any[]>([]);

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
    // Reset all loading states
    this.isDashboardLoading.set(true);
    this.isChartDataLoading.set(false);
    this.isRecentTransactionsLoading.set(false);
    this.isCategoryStatsLoading.set(false);
    this.isQuickActionsLoading.set(false);
    this.error.set(null);

    // Load all dashboard data in parallel
    const dashboardData$ = this.financialService.getFinancialDashboard();
    const recentTransactions$ = this.transactionService.getUserTransactions({ limit: 5 });
    const categoryStats$ = this.categoryService.getCategoryStats();
    const categories$ = this.categoryService.getUserCategories();

    combineLatest([dashboardData$, recentTransactions$, categoryStats$, categories$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([dashboardData, transactionsResponse, stats, categories]) => {
          
          this.dashboardData.set(dashboardData);
          this.recentTransactions.set(transactionsResponse.data);
          this.categoryStats.set(stats);
          this.categories.set(categories);
          
          // Prepare chart data
          this.prepareChartData();
          
          // Reset all loading states
          this.isDashboardLoading.set(false);
          this.isChartDataLoading.set(false);
          this.isRecentTransactionsLoading.set(false);
          this.isCategoryStatsLoading.set(false);
          this.isQuickActionsLoading.set(false);
          
        },
        error: (error) => {
          this.error.set('Failed to load dashboard data');
          // Reset all loading states on error
          this.isDashboardLoading.set(false);
          this.isChartDataLoading.set(false);
          this.isRecentTransactionsLoading.set(false);
          this.isCategoryStatsLoading.set(false);
          this.isQuickActionsLoading.set(false);
        }
      });
  }

  private prepareChartData(): void {
    const dashboardData = this.dashboardData();
    
    if (dashboardData) {
      // Prepare spending trends data - using spendingTrends from FinancialDashboard
      const spendingData = dashboardData.spendingTrends?.map(item => ({
        label: item.month,
        value: item.expenses || 0
      })) || [];
      this.spendingChartData.set(spendingData);

      // Prepare income data - using monthly income from overview
      const incomeData = [{
        label: 'Current Month',
        value: dashboardData.overview?.monthlyIncome || 0
      }];
      this.incomeChartData.set(incomeData);

      // Prepare category data from top categories
      // Note: dashboardData.topCategories comes from transaction stats with categoryName and total
      const categoryData = dashboardData.topCategories?.map((item: any) => ({
        label: item.categoryName || item.name || 'Unknown Category',
        value: item.total || item.totalAmount || 0
      })) || [];
      this.categoryChartData.set(categoryData);
    }
  }

  private updateCategoryChartData(): void {
    const categoryStats = this.categoryStats();
    if (categoryStats?.topCategories) {
      this.categoryChartData.set(categoryStats.topCategories.map(item => ({
        category: item.name || 'Unknown Category',
        amount: item.totalAmount || 0,
        percentage: item.percentage || 0
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
                  this.categoryChartData.set(dashboardData.topCategories.map((item: any) => ({
                    category: item.categoryName || item.name || 'Unknown',
                    amount: item.total || item.totalAmount || 0,
                    percentage: item.percentage || 0
                  })));
                }
                this.isCategoryStatsLoading.set(false);
              },
              error: (error) => {
                this.isCategoryStatsLoading.set(false);
              }
            });
        },
        error: (error) => {
          this.error.set('Failed to refresh category stats');
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

  // Get category name by ID or category object
  getCategoryName(categoryId: string | any): string {
    if (!categoryId) return 'Unknown';
    
    // If categoryId is an object with a name property, return the name directly
    if (typeof categoryId === 'object' && categoryId.name) {
      return categoryId.name;
    }
    
    // If categoryId is a string, look it up
    const idString = typeof categoryId === 'string' ? categoryId : categoryId._id || categoryId.id;
    
    if (!idString) {
      return 'Unknown';
    }
    
    // First try to find in categoryStats topCategories
    if (this.categoryStats()?.topCategories) {
      const topCategory = this.categoryStats()!.topCategories.find(cat => cat.categoryId === idString);
      if (topCategory) {
        return topCategory.name;
      }
    }
    
    // Then try to find in the full categories list
    if (this.categories() && this.categories().length > 0) {
      const category = this.categories().find(cat => cat._id === idString);
      if (category) {
        return category.name;
      }
    }
    
    return 'Unknown';
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