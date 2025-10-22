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
import { ModernChartComponent } from '../../shared/components/modern-chart/modern-chart';
import { AuthService } from '../../features/auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent,
    ModernChartComponent,
    RouterLink,
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
  currencyDashboards = signal<Map<string, FinancialDashboard> | null>(null);
  recentTransactions = signal<Transaction[]>([]);
  categoryStats = signal<CategoryStats | null>(null);
  error = signal<string | null>(null);
  
  // Date range controls
  dateRange = signal<{start: Date, end: Date}>({
    start: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
    end: new Date()
  });

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
    const dashboardData$ = this.financialService.getCurrencySeparatedDashboard();
    const recentTransactions$ = this.transactionService.getUserTransactions({ limit: 5 });
    const categoryStats$ = this.categoryService.getCategoryStats();
    const categories$ = this.categoryService.getUserCategories();

    combineLatest([dashboardData$, recentTransactions$, categoryStats$, categories$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([dashboardData, transactionsResponse, stats, categories]) => {
          
          // Handle currency-separated dashboard data
          if (dashboardData instanceof Map) {
            console.log('Processing currency-separated data, currencies:', Array.from(dashboardData.keys()));
            // Store the currency-separated data
            this.currencyDashboards.set(dashboardData);
            
            // For charts, use the first currency's data
            const firstCurrency = dashboardData.keys().next().value;
            if (firstCurrency) {
              const currencyData = dashboardData.get(firstCurrency)!;
              console.log('Setting dashboard data for charts (first currency):', firstCurrency, currencyData);
              this.dashboardData.set(currencyData);
            }
          } else {
            console.log('Setting regular dashboard data:', dashboardData);
            this.dashboardData.set(dashboardData);
            this.currencyDashboards.set(null);
          }
          
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
    const currencyDashboards = this.currencyDashboards();
    const dashboardData = this.dashboardData();
    
    console.log('Preparing chart data with dashboard data:', dashboardData);
    console.log('Currency dashboards:', currencyDashboards);
    
    // If we have currency-separated data, combine it for charts
    if (currencyDashboards && currencyDashboards.size > 0) {
      // Prepare spending trends data - combine all currencies
      const allSpendingData: any[] = [];
      for (const [currency, dashboard] of currencyDashboards.entries()) {
        if (dashboard.spendingTrends) {
          dashboard.spendingTrends.forEach((trend: any) => {
            allSpendingData.push({
              label: `${trend.month} (${currency})`,
              value: trend.amount || 0
            });
          });
        }
      }
      allSpendingData.sort((a, b) => a.label.localeCompare(b.label));
      this.spendingChartData.set(allSpendingData);

      // Prepare income data - separate bar for each currency
      const allIncomeData: any[] = [];
      for (const [currency, dashboard] of currencyDashboards.entries()) {
        if (dashboard.overview?.monthlyIncome) {
          allIncomeData.push({
            label: `${currency} Income`,
            value: dashboard.overview.monthlyIncome
          });
        }
      }
      console.log('Income chart data (multi-currency):', allIncomeData);
      this.incomeChartData.set(allIncomeData);

      // Prepare category data - combine all currencies
      const allCategoryData: any[] = [];
      for (const [currency, dashboard] of currencyDashboards.entries()) {
        if (dashboard.topCategories) {
          dashboard.topCategories.forEach((category: any) => {
            allCategoryData.push({
              label: `${category.name} (${currency})`,
              value: category.amount || 0
            });
          });
        }
      }
      // Sort by value and take top 5
      allCategoryData.sort((a, b) => b.value - a.value);
      const topCategoryData = allCategoryData.slice(0, 5);
      console.log('Category chart data (multi-currency):', topCategoryData);
      this.categoryChartData.set(topCategoryData);
    } else if (dashboardData) {
      // Fallback to single currency data
      // Prepare spending trends data - using spendingTrends from FinancialDashboard
      const spendingData = dashboardData.spendingTrends?.map(item => ({
        label: item.month,
        value: item.amount || 0
      })) || [];
      console.log('Spending chart data (single currency):', spendingData);
      this.spendingChartData.set(spendingData);

      // Prepare income data - using monthly income from overview
      const incomeData = [{
        label: 'Current Month',
        value: dashboardData.overview?.monthlyIncome || 0
      }];
      console.log('Income chart data (single currency):', incomeData);
      this.incomeChartData.set(incomeData);

      // Prepare category data from top categories
      const categoryData = dashboardData.topCategories?.map((item: any) => ({
        label: item.name || 'Unknown Category',
        value: item.amount || 0
      })) || [];
      console.log('Category chart data (single currency):', categoryData);
      this.categoryChartData.set(categoryData);
    } else {
      console.log('No dashboard data available for chart preparation');
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

  // Date range methods
  updateDateRange(start: Date, end: Date): void {
    this.dateRange.set({ start, end });
    this.loadDashboardData();
  }
  
  setLastMonth(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    this.updateDateRange(start, end);
  }
  
  setLast3Months(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const end = new Date();
    this.updateDateRange(start, end);
  }
  
  setLast6Months(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const end = new Date();
    this.updateDateRange(start, end);
  }
  
  setLastYear(): void {
    const now = new Date();
    const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const end = new Date();
    this.updateDateRange(start, end);
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

  // Currency formatting helper methods
  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  getChangeClass(value: number): string {
    if (value > 0) return 'change-positive';
    if (value < 0) return 'change-negative';
    return 'change-neutral';
  }

  getChangeIndicator(value: number): string {
    if (value > 0) return '↑';
    if (value < 0) return '↓';
    return '→';
  }

  // Helper method for category percentage calculation
  getCategoryPercentage(value: number): number {
    const categoryData = this.categoryChartData();
    if (categoryData.length === 0) return 0;
    
    const maxValue = Math.max(...categoryData.map(item => item.value));
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  }
}