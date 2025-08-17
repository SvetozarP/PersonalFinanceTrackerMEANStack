import { Request, Response } from 'express';
import { CategoryService } from '../service/category.service';
import { logger } from '../../../../shared/services/logger.service';
import { categoryValidation } from '../validators/category.validation';

// Extend Express Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * Create a new category
   * POST /api/categories
   */
  createCategory = async (
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

      // Validate request body
      const { error, value } = categoryValidation.create.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        });
        return;
      }

      const category = await this.categoryService.createCategory(value, userId);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });

      logger.info('Category created via API', {
        categoryId: category._id,
        userId,
        name: category.name,
      });
    } catch (error) {
      logger.error('Error in createCategory controller', {
        error: String(error),
        userId: req.user?.userId,
      });

      if (error instanceof Error) {
        if (error.message.includes('already exists')) {
          res.status(409).json({
            success: false,
            message: error.message,
          });
        } else if (
          error.message.includes('not found') ||
          error.message.includes('access denied')
        ) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
        } else {
          res.status(400).json({
            success: false,
            message: error.message,
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  getCategoryById = async (
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

      // Validate category ID parameter
      const { error, value } = categoryValidation.id.validate(req.params);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        });
        return;
      }

      const category = await this.categoryService.getCategoryById(
        value.id,
        userId
      );

      res.status(200).json({
        success: true,
        data: category,
      });
    } catch (error) {
      logger.error('Error in getCategoryById controller', {
        error: String(error),
        categoryId: req.params.id,
        userId: req.user?.userId,
      });

      if (error instanceof Error) {
        if (error.message === 'Category not found') {
          res.status(404).json({
            success: false,
            message: 'Category not found',
          });
        } else if (error.message === 'Access denied') {
          res.status(403).json({
            success: false,
            message: 'Access denied',
          });
        } else {
          res.status(400).json({
            success: false,
            message: error.message,
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Get all categories for a user
   * GET /api/categories
   */
  getUserCategories = async (
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

      // Validate query parameters
      const { error, value } = categoryValidation.query.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        });
        return;
      }

      const result = await this.categoryService.getUserCategories(
        userId,
        value
      );

      res.status(200).json({
        success: true,
        data: result.categories,
        pagination: {
          page: result.page,
          limit: value.limit || 20,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      logger.error('Error in getUserCategories controller', {
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
   * Get category tree structure
   * GET /api/categories/tree
   */
  getCategoryTree = async (
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

      const tree = await this.categoryService.getCategoryTree(userId);

      res.status(200).json({
        success: true,
        data: tree,
      });
    } catch (error) {
      logger.error('Error in getCategoryTree controller', {
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
   * Update category
   * PUT /api/categories/:id
   */
  updateCategory = async (
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

      // Validate category ID parameter
      const { error: idError, value: idValue } = categoryValidation.id.validate(
        req.params
      );
      if (idError) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID',
          errors: idError.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        });
        return;
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } =
        categoryValidation.update.validate(req.body);
      if (bodyError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: bodyError.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        });
        return;
      }

      const updatedCategory = await this.categoryService.updateCategory(
        idValue.id,
        bodyValue,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: updatedCategory,
      });

      logger.info('Category updated via API', {
        categoryId: updatedCategory._id,
        userId,
        name: updatedCategory.name,
      });
    } catch (error) {
      logger.error('Error in updateCategory controller', {
        error: String(error),
        categoryId: req.params.id,
        userId: req.user?.userId,
      });

      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('access denied')
        ) {
          res.status(404).json({
            success: false,
            message: error.message,
          });
        } else if (error.message.includes('cannot be modified')) {
          res.status(403).json({
            success: false,
            message: error.message,
          });
        } else if (error.message.includes('circular reference')) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
        } else if (error.message.includes('already exists')) {
          res.status(409).json({
            success: false,
            message: error.message,
          });
        } else {
          res.status(400).json({
            success: false,
            message: error.message,
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  deleteCategory = async (
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

      // Validate category ID parameter
      const { error, value } = categoryValidation.id.validate(req.params);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        });
        return;
      }

      await this.categoryService.deleteCategory(value.id, userId);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });

      logger.info('Category deleted via API', {
        categoryId: value.id,
        userId,
      });
    } catch (error) {
      logger.error('Error in deleteCategory controller', {
        error: String(error),
        categoryId: req.params.id,
        userId: req.user?.userId,
      });

      if (error instanceof Error) {
        if (error.message === 'Category not found') {
          res.status(404).json({
            success: false,
            message: 'Category not found',
          });
        } else if (error.message === 'Access denied') {
          res.status(403).json({
            success: false,
            message: 'Access denied',
          });
        } else if (error.message.includes('cannot be deleted')) {
          res.status(403).json({
            success: false,
            message: error.message,
          });
        } else if (error.message.includes('subcategories first')) {
          res.status(400).json({
            success: false,
            message: error.message,
          });
        } else {
          res.status(400).json({
            success: false,
            message: error.message,
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
        });
      }
    }
  };

  /**
   * Bulk create categories
   * POST /api/categories/bulk
   */
  bulkCreateCategories = async (
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

      const { categories } = req.body;
      if (!Array.isArray(categories) || categories.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Categories array is required and must not be empty',
        });
        return;
      }

      // Validate each category
      const validationErrors: any[] = [];
      categories.forEach((category: any, index: number) => {
        const { error } = categoryValidation.create.validate(category);
        if (error) {
          validationErrors.push({
            index,
            errors: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
            })),
          });
        }
      });

      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Validation errors in categories array',
          errors: validationErrors,
        });
        return;
      }

      const createdCategories = await this.categoryService.bulkCreateCategories(
        categories,
        userId
      );

      res.status(201).json({
        success: true,
        message: `Successfully created ${createdCategories.length} categories`,
        data: createdCategories,
        summary: {
          requested: categories.length,
          created: createdCategories.length,
          failed: categories.length - createdCategories.length,
        },
      });

      logger.info('Bulk categories created via API', {
        userId,
        requested: categories.length,
        created: createdCategories.length,
      });
    } catch (error) {
      logger.error('Error in bulkCreateCategories controller', {
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
   * Get category statistics
   * GET /api/categories/stats
   */
  getCategoryStats = async (
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

      const stats = await this.categoryService.getCategoryStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error in getCategoryStats controller', {
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

export default CategoryController;
