import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { PredictiveAnalyticsService } from '../services/predictive-analytics.service';
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
  private predictiveAnalyticsService: PredictiveAnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.predictiveAnalyticsService = new PredictiveAnalyticsService();
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

  // ==================== BUDGET REPORTING ENDPOINTS ====================

  /**
   * Get comprehensive budget performance report
   * GET /api/analytics/budgets/:budgetId/performance
   */
  getBudgetPerformanceReport = async (
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

      const report = await this.analyticsService.getBudgetPerformanceReport(
        userId,
        budgetId,
        defaultStartDate,
        defaultEndDate
      );

      res.status(200).json({
        success: true,
        data: report,
      });

      logger.info('Budget performance report accessed via API', { userId, budgetId, dateRange: { start: defaultStartDate, end: defaultEndDate } });
    } catch (error) {
      logger.error('Error in getBudgetPerformanceReport controller', {
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
   * Get budget vs actual spending comparison report
   * GET /api/analytics/budgets/:budgetId/vs-actual
   */
  getBudgetVsActualReport = async (
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

      const report = await this.analyticsService.getBudgetVsActualReport(
        userId,
        budgetId,
        defaultStartDate,
        defaultEndDate
      );

      res.status(200).json({
        success: true,
        data: report,
      });

      logger.info('Budget vs actual report accessed via API', { userId, budgetId, dateRange: { start: defaultStartDate, end: defaultEndDate } });
    } catch (error) {
      logger.error('Error in getBudgetVsActualReport controller', {
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
   * Get budget trend analysis over time
   * GET /api/analytics/budgets/:budgetId/trends
   */
  getBudgetTrendAnalysis = async (
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

      // Set default date range to last 6 months if not provided
      const now = new Date();
      const defaultStartDate = startDate ? new Date(startDate as string) : new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const defaultEndDate = endDate ? new Date(endDate as string) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const analysis = await this.analyticsService.getBudgetTrendAnalysis(
        userId,
        budgetId,
        defaultStartDate,
        defaultEndDate
      );

      res.status(200).json({
        success: true,
        data: analysis,
      });

      logger.info('Budget trend analysis accessed via API', { userId, budgetId, dateRange: { start: defaultStartDate, end: defaultEndDate } });
    } catch (error) {
      logger.error('Error in getBudgetTrendAnalysis controller', {
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
   * Get budget variance analysis
   * GET /api/analytics/budgets/:budgetId/variance
   */
  getBudgetVarianceAnalysis = async (
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

      const analysis = await this.analyticsService.getBudgetVarianceAnalysis(
        userId,
        budgetId,
        defaultStartDate,
        defaultEndDate
      );

      res.status(200).json({
        success: true,
        data: analysis,
      });

      logger.info('Budget variance analysis accessed via API', { userId, budgetId, dateRange: { start: defaultStartDate, end: defaultEndDate } });
    } catch (error) {
      logger.error('Error in getBudgetVarianceAnalysis controller', {
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
   * Get budget forecasting and projections
   * GET /api/analytics/budgets/:budgetId/forecast
   */
  getBudgetForecast = async (
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
      const { forecastStartDate, forecastEndDate } = req.query;

      if (!budgetId) {
        res.status(400).json({
          success: false,
          message: 'Budget ID is required',
        });
        return;
      }

      // Set default forecast period to next month if not provided
      const now = new Date();
      const defaultForecastStartDate = forecastStartDate ? new Date(forecastStartDate as string) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const defaultForecastEndDate = forecastEndDate ? new Date(forecastEndDate as string) : new Date(now.getFullYear(), now.getMonth() + 2, 0);

      const forecast = await this.analyticsService.getBudgetForecast(
        userId,
        budgetId,
        defaultForecastStartDate,
        defaultForecastEndDate
      );

      res.status(200).json({
        success: true,
        data: forecast,
      });

      logger.info('Budget forecast accessed via API', { userId, budgetId, forecastPeriod: { start: defaultForecastStartDate, end: defaultForecastEndDate } });
    } catch (error) {
      logger.error('Error in getBudgetForecast controller', {
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
   * Get budget category breakdown report
   * GET /api/analytics/budgets/:budgetId/breakdown
   */
  getBudgetCategoryBreakdown = async (
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

      const breakdown = await this.analyticsService.getBudgetCategoryBreakdown(
        userId,
        budgetId,
        defaultStartDate,
        defaultEndDate
      );

      res.status(200).json({
        success: true,
        data: breakdown,
      });

      logger.info('Budget category breakdown accessed via API', { userId, budgetId, dateRange: { start: defaultStartDate, end: defaultEndDate } });
    } catch (error) {
      logger.error('Error in getBudgetCategoryBreakdown controller', {
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
   * Get budget alerts and notifications
   * GET /api/analytics/budgets/alerts
   */
  getBudgetAlerts = async (
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

      const { budgetId } = req.query;

      const alerts = await this.analyticsService.getBudgetAlerts(
        userId,
        budgetId as string
      );

      res.status(200).json({
        success: true,
        data: alerts,
      });

      logger.info('Budget alerts accessed via API', { userId, budgetId, alertCount: alerts.length });
    } catch (error) {
      logger.error('Error in getBudgetAlerts controller', {
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
   * Export budget reports in various formats
   * GET /api/analytics/budgets/export
   */
  exportBudgetReport = async (
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
        startDate, 
        endDate, 
        format, 
        reportType, 
        includeCharts, 
        includeDetails, 
        budgetIds, 
        categories 
      } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
        return;
      }

      const exportOptions = {
        format: ((format as string) || 'json') as 'json' | 'csv' | 'pdf' | 'excel',
        reportType: ((reportType as string) || 'all') as 'performance' | 'variance' | 'trend' | 'forecast' | 'breakdown' | 'all',
        includeCharts: includeCharts === 'true',
        includeDetails: includeDetails !== 'false',
        dateRange: {
          startDate: new Date(startDate as string),
          endDate: new Date(endDate as string),
        },
        budgetIds: budgetIds ? (budgetIds as string).split(',') : undefined,
        categories: categories ? (categories as string).split(',') : undefined,
      };

      const exportResult = await this.analyticsService.exportBudgetReport(
        userId,
        exportOptions
      );

      // Set appropriate headers for file download
      res.setHeader('Content-Type', exportResult.format);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);

      res.status(200).send(exportResult.data);

      logger.info('Budget report exported via API', { 
        userId, 
        format: exportOptions.format, 
        reportType: exportOptions.reportType,
        filename: exportResult.filename 
      });
    } catch (error) {
      logger.error('Error in exportBudgetReport controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  // ==================== PREDICTIVE ANALYTICS ENDPOINTS ====================

  /**
   * Get comprehensive predictive insights
   * GET /api/analytics/predictive/insights
   */
  getPredictiveInsights = async (
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
        startDate: value.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: value.endDate || new Date(),
      };

      const insights = await this.predictiveAnalyticsService.getPredictiveInsights(query);

      res.status(200).json({
        success: true,
        data: insights,
      });

      logger.info('Predictive insights accessed via API', { userId, insightCount: insights.summary.totalInsights });
    } catch (error) {
      logger.error('Error in getPredictiveInsights controller', {
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
   * Get spending prediction
   * GET /api/analytics/predictive/spending
   */
  getSpendingPrediction = async (
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
        startDate: value.startDate || new Date(),
        endDate: value.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const prediction = await this.predictiveAnalyticsService.getSpendingPrediction(query);

      res.status(200).json({
        success: true,
        data: prediction,
      });

      logger.info('Spending prediction accessed via API', { userId, confidence: prediction.confidence });
    } catch (error) {
      logger.error('Error in getSpendingPrediction controller', {
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
   * Get anomaly detection results
   * GET /api/analytics/predictive/anomalies
   */
  getAnomalyDetection = async (
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
        startDate: value.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: value.endDate || new Date(),
      };

      const anomalies = await this.predictiveAnalyticsService.getAnomalyDetection(query);

      res.status(200).json({
        success: true,
        data: anomalies,
      });

      logger.info('Anomaly detection accessed via API', { userId, anomalyCount: anomalies.summary.totalAnomalies });
    } catch (error) {
      logger.error('Error in getAnomalyDetection controller', {
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
   * Get financial forecast
   * GET /api/analytics/predictive/forecast
   */
  getFinancialForecast = async (
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
        startDate: value.startDate || new Date(),
        endDate: value.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };

      const forecast = await this.predictiveAnalyticsService.getFinancialForecast(query);

      res.status(200).json({
        success: true,
        data: forecast,
      });

      logger.info('Financial forecast accessed via API', { userId, confidence: forecast.baseScenario.confidence });
    } catch (error) {
      logger.error('Error in getFinancialForecast controller', {
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
   * Get cash flow prediction
   * GET /api/analytics/predictive/cashflow
   */
  getCashFlowPrediction = async (
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
        startDate: value.startDate || new Date(),
        endDate: value.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };

      const prediction = await this.predictiveAnalyticsService.getCashFlowPrediction(query);

      res.status(200).json({
        success: true,
        data: prediction,
      });

      logger.info('Cash flow prediction accessed via API', { userId, confidence: prediction.predictions.confidence });
    } catch (error) {
      logger.error('Error in getCashFlowPrediction controller', {
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
   * Get trend analysis
   * GET /api/analytics/predictive/trends
   */
  getTrendAnalysis = async (
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
        startDate: value.startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: value.endDate || new Date(),
      };

      const trends = await this.predictiveAnalyticsService.getTrendAnalysis(query);

      res.status(200).json({
        success: true,
        data: trends,
      });

      logger.info('Trend analysis accessed via API', { userId, categoryCount: trends.categoryTrends.length });
    } catch (error) {
      logger.error('Error in getTrendAnalysis controller', {
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
   * Train a predictive model
   * POST /api/analytics/predictive/train
   */
  trainModel = async (
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

      const { modelType, parameters } = req.body;

      if (!modelType) {
        res.status(400).json({
          success: false,
          message: 'Model type is required',
        });
        return;
      }

      const model = await this.predictiveAnalyticsService.trainModel(userId, modelType, parameters || {});

      res.status(200).json({
        success: true,
        data: model,
      });

      logger.info('Model training completed via API', { userId, modelType, modelId: model.id });
    } catch (error) {
      logger.error('Error in trainModel controller', {
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