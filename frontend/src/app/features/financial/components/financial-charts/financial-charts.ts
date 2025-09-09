import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  FinancialDashboard,
  TransactionStats
} from '../../../../core/models/financial.model';
import { ChartService, ChartData, ChartOptions, FinancialMetrics } from '../../../../core/services/chart.service';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-financial-charts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './financial-charts.html',
  styleUrls: ['./financial-charts.scss']
})
export class FinancialChartsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() transactions: Transaction[] = [];
  @Input() categories: Category[] = [];
  @Input() dashboard: FinancialDashboard | null = null;
  @Input() period: string = 'month';
  @Input() showCharts: boolean = true;

  @ViewChild('expenseChart', { static: false }) expenseChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('incomeChart', { static: false }) incomeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart', { static: false }) categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart', { static: false }) trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('savingsChart', { static: false }) savingsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('scatterChart', { static: false }) scatterChartRef!: ElementRef<HTMLCanvasElement>;

  private destroy$ = new Subject<void>();
  private chartService = inject(ChartService);

  // Chart instances
  private expenseChart: Chart | null = null;
  private incomeChart: Chart | null = null;
  private categoryChart: Chart | null = null;
  private trendChart: Chart | null = null;
  private savingsChart: Chart | null = null;
  private scatterChart: Chart | null = null;

  // Chart data
  expenseChartData: ChartData | null = null;
  incomeChartData: ChartData | null = null;
  categoryChartData: ChartData | null = null;
  trendChartData: ChartData | null = null;
  savingsChartData: ChartData | null = null;
  scatterChartData: ChartData | null = null;

  // Financial metrics
  financialMetrics: FinancialMetrics | null = null;

  // Chart options
  chartOptions: ChartOptions = this.chartService.getChartOptions('line');
  barChartOptions: ChartOptions = this.chartService.getChartOptions('bar');
  pieChartOptions: ChartOptions = this.chartService.getChartOptions('pie');
  scatterChartOptions: ChartOptions = this.chartService.getChartOptions('scatter');

  ngOnInit(): void {
    this.initializeCharts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions'] || changes['categories'] || changes['dashboard'] || changes['period']) {
      this.updateCharts();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeCharts(): void {
    this.updateCharts();
  }

  private updateCharts(): void {
    if (!this.transactions || !Array.isArray(this.transactions) || this.transactions.length === 0) return;

    this.generateExpenseChart();
    this.generateIncomeChart();
    this.generateCategoryChart();
    this.generateTrendChart();
    this.generateSavingsChart();
    this.generateScatterChart();
    this.calculateFinancialMetrics();
  }

  private generateExpenseChart(): void {
    this.expenseChartData = this.chartService.generateExpenseTrendChart(this.transactions, this.period);
    this.createChart('expense', this.expenseChartData, 'line');
  }

  private generateIncomeChart(): void {
    this.incomeChartData = this.chartService.generateIncomeTrendChart(this.transactions, this.period);
    this.createChart('income', this.incomeChartData, 'line');
  }

  private generateCategoryChart(): void {
    this.categoryChartData = this.chartService.generateCategorySpendingChart(this.transactions, this.categories);
    this.createChart('category', this.categoryChartData, 'doughnut');
  }

  private generateTrendChart(): void {
    this.trendChartData = this.chartService.generateNetIncomeTrendChart(this.transactions, this.period);
    this.createChart('trend', this.trendChartData, 'line');
  }

  private generateSavingsChart(): void {
    this.savingsChartData = this.chartService.generateSavingsRateChart(this.transactions, this.period);
    this.createChart('savings', this.savingsChartData, 'line');
  }

  private generateScatterChart(): void {
    this.scatterChartData = this.chartService.generateIncomeExpenseScatter(this.transactions);
    this.createChart('scatter', this.scatterChartData, 'scatter');
  }

  private calculateFinancialMetrics(): void {
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
    
    this.financialMetrics = {
      totalIncome,
      totalExpenses,
      netIncome,
      savingsRate,
      averageMonthlyIncome: totalIncome / 12,
      averageMonthlyExpenses: totalExpenses / 12,
      topCategory: topCategory.name,
      topCategoryAmount: topCategory.value
    };
  }

  private createChart(chartType: string, data: ChartData, type: ChartType): void {
    if (!data || data.labels.length === 0) return;

    const canvasRef = this.getCanvasRef(chartType);
    if (!canvasRef) return;

    const existingChart = this.getChartInstance(chartType);
    if (existingChart) {
      existingChart.destroy();
    }

    const options = this.getChartOptionsForType(type);
    const config: ChartConfiguration = {
      type,
      data: {
        labels: data.labels,
        datasets: data.datasets
      },
      options
    };

    const chart = new Chart(canvasRef, config);
    this.setChartInstance(chartType, chart);
  }

  private getCanvasRef(chartType: string): HTMLCanvasElement | null {
    switch (chartType) {
      case 'expense': return this.expenseChartRef?.nativeElement || null;
      case 'income': return this.incomeChartRef?.nativeElement || null;
      case 'category': return this.categoryChartRef?.nativeElement || null;
      case 'trend': return this.trendChartRef?.nativeElement || null;
      case 'savings': return this.savingsChartRef?.nativeElement || null;
      case 'scatter': return this.scatterChartRef?.nativeElement || null;
      default: return null;
    }
  }

  private getChartInstance(chartType: string): Chart | null {
    switch (chartType) {
      case 'expense': return this.expenseChart;
      case 'income': return this.incomeChart;
      case 'category': return this.categoryChart;
      case 'trend': return this.trendChart;
      case 'savings': return this.savingsChart;
      case 'scatter': return this.scatterChart;
      default: return null;
    }
  }

  private setChartInstance(chartType: string, chart: Chart): void {
    switch (chartType) {
      case 'expense': this.expenseChart = chart; break;
      case 'income': this.incomeChart = chart; break;
      case 'category': this.categoryChart = chart; break;
      case 'trend': this.trendChart = chart; break;
      case 'savings': this.savingsChart = chart; break;
      case 'scatter': this.scatterChart = chart; break;
    }
  }

  private getChartOptionsForType(type: ChartType): ChartOptions {
    switch (type) {
      case 'line': return this.chartOptions;
      case 'bar': return this.barChartOptions;
      case 'pie':
      case 'doughnut': return this.pieChartOptions;
      case 'scatter': return this.scatterChartOptions;
      default: return this.chartOptions;
    }
  }

  // Chart interaction methods
  onChartClick(event: any): void {
    console.log('Chart clicked:', event);
  }

  onChartHover(event: any): void {
    // Handle chart hover events if needed
  }

  // Export functionality
  exportChartData(): void {
    if (this.expenseChartData) {
      this.chartService.exportChartDataToCSV(this.expenseChartData, 'expense-data.csv');
    }
  }

  exportChartAsImage(chartType: string): void {
    const canvasRef = this.getCanvasRef(chartType);
    if (canvasRef) {
      this.chartService.exportChartAsImage(canvasRef, `${chartType}-chart.png`);
    }
  }

  // Chart refresh
  refreshCharts(): void {
    this.updateCharts();
  }

  // Period change
  onPeriodChange(newPeriod: string): void {
    this.period = newPeriod;
    this.updateCharts();
  }

}