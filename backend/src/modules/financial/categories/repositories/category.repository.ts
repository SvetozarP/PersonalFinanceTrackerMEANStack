import { BaseRepository } from '../../../../shared/repositories/base.repository';
import { Category } from '../models/category.model';
import { logger } from '../../../../shared/services/logger.service';
import { ICategory, ICategoryModel } from '../interfaces/category.interface';

export class CategoryRepository extends BaseRepository<ICategory> {
  protected model: ICategoryModel;

  constructor() {
    super(Category);
    this.model = Category;
  }

  /**
   * Find categories by user ID
   */
  async findByUserId(userId: string): Promise<ICategory[]> {
    try {
      const categories = await this.model
        .find({ userId, isActive: true })
        .sort({ level: 1, name: 1 });

      logger.info(`Found categories for user`, {
        userId,
        count: categories.length,
      });
      return categories;
    } catch (error) {
      logger.error(`Error finding categories for user`, {
        error: String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Find root categories (no parent)
   */
  async findRootCategories(userId: string): Promise<ICategory[]> {
    try {
      const categories = await this.model
        .find({ userId, parentId: { $exists: false }, isActive: true })
        .sort({ name: 1 });

      logger.info(`Found root categories for user`, {
        userId,
        count: categories.length,
      });
      return categories;
    } catch (error) {
      logger.error(`Error finding root categories for user`, {
        error: String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Find categories by parent ID
   */
  async findByParentId(parentId: string, userId: string): Promise<ICategory[]> {
    try {
      const categories = await this.model
        .find({ parentId, userId, isActive: true })
        .sort({ name: 1 });

      logger.info(`Found child categories`, {
        parentId,
        userId,
        count: categories.length,
      });
      return categories;
    } catch (error) {
      logger.error(`Error finding child categories`, {
        error: String(error),
        parentId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get category tree structure
   */
  async getCategoryTree(userId: string): Promise<any[]> {
    try {
      const tree = await this.model.getCategoryTree(userId);
      logger.info(`Generated category tree for user`, { userId });
      return tree;
    } catch (error) {
      logger.error(`Error generating category tree`, {
        error: String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Get category path
   */
  async getCategoryPath(categoryId: string): Promise<any> {
    try {
      const path = await this.model.getCategoryPath(categoryId);
      logger.info(`Retrieved category path`, { categoryId });
      return path;
    } catch (error) {
      logger.error(`Error retrieving category path`, {
        error: String(error),
        categoryId,
      });
      throw error;
    }
  }

  /**
   * Find categories by level
   */
  async findByLevel(level: number, userId: string): Promise<ICategory[]> {
    try {
      const categories = await this.model
        .find({ level, userId, isActive: true })
        .sort({ name: 1 });

      logger.info(`Found categories by level`, {
        level,
        userId,
        count: categories.length,
      });
      return categories;
    } catch (error) {
      logger.error(`Error finding categories by level`, {
        error: String(error),
        level,
        userId,
      });
      throw error;
    }
  }

  /**
   * Search categories by name
   */
  async searchByName(searchTerm: string, userId: string): Promise<ICategory[]> {
    try {
      const categories = await this.model
        .find({
          userId,
          isActive: true,
          name: { $regex: searchTerm, $options: 'i' },
        })
        .sort({ name: 1 });

      logger.info(`Searched categories by name`, {
        searchTerm,
        userId,
        count: categories.length,
      });
      return categories;
    } catch (error) {
      logger.error(`Error searching categories by name`, {
        error: String(error),
        searchTerm,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get category statistics
   */
  async getCategoryStats(userId: string): Promise<any> {
    try {
      const stats = await this.model.aggregate([
        {
          $match: {
            userId: new this.model.base.Types.ObjectId(userId),
            isActive: true,
          },
        },
        {
          $group: {
            _id: null,
            totalCategories: { $sum: 1 },
            rootCategories: {
              $sum: { $cond: [{ $eq: ['$parentId', null] }, 1, 0] },
            },
            maxLevel: { $max: '$level' },
            avgLevel: { $avg: '$level' },
          },
        },
      ]);

      const result = stats[0] || {
        totalCategories: 0,
        rootCategories: 0,
        maxLevel: 0,
        avgLevel: 0,
      };

      logger.info(`Retrieved category statistics for user`, {
        userId,
        stats: result,
      });
      return result;
    } catch (error) {
      logger.error(`Error retrieving category statistics`, {
        error: String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Check if category name exists for user and parent
   */
  async isNameUnique(
    name: string,
    userId: string,
    parentId?: string
  ): Promise<boolean> {
    try {
      const filter: any = { userId, name };
      if (parentId) {
        filter.parentId = parentId;
      } else {
        filter.parentId = { $exists: false };
      }

      const exists = await this.model.exists(filter);
      return !exists;
    } catch (error) {
      logger.error(`Error checking category name uniqueness`, {
        error: String(error),
        name,
        userId,
        parentId,
      });
      throw error;
    }
  }
}
