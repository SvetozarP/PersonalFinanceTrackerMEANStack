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
  IComparisonAnalysis,
  IBudgetPerformanceReport,
  IBudgetVsActualReport,
  IBudgetTrendAnalysis,
  IBudgetVarianceAnalysis,
  IBudgetForecast,
  IBudgetCategoryBreakdown,
  IBudgetAlert,
  IBudgetExportOptions
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

  // ==================== BUDGET REPORTING METHODS ====================

  /**
   * Get comprehensive budget performance report
   */
  async getBudgetPerformanceReport(
    userId: string, 
    budgetId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<IBudgetPerformanceReport> {
    try {
      logger.info('Getting budget performance report', { userId, budgetId, dateRange: { start: startDate, end: endDate } });
      
      const budget = await this.budgetService.getBudgetById(userId, budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      const analytics = await this.getBudgetAnalytics(userId, budgetId, startDate, endDate);
      const transactions = await this.transactionService.getUserTransactions(userId, {
        startDate,
        endDate,

        limit: 1000
      });

      const performance = this.calculateBudgetPerformance(budget, analytics, transactions.transactions, startDate, endDate);
      
      logger.info('Budget performance report completed', { userId, budgetId, utilization: performance.performance.utilizationPercentage });
      
      return performance;
    } catch (error) {
      logger.error('Error getting budget performance report', { error: String(error), userId, budgetId });
      throw error;
    }
  }

  /**
   * Get budget vs actual spending comparison report
   */
  async getBudgetVsActualReport(
    userId: string, 
    budgetId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<IBudgetVsActualReport> {
    try {
      logger.info('Getting budget vs actual report', { userId, budgetId, dateRange: { start: startDate, end: endDate } });
      
      const budget = await this.budgetService.getBudgetById(userId, budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      const analytics = await this.getBudgetAnalytics(userId, budgetId, startDate, endDate);
      const comparison = this.calculateBudgetVsActual(budget, analytics, startDate, endDate);
      
      logger.info('Budget vs actual report completed', { userId, budgetId, variance: comparison.summary.variance });
      
      return comparison;
    } catch (error) {
      logger.error('Error getting budget vs actual report', { error: String(error), userId, budgetId });
      throw error;
    }
  }

  /**
   * Get budget trend analysis over time
   */
  async getBudgetTrendAnalysis(
    userId: string, 
    budgetId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<IBudgetTrendAnalysis> {
    try {
      logger.info('Getting budget trend analysis', { userId, budgetId, dateRange: { start: startDate, end: endDate } });
      
      const budget = await this.budgetService.getBudgetById(userId, budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      // Get historical data for trend analysis
      const historicalData = await this.getHistoricalBudgetData(userId, budgetId, startDate, endDate);
      const trendAnalysis = this.analyzeBudgetTrends(budget, historicalData, startDate, endDate);
      
      logger.info('Budget trend analysis completed', { userId, budgetId, trendCount: trendAnalysis.trends.utilizationTrend.length });
      
      return trendAnalysis;
    } catch (error) {
      logger.error('Error getting budget trend analysis', { error: String(error), userId, budgetId });
      throw error;
    }
  }

  /**
   * Get budget variance analysis
   */
  async getBudgetVarianceAnalysis(
    userId: string, 
    budgetId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<IBudgetVarianceAnalysis> {
    try {
      logger.info('Getting budget variance analysis', { userId, budgetId, dateRange: { start: startDate, end: endDate } });
      
      const budget = await this.budgetService.getBudgetById(userId, budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      const analytics = await this.getBudgetAnalytics(userId, budgetId, startDate, endDate);
      const varianceAnalysis = this.calculateBudgetVariance(budget, analytics, startDate, endDate);
      
      logger.info('Budget variance analysis completed', { userId, budgetId, totalVariance: varianceAnalysis.varianceSummary.totalVariance });
      
      return varianceAnalysis;
    } catch (error) {
      logger.error('Error getting budget variance analysis', { error: String(error), userId, budgetId });
      throw error;
    }
  }

  /**
   * Get budget forecasting and projections
   */
  async getBudgetForecast(
    userId: string, 
    budgetId: string, 
    forecastStartDate: Date, 
    forecastEndDate: Date
  ): Promise<IBudgetForecast> {
    try {
      logger.info('Getting budget forecast', { userId, budgetId, forecastPeriod: { start: forecastStartDate, end: forecastEndDate } });
      
      const budget = await this.budgetService.getBudgetById(userId, budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      // Get historical data for forecasting
      const historicalStartDate = new Date(forecastStartDate);
      historicalStartDate.setMonth(historicalStartDate.getMonth() - 6); // 6 months of historical data
      const historicalData = await this.getHistoricalBudgetData(userId, budgetId, historicalStartDate, forecastStartDate);
      
      const forecast = this.generateBudgetForecast(budget, historicalData, forecastStartDate, forecastEndDate);
      
      logger.info('Budget forecast completed', { userId, budgetId, projectedSpending: forecast.forecast.projectedSpending });
      
      return forecast;
    } catch (error) {
      logger.error('Error getting budget forecast', { error: String(error), userId, budgetId });
      throw error;
    }
  }

  /**
   * Get budget category breakdown report
   */
  async getBudgetCategoryBreakdown(
    userId: string, 
    budgetId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<IBudgetCategoryBreakdown> {
    try {
      logger.info('Getting budget category breakdown', { userId, budgetId, dateRange: { start: startDate, end: endDate } });
      
      const budget = await this.budgetService.getBudgetById(userId, budgetId);
      if (!budget) {
        throw new Error('Budget not found');
      }

      const analytics = await this.getBudgetAnalytics(userId, budgetId, startDate, endDate);
      const transactions = await this.transactionService.getUserTransactions(userId, {
        startDate,
        endDate,

        limit: 1000
      });

      const breakdown = this.calculateCategoryBreakdown(budget, analytics, transactions.transactions, startDate, endDate);
      
      logger.info('Budget category breakdown completed', { userId, budgetId, categoryCount: breakdown.categoryBreakdown.length });
      
      return breakdown;
    } catch (error) {
      logger.error('Error getting budget category breakdown', { error: String(error), userId, budgetId });
      throw error;
    }
  }

  /**
   * Get budget alerts and notifications
   */
  async getBudgetAlerts(userId: string, budgetId?: string): Promise<IBudgetAlert[]> {
    try {
      logger.info('Getting budget alerts', { userId, budgetId });
      
      const budgets = budgetId 
        ? [await this.budgetService.getBudgetById(userId, budgetId)]
        : (await this.budgetService.getBudgets(userId)).budgets;

      const alerts: IBudgetAlert[] = [];
      
      for (const budget of budgets) {
        if (!budget) continue;
        
        const budgetAlerts = await this.checkBudgetAlerts(userId, (budget as any)._id?.toString() || budgetId);
        alerts.push(...budgetAlerts);
      }
      
      logger.info('Budget alerts retrieved', { userId, alertCount: alerts.length });
      
      return alerts;
    } catch (error) {
      logger.error('Error getting budget alerts', { error: String(error), userId, budgetId });
      throw error;
    }
  }

  /**
   * Export budget reports in various formats
   */
  async exportBudgetReport(
    userId: string, 
    options: IBudgetExportOptions
  ): Promise<{ data: any; format: string; filename: string }> {
    try {
      logger.info('Exporting budget report', { userId, options });
      
      let reportData: any = {};
      
      // Generate reports based on type
      if (options.reportType === 'all' || options.reportType === 'performance') {
        for (const budgetId of options.budgetIds || []) {
          reportData[budgetId] = await this.getBudgetPerformanceReport(
            userId, 
            budgetId,
            options.dateRange.startDate, 
            options.dateRange.endDate
          );
        }
      }
      
      if (options.reportType === 'all' || options.reportType === 'variance') {
        for (const budgetId of options.budgetIds || []) {
          reportData[budgetId] = await this.getBudgetVarianceAnalysis(
            userId, 
            budgetId,
            options.dateRange.startDate, 
            options.dateRange.endDate
          );
        }
      }
      
      // Format data based on export format
      const exportResult = this.formatExportData(reportData, options);
      
      logger.info('Budget report exported', { userId, format: options.format, dataSize: JSON.stringify(exportResult.data).length });
      
      return exportResult;
    } catch (error) {
      logger.error('Error exporting budget report', { error: String(error), userId, options });
      throw error;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Calculate budget performance metrics
   */
  private calculateBudgetPerformance(
    budget: any, 
    analytics: IBudgetAnalytics, 
    transactions: any[], 
    startDate: Date, 
    endDate: Date
  ): IBudgetPerformanceReport {
    const varianceAmount = analytics.totalSpent - analytics.totalAllocated;
    const variancePercentage = analytics.totalAllocated > 0 ? (varianceAmount / analytics.totalAllocated) * 100 : 0;
    
    return {
      budgetId: budget._id.toString(),
      budgetName: budget.name,
      period: { startDate, endDate },
      performance: {
        totalAllocated: analytics.totalAllocated,
        totalSpent: analytics.totalSpent,
        remainingAmount: analytics.remainingAmount,
        utilizationPercentage: analytics.utilizationPercentage,
        varianceAmount,
        variancePercentage,
        status: analytics.status
      },
      categoryPerformance: analytics.categoryBreakdown.map(cat => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        allocatedAmount: cat.allocatedAmount,
        spentAmount: cat.spentAmount,
        remainingAmount: cat.remainingAmount,
        utilizationPercentage: cat.utilizationPercentage,
        varianceAmount: cat.spentAmount - cat.allocatedAmount,
        variancePercentage: cat.allocatedAmount > 0 ? ((cat.spentAmount - cat.allocatedAmount) / cat.allocatedAmount) * 100 : 0,
        status: cat.status,
        topTransactions: cat.transactions.slice(0, 5)
      })),
      trends: {
        dailySpending: this.calculateDailySpendingTrend(transactions, startDate, endDate, analytics.totalAllocated),
        weeklyTrends: this.calculateWeeklyTrends(transactions, startDate, endDate, analytics.totalAllocated)
      },
      insights: this.generatePerformanceInsights(analytics, varianceAmount, variancePercentage)
    };
  }

  /**
   * Calculate budget vs actual comparison
   */
  private calculateBudgetVsActual(
    budget: any, 
    analytics: IBudgetAnalytics, 
    startDate: Date, 
    endDate: Date
  ): IBudgetVsActualReport {
    const variance = analytics.totalSpent - analytics.totalAllocated;
    const variancePercentage = analytics.totalAllocated > 0 ? (variance / analytics.totalAllocated) * 100 : 0;
    
    return {
      budgetId: budget._id.toString(),
      budgetName: budget.name,
      period: { startDate, endDate },
      summary: {
        totalBudgeted: analytics.totalAllocated,
        totalActual: analytics.totalSpent,
        variance,
        variancePercentage,
        status: analytics.status
      },
      categoryComparison: analytics.categoryBreakdown.map(cat => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        budgetedAmount: cat.allocatedAmount,
        actualAmount: cat.spentAmount,
        variance: cat.spentAmount - cat.allocatedAmount,
        variancePercentage: cat.allocatedAmount > 0 ? ((cat.spentAmount - cat.allocatedAmount) / cat.allocatedAmount) * 100 : 0,
        status: cat.status,
        efficiency: cat.allocatedAmount > 0 ? cat.spentAmount / cat.allocatedAmount : 0
      })),
      monthlyBreakdown: this.calculateMonthlyBreakdown(analytics, startDate, endDate),
      topVariances: this.getTopVariances(analytics.categoryBreakdown),
      recommendations: this.generateVsActualRecommendations(analytics, variance, variancePercentage)
    };
  }

  /**
   * Get historical budget data for trend analysis
   */
  private async getHistoricalBudgetData(
    userId: string, 
    budgetId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<any[]> {
    // This would typically query historical budget data
    // For now, we'll simulate with current data
    const analytics = await this.getBudgetAnalytics(userId, budgetId, startDate, endDate);
    return [analytics];
  }

  /**
   * Analyze budget trends over time
   */
  private analyzeBudgetTrends(
    budget: any, 
    historicalData: any[], 
    startDate: Date, 
    endDate: Date
  ): IBudgetTrendAnalysis {
    return {
      budgetId: budget._id.toString(),
      budgetName: budget.name,
      analysisPeriod: { startDate, endDate },
      trends: {
        utilizationTrend: this.calculateUtilizationTrend(historicalData),
        spendingVelocity: this.calculateSpendingVelocity(historicalData, startDate, endDate),
        categoryTrends: this.calculateCategoryTrends(historicalData)
      },
      projections: {
        endOfPeriodProjection: this.projectEndOfPeriod(historicalData, startDate, endDate),
        categoryProjections: this.projectCategorySpending(historicalData)
      },
      insights: this.generateTrendInsights(historicalData)
    };
  }

  /**
   * Calculate budget variance analysis
   */
  private calculateBudgetVariance(
    budget: any, 
    analytics: IBudgetAnalytics, 
    startDate: Date, 
    endDate: Date
  ): IBudgetVarianceAnalysis {
    const categoryVariances = analytics.categoryBreakdown.map(cat => {
      const variance = cat.spentAmount - cat.allocatedAmount;
      const variancePercentage = cat.allocatedAmount > 0 ? (variance / cat.allocatedAmount) * 100 : 0;
      
      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        budgetedAmount: cat.allocatedAmount,
        actualAmount: cat.spentAmount,
        variance,
        variancePercentage,
        varianceType: (variance < 0 ? 'favorable' : 'unfavorable') as 'favorable' | 'unfavorable',
        impact: (Math.abs(variancePercentage) > 20 ? 'high' : Math.abs(variancePercentage) > 10 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        rootCause: this.identifyVarianceRootCause(cat, variance)
      };
    });

    const totalVariance = categoryVariances.reduce((sum, cat) => sum + cat.variance, 0);
    const totalVariancePercentage = analytics.totalAllocated > 0 ? (totalVariance / analytics.totalAllocated) * 100 : 0;
    const favorableVariances = categoryVariances.filter(cat => cat.variance < 0).reduce((sum, cat) => sum + Math.abs(cat.variance), 0);
    const unfavorableVariances = categoryVariances.filter(cat => cat.variance > 0).reduce((sum, cat) => sum + cat.variance, 0);

    return {
      budgetId: budget._id.toString(),
      budgetName: budget.name,
      period: { startDate, endDate },
      varianceSummary: {
        totalVariance,
        totalVariancePercentage,
        favorableVariances,
        unfavorableVariances,
        netVariance: totalVariance
      },
      categoryVariances,
      varianceDrivers: this.identifyVarianceDrivers(categoryVariances),
      varianceTrends: this.calculateVarianceTrends(analytics, startDate, endDate),
      recommendations: this.generateVarianceRecommendations(categoryVariances, totalVariance)
    };
  }

  /**
   * Generate budget forecast
   */
  private generateBudgetForecast(
    budget: any, 
    historicalData: any[], 
    forecastStartDate: Date, 
    forecastEndDate: Date
  ): IBudgetForecast {
    const forecastPeriod = forecastEndDate.getTime() - forecastStartDate.getTime();
    const daysInForecast = Math.ceil(forecastPeriod / (1000 * 60 * 60 * 24));
    
    // Simple linear projection based on historical data
    const avgDailySpending = historicalData.length > 0 
      ? historicalData.reduce((sum, data) => sum + data.totalSpent, 0) / historicalData.length / 30
      : budget.totalAmount / 30;
    
    const projectedSpending = avgDailySpending * daysInForecast;
    const projectedVariance = projectedSpending - budget.totalAmount;

    return {
      budgetId: budget._id.toString(),
      budgetName: budget.name,
      forecastPeriod: { startDate: forecastStartDate, endDate: forecastEndDate },
      forecast: {
        projectedSpending,
        projectedVariance,
        confidence: historicalData.length > 3 ? 'high' : historicalData.length > 1 ? 'medium' : 'low',
        methodology: 'historical'
      },
      categoryForecasts: this.forecastCategorySpending(budget, historicalData, daysInForecast),
      scenarios: this.generateForecastScenarios(projectedSpending, projectedVariance),
      riskFactors: this.identifyForecastRiskFactors(budget, historicalData),
      recommendations: this.generateForecastRecommendations(projectedSpending, projectedVariance)
    };
  }

  /**
   * Calculate category breakdown
   */
  private calculateCategoryBreakdown(
    budget: any, 
    analytics: IBudgetAnalytics, 
    transactions: any[], 
    startDate: Date, 
    endDate: Date
  ): IBudgetCategoryBreakdown {
    const categoryBreakdown = analytics.categoryBreakdown.map(cat => {
      const categoryTransactions = transactions.filter(t => t.categoryId === cat.categoryId);
      const amounts = categoryTransactions.map(t => t.amount);
      
      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        categoryPath: cat.categoryName, // Would be full path in real implementation
        allocatedAmount: cat.allocatedAmount,
        spentAmount: cat.spentAmount,
        remainingAmount: cat.remainingAmount,
        utilizationPercentage: cat.utilizationPercentage,
        transactionCount: categoryTransactions.length,
        averageTransactionAmount: amounts.length > 0 ? amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length : 0,
        largestTransaction: amounts.length > 0 ? Math.max(...amounts) : 0,
        smallestTransaction: amounts.length > 0 ? Math.min(...amounts) : 0,
        status: cat.status
      };
    });

    return {
      budgetId: budget._id.toString(),
      budgetName: budget.name,
      period: { startDate, endDate },
      categoryBreakdown,
      spendingPatterns: {
        topSpendingCategories: this.getTopSpendingCategories(categoryBreakdown),
        mostActiveCategories: this.getMostActiveCategories(categoryBreakdown),
        categoryEfficiency: this.calculateCategoryEfficiency(categoryBreakdown)
      },
      insights: this.generateBreakdownInsights(categoryBreakdown)
    };
  }

  /**
   * Check budget alerts
   */
  private async checkBudgetAlerts(userId: string, budgetId: string): Promise<IBudgetAlert[]> {
    const alerts: IBudgetAlert[] = [];
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    try {
      const analytics = await this.getBudgetAnalytics(userId, budgetId, currentMonth, endOfMonth);
      
      // Check utilization alerts
      if (analytics.utilizationPercentage > 90) {
        alerts.push({
          id: `alert-${budgetId}-utilization-${now.getTime()}`,
          budgetId: budgetId,
          budgetName: analytics.budgetName,
          type: 'threshold',
          severity: analytics.utilizationPercentage > 100 ? 'critical' : 'warning',
          message: `Budget utilization is at ${analytics.utilizationPercentage.toFixed(1)}%`,
          triggeredAt: now,
          data: {
            currentValue: analytics.utilizationPercentage,
            threshold: 90,
            variance: analytics.totalSpent - analytics.totalAllocated,
            variancePercentage: analytics.totalAllocated > 0 ? ((analytics.totalSpent - analytics.totalAllocated) / analytics.totalAllocated) * 100 : 0
          },
          actions: [],
          resolved: false
        });
      }
      
      // Check category alerts
      for (const category of analytics.categoryBreakdown) {
        if (category.utilizationPercentage > 100) {
          alerts.push({
            id: `alert-${budgetId}-category-${category.categoryId}-${now.getTime()}`,
            budgetId: budgetId,
            budgetName: analytics.budgetName,
            type: 'variance',
            severity: 'critical',
            message: `Category "${category.categoryName}" is over budget by ${(category.utilizationPercentage - 100).toFixed(1)}%`,
            triggeredAt: now,
            data: {
              currentValue: category.utilizationPercentage,
              threshold: 100,
              variance: category.spentAmount - category.allocatedAmount,
              variancePercentage: category.allocatedAmount > 0 ? ((category.spentAmount - category.allocatedAmount) / category.allocatedAmount) * 100 : 0,
              categoryId: category.categoryId,
              categoryName: category.categoryName
            },
            actions: [],
            resolved: false
          });
        }
      }
    } catch (error) {
      logger.error('Error checking budget alerts', { error: String(error), userId, budgetId });
    }
    
    return alerts;
  }

  /**
   * Format export data based on format
   */
  private formatExportData(data: any, options: IBudgetExportOptions): { data: any; format: string; filename: string } {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `budget-report-${options.reportType}-${timestamp}`;
    
    switch (options.format) {
      case 'json':
        return {
          data: JSON.stringify(data, null, 2),
          format: 'application/json',
          filename: `${filename}.json`
        };
      case 'csv':
        return {
          data: this.convertToCSV(data),
          format: 'text/csv',
          filename: `${filename}.csv`
        };
      default:
        return {
          data: JSON.stringify(data, null, 2),
          format: 'application/json',
          filename: `${filename}.json`
        };
    }
  }

  // ==================== ADDITIONAL HELPER METHODS ====================

  private calculateDailySpendingTrend(transactions: any[], startDate: Date, endDate: Date, totalAllocated: number): any[] {
    // Implementation for daily spending trend calculation
    return [];
  }

  private calculateWeeklyTrends(transactions: any[], startDate: Date, endDate: Date, totalAllocated: number): any[] {
    // Implementation for weekly trends calculation
    return [];
  }

  private generatePerformanceInsights(analytics: IBudgetAnalytics, varianceAmount: number, variancePercentage: number): any[] {
    const insights = [];
    
    if (variancePercentage > 10) {
      insights.push({
        type: 'alert',
        priority: 'high',
        message: `Budget is over by ${variancePercentage.toFixed(1)}%`,
        data: { varianceAmount, variancePercentage }
      });
    } else if (variancePercentage < -10) {
      insights.push({
        type: 'recommendation',
        priority: 'medium',
        message: `Budget is under by ${Math.abs(variancePercentage).toFixed(1)}% - consider reallocating funds`,
        data: { varianceAmount, variancePercentage }
      });
    }
    
    return insights;
  }

  private calculateMonthlyBreakdown(analytics: IBudgetAnalytics, startDate: Date, endDate: Date): any[] {
    // Implementation for monthly breakdown calculation
    return [];
  }

  private getTopVariances(categoryBreakdown: any[]): any[] {
    return categoryBreakdown
      .map(cat => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        variance: cat.spentAmount - cat.allocatedAmount,
        variancePercentage: cat.allocatedAmount > 0 ? ((cat.spentAmount - cat.allocatedAmount) / cat.allocatedAmount) * 100 : 0,
        type: cat.spentAmount > cat.allocatedAmount ? 'over' : 'under'
      }))
      .sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance))
      .slice(0, 5);
  }

  private generateVsActualRecommendations(analytics: IBudgetAnalytics, variance: number, variancePercentage: number): any[] {
    const recommendations = [];
    
    if (variancePercentage > 20) {
      recommendations.push({
        type: 'spending_control',
        priority: 'high',
        message: 'Significant budget overrun detected. Implement immediate spending controls.',
        potentialSavings: Math.abs(variance),
        suggestedAction: 'Review and reduce discretionary spending'
      });
    }
    
    return recommendations;
  }

  private calculateUtilizationTrend(historicalData: any[]): any[] {
    // Implementation for utilization trend calculation
    return [];
  }

  private calculateSpendingVelocity(historicalData: any[], startDate: Date, endDate: Date): any[] {
    // Implementation for spending velocity calculation
    return [];
  }

  private calculateCategoryTrends(historicalData: any[]): any[] {
    // Implementation for category trends calculation
    return [];
  }

  private projectEndOfPeriod(historicalData: any[], startDate: Date, endDate: Date): any {
    // Implementation for end of period projection
    return {
      projectedSpending: 0,
      projectedVariance: 0,
      confidence: 'low',
      basedOnTrend: 'average'
    };
  }

  private projectCategorySpending(historicalData: any[]): any[] {
    // Implementation for category spending projection
    return [];
  }

  private generateTrendInsights(historicalData: any[]): any[] {
    // Implementation for trend insights generation
    return [];
  }

  private identifyVarianceRootCause(category: any, variance: number): string {
    if (variance > 0) {
      return 'Higher than expected spending in this category';
    } else {
      return 'Lower than expected spending in this category';
    }
  }

  private identifyVarianceDrivers(categoryVariances: any[]): any[] {
    return categoryVariances
      .map(cat => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        varianceContribution: cat.variance,
        varianceContributionPercentage: 0, // Would be calculated based on total variance
        type: cat.variance > 0 ? 'negative' : 'positive'
      }))
      .sort((a, b) => Math.abs(b.varianceContribution) - Math.abs(a.varianceContribution));
  }

  private calculateVarianceTrends(analytics: IBudgetAnalytics, startDate: Date, endDate: Date): any[] {
    // Implementation for variance trends calculation
    return [];
  }

  private generateVarianceRecommendations(categoryVariances: any[], totalVariance: number): any[] {
    const recommendations = [];
    
    if (totalVariance > 0) {
      recommendations.push({
        type: 'budget_revision',
        priority: 'high',
        message: 'Consider revising budget allocations based on actual spending patterns',
        expectedImpact: Math.abs(totalVariance),
        actionRequired: 'Review and adjust category allocations'
      });
    }
    
    return recommendations;
  }

  private forecastCategorySpending(budget: any, historicalData: any[], daysInForecast: number): any[] {
    // Implementation for category spending forecast
    return [];
  }

  private generateForecastScenarios(projectedSpending: number, projectedVariance: number): any[] {
    return [
      {
        scenario: 'optimistic',
        projectedSpending: projectedSpending * 0.8,
        projectedVariance: projectedVariance * 0.8,
        probability: 0.2,
        keyAssumptions: ['Reduced discretionary spending', 'No unexpected expenses']
      },
      {
        scenario: 'realistic',
        projectedSpending,
        projectedVariance,
        probability: 0.6,
        keyAssumptions: ['Current spending patterns continue', 'Normal seasonal variations']
      },
      {
        scenario: 'pessimistic',
        projectedSpending: projectedSpending * 1.2,
        projectedVariance: projectedVariance * 1.2,
        probability: 0.2,
        keyAssumptions: ['Increased discretionary spending', 'Unexpected expenses occur']
      }
    ];
  }

  private identifyForecastRiskFactors(budget: any, historicalData: any[]): any[] {
    return [
      {
        factor: 'Seasonal spending variations',
        impact: 'medium',
        probability: 'high',
        description: 'Historical data shows seasonal patterns in spending',
        mitigation: 'Adjust forecasts based on seasonal factors'
      },
      {
        factor: 'Unexpected expenses',
        impact: 'high',
        probability: 'medium',
        description: 'Unplanned expenses can significantly impact budget',
        mitigation: 'Maintain emergency fund and flexible budget categories'
      }
    ];
  }

  private generateForecastRecommendations(projectedSpending: number, projectedVariance: number): any[] {
    const recommendations = [];
    
    if (projectedVariance > 0) {
      recommendations.push({
        type: 'spending_control',
        priority: 'high',
        message: 'Projected spending exceeds budget. Implement spending controls.',
        expectedOutcome: 'Reduced spending to stay within budget',
        actionRequired: 'Review and reduce discretionary spending'
      });
    }
    
    return recommendations;
  }

  private getTopSpendingCategories(categoryBreakdown: any[]): any[] {
    return categoryBreakdown
      .sort((a, b) => b.spentAmount - a.spentAmount)
      .slice(0, 5)
      .map(cat => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        amount: cat.spentAmount,
        percentage: 0 // Would be calculated based on total spending
      }));
  }

  private getMostActiveCategories(categoryBreakdown: any[]): any[] {
    return categoryBreakdown
      .sort((a, b) => b.transactionCount - a.transactionCount)
      .slice(0, 5)
      .map(cat => ({
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        transactionCount: cat.transactionCount,
        averageAmount: cat.averageTransactionAmount
      }));
  }

  private calculateCategoryEfficiency(categoryBreakdown: any[]): any[] {
    return categoryBreakdown.map(cat => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      efficiency: cat.allocatedAmount > 0 ? cat.spentAmount / cat.allocatedAmount : 0,
      status: cat.utilizationPercentage > 100 ? 'over-spent' : cat.utilizationPercentage > 80 ? 'inefficient' : 'efficient'
    }));
  }

  private generateBreakdownInsights(categoryBreakdown: any[]): any[] {
    const insights = [];
    
    const overBudgetCategories = categoryBreakdown.filter(cat => cat.utilizationPercentage > 100);
    if (overBudgetCategories.length > 0) {
      insights.push({
        type: 'alert',
        priority: 'high',
        message: `${overBudgetCategories.length} categories are over budget`,
        data: { overBudgetCount: overBudgetCategories.length }
      });
    }
    
    return insights;
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would be more sophisticated in production
    return JSON.stringify(data);
  }

  /**
   * Generate comprehensive financial report
   */
  async generateFinancialReport(userId: string, options: {
    format: 'pdf' | 'excel' | 'csv' | 'json';
    reportType: 'spending' | 'budgets' | 'cashflow' | 'comprehensive';
    startDate: Date;
    endDate: Date;
    includeCharts?: boolean;
    includeInsights?: boolean;
    includeRecommendations?: boolean;
  }): Promise<{
    data: Buffer | string;
    filename: string;
    mimeType: string;
    size: number;
  }> {
    try {
      logger.info('Generating financial report', { userId, options });

      // Import the report generator service
      const { ReportGeneratorService } = await import('./report-generator.service');
      const reportGenerator = new ReportGeneratorService();

      return await reportGenerator.generateReport(userId, options);
    } catch (error) {
      logger.error('Error generating financial report', { error: (error as Error).message, userId, options });
      throw error;
    }
  }
}