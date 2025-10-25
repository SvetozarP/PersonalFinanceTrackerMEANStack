import { Request, Response } from 'express';
import { FinancialService } from './financial.service';
import { logger } from '../../shared/services/logger.service';

// Extend the Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export class FinancialController {
  private financialService: FinancialService;

  constructor() {
    this.financialService = new FinancialService();
  }

  /**
   * Get financial dashboard data
   * GET /api/financial/dashboard
   */
  getFinancialDashboard = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Parse query parameters
      const { startDate, endDate, accountId, separateByCurrency } = req.query;

      const options: {
        startDate?: Date;
        endDate?: Date;
        accountId?: string;
        separateByCurrency?: boolean;
      } = {};
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);
      if (accountId) options.accountId = accountId as string;
      if (separateByCurrency) options.separateByCurrency = separateByCurrency === 'true';

      const dashboard = await this.financialService.getFinancialDashboard(
        userId,
        options
      );

      res.status(200).json({
        success: true,
        data: dashboard,
      });

      logger.info('Financial dashboard accessed via API', { userId });
    } catch (error) {
      logger.error('Error in getFinancialDashboard controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Generate financial report
   * POST /api/financial/reports
   */
  generateFinancialReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      console.log('Request body received:', req.body);
      console.log('Granularity received:', req.body.granularity);
      
      const {
        reportType,
        startDate,
        endDate,
        includeCategories,
        includeTrends,
        includeProjections,
        separateByCurrency,
        granularity,
      } = req.body;

      if (!reportType) {
        res.status(400).json({
          success: false,
          message: 'Report type is required',
        });
        return;
      }

      const options = {
        reportType,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        includeCategories: includeCategories !== false,
        includeTrends: includeTrends !== false,
        includeProjections: includeProjections === true,
        separateByCurrency: separateByCurrency === true,
        granularity: granularity || 'auto',
      };

      console.log('Options being passed to service:', options);

      const report = await this.financialService.generateFinancialReport(
        userId,
        options
      );

      res.status(200).json({
        success: true,
        message: 'Financial report generated successfully',
        data: report,
      });

      logger.info('Financial report generated via API', {
        userId,
        reportType,
        period: { start: options.startDate, end: options.endDate },
        separateByCurrency: options.separateByCurrency,
      });
    } catch (error) {
      logger.error('Error in generateFinancialReport controller', {
        error: String(error),
        userId: req.user?.userId,
        body: req.body,
      });

      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Get budget analysis
   * GET /api/financial/budget-analysis
   */
  getBudgetAnalysis = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Parse query parameters
      const { startDate, endDate, categoryId } = req.query;

      const options: {
        startDate?: Date;
        endDate?: Date;
        categoryId?: string;
      } = {};
      if (startDate) options.startDate = new Date(startDate as string);
      if (endDate) options.endDate = new Date(endDate as string);
      if (categoryId) options.categoryId = categoryId as string;

      const analysis = await this.financialService.getBudgetAnalysis(
        userId,
        options
      );

      res.status(200).json({
        success: true,
        data: analysis,
      });

      logger.info('Budget analysis accessed via API', { userId });
    } catch (error) {
      logger.error('Error in getBudgetAnalysis controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Get financial insights
   * GET /api/financial/insights
   */
  getFinancialInsights = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Parse query parameters
      const { period, includePredictions } = req.query;

      const options = {
        period: ((period as string) || 'month') as
          | 'month'
          | 'year'
          | 'week'
          | 'quarter',
        includePredictions: includePredictions === 'true',
      };

      const insights = await this.financialService.getFinancialInsights(
        userId,
        options
      );

      res.status(200).json({
        success: true,
        data: insights,
      });

      logger.info('Financial insights accessed via API', {
        userId,
        period: options.period,
      });
    } catch (error) {
      logger.error('Error in getFinancialInsights controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Export financial data
   * POST /api/financial/export
   */
  exportFinancialData = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        format,
        startDate,
        endDate,
        includeCategories,
        includeTransactions,
        includeStats,
      } = req.body;

      if (!format || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Format, start date, and end date are required',
        });
        return;
      }

      if (!['csv', 'json', 'pdf'].includes(format)) {
        res.status(400).json({
          success: false,
          message:
            'Unsupported export format. Supported formats: csv, json, pdf',
        });
        return;
      }

      const options = {
        format,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        includeCategories: includeCategories !== false,
        includeTransactions: includeTransactions !== false,
        includeStats: includeStats !== false,
      };

      const exportResult = await this.financialService.exportFinancialData(
        userId,
        options
      );

      res.status(200).json({
        success: true,
        message: 'Financial data exported successfully',
        data: exportResult,
      });

      logger.info('Financial data exported via API', {
        userId,
        format,
        filename: exportResult.filename,
      });
    } catch (error) {
      logger.error('Error in exportFinancialData controller', {
        error: String(error),
        userId: req.user?.userId,
        body: req.body,
      });

      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Get financial summary
   * GET /api/financial/summary
   */
  getFinancialSummary = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Parse query parameters
      const { period } = req.query;
      const periodValue = (period as string) || 'month';
      const typedPeriod = periodValue as 'month' | 'year' | 'week' | 'quarter';

      // Get insights for the period
      const insights = await this.financialService.getFinancialInsights(
        userId,
        {
          period: typedPeriod,
          includePredictions: false,
        }
      );

      // Get basic stats for the period - we need to access transactionService directly
      const { startDate, endDate } = this.calculatePeriodDateRange(periodValue);
      // Since transactionService is private, we'll need to get stats through the dashboard method
      const dashboardData = await this.financialService.getFinancialDashboard(
        userId,
        {
          startDate,
          endDate,
          separateByCurrency: false, // Ensure we get single dashboard format
        }
      );

      // Type guard to ensure we have the single dashboard format
      if ('overview' in dashboardData) {
        const singleDashboard = dashboardData as {
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
        };

        const summary = {
          period: periodValue,
          overview: {
            totalIncome: singleDashboard.overview.monthlyIncome,
            totalExpenses: singleDashboard.overview.monthlyExpenses,
            netAmount: singleDashboard.overview.monthlyNet,
            transactionCount: singleDashboard.recentTransactions.length,
          },
          topInsights: insights.insights.slice(0, 3),
          topCategories: singleDashboard.topCategories,
        };

        res.status(200).json({
          success: true,
          data: summary,
        });
      } else {
        // Handle currency-separated format (should not happen with separateByCurrency: false)
        res.status(500).json({
          success: false,
          message: 'Unexpected data format received',
        });
        return;
      }

      logger.info('Financial summary accessed via API', {
        userId,
        period: periodValue,
      });
    } catch (error) {
      logger.error('Error in getFinancialSummary controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Private helper method to calculate period date range
   */
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
}

export default FinancialController;
