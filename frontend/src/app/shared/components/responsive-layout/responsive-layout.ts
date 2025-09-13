import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, takeUntil, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { GlobalSearchComponent } from '../global-search/global-search.component';

export interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  badge?: string | number;
  children?: NavigationItem[];
}

@Component({
  selector: 'app-responsive-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, GlobalSearchComponent],
  templateUrl: './responsive-layout.html',
  styleUrls: ['./responsive-layout.scss']
})
export class ResponsiveLayoutComponent implements OnInit, OnDestroy {
  @Input() navigationItems: NavigationItem[] = [];
  @Input() showSidebar: boolean = true;
  @Input() showHeader: boolean = true;
  @Input() showFooter: boolean = false;
  @Input() sidebarCollapsed: boolean = false;
  @Input() headerTitle: string = 'Dashboard';
  @Input() userInfo: { name: string; email: string; avatar?: string } | null = null;

  @Output() sidebarToggle = new EventEmitter<boolean>();
  @Output() logout = new EventEmitter<void>();
  @Output() navigationClick = new EventEmitter<NavigationItem>();

  private destroy$ = new Subject<void>();
  
  // Responsive state
  isMobile = signal(false);
  isTablet = signal(false);
  isDesktop = signal(false);
  sidebarOpen = signal(false);
  screenWidth = signal(0);

  // Default navigation items
  defaultNavigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      route: '/dashboard'
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
      route: '/financial/budgets'
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

  ngOnInit(): void {
    this.setupResponsiveListeners();
    this.updateScreenSize();
    
    // Use default navigation if none provided
    if (this.navigationItems.length === 0) {
      this.navigationItems = this.defaultNavigationItems;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupResponsiveListeners(): void {
    // Listen for window resize events
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateScreenSize();
      });

    // Listen for orientation changes on mobile
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

    // Update responsive state
    this.isMobile.set(width < 768);
    this.isTablet.set(width >= 768 && width < 1024);
    this.isDesktop.set(width >= 1024);

    // Auto-close sidebar on mobile when screen size changes
    if (this.isMobile() && this.sidebarOpen()) {
      this.sidebarOpen.set(false);
    }

    // Auto-open sidebar on desktop if it was closed due to mobile
    if (this.isDesktop() && !this.sidebarOpen() && this.showSidebar) {
      this.sidebarOpen.set(true);
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.set(!this.sidebarOpen());
    this.sidebarToggle.emit(this.sidebarOpen());
  }

  closeSidebar(): void {
    if (this.isMobile()) {
      this.sidebarOpen.set(false);
      this.sidebarToggle.emit(false);
    }
  }

  onNavigationClick(item: NavigationItem): void {
    this.navigationClick.emit(item);
    
    // Close sidebar on mobile after navigation
    if (this.isMobile()) {
      this.closeSidebar();
    }
  }

  onLogout(): void {
    this.logout.emit();
  }

  // Global search event handlers
  onGlobalSearch(result: any): void {
    // Handle search result - navigate to the result URL
    console.log('Global search result:', result);
    // In a real implementation, this would navigate to the result URL
  }

  onSearchHistoryCleared(): void {
    console.log('Search history cleared');
    // Handle history clearing
  }

  // Helper methods for template
  isActiveRoute(route: string): boolean {
    // This would typically check against the current route
    // For now, return false as a placeholder
    return false;
  }

  hasNotifications(): boolean {
    // Mock implementation - in a real app, this would check notification state
    return true;
  }

  // Helper methods for template
  get shouldShowSidebar(): boolean {
    return this.showSidebar && (this.isDesktop() || this.sidebarOpen());
  }

  get shouldShowMobileOverlay(): boolean {
    return this.isMobile() && this.sidebarOpen();
  }

  get sidebarClasses(): string {
    const classes = ['sidebar'];
    
    if (this.sidebarOpen()) classes.push('sidebar-open');
    if (this.isMobile()) classes.push('sidebar-mobile');
    if (this.isDesktop()) classes.push('sidebar-desktop');
    if (this.sidebarCollapsed && this.isDesktop()) classes.push('sidebar-collapsed');
    
    return classes.join(' ');
  }

  get mainContentClasses(): string {
    const classes = ['main-content'];
    
    if (this.shouldShowSidebar) classes.push('main-content-with-sidebar');
    if (this.isMobile()) classes.push('main-content-mobile');
    if (this.isDesktop()) classes.push('main-content-desktop');
    
    return classes.join(' ');
  }
}
