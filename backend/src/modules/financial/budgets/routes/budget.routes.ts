import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { BudgetService } from '../services/budget.service';
import { BudgetRepository } from '../repositories/budget.repository';
import { TransactionRepository } from '../../transactions/repositories/transaction.repository';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import { authenticateToken } from '../../../auth/auth.middleware';

const router = Router();

// Initialize dependencies
const budgetRepository = new BudgetRepository();
const transactionRepository = new TransactionRepository();
const categoryRepository = new CategoryRepository();
const budgetService = new BudgetService(
  budgetRepository,
  transactionRepository,
  categoryRepository
);
const budgetController = new BudgetController(budgetService);

// Apply authentication middleware to all budget routes
router.use(authenticateToken);

/**
 * @route   POST /api/budgets
 * @desc    Create a new budget
 * @access  Private
 */
router.post('/', (req, res) => budgetController.createBudget(req, res));

/**
 * @route   GET /api/budgets
 * @desc    Get budgets with filters and pagination
 * @access  Private
 */
router.get('/', (req, res) => budgetController.getBudgets(req, res));

/**
 * @route   GET /api/budgets/summary
 * @desc    Get budget summary for user
 * @access  Private
 */
router.get('/summary', (req, res) =>
  budgetController.getBudgetSummary(req, res)
);

/**
 * @route   GET /api/budgets/statistics
 * @desc    Get budget statistics
 * @access  Private
 */
router.get('/statistics', (req, res) =>
  budgetController.getBudgetStatistics(req, res)
);

/**
 * @route   GET /api/budgets/alerts
 * @desc    Check budget alerts
 * @access  Private
 */
router.get('/alerts', (req, res) =>
  budgetController.checkBudgetAlerts(req, res)
);

/**
 * @route   GET /api/budgets/:id
 * @desc    Get budget by ID with full analytics
 * @access  Private
 */
router.get('/:id', (req, res) => budgetController.getBudgetById(req, res));

/**
 * @route   PUT /api/budgets/:id
 * @desc    Update budget
 * @access  Private
 */
router.put('/:id', (req, res) => budgetController.updateBudget(req, res));

/**
 * @route   DELETE /api/budgets/:id
 * @desc    Delete budget
 * @access  Private
 */
router.delete('/:id', (req, res) => budgetController.deleteBudget(req, res));

/**
 * @route   PATCH /api/budgets/:id/categories/:categoryId
 * @desc    Update category allocation for a budget
 * @access  Private
 */
router.patch('/:id/categories/:categoryId', (req, res) =>
  budgetController.updateCategoryAllocation(req, res)
);

export default router;
