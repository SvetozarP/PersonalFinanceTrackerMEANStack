import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResponsiveGridComponent, GridItem, GridBreakpoint } from './responsive-grid';

describe('ResponsiveGridComponent', () => {
  let component: ResponsiveGridComponent;
  let fixture: ComponentFixture<ResponsiveGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponsiveGridComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ResponsiveGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input Properties', () => {
    it('should have default items', () => {
      expect(component.items).toEqual([]);
    });

    it('should have default columns', () => {
      expect(component.columns).toEqual({ xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 });
    });

    it('should have default gap', () => {
      expect(component.gap).toBe('1rem');
    });

    it('should have default autoFit', () => {
      expect(component.autoFit).toBe(false);
    });

    it('should have default autoFill', () => {
      expect(component.autoFill).toBe(false);
    });

    it('should have default minItemWidth', () => {
      expect(component.minItemWidth).toBe('250px');
    });

    it('should have default maxItemWidth', () => {
      expect(component.maxItemWidth).toBe('1fr');
    });

    it('should have default className', () => {
      expect(component.className).toBe('');
    });
  });

  describe('Responsive State', () => {
    it('should initialize responsive signals', () => {
      // Mock window width to be xs breakpoint
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      });
      
      component['updateScreenSize']();
      
      expect(component.currentBreakpoint()).toBe('xs');
      expect(component.screenWidth()).toBe(400);
    });

    it('should update screen size for xs breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      });
      
      component['updateScreenSize']();
      
      expect(component.currentBreakpoint()).toBe('xs');
      expect(component.screenWidth()).toBe(400);
    });

    it('should update screen size for sm breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600
      });
      
      component['updateScreenSize']();
      
      expect(component.currentBreakpoint()).toBe('sm');
      expect(component.screenWidth()).toBe(600);
    });

    it('should update screen size for md breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800
      });
      
      component['updateScreenSize']();
      
      expect(component.currentBreakpoint()).toBe('md');
      expect(component.screenWidth()).toBe(800);
    });

    it('should update screen size for lg breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1000
      });
      
      component['updateScreenSize']();
      
      expect(component.currentBreakpoint()).toBe('lg');
      expect(component.screenWidth()).toBe(1000);
    });

    it('should update screen size for xl breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1300
      });
      
      component['updateScreenSize']();
      
      expect(component.currentBreakpoint()).toBe('xl');
      expect(component.screenWidth()).toBe(1300);
    });

    it('should update screen size for xxl breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1500
      });
      
      component['updateScreenSize']();
      
      expect(component.currentBreakpoint()).toBe('xxl');
      expect(component.screenWidth()).toBe(1500);
    });
  });

  describe('Column Calculation', () => {
    it('should get current columns for xs breakpoint', () => {
      component.currentBreakpoint.set('xs');
      expect(component.getCurrentColumns()).toBe(1);
    });

    it('should get current columns for sm breakpoint', () => {
      component.currentBreakpoint.set('sm');
      expect(component.getCurrentColumns()).toBe(2);
    });

    it('should get current columns for md breakpoint', () => {
      component.currentBreakpoint.set('md');
      expect(component.getCurrentColumns()).toBe(3);
    });

    it('should get current columns for lg breakpoint', () => {
      component.currentBreakpoint.set('lg');
      expect(component.getCurrentColumns()).toBe(4);
    });

    it('should get current columns for xl breakpoint', () => {
      component.currentBreakpoint.set('xl');
      expect(component.getCurrentColumns()).toBe(4);
    });

    it('should get current columns for xxl breakpoint', () => {
      component.currentBreakpoint.set('xxl');
      expect(component.getCurrentColumns()).toBe(4);
    });

    it('should fallback to xs columns when breakpoint not found', () => {
      component.columns = { xs: 2 };
      component.currentBreakpoint.set('sm' as any);
      expect(component.getCurrentColumns()).toBe(2);
    });

    it('should fallback to 1 when no columns defined', () => {
      component.columns = {};
      component.currentBreakpoint.set('xs');
      expect(component.getCurrentColumns()).toBe(1);
    });
  });

  describe('Grid Styling', () => {
    it('should return grid style for autoFit', () => {
      component.autoFit = true;
      component.minItemWidth = '200px';
      component.maxItemWidth = '1fr';
      component.gap = '1rem';
      
      const style = component.getGridStyle();
      expect(style).toEqual({
        'grid-template-columns': 'repeat(auto-fit, minmax(200px, 1fr))',
        'gap': '1rem'
      });
    });

    it('should return grid style for autoFill', () => {
      component.autoFill = true;
      component.minItemWidth = '200px';
      component.maxItemWidth = '1fr';
      component.gap = '1rem';
      
      const style = component.getGridStyle();
      expect(style).toEqual({
        'grid-template-columns': 'repeat(auto-fill, minmax(200px, 1fr))',
        'gap': '1rem'
      });
    });

    it('should return grid style for fixed columns', () => {
      component.autoFit = false;
      component.autoFill = false;
      component.currentBreakpoint.set('md');
      component.gap = '1rem';
      
      const style = component.getGridStyle();
      expect(style).toEqual({
        'grid-template-columns': 'repeat(3, 1fr)',
        'gap': '1rem'
      });
    });
  });

  describe('Item Styling', () => {
    it('should return item style with breakpoints', () => {
      const item: GridItem = {
        id: '1',
        content: 'Test',
        breakpoints: { xs: 1, sm: 2, md: 3 },
        order: 1
      };
      
      component.currentBreakpoint.set('sm');
      const style = component.getItemStyle(item);
      
      expect(style).toEqual({
        'grid-column': 'span 2',
        'order': '1'
      });
    });

    it('should return item style without breakpoints', () => {
      const item: GridItem = {
        id: '1',
        content: 'Test'
      };
      
      component.currentBreakpoint.set('sm');
      const style = component.getItemStyle(item);
      
      expect(style).toEqual({
        'grid-column': 'span 1',
        'order': '0'
      });
    });

    it('should handle item with partial breakpoints', () => {
      const item: GridItem = {
        id: '1',
        content: 'Test',
        breakpoints: { xs: 1, md: 3 }
      };
      
      component.currentBreakpoint.set('sm');
      const style = component.getItemStyle(item);
      
      expect(style).toEqual({
        'grid-column': 'span 1',
        'order': '0'
      });
    });
  });

  describe('Grid Classes', () => {
    it('should return basic grid classes', () => {
      component.currentBreakpoint.set('xs');
      const classes = component.getGridClasses();
      expect(classes).toContain('responsive-grid');
      expect(classes).toContain('grid-xs');
    });

    it('should include custom className', () => {
      component.className = 'custom-grid';
      const classes = component.getGridClasses();
      expect(classes).toContain('custom-grid');
    });

    it('should include breakpoint class', () => {
      component.currentBreakpoint.set('md');
      const classes = component.getGridClasses();
      expect(classes).toContain('grid-md');
    });

    it('should include autoFit class', () => {
      component.autoFit = true;
      const classes = component.getGridClasses();
      expect(classes).toContain('grid-auto-fit');
    });

    it('should include autoFill class', () => {
      component.autoFill = true;
      const classes = component.getGridClasses();
      expect(classes).toContain('grid-auto-fill');
    });
  });

  describe('Item Classes', () => {
    it('should return basic item classes', () => {
      const item: GridItem = { id: '1', content: 'Test' };
      component.currentBreakpoint.set('xs');
      
      const classes = component.getItemClasses(item);
      expect(classes).toContain('grid-item');
      expect(classes).toContain('item-xs-1');
    });

    it('should include custom className', () => {
      const item: GridItem = { 
        id: '1', 
        content: 'Test', 
        className: 'custom-item' 
      };
      
      const classes = component.getItemClasses(item);
      expect(classes).toContain('custom-item');
    });

    it('should include breakpoint and column class', () => {
      const item: GridItem = { 
        id: '1', 
        content: 'Test',
        breakpoints: { xs: 2, sm: 3 }
      };
      
      component.currentBreakpoint.set('sm');
      const classes = component.getItemClasses(item);
      expect(classes).toContain('item-sm-3');
    });

    it('should handle item without breakpoints', () => {
      const item: GridItem = { id: '1', content: 'Test' };
      component.currentBreakpoint.set('sm');
      
      const classes = component.getItemClasses(item);
      expect(classes).toContain('item-sm-1');
    });
  });

  describe('Track By Function', () => {
    it('should track by item id', () => {
      const item: GridItem = { id: 'test-id', content: 'Test' };
      expect(component.trackByItemId(0, item)).toBe('test-id');
    });
  });

  describe('Lifecycle', () => {
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

    it('should complete destroy subject on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });
});