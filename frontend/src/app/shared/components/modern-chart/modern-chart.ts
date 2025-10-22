import { Component, Input, OnInit, OnDestroy, signal, computed, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

@Component({
  selector: 'app-modern-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modern-chart-container">
      <div class="chart-header" *ngIf="title">
        <h3>{{ title }}</h3>
        <div class="chart-actions">
          <button class="btn btn-sm btn-outline" (click)="toggleFullscreen()" *ngIf="allowFullscreen">
            <i class="fas" [class.fa-expand]="!isFullscreen()" [class.fa-compress]="isFullscreen()"></i>
          </button>
        </div>
      </div>
        <div class="chart-wrapper" [class.fullscreen]="isFullscreen()">
          <!-- Fullscreen close button -->
          <button class="fullscreen-close" *ngIf="isFullscreen()" (click)="toggleFullscreen()">
            <i class="fas fa-times"></i>
          </button>
          <canvas #chartCanvas></canvas>
          <div class="chart-loading" *ngIf="loading">
            <div class="spinner"></div>
            <p>Loading chart...</p>
          </div>
          <div class="chart-empty" *ngIf="!loading && (!data || data.length === 0)">
            <i class="fas fa-chart-bar"></i>
            <p>{{ emptyMessage || 'No data available' }}</p>
          </div>
        </div>
    </div>
  `,
  styles: [`
    .modern-chart-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px 0;
      margin-bottom: 16px;
    }

    .chart-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
    }

    .chart-actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .btn-sm {
      padding: 4px 8px;
      font-size: 11px;
    }

    .btn-outline {
      background: transparent;
    }

    .chart-wrapper {
      position: relative;
      flex: 1;
      min-height: 300px;
      padding: 0 20px 20px;
    }

    .chart-wrapper.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      background: white;
      padding: 20px;
    }

    .fullscreen-close {
      position: absolute;
      top: 20px;
      right: 20px;
      z-index: 1001;
      background: rgba(0, 0, 0, 0.1);
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      color: #374151;
    }

    .fullscreen-close:hover {
      background: rgba(0, 0, 0, 0.2);
      transform: scale(1.1);
    }

    .fullscreen-close i {
      font-size: 16px;
    }

    .chart-wrapper canvas {
      width: 100% !important;
      height: 100% !important;
    }

    .chart-loading,
    .chart-empty {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #6b7280;
    }

    .chart-loading .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e5e7eb;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .chart-empty i {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .chart-empty p {
      margin: 0;
      font-size: 16px;
    }
  `]
})
export class ModernChartComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() data: ChartData[] = [];
  @Input() type: ChartType = 'bar';
  @Input() title?: string;
  @Input() loading = false;
  @Input() emptyMessage?: string;
  @Input() allowFullscreen = true;

  @ViewChild('chartCanvas', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  isFullscreen = signal(false);

  // Modern color palette
  private readonly colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];

  ngOnInit() {
    // Chart will be created in ngAfterViewInit
  }

  ngAfterViewInit() {
    this.createChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private createChart() {
    if (!this.chartCanvas?.nativeElement || this.loading || !this.data || this.data.length === 0) {
      return;
    }

    const config = this.getChartConfig();
    this.chart = new Chart(this.chartCanvas.nativeElement, config);
  }

  private getChartConfig(): ChartConfiguration {
    const isPieChart = this.type === 'pie' || this.type === 'doughnut';
    
    if (isPieChart) {
      return {
        type: this.type,
        data: {
          labels: this.data.map(item => item.label),
          datasets: [{
            data: this.data.map(item => item.value),
            backgroundColor: this.data.map((item, index) => 
              item.color || this.colors[index % this.colors.length]
            ),
            borderColor: this.data.map((item, index) => 
              item.color || this.colors[index % this.colors.length]
            ),
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true
            }
          }
        }
      };
    }

    // For line/bar charts, group by currency if applicable
    const currencyGroups = this.groupDataByCurrency();
    
    return {
      type: this.type,
      data: {
        labels: this.getUniqueLabels(),
        datasets: currencyGroups.map((group, index) => ({
          label: group.currency,
          data: group.data,
          backgroundColor: group.color + '20',
          borderColor: group.color,
          borderWidth: 2,
          fill: this.type === 'line',
          tension: this.type === 'line' ? 0.4 : 0
        }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              font: {
                size: 11
              }
            }
          },
          x: {
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              font: {
                size: 11
              },
              maxRotation: 45,
              minRotation: 0
            }
          }
        }
      }
    };
  }

  private groupDataByCurrency(): any[] {
    const currencyMap = new Map<string, any[]>();
    
    this.data.forEach((item, index) => {
      const currencyMatch = item.label.match(/\(([^)]+)\)$/);
      const currency = currencyMatch ? currencyMatch[1] : 'All';
      
      if (!currencyMap.has(currency)) {
        currencyMap.set(currency, []);
      }
      currencyMap.get(currency)!.push({
        label: item.label,
        value: item.value,
        color: item.color || this.colors[index % this.colors.length]
      });
    });

    return Array.from(currencyMap.entries()).map(([currency, items]) => ({
      currency,
      data: items.map(item => item.value),
      color: items[0]?.color || this.colors[0]
    }));
  }

  private getUniqueLabels(): string[] {
    const labels = new Set<string>();
    this.data.forEach(item => {
      const timeMatch = item.label.match(/^([^(]+)/);
      if (timeMatch) {
        labels.add(timeMatch[1].trim());
      }
    });
    return Array.from(labels).sort();
  }

  toggleFullscreen() {
    this.isFullscreen.set(!this.isFullscreen());
    // Force a small delay to ensure DOM updates
    setTimeout(() => {
      if (this.chart) {
        this.chart.resize();
      }
    }, 200);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event) {
    if (this.isFullscreen()) {
      this.toggleFullscreen();
    }
  }
}
