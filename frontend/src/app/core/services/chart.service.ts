import { Injectable } from '@angular/core';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  FinancialDashboard,
  TransactionStats,
  CategoryStats
} from '../models/financial.model';

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  pointBackgroundColor?: string | string[];
  pointBorderColor?: string | string[];
  pointHoverBackgroundColor?: string | string[];
  pointHoverBorderColor?: string | string[];
  yAxisID?: string;
  type?: string;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  plugins: {
    legend: {
      position: 'top' | 'bottom' | 'left' | 'right';
      labels: {
        usePointStyle: boolean;
        padding: number;
        font: {
          size: number;
        };
      };
    };
    tooltip: {
      backgroundColor: string;
      titleColor: string;
      bodyColor: string;
      borderColor: string;
      borderWidth: number;
      cornerRadius: number;
      displayColors: boolean;
      callbacks?: any;
    };
    title?: {
      display: boolean;
      text: string;
      font: {
        size: number;
        weight: string;
      };
    };
  };
  scales?: any;
  elements?: any;
  interaction?: any;
}

export interface TimeSeriesData {
  date: Date;
  value: number;
  label?: string;
}

export interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  savingsRate: number;
  averageMonthlyIncome: number;
  averageMonthlyExpenses: number;
  topCategory: string;
  topCategoryAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  
  // Color palettes for different chart types
  private readonly colorPalettes = {
    primary: [
      '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
      '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d'
    ],
    pastel: [
      '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
      '#10ac84', '#ee5a24', '#0984e3', '#a29bfe', '#fd79a8'
    ],
    financial: [
      '#2ecc71', '#e74c3c', '#f39c12', '#3498db', '#9b59b6',
      '#1abc9c', '#e67e22', '#34495e', '#f1c40f', '#e91e63'
    ],
    gradient: [
      'rgba(0, 123, 255, 0.8)', 'rgba(40, 167, 69, 0.8)', 'rgba(220, 53, 69, 0.8)',
      'rgba(255, 193, 7, 0.8)', 'rgba(23, 162, 184, 0.8)', 'rgba(111, 66, 193, 0.8)'
    ]
  };

  // Default chart options
  private readonly defaultOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
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

  constructor() { }

  // Generate expense trend chart data
  generateExpenseTrendChart(transactions: Transaction[], period: string = 'month'): ChartData {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const groupedData = this.groupTransactionsByPeriod(expenses, period);
    
    return {
      labels: groupedData.map(d => d.period),
      datasets: [{
        label: 'Expenses',
        data: groupedData.map(d => d.amount),
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        borderColor: 'rgba(220, 53, 69, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(220, 53, 69, 1)',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: 'rgba(220, 53, 69, 1)'
      }]
    };
  }

  // Generate income trend chart data
  generateIncomeTrendChart(transactions: Transaction[], period: string = 'month'): ChartData {
    const income = transactions.filter(t => t.type === TransactionType.INCOME);
    const groupedData = this.groupTransactionsByPeriod(income, period);
    
    return {
      labels: groupedData.map(d => d.period),
      datasets: [{
        label: 'Income',
        data: groupedData.map(d => d.amount),
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: 'rgba(40, 167, 69, 1)',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: 'rgba(40, 167, 69, 1)'
      }]
    };
  }

  // Generate category spending pie chart data
  generateCategorySpendingChart(transactions: Transaction[], categories: Category[]): ChartData {
    const categoryData = this.calculateCategorySpending(transactions, categories);
    
    return {
      labels: categoryData.map(c => c.name),
      datasets: [{
        label: 'Spending by Category',
        data: categoryData.map(c => c.value),
        backgroundColor: categoryData.map(c => c.color),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 4
      }]
    };
  }

  // Generate net income trend chart (multi-line)
  generateNetIncomeTrendChart(transactions: Transaction[], period: string = 'month'): ChartData {
    const groupedData = this.calculateNetIncomeByPeriod(transactions, period);
    
    return {
      labels: groupedData.map(d => d.period),
      datasets: [
        {
          label: 'Net Income',
          data: groupedData.map(d => d.net),
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          borderColor: 'rgba(0, 123, 255, 1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          yAxisID: 'y'
        },
        {
          label: 'Income',
          data: groupedData.map(d => d.income),
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Expenses',
          data: groupedData.map(d => d.expenses),
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          borderColor: 'rgba(220, 53, 69, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: 'y'
        }
      ]
    };
  }

  // Generate monthly spending comparison chart (bar chart)
  generateMonthlySpendingComparison(transactions: Transaction[]): ChartData {
    const monthlyData = this.calculateMonthlySpendingComparison(transactions);
    
    return {
      labels: monthlyData.map(d => d.month),
      datasets: [{
        label: 'Monthly Spending',
        data: monthlyData.map(d => d.amount),
        backgroundColor: this.colorPalettes.gradient,
        borderColor: this.colorPalettes.primary,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    };
  }

  // Generate savings rate trend chart
  generateSavingsRateChart(transactions: Transaction[], period: string = 'month'): ChartData {
    const savingsData = this.calculateSavingsRateByPeriod(transactions, period);
    
    return {
      labels: savingsData.map(d => d.period),
      datasets: [{
        label: 'Savings Rate (%)',
        data: savingsData.map(d => d.savingsRate),
        backgroundColor: 'rgba(23, 162, 184, 0.1)',
        borderColor: 'rgba(23, 162, 184, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y'
      }]
    };
  }

  // Generate category trend chart (multiple categories over time)
  generateCategoryTrendChart(transactions: Transaction[], categories: Category[], period: string = 'month'): ChartData {
    const categoryTrends = this.calculateCategoryTrends(transactions, categories, period);
    const labels = categoryTrends[0]?.data.map(d => d.period) || [];
    
    const datasets = categoryTrends.map((trend, index) => ({
      label: trend.categoryName,
      data: trend.data.map(d => d.amount),
      backgroundColor: this.colorPalettes.primary[index % this.colorPalettes.primary.length] + '20',
      borderColor: this.colorPalettes.primary[index % this.colorPalettes.primary.length],
      borderWidth: 2,
      fill: false,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6
    }));

    return {
      labels,
      datasets
    };
  }

  // Generate financial health gauge chart data
  generateFinancialHealthGauge(metrics: FinancialMetrics): any {
    const savingsRate = Math.max(0, Math.min(100, metrics.savingsRate));
    
    return {
      type: 'doughnut',
      data: {
        labels: ['Savings Rate', 'Remaining'],
        datasets: [{
          data: [savingsRate, 100 - savingsRate],
          backgroundColor: [
            savingsRate >= 20 ? '#28a745' : savingsRate >= 10 ? '#ffc107' : '#dc3545',
            '#e9ecef'
          ],
          borderWidth: 0,
          cutout: '70%'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        }
      }
    };
  }

  // Generate spending heatmap data (for calendar view)
  generateSpendingHeatmap(transactions: Transaction[], year: number): any {
    const heatmapData = this.calculateSpendingHeatmap(transactions, year);
    
    return {
      labels: heatmapData.map(d => d.date),
      datasets: [{
        label: 'Daily Spending',
        data: heatmapData.map(d => ({ x: d.date, y: d.amount })),
        backgroundColor: heatmapData.map(d => this.getHeatmapColor(d.amount, heatmapData)),
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    };
  }

  // Generate scatter plot for income vs expenses correlation
  generateIncomeExpenseScatter(transactions: Transaction[]): ChartData {
    const scatterData = this.calculateIncomeExpenseCorrelation(transactions);
    
    return {
      labels: scatterData.map(d => d.period),
      datasets: [{
        label: 'Income vs Expenses',
        data: scatterData.map(d => ({ x: d.income, y: d.expenses })),
        backgroundColor: 'rgba(0, 123, 255, 0.6)',
        borderColor: 'rgba(0, 123, 255, 1)',
        pointRadius: 8,
        pointHoverRadius: 10,
        pointBackgroundColor: 'rgba(0, 123, 255, 0.8)',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: 'rgba(0, 123, 255, 1)'
      }]
    };
  }

  // Get chart options with custom configuration
  getChartOptions(type: string, customOptions: Partial<ChartOptions> = {}): ChartOptions {
    const baseOptions = { ...this.defaultOptions, ...customOptions };
    
    switch (type) {
      case 'line':
        return {
          ...baseOptions,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Time Period'
              }
            },
            y: {
              display: true,
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
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        };
      
      case 'bar':
        return {
          ...baseOptions,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Categories'
              }
            },
            y: {
              display: true,
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
        };
      
      case 'pie':
      case 'doughnut':
        return {
          ...baseOptions,
          plugins: {
            ...baseOptions.plugins,
            tooltip: {
              ...baseOptions.plugins.tooltip,
              callbacks: {
                label: function(context: any) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: $${value.toLocaleString()} (${percentage}%)`;
                }
              }
            }
          }
        };
      
      case 'scatter':
        return {
          ...baseOptions,
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: 'Income ($)'
              },
              ticks: {
                callback: function(value: any) {
                  return '$' + value.toLocaleString();
                }
              }
            },
            y: {
              display: true,
              title: {
                display: true,
                text: 'Expenses ($)'
              },
              ticks: {
                callback: function(value: any) {
                  return '$' + value.toLocaleString();
                }
              }
            }
          }
        };
      
      default:
        return baseOptions;
    }
  }

  // Export chart data to CSV
  exportChartDataToCSV(chartData: ChartData, filename: string = 'chart-data.csv'): void {
    const csvContent = this.convertChartDataToCSV(chartData);
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  // Export chart as image
  exportChartAsImage(canvas: HTMLCanvasElement, filename: string = 'chart.png'): void {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  // Private helper methods
  private groupTransactionsByPeriod(transactions: Transaction[], period: string): { period: string; amount: number }[] {
    const periodMap = new Map<string, number>();
    
    transactions.forEach(transaction => {
      try {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) return;
        
        let periodKey: string;
        switch (period) {
          case 'day':
            periodKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            break;
          case 'month':
            periodKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            break;
          case 'quarter':
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `Q${quarter} ${date.getFullYear()}`;
            break;
          case 'year':
            periodKey = date.getFullYear().toString();
            break;
          default:
            periodKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        
        periodMap.set(periodKey, (periodMap.get(periodKey) || 0) + transaction.amount);
      } catch (error) {
        console.warn('Invalid date in transaction:', transaction.date);
      }
    });

    return Array.from(periodMap.entries())
      .map(([period, amount]) => ({ period, amount }))
      .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
  }

  private calculateCategorySpending(transactions: Transaction[], categories: Category[]): CategoryData[] {
    const categoryMap = new Map<string, number>();
    
    transactions
      .filter(t => t.type === TransactionType.EXPENSE && t.categoryId)
      .forEach(transaction => {
        const categoryName = this.getCategoryName(transaction.categoryId, categories);
        categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + transaction.amount);
      });

    const total = Array.from(categoryMap.values()).reduce((sum, amount) => sum + amount, 0);
    
    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: this.colorPalettes.primary[Array.from(categoryMap.keys()).indexOf(name) % this.colorPalettes.primary.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  private calculateNetIncomeByPeriod(transactions: Transaction[], period: string): { period: string; income: number; expenses: number; net: number }[] {
    const periodMap = new Map<string, { income: number; expenses: number }>();
    
    transactions.forEach(transaction => {
      try {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) return;
        
        let periodKey: string;
        switch (period) {
          case 'day':
            periodKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            break;
          case 'month':
            periodKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            break;
          case 'quarter':
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            periodKey = `Q${quarter} ${date.getFullYear()}`;
            break;
          case 'year':
            periodKey = date.getFullYear().toString();
            break;
          default:
            periodKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }
        
        const current = periodMap.get(periodKey) || { income: 0, expenses: 0 };
        
        if (transaction.type === TransactionType.INCOME) {
          current.income += transaction.amount;
        } else {
          current.expenses += transaction.amount;
        }
        
        periodMap.set(periodKey, current);
      } catch (error) {
        console.warn('Invalid date in transaction:', transaction.date);
      }
    });

    return Array.from(periodMap.entries())
      .map(([period, data]) => ({
        period,
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      }))
      .sort((a, b) => new Date(a.period).getTime() - new Date(b.period).getTime());
  }

  private calculateMonthlySpendingComparison(transactions: Transaction[]): { month: string; amount: number }[] {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    return this.groupTransactionsByPeriod(expenses, 'month');
  }

  private calculateSavingsRateByPeriod(transactions: Transaction[], period: string): { period: string; savingsRate: number }[] {
    const netIncomeData = this.calculateNetIncomeByPeriod(transactions, period);
    
    return netIncomeData.map(data => ({
      period: data.period,
      savingsRate: data.income > 0 ? (data.net / data.income) * 100 : 0
    }));
  }

  private calculateCategoryTrends(transactions: Transaction[], categories: Category[], period: string): { categoryName: string; data: { period: string; amount: number }[] }[] {
    const topCategories = this.calculateCategorySpending(transactions, categories).slice(0, 5);
    
    return topCategories.map(category => {
      const categoryTransactions = transactions.filter(t => 
        t.type === TransactionType.EXPENSE && 
        t.categoryId && 
        this.getCategoryName(t.categoryId, categories) === category.name
      );
      
      return {
        categoryName: category.name,
        data: this.groupTransactionsByPeriod(categoryTransactions, period)
      };
    });
  }

  private calculateSpendingHeatmap(transactions: Transaction[], year: number): { date: string; amount: number }[] {
    const expenses = transactions.filter(t => 
      t.type === TransactionType.EXPENSE && 
      new Date(t.date).getFullYear() === year
    );
    
    const dailyMap = new Map<string, number>();
    
    expenses.forEach(transaction => {
      try {
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) return;
        
        const dateKey = date.toISOString().split('T')[0];
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + transaction.amount);
      } catch (error) {
        console.warn('Invalid date in transaction:', transaction.date);
      }
    });

    return Array.from(dailyMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private calculateIncomeExpenseCorrelation(transactions: Transaction[]): { period: string; income: number; expenses: number }[] {
    const monthlyData = this.calculateNetIncomeByPeriod(transactions, 'month');
    
    return monthlyData.map(data => ({
      period: data.period,
      income: data.income,
      expenses: data.expenses
    }));
  }

  private getCategoryName(categoryId: string, categories: Category[]): string {
    const category = categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  private getHeatmapColor(amount: number, data: { amount: number }[]): string {
    const maxAmount = Math.max(...data.map(d => d.amount));
    const intensity = amount / maxAmount;
    
    if (intensity === 0) return '#f8f9fa';
    if (intensity < 0.2) return '#d1ecf1';
    if (intensity < 0.4) return '#bee5eb';
    if (intensity < 0.6) return '#7dd3fc';
    if (intensity < 0.8) return '#38bdf8';
    return '#0ea5e9';
  }

  private convertChartDataToCSV(chartData: ChartData): string {
    const headers = ['Label', ...chartData.datasets.map(dataset => dataset.label)];
    const rows = chartData.labels.map((label, index) => {
      const values = chartData.datasets.map(dataset => dataset.data[index] || 0);
      return [label, ...values].join(',');
    });
    
    return [headers.join(','), ...rows].join('\n');
  }

  private downloadFile(content: string, filename: string, contentType: string): void {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
