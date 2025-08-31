import { AnalyticsRepository } from '../repositories/analytics.repository';
import { TransactionService } from '../../transactions/services/transaction.service';
import { CategoryService } from '../../categories/service/category.service';
import { BudgetService } from '../../budgets/services/budget.service';
import { 
  IAnalyticsQuery, 
  ISpendingAnalysis, 
  IBudgetAnalytics, 
  IFinancialInsights, 
  ICashFlowAnalysis, 
  IComparisonAnalysis 
} from '../interfaces/analytics.interface';
import { logger } from '../../../../shared/services/logger.service';
import { TransactionType, TransactionStatus } from '../../transactions/interfaces/transaction.interface';
import { BudgetRepository } from '../../budgets/repositories/budget.repository';
import { TransactionRepository } from '../../transactions/repositories/transaction.repository';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import { IBudget } from '../../budgets';
import { Types } from 'mongoose';

export class AnalyticsService {
  private analyticsRepository: AnalyticsRepository;
  private transactionService: TransactionService;
  private categoryService: CategoryService;
  private budgetService: BudgetService;

  constructor() {
    this.analyticsRepository = new AnalyticsRepository();
    this.transactionService = new TransactionService();
    this.categoryService = new CategoryService();
    this.budgetService = new BudgetService(
      new BudgetRepository(),
      new TransactionRepository(),
      new CategoryRepository()
    );
  }

