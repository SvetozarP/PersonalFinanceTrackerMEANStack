import { CategoryService } from './categories/service/category.service';
import { TransactionService } from './transactions/services/transaction.service';
import { logger } from '../../shared/services/logger.service';
import {
  TransactionType,
  TransactionStatus,
} from './transactions/interfaces/transaction.interface';

export class FinancialService {
  private categoryService: CategoryService;
  private transactionService: TransactionService;

  constructor() {
    this.categoryService = new CategoryService();
    this.transactionService = new TransactionService();
  }

  /**
   * Get comprehensive financial dashboard data
   */
  async getFinancialDashboard(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      accountId?: string;
      separateByCurrency?: boolean;
    } = {}
  ): Promise<{
    overview: {
      totalBalance: number;
      monthlyIncome: number;
      monthlyExpenses: number;
      monthlyNet: number;
      pendingTransactions: number;
      upcomingRecurring: number;
    };
    recentTransactions: any[];
    topCategories: any[];
    spendingTrends: any[];
    budgetStatus: any[];
  } | {[currency: string]: {
    overview: {
      totalBalance: number;
      monthlyIncome: number;
      monthlyExpenses: number;
      monthlyNet: number;
      pendingTransactions: number;
      upcomingRecurring: number;
    };
    recentTransactions: any[];
    topCategories: any[];
    spendingTrends: any[];
    budgetStatus: any[];
  }}> {
    try {
      logger.info('Getting financial dashboard data', { userId, options });

      const { startDate, endDate, separateByCurrency } = options;

      // Set default date range to current month if not provided
      const now = new Date();
      const defaultStartDate =
        startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate =
        endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // If currency separation is requested, return currency-separated data
      if (separateByCurrency) {
        return await this.getCurrencySeparatedDashboard(userId, {
          startDate: defaultStartDate,
          endDate: defaultEndDate,
        });
      }

      // Get transaction statistics
      const transactionStats =
        await this.transactionService.getTransactionStats(userId, {
          startDate: defaultStartDate,
          endDate: defaultEndDate,
        });

      // Get recent transactions
      const recentTransactions =
        await this.transactionService.getUserTransactions(userId, {
          startDate: defaultStartDate,
          endDate: defaultEndDate,
          limit: 10,
          sortBy: 'date',
          sortOrder: 'desc',
        });

      // Get category statistics (will be used in future phases)
      await this.categoryService.getCategoryStats(userId);

      // Get recurring transactions count
      const recurringTransactions =
        await this.transactionService.getRecurringTransactions(userId);
      const upcomingRecurring = recurringTransactions.filter(
        t => t.nextOccurrence && t.nextOccurrence > now
      ).length;

      // Calculate monthly overview
      const monthlyIncome =
        transactionStats.transactionsByType[TransactionType.INCOME]?.total || 0;
      const monthlyExpenses =
        transactionStats.transactionsByType[TransactionType.EXPENSE]?.total ||
        0;
      const monthlyNet = monthlyIncome - monthlyExpenses;

      // Get pending transactions count
      const pendingTransactions =
        await this.transactionService.getUserTransactions(userId, {
          status: TransactionStatus.PENDING,
          limit: 1,
        });

      const dashboard = {
        overview: {
          totalBalance: monthlyNet, // This would be calculated from account balances in Phase 4
          monthlyIncome,
          monthlyExpenses,
          monthlyNet,
          pendingTransactions: pendingTransactions.total,
          upcomingRecurring,
        },
        recentTransactions: recentTransactions.transactions,
        topCategories: transactionStats.transactionsByCategory.slice(0, 5),
        spendingTrends: transactionStats.monthlyTrends.slice(-6), // Last 6 months
        budgetStatus: [], // Will be implemented in Phase 4
      };

      logger.info('Financial dashboard data retrieved successfully', {
        userId,
      });

      return dashboard;
    } catch (error) {
      logger.error('Error getting financial dashboard', {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Get currency-separated financial dashboard data
   */
  private async getCurrencySeparatedDashboard(
    userId: string,
    options: {
      startDate: Date;
      endDate: Date;
    }
  ): Promise<{[currency: string]: {
    overview: {
      totalBalance: number;
      monthlyIncome: number;
      monthlyExpenses: number;
      monthlyNet: number;
      pendingTransactions: number;
      upcomingRecurring: number;
    };
    recentTransactions: any[];
    topCategories: any[];
    spendingTrends: any[];
    budgetStatus: any[];
  }}> {
    try {
      logger.info('Getting currency-separated dashboard data', { userId, options });

      // Get all transactions for the period
      const allTransactions = await this.transactionService.getUserTransactions(userId, {
        startDate: options.startDate,
        endDate: options.endDate,
        limit: 10000, // Large limit to get all transactions
      });

      // Group transactions by currency
      const transactionsByCurrency: {[currency: string]: any[]} = {};
      console.log('Total transactions received:', allTransactions.transactions.length);
      allTransactions.transactions.forEach(transaction => {
        const currency = transaction.currency || 'USD';
        console.log(`Transaction ${transaction._id}: currency=${currency}, amount=${transaction.amount}, type=${transaction.type}`);
        if (!transactionsByCurrency[currency]) {
          transactionsByCurrency[currency] = [];
        }
        transactionsByCurrency[currency].push(transaction);
      });
      console.log('Transactions grouped by currency:', Object.keys(transactionsByCurrency).map(currency => ({
        currency,
        count: transactionsByCurrency[currency].length
      })));

      // Get recurring transactions for upcoming count
      const recurringTransactions = await this.transactionService.getRecurringTransactions(userId);
      const now = new Date();

      // Create dashboard data for each currency
      const currencyDashboards: {[currency: string]: any} = {};

      for (const [currency, transactions] of Object.entries(transactionsByCurrency)) {
        // Calculate statistics for this currency
        const income = transactions
          .filter(t => t.type === TransactionType.INCOME)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = transactions
          .filter(t => t.type === TransactionType.EXPENSE)
          .reduce((sum, t) => sum + t.amount, 0);
        
        const net = income - expenses;

        // Get pending transactions for this currency
        const pendingTransactions = transactions.filter(t => t.status === TransactionStatus.PENDING);

        // Get upcoming recurring transactions for this currency
        const upcomingRecurring = recurringTransactions.filter(
          t => t.currency === currency && t.nextOccurrence && t.nextOccurrence > now
        ).length;

        // Get recent transactions (last 10) for this currency
        const recentTransactions = transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);

        // Calculate top categories for this currency
        const categoryTotals: {[categoryId: string]: number} = {};
        
        transactions
          .filter(t => t.type === TransactionType.EXPENSE)
          .forEach(transaction => {
            
            // Ensure we're getting just the string ID, not the entire object
            let categoryId = '';
            if (typeof transaction.categoryId === 'string') {
              categoryId = transaction.categoryId;
            } else if (transaction.categoryId && typeof transaction.categoryId === 'object') {
              // If it's an object, extract the _id or id field
              categoryId = transaction.categoryId._id?.toString() || transaction.categoryId.id?.toString() || '';
            } else {
              categoryId = transaction.categoryId?.toString() || '';
            }
            
            if (categoryId && !categoryTotals[categoryId]) {
              categoryTotals[categoryId] = 0;
            }
            if (categoryId) {
              categoryTotals[categoryId] += transaction.amount;
            }
          });

        // Fetch actual category names from database
        const categoryIds = Object.keys(categoryTotals);
        let finalTopCategories: any[] = [];
        
        if (categoryIds.length > 0) {
          try {
            const categories = await this.categoryService.getCategoriesByIds(categoryIds);
            const categoryMap = new Map(categories.map(cat => [(cat._id as any).toString(), cat]));
            
            finalTopCategories = Object.entries(categoryTotals)
              .map(([categoryId, amount]) => {
                const category = categoryMap.get(categoryId);
                return {
                  name: category ? category.name : `Category ${categoryId.substring(0, 8)}`,
                  amount: Number(amount) || 0,
                  color: category ? (category.color || '#3B82F6') : '#3B82F6'
                };
              })
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5);
          } catch (error) {
            logger.error('Error fetching categories for dashboard', { error: String(error), categoryIds });
            // Fallback to simplified names if database lookup fails
            finalTopCategories = Object.entries(categoryTotals)
              .map(([categoryId, amount]) => ({
                name: `Category ${categoryId.substring(0, 8)}`,
                amount: Number(amount) || 0,
                color: '#3B82F6'
              }))
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 5);
          }
        }

        // Create monthly trends for this currency based on actual transaction data
        const monthlyTrends: {[month: string]: number} = {};
        const now = new Date();
        
        // Get trends for the last 6 months
        for (let i = 5; i >= 0; i--) {
          const trendDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = trendDate.toISOString().substring(0, 7); // YYYY-MM format
          
          // Calculate spending for this month
          const monthStart = new Date(trendDate.getFullYear(), trendDate.getMonth(), 1);
          const monthEnd = new Date(trendDate.getFullYear(), trendDate.getMonth() + 1, 0);
          
          const monthTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= monthStart && transactionDate <= monthEnd && t.type === TransactionType.EXPENSE;
          });
          
          const monthSpending = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
          monthlyTrends[monthKey] = monthSpending;
        }
        
        const spendingTrends = Object.entries(monthlyTrends)
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => a.month.localeCompare(b.month));

        currencyDashboards[currency] = {
          overview: {
            totalBalance: net,
            monthlyIncome: income,
            monthlyExpenses: expenses,
            monthlyNet: net,
            pendingTransactions: pendingTransactions.length,
            upcomingRecurring,
          },
          recentTransactions,
          topCategories: finalTopCategories,
          spendingTrends,
          budgetStatus: [], // Will be implemented in Phase 4
        };
      }

      console.log('Final currency dashboards:', Object.keys(currencyDashboards));
      console.log('Currency dashboards data:', currencyDashboards);

      logger.info('Currency-separated dashboard data retrieved successfully', {
        userId,
        currencies: Object.keys(currencyDashboards),
      });

      return currencyDashboards;
    } catch (error) {
      logger.error('Error getting currency-separated dashboard', {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Generate comprehensive financial reports
   */
  async generateFinancialReport(
    userId: string,
    options: {
      reportType: 'monthly' | 'quarterly' | 'yearly' | 'custom';
      startDate?: Date;
      endDate?: Date;
      includeCategories?: boolean;
      includeTrends?: boolean;
      includeProjections?: boolean;
      separateByCurrency?: boolean;
      granularity?: string;
    }
  ): Promise<{
    reportType: string;
    period: { start: Date; end: Date };
    summary: {
      totalIncome: number;
      totalExpenses: number;
      totalTransfers: number;
      netAmount: number;
      transactionCount: number;
    };
    categories: any[];
    trends: any[];
    projections: any[];
    insights: string[];
  } | {[currency: string]: {
    reportType: string;
    period: { start: Date; end: Date };
    summary: {
      totalIncome: number;
      totalExpenses: number;
      totalTransfers: number;
      netAmount: number;
      transactionCount: number;
    };
    categories: any[];
    trends: any[];
    projections: any[];
    insights: string[];
  }}> {
    try {
      logger.info('Generating financial report', { userId, options });

      const {
        reportType,
        startDate,
        endDate,
        includeCategories = true,
        includeTrends = true,
        includeProjections = false,
        separateByCurrency = false,
      } = options;

      // Calculate date range based on report type
      const { calculatedStartDate, calculatedEndDate } =
        this.calculateReportDateRange(reportType, startDate, endDate);

      // If currency separation is requested, return currency-separated data
      if (separateByCurrency) {
        return await this.generateCurrencySeparatedReport(
          userId,
          reportType,
          calculatedStartDate,
          calculatedEndDate,
          includeCategories,
          includeTrends,
          includeProjections,
          options.granularity
        );
      }

      // Get transaction statistics for the period
      const transactionStats =
        await this.transactionService.getTransactionStats(userId, {
          startDate: calculatedStartDate,
          endDate: calculatedEndDate,
        });

      // Get category breakdown if requested
      let categories: any[] = [];
      if (includeCategories) {
        categories = transactionStats.transactionsByCategory;
      }

      // Get trends if requested
      let trends: any[] = [];
      if (includeTrends) {
        trends = transactionStats.monthlyTrends;
      }

      // Generate insights
      const insights = this.generateFinancialInsights(transactionStats, trends);

      // Generate projections if requested
      let projections: any[] = [];
      if (includeProjections) {
        projections = this.generateFinancialPredictions(
          transactionStats,
          trends
        );
      }

      const report = {
        reportType,
        period: {
          start: calculatedStartDate,
          end: calculatedEndDate,
        },
        summary: {
          totalIncome: transactionStats.totalIncome,
          totalExpenses: transactionStats.totalExpenses,
          totalTransfers: transactionStats.totalTransfers,
          netAmount:
            transactionStats.totalIncome - transactionStats.totalExpenses,
          transactionCount: transactionStats.totalTransactions,
        },
        categories,
        trends,
        projections,
        insights,
      };

      logger.info('Financial report generated successfully', {
        userId,
        reportType,
        period: { start: calculatedStartDate, end: calculatedEndDate },
      });

      return report;
    } catch (error) {
      logger.error('Error generating financial report', {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Get budget analysis and recommendations
   */
  async getBudgetAnalysis(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      categoryId?: string;
    } = {}
  ): Promise<{
    currentSpending: {
      total: number;
      byCategory: any[];
      vsBudget: any[];
    };
    recommendations: {
      category: string;
      action: string;
      reason: string;
      impact: 'high' | 'medium' | 'low';
    }[];
    alerts: {
      type: 'overspending' | 'unusual' | 'trend';
      message: string;
      severity: 'warning' | 'critical';
    }[];
  }> {
    try {
      logger.info('Getting budget analysis', { userId, options });

      const { startDate, endDate, categoryId } = options;

      // Set default date range to current month
      const now = new Date();
      const defaultStartDate =
        startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate =
        endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get transaction statistics
      const transactionStats =
        await this.transactionService.getTransactionStats(userId, {
          startDate: defaultStartDate,
          endDate: defaultEndDate,
          categoryId,
        });

      // Get category breakdown
      const spendingByCategory = transactionStats.transactionsByCategory;

      // Generate recommendations based on spending patterns
      const recommendations = this.generateBudgetRecommendations(
        spendingByCategory,
        transactionStats
      );

      // Generate alerts for unusual spending
      const alerts = this.generateBudgetAlerts(
        spendingByCategory,
        transactionStats
      );

      const analysis = {
        currentSpending: {
          total: transactionStats.totalExpenses,
          byCategory: spendingByCategory,
          vsBudget: [], // Will be implemented in Phase 4 with budget models
        },
        recommendations,
        alerts,
      };

      logger.info('Budget analysis completed', { userId });

      return analysis;
    } catch (error) {
      logger.error('Error getting budget analysis', {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Get financial insights and trends
   */
  async getFinancialInsights(
    userId: string,
    options: {
      period?: 'week' | 'month' | 'quarter' | 'year';
      includePredictions?: boolean;
    } = {}
  ): Promise<{
    period: string;
    insights: {
      type: 'spending' | 'income' | 'savings' | 'trend';
      title: string;
      description: string;
      value: number;
      change: number;
      changeType: 'increase' | 'decrease' | 'stable';
    }[];
    trends: {
      category: string;
      trend: 'rising' | 'falling' | 'stable';
      change: number;
      confidence: number;
    }[];
    predictions: any[];
  }> {
    try {
      logger.info('Getting financial insights', { userId, options });

      const { period, includePredictions = false } = options;

      // Calculate date range for the period
      const { startDate, endDate } = this.calculatePeriodDateRange(
        period || 'month'
      );

      // Get transaction statistics for the period
      const transactionStats =
        await this.transactionService.getTransactionStats(userId, {
          startDate,
          endDate,
        });

      // Generate insights based on spending patterns
      const insights = this.generatePeriodInsights(
        transactionStats,
        period || 'month'
      );

      // Analyze trends by category
      const trends = this.analyzeCategoryTrends(
        transactionStats.transactionsByCategory
      );

      // Generate predictions if requested
      let predictions: any[] = [];
      if (includePredictions) {
        predictions = this.generateFinancialPredictions(
          transactionStats,
          trends
        );
      }

      const result = {
        period: period || 'month',
        insights,
        trends,
        predictions,
      };

      logger.info('Financial insights generated', { userId, period });

      return result;
    } catch (error) {
      logger.error('Error getting financial insights', {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Export financial data in various formats
   */
  async exportFinancialData(
    userId: string,
    options: {
      format: 'csv' | 'json' | 'pdf';
      startDate: Date;
      endDate: Date;
      includeCategories?: boolean;
      includeTransactions?: boolean;
      includeStats?: boolean;
    }
  ): Promise<{
    format: string;
    data: any;
    filename: string;
    downloadUrl?: string;
  }> {
    try {
      logger.info('Exporting financial data', { userId, options });

      const {
        format,
        startDate,
        endDate,
        includeCategories,
        includeTransactions,
        includeStats,
      } = options;

      // Collect data based on options
      const exportData: any = {};

      if (includeStats) {
        exportData.stats = await this.transactionService.getTransactionStats(
          userId,
          {
            startDate,
            endDate,
          }
        );
      }

      if (includeTransactions) {
        const transactions = await this.transactionService.getUserTransactions(
          userId,
          {
            startDate,
            endDate,
            limit: 10000, // Large limit for export
          }
        );
        exportData.transactions = transactions.transactions;
      }

      if (includeCategories) {
        exportData.categories =
          await this.categoryService.getUserCategories(userId);
      }

      // Generate filename
      const filename = `financial_data_${userId}_${startDate.toISOString().split('T')[0]}_${endDate.toISOString().split('T')[0]}.${format}`;

      // Format data based on export format
      let formattedData: any;
      let downloadUrl: string | undefined;

      switch (format) {
        case 'json':
          formattedData = exportData;
          break;
        case 'csv':
          formattedData = this.convertToCSV(exportData);
          break;
        case 'pdf':
          // PDF generation would be implemented here
          formattedData = exportData;
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      const result = {
        format,
        data: formattedData,
        filename,
        downloadUrl,
      };

      logger.info('Financial data exported successfully', {
        userId,
        format,
        filename,
      });

      return result;
    } catch (error) {
      logger.error('Error exporting financial data', {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private calculateReportDateRange(
    reportType: string,
    startDate?: Date,
    endDate?: Date
  ): {
    calculatedStartDate: Date;
    calculatedEndDate: Date;
  } {
    const now = new Date();

    if (startDate && endDate) {
      return { calculatedStartDate: startDate, calculatedEndDate: endDate };
    }

    switch (reportType) {
      case 'monthly':
        return {
          calculatedStartDate: new Date(now.getFullYear(), now.getMonth(), 1),
          calculatedEndDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };
      case 'quarterly': {
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          calculatedStartDate: new Date(now.getFullYear(), quarter * 3, 1),
          calculatedEndDate: new Date(now.getFullYear(), (quarter + 1) * 3, 0),
        };
      }
      case 'yearly':
        return {
          calculatedStartDate: new Date(now.getFullYear(), 0, 1),
          calculatedEndDate: new Date(now.getFullYear(), 11, 31),
        };
      default:
        return {
          calculatedStartDate: new Date(now.getFullYear(), now.getMonth(), 1),
          calculatedEndDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        };
    }
  }

  private calculatePeriodDateRange(period: string): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();

    switch (period) {
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return {
          startDate: weekStart,
          endDate: now,
        };
      }
      case 'month':
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: now,
        };
      case 'quarter': {
        const quarter = Math.floor(now.getMonth() / 3);
        return {
          startDate: new Date(now.getFullYear(), quarter * 3, 1),
          endDate: now,
        };
      }
      case 'year':
        return {
          startDate: new Date(now.getFullYear(), 0, 1),
          endDate: now,
        };
      default:
        return {
          startDate: new Date(now.getFullYear(), now.getMonth(), 1),
          endDate: now,
        };
    }
  }

  /**
   * Generate trends based on granularity
   */
  private generateTrendsByGranularity(transactions: any[], granularity?: string): any[] {
    if (!transactions || transactions.length === 0) return [];

    // Determine granularity based on period and user preference
    let actualGranularity = granularity || 'auto';
    
    if (actualGranularity === 'auto') {
      // Auto-determine based on data range
      const dateRange = this.getDateRange(transactions);
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 7) actualGranularity = 'days';
      else if (daysDiff <= 30) actualGranularity = 'days';
      else if (daysDiff <= 90) actualGranularity = 'weeks';
      else if (daysDiff <= 365) actualGranularity = 'months';
      else actualGranularity = 'quarters';
    }

    const groupedData: {[key: string]: {income: number, expenses: number}} = {};

    transactions.forEach(transaction => {
      let periodKey = '';
      
      switch (actualGranularity) {
        case 'days':
          periodKey = transaction.date.toISOString().substring(0, 10); // YYYY-MM-DD
          break;
        case 'weeks':
          periodKey = this.getWeekKey(transaction.date);
          break;
        case 'months':
          periodKey = transaction.date.toISOString().substring(0, 7); // YYYY-MM
          break;
        case 'quarters':
          periodKey = this.getQuarterKey(transaction.date);
          break;
        default:
          periodKey = transaction.date.toISOString().substring(0, 7); // Default to months
      }

      if (!groupedData[periodKey]) {
        groupedData[periodKey] = { income: 0, expenses: 0 };
      }

      if (transaction.type === 'income') {
        groupedData[periodKey].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        groupedData[periodKey].expenses += transaction.amount;
      }
    });

    return Object.entries(groupedData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({
        period,
        month: new Date(period + (actualGranularity === 'days' ? '' : '-01')),
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      }));
  }

  private getDateRange(transactions: any[]): {start: Date, end: Date} {
    if (transactions.length === 0) return {start: new Date(), end: new Date()};
    
    const dates = transactions.map(t => new Date(t.date));
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private getQuarterKey(date: Date): string {
    const year = date.getFullYear();
    const quarter = Math.ceil((date.getMonth() + 1) / 3);
    return `${year}-Q${quarter}`;
  }

  private generateMonthlyTrends(transactions: any[]): any[] {
    const monthlyData: {[key: string]: {income: number, expenses: number}} = {};
    
    transactions.forEach(transaction => {
      const month = transaction.date.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }
      if (transaction.type === 'income') {
        monthlyData[month].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        monthlyData[month].expenses += transaction.amount;
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        period: month,
        month: new Date(month + '-01'),
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      }));
  }

  private generateFinancialInsights(stats: any, _trends: any[]): string[] {
    const insights: string[] = [];

    // Spending insights
    if (stats.totalExpenses > stats.totalIncome * 0.8) {
      insights.push(
        'Your expenses are high relative to income. Consider reviewing discretionary spending.'
      );
    }

    if (stats.totalExpenses > stats.totalIncome) {
      insights.push(
        'You are spending more than you earn. Focus on reducing expenses or increasing income.'
      );
    }

    // Category insights
    const topCategory = stats.transactionsByCategory && stats.transactionsByCategory.length > 0 ? stats.transactionsByCategory[0] : null;
    if (topCategory && topCategory.percentage > 40) {
      insights.push(
        `${topCategory.categoryName} accounts for ${topCategory.percentage.toFixed(1)}% of your spending. Consider if this aligns with your priorities.`
      );
    }

    return insights;
  }

  private generateBudgetRecommendations(
    spendingByCategory: any[],
    _stats: any
  ): any[] {
    const recommendations: any[] = [];

    // Analyze spending patterns and generate recommendations
    spendingByCategory.forEach(category => {
      if (category.percentage > 30) {
        recommendations.push({
          category: category.categoryName,
          action: 'Review spending',
          reason: 'This category represents a large portion of your expenses',
          impact: 'high' as const,
        });
      }
    });

    return recommendations;
  }

  private generateBudgetAlerts(spendingByCategory: any[], stats: any): any[] {
    const alerts: any[] = [];

    // Generate alerts for unusual spending patterns
    if (stats.totalExpenses > stats.totalIncome) {
      alerts.push({
        type: 'overspending' as const,
        message: 'You are spending more than you earn this month',
        severity: 'critical' as const,
      });
    }

    return alerts;
  }

  private generatePeriodInsights(stats: any, period: string): any[] {
    const insights: any[] = [];

    // Generate period-specific insights
    if (period === 'month') {
      if (stats.totalExpenses > stats.totalIncome) {
        insights.push({
          type: 'spending' as const,
          title: 'Monthly Overspending',
          description: 'You spent more than you earned this month',
          value: stats.totalExpenses - stats.totalIncome,
          change: 0,
          changeType: 'increase' as const,
        });
      }
    }

    return insights;
  }

  private analyzeCategoryTrends(categories: any[]): any[] {
    return categories.map(category => ({
      category: category.categoryName,
      trend: 'stable' as const,
      change: 0,
      confidence: 0.8,
    }));
  }

  private generateFinancialPredictions(stats: any, _trends: any[]): any[] {
    // Simple prediction logic - would be enhanced with ML in production
    return [
      {
        type: 'expense',
        prediction: stats.totalExpenses * 1.05, // 5% increase
        confidence: 0.7,
        reasoning: 'Based on current spending trends',
      },
    ];
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would be enhanced for production
    let csv = '';

    if (data.transactions) {
      const headers = Object.keys(data.transactions[0] || {}).join(',');
      csv += headers + '\n';

      data.transactions.forEach((transaction: any) => {
        const values = Object.values(transaction)
          .map(v => `"${v}"`)
          .join(',');
        csv += values + '\n';
      });
    }

    return csv;
  }

  /**
   * Generate currency-separated financial report
   */
  private async generateCurrencySeparatedReport(
    userId: string,
    reportType: string,
    startDate: Date,
    endDate: Date,
    includeCategories: boolean,
    includeTrends: boolean,
    includeProjections: boolean,
    granularity?: string
  ): Promise<{[currency: string]: any}> {
    try {
      logger.info('Generating currency-separated financial report', { userId, reportType, startDate, endDate, granularity });
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Report generation timeout')), 25000); // 25 second timeout
      });
      
      const reportPromise = this.generateCurrencySeparatedReportInternal(
        userId, reportType, startDate, endDate, includeCategories, includeTrends, includeProjections, granularity
      );
      
      return await Promise.race([reportPromise, timeoutPromise]) as {[currency: string]: any};
    } catch (error) {
      logger.error('Error in generateCurrencySeparatedReport', { error: String(error), userId, reportType });
      throw error;
    }
  }

  private async generateCurrencySeparatedReportInternal(
    userId: string,
    reportType: string,
    startDate: Date,
    endDate: Date,
    includeCategories: boolean,
    includeTrends: boolean,
    includeProjections: boolean,
    granularity?: string
  ): Promise<{[currency: string]: any}> {
    // Get all transactions for the period to identify currencies
      const transactions = await this.transactionService.getUserTransactions(userId, {
        startDate,
        endDate,
        limit: 10000
      });

      console.log('Transactions response:', transactions);
      console.log('Transactions type:', typeof transactions);
      console.log('Is array:', Array.isArray(transactions));

      // Group transactions by currency
      const transactionsByCurrency: {[currency: string]: any[]} = {};
      
      // Handle both array and object response structures
      let transactionList: any[];
      if (Array.isArray(transactions)) {
        transactionList = transactions;
      } else if (transactions && transactions.transactions) {
        transactionList = transactions.transactions;
      } else {
        throw new Error('No transactions found or invalid response structure');
      }

      console.log('Transaction list length:', transactionList.length);
      console.log('First transaction:', transactionList[0]);
      
      transactionList.forEach((transaction, index) => {
        console.log(`Processing transaction ${index}:`, transaction.currency);
        const currency = transaction.currency || 'USD';
        if (!transactionsByCurrency[currency]) {
          transactionsByCurrency[currency] = [];
        }
        transactionsByCurrency[currency].push(transaction);
      });
      
      console.log('Transactions by currency:', Object.keys(transactionsByCurrency));

      const currencyReports: {[currency: string]: any} = {};

      // Generate report for each currency
      for (const [currency, currencyTransactions] of Object.entries(transactionsByCurrency)) {
        // Calculate stats for this currency
        const totalIncome = currencyTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpenses = currencyTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalTransfers = currencyTransactions
          .filter(t => t.type === 'transfer')
          .reduce((sum, t) => sum + t.amount, 0);

        // Get category breakdown for this currency
        let categories: any[] = [];
        if (includeCategories) {
          const categoryMap: {[key: string]: {count: number, total: number, name: string}} = {};
          currencyTransactions.forEach(transaction => {
            // Try different field names for category
            const categoryId = transaction.categoryId?._id || transaction.categoryId?.id || transaction.category?.id || transaction.category?._id;
            const categoryName = transaction.categoryId?.name || transaction.categoryName || transaction.category?.name;
            
            if (categoryId && categoryName) {
              if (!categoryMap[categoryId]) {
                categoryMap[categoryId] = {
                  count: 0,
                  total: 0,
                  name: categoryName
                };
              }
              categoryMap[categoryId].count++;
              categoryMap[categoryId].total += transaction.amount;
            }
          });
          // Calculate total of all category amounts for percentage calculation
          const totalCategoryAmount = Object.values(categoryMap).reduce((sum, data) => sum + Math.abs(data.total), 0);
          
          categories = Object.entries(categoryMap).map(([categoryId, data]) => ({
            categoryId,
            categoryName: data.name,
            count: data.count,
            total: data.total,
            percentage: totalCategoryAmount > 0 ? (Math.abs(data.total) / totalCategoryAmount) * 100 : 0
          }));
        }

        // Generate trends for this currency
        let trends: any[] = [];
        if (includeTrends) {
          try {
            trends = this.generateTrendsByGranularity(currencyTransactions, granularity);
          } catch (error: any) {
            console.error(`Error generating trends for currency ${currency}:`, error);
            // Fallback to monthly trends
            trends = this.generateMonthlyTrends(currencyTransactions);
          }
        }

        // Generate insights for this currency
        const insights = this.generateFinancialInsights({
          totalIncome,
          totalExpenses,
          totalTransfers,
          totalTransactions: currencyTransactions.length
        }, trends);

        currencyReports[currency] = {
          reportType,
          period: { start: startDate, end: endDate },
          summary: {
            totalIncome,
            totalExpenses,
            totalTransfers,
            netAmount: totalIncome - totalExpenses,
            transactionCount: currencyTransactions.length,
          },
          categories,
          trends,
          projections: includeProjections ? this.generateFinancialPredictions({
            totalIncome,
            totalExpenses,
            totalTransfers,
            totalTransactions: currencyTransactions.length
          }, trends) : [],
          insights,
          currency
        };
      }

      logger.info('Currency-separated financial report generated', { 
        userId, 
        currencies: Object.keys(currencyReports),
        reportCount: Object.keys(currencyReports).length 
      });

    return currencyReports;
  }
}

export default FinancialService;
