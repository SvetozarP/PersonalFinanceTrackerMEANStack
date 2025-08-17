import { Router, Request, Response, NextFunction } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticateToken } from '../../../auth/auth.middleware';
import { validateRequest } from '../../../../shared/middleware/validation.middleware';
import { categoryValidation } from '../validators/category.validation';

const router = Router();
const categoryController = new CategoryController();

// Helper function to wrap async controller methods
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// All category routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/categories
 * @desc    Create a new category
 * @access  Private
 * @body    { name, description?, color?, icon?, parentId? }
 */
router.post(
  '/',
  validateRequest(categoryValidation.create),
  asyncHandler(categoryController.createCategory)
);

/**
 * @route   GET /api/categories
 * @desc    Get all categories for the authenticated user
 * @access  Private
 * @query   { parentId?, level?, isActive?, search?, page?, limit? }
 */
router.get(
  '/',
  validateRequest(categoryValidation.query, 'query'),
  asyncHandler(categoryController.getUserCategories)
);

/**
 * @route   GET /api/categories/tree
 * @desc    Get category tree structure for the authenticated user
 * @access  Private
 */
router.get('/tree', asyncHandler(categoryController.getCategoryTree));

/**
 * @route   GET /api/categories/stats
 * @desc    Get category statistics for the authenticated user
 * @access  Private
 */
router.get('/stats', asyncHandler(categoryController.getCategoryStats));

/**
 * @route   GET /api/categories/:id
 * @desc    Get category by ID
 * @access  Private
 * @params  { id }
 */
router.get(
  '/:id',
  validateRequest(categoryValidation.id, 'params'),
  asyncHandler(categoryController.getCategoryById)
);

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category by ID
 * @access  Private
 * @params  { id }
 * @body    { name?, description?, color?, icon?, parentId?, isActive? }
 */
router.put(
  '/:id',
  validateRequest(categoryValidation.id, 'params'),
  validateRequest(categoryValidation.update),
  asyncHandler(categoryController.updateCategory)
);

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category by ID (soft delete)
 * @access  Private
 * @params  { id }
 */
router.delete(
  '/:id',
  validateRequest(categoryValidation.id, 'params'),
  asyncHandler(categoryController.deleteCategory)
);

/**
 * @route   POST /api/categories/bulk
 * @desc    Bulk create categories
 * @access  Private
 * @body    { categories: [{ name, description?, color?, icon?, parentId? }] }
 */
router.post('/bulk', asyncHandler(categoryController.bulkCreateCategories));

export default router;