  /**
   * Get comprehensive spending analysis
   */
  async getSpendingAnalysis(query: IAnalyticsQuery): Promise<ISpendingAnalysis> {
    try {
      logger.info('Getting spending analysis', { userId: query.userId, dateRange: { start: query.startDate, end: query.endDate } });
      
      const analysis = await this.analyticsRepository.getSpendingAnalysis(query);
      
      logger.info('Spending analysis completed', { 
        userId: query.userId, 
        totalSpent: analysis.totalSpent,
        totalIncome: analysis.totalIncome,
        netAmount: analysis.netAmount 
      });
      
      return analysis;
    } catch (error) {
      logger.error('Error getting spending analysis', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Get budget analytics for a specific budget
   */
  async getBudgetAnalytics(userId: string, budgetId: string, startDate: Date, endDate: Date): Promise<IBudgetAnalytics> {
    try {
      logger.info('Getting budget analytics', { userId, budgetId, dateRange: { start: startDate, end: endDate } });
      
      const analytics = await this.analyticsRepository.getBudgetAnalytics(userId, budgetId, startDate, endDate);
      
      logger.info('Budget analytics completed', { 
        userId, 
        budgetId, 
        utilization: analytics.utilizationPercentage,
        status: analytics.status 
      });
      
      return analytics;
    } catch (error) {
      logger.error('Error getting budget analytics', { error: String(error), userId, budgetId });
      throw error;
    }
  }

  /**
   * Get comprehensive budget analytics for all user budgets
   */
  async getAllBudgetAnalytics(userId: string, startDate: Date, endDate: Date): Promise<IBudgetAnalytics[]> {
    try {
      logger.info('Getting all budget analytics', { userId, dateRange: { start: startDate, end: endDate } });
      
      const budgets = await this.budgetService.getBudgets(userId);
      const analyticsPromises = budgets.budgets.map((budget: IBudget) => 
        this.getBudgetAnalytics(userId, (budget._id as Types.ObjectId).toString(), startDate, endDate)
      );
      
      const analytics = await Promise.all(analyticsPromises);
      
      logger.info('All budget analytics completed', { userId, budgetCount: analytics.length });
      
      return analytics;
    } catch (error) {
      logger.error('Error getting all budget analytics', { error: String(error), userId });
      throw error;
    }
  }

  /**
   * Get financial insights and recommendations
   */
  async getFinancialInsights(userId: string, startDate: Date, endDate: Date): Promise<IFinancialInsights> {
    try {
      logger.info('Getting financial insights', { userId, dateRange: { start: startDate, end: endDate } });
      
      const spendingAnalysis = await this.getSpendingAnalysis({
        userId,
        startDate,
        endDate,
        groupBy: 'month'
      });

      const insights = await this.generateInsights(spendingAnalysis, userId);
      
      logger.info('Financial insights completed', { userId, recommendationCount: insights.recommendations.length });
      
      return insights;
    } catch (error) {
      logger.error('Error getting financial insights', { error: String(error), userId });
      throw error;
    }
  }

  /**
   * Get cash flow analysis
   */
  async getCashFlowAnalysis(userId: string, startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month' = 'month'): Promise<ICashFlowAnalysis> {
    try {
      logger.info('Getting cash flow analysis', { userId, dateRange: { start: startDate, end: endDate }, groupBy });
      
      const transactions = await this.transactionService.getUserTransactions(userId, {
        startDate,
        endDate,
        limit: 10000 // Get all transactions for the period
      });

      const cashFlow = this.calculateCashFlow(transactions.transactions, startDate, endDate, groupBy);
      
      logger.info('Cash flow analysis completed', { userId, netCashFlow: cashFlow.netCashFlow });
      
      return cashFlow;
    } catch (error) {
      logger.error('Error getting cash flow analysis', { error: String(error), userId });
      throw error;
    }
  }

  /**
   * Get period comparison analysis
   */
  async getPeriodComparison(
    userId: string, 
    currentStart: Date, 
    currentEnd: Date, 
    previousStart: Date, 
    previousEnd: Date
  ): Promise<IComparisonAnalysis> {
    try {
      logger.info('Getting period comparison', { 
        userId, 
        currentPeriod: { start: currentStart, end: currentEnd },
        previousPeriod: { start: previousStart, end: previousEnd }
      });
      
      const [currentAnalysis, previousAnalysis] = await Promise.all([
        this.getSpendingAnalysis({ userId, startDate: currentStart, endDate: currentEnd }),
        this.getSpendingAnalysis({ userId, startDate: previousStart, endDate: previousEnd })
      ]);

      const comparison = this.comparePeriods(currentAnalysis, previousAnalysis, currentStart, currentEnd, previousStart, previousEnd);
      
      logger.info('Period comparison completed', { userId, netChange: comparison.changes.netAmount.amount });
      
      return comparison;
    } catch (error) {
      logger.error('Error getting period comparison', { error: String(error), userId });
      throw error;
    }
  }

  /**
   * Get category performance analysis
   */
  async getCategoryPerformance(userId: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      logger.info('Getting category performance', { userId, dateRange: { start: startDate, end: endDate } });
      
      const spendingAnalysis = await this.getSpendingAnalysis({
        userId,
        startDate,
        endDate,
        groupBy: 'month'
      });

      const categories = await this.categoryService.getUserCategories(userId);
      const performance = this.analyzeCategoryPerformance(spendingAnalysis, categories.categories);
      
      logger.info('Category performance completed', { userId, categoryCount: performance.length });
      
      return performance;
    } catch (error) {
      logger.error('Error getting category performance', { error: String(error), userId });
      throw error;
    }
  }

  /**
   * Generate spending insights and recommendations
   */
  private async generateInsights(spendingAnalysis: ISpendingAnalysis, userId: string): Promise<IFinancialInsights> {
    const insights: IFinancialInsights = {
      spendingPatterns: {
        mostExpensiveDay: '',
        mostExpensiveMonth: '',
        leastExpensiveDay: '',
        leastExpensiveMonth: '',
        averageTransactionAmount: 0,
        largestTransaction: 0,
        smallestTransaction: 0,
      },
      categoryInsights: {
        highestSpendingCategory: '',
        lowestSpendingCategory: '',
        mostFrequentCategory: '',
        categoryGrowthRates: [],
      },
      timeInsights: {
        peakSpendingTime: '',
        peakSpendingDay: '',
        seasonalPatterns: [],
      },
      recommendations: [],
    };

    // Analyze spending patterns
    if (spendingAnalysis.topSpendingDays.length > 0) {
      insights.spendingPatterns.mostExpensiveDay = spendingAnalysis.topSpendingDays[0].date;
      insights.spendingPatterns.mostExpensiveMonth = spendingAnalysis.spendingByMonth[spendingAnalysis.spendingByMonth.length - 1]?.month || '';
    }

    if (spendingAnalysis.spendingByDay.length > 0) {
      const sortedByDay = [...spendingAnalysis.spendingByDay].sort((a, b) => a.amount - b.amount);
      insights.spendingPatterns.leastExpensiveDay = sortedByDay[0]?.date || '';
    }

    if (spendingAnalysis.spendingByMonth.length > 0) {
      const sortedByMonth = [...spendingAnalysis.spendingByMonth].sort((a, b) => a.amount - b.amount);
      insights.spendingPatterns.leastExpensiveMonth = sortedByMonth[0]?.month || '';
    }

    // Calculate averages
    insights.spendingPatterns.averageTransactionAmount = spendingAnalysis.spendingByCategory.reduce((sum, cat) => sum + cat.averageAmount, 0) / Math.max(spendingAnalysis.spendingByCategory.length, 1);

    // Generate recommendations
    insights.recommendations = this.generateRecommendations(spendingAnalysis);

    return insights;
  }

  /**
   * Calculate cash flow from transactions
   */
  private calculateCashFlow(transactions: any[], startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month'): ICashFlowAnalysis {
    const inflows = transactions.filter(t => t.type === TransactionType.INCOME);
    const outflows = transactions.filter(t => t.type === TransactionType.EXPENSE);

    const totalInflows = inflows.reduce((sum, t) => sum + t.amount, 0);
    const totalOutflows = outflows.reduce((sum, t) => sum + t.amount, 0);
    const netCashFlow = totalInflows - totalOutflows;

    // Group by period
    const groupedData = this.groupTransactionsByPeriod(transactions, startDate, endDate, groupBy);

    const cashFlow: ICashFlowAnalysis = {
      period: `${groupBy}ly`,
      openingBalance: 0, // Would be calculated from account balances
      closingBalance: netCashFlow,
      totalInflows,
      totalOutflows,
      netCashFlow,
      cashFlowByType: [
        { type: 'Income', amount: totalInflows, percentage: totalInflows > 0 ? 100 : 0, transactionCount: inflows.length },
        { type: 'Expense', amount: totalOutflows, percentage: totalOutflows > 0 ? 100 : 0, transactionCount: outflows.length },
      ],
      cashFlowByCategory: [],
      cashFlowByPeriod: groupedData.map(period => ({
        period: period.period,
        inflows: period.inflows,
        outflows: period.outflows,
        netAmount: period.inflows - period.outflows,
        balance: period.balance,
      })),
      projections: [],
    };

    return cashFlow;
  }

  /**
   * Group transactions by time period
   */
  private groupTransactionsByPeriod(transactions: any[], startDate: Date, endDate: Date, groupBy: 'day' | 'week' | 'month'): any[] {
    const periods: any[] = [];
    const current = new Date(startDate);
    let balance = 0;

    while (current <= endDate) {
      const periodStart = new Date(current);
      let periodEnd: Date;

      switch (groupBy) {
        case 'day':
          periodEnd = new Date(current);
          current.setDate(current.getDate() + 1);
          break;
        case 'week':
          periodEnd = new Date(current);
          current.setDate(current.getDate() + 7);
          break;
        case 'month':
          periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
          current.setMonth(current.getMonth() + 1);
          break;
      }

      const periodTransactions = transactions.filter(t => 
        t.date >= periodStart && t.date <= periodEnd
      );

      const inflows = periodTransactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const outflows = periodTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

      balance += inflows - outflows;

      periods.push({
        period: periodStart.toISOString().split('T')[0],
        inflows,
        outflows,
        balance,
      });
    }

    return periods;
  }

  /**
   * Compare two time periods
   */
  private comparePeriods(
    current: ISpendingAnalysis, 
    previous: ISpendingAnalysis, 
    currentStart: Date, 
    currentEnd: Date, 
    previousStart: Date, 
    previousEnd: Date
  ): IComparisonAnalysis {
    // Fix: Initialize categoryChanges as an empty array first
    const changes = {
      totalSpent: this.calculateChange(current.totalSpent, previous.totalSpent),
      totalIncome: this.calculateChange(current.totalIncome, previous.totalIncome),
      netAmount: this.calculateChange(current.netAmount, previous.netAmount),
      categoryChanges: [] as any[], // Initialize as empty array
    };

    // Calculate category changes
    const allCategories = new Set([
      ...current.spendingByCategory.map(c => c.categoryId),
      ...previous.spendingByCategory.map(c => c.categoryId)
    ]);

    allCategories.forEach(categoryId => {
      const currentCat = current.spendingByCategory.find(c => c.categoryId === categoryId);
      const previousCat = previous.spendingByCategory.find(c => c.categoryId === categoryId);
      
      const currentAmount = currentCat?.amount || 0;
      const previousAmount = previousCat?.amount || 0;
      
      changes.categoryChanges.push({
        categoryId,
        categoryName: currentCat?.categoryName || previousCat?.categoryName || 'Unknown',
        currentAmount,
        previousAmount,
        change: currentAmount - previousAmount,
        percentageChange: previousAmount > 0 ? ((currentAmount - previousAmount) / previousAmount) * 100 : 0,
        trend: currentAmount > previousAmount ? 'increase' : currentAmount < previousAmount ? 'decrease' : 'no-change',
      });
    });

    // Generate insights
    const insights = this.generateComparisonInsights(changes);

    return {
      currentPeriod: { startDate: currentStart, endDate: currentEnd, data: current },
      previousPeriod: { startDate: previousStart, endDate: previousEnd, data: previous },
      changes,
      insights,
    };
  }

  /**
   * Calculate change between two values
   */
  private calculateChange(current: number, previous: number): any {
    const change = current - previous;
    const percentageChange = previous > 0 ? (change / previous) * 100 : 0;
    
    return {
      amount: change,
      percentage: percentageChange,
      trend: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'no-change',
    };
  }

  /**
   * Generate comparison insights
   */
  private generateComparisonInsights(changes: any): string[] {
    const insights: string[] = [];

    if (changes.totalSpent.trend === 'increase') {
      insights.push(`Spending increased by ${changes.totalSpent.percentage.toFixed(1)}% compared to the previous period`);
    } else if (changes.totalSpent.trend === 'decrease') {
      insights.push(`Great job! Spending decreased by ${Math.abs(changes.totalSpent.percentage).toFixed(1)}% compared to the previous period`);
    }

    if (changes.netAmount.trend === 'decrease') {
      insights.push(`Net savings decreased by ${Math.abs(changes.netAmount.percentage).toFixed(1)}% - consider reviewing your spending habits`);
    }

    return insights;
  }

  /**
   * Analyze category performance
   */
  private analyzeCategoryPerformance(spendingAnalysis: ISpendingAnalysis, categories: any[]): any[] {
    return spendingAnalysis.spendingByCategory.map(cat => {
      const category = categories.find(c => c._id.toString() === cat.categoryId);
      return {
        ...cat,
        categoryColor: category?.color || '#3B82F6',
        categoryIcon: category?.icon || 'folder',
        performance: this.calculateCategoryPerformance(cat.amount, cat.averageAmount),
      };
    });
  }

  /**
   * Calculate category performance metrics
   */
  private calculateCategoryPerformance(amount: number, averageAmount: number): string {
    if (amount > averageAmount * 1.5) return 'high';
    if (amount < averageAmount * 0.5) return 'low';
    return 'normal';
  }

  /**
   * Generate spending recommendations
   */
  private generateRecommendations(spendingAnalysis: ISpendingAnalysis): any[] {
    const recommendations: any[] = [];

    // High spending alert
    if (spendingAnalysis.totalSpent > spendingAnalysis.totalIncome * 0.8) {
      recommendations.push({
        type: 'spending',
        priority: 'high',
        message: 'Your spending is very high relative to your income. Consider reviewing your budget.',
        action: 'Review and adjust your monthly budget',
        potentialSavings: spendingAnalysis.totalSpent * 0.1,
      });
    }

    // Category spending recommendations
    spendingAnalysis.spendingByCategory.forEach(cat => {
      if (cat.percentage > 30) {
        recommendations.push({
          type: 'category',
          priority: 'medium',
          message: `${cat.categoryName} accounts for ${cat.percentage.toFixed(1)}% of your spending. Consider if this aligns with your financial goals.`,
          action: 'Review spending in this category',
          potentialSavings: cat.amount * 0.15,
        });
      }
    });

    return recommendations;
  }
}