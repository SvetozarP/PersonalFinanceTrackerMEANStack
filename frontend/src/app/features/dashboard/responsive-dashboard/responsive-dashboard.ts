import { Component, OnInit, OnDestroy, inject, signal, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterModule } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { FinancialDashboard, CategoryStats, Transaction } from '../../../core/models/financial.model';
import { DashboardService } from '../../../core/services/dashboard.service';
import { FinancialService } from '../../../core/services/financial.service';
import { CategoryService } from '../../../core/services/category.service';
import { TransactionService } from '../../../core/services/transaction.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { ResponsiveLayoutComponent, NavigationItem } from '../../../shared/components/responsive-layout/responsive-layout';
import { GridItem } from '../../../shared/components/responsive-grid/responsive-grid';
import { AuthService } from '../../auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-responsive-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent,
    ResponsiveLayoutComponent,
    RouterLink,
  ],
  templateUrl: './responsive-dashboard.html',
  styleUrls: ['./responsive-dashboard.scss']
})
export class ResponsiveDashboardComponent implements OnInit, OnDestroy {
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

  // Data properties
  dashboardData: FinancialDashboard | null = null;
  recentTransactions: Transaction[] = [];
  categoryStats: CategoryStats | null = null;
  error: string | null = null;

  // Chart data
  spendingChartData: any[] = [];
  incomeChartData: any[] = [];
  categoryChartData: any[] = [];

  // User info
  userInfo = signal({
    name: 'John Doe',
    email: 'john.doe@example.com'
  });

  // Navigation items
  navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard',
      badge: 'New'
    },
    {
      label: 'Transactions',
      icon: 'fas fa-exchange-alt',
      route: '/financial/transactions'
    },
    {
      label: 'Categories',
      icon: 'fas fa-tags',
      route: '/financial/categories'
    },
    {
      label: 'Budgets',
      icon: 'fas fa-piggy-bank',
      route: '/financial/budgets',
      badge: 3
    },
    {
      label: 'Reports',
      icon: 'fas fa-chart-bar',
      route: '/financial/reports'
    },
    {
      label: 'Goals',
      icon: 'fas fa-bullseye',
      route: '/financial/goals'
    }
  ];

  // Grid items for dashboard content
  gridItems: GridItem[] = [];

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupGridItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupGridItems(): void {
    this.gridItems = [
      {
        id: 'metrics',
        content: this.createMetricsTemplate(),
        breakpoints: { xs: 1, sm: 2, md: 4, lg: 4, xl: 4, xxl: 4 },
        className: 'metrics-section'
      },
      {
        id: 'spending-chart',
        content: this.createSpendingChartTemplate(),
        breakpoints: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 },
        className: 'chart-section'
      },
      {
        id: 'income-chart',
        content: this.createIncomeChartTemplate(),
        breakpoints: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 },
        className: 'chart-section'
      },
      {
        id: 'category-chart',
        content: this.createCategoryChartTemplate(),
        breakpoints: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 },
        className: 'chart-section full-width'
      },
      {
        id: 'recent-transactions',
        content: this.createRecentTransactionsTemplate(),
        breakpoints: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 },
        className: 'transactions-section'
      },
      {
        id: 'quick-actions',
        content: this.createQuickActionsTemplate(),
        breakpoints: { xs: 2, sm: 4, md: 4, lg: 4, xl: 4, xxl: 4 },
        className: 'actions-section'
      }
    ];
  }

  private createMetricsTemplate(): TemplateRef<any> {
    // This would be a template reference in a real implementation
    return null as any;
  }

  private createSpendingChartTemplate(): TemplateRef<any> {
    return null as any;
  }

  private createIncomeChartTemplate(): TemplateRef<any> {
    return null as any;
  }

  private createCategoryChartTemplate(): TemplateRef<any> {
    return null as any;
  }

  private createRecentTransactionsTemplate(): TemplateRef<any> {
    return null as any;
  }

  private createQuickActionsTemplate(): TemplateRef<any> {
    return null as any;
  }

  private loadDashboardData(): void {
    this.isDashboardLoading.set(true);
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
          
          this.isDashboardLoading.set(false);
        },
        error: (error) => {
          this.error = 'Failed to load dashboard data';
          console.error('Dashboard loading error:', error);
          this.isDashboardLoading.set(false);
        }
      });
  }

  private prepareChartData(): void {
    if (this.dashboardData) {
      // Prepare spending trends data
      this.spendingChartData = this.dashboardData.spendingTrends?.map(item => ({
        month: item.month,
        amount: item.expenses || 0
      })) || [];

      // Prepare income data
      this.incomeChartData = [{
        month: 'Current Month',
        amount: this.dashboardData.overview?.monthlyIncome || 0
      }];

      // Prepare category data
      this.categoryChartData = this.dashboardData.topCategories?.map(item => ({
        category: item.name,
        amount: item.totalAmount || item.amount || 0,
        percentage: item.percentage
      })) || [];
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
          this.recentTransactions = response.data;
          this.isRecentTransactionsLoading.set(false);
        },
        error: (error) => {
          this.error = 'Failed to refresh transactions';
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
          this.categoryStats = stats;
          this.updateCategoryChartData();
          this.isCategoryStatsLoading.set(false);
        },
        error: (error) => {
          this.error = 'Failed to refresh category stats';
          console.error('Category stats refresh error:', error);
          this.isCategoryStatsLoading.set(false);
        }
      });
  }

  private updateCategoryChartData(): void {
    if (this.categoryStats?.topCategories) {
      this.categoryChartData = this.categoryStats.topCategories.map(item => ({
        category: item.name,
        amount: item.totalAmount,
        percentage: item.percentage
      }));
    }
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

  getCategoryName(categoryId: string): string {
    if (!categoryId || !this.categoryStats?.topCategories) return 'Unknown';
    const category = this.categoryStats.topCategories.find(cat => cat.categoryId === categoryId);
    return category?.name || 'Unknown';
  }

  hasNotifications(): boolean {
    return true; // Mock implementation
  }

  // Event handlers
  onSidebarToggle(open: boolean): void {
    console.log('Sidebar toggled:', open);
  }

  onNavigationClick(item: NavigationItem): void {
    console.log('Navigation clicked:', item);
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // Loading state helpers
  get isLoading(): boolean {
    return this.isDashboardLoading() || this.isChartDataLoading() || 
           this.isRecentTransactionsLoading() || this.isCategoryStatsLoading();
  }

  get isDataLoaded(): boolean {
    return !this.isLoading && !this.error && this.dashboardData !== null;
  }
}
