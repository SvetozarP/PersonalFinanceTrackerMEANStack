import { Router, Request, Response, NextFunction } from 'express';
import { FinancialController } from './financial.controller';
import { authenticateToken } from '../auth/auth.middleware';

const router = Router();
const financialController = new FinancialController();

// Helper function to wrap async controller methods
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// All financial routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/financial/dashboard
 * @desc    Get comprehensive financial dashboard data
 * @access  Private
 * @query   { startDate?, endDate?, accountId? }
 */
router.get(
  '/dashboard',
  asyncHandler(financialController.getFinancialDashboard)
);

/**
 * @route   POST /api/financial/reports
 * @desc    Generate comprehensive financial reports
 * @access  Private
 * @body    { reportType, startDate?, endDate?, includeCategories?, includeTrends?, includeProjections? }
 */
router.post(
  '/reports',
  asyncHandler(financialController.generateFinancialReport)
);

/**
 * @route   GET /api/financial/budget-analysis
 * @desc    Get budget analysis and recommendations
 * @access  Private
 * @query   { startDate?, endDate?, categoryId? }
 */
router.get(
  '/budget-analysis',
  asyncHandler(financialController.getBudgetAnalysis)
);

/**
 * @route   GET /api/financial/insights
 * @desc    Get financial insights and trends
 * @access  Private
 * @query   { period?, includePredictions? }
 */
router.get('/insights', asyncHandler(financialController.getFinancialInsights));

/**
 * @route   POST /api/financial/export
 * @desc    Export financial data in various formats
 * @access  Private
 * @body    { format, startDate, endDate, includeCategories?, includeTransactions?, includeStats? }
 */
router.post('/export', asyncHandler(financialController.exportFinancialData));

/**
 * @route   GET /api/financial/summary
 * @desc    Get financial summary for a specific period
 * @access  Private
 * @query   { period? }
 */
router.get('/summary', asyncHandler(financialController.getFinancialSummary));

export default router;
