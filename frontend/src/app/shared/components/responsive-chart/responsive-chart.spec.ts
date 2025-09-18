import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResponsiveChartComponent, ChartData, ChartConfig } from './responsive-chart';

describe('ResponsiveChartComponent', () => {
  let component: ResponsiveChartComponent;
  let fixture: ComponentFixture<ResponsiveChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponsiveChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ResponsiveChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Input Properties', () => {
    it('should have default data', () => {
      expect(component.data).toEqual([]);
    });

    it('should have default config', () => {
      expect(component.config).toEqual({
        type: 'bar',
        responsive: true,
        maintainAspectRatio: false,
        showLegend: true,
        showTooltips: true,
        showLabels: true,
        animation: true,
        colors: ['#3182ce', '#38a169', '#e53e3e', '#805ad5', '#d69e2e', '#e53e3e', '#38a169', '#3182ce']
      });
    });

    it('should have default title', () => {
      expect(component.title).toBe('');
    });

    it('should have default subtitle', () => {
      expect(component.subtitle).toBe('');
    });

    it('should have default loading state', () => {
      expect(component.loading).toBe(false);
    });

    it('should have default error state', () => {
      expect(component.error).toBeNull();
    });

    it('should have default empty message', () => {
      expect(component.emptyMessage).toBe('No data available');
    });

    it('should have default className', () => {
      expect(component.className).toBe('');
    });
  });

  describe('Responsive State', () => {
    it('should initialize responsive signals', () => {
      // Mock window width to be mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      });
      
      // Reset component state before testing
      component.isMobile.set(false);
      component.isTablet.set(false);
      component.isDesktop.set(false);
      component.screenWidth.set(0);
      component.chartHeight.set(300);
      
      component['updateScreenSize']();
      component['calculateChartHeight']();
      
      expect(component.isMobile()).toBe(true);
      expect(component.isTablet()).toBe(false);
      expect(component.isDesktop()).toBe(false);
      expect(component.screenWidth()).toBe(400);
      expect(component.chartHeight()).toBe(250);
    });

    it('should update screen size on mobile', () => {
      // Mock mobile width
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

    it('should update screen size on tablet', () => {
      // Mock tablet width
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

    it('should update screen size on desktop', () => {
      // Mock desktop width
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
  });

  describe('Chart Height Calculation', () => {
    it('should calculate height for mobile', () => {
      component.isMobile.set(true);
      component['calculateChartHeight']();
      expect(component.chartHeight()).toBe(250);
    });

    it('should calculate height for tablet', () => {
      component.isMobile.set(false);
      component.isTablet.set(true);
      component.isDesktop.set(false);
      component['calculateChartHeight']();
      expect(component.chartHeight()).toBe(300);
    });

    it('should calculate height for desktop', () => {
      component.isMobile.set(false);
      component.isTablet.set(false);
      component.isDesktop.set(true);
      component['calculateChartHeight']();
      expect(component.chartHeight()).toBe(400);
    });

    it('should adjust height for pie chart', () => {
      component.isMobile.set(false);
      component.isTablet.set(false);
      component.isDesktop.set(true);
      component.config = { ...component.config, type: 'pie' };
      component['calculateChartHeight']();
      expect(component.chartHeight()).toBe(350);
    });

    it('should adjust height for doughnut chart', () => {
      component.isMobile.set(false);
      component.isTablet.set(false);
      component.isDesktop.set(true);
      component.config = { ...component.config, type: 'doughnut' };
      component['calculateChartHeight']();
      expect(component.chartHeight()).toBe(350);
    });
  });

  describe('Chart Initialization', () => {
    it('should initialize chart successfully', () => {
      // Mock chartContainer
      component['chartContainer'] = { nativeElement: document.createElement('div') } as any;
      component.initializeChart();
      expect(component.isChartReady()).toBe(true);
      expect(component.chartError()).toBeNull();
    });

    it('should handle chart initialization error', () => {
      // Mock chartContainer to be undefined
      component['chartContainer'] = undefined as any;
      component.initializeChart();
      expect(component.isChartReady()).toBe(false);
    });
  });

  describe('Chart Styling', () => {
    it('should return chart style', () => {
      component.chartHeight.set(400);
      const style = component.getChartStyle();
      expect(style).toEqual({
        'height': '400px',
        'width': '100%'
      });
    });

    it('should return chart container style', () => {
      component.chartHeight.set(400);
      const style = component.getChartContainerStyle();
      expect(style).toEqual({
        'height': '400px',
        'width': '100%',
        'position': 'relative'
      });
    });
  });

  describe('Chart Classes', () => {
    it('should return basic chart classes', () => {
      const classes = component.getChartClasses();
      expect(classes).toContain('responsive-chart');
      expect(classes).toContain('chart-bar');
    });

    it('should include custom className', () => {
      component.className = 'custom-chart';
      const classes = component.getChartClasses();
      expect(classes).toContain('custom-chart');
    });

    it('should include chart type class', () => {
      component.config = { ...component.config, type: 'pie' };
      const classes = component.getChartClasses();
      expect(classes).toContain('chart-pie');
    });

    it('should include responsive class', () => {
      component.isMobile.set(true);
      const classes = component.getChartClasses();
      expect(classes).toContain('chart-mobile');
    });

    it('should include loading class', () => {
      component.loading = true;
      const classes = component.getChartClasses();
      expect(classes).toContain('chart-loading');
    });

    it('should include error class when error exists', () => {
      component.error = 'Test error';
      const classes = component.getChartClasses();
      expect(classes).toContain('chart-error');
    });

    it('should include error class when chart error exists', () => {
      component.chartError.set('Chart error');
      const classes = component.getChartClasses();
      expect(classes).toContain('chart-error');
    });

    it('should include empty class when no data', () => {
      component.data = [];
      const classes = component.getChartClasses();
      expect(classes).toContain('chart-empty');
    });

    it('should include empty class when data is null', () => {
      component.data = null as any;
      const classes = component.getChartClasses();
      expect(classes).toContain('chart-empty');
    });
  });

  describe('Data Processing', () => {
    it('should process data with colors', () => {
      const testData: ChartData[] = [
        { label: 'Test 1', value: 100 },
        { label: 'Test 2', value: 200 }
      ];
      component.data = testData;
      
      const processed = component.getProcessedData();
      expect(processed.length).toBe(2);
      expect(processed[0].color).toBe(component.config.colors[0]);
      expect(processed[1].color).toBe(component.config.colors[1]);
    });

    it('should handle empty data', () => {
      component.data = [];
      const processed = component.getProcessedData();
      expect(processed).toEqual([]);
    });

    it('should handle null data', () => {
      component.data = null as any;
      const processed = component.getProcessedData();
      expect(processed).toEqual([]);
    });

    it('should preserve existing colors', () => {
      const testData: ChartData[] = [
        { label: 'Test 1', value: 100, color: '#ff0000' }
      ];
      component.data = testData;
      
      const processed = component.getProcessedData();
      expect(processed[0].color).toBe('#ff0000');
    });
  });

  describe('Value Calculations', () => {
    it('should calculate total value', () => {
      component.data = [
        { label: 'Test 1', value: 100 },
        { label: 'Test 2', value: 200 }
      ];
      expect(component.getTotalValue()).toBe(300);
    });

    it('should calculate max value', () => {
      component.data = [
        { label: 'Test 1', value: 100 },
        { label: 'Test 2', value: 200 }
      ];
      expect(component.getMaxValue()).toBe(200);
    });

    it('should calculate min value', () => {
      const testData = [
        { label: 'Test 1', value: 100 },
        { label: 'Test 2', value: 200 }
      ];
      
      // Set data after component initialization to avoid reset
      component.data = testData;
      
      // Call the method directly to test it
      const result = component.getMinValue();
      
      expect(result).toBe(100);
    });

    it('should handle empty data for calculations', () => {
      component.data = [];
      expect(component.getTotalValue()).toBe(0);
      expect(component.getMaxValue()).toBe(0);
      expect(component.getMinValue()).toBe(0);
    });
  });

  describe('Chart Type Detection', () => {
    it('should detect pie chart', () => {
      component.config = { ...component.config, type: 'pie' };
      expect(component.isPieChart()).toBe(true);
    });

    it('should detect doughnut chart', () => {
      component.config = { ...component.config, type: 'doughnut' };
      expect(component.isPieChart()).toBe(true);
    });

    it('should detect line chart', () => {
      component.config = { ...component.config, type: 'line' };
      expect(component.isLineChart()).toBe(true);
    });

    it('should detect area chart', () => {
      component.config = { ...component.config, type: 'area' };
      expect(component.isLineChart()).toBe(true);
    });

    it('should detect bar chart', () => {
      component.config = { ...component.config, type: 'bar' };
      expect(component.isBarChart()).toBe(true);
    });
  });

  describe('Responsive Helpers', () => {
    it('should return legend position for mobile', () => {
      component.isMobile.set(true);
      expect(component.getLegendPosition()).toBe('bottom');
    });

    it('should return legend position for tablet', () => {
      component.isMobile.set(false);
      component.isTablet.set(true);
      component.isDesktop.set(false);
      expect(component.getLegendPosition()).toBe('right');
    });

    it('should return legend position for desktop', () => {
      component.isMobile.set(false);
      component.isTablet.set(false);
      component.isDesktop.set(true);
      expect(component.getLegendPosition()).toBe('right');
    });

    it('should return tooltip position for mobile', () => {
      component.isMobile.set(true);
      expect(component.getTooltipPosition()).toBe('top');
    });

    it('should return tooltip position for desktop', () => {
      component.isDesktop.set(true);
      expect(component.getTooltipPosition()).toBe('top');
    });
  });

  describe('Event Handlers', () => {
    it('should handle chart click', () => {
      spyOn(console, 'log');
      component.onChartClick({ test: 'event' });
      expect(console.log).toHaveBeenCalledWith('Chart clicked:', { test: 'event' });
    });

    it('should handle chart hover', () => {
      spyOn(console, 'log');
      component.onChartHover({ test: 'event' });
      expect(console.log).toHaveBeenCalledWith('Chart hovered:', { test: 'event' });
    });
  });

  describe('State Getters', () => {
    it('should return loading state', () => {
      component.loading = true;
      expect(component.isLoading).toBe(true);
    });

    it('should return loading state when chart not ready', () => {
      component.isChartReady.set(false);
      expect(component.isLoading).toBe(true);
    });

    it('should return error state', () => {
      component.error = 'Test error';
      expect(component.hasError).toBe(true);
    });

    it('should return error state when chart error exists', () => {
      component.chartError.set('Chart error');
      expect(component.hasError).toBe(true);
    });

    it('should return empty state', () => {
      component.data = [];
      expect(component.isEmpty).toBe(true);
    });

    it('should return empty state when data is null', () => {
      component.data = null as any;
      expect(component.isEmpty).toBe(true);
    });

    it('should return error message', () => {
      component.error = 'Test error';
      expect(component.errorMessage).toBe('Test error');
    });

    it('should return chart error message', () => {
      component.chartError.set('Chart error');
      expect(component.errorMessage).toBe('Chart error');
    });

    it('should return default error message', () => {
      expect(component.errorMessage).toBe('An error occurred');
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

    it('should calculate chart height on init', () => {
      spyOn(component as any, 'calculateChartHeight');
      component.ngOnInit();
      expect(component['calculateChartHeight']).toHaveBeenCalled();
    });

    it('should initialize chart after view init', (done) => {
      spyOn(component, 'initializeChart');
      component.ngAfterViewInit();
      
      setTimeout(() => {
        expect(component.initializeChart).toHaveBeenCalled();
        done();
      }, 150);
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
