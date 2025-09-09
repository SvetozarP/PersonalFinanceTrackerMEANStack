import { Injectable } from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';
import { zoomPlugin } from 'chartjs-plugin-zoom';

// Register zoom plugin
Chart.register(zoomPlugin);

export interface ZoomOptions {
  enabled: boolean;
  mode: 'x' | 'y' | 'xy';
  rangeMin?: { x?: number; y?: number };
  rangeMax?: { x?: number; y?: number };
  speed?: number;
}

export interface PanOptions {
  enabled: boolean;
  mode: 'x' | 'y' | 'xy';
  threshold?: number;
}

export interface DrillDownOptions {
  enabled: boolean;
  levels: DrillDownLevel[];
  onDrillDown?: (level: DrillDownLevel, data: any) => void;
  onDrillUp?: () => void;
}

export interface DrillDownLevel {
  name: string;
  label: string;
  dataProcessor: (data: any) => any;
  chartType: ChartType;
  chartOptions?: any;
}

export interface ChartInteractionConfig {
  zoom?: ZoomOptions;
  pan?: PanOptions;
  drillDown?: DrillDownOptions;
  tooltips?: boolean;
  legend?: boolean;
  animation?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChartInteractionService {

  constructor() { }

  // Create interactive chart configuration
  createInteractiveChart(
    type: ChartType,
    data: any,
    options: any = {},
    interactionConfig: ChartInteractionConfig = {}
  ): ChartConfiguration {
    const defaultConfig: ChartInteractionConfig = {
      zoom: {
        enabled: true,
        mode: 'xy',
        speed: 0.1
      },
      pan: {
        enabled: true,
        mode: 'xy',
        threshold: 10
      },
      drillDown: {
        enabled: false,
        levels: []
      },
      tooltips: true,
      legend: true,
      animation: true
    };

    const config = { ...defaultConfig, ...interactionConfig };

    return {
      type,
      data,
      options: {
        ...options,
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          ...options.plugins,
          legend: config.legend ? {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          } : { display: false },
          tooltip: config.tooltips ? {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              title: function(context: any) {
                return context[0].label;
              },
              label: function(context: any) {
                const label = context.dataset.label || '';
                const value = context.parsed.y || context.parsed;
                return `${label}: $${value.toLocaleString()}`;
              }
            }
          } : { enabled: false },
          zoom: config.zoom?.enabled ? {
            zoom: {
              wheel: {
                enabled: true,
                speed: config.zoom?.speed || 0.1
              },
              pinch: {
                enabled: true
              },
              mode: config.zoom?.mode || 'xy'
            },
            pan: config.pan?.enabled ? {
              enabled: true,
              mode: config.pan?.mode || 'xy',
              threshold: config.pan?.threshold || 10
            } : { enabled: false },
            limits: {
              x: {
                min: config.zoom?.rangeMin?.x,
                max: config.zoom?.rangeMax?.x
              },
              y: {
                min: config.zoom?.rangeMin?.y,
                max: config.zoom?.rangeMax?.y
              }
            }
          } : undefined
        },
        animation: config.animation ? {
          duration: 750,
          easing: 'easeInOutQuart'
        } : false,
        onClick: config.drillDown?.enabled ? (event: any, elements: any) => {
          this.handleDrillDown(event, elements, config.drillDown!);
        } : undefined
      }
    };
  }

  // Add zoom controls to chart
  addZoomControls(chart: Chart, containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'chart-zoom-controls';
    controlsDiv.innerHTML = `
      <button class="zoom-btn" data-action="zoomIn">
        <i class="fas fa-search-plus"></i>
      </button>
      <button class="zoom-btn" data-action="zoomOut">
        <i class="fas fa-search-minus"></i>
      </button>
      <button class="zoom-btn" data-action="resetZoom">
        <i class="fas fa-expand-arrows-alt"></i>
      </button>
      <button class="zoom-btn" data-action="panLeft">
        <i class="fas fa-arrow-left"></i>
      </button>
      <button class="zoom-btn" data-action="panRight">
        <i class="fas fa-arrow-right"></i>
      </button>
    `;

    // Add event listeners
    controlsDiv.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const action = target.closest('.zoom-btn')?.getAttribute('data-action');
      
      switch (action) {
        case 'zoomIn':
          this.zoomIn(chart);
          break;
        case 'zoomOut':
          this.zoomOut(chart);
          break;
        case 'resetZoom':
          this.resetZoom(chart);
          break;
        case 'panLeft':
          this.panLeft(chart);
          break;
        case 'panRight':
          this.panRight(chart);
          break;
      }
    });

    container.appendChild(controlsDiv);
  }

  // Add drill-down breadcrumb navigation
  addDrillDownBreadcrumb(containerId: string, levels: DrillDownLevel[], currentLevel: number): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    let breadcrumbDiv = document.getElementById('drill-down-breadcrumb');
    if (!breadcrumbDiv) {
      breadcrumbDiv = document.createElement('div');
      breadcrumbDiv.id = 'drill-down-breadcrumb';
      breadcrumbDiv.className = 'drill-down-breadcrumb';
      container.insertBefore(breadcrumbDiv, container.firstChild);
    }

    breadcrumbDiv.innerHTML = levels.slice(0, currentLevel + 1)
      .map((level, index) => `
        <span class="breadcrumb-item ${index === currentLevel ? 'active' : ''}" 
              data-level="${index}">
          ${level.label}
        </span>
        ${index < currentLevel ? '<i class="fas fa-chevron-right"></i>' : ''}
      `).join('');
  }

  // Enable real-time updates
  enableRealTimeUpdates(
    chart: Chart,
    updateInterval: number = 5000,
    dataUpdater: () => any
  ): () => void {
    const intervalId = setInterval(() => {
      const newData = dataUpdater();
      chart.data = newData;
      chart.update('none'); // Update without animation for real-time feel
    }, updateInterval);

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // Add chart export functionality
  addExportControls(chart: Chart, containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const exportDiv = document.createElement('div');
    exportDiv.className = 'chart-export-controls';
    exportDiv.innerHTML = `
      <button class="export-btn" data-format="png">
        <i class="fas fa-image"></i> PNG
      </button>
      <button class="export-btn" data-format="jpeg">
        <i class="fas fa-file-image"></i> JPEG
      </button>
      <button class="export-btn" data-format="pdf">
        <i class="fas fa-file-pdf"></i> PDF
      </button>
      <button class="export-btn" data-format="svg">
        <i class="fas fa-vector-square"></i> SVG
      </button>
    `;

    exportDiv.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const format = target.closest('.export-btn')?.getAttribute('data-format');
      if (format) {
        this.exportChart(chart, format);
      }
    });

    container.appendChild(exportDiv);
  }

  // Add chart fullscreen functionality
  addFullscreenControl(chart: Chart, containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const fullscreenBtn = document.createElement('button');
    fullscreenBtn.className = 'fullscreen-btn';
    fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
    fullscreenBtn.title = 'Toggle Fullscreen';

    fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen(container, chart);
    });

    container.appendChild(fullscreenBtn);
  }

  // Private methods
  private handleDrillDown(event: any, elements: any, drillDownConfig: DrillDownOptions): void {
    if (elements.length === 0) return;

    const element = elements[0];
    const datasetIndex = element.datasetIndex;
    const dataIndex = element.index;
    
    // Find the appropriate drill-down level
    const level = drillDownConfig.levels[datasetIndex];
    if (!level) return;

    // Process data for drill-down
    const drillDownData = level.dataProcessor({
      datasetIndex,
      dataIndex,
      originalData: event.chart.data
    });

    // Call drill-down callback
    if (drillDownConfig.onDrillDown) {
      drillDownConfig.onDrillDown(level, drillDownData);
    }
  }

  private zoomIn(chart: Chart): void {
    if (chart.options.plugins?.zoom) {
      chart.zoom(1.1);
    }
  }

  private zoomOut(chart: Chart): void {
    if (chart.options.plugins?.zoom) {
      chart.zoom(0.9);
    }
  }

  private resetZoom(chart: Chart): void {
    if (chart.options.plugins?.zoom) {
      chart.resetZoom();
    }
  }

  private panLeft(chart: Chart): void {
    if (chart.options.plugins?.zoom) {
      const scales = chart.scales;
      if (scales.x) {
        const range = scales.x.max - scales.x.min;
        chart.pan({ x: -range * 0.1 });
      }
    }
  }

  private panRight(chart: Chart): void {
    if (chart.options.plugins?.zoom) {
      const scales = chart.scales;
      if (scales.x) {
        const range = scales.x.max - scales.x.min;
        chart.pan({ x: range * 0.1 });
      }
    }
  }

  private exportChart(chart: Chart, format: string): void {
    const canvas = chart.canvas;
    const link = document.createElement('a');
    
    switch (format) {
      case 'png':
        link.download = `chart-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        break;
      case 'jpeg':
        link.download = `chart-${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.9);
        break;
      case 'pdf':
        this.exportToPDF(chart);
        return;
      case 'svg':
        this.exportToSVG(chart);
        return;
    }
    
    link.click();
  }

  private exportToPDF(chart: Chart): void {
    // This would require a PDF library like jsPDF
    console.log('PDF export not implemented - requires jsPDF library');
  }

  private exportToSVG(chart: Chart): void {
    const canvas = chart.canvas;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const img = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', canvas.toDataURL());
    img.setAttribute('width', canvas.width.toString());
    img.setAttribute('height', canvas.height.toString());
    
    svg.appendChild(img);
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `chart-${Date.now()}.svg`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  private toggleFullscreen(container: HTMLElement, chart: Chart): void {
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        chart.resize();
      });
    } else {
      document.exitFullscreen().then(() => {
        chart.resize();
      });
    }
  }

  // Utility methods
  createDrillDownLevel(
    name: string,
    label: string,
    dataProcessor: (data: any) => any,
    chartType: ChartType,
    chartOptions?: any
  ): DrillDownLevel {
    return {
      name,
      label,
      dataProcessor,
      chartType,
      chartOptions
    };
  }

  // Predefined drill-down levels for financial data
  createFinancialDrillDownLevels(): DrillDownLevel[] {
    return [
      this.createDrillDownLevel(
        'monthly',
        'Monthly View',
        (data) => this.processMonthlyDrillDown(data),
        'line'
      ),
      this.createDrillDownLevel(
        'weekly',
        'Weekly View',
        (data) => this.processWeeklyDrillDown(data),
        'bar'
      ),
      this.createDrillDownLevel(
        'daily',
        'Daily View',
        (data) => this.processDailyDrillDown(data),
        'scatter'
      ),
      this.createDrillDownLevel(
        'category',
        'Category Breakdown',
        (data) => this.processCategoryDrillDown(data),
        'pie'
      )
    ];
  }

  private processMonthlyDrillDown(data: any): any {
    // Process data for monthly drill-down
    return data;
  }

  private processWeeklyDrillDown(data: any): any {
    // Process data for weekly drill-down
    return data;
  }

  private processDailyDrillDown(data: any): any {
    // Process data for daily drill-down
    return data;
  }

  private processCategoryDrillDown(data: any): any {
    // Process data for category drill-down
    return data;
  }
}
