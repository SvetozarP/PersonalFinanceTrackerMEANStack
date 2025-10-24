import { Router } from 'express';
import { DataExportController } from '../controllers/data-export.controller';
import { authenticateToken } from '../../../auth/auth.middleware';
import { validateRequest } from '../../../../shared/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const dataExportController = new DataExportController();

// Apply authentication middleware to all export routes
router.use(authenticateToken);

/**
 * @route   POST /api/analytics/export/data
 * @desc    Export all financial data
 * @access  Private
 * @body    format, dataTypes, startDate, endDate, includeMetadata, groupBy, filters
 */
router.post(
  '/data',
  validateRequest(Joi.object({
    format: Joi.string().valid('excel', 'csv', 'json').default('excel'),
    dataTypes: Joi.array().items(
      Joi.string().valid('transactions', 'categories', 'budgets', 'analytics', 'all')
    ).default(['all']),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    includeMetadata: Joi.boolean().default(true),
    groupBy: Joi.string().valid('day', 'week', 'month', 'quarter', 'year').default('month'),
    filters: Joi.object({
      categories: Joi.array().items(Joi.string()).optional(),
      transactionTypes: Joi.array().items(Joi.string()).optional(),
      accounts: Joi.array().items(Joi.string()).optional(),
      tags: Joi.array().items(Joi.string()).optional(),
      minAmount: Joi.number().optional(),
      maxAmount: Joi.number().optional()
    }).optional()
  }), 'body'),
  dataExportController.exportFinancialData
);

/**
 * @route   POST /api/analytics/export/transactions
 * @desc    Export transactions only
 * @access  Private
 * @body    format, startDate, endDate, includeMetadata, filters
 */
router.post(
  '/transactions',
  validateRequest(Joi.object({
    format: Joi.string().valid('excel', 'csv', 'json').default('excel'),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    includeMetadata: Joi.boolean().default(true),
    filters: Joi.object({
      categories: Joi.array().items(Joi.string()).optional(),
      transactionTypes: Joi.array().items(Joi.string()).optional(),
      accounts: Joi.array().items(Joi.string()).optional(),
      tags: Joi.array().items(Joi.string()).optional(),
      minAmount: Joi.number().optional(),
      maxAmount: Joi.number().optional()
    }).optional()
  }), 'body'),
  dataExportController.exportTransactions
);

/**
 * @route   POST /api/analytics/export/categories
 * @desc    Export categories only
 * @access  Private
 * @body    format, includeMetadata
 */
router.post(
  '/categories',
  validateRequest(Joi.object({
    format: Joi.string().valid('excel', 'csv', 'json').default('excel'),
    includeMetadata: Joi.boolean().default(true)
  }), 'body'),
  dataExportController.exportCategories
);

/**
 * @route   POST /api/analytics/export/budgets
 * @desc    Export budgets only
 * @access  Private
 * @body    format, startDate, endDate, includeMetadata
 */
router.post(
  '/budgets',
  validateRequest(Joi.object({
    format: Joi.string().valid('excel', 'csv', 'json').default('excel'),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    includeMetadata: Joi.boolean().default(true)
  }), 'body'),
  dataExportController.exportBudgets
);

/**
 * @route   POST /api/analytics/export/analytics
 * @desc    Export analytics only
 * @access  Private
 * @body    format, startDate, endDate, includeMetadata, groupBy
 */
router.post(
  '/analytics',
  validateRequest(Joi.object({
    format: Joi.string().valid('excel', 'csv', 'json').default('excel'),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    includeMetadata: Joi.boolean().default(true),
    groupBy: Joi.string().valid('day', 'week', 'month', 'quarter', 'year').default('month')
  }), 'body'),
  dataExportController.exportAnalytics
);

/**
 * @route   GET /api/analytics/export/status
 * @desc    Get export status and history
 * @access  Private
 */
router.get(
  '/status',
  dataExportController.getExportStatus
);

export default router;
