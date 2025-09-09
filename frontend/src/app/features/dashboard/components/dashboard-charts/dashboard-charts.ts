import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, interval } from 'rxjs';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  FinancialDashboard
} from '../../../../core/models/financial.model';
import { ChartService, ChartData, ChartOptions } from '../../../../core/services/chart.service';
import { SharedChartService } from '../../../../shared/chart/chart.service';
import { Chart, ChartConfiguration, ChartType } from 'chart.js';

export interface RealTimeData {
  timestamp: Date;
  value: number;
  label: string;
}

export interface QuickStats {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyNet: number;
  savingsRate: number;
  topCategory: string;
  topCategoryAmount: number;
}

@Component({
  selector: 'app-dashboard-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-charts.html',
  styleUrls: ['./dashboard-charts.scss']
})
export class DashboardChartsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() transactions: Transaction[] = [];
  @Input() categories: Category[] = [];
  @Input() dashboard: FinancialDashboard | null = null;
  @Input() autoRefresh: boolean = true;
  @Input() refreshInterval: number = 30000; // 30 seconds

  @ViewChild('balanceChart', { static: false }) balanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('incomeExpenseChart', { static: false }) incomeExpenseChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart', { static: false }) categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart', { static: false }) trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('realtimeChart', { static: false }) realtimeChartRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private chartService = inject(ChartService);
  private sharedChartService = inject(SharedChartService);
  private refreshTimer$ = interval(this.refreshInterval);

  // Chart instances
  private balanceChart: Chart | null = null;
  private incomeExpenseChart: Chart | null = null;
  private categoryChart: Chart | null = null;
  private trendChart: Chart | null = null;
  private realtimeChart: Chart | null = null;

  // Chart data
  balanceChartData: ChartData | null = null;
  incomeExpenseChartData: ChartData | null = null;
  categoryChartData: ChartData | null = null;
  trendChartData: ChartData | null = null;
  realtimeData: RealTimeData[] = [];

  // Quick stats
  quickStats: QuickStats | null = null;

  // UI State
  isLoading: boolean = false;
  lastUpdated: Date = new Date();
  isRealTimeMode: boolean = false;

  ngOnInit(): void {
    this.initializeDashboardCharts();
    this.setupAutoRefresh();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions'] || changes['categories'] || changes['dashboard']) {
      this.updateDashboardCharts();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDashboardCharts(): void {
    this.updateDashboardCharts();
  }

  private setupAutoRefresh(): void {
    if (this.autoRefresh) {
      this.refreshTimer$
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.refreshCharts();
        });
    }
  }

  private updateDashboardCharts(): void {
    if (!this.transactions || !Array.isArray(this.transactions) || this.transactions.length === 0) return;

    this.isLoading = true;
    
    setTimeout(() => {
      this.generateBalanceChart();
      this.generateIncomeExpenseChart();
      this.generateCategoryChart();
      this.generateTrendChart();
      this.generateRealtimeChart();
      this.calculateQuickStats();
      this.lastUpdated = new Date();
      this.isLoading = false;
    }, 100);
  }

  private generateBalanceChart(): void {
    const balanceData = this.calculateBalanceOverTime();
    
    this.balanceChartData = {
      labels: balanceData.map(d => d.period),
      datasets: [{
        label: 'Account Balance',
        data: balanceData.map(d => d.balance),
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        borderColor: 'rgba(0, 123, 255, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(0, 123, 255, 1)',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: 'rgba(0, 123, 255, 1)'
      }]
    };

    this.createBalanceChart();
  }

  private generateIncomeExpenseChart(): void {
    const monthlyData = this.calculateMonthlyIncomeExpense();
    
    this.incomeExpenseChartData = {
      labels: monthlyData.map(d => d.period),
      datasets: [
        {
          label: 'Income',
          data: monthlyData.map(d => d.income),
          backgroundColor: 'rgba(40, 167, 69, 0.8)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 2,
          borderRadius: 4,
          // borderSkipped: false // Not supported in Chart.js
        },
        {
          label: 'Expenses',
          data: monthlyData.map(d => d.expenses),
          backgroundColor: 'rgba(220, 53, 69, 0.8)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 2,
          borderRadius: 4,
          // borderSkipped: false // Not supported in Chart.js
        }
      ]
    };

    this.createIncomeExpenseChart();
  }

  private generateCategoryChart(): void {
    this.categoryChartData = this.chartService.generateCategorySpendingChart(this.transactions, this.categories);
    this.createCategoryChart();
  }

  private generateTrendChart(): void {
    this.trendChartData = this.chartService.generateNetIncomeTrendChart(this.transactions, 'month');
    this.createTrendChart();
  }

  private generateRealtimeChart(): void {
    this.realtimeData = this.generateRealtimeData();
    this.createRealtimeChart();
  }

  private calculateQuickStats(): void {
    const totalIncome = this.transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = this.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;
    
    const categoryData = this.chartService['calculateCategorySpending'](this.transactions, this.categories);
    const topCategory = categoryData.length > 0 ? categoryData[0] : { name: 'None', value: 0 };
    
    this.quickStats = {
      totalBalance: this.calculateCurrentBalance(),
      monthlyIncome: totalIncome / 12,
      monthlyExpenses: totalExpenses / 12,
      monthlyNet: netIncome / 12,
      savingsRate,
      topCategory: topCategory.name,
      topCategoryAmount: topCategory.value
    };
  }

  // Chart creation methods
  private createBalanceChart(): void {
    if (!this.balanceChartData) return;

    const canvasRef = this.balanceChartRef?.nativeElement;
    if (!canvasRef) return;

    if (this.balanceChart) {
      this.balanceChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: this.balanceChartData as any,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Account Balance Over Time'
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time Period'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Balance ($)'
            },
            ticks: {
              callback: function(value: any) {
                return '$' + value.toLocaleString();
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    this.balanceChart = this.sharedChartService.createChart(canvasRef, config);
  }

  private createIncomeExpenseChart(): void {
    if (!this.incomeExpenseChartData) return;

    const canvasRef = this.incomeExpenseChartRef?.nativeElement;
    if (!canvasRef) return;

    if (this.incomeExpenseChart) {
      this.incomeExpenseChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: this.incomeExpenseChartData as any,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Income vs Expenses'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Month'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Amount ($)'
            },
            ticks: {
              callback: function(value: any) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    };

    this.incomeExpenseChart = this.sharedChartService.createChart(canvasRef, config);
  }

  private createCategoryChart(): void {
    if (!this.categoryChartData) return;

    const canvasRef = this.categoryChartRef?.nativeElement;
    if (!canvasRef) return;

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: this.categoryChartData as any,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Spending by Category'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    this.categoryChart = this.sharedChartService.createChart(canvasRef, config);
  }

  private createTrendChart(): void {
    if (!this.trendChartData) return;

    const canvasRef = this.trendChartRef?.nativeElement;
    if (!canvasRef) return;

    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: this.trendChartData as any,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Net Income Trend'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time Period'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Amount ($)'
            },
            ticks: {
              callback: function(value: any) {
                return '$' + value.toLocaleString();
              }
            }
          }
        }
      }
    };

    this.trendChart = this.sharedChartService.createChart(canvasRef, config);
  }

  private createRealtimeChart(): void {
    if (!this.realtimeData.length) return;

    const canvasRef = this.realtimeChartRef?.nativeElement;
    if (!canvasRef) return;

    if (this.realtimeChart) {
      this.realtimeChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.realtimeData.map(d => d.timestamp.toLocaleTimeString()),
        datasets: [{
          label: 'Real-time Balance',
          data: this.realtimeData.map(d => d.value),
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          borderColor: 'rgba(255, 193, 7, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Real-time Balance Tracking'
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Balance ($)'
            },
            ticks: {
              callback: function(value: any) {
                return '$' + value.toLocaleString();
              }
            }
          }
        },
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        }
      }
    };

    this.realtimeChart = this.sharedChartService.createChart(canvasRef, config);
  }

  // Helper methods
  private calculateBalanceOverTime(): { period: string; balance: number }[] {
    const monthlyData = this.chartService['calculateNetIncomeByPeriod'](this.transactions, 'month');
    let runningBalance = 0;
    
    return monthlyData.map(data => {
      runningBalance += data.net;
      return {
        period: data.period,
        balance: runningBalance
      };
    });
  }

  private calculateMonthlyIncomeExpense(): { period: string; income: number; expenses: number }[] {
    return this.chartService['calculateNetIncomeByPeriod'](this.transactions, 'month');
  }

  private calculateCurrentBalance(): number {
    const totalIncome = this.transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = this.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return totalIncome - totalExpenses;
  }

  private generateRealtimeData(): RealTimeData[] {
    const data: RealTimeData[] = [];
    const now = new Date();
    const baseBalance = this.calculateCurrentBalance();
    
    // Generate simulated real-time data for the last 24 hours
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const variation = (Math.random() - 0.5) * 100; // Random variation of ±$50
      const value = baseBalance + variation;
      
      data.push({
        timestamp,
        value: Math.max(0, value),
        label: `Balance at ${timestamp.toLocaleTimeString()}`
      });
    }
    
    return data;
  }

  // Public methods
  refreshCharts(): void {
    this.updateDashboardCharts();
  }

  toggleRealTimeMode(): void {
    this.isRealTimeMode = !this.isRealTimeMode;
    if (this.isRealTimeMode) {
      this.startRealTimeUpdates();
    } else {
      this.stopRealTimeUpdates();
    }
  }

  private startRealTimeUpdates(): void {
    // In a real application, this would connect to a WebSocket or polling service
    interval(5000) // Update every 5 seconds
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateRealtimeData();
      });
  }

  private stopRealTimeUpdates(): void {
    // Real-time updates are stopped when isRealTimeMode is false
  }

  private updateRealtimeData(): void {
    if (!this.isRealTimeMode) return;
    
    const newDataPoint: RealTimeData = {
      timestamp: new Date(),
      value: this.calculateCurrentBalance() + (Math.random() - 0.5) * 100,
      label: `Balance at ${new Date().toLocaleTimeString()}`
    };
    
    this.realtimeData.push(newDataPoint);
    
    // Keep only the last 24 data points
    if (this.realtimeData.length > 24) {
      this.realtimeData = this.realtimeData.slice(-24);
    }
    
    this.createRealtimeChart();
  }

  exportChart(chartType: string): void {
    const canvasRef = this.getCanvasRef(chartType);
    if (canvasRef) {
      this.chartService.exportChartAsImage(canvasRef, `dashboard-${chartType}-chart.png`);
    }
  }

  private getCanvasRef(chartType: string): HTMLCanvasElement | null {
    switch (chartType) {
      case 'balance': return this.balanceChartRef?.nativeElement || null;
      case 'incomeExpense': return this.incomeExpenseChartRef?.nativeElement || null;
      case 'category': return this.categoryChartRef?.nativeElement || null;
      case 'trend': return this.trendChartRef?.nativeElement || null;
      case 'realtime': return this.realtimeChartRef?.nativeElement || null;
      default: return null;
    }
  }
}
