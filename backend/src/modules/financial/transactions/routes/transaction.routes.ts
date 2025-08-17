import { Router, Request, Response, NextFunction } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticateToken } from '../../../auth/auth.middleware';
import { validateRequest } from '../../../../shared/middleware/validation.middleware';
import { transactionValidation } from '../validators/transaction.validation';

const router = Router();
const transactionController = new TransactionController();

// Helper function to wrap async controller methods
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// All transaction routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/transactions
 * @desc    Create a new transaction
 * @access  Private
 * @body    { title, amount, currency, type, categoryId, date, paymentMethod, ... }
 */
router.post(
  '/',
  validateRequest(transactionValidation.create),
  asyncHandler(transactionController.createTransaction)
);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions for the authenticated user
 * @access  Private
 * @query   { type?, status?, categoryId?, subcategoryId?, paymentMethod?, isRecurring?,
 *            source?, startDate?, endDate?, minAmount?, maxAmount?, search?, tags?,
 *            page?, limit?, sortBy?, sortOrder? }
 */
router.get(
  '/',
  validateRequest(transactionValidation.query, 'query'),
  asyncHandler(transactionController.getUserTransactions)
);

/**
 * @route   GET /api/transactions/stats
 * @desc    Get transaction statistics for the authenticated user
 * @access  Private
 * @query   { startDate?, endDate?, categoryId?, type? }
 */
router.get('/stats', asyncHandler(transactionController.getTransactionStats));

/**
 * @route   GET /api/transactions/recurring
 * @desc    Get all recurring transactions for the authenticated user
 * @access  Private
 */
router.get(
  '/recurring',
  asyncHandler(transactionController.getRecurringTransactions)
);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 * @params  { id }
 */
router.get('/:id', asyncHandler(transactionController.getTransactionById));

/**
 * @route   PUT /api/transactions/:id
 * @desc    Update transaction by ID
 * @access  Private
 * @params  { id }
 * @body    { title?, amount?, currency?, type?, categoryId?, date?, paymentMethod?, ... }
 */
router.put(
  '/:id',
  validateRequest(transactionValidation.update),
  asyncHandler(transactionController.updateTransaction)
);

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Delete transaction by ID (soft delete)
 * @access  Private
 * @params  { id }
 */
router.delete('/:id', asyncHandler(transactionController.deleteTransaction));

/**
 * @route   POST /api/transactions/bulk
 * @desc    Bulk create transactions
 * @access  Private
 * @body    { transactions: [{ title, amount, currency, type, categoryId, date, paymentMethod, ... }] }
 */
router.post(
  '/bulk',
  validateRequest(transactionValidation.bulk),
  asyncHandler(transactionController.bulkCreateTransactions)
);

export default router;
