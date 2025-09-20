import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ResponsiveLayoutComponent } from './responsive-layout';

describe('ResponsiveLayoutComponent', () => {
  let component: ResponsiveLayoutComponent;
  let fixture: ComponentFixture<ResponsiveLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponsiveLayoutComponent, HttpClientTestingModule],
      providers: [
        provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { url: [] } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResponsiveLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default properties', () => {
    expect(component.navigationItems).toEqual(component.defaultNavigationItems);
    expect(component.showSidebar).toBe(true);
    expect(component.showHeader).toBe(true);
    expect(component.showFooter).toBe(false);
    expect(component.sidebarCollapsed).toBe(false);
    expect(component.headerTitle).toBe('Dashboard');
    expect(component.userInfo).toBeNull();
  });

  it('should initialize responsive signals', () => {
    // Mock window width to be desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200
    });
    
    // Set sidebar to closed before updating screen size to test the auto-open logic
    component.sidebarOpen.set(false);
    component['updateScreenSize']();
    
    expect(component.isMobile()).toBe(false);
    expect(component.isTablet()).toBe(false);
    expect(component.isDesktop()).toBe(true);
    expect(component.sidebarOpen()).toBe(true); // Should auto-open on desktop when showSidebar is true
    expect(component.screenWidth()).toBe(1200);
  });

  it('should update screen size for mobile', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });
    
    component['updateScreenSize']();
    
    expect(component.isMobile()).toBe(true);
    expect(component.isTablet()).toBe(false);
    expect(component.isDesktop()).toBe(false);
    expect(component.screenWidth()).toBe(500);
  });

  it('should update screen size for tablet', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 900
    });
    
    component['updateScreenSize']();
    
    expect(component.isMobile()).toBe(false);
    expect(component.isTablet()).toBe(true);
    expect(component.isDesktop()).toBe(false);
    expect(component.screenWidth()).toBe(900);
  });

  it('should update screen size for desktop', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200
    });
    
    component['updateScreenSize']();
    
    expect(component.isMobile()).toBe(false);
    expect(component.isTablet()).toBe(false);
    expect(component.isDesktop()).toBe(true);
    expect(component.screenWidth()).toBe(1200);
  });

  it('should toggle sidebar', () => {
    spyOn(component.sidebarToggle, 'emit');
    component.sidebarOpen.set(false);
    
    component.toggleSidebar();
    
    expect(component.sidebarOpen()).toBe(true);
    expect(component.sidebarToggle.emit).toHaveBeenCalledWith(true);
  });

  it('should close sidebar on mobile', () => {
    spyOn(component.sidebarToggle, 'emit');
    component.isMobile.set(true);
    component.sidebarOpen.set(true);
    
    component.closeSidebar();
    
    expect(component.sidebarOpen()).toBe(false);
    expect(component.sidebarToggle.emit).toHaveBeenCalledWith(false);
  });

  it('should not close sidebar on desktop', () => {
    spyOn(component.sidebarToggle, 'emit');
    component.isMobile.set(false);
    component.sidebarOpen.set(true);
    
    component.closeSidebar();
    
    expect(component.sidebarOpen()).toBe(true);
    expect(component.sidebarToggle.emit).not.toHaveBeenCalled();
  });

  it('should emit navigation click', () => {
    spyOn(component.navigationClick, 'emit');
    const item = { label: 'Test', icon: 'test', route: '/test' };
    
    component.onNavigationClick(item);
    
    expect(component.navigationClick.emit).toHaveBeenCalledWith(item);
  });

  it('should close sidebar on mobile after navigation', () => {
    spyOn(component, 'closeSidebar');
    component.isMobile.set(true);
    const item = { label: 'Test', icon: 'test', route: '/test' };
    
    component.onNavigationClick(item);
    
    expect(component.closeSidebar).toHaveBeenCalled();
  });

  it('should not close sidebar on desktop after navigation', () => {
    spyOn(component, 'closeSidebar');
    component.isMobile.set(false);
    const item = { label: 'Test', icon: 'test', route: '/test' };
    
    component.onNavigationClick(item);
    
    expect(component.closeSidebar).not.toHaveBeenCalled();
  });

  it('should emit logout event', () => {
    spyOn(component.logout, 'emit');
    
    component.onLogout();
    
    expect(component.logout.emit).toHaveBeenCalled();
  });

  it('should handle global search result', () => {
    spyOn(console, 'log');
    const result = { test: 'result' };
    
    component.onGlobalSearch(result);
    
    expect(console.log).toHaveBeenCalledWith('Global search result:', result);
  });

  it('should handle search history cleared', () => {
    spyOn(console, 'log');
    
    component.onSearchHistoryCleared();
    
    expect(console.log).toHaveBeenCalledWith('Search history cleared');
  });

  it('should return false for active route', () => {
    expect(component.isActiveRoute('/test')).toBe(false);
  });

  it('should return true for hasNotifications', () => {
    expect(component.hasNotifications()).toBe(true);
  });

  it('should show sidebar on desktop', () => {
    component.showSidebar = true;
    component.isDesktop.set(true);
    component.sidebarOpen.set(true);
    
    expect(component.shouldShowSidebar).toBe(true);
  });

  it('should show sidebar on mobile when open', () => {
    component.showSidebar = true;
    component.isMobile.set(true);
    component.sidebarOpen.set(true);
    
    expect(component.shouldShowSidebar).toBe(true);
  });

  it('should not show sidebar when showSidebar is false', () => {
    component.showSidebar = false;
    component.isDesktop.set(true);
    component.sidebarOpen.set(true);
    
    expect(component.shouldShowSidebar).toBe(false);
  });

  it('should not show sidebar on mobile when closed', () => {
    // Mock window width to be mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600
    });
    
    component.showSidebar = true;
    component['updateScreenSize'](); // This will set isMobile to true
    component.sidebarOpen.set(false);
    
    expect(component.shouldShowSidebar).toBe(false);
  });

  it('should show mobile overlay on mobile when sidebar open', () => {
    component.isMobile.set(true);
    component.sidebarOpen.set(true);
    
    expect(component.shouldShowMobileOverlay).toBe(true);
  });

  it('should not show mobile overlay on desktop', () => {
    component.isMobile.set(false);
    component.isDesktop.set(true);
    component.sidebarOpen.set(true);
    
    expect(component.shouldShowMobileOverlay).toBe(false);
  });

  it('should not show mobile overlay when sidebar closed', () => {
    component.isMobile.set(true);
    component.sidebarOpen.set(false);
    
    expect(component.shouldShowMobileOverlay).toBe(false);
  });

  it('should return basic sidebar classes', () => {
    const classes = component.sidebarClasses;
    expect(classes).toContain('sidebar');
  });

  it('should include sidebar-open class when open', () => {
    component.sidebarOpen.set(true);
    const classes = component.sidebarClasses;
    expect(classes).toContain('sidebar-open');
  });

  it('should include sidebar-mobile class on mobile', () => {
    component.isMobile.set(true);
    const classes = component.sidebarClasses;
    expect(classes).toContain('sidebar-mobile');
  });

  it('should include sidebar-desktop class on desktop', () => {
    component.isDesktop.set(true);
    const classes = component.sidebarClasses;
    expect(classes).toContain('sidebar-desktop');
  });

  it('should include sidebar-collapsed class when collapsed on desktop', () => {
    component.sidebarCollapsed = true;
    component.isDesktop.set(true);
    const classes = component.sidebarClasses;
    expect(classes).toContain('sidebar-collapsed');
  });

  it('should return basic main content classes', () => {
    const classes = component.mainContentClasses;
    expect(classes).toContain('main-content');
  });

  it('should include main-content-with-sidebar class when sidebar shown', () => {
    component.showSidebar = true;
    component.isDesktop.set(true);
    component.sidebarOpen.set(true);
    
    const classes = component.mainContentClasses;
    expect(classes).toContain('main-content-with-sidebar');
  });

  it('should include main-content-mobile class on mobile', () => {
    component.isMobile.set(true);
    const classes = component.mainContentClasses;
    expect(classes).toContain('main-content-mobile');
  });

  it('should include main-content-desktop class on desktop', () => {
    component.isDesktop.set(true);
    const classes = component.mainContentClasses;
    expect(classes).toContain('main-content-desktop');
  });

  it('should setup responsive listeners on init', () => {
    spyOn(component as any, 'setupResponsiveListeners');
    component.ngOnInit();
    expect(component['setupResponsiveListeners']).toHaveBeenCalled();
  });

  it('should update screen size on init', () => {
    spyOn(component as any, 'updateScreenSize');
    component.ngOnInit();
    expect(component['updateScreenSize']).toHaveBeenCalled();
  });

  it('should use default navigation items when none provided', () => {
    component.navigationItems = [];
    component.ngOnInit();
    expect(component.navigationItems).toEqual(component.defaultNavigationItems);
  });

  it('should not override provided navigation items', () => {
    const customItems = [
      { label: 'Custom', icon: 'test', route: '/custom' }
    ];
    component.navigationItems = customItems;
    component.ngOnInit();
    expect(component.navigationItems).toEqual(customItems);
  });

  it('should complete destroy subject on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should auto-close sidebar on mobile when screen size changes', () => {
    // Mock window width to be mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500
    });
    
    component.sidebarOpen.set(true);
    
    component['updateScreenSize']();
    
    expect(component.sidebarOpen()).toBe(false);
  });

  it('should auto-open sidebar on desktop if it was closed due to mobile', () => {
    // Mock window width to be desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1200
    });
    
    component.showSidebar = true;
    component.sidebarOpen.set(false);
    
    component['updateScreenSize']();
    
    expect(component.sidebarOpen()).toBe(true);
  });

  it('should not auto-open sidebar on desktop if showSidebar is false', () => {
    component.showSidebar = false;
    component.isDesktop.set(true);
    component.sidebarOpen.set(false);
    
    component['updateScreenSize']();
    
    expect(component.sidebarOpen()).toBe(false);
  });
});