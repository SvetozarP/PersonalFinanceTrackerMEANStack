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
import financialPlanningRoutes from './financial-planning.routes';
import dataExportRoutes from './data-export.routes';
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
 * @route   POST /api/analytics/reports/generate
 * @desc    Generate comprehensive financial reports in multiple formats
 * @access  Private
 * @body    format, reportType, startDate, endDate, includeCharts, includeInsights, includeRecommendations
 */
router.post(
  '/reports/generate',
  validateRequest(Joi.object({
    format: Joi.string().valid('pdf', 'excel', 'csv', 'json').default('pdf'),
    reportType: Joi.string().valid('spending', 'budgets', 'cashflow', 'comprehensive').default('comprehensive'),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    includeCharts: Joi.boolean().default(false),
    includeInsights: Joi.boolean().default(true),
    includeRecommendations: Joi.boolean().default(true),
  }), 'body'),
  analyticsController.generateFinancialReport
);

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data in various formats (legacy endpoint)
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

      // Convert legacy format to new format
      const reportType = type === 'all' ? 'comprehensive' : type;
      const newFormat = format === 'json' ? 'json' : format;

      const options = {
        format: newFormat,
        reportType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        includeCharts: false,
        includeInsights: true,
        includeRecommendations: true
      };

      const reportResult = await analyticsService.generateFinancialReport(userId, options);

      // Set appropriate headers for file download
      res.setHeader('Content-Type', reportResult.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${reportResult.filename}"`);
      res.setHeader('Content-Length', reportResult.size);

      res.status(200).send(reportResult.data);
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

// ==================== PREDICTIVE ANALYTICS ROUTES ====================

/**
 * @route   GET /api/analytics/predictive/insights
 * @desc    Get comprehensive predictive insights
 * @access  Private
 * @query   startDate, endDate, categories, transactionTypes, accounts, includeRecurring, confidenceThreshold, modelType, algorithm
 */
router.get(
  '/predictive/insights',
  validateRequest(analyticsQuerySchema, 'query'),
  analyticsController.getPredictiveInsights
);

/**
 * @route   GET /api/analytics/predictive/spending
 * @desc    Get spending prediction
 * @access  Private
 * @query   startDate, endDate, categories, transactionTypes, accounts, includeRecurring, confidenceThreshold, modelType, algorithm
 */
router.get(
  '/predictive/spending',
  validateRequest(analyticsQuerySchema, 'query'),
  analyticsController.getSpendingPrediction
);

/**
 * @route   GET /api/analytics/predictive/anomalies
 * @desc    Get anomaly detection results
 * @access  Private
 * @query   startDate, endDate, categories, transactionTypes, accounts, includeRecurring, confidenceThreshold, modelType, algorithm
 */
router.get(
  '/predictive/anomalies',
  validateRequest(analyticsQuerySchema, 'query'),
  analyticsController.getAnomalyDetection
);

/**
 * @route   GET /api/analytics/predictive/forecast
 * @desc    Get financial forecast
 * @access  Private
 * @query   startDate, endDate, categories, transactionTypes, accounts, includeRecurring, confidenceThreshold, modelType, algorithm
 */
router.get(
  '/predictive/forecast',
  validateRequest(analyticsQuerySchema, 'query'),
  analyticsController.getFinancialForecast
);

/**
 * @route   GET /api/analytics/predictive/cashflow
 * @desc    Get cash flow prediction
 * @access  Private
 * @query   startDate, endDate, categories, transactionTypes, accounts, includeRecurring, confidenceThreshold, modelType, algorithm
 */
router.get(
  '/predictive/cashflow',
  validateRequest(analyticsQuerySchema, 'query'),
  analyticsController.getCashFlowPrediction
);

/**
 * @route   GET /api/analytics/predictive/trends
 * @desc    Get trend analysis
 * @access  Private
 * @query   startDate, endDate, categories, transactionTypes, accounts, includeRecurring, confidenceThreshold, modelType, algorithm
 */
router.get(
  '/predictive/trends',
  validateRequest(analyticsQuerySchema, 'query'),
  analyticsController.getTrendAnalysis
);

/**
 * @route   POST /api/analytics/predictive/train
 * @desc    Train a predictive model
 * @access  Private
 * @body    modelType, parameters
 */
router.post(
  '/predictive/train',
  validateRequest(Joi.object({
    modelType: Joi.string().valid('spending_prediction', 'anomaly_detection', 'forecasting', 'trend_analysis', 'budget_prediction').required(),
    parameters: Joi.object().optional(),
  }), 'body'),
  analyticsController.trainModel
);

// ==================== FINANCIAL PLANNING ROUTES ====================

/**
 * @route   /api/analytics/planning/*
 * @desc    Financial planning tools and interactive features
 * @access  Private
 */
router.use('/planning', financialPlanningRoutes);

/**
 * @route   /api/analytics/export/*
 * @desc    Data export functionality
 * @access  Private
 */
router.use('/export', dataExportRoutes);

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