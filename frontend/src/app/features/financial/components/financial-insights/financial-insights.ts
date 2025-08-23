import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { 
  Transaction, 
  TransactionType, 
  Category, 
  FinancialInsights,
  FinancialDashboard,
  TransactionStats
} from '../../../../core/models/financial.model';
import { FinancialService } from '../../../../core/services/financial.service';
import { TransactionService } from '../../../../core/services/transaction.service';
import { CategoryService } from '../../../../core/services/category.service';
import { FormsModule } from '@angular/forms';

interface Insight {
  id: string;
  type: 'spending' | 'income' | 'savings' | 'trend' | 'alert' | 'recommendation';
  title: string;
  description: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  severity: 'low' | 'medium' | 'high';
  category?: string;
  icon: string;
  color: string;
  actionable: boolean;
  actionText?: string;
  actionRoute?: string;
}

interface Trend {
  category: string;
  trend: 'rising' | 'falling' | 'stable';
  change: number;
  confidence: number;
  period: string;
  description: string;
}

@Component({
  selector: 'app-financial-insights',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './financial-insights.html',
  styleUrls: ['./financial-insights.scss']
})
export class FinancialInsightsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private financialService = inject(FinancialService);
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);

  // Data
  transactions: Transaction[] = [];
  categories: Category[] = [];
  insights: Insight[] = [];
  trends: Trend[] = [];
  
  // UI State
  isLoading: boolean = false;
  selectedInsightType: string = 'all';
  showInsights: boolean = true;
  showTrends: boolean = true;
  
  // Statistics
  totalInsights: number = 0;
  highPriorityInsights: number = 0;
  actionableInsights: number = 0;
  
  // Available insight types
  insightTypes = [
    { value: 'all', label: 'All Insights', icon: 'fas fa-lightbulb' },
    { value: 'spending', label: 'Spending', icon: 'fas fa-shopping-cart' },
    { value: 'income', label: 'Income', icon: 'fas fa-arrow-up' },
    { value: 'savings', label: 'Savings', icon: 'fas fa-piggy-bank' },
    { value: 'trend', label: 'Trends', icon: 'fas fa-chart-line' },
    { value: 'alert', label: 'Alerts', icon: 'fas fa-exclamation-triangle' },
    { value: 'recommendation', label: 'Recommendations', icon: 'fas fa-thumbs-up' }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.isLoading = true;

    // Load transactions for the last 3 months
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    this.transactionService.getUserTransactions({
      startDate: threeMonthsAgo,
      endDate: now
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.transactions = response.data || [];
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.isLoading = false;
      }
    });
  }

  private loadCategories(): void {
    this.categoryService.getUserCategories().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (categories) => {
        this.categories = categories || [];
        this.generateInsights();
        this.generateTrends();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
      }
    });
  }

  private generateInsights(): void {
    this.insights = [];

    // Spending insights
    this.generateSpendingInsights();
    
    // Income insights
    this.generateIncomeInsights();
    
    // Savings insights
    this.generateSavingsInsights();
    
    // Trend insights
    this.generateTrendInsights();
    
    // Alerts
    this.generateAlerts();
    
    // Recommendations
    this.generateRecommendations();

    this.calculateInsightStats();
  }

  private generateSpendingInsights(): void {
    const expenses = this.transactions.filter(t => t.type === TransactionType.EXPENSE);
    if (expenses.length === 0) return;

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const avgExpense = totalExpenses / expenses.length;
    const highExpenses = expenses.filter(t => t.amount > avgExpense * 2);

    // High spending alert
    if (highExpenses.length > 0) {
      this.insights.push({
        id: 'high-spending',
        type: 'alert',
        title: 'High Spending Detected',
        description: `You have ${highExpenses.length} transactions above your average spending threshold.`,
        value: highExpenses.length,
        change: 0,
        changeType: 'stable',
        severity: 'high',
        icon: 'fas fa-exclamation-triangle',
        color: '#dc3545',
        actionable: true,
        actionText: 'Review Transactions',
        actionRoute: '/financial/transactions'
      });
    }

    // Category spending insights
    const categorySpending = this.calculateCategorySpending(expenses);
    const topCategory = categorySpending[0];
    
    if (topCategory) {
      this.insights.push({
        id: 'top-category',
        type: 'spending',
        title: 'Top Spending Category',
        description: `${topCategory.name} accounts for ${topCategory.percentage.toFixed(1)}% of your expenses.`,
        value: topCategory.amount,
        change: 0,
        changeType: 'stable',
        severity: 'medium',
        category: topCategory.name,
        icon: 'fas fa-tag',
        color: '#007bff',
        actionable: true,
        actionText: 'View Category',
        actionRoute: `/financial/categories/${topCategory.id}`
      });
    }
  }

  private generateIncomeInsights(): void {
    const income = this.transactions.filter(t => t.type === TransactionType.INCOME);
    if (income.length === 0) return;

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const avgIncome = totalIncome / income.length;

    // Income consistency
    const recentIncome = income.filter(t => {
      const daysAgo = (new Date().getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 30;
    });

    if (recentIncome.length === 0) {
      this.insights.push({
        id: 'no-recent-income',
        type: 'alert',
        title: 'No Recent Income',
        description: 'You haven\'t recorded any income in the last 30 days.',
        value: 0,
        change: 0,
        changeType: 'decrease',
        severity: 'high',
        icon: 'fas fa-exclamation-circle',
        color: '#ffc107',
        actionable: true,
        actionText: 'Add Income',
        actionRoute: '/financial/transactions/new'
      });
    }
  }

  private generateSavingsInsights(): void {
    const income = this.transactions.filter(t => t.type === TransactionType.INCOME);
    const expenses = this.transactions.filter(t => t.type === TransactionType.EXPENSE);
    
    if (income.length === 0 || expenses.length === 0) return;

    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const savings = totalIncome - totalExpenses;
    const savingsRate = (savings / totalIncome) * 100;

    // Savings rate insights
    if (savingsRate < 0) {
      this.insights.push({
        id: 'negative-savings',
        type: 'alert',
        title: 'Negative Savings Rate',
        description: 'Your expenses exceed your income. Consider reviewing your spending habits.',
        value: Math.abs(savings),
        change: 0,
        changeType: 'decrease',
        severity: 'high',
        icon: 'fas fa-times-circle',
        color: '#dc3545',
        actionable: true,
        actionText: 'Review Budget',
        actionRoute: '/financial/budget'
      });
    } else if (savingsRate < 20) {
      this.insights.push({
        id: 'low-savings',
        type: 'recommendation',
        title: 'Low Savings Rate',
        description: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% for financial security.`,
        value: savingsRate,
        change: 0,
        changeType: 'stable',
        severity: 'medium',
        icon: 'fas fa-info-circle',
        color: '#ffc107',
        actionable: true,
        actionText: 'Improve Savings',
        actionRoute: '/financial/budget'
      });
    } else {
      this.insights.push({
        id: 'good-savings',
        type: 'savings',
        title: 'Excellent Savings Rate',
        description: `Great job! Your savings rate is ${savingsRate.toFixed(1)}%.`,
        value: savingsRate,
        change: 0,
        changeType: 'stable',
        severity: 'low',
        icon: 'fas fa-thumbs-up',
        color: '#28a745',
        actionable: false
      });
    }
  }

  private generateTrendInsights(): void {
    const monthlyData = this.calculateMonthlyTrends();
    
    if (monthlyData.length >= 2) {
      const currentMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];
      
      const expenseChange = ((currentMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100;
      const incomeChange = ((currentMonth.income - previousMonth.income) / previousMonth.income) * 100;

      if (expenseChange > 20) {
        this.insights.push({
          id: 'expense-increase',
          type: 'trend',
          title: 'Expense Increase',
          description: `Your expenses increased by ${expenseChange.toFixed(1)}% compared to last month.`,
          value: expenseChange,
          change: expenseChange,
          changeType: 'increase',
          severity: 'medium',
          icon: 'fas fa-arrow-up',
          color: '#ffc107',
          actionable: true,
          actionText: 'Review Expenses',
          actionRoute: '/financial/transactions'
        });
      }

      if (incomeChange > 20) {
        this.insights.push({
          id: 'income-increase',
          type: 'trend',
          title: 'Income Increase',
          description: `Your income increased by ${incomeChange.toFixed(1)}% compared to last month.`,
          value: incomeChange,
          change: incomeChange,
          changeType: 'increase',
          severity: 'low',
          icon: 'fas fa-arrow-up',
          color: '#28a745',
          actionable: false
        });
      }
    }
  }

  private generateAlerts(): void {
    // Overdue bills or payments
    const overdueTransactions = this.transactions.filter(t => 
      t.status === 'pending' && 
      new Date(t.date) < new Date()
    );

    if (overdueTransactions.length > 0) {
      this.insights.push({
        id: 'overdue-transactions',
        type: 'alert',
        title: 'Overdue Transactions',
        description: `You have ${overdueTransactions.length} overdue transactions that need attention.`,
        value: overdueTransactions.length,
        change: 0,
        changeType: 'stable',
        severity: 'high',
        icon: 'fas fa-clock',
        color: '#dc3545',
        actionable: true,
        actionText: 'Review Overdue',
        actionRoute: '/financial/transactions'
      });
    }
  }

  private generateRecommendations(): void {
    // Budget recommendations
    if (this.insights.filter(i => i.type === 'alert').length > 2) {
      this.insights.push({
        id: 'budget-review',
        type: 'recommendation',
        title: 'Review Your Budget',
        description: 'You have several financial alerts. Consider reviewing and adjusting your budget.',
        value: 0,
        change: 0,
        changeType: 'stable',
        severity: 'medium',
        icon: 'fas fa-balance-scale',
        color: '#007bff',
        actionable: true,
        actionText: 'Review Budget',
        actionRoute: '/financial/budget'
      });
    }

    // Category diversification
    const expenses = this.transactions.filter(t => t.type === TransactionType.EXPENSE);
    const categorySpending = this.calculateCategorySpending(expenses);
    
    if (categorySpending.length > 0 && categorySpending[0].percentage > 50) {
      this.insights.push({
        id: 'diversify-spending',
        type: 'recommendation',
        title: 'Diversify Your Spending',
        description: 'Your spending is heavily concentrated in one category. Consider diversifying.',
        value: categorySpending[0].percentage,
        change: 0,
        changeType: 'stable',
        severity: 'low',
        icon: 'fas fa-chart-pie',
        color: '#6f42c1',
        actionable: true,
        actionText: 'View Categories',
        actionRoute: '/financial/categories'
      });
    }
  }

  private generateTrends(): void {
    this.trends = [];
    
    const categorySpending = this.calculateCategorySpending(
      this.transactions.filter(t => t.type === TransactionType.EXPENSE)
    );

    categorySpending.slice(0, 5).forEach(category => {
      const trend = this.calculateCategoryTrend(category.id);
      
      this.trends.push({
        category: category.name,
        trend: trend.direction,
        change: trend.change,
        confidence: trend.confidence,
        period: 'monthly',
        description: this.getTrendDescription(trend)
      });
    });
  }

  private calculateCategorySpending(transactions: Transaction[]): Array<{id: string; name: string; amount: number; percentage: number}> {
    const categoryMap = new Map<string, { amount: number; count: number }>();

    transactions.forEach(transaction => {
      const categoryName = this.getCategoryName(transaction.categoryId);
      const current = categoryMap.get(categoryName) || { amount: 0, count: 0 };
      current.amount += transaction.amount;
      current.count += 1;
      categoryMap.set(categoryName, current);
    });

    const total = Array.from(categoryMap.values()).reduce((sum, data) => sum + data.amount, 0);

    return Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        id: this.getCategoryId(name),
        name,
        amount: data.amount,
        percentage: (data.amount / total) * 100
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  private calculateMonthlyTrends(): Array<{month: string; income: number; expenses: number}> {
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

  private calculateCategoryTrend(categoryId: string): { direction: 'rising' | 'falling' | 'stable'; change: number; confidence: number } {
    // Simplified trend calculation - in a real app, you'd analyze historical data
    const random = Math.random();
    if (random > 0.7) return { direction: 'rising', change: Math.random() * 20 + 5, confidence: 0.8 };
    if (random > 0.3) return { direction: 'falling', change: Math.random() * 20 + 5, confidence: 0.7 };
    return { direction: 'stable', change: Math.random() * 5, confidence: 0.9 };
  }

  private getTrendDescription(trend: { direction: 'rising' | 'falling' | 'stable'; change: number }): string {
    switch (trend.direction) {
      case 'rising':
        return `Spending in this category is trending upward by ${trend.change.toFixed(1)}%`;
      case 'falling':
        return `Spending in this category is trending downward by ${trend.change.toFixed(1)}%`;
      case 'stable':
        return `Spending in this category is relatively stable`;
      default:
        return 'No trend data available';
    }
  }

  private calculateInsightStats(): void {
    this.totalInsights = this.insights.length;
    this.highPriorityInsights = this.insights.filter(i => i.severity === 'high').length;
    this.actionableInsights = this.insights.filter(i => i.actionable).length;
  }

  private getCategoryName(categoryId: string): string {
    const category = this.categories.find(c => c._id === categoryId);
    return category ? category.name : 'Unknown Category';
  }

  private getCategoryId(categoryName: string): string {
    const category = this.categories.find(c => c.name === categoryName);
    return category ? category._id : '';
  }

  onInsightTypeChange(type: string): void {
    this.selectedInsightType = type;
  }

  onInsightAction(insight: Insight): void {
    if (insight.actionable && insight.actionRoute) {
      // Navigate to the action route
      console.log(`Navigating to: ${insight.actionRoute}`);
    }
  }

  dismissInsight(insightId: string): void {
    this.insights = this.insights.filter(i => i.id !== insightId);
    this.calculateInsightStats();
  }

  exportInsights(): void {
    console.log('Exporting insights...');
    // Implementation for export functionality
  }

  printInsights(): void {
    window.print();
  }

  getFilteredInsightsList(): Insight[] {
    if (this.selectedInsightType === 'all') {
      return this.insights;
    }
    return this.insights.filter(insight => insight.type === this.selectedInsightType);
  }
  
  getTrendBarWidth(change: number): number {
    const width = change * 5;
    return width > 100 ? 100 : width;
  }
}