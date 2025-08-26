import { CategoryRepository } from '../repositories/category.repository';
import { ICategory } from '../interfaces/category.interface';
import { logger } from '../../../../shared/services/logger.service';
import mongoose from 'mongoose';

export class CategoryService {
  private categoryRepository: CategoryRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * Create a new category
   */
  async createCategory(
    categoryData: Partial<ICategory>,
    userId: string
  ): Promise<ICategory> {
    try {
      logger.info('Creating new category', {
        userId,
        categoryData: {
          name: categoryData.name,
          parentId: categoryData.parentId,
        },
      });

      // Validate parent category exists and belongs to user
      if (categoryData.parentId) {
        const parentCategory = await this.categoryRepository.findById(
          categoryData.parentId.toString()
        );
        if (!parentCategory || parentCategory.userId.toString() !== userId) {
          throw new Error('Parent category not found or access denied');
        }
      }

      // Check for duplicate category name under the same parent
      const existingCategory = await this.categoryRepository.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        parentId: categoryData.parentId || null,
        name: categoryData.name,
      });

      if (existingCategory) {
        throw new Error('Category with this name already exists at this level');
      }

      // Calculate level and path
      const level = categoryData.parentId
        ? await this.calculateLevel(categoryData.parentId.toString())
        : 0;
      const path = categoryData.parentId
        ? await this.calculatePath(categoryData.parentId.toString())
        : [];

      // Create category with calculated fields
      const newCategory = await this.categoryRepository.create({
        ...categoryData,
        userId: new mongoose.Types.ObjectId(userId),
        level,
        path: [...path, categoryData.name!],
        isActive: true,
        isSystem: false,
      });

      logger.info('Category created successfully', {
        categoryId: newCategory._id,
        userId,
        name: newCategory.name,
        level: newCategory.level,
      });

