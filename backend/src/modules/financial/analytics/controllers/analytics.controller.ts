import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { logger } from '../../../../shared/services/logger.service';
import { validateAnalyticsQuery } from '../validation/analytics.validation';

// Extend the Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Get comprehensive spending analysis
   * GET /api/analytics/spending
   */
  getSpendingAnalysis = async (
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

      // Parse and validate query parameters
      const { error, value } = validateAnalyticsQuery(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.details.map((detail: any) => detail.message),
        });
        return;
      }

      const query = {
        ...value,
        userId,
        startDate: new Date(value.startDate),
        endDate: new Date(value.endDate),
      };

      const analysis = await this.analyticsService.getSpendingAnalysis(query);

      res.status(200).json({
        success: true,
        data: analysis,
      });

      logger.info('Spending analysis accessed via API', { userId, query: value });
    } catch (error) {
      logger.error('Error in getSpendingAnalysis controller', {
        error: String(error),
        userId: req.user?.userId,
        query: req.query,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Get budget analytics for a specific budget
   * GET /api/analytics/budgets/:budgetId
   */
  getBudgetAnalytics = async (
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

      const { budgetId } = req.params;
      const { startDate, endDate } = req.query;

      if (!budgetId) {
        res.status(400).json({
          success: false,
          message: 'Budget ID is required',
        });
        return;
      }

      // Set default date range to current month if not provided
      const now = new Date();
      const defaultStartDate = startDate ? new Date(startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = endDate ? new Date(endDate as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const analytics = await this.analyticsService.getBudgetAnalytics(
        userId,
        budgetId,
        defaultStartDate,
        defaultEndDate
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });

      logger.info('Budget analytics accessed via API', { userId, budgetId, dateRange: { start: defaultStartDate, end: defaultEndDate } });
    } catch (error) {
      logger.error('Error in getBudgetAnalytics controller', {
        error: String(error),
        userId: req.user?.userId,
        budgetId: req.params.budgetId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Get all budget analytics for a user
   * GET /api/analytics/budgets
   */
  getAllBudgetAnalytics = async (
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

      const { startDate, endDate } = req.query;

      // Set default date range to current month if not provided
      const now = new Date();
      const defaultStartDate = startDate ? new Date(startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = endDate ? new Date(endDate as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const analytics = await this.analyticsService.getAllBudgetAnalytics(
        userId,
        defaultStartDate,
        defaultEndDate
      );

      res.status(200).json({
        success: true,
        data: analytics,
      });

      logger.info('All budget analytics accessed via API', { userId, dateRange: { start: defaultStartDate, end: defaultEndDate } });
    } catch (error) {
      logger.error('Error in getAllBudgetAnalytics controller', {
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
   * Get financial insights and recommendations
   * GET /api/analytics/insights
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

      const { startDate, endDate } = req.query;

      // Set default date range to current month if not provided
      const now = new Date();
      const defaultStartDate = startDate ? new Date(startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = endDate ? new Date(endDate as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const insights = await this.analyticsService.getFinancialInsights(
        userId,
        defaultStartDate,
        defaultEndDate
      );

      res.status(200).json({
        success: true,
        data: insights,
      });

      logger.info('Financial insights accessed via API', { userId, dateRange: { start: defaultStartDate, end: defaultEndDate } });
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
   * Get cash flow analysis
   * GET /api/analytics/cashflow
   */
  getCashFlowAnalysis = async (
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

      const { startDate, endDate, groupBy } = req.query;

      // Set default date range to current month if not provided
      const now = new Date();
      const defaultStartDate = startDate ? new Date(startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = endDate ? new Date(endDate as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const defaultGroupBy = (groupBy as 'day' | 'week' | 'month') || 'month';

      const cashFlow = await this.analyticsService.getCashFlowAnalysis(
        userId,
        defaultStartDate,
        defaultEndDate,
        defaultGroupBy
      );

      res.status(200).json({
        success: true,
        data: cashFlow,
      });

      logger.info('Cash flow analysis accessed via API', { 
        userId, 
        dateRange: { start: defaultStartDate, end: defaultEndDate },
        groupBy: defaultGroupBy 
      });
    } catch (error) {
      logger.error('Error in getCashFlowAnalysis controller', {
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
   * Get period comparison analysis
   * POST /api/analytics/compare
   */
  getPeriodComparison = async (
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

      const { currentStart, currentEnd, previousStart, previousEnd } = req.body;

      if (!currentStart || !currentEnd || !previousStart || !previousEnd) {
        res.status(400).json({
          success: false,
          message: 'All date parameters are required: currentStart, currentEnd, previousStart, previousEnd',
        });
        return;
      }

      const comparison = await this.analyticsService.getPeriodComparison(
        userId,
        new Date(currentStart),
        new Date(currentEnd),
        new Date(previousStart),
        new Date(previousEnd)
      );

      res.status(200).json({
        success: true,
        data: comparison,
      });

      logger.info('Period comparison accessed via API', { 
        userId, 
        currentPeriod: { start: currentStart, end: currentEnd },
        previousPeriod: { start: previousStart, end: previousEnd }
      });
    } catch (error) {
      logger.error('Error in getPeriodComparison controller', {
        error: String(error),
        userId: req.user?.userId,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Get category performance analysis
   * GET /api/analytics/categories/performance
   */
  getCategoryPerformance = async (
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

      const { startDate, endDate } = req.query;

      // Set default date range to current month if not provided
      const now = new Date();
      const defaultStartDate = startDate ? new Date(startDate as string) : new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = endDate ? new Date(endDate as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const performance = await this.analyticsService.getCategoryPerformance(
        userId,
        defaultStartDate,
        defaultEndDate
      );

      res.status(200).json({
        success: true,
        data: performance,
      });

      logger.info('Category performance accessed via API', { userId, dateRange: { start: defaultStartDate, end: defaultEndDate } });
    } catch (error) {
      logger.error('Error in getCategoryPerformance controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}