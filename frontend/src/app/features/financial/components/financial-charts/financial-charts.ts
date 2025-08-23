import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  FinancialDashboard,
  TransactionStats
} from '../../../../core/models/financial.model';

// Chart interfaces for this component
interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

@Component({
  selector: 'app-financial-charts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './financial-charts.html',
  styleUrls: ['./financial-charts.scss']
})
export class FinancialChartsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() transactions: Transaction[] = [];
  @Input() categories: Category[] = [];
  @Input() dashboard: FinancialDashboard | null = null;
  @Input() period: string = 'month';
  @Input() showCharts: boolean = true;

  private destroy$ = new Subject<void>();

  // Chart data
  expenseChartData: ChartData | null = null;
  incomeChartData: ChartData | null = null;
  categoryChartData: ChartData | null = null;
  trendChartData: ChartData | null = null;

  // Chart options
  chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true
      }
    }
  };

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
    if (this.transactions.length === 0) return;

    this.generateExpenseChart();
    this.generateIncomeChart();
    this.generateCategoryChart();
    this.generateTrendChart();
  }

  private generateExpenseChart(): void {
    const expenses = this.transactions.filter(t => t.type === TransactionType.EXPENSE);
    const monthlyData = this.groupTransactionsByMonth(expenses);
    
    this.expenseChartData = {
      labels: monthlyData.map(d => d.month),
      datasets: [{
        label: 'Monthly Expenses',
        data: monthlyData.map(d => d.amount),
        backgroundColor: 'rgba(220, 53, 69, 0.8)',
        borderColor: 'rgba(220, 53, 69, 1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      }]
    };
  }

  private generateIncomeChart(): void {
    const income = this.transactions.filter(t => t.type === TransactionType.INCOME);
    const monthlyData = this.groupTransactionsByMonth(income);
    
    this.incomeChartData = {
      labels: monthlyData.map(d => d.month),
      datasets: [{
        label: 'Monthly Income',
        data: monthlyData.map(d => d.amount),
        backgroundColor: 'rgba(40, 167, 69, 0.8)',
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      }]
    };
  }

  private generateCategoryChart(): void {
    const categoryTotals = this.calculateCategoryTotals();
    
    this.categoryChartData = {
      labels: categoryTotals.map(c => c.name),
      datasets: [{
        label: 'Spending by Category',
        data: categoryTotals.map(c => c.amount),
        backgroundColor: this.generateColors(categoryTotals.length),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }

  private generateTrendChart(): void {
    const monthlyNet = this.calculateMonthlyNet();
    
    this.trendChartData = {
      labels: monthlyNet.map(d => d.month),
      datasets: [
        {
          label: 'Net Income',
          data: monthlyNet.map(d => d.net),
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Income',
          data: monthlyNet.map(d => d.income),
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        },
        {
          label: 'Expenses',
          data: monthlyNet.map(d => d.expenses),
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        }
      ]
    };
  }

  private groupTransactionsByMonth(transactions: Transaction[]): { month: string; amount: number }[] {
    const monthlyMap = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + transaction.amount);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }

  private calculateCategoryTotals(): { name: string; amount: number }[] {
    const categoryMap = new Map<string, number>();
    
    this.transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.categoryId)
      .forEach(transaction => {
        const categoryName = this.getCategoryName(transaction.categoryId);
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + transaction.amount);
      });

    return Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 categories
  }

  private calculateMonthlyNet(): { month: string; income: number; expenses: number; net: number }[] {
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    
    this.transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const current = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };
      
      if (transaction.type === TransactionType.INCOME) {
        current.income += transaction.amount;
      } else {
        current.expenses += transaction.amount;
      }
      
      monthlyMap.set(monthKey, current);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }

  private getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  private generateColors(count: number): string[] {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
    ];
    
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }

  onChartClick(event: any): void {
    // Handle chart click events if needed
    console.log('Chart clicked:', event);
  }

  exportChartData(): void {
    // Export chart data functionality
    console.log('Exporting chart data...');
  }
}