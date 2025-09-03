import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { AnalyticsService } from '../services/analytics.service';
import { authenticateToken } from '../../../auth/auth.middleware';
import { validateRequest } from '../../../../shared/middleware/validation.middleware';
import { 
  analyticsQuerySchema, 
  periodComparisonSchema, 
  dateRangeSchema, 
  cashFlowQuerySchema 
} from '../validation/analytics.validation';
import Joi from 'joi';

const router = Router();
const analyticsController = new AnalyticsController();
const analyticsService = new AnalyticsService();

// Apply authentication middleware to all analytics routes
router.use(authenticateToken);

/**
 * @route   GET /api/analytics/spending
 * @desc    Get comprehensive spending analysis
 * @access  Private
 * @query   startDate, endDate, groupBy, categories, transactionTypes, accounts, tags, minAmount, maxAmount, includeRecurring, includePending
 */
router.get(
  '/spending',
  validateRequest(analyticsQuerySchema, 'query'),
  analyticsController.getSpendingAnalysis
);

/**
 * @route   GET /api/analytics/budgets
 * @desc    Get analytics for all user budgets
 * @access  Private
 * @query   startDate, endDate
 */
router.get(
  '/budgets',
  validateRequest(dateRangeSchema, 'query'),
  analyticsController.getAllBudgetAnalytics
);

/**
 * @route   GET /api/analytics/budgets/:budgetId
 * @desc    Get analytics for a specific budget
 * @access  Private
 * @param   budgetId - Budget ID
 * @query   startDate, endDate
 */
router.get(
  '/budgets/:budgetId',
  validateRequest(dateRangeSchema, 'query'),
  analyticsController.getBudgetAnalytics
);

/**
 * @route   GET /api/analytics/insights
 * @desc    Get financial insights and recommendations
 * @access  Private
 * @query   startDate, endDate
 */
router.get(
  '/insights',
  validateRequest(dateRangeSchema, 'query'),
  analyticsController.getFinancialInsights
);

/**
 * @route   GET /api/analytics/cashflow
 * @desc    Get cash flow analysis
 * @access  Private
 * @query   startDate, endDate, groupBy
 */
router.get(
  '/cashflow',
  validateRequest(cashFlowQuerySchema, 'query'),
  analyticsController.getCashFlowAnalysis
);

/**
 * @route   POST /api/analytics/compare
 * @desc    Get period comparison analysis
 * @access  Private
 * @body    { currentStart, currentEnd, previousStart, previousEnd }
 */
router.post(
  '/compare',
  validateRequest(periodComparisonSchema, 'body'),
  analyticsController.getPeriodComparison
);

/**
 * @route   GET /api/analytics/categories/performance
 * @desc    Get category performance analysis
 * @access  Private
 * @query   startDate, endDate
 */
router.get(
  '/categories/performance',
  validateRequest(dateRangeSchema, 'query'),
  analyticsController.getCategoryPerformance
);

/**
 * @route   GET /api/analytics/summary
 * @desc    Get comprehensive analytics summary (combines multiple endpoints)
 * @access  Private
 * @query   startDate, endDate, includeSpending, includeBudgets, includeInsights
 */
