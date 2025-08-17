import { Request, Response } from 'express';
import { CategoryService } from '../service/category.service';
import { logger } from '../../../../shared/services/logger.service';
import { categoryValidation } from '../validators/category.validation';
import { ICategory } from '../interfaces/category.interface';
import mongoose from 'mongoose';
import { ValidationResult, ValidationErrorItem } from 'joi';

// Extend Express Request interface to include user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

// Type for validation results
interface CreateCategoryData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
}

interface UpdateCategoryData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  isActive?: boolean;
}

interface CategoryQueryParams {
  parentId?: string;
  level?: number;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

interface CategoryIdParams {
  id: string;
}

// Helper function to safely extract validation results
function extractValidationResult<T>(validationResult: ValidationResult): {
  error: any;
  value: T;
} {
  return {
    error: validationResult.error,
    value: validationResult.value as T,
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
      const { error, value } = extractValidationResult<CreateCategoryData>(
        categoryValidation.create.validate(req.body)
      );
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map((detail: ValidationErrorItem) => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        });
        return;
      }

      const categoryData: Partial<ICategory> = {
        name: value.name,
        description: value.description,
        color: value.color,
        icon: value.icon,
        parentId: value.parentId
          ? new mongoose.Types.ObjectId(value.parentId)
          : undefined,
      };

      const category = await this.categoryService.createCategory(
        categoryData,
        userId
      );

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
      const { error, value } = extractValidationResult<CategoryIdParams>(
        categoryValidation.id.validate(req.params)
      );
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID',
          errors: error.details.map((detail: ValidationErrorItem) => ({
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
      const { error, value } = extractValidationResult<CategoryQueryParams>(
        categoryValidation.query.validate(req.query)
      );
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors: error.details.map((detail: ValidationErrorItem) => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        });
        return;
      }

      const validationData = value;
      const queryParams = {
        parentId: validationData.parentId,
        level: validationData.level,
        isActive: validationData.isActive,
        search: validationData.search,
        page: validationData.page,
        limit: validationData.limit,
      };

      const result = await this.categoryService.getUserCategories(
        userId,
        queryParams
      );

      res.status(200).json({
        success: true,
        data: result.categories,
        pagination: {
          page: result.page,
          limit: queryParams.limit || 20,
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
      const { error: idError, value: idValue } =
        extractValidationResult<CategoryIdParams>(
          categoryValidation.id.validate(req.params)
        );
      if (idError) {
        res.status(400).json({
          success: false,
          message: 'Invalid category ID',
          errors: idError.details.map((detail: ValidationErrorItem) => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        });
        return;
      }

      // Validate request body
      const { error: bodyError, value: bodyValue } =
        extractValidationResult<UpdateCategoryData>(
          categoryValidation.update.validate(req.body)
        );
      if (bodyError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: bodyError.details.map((detail: ValidationErrorItem) => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        });
        return;
      }

      const idParams = idValue;
      const validationData = bodyValue;
      const updateData: Partial<ICategory> = {
        name: validationData.name,
        description: validationData.description,
        color: validationData.color,
        icon: validationData.icon,
        parentId: validationData.parentId
          ? new mongoose.Types.ObjectId(validationData.parentId)
          : undefined,
        isActive: validationData.isActive,
      };

      const updatedCategory = await this.categoryService.updateCategory(
        idParams.id,
        updateData,
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

      const params = value as CategoryIdParams;
      await this.categoryService.deleteCategory(params.id, userId);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });

      logger.info('Category deleted via API', {
        categoryId: params.id,
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
      const validationErrors: Array<{
        index: number;
        errors: Array<{ field: string; message: string }>;
      }> = [];

      const validatedCategories: CreateCategoryData[] = [];

      categories.forEach((category: unknown, index: number) => {
        const { error, value } = categoryValidation.create.validate(category);
        if (error) {
          validationErrors.push({
            index,
            errors: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
            })),
          });
        } else {
          validatedCategories.push(value as CreateCategoryData);
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

      // Convert validation data to service format
      const categoryDataArray: Partial<ICategory>[] = validatedCategories.map(
        cat => ({
          name: cat.name,
          description: cat.description,
          color: cat.color,
          icon: cat.icon,
          parentId: cat.parentId
            ? new mongoose.Types.ObjectId(cat.parentId)
            : undefined,
        })
      );

      const createdCategories = await this.categoryService.bulkCreateCategories(
        categoryDataArray,
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