      return newCategory;
    } catch (error) {
      logger.error('Error creating category', {
        error: String(error),
        userId,
        categoryData: {
          name: categoryData.name,
          parentId: categoryData.parentId,
        },
      });
      throw error;
    }
  }

  /**
   * Get category by ID with user validation
   */
  async getCategoryById(
    categoryId: string,
    userId: string
  ): Promise<ICategory> {
    try {
      logger.info('Getting category by ID', { categoryId, userId });

      const category = await this.categoryRepository.findById(categoryId);
      if (!category) {
        throw new Error('Category not found');
      }

      if (category.userId.toString() !== userId) {
        throw new Error('Access denied');
      }

      return category;
    } catch (error) {
      logger.error('Error getting category by ID', {
        error: String(error),
        categoryId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get all categories for a user
   */
  async getUserCategories(
    userId: string,
    options: {
      parentId?: string;
      level?: number;
      isActive?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    categories: ICategory[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      logger.info('Getting user categories', { userId, options });

      const {
        parentId,
        level,
        isActive,
        search,
        page = 1,
        limit = 20,
      } = options;

      // Build query
      const query: any = { userId: new mongoose.Types.ObjectId(userId) };

      if (parentId !== undefined) {
        query.parentId = parentId || null;
      }

      if (level !== undefined) {
        query.level = level;
      }

      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      // Add search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      // Get total count
      const total = await this.categoryRepository.count(query);

      // Get paginated results using the proper pagination method
      const result = await this.categoryRepository.findWithPagination(
        query,
        page,
        limit,
        { level: 1, name: 1 }
      );

      logger.info('Retrieved user categories', {
        userId,
        count: result.documents.length,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });

      return {
        categories: result.documents,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      };
    } catch (error) {
      logger.error('Error getting user categories', {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Get category tree structure
   */
  async getCategoryTree(userId: string): Promise<any[]> {
    try {
      logger.info('Getting category tree', { userId });

      const tree = await this.categoryRepository.getCategoryTree(userId);

      logger.info('Category tree retrieved successfully', {
        userId,
        rootCategories: tree.length,
      });

      return tree;
    } catch (error) {
      logger.error('Error getting category tree', {
        error: String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Update category
   */
  async updateCategory(
    categoryId: string,
    updateData: Partial<ICategory>,
    userId: string
  ): Promise<ICategory> {
    try {
      logger.info('Updating category', {
        categoryId,
        userId,
        updateData: { name: updateData.name, parentId: updateData.parentId },
      });

      // Get existing category and validate access
      const existingCategory = await this.getCategoryById(categoryId, userId);

      // Prevent updating system categories
      if (existingCategory.isSystem) {
        throw new Error('System categories cannot be modified');
      }

      // Validate parent category if changing
      if (
        updateData.parentId &&
        updateData.parentId.toString() !== existingCategory.parentId?.toString()
      ) {
        const parentCategory = await this.categoryRepository.findById(
          updateData.parentId.toString()
        );
        if (!parentCategory || parentCategory.userId.toString() !== userId) {
          throw new Error('Parent category not found or access denied');
        }

        // Prevent circular references
        if (
          await this.wouldCreateCircularReference(
            categoryId,
            updateData.parentId.toString()
          )
        ) {
          throw new Error('Cannot set parent: would create circular reference');
        }

        // Check for duplicate names under new parent
        const duplicateCategory = await this.categoryRepository.findOne({
          userId: new mongoose.Types.ObjectId(userId),
          parentId: updateData.parentId,
          name: updateData.name || existingCategory.name,
          _id: { $ne: new mongoose.Types.ObjectId(categoryId) },
        });

        if (duplicateCategory) {
          throw new Error(
            'Category with this name already exists at this level'
          );
        }

        // Recalculate level and path
        const newLevel = await this.calculateLevel(
          updateData.parentId.toString()
        );
        const newPath = await this.calculatePath(
          updateData.parentId.toString()
        );
        updateData.level = newLevel;
        updateData.path = [
          ...newPath,
          updateData.name || existingCategory.name,
        ];

        // Update all child categories' paths
        await this.updateChildPaths(categoryId, updateData.path);
      }

      // Update the category
      const updatedCategory = await this.categoryRepository.updateById(
        categoryId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedCategory) {
        throw new Error('Failed to update category');
      }

      logger.info('Category updated successfully', {
        categoryId,
        userId,
        name: updatedCategory.name,
      });

      return updatedCategory;
    } catch (error) {
      logger.error('Error updating category', {
        error: String(error),
        categoryId,
        userId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(categoryId: string, userId: string): Promise<void> {
    try {
      logger.info('Deleting category', { categoryId, userId });

      // Get existing category and validate access
      const existingCategory = await this.getCategoryById(categoryId, userId);

      // Prevent deleting system categories
      if (existingCategory.isSystem) {
        throw new Error('System categories cannot be deleted');
      }

      // Check if category has children
      const hasChildren = await this.categoryRepository.findOne({
        parentId: new mongoose.Types.ObjectId(categoryId),
        isActive: true,
      });

      if (hasChildren) {
        throw new Error(
          'Cannot delete category with subcategories. Please delete subcategories first.'
        );
      }

      // Check if category is used in transactions (you'll need to implement this check)
      // const transactionCount = await this.checkCategoryUsage(categoryId);
      // if (transactionCount > 0) {
      //   throw new Error(`Cannot delete category: used in ${transactionCount} transactions`);
      // }

      // Soft delete
      await this.categoryRepository.updateById(categoryId, {
        isActive: false,
        deletedAt: new Date(),
      });

      logger.info('Category deleted successfully', { categoryId, userId });
    } catch (error) {
      logger.error('Error deleting category', {
        error: String(error),
        categoryId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Bulk create categories
   */
  async bulkCreateCategories(
    categoriesData: Partial<ICategory>[],
    userId: string
  ): Promise<ICategory[]> {
    try {
      logger.info('Bulk creating categories', {
        userId,
        count: categoriesData.length,
      });

      const createdCategories: ICategory[] = [];

      for (const categoryData of categoriesData) {
        try {
          const category = await this.createCategory(categoryData, userId);
          createdCategories.push(category);
        } catch (error) {
          logger.warn('Failed to create category in bulk operation', {
            error: String(error),
            categoryData: {
              name: categoryData.name,
              parentId: categoryData.parentId,
            },
          });
          // Continue with other categories
        }
      }

      logger.info('Bulk category creation completed', {
        userId,
        requested: categoriesData.length,
        created: createdCategories.length,
      });

      return createdCategories;
    } catch (error) {
      logger.error('Error in bulk category creation', {
        error: String(error),
        userId,
        count: categoriesData.length,
      });
      throw error;
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(userId: string): Promise<{
    totalCategories: number;
    activeCategories: number;
    rootCategories: number;
    maxDepth: number;
    categoriesByLevel: { [key: number]: number };
  }> {
    try {
      logger.info('Getting category statistics', { userId });

      const [
        totalCategories,
        activeCategories,
        rootCategories,
        maxDepthResult,
      ] = await Promise.all([
        this.categoryRepository.count({
          userId: new mongoose.Types.ObjectId(userId),
        }),
        this.categoryRepository.count({
          userId: new mongoose.Types.ObjectId(userId),
          isActive: true,
        }),
        this.categoryRepository.count({
          userId: new mongoose.Types.ObjectId(userId),
          parentId: { $exists: false },
        }),
        this.categoryRepository.findOne(
          { userId: new mongoose.Types.ObjectId(userId) },
          { sort: { level: -1 }, select: 'level' }
        ),
      ]);

      // Get count by level
      const categoriesByLevel: { [key: number]: number } = {};
      const levelGroups = await this.categoryRepository.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$level', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      levelGroups.forEach((group: any) => {
        categoriesByLevel[group._id] = group.count;
      });

      const stats = {
        totalCategories,
        activeCategories,
        rootCategories,
        maxDepth: maxDepthResult?.level || 0,
        categoriesByLevel,
      };

      logger.info('Category statistics retrieved', { userId, stats });

      return stats;
    } catch (error) {
      logger.error('Error getting category statistics', {
        error: String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async calculateLevel(parentId: string): Promise<number> {
    const parent = await this.categoryRepository.findById(parentId);
    return parent ? parent.level + 1 : 0;
  }

  private async calculatePath(parentId: string): Promise<string[]> {
    const parent = await this.categoryRepository.findById(parentId);
    return parent ? [...parent.path, parent.name] : [];
  }

  private async wouldCreateCircularReference(
    categoryId: string,
    newParentId: string
  ): Promise<boolean> {
    let currentParentId = newParentId;

    while (currentParentId) {
      if (currentParentId === categoryId) {
        return true;
      }

      const parent = await this.categoryRepository.findById(currentParentId);
      if (!parent) break;

      currentParentId = parent.parentId?.toString() || '';
    }

    return false;
  }

  private async updateChildPaths(
    categoryId: string,
    newParentPath: string[]
  ): Promise<void> {
    const children = await this.categoryRepository.find({
      parentId: new mongoose.Types.ObjectId(categoryId),
    });

    for (const child of children) {
      const newPath = [...newParentPath, child.name];
      const childId = child._id?.toString();
      if (childId) {
        await this.categoryRepository.updateById(childId, { path: newPath });

        // Recursively update grandchildren
        await this.updateChildPaths(childId, newPath);
      }
    }
  }
}

export default CategoryService;