router.get(
  '/summary',
  validateRequest(Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
    includeSpending: Joi.boolean().default(true),
    includeBudgets: Joi.boolean().default(true),
    includeInsights: Joi.boolean().default(true),
  }), 'query'),
  async (req: any, res: any) => {
    try {
      const userId = req.user?.userId;
      const { startDate, endDate, includeSpending, includeBudgets, includeInsights } = req.query;

      // Set default date range to current month if not provided
      const now = new Date();
      const defaultStartDate = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      const defaultEndDate = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const summary: any = {};

      // Get spending analysis if requested
      if (includeSpending !== 'false') {
        summary.spending = await analyticsService.getSpendingAnalysis({
          userId,
          startDate: defaultStartDate,
          endDate: defaultEndDate,
          groupBy: 'month',
        });
      }

      // Get budget analytics if requested
      if (includeBudgets !== 'false') {
        summary.budgets = await analyticsService.getAllBudgetAnalytics(
          userId,
          defaultStartDate,
          defaultEndDate
        );
      }

      // Get financial insights if requested
      if (includeInsights !== 'false') {
        summary.insights = await analyticsService.getFinancialInsights(
          userId,
          defaultStartDate,
          defaultEndDate
        );
      }

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data in various formats
 * @access  Private
 * @query   startDate, endDate, format, type
 */
router.get(
  '/export',
  validateRequest(Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    format: Joi.string().valid('json', 'csv', 'pdf').default('json'),
    type: Joi.string().valid('spending', 'budgets', 'cashflow', 'all').default('all'),
  }), 'query'),
  async (req: any, res: any) => {
    try {
      const userId = req.user?.userId;
      const { startDate, endDate, format, type } = req.query;

      // This would be implemented in a future phase
      // For now, return a placeholder response
      res.status(200).json({
        success: true,
        message: 'Export functionality will be implemented in Phase 5',
        data: {
          exportType: type,
          format,
          dateRange: { startDate, endDate },
          status: 'not_implemented',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// ==================== BUDGET REPORTING ROUTES ====================

/**
 * @route   GET /api/analytics/budgets/:budgetId/performance
 * @desc    Get comprehensive budget performance report
 * @access  Private
 * @param   budgetId - Budget ID
 * @query   startDate, endDate
 */
router.get(
  '/budgets/:budgetId/performance',
  validateRequest(Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }), 'query'),
  analyticsController.getBudgetPerformanceReport
);

/**
 * @route   GET /api/analytics/budgets/:budgetId/vs-actual
 * @desc    Get budget vs actual spending comparison report
 * @access  Private
 * @param   budgetId - Budget ID
 * @query   startDate, endDate
 */
router.get(
  '/budgets/:budgetId/vs-actual',
  validateRequest(Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }), 'query'),
  analyticsController.getBudgetVsActualReport
);

/**
 * @route   GET /api/analytics/budgets/:budgetId/trends
 * @desc    Get budget trend analysis over time
 * @access  Private
 * @param   budgetId - Budget ID
 * @query   startDate, endDate
 */
router.get(
  '/budgets/:budgetId/trends',
  validateRequest(Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }), 'query'),
  analyticsController.getBudgetTrendAnalysis
);

/**
 * @route   GET /api/analytics/budgets/:budgetId/variance
 * @desc    Get budget variance analysis
 * @access  Private
 * @param   budgetId - Budget ID
 * @query   startDate, endDate
 */
router.get(
  '/budgets/:budgetId/variance',
  validateRequest(Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }), 'query'),
  analyticsController.getBudgetVarianceAnalysis
);

/**
 * @route   GET /api/analytics/budgets/:budgetId/forecast
 * @desc    Get budget forecasting and projections
 * @access  Private
 * @param   budgetId - Budget ID
 * @query   forecastStartDate, forecastEndDate
 */
router.get(
  '/budgets/:budgetId/forecast',
  validateRequest(Joi.object({
    forecastStartDate: Joi.date().iso().optional(),
    forecastEndDate: Joi.date().iso().min(Joi.ref('forecastStartDate')).optional(),
  }), 'query'),
  analyticsController.getBudgetForecast
);

/**
 * @route   GET /api/analytics/budgets/:budgetId/breakdown
 * @desc    Get budget category breakdown report
 * @access  Private
 * @param   budgetId - Budget ID
 * @query   startDate, endDate
 */
router.get(
  '/budgets/:budgetId/breakdown',
  validateRequest(Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }), 'query'),
  analyticsController.getBudgetCategoryBreakdown
);

/**
 * @route   GET /api/analytics/budgets/alerts
 * @desc    Get budget alerts and notifications
 * @access  Private
 * @query   budgetId (optional)
 */
router.get(
  '/budgets/alerts',
  validateRequest(Joi.object({
    budgetId: Joi.string().optional(),
  }), 'query'),
  analyticsController.getBudgetAlerts
);

/**
 * @route   GET /api/analytics/budgets/export
 * @desc    Export budget reports in various formats
 * @access  Private
 * @query   startDate, endDate, format, reportType, includeCharts, includeDetails, budgetIds, categories
 */
router.get(
  '/budgets/export',
  validateRequest(Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    format: Joi.string().valid('json', 'csv', 'pdf', 'excel').default('json'),
    reportType: Joi.string().valid('performance', 'variance', 'trend', 'forecast', 'breakdown', 'all').default('all'),
    includeCharts: Joi.boolean().default(false),
    includeDetails: Joi.boolean().default(true),
    budgetIds: Joi.string().optional(),
    categories: Joi.string().optional(),
  }), 'query'),
  analyticsController.exportBudgetReport
);

/**
 * @route   GET /api/analytics/health
 * @desc    Health check endpoint for analytics service
 * @access  Private
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Analytics service is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;