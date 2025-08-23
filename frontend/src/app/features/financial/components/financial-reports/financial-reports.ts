import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  FinancialReport,
  FinancialDashboard,
  TransactionStats,
  CategoryStats
} from '../../../../core/models/financial.model';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './financial-reports.html',
  styleUrls: ['./financial-reports.scss']
})
export class FinancialReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private financialService = inject(FinancialService);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);

  // Report configuration
  selectedPeriod: string = 'month';
  selectedReportType: string = 'summary';
  startDate: string = '';
  endDate: string = '';
  customDateRange: boolean = false;

  // Data
  transactions: Transaction[] = [];
  categories: Category[] = [];
  reportData: FinancialReport | null = null;
  transactionStats: TransactionStats | null = null;
  categoryStats: CategoryStats | null = null;

  // UI State
  isLoading: boolean = false;
  showAdvancedOptions: boolean = false;

  // Available periods
  periods = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Available report types
  reportTypes = [
    { value: 'summary', label: 'Summary Report', icon: 'fas fa-chart-pie' },
    { value: 'detailed', label: 'Detailed Report', icon: 'fas fa-list-alt' },
    { value: 'category', label: 'Category Analysis', icon: 'fas fa-tags' },
    { value: 'trends', label: 'Trend Analysis', icon: 'fas fa-chart-line' },
    { value: 'budget', label: 'Budget Analysis', icon: 'fas fa-balance-scale' }
  ];

  ngOnInit(): void {
    this.initializeDates();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeDates(): void {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.startDate = startOfMonth.toISOString().split('T')[0];
    this.endDate = endOfMonth.toISOString().split('T')[0];
  }

  private loadData(): void {
    this.isLoading = true;

    // Load transactions for the selected period
    this.transactionService.getUserTransactions({
      startDate: new Date(this.startDate),
      endDate: new Date(this.endDate)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.transactions = response.data || [];
        this.generateReport();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });

    // Load categories
    this.categoryService.getUserCategories().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (categories) => {
        this.categories = categories || [];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  onPeriodChange(period: string): void {
    this.selectedPeriod = period;
    this.customDateRange = period === 'custom';
    
    if (period !== 'custom') {
      this.updateDateRange(period);
    }
    
    this.loadData();
  }

  onReportTypeChange(reportType: string): void {
    this.selectedReportType = reportType;
    this.generateReport();
  }

  onDateRangeChange(): void {
    if (this.startDate && this.endDate) {
      this.loadData();
    }
  }

  private updateDateRange(period: string): void {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    this.startDate = startDate.toISOString().split('T')[0];
    this.endDate = endDate.toISOString().split('T')[0];
  }

  private generateReport(): void {
    if (this.transactions.length === 0) {
      this.reportData = null;
      return;
    }

    // Generate summary statistics
    const summary = this.generateSummary();
    
    // Generate category analysis
    const categories = this.generateCategoryAnalysis();
    
    // Generate trends
    const trends = this.generateTrends();
    
    // Generate insights
    const insights = this.generateInsights();

    this.reportData = {
      reportType: this.selectedReportType,
      period: {
        start: new Date(this.startDate),
        end: new Date(this.endDate)
      },
      summary,
      categories,
      trends,
      projections: [],
      insights
    };
  }

  private generateSummary(): any {
    const totalIncome = this.transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = this.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalTransfers = this.transactions
      .filter(t => t.type === TransactionType.TRANSFER)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      totalTransfers,
      netAmount: totalIncome - totalExpenses,
      transactionCount: this.transactions.length
    };
  }

  private generateCategoryAnalysis(): any[] {
    const categoryMap = new Map<string, { amount: number; count: number }>();

    this.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .forEach(transaction => {
        const categoryName = this.getCategoryName(transaction.categoryId);
        const current = categoryMap.get(categoryName) || { amount: 0, count: 0 };
        current.amount += transaction.amount;
        current.count += 1;
        categoryMap.set(categoryName, current);
      });

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: (data.amount / this.getTotalExpenses()) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  private generateTrends(): any[] {
    const monthlyData = this.groupTransactionsByMonth();
    
    return monthlyData.map(data => ({
      month: data.month,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses,
      change: this.calculateChange(data.month, data.income - data.expenses)
    }));
  }

  private generateInsights(): string[] {
    const insights: string[] = [];
    const summary = this.generateSummary();

    if (summary.netAmount < 0) {
      insights.push('Your expenses exceeded your income this period. Consider reviewing your spending habits.');
    }

    if (summary.totalExpenses > summary.totalIncome * 0.8) {
      insights.push('Your expenses are high relative to income. Focus on increasing savings.');
    }

    const topCategory = this.getTopSpendingCategory();
    if (topCategory) {
      insights.push(`Your highest spending category is ${topCategory.name} (${topCategory.percentage.toFixed(1)}% of total expenses).`);
    }

    return insights;
  }

  private groupTransactionsByMonth(): { month: string; income: number; expenses: number }[] {
    const monthlyMap = new Map<string, { income: number; expenses: number }>();

    this.transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const current = monthlyMap.get(monthKey) || { income: 0, expenses: 0 };

      if (transaction.type === TransactionType.INCOME) {
        current.income += transaction.amount;
      } else if (transaction.type === TransactionType.EXPENSE) {
        current.expenses += transaction.amount;
      }

      monthlyMap.set(monthKey, current);
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }

  private calculateChange(month: string, currentValue: number): number {
    // Simplified change calculation - in a real app, you'd compare with previous period
    return 0;
  }

  private getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  private getTotalExpenses(): number {
    return this.transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getTopSpendingCategory(): { name: string; percentage: number } | null {
    const categoryAnalysis = this.generateCategoryAnalysis();
    return categoryAnalysis.length > 0 ? categoryAnalysis[0] : null;
  }

  exportReport(format: 'pdf' | 'csv' | 'excel'): void {
    console.log(`Exporting report in ${format} format...`);
    // Implementation for export functionality
  }

  printReport(): void {
    window.print();
  }

  toggleAdvancedOptions(): void {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  getCurrentDate(): Date {
    return new Date();
  }
}