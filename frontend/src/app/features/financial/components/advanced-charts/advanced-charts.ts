import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  FinancialDashboard
} from '../../../../core/models/financial.model';
import { ChartService, ChartData, ChartOptions, FinancialMetrics } from '../../../../core/services/chart.service';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
Chart.register(...registerables);

export interface HeatmapData {
  date: string;
  value: number;
  intensity: number;
}

export interface GaugeData {
  value: number;
  max: number;
  label: string;
  color: string;
}

export interface FinancialIndicator {
  name: string;
  value: number;
  target: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
}

@Component({
  selector: 'app-advanced-charts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './advanced-charts.html',
  styleUrls: ['./advanced-charts.scss']
})
export class AdvancedChartsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() transactions: Transaction[] = [];
  @Input() categories: Category[] = [];
  @Input() dashboard: FinancialDashboard | null = null;
  @Input() showCharts: boolean = true;

  @ViewChild('heatmapChart', { static: false }) heatmapChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('gaugeChart', { static: false }) gaugeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('indicatorChart', { static: false }) indicatorChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('waterfallChart', { static: false }) waterfallChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('radarChart', { static: false }) radarChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bubbleChart', { static: false }) bubbleChartRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private chartService = inject(ChartService);

  // Chart instances
  private heatmapChart: Chart | null = null;
  private gaugeChart: Chart | null = null;
  private indicatorChart: Chart | null = null;
  private waterfallChart: Chart | null = null;
  private radarChart: Chart | null = null;
  private bubbleChart: Chart | null = null;

  // Chart data
  heatmapData: HeatmapData[] = [];
  gaugeData: GaugeData[] = [];
  financialIndicators: FinancialIndicator[] = [];
  waterfallData: ChartData | null = null;
  radarData: ChartData | null = null;
  bubbleData: ChartData | null = null;

  // UI State
  selectedYear: number = new Date().getFullYear();
  selectedMetric: string = 'savingsRate';
  isLoading: boolean = false;

  // Available years
  availableYears: number[] = [];

  ngOnInit(): void {
    this.initializeAdvancedCharts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions'] || changes['categories'] || changes['dashboard']) {
      this.updateAdvancedCharts();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeAdvancedCharts(): void {
    this.generateAvailableYears();
    this.updateAdvancedCharts();
  }

  private updateAdvancedCharts(): void {
    if (!this.transactions || !Array.isArray(this.transactions) || this.transactions.length === 0) return;

    this.isLoading = true;
    
    setTimeout(() => {
      this.generateHeatmapData();
      this.generateGaugeData();
      this.generateFinancialIndicators();
      this.generateWaterfallChart();
      this.generateRadarChart();
      this.generateBubbleChart();
      this.isLoading = false;
    }, 100);
  }

  private generateAvailableYears(): void {
    if (!this.transactions || !Array.isArray(this.transactions)) return;
    
    const years = new Set<number>();
    this.transactions.forEach(transaction => {
      try {
        const date = new Date(transaction.date);
        if (!isNaN(date.getTime())) {
          years.add(date.getFullYear());
        }
      } catch (error) {
        console.warn('Invalid date in transaction:', transaction.date);
      }
    });
    
    this.availableYears = Array.from(years).sort((a, b) => b - a);
    if (this.availableYears.length > 0 && !this.availableYears.includes(this.selectedYear)) {
      this.selectedYear = this.availableYears[0];
    }
  }

  private generateHeatmapData(): void {
    const heatmapData = this.chartService['calculateSpendingHeatmap'](this.transactions, this.selectedYear);
    
    this.heatmapData = heatmapData.map(item => ({
      date: item.date,
      value: item.amount,
      intensity: this.calculateIntensity(item.amount, heatmapData)
    }));

    this.createHeatmapChart();
  }

  private generateGaugeData(): void {
    const metrics = this.calculateFinancialMetrics();
    
    this.gaugeData = [
      {
        value: Math.max(0, Math.min(100, metrics.savingsRate)),
        max: 100,
        label: 'Savings Rate',
        color: this.getGaugeColor(metrics.savingsRate)
      },
      {
        value: Math.max(0, Math.min(100, this.calculateDebtToIncomeRatio())),
        max: 100,
        label: 'Debt-to-Income',
        color: this.getGaugeColor(100 - this.calculateDebtToIncomeRatio())
      },
      {
        value: Math.max(0, Math.min(100, this.calculateEmergencyFundRatio())),
        max: 100,
        label: 'Emergency Fund',
        color: this.getGaugeColor(this.calculateEmergencyFundRatio())
      }
    ];

    this.createGaugeChart();
  }

  private generateFinancialIndicators(): void {
    const metrics = this.calculateFinancialMetrics();
    
    this.financialIndicators = [
      {
        name: 'Savings Rate',
        value: metrics.savingsRate,
        target: 20,
        status: this.getIndicatorStatus(metrics.savingsRate, 20),
        trend: this.calculateTrend('savingsRate')
      },
      {
        name: 'Debt-to-Income Ratio',
        value: this.calculateDebtToIncomeRatio(),
        target: 30,
        status: this.getIndicatorStatus(30 - this.calculateDebtToIncomeRatio(), 30),
        trend: this.calculateTrend('debtToIncome')
      },
      {
        name: 'Emergency Fund Coverage',
        value: this.calculateEmergencyFundRatio(),
        target: 80,
        status: this.getIndicatorStatus(this.calculateEmergencyFundRatio(), 80),
        trend: this.calculateTrend('emergencyFund')
      },
      {
        name: 'Investment Rate',
        value: this.calculateInvestmentRate(),
        target: 15,
        status: this.getIndicatorStatus(this.calculateInvestmentRate(), 15),
        trend: this.calculateTrend('investmentRate')
      },
      {
        name: 'Expense Growth Rate',
        value: this.calculateExpenseGrowthRate(),
        target: 5,
        status: this.getIndicatorStatus(5 - this.calculateExpenseGrowthRate(), 5),
        trend: this.calculateTrend('expenseGrowth')
      },
      {
        name: 'Income Stability',
        value: this.calculateIncomeStability(),
        target: 90,
        status: this.getIndicatorStatus(this.calculateIncomeStability(), 90),
        trend: this.calculateTrend('incomeStability')
      }
    ];

    this.createIndicatorChart();
  }

  private generateWaterfallChart(): void {
    const waterfallData = this.calculateWaterfallData();
    
    this.waterfallData = {
      labels: waterfallData.map(item => item.label),
      datasets: [{
        label: 'Cash Flow',
        data: waterfallData.map(item => item.value),
        backgroundColor: waterfallData.map(item => item.color),
        borderColor: waterfallData.map(item => item.borderColor),
        borderWidth: 2
      }]
    };

    this.createWaterfallChart();
  }

  private generateRadarChart(): void {
    const radarData = this.calculateRadarData();
    
    this.radarData = {
      labels: radarData.labels,
      datasets: [{
        label: 'Financial Health',
        data: radarData.values,
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        borderColor: 'rgba(0, 123, 255, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(0, 123, 255, 1)',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: 'rgba(0, 123, 255, 1)'
      }]
    };

    this.createRadarChart();
  }

  private generateBubbleChart(): void {
    const bubbleData = this.calculateBubbleData();
    
    this.bubbleData = {
      labels: bubbleData.map(item => item.label),
      datasets: [{
        label: 'Category Performance',
        data: bubbleData.map(item => ({
          x: item.amount,
          y: item.frequency,
          r: item.impact
        })),
        backgroundColor: bubbleData.map(item => item.color),
        borderColor: bubbleData.map(item => item.borderColor),
        borderWidth: 2
      }]
    };

    this.createBubbleChart();
  }

  // Chart creation methods
  private createHeatmapChart(): void {
    if (!this.heatmapData.length) return;

    const canvasRef = this.heatmapChartRef?.nativeElement;
    if (!canvasRef) return;

    if (this.heatmapChart) {
      this.heatmapChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Daily Spending',
          data: this.heatmapData.map(item => ({
            x: new Date(item.date).getTime(),
            y: item.value
          })),
          backgroundColor: this.heatmapData.map(item => this.getHeatmapColor(item.intensity)),
          borderColor: '#ffffff',
          borderWidth: 1,
          pointRadius: 8,
          pointHoverRadius: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Spending Heatmap - ${this.selectedYear}`
          },
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day'
            },
            title: {
              display: true,
              text: 'Date'
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

    this.heatmapChart = new Chart(canvasRef, config);
  }

  private createGaugeChart(): void {
    if (!this.gaugeData.length) return;

    const canvasRef = this.gaugeChartRef?.nativeElement;
    if (!canvasRef) return;

    if (this.gaugeChart) {
      this.gaugeChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: this.gaugeData.map(item => item.label),
        datasets: [{
          data: this.gaugeData.map(item => [item.value, item.max - item.value]),
          backgroundColor: this.gaugeData.map(item => [item.color, '#e9ecef']),
          borderWidth: 0,
          cutout: '70%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const item = this.gaugeData[context.dataIndex];
                return `${item.label}: ${item.value.toFixed(1)}%`;
              }.bind(this)
            }
          }
        }
      }
    };

    this.gaugeChart = new Chart(canvasRef, config);
  }

  private createIndicatorChart(): void {
    if (!this.financialIndicators.length) return;

    const canvasRef = this.indicatorChartRef?.nativeElement;
    if (!canvasRef) return;

    if (this.indicatorChart) {
      this.indicatorChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: this.financialIndicators.map(item => item.name),
        datasets: [{
          label: 'Current Value',
          data: this.financialIndicators.map(item => item.value),
          backgroundColor: this.financialIndicators.map(item => this.getStatusColor(item.status)),
          borderColor: this.financialIndicators.map(item => this.getStatusColor(item.status)),
          borderWidth: 2
        }, {
          label: 'Target',
          data: this.financialIndicators.map(item => item.target),
          backgroundColor: 'rgba(108, 117, 125, 0.3)',
          borderColor: 'rgba(108, 117, 125, 1)',
          borderWidth: 2,
          borderDash: [5, 5]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Financial Health Indicators'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Percentage (%)'
            }
          }
        }
      }
    };

    this.indicatorChart = new Chart(canvasRef, config);
  }

  private createWaterfallChart(): void {
    if (!this.waterfallData) return;

    const canvasRef = this.waterfallChartRef?.nativeElement;
    if (!canvasRef) return;

    if (this.waterfallChart) {
      this.waterfallChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: this.waterfallData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Cash Flow Waterfall'
          }
        },
        scales: {
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

    this.waterfallChart = new Chart(canvasRef, config);
  }

  private createRadarChart(): void {
    if (!this.radarData) return;

    const canvasRef = this.radarChartRef?.nativeElement;
    if (!canvasRef) return;

    if (this.radarChart) {
      this.radarChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'radar',
      data: this.radarData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Financial Health Radar'
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20
            }
          }
        }
      }
    };

    this.radarChart = new Chart(canvasRef, config);
  }

  private createBubbleChart(): void {
    if (!this.bubbleData) return;

    const canvasRef = this.bubbleChartRef?.nativeElement;
    if (!canvasRef) return;

    if (this.bubbleChart) {
      this.bubbleChart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'bubble',
      data: this.bubbleData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Category Performance Analysis'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Total Amount ($)'
            },
            ticks: {
              callback: function(value: any) {
                return '$' + value.toLocaleString();
              }
            }
          },
          y: {
            title: {
              display: true,
              text: 'Transaction Frequency'
            }
          }
        }
      }
    };

    this.bubbleChart = new Chart(canvasRef, config);
  }

  // Helper methods
  private calculateIntensity(amount: number, data: { amount: number }[]): number {
    const maxAmount = Math.max(...data.map(d => d.amount));
    return amount / maxAmount;
  }

  private calculateFinancialMetrics(): FinancialMetrics {
    const totalIncome = this.transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = this.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const netIncome = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;
    
    return {
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRate,
      averageMonthlyIncome: totalIncome / 12,
      averageMonthlyExpenses: totalExpenses / 12,
      topCategory: 'Unknown',
      topCategoryAmount: 0
    };
  }

  private calculateDebtToIncomeRatio(): number {
    // Simplified calculation - in real app, you'd have debt data
    const totalIncome = this.transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const debtPayments = this.transactions
      .filter(t => t.type === TransactionType.EXPENSE && 
        t.description?.toLowerCase().includes('loan') ||
        t.description?.toLowerCase().includes('debt') ||
        t.description?.toLowerCase().includes('credit')
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    return totalIncome > 0 ? (debtPayments / totalIncome) * 100 : 0;
  }

  private calculateEmergencyFundRatio(): number {
    // Simplified calculation - in real app, you'd have savings account data
    const monthlyExpenses = this.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0) / 12;
    
    const emergencyFund = monthlyExpenses * 6; // 6 months of expenses
    const currentSavings = this.transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0) * 0.1; // Assume 10% savings
    
    return emergencyFund > 0 ? (currentSavings / emergencyFund) * 100 : 0;
  }

  private calculateInvestmentRate(): number {
    const totalIncome = this.transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const investments = this.transactions
      .filter(t => t.type === TransactionType.EXPENSE && 
        t.description?.toLowerCase().includes('investment') ||
        t.description?.toLowerCase().includes('stock') ||
        t.description?.toLowerCase().includes('fund')
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    return totalIncome > 0 ? (investments / totalIncome) * 100 : 0;
  }

  private calculateExpenseGrowthRate(): number {
    // Simplified calculation - compare last 6 months to previous 6 months
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
    
    const recentExpenses = this.transactions
      .filter(t => t.type === TransactionType.EXPENSE && 
        new Date(t.date) >= sixMonthsAgo)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const previousExpenses = this.transactions
      .filter(t => t.type === TransactionType.EXPENSE && 
        new Date(t.date) >= twelveMonthsAgo && 
        new Date(t.date) < sixMonthsAgo)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return previousExpenses > 0 ? ((recentExpenses - previousExpenses) / previousExpenses) * 100 : 0;
  }

  private calculateIncomeStability(): number {
    // Simplified calculation based on income variance
    const monthlyIncome = this.chartService['groupTransactionsByPeriod'](
      this.transactions.filter(t => t.type === TransactionType.INCOME), 
      'month'
    );
    
    if (monthlyIncome.length < 2) return 100;
    
    const amounts = monthlyIncome.map(m => m.amount);
    const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    return Math.max(0, 100 - (coefficientOfVariation * 100));
  }

  private calculateTrend(metric: string): 'up' | 'down' | 'stable' {
    // Simplified trend calculation
    return 'stable';
  }

  private getIndicatorStatus(value: number, target: number): 'excellent' | 'good' | 'warning' | 'critical' {
    const ratio = value / target;
    if (ratio >= 1) return 'excellent';
    if (ratio >= 0.8) return 'good';
    if (ratio >= 0.5) return 'warning';
    return 'critical';
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'excellent': return '#28a745';
      case 'good': return '#20c997';
      case 'warning': return '#ffc107';
      case 'critical': return '#dc3545';
      default: return '#6c757d';
    }
  }

  private getGaugeColor(value: number): string {
    if (value >= 80) return '#28a745';
    if (value >= 60) return '#20c997';
    if (value >= 40) return '#ffc107';
    if (value >= 20) return '#fd7e14';
    return '#dc3545';
  }

  private getHeatmapColor(intensity: number): string {
    if (intensity === 0) return '#f8f9fa';
    if (intensity < 0.2) return '#d1ecf1';
    if (intensity < 0.4) return '#bee5eb';
    if (intensity < 0.6) return '#7dd3fc';
    if (intensity < 0.8) return '#38bdf8';
    return '#0ea5e9';
  }

  private calculateWaterfallData(): any[] {
    const monthlyData = this.chartService['calculateNetIncomeByPeriod'](this.transactions, 'month');
    const waterfall: any[] = [];
    
    let runningTotal = 0;
    monthlyData.forEach((month, index) => {
      waterfall.push({
        label: month.period,
        value: month.income,
        color: 'rgba(40, 167, 69, 0.8)',
        borderColor: 'rgba(40, 167, 69, 1)'
      });
      
      waterfall.push({
        label: `${month.period} Expenses`,
        value: -month.expenses,
        color: 'rgba(220, 53, 69, 0.8)',
        borderColor: 'rgba(220, 53, 69, 1)'
      });
      
      runningTotal += month.net;
      waterfall.push({
        label: `${month.period} Net`,
        value: runningTotal,
        color: 'rgba(0, 123, 255, 0.8)',
        borderColor: 'rgba(0, 123, 255, 1)'
      });
    });
    
    return waterfall;
  }

  private calculateRadarData(): { labels: string[]; values: number[] } {
    return {
      labels: ['Savings Rate', 'Debt Management', 'Emergency Fund', 'Investment', 'Expense Control', 'Income Stability'],
      values: [
        this.calculateFinancialMetrics().savingsRate,
        100 - this.calculateDebtToIncomeRatio(),
        this.calculateEmergencyFundRatio(),
        this.calculateInvestmentRate(),
        100 - Math.abs(this.calculateExpenseGrowthRate()),
        this.calculateIncomeStability()
      ]
    };
  }

  private calculateBubbleData(): any[] {
    const categoryData = this.chartService['calculateCategorySpending'](this.transactions, this.categories);
    
    return categoryData.map((category, index) => ({
      label: category.name,
      amount: category.value,
      frequency: this.calculateCategoryFrequency(category.name),
      impact: Math.sqrt(category.value) / 100, // Bubble size based on amount
      color: this.colorPalettes[index % this.colorPalettes.length],
      borderColor: this.colorPalettes[index % this.colorPalettes.length]
    }));
  }

  private calculateCategoryFrequency(categoryName: string): number {
    return this.transactions.filter(t => 
      t.type === TransactionType.EXPENSE && 
      this.getCategoryName(t.categoryId) === categoryName
    ).length;
  }

  private getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  private get colorPalettes(): string[] {
    return [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
  }

  // Event handlers
  onYearChange(): void {
    this.updateAdvancedCharts();
  }

  onMetricChange(): void {
    this.updateAdvancedCharts();
  }

  refreshCharts(): void {
    this.updateAdvancedCharts();
  }

  exportChart(chartType: string): void {
    const canvasRef = this.getCanvasRef(chartType);
    if (canvasRef) {
      this.chartService.exportChartAsImage(canvasRef, `${chartType}-chart.png`);
    }
  }

  private getCanvasRef(chartType: string): HTMLCanvasElement | null {
    switch (chartType) {
      case 'heatmap': return this.heatmapChartRef?.nativeElement || null;
      case 'gauge': return this.gaugeChartRef?.nativeElement || null;
      case 'indicator': return this.indicatorChartRef?.nativeElement || null;
      case 'waterfall': return this.waterfallChartRef?.nativeElement || null;
      case 'radar': return this.radarChartRef?.nativeElement || null;
      case 'bubble': return this.bubbleChartRef?.nativeElement || null;
      default: return null;
    }
  }
}
