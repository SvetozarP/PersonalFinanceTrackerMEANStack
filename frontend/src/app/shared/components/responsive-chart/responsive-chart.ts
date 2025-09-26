import { Component, Input, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, fromEvent } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { Chart, ChartConfiguration, ChartData as ChartJSData, ChartType, registerables } from 'chart.js';

export interface CustomChartData {
  label: string;
  value: number;
  color?: string;
  metadata?: any;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  responsive: boolean;
  maintainAspectRatio: boolean;
  aspectRatio?: number;
  showLegend: boolean;
  showTooltips: boolean;
  showLabels: boolean;
  animation: boolean;
  colors: string[];
}

@Component({
  selector: 'app-responsive-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './responsive-chart.html',
  styleUrls: ['./responsive-chart.scss']
})
export class ResponsiveChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() data: CustomChartData[] = [];
  @Input() config: ChartConfig = {
    type: 'bar',
    responsive: true,
    maintainAspectRatio: false,
    showLegend: true,
    showTooltips: true,
    showLabels: true,
    animation: true,
    colors: ['#3182ce', '#38a169', '#e53e3e', '#805ad5', '#d69e2e', '#e53e3e', '#38a169', '#3182ce']
  };
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Input() emptyMessage: string = 'No data available';
  @Input() className: string = '';

  @ViewChild('chartContainer', { static: false }) chartContainer!: ElementRef;

  private destroy$ = new Subject<void>();
  private chart: Chart | null = null;
  
  // Responsive state
  isMobile = signal(false);
  isTablet = signal(false);
  isDesktop = signal(false);
  screenWidth = signal(0);
  chartHeight = signal(300);

  // Chart state
  isChartReady = signal(false);
  chartError = signal<string | null>(null);

  ngOnInit(): void {
    this.setupResponsiveListeners();
    this.updateScreenSize();
    this.calculateChartHeight();
  }

  ngAfterViewInit(): void {
    // Initialize chart after view is ready
    setTimeout(() => {
      this.initializeChart();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clean up Chart.js instance
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private setupResponsiveListeners(): void {
    fromEvent(window, 'resize')
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateScreenSize();
        this.calculateChartHeight();
        this.resizeChart();
      });

    fromEvent(window, 'orientationchange')
      .pipe(
        debounceTime(100),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateScreenSize();
        this.calculateChartHeight();
        this.resizeChart();
      });
  }

  private updateScreenSize(): void {
    const width = window.innerWidth;
    this.screenWidth.set(width);

    this.isMobile.set(width < 768);
    this.isTablet.set(width >= 768 && width < 1024);
    this.isDesktop.set(width >= 1024);
  }

  private calculateChartHeight(): void {
    let height = 300; // Default height

    if (this.isMobile()) {
      height = 250;
    } else if (this.isTablet()) {
      height = 300;
    } else if (this.isDesktop()) {
      height = 400;
    }

    // Adjust height based on chart type
    if (this.config.type === 'pie' || this.config.type === 'doughnut') {
      height = Math.min(height, 350);
    }

    this.chartHeight.set(height);
  }

  initializeChart(): void {
    console.log('🔄 Chart: Initializing chart...');
    console.log('🔄 Chart: chartContainer available:', !!this.chartContainer);
    console.log('🔄 Chart: data available:', this.data);
    console.log('🔄 Chart: data length:', this.data?.length);
    
    if (!this.chartContainer) {
      console.log('❌ Chart: chartContainer not available, retrying...');
      // Retry after a short delay
      setTimeout(() => {
        this.initializeChart();
      }, 100);
      return;
    }

    try {
      // Destroy existing chart if it exists
      if (this.chart) {
        this.chart.destroy();
        this.chart = null;
      }

      // Register Chart.js components
      Chart.register(...registerables);

      // Create Chart.js configuration
      const chartConfig = this.createChartConfig();
      
      // Create the chart
      this.chart = new Chart(this.chartContainer.nativeElement, chartConfig);
      
      console.log('✅ Chart: Chart.js chart created successfully');
      this.isChartReady.set(true);
      this.chartError.set(null);
    } catch (error) {
      console.error('❌ Chart: Initialization error:', error);
      this.chartError.set('Failed to initialize chart');
    }
  }

  private createChartConfig(): ChartConfiguration {
    const chartData: ChartJSData = {
      labels: this.data.map(item => item.label),
      datasets: [{
        label: this.title || 'Data',
        data: this.data.map(item => item.value),
        backgroundColor: this.data.map((item, index) => 
          item.color || this.config.colors[index % this.config.colors.length]
        ),
        borderColor: this.data.map((item, index) => 
          item.color || this.config.colors[index % this.config.colors.length]
        ),
        borderWidth: 1
      }]
    };

    const chartType: ChartType = this.config.type === 'area' ? 'line' : this.config.type as ChartType;

    return {
      type: chartType,
      data: chartData,
      options: {
        responsive: this.config.responsive,
        maintainAspectRatio: this.config.maintainAspectRatio,
        plugins: {
          legend: {
            display: this.config.showLegend,
            position: this.getLegendPosition()
          },
          tooltip: {
            enabled: this.config.showTooltips
          }
        },
        animation: this.config.animation ? {} : false,
        scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
          y: {
            beginAtZero: true
          }
        } : undefined
      }
    };
  }

  private resizeChart(): void {
    if (!this.isChartReady() || !this.chart) return;

    // Resize the Chart.js chart
    this.chart.resize();
    console.log('Chart resized for screen width:', this.screenWidth());
  }

  getChartStyle(): { [key: string]: string } {
    return {
      'height': `${this.chartHeight()}px`,
      'width': '100%'
    };
  }

  getChartClasses(): string {
    const classes = ['responsive-chart'];
    
    if (this.className) {
      classes.push(this.className);
    }
    
    classes.push(`chart-${this.config.type}`);
    classes.push(`chart-${this.isMobile() ? 'mobile' : this.isTablet() ? 'tablet' : 'desktop'}`);
    
    if (this.loading) {
      classes.push('chart-loading');
    }
    
    if (this.error || this.chartError()) {
      classes.push('chart-error');
    }
    
    if (!this.data || this.data.length === 0) {
      classes.push('chart-empty');
    }
    
    return classes.join(' ');
  }

  getChartContainerStyle(): { [key: string]: string } {
    return {
      'height': `${this.chartHeight()}px`,
      'width': '100%',
      'position': 'relative'
    };
  }

  // Chart data processing
  getProcessedData(): CustomChartData[] {
    if (!this.data || this.data.length === 0) return [];
    
    return this.data.map((item, index) => ({
      ...item,
      color: item.color || this.config.colors[index % this.config.colors.length]
    }));
  }

  getTotalValue(): number {
    return this.data.reduce((sum, item) => sum + item.value, 0);
  }

  getMaxValue(): number {
    return Math.max(...this.data.map(item => item.value), 0);
  }

  getMinValue(): number {
    if (!this.data || this.data.length === 0) return 0;
    return Math.min(...this.data.map(item => item.value));
  }

  // Chart type specific methods
  isPieChart(): boolean {
    return this.config.type === 'pie' || this.config.type === 'doughnut';
  }

  isLineChart(): boolean {
    return this.config.type === 'line' || this.config.type === 'area';
  }

  isBarChart(): boolean {
    return this.config.type === 'bar';
  }

  // Responsive helpers
  getLegendPosition(): 'top' | 'bottom' | 'left' | 'right' {
    if (this.isMobile()) return 'bottom';
    if (this.isTablet()) return 'right';
    return 'right';
  }

  getTooltipPosition(): 'top' | 'bottom' | 'left' | 'right' {
    if (this.isMobile()) return 'top';
    return 'top';
  }

  // Event handlers
  onChartClick(event: any): void {
    console.log('Chart clicked:', event);
  }

  onChartHover(event: any): void {
    console.log('Chart hovered:', event);
  }

  // Loading and error states
  get isLoading(): boolean {
    return this.loading || !this.isChartReady();
  }

  get hasError(): boolean {
    return !!(this.error || this.chartError());
  }

  get isEmpty(): boolean {
    return !this.data || this.data.length === 0;
  }

  get errorMessage(): string {
    return this.error || this.chartError() || 'An error occurred';
  }
}
