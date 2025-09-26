import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { ResponsiveLayoutComponent, NavigationItem } from '../../../shared/components/responsive-layout/responsive-layout';
import { GridItem } from '../../../shared/components/responsive-grid/responsive-grid';
import { ResponsiveChartComponent, CustomChartData, ChartConfig } from '../../../shared/components/responsive-chart/responsive-chart';
import { AuthService } from '../../auth/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-responsive-demo',
  standalone: true,
  imports: [
    CommonModule,
    ResponsiveLayoutComponent,
    ResponsiveChartComponent
  ],
  templateUrl: './responsive-demo.html',
  styleUrls: ['./responsive-demo.scss']
})
export class ResponsiveDemoComponent implements OnInit, OnDestroy {
  // Services
  private authService = inject(AuthService);
  private router = inject(Router);

  // Component state
  private destroy$ = new Subject<void>();

  // Responsive state
  isMobile = signal(false);
  isTablet = signal(false);
  isDesktop = signal(false);
  screenWidth = signal(0);
  currentBreakpoint = signal<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'>('xs');

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
      route: '/dashboard'
    },
    {
      label: 'Responsive Demo',
      icon: 'fas fa-mobile-alt',
      route: '/responsive-demo',
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
    }
  ];

  // Sample data for charts
  spendingData: CustomChartData[] = [
    { label: 'Food & Dining', value: 1200, color: '#3182ce' },
    { label: 'Transportation', value: 800, color: '#38a169' },
    { label: 'Entertainment', value: 600, color: '#e53e3e' },
    { label: 'Shopping', value: 400, color: '#805ad5' },
    { label: 'Utilities', value: 300, color: '#d69e2e' }
  ];

  incomeData: CustomChartData[] = [
    { label: 'Salary', value: 5000, color: '#38a169' },
    { label: 'Freelance', value: 1200, color: '#3182ce' },
    { label: 'Investments', value: 800, color: '#805ad5' }
  ];

  trendData: CustomChartData[] = [
    { label: 'Jan', value: 3200 },
    { label: 'Feb', value: 2800 },
    { label: 'Mar', value: 3500 },
    { label: 'Apr', value: 4100 },
    { label: 'May', value: 3800 },
    { label: 'Jun', value: 4200 }
  ];

  // Chart configurations
  spendingChartConfig: ChartConfig = {
    type: 'pie',
    responsive: true,
    maintainAspectRatio: false,
    showLegend: true,
    showTooltips: true,
    showLabels: true,
    animation: true,
    colors: ['#3182ce', '#38a169', '#e53e3e', '#805ad5', '#d69e2e']
  };

  incomeChartConfig: ChartConfig = {
    type: 'doughnut',
    responsive: true,
    maintainAspectRatio: false,
    showLegend: true,
    showTooltips: true,
    showLabels: true,
    animation: true,
    colors: ['#38a169', '#3182ce', '#805ad5']
  };

  trendChartConfig: ChartConfig = {
    type: 'line',
    responsive: true,
    maintainAspectRatio: false,
    showLegend: false,
    showTooltips: true,
    showLabels: true,
    animation: true,
    colors: ['#3182ce']
  };

  // Grid items for responsive demonstration
  gridItems: GridItem[] = [];

  ngOnInit(): void {
    this.setupResponsiveListeners();
    this.updateScreenSize();
    this.setupGridItems();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupResponsiveListeners(): void {
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateScreenSize();
      });

    fromEvent(window, 'orientationchange')
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateScreenSize();
      });
  }

  private updateScreenSize(): void {
    const width = window.innerWidth;
    this.screenWidth.set(width);

    this.isMobile.set(width < 768);
    this.isTablet.set(width >= 768 && width < 1024);
    this.isDesktop.set(width >= 1024);

    // Update breakpoint
    if (width >= 1400) {
      this.currentBreakpoint.set('xxl');
    } else if (width >= 1200) {
      this.currentBreakpoint.set('xl');
    } else if (width >= 992) {
      this.currentBreakpoint.set('lg');
    } else if (width >= 768) {
      this.currentBreakpoint.set('md');
    } else if (width >= 576) {
      this.currentBreakpoint.set('sm');
    } else {
      this.currentBreakpoint.set('xs');
    }
  }

  private setupGridItems(): void {
    this.gridItems = [
      {
        id: 'responsive-info',
        content: this.createResponsiveInfoTemplate(),
        breakpoints: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 },
        className: 'info-section'
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
        id: 'trend-chart',
        content: this.createTrendChartTemplate(),
        breakpoints: { xs: 1, sm: 1, md: 1, lg: 1, xl: 1, xxl: 1 },
        className: 'chart-section'
      },
      {
        id: 'features-grid',
        content: this.createFeaturesGridTemplate(),
        breakpoints: { xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 },
        className: 'features-section'
      }
    ];
  }

  private createResponsiveInfoTemplate(): any {
    return null; // Template would be created here
  }

  private createSpendingChartTemplate(): any {
    return null;
  }

  private createIncomeChartTemplate(): any {
    return null;
  }

  private createTrendChartTemplate(): any {
    return null;
  }

  private createFeaturesGridTemplate(): any {
    return null;
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

  // Helper methods
  getScreenInfo(): string {
    const width = this.screenWidth();
    const breakpoint = this.currentBreakpoint();
    const device = this.isMobile() ? 'Mobile' : this.isTablet() ? 'Tablet' : 'Desktop';
    
    return `${device} (${width}px) - ${breakpoint.toUpperCase()}`;
  }

  getResponsiveFeatures(): Array<{title: string, description: string, icon: string}> {
    return [
      {
        title: 'Mobile-First Design',
        description: 'Optimized for mobile devices with touch-friendly interfaces and adaptive layouts.',
        icon: 'fas fa-mobile-alt'
      },
      {
        title: 'Flexible Grid System',
        description: 'Responsive grid that adapts to different screen sizes with customizable breakpoints.',
        icon: 'fas fa-th'
      },
      {
        title: 'Adaptive Charts',
        description: 'Charts that resize and reflow based on available space and device capabilities.',
        icon: 'fas fa-chart-pie'
      },
      {
        title: 'Smart Navigation',
        description: 'Collapsible sidebar on mobile, full navigation on desktop with smooth transitions.',
        icon: 'fas fa-bars'
      },
      {
        title: 'Touch Gestures',
        description: 'Support for swipe, pinch, and other touch gestures on mobile devices.',
        icon: 'fas fa-hand-paper'
      },
      {
        title: 'Performance Optimized',
        description: 'Lazy loading, virtual scrolling, and optimized rendering for smooth performance.',
        icon: 'fas fa-tachometer-alt'
      }
    ];
  }
}
