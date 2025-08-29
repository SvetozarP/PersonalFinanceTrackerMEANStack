import { BaseRepository } from '../../../../shared/repositories/base.repository';
import Budget from '../models/budget.model';
import {
  IBudgetFilters,
  IBudgetAnalytics,
  IBudgetSummary,
  IBudget,
} from '../interfaces/budget.interface';
import { Types } from 'mongoose';
import { logger } from '../../../../shared/services/logger.service';

export class BudgetRepository extends BaseRepository<IBudget> {
  constructor() {
    super(Budget);
  }

  /**
   * Find budgets with advanced filtering and pagination
   */
  async findBudgetsWithFilters(
    filters: IBudgetFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    budgets: IBudget[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const query: any = {};

      // Apply filters
      if (filters.userId) {
        query.userId = new Types.ObjectId(filters.userId);
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.period) {
        query.period = filters.period;
      }

      if (filters.startDate || filters.endDate) {
        query.$and = [];
        if (filters.startDate) {
          query.$and.push({ startDate: { $gte: filters.startDate } });
        }
        if (filters.endDate) {
          query.$and.push({ endDate: { $lte: filters.endDate } });
        }
      }

      if (filters.categoryId) {
        query['categoryAllocations.categoryId'] = new Types.ObjectId(
          filters.categoryId
        );
      }

      if (filters.isActive !== undefined) {
        query.isActive = filters.isActive;
      }

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with pagination
      const total = await this.model.countDocuments(query);
      const budgets = await this.model
        .find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('categoryAllocations.categoryId', 'name color icon')
        .lean();

      const totalPages = Math.ceil(total / limit);

      return {
        budgets,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Failed to find budgets with filters', {
        error: String(error),
      });
      throw new Error(`Failed to find budgets with filters: ${String(error)}`);
    }
  }

  /**
   * Find active budgets for a user within a date range
   */
  async findActiveBudgetsInRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IBudget[]> {
    try {
      return await this.model
        .find({
          userId: new Types.ObjectId(userId),
          status: 'active',
          $or: [
            // Budgets that start within the range
            { startDate: { $gte: startDate, $lte: endDate } },
            // Budgets that end within the range
            { endDate: { $gte: startDate, $lte: endDate } },
            // Budgets that span the entire range
            { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
          ],
        })
        .populate('categoryAllocations.categoryId', 'name color icon');
    } catch (error) {
      logger.error('Failed to find active budgets in range', {
        error: String(error),
      });
      throw new Error(
        `Failed to find active budgets in range: ${String(error)}`
      );
    }
  }

  /**
   * Find budgets by category allocation
   */
  async findBudgetsByCategory(
    userId: string,
    categoryId: string,
    status?: string
  ): Promise<IBudget[]> {
    try {
      const query: any = {
        userId: new Types.ObjectId(userId),
        'categoryAllocations.categoryId': new Types.ObjectId(categoryId),
      };

      if (status) {
        query.status = status;
      }

      return await this.model
        .find(query)
        .populate('categoryAllocations.categoryId', 'name color icon')
        .lean();
    } catch (error) {
      logger.error('Failed to find budgets by category', {
        error: String(error),
      });
      throw new Error(`Failed to find budgets by category: ${String(error)}`);
    }
  }

  /**
   * Get budget analytics with spending data
   */
  async getBudgetAnalytics(budgetId: string): Promise<IBudgetAnalytics | null> {
    try {
      const result = await this.model.aggregate([
        { $match: { _id: new Types.ObjectId(budgetId) } },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryAllocations.categoryId',
            foreignField: '_id',
            as: 'categoryDetails',
          },
        },
        {
          $addFields: {
            categoryBreakdown: {
              $map: {
                input: '$categoryAllocations',
                as: 'allocation',
                in: {
                  categoryId: { $toString: '$$allocation.categoryId' },
                  categoryName: {
                    $let: {
                      vars: {
                        category: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$categoryDetails',
                                cond: {
                                  $eq: [
                                    '$$this._id',
                                    '$$allocation.categoryId',
                                  ],
                                },
                              },
                            },
                            0,
                          ],
                        },
                      },
                      in: '$$category.name',
                    },
                  },
                  allocatedAmount: '$$allocation.allocatedAmount',
                  spentAmount: 0, // Will be calculated by service
                  remainingAmount: '$$allocation.allocatedAmount',
                  progressPercentage: 0,
                  isOverBudget: false,
                  isFlexible: '$$allocation.isFlexible',
                  priority: '$$allocation.priority',
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            categoryAllocations: 1,
            categoryBreakdown: 1,
          },
        },
      ]);

      if (!result || result.length === 0) {
        return null;
      }

      const budget = result[0];
      const totalAllocated = budget.categoryAllocations.reduce(
        (sum: number, allocation: any) => sum + allocation.allocatedAmount,
        0
      );

      const totalSpent = 0; // Placeholder - will be calculated by service
      const totalRemaining = totalAllocated - totalSpent;
      const progressPercentage =
        totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

      return {
        budgetId: budget._id.toString(),
        totalAllocated,
        totalSpent,
        totalRemaining,
        progressPercentage: Math.round(progressPercentage * 100) / 100,
        isOverBudget: totalSpent > totalAllocated,
        categoryBreakdown: budget.categoryBreakdown,
        spendingTrend: [], // Will be populated by service
        alerts: [], // Will be populated by service
      };
    } catch (error) {
      logger.error('Failed to get budget analytics', { error: String(error) });
      throw new Error(`Failed to get budget analytics: ${String(error)}`);
    }
  }

  /**
   * Get budget summary for a user
   */
  async getBudgetSummary(userId: string): Promise<IBudgetSummary> {
    try {
      const now = new Date();
      const thirtyDaysFromNow = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      );

      // Get total budgets count
      const totalBudgets = await this.model.countDocuments({
        userId: new Types.ObjectId(userId),
      });

      // Get active budgets count
      const activeBudgets = await this.model.countDocuments({
        userId: new Types.ObjectId(userId),
        status: 'active',
        startDate: { $lte: now },
        endDate: { $gte: now },
      });

      // Get total budget amount
      const totalBudgetResult = await this.model.aggregate([
        { $match: { userId: new Types.ObjectId(userId), status: 'active' } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalAmount' },
          },
        },
      ]);

      const totalBudgetAmount = totalBudgetResult[0]?.totalAmount || 0;

      // Get upcoming deadlines
      const upcomingDeadlines = await this.model
        .find({
          userId: new Types.ObjectId(userId),
          status: 'active',
          endDate: { $gte: now, $lte: thirtyDaysFromNow },
        })
        .select('name endDate totalAmount')
        .lean();

      const deadlines = upcomingDeadlines.map(budget => {
        const daysRemaining = Math.ceil(
          (budget.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          budgetId: budget._id.toString(),
          budgetName: budget.name,
          endDate: budget.endDate,
          daysRemaining,
          remainingAmount: budget.totalAmount, // Will be calculated by service
          isOverBudget: false, // Will be calculated by service
        };
      });

      return {
        totalBudgets,
        activeBudgets,
        totalBudgetAmount,
        totalSpentAmount: 0, // Will be calculated by service
        totalRemainingAmount: totalBudgetAmount,
        overBudgetCount: 0, // Will be calculated by service
        upcomingDeadlines: deadlines,
      };
    } catch (error) {
      logger.error('Failed to get budget summary', { error: String(error) });
      throw new Error(`Failed to get budget summary: ${String(error)}`);
    }
  }

  /**
   * Get budgets with spending data for a specific period
   */
  async getBudgetsWithSpending(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<IBudget[]> {
    try {
      return await this.model
        .find({
          userId: new Types.ObjectId(userId),
          $or: [
            { startDate: { $lte: endDate, $gte: startDate } },
            { endDate: { $gte: startDate, $lte: endDate } },
            { startDate: { $lte: startDate }, endDate: { $gte: endDate } },
          ],
        })
        .populate('categoryAllocations.categoryId', 'name color icon')
        .lean();
    } catch (error) {
      logger.error('Failed to get budgets with spending', {
        error: String(error),
      });
      throw new Error(`Failed to get budgets with spending: ${String(error)}`);
    }
  }

  /**
   * Find budgets that are over budget
   */
  async findOverBudgetBudgets(userId: string): Promise<IBudget[]> {
    try {
      // This will be enhanced by the service layer to include actual spending data
      return await this.model
        .find({
          userId: new Types.ObjectId(userId),
          status: 'active',
        })
        .populate('categoryAllocations.categoryId', 'name color icon')
        .lean();
    } catch (error) {
      logger.error('Failed to find over budget budgets', {
        error: String(error),
      });
      throw new Error(`Failed to find over budget budgets: ${String(error)}`);
    }
  }

  /**
   * Get budget statistics by month
   */
  async getMonthlyBudgetStats(
    userId: string,
    year: number
  ): Promise<
    Array<{ month: number; totalBudgeted: number; budgetCount: number }>
  > {
    try {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      const result = await this.model.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            startDate: { $gte: startOfYear, $lte: endOfYear },
          },
        },
        {
          $group: {
            _id: { $month: '$startDate' },
            totalBudgeted: { $sum: '$totalAmount' },
            budgetCount: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      return result.map(item => ({
        month: item._id,
        totalBudgeted: item.totalBudgeted,
        budgetCount: item.budgetCount,
      }));
    } catch (error) {
      logger.error('Failed to get monthly budget stats', {
        error: String(error),
      });
      throw new Error(`Failed to get monthly budget stats: ${String(error)}`);
    }
  }

  /**
   * Update category allocation for a specific budget
   */
  async updateCategoryAllocation(
    budgetId: string,
    categoryId: string,
    newAmount: number
  ): Promise<boolean> {
    try {
      const result = await this.model.updateOne(
        {
          _id: new Types.ObjectId(budgetId),
          'categoryAllocations.categoryId': new Types.ObjectId(categoryId),
        },
        {
          $set: {
            'categoryAllocations.$.allocatedAmount': newAmount,
          },
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('Failed to update category allocation', {
        error: String(error),
      });
      throw new Error(`Failed to update category allocation: ${String(error)}`);
    }
  }

  /**
   * Add new category allocation to budget
   */
  async addCategoryAllocation(
    budgetId: string,
    allocation: {
      categoryId: string;
      allocatedAmount: number;
      isFlexible?: boolean;
      priority?: number;
    }
  ): Promise<boolean> {
    try {
      const result = await this.model.updateOne(
        { _id: new Types.ObjectId(budgetId) },
        {
          $push: {
            categoryAllocations: {
              categoryId: new Types.ObjectId(allocation.categoryId),
              allocatedAmount: allocation.allocatedAmount,
              isFlexible: allocation.isFlexible || false,
              priority: allocation.priority || 1,
            },
          },
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('Failed to add category allocation', {
        error: String(error),
      });
      throw new Error(`Failed to add category allocation: ${String(error)}`);
    }
  }

  /**
   * Remove category allocation from budget
   */
  async removeCategoryAllocation(
    budgetId: string,
    categoryId: string
  ): Promise<boolean> {
    try {
      const result = await this.model.updateOne(
        { _id: new Types.ObjectId(budgetId) },
        {
          $pull: {
            categoryAllocations: {
              categoryId: new Types.ObjectId(categoryId),
            },
          },
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      logger.error('Failed to remove category allocation', {
        error: String(error),
      });
      throw new Error(`Failed to remove category allocation: ${String(error)}`);
    }
  }
}

export default BudgetRepository;
