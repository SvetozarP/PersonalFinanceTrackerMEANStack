import { logger } from '../../../../shared/services/logger.service';
import { BudgetRepository } from '../repositories/budget.repository';
import { TransactionRepository } from '../../transactions/repositories/transaction.repository';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import {
  IBudget,
  ICreateBudgetDto,
  IUpdateBudgetDto,
  IBudgetFilters,
  IBudgetAnalytics,
  IBudgetSummary,
  IBudgetStatistics,
  IBudgetAlert,
  ICategoryBudgetBreakdown,
  ISpendingTrend,
} from '../interfaces/budget.interface';
import { TransactionType } from '../../transactions/interfaces/transaction.interface';
import { Types } from 'mongoose';

export class BudgetService {
  private readonly logger = logger;

  constructor(
    private readonly budgetRepository: BudgetRepository,
    private readonly transactionRepository: TransactionRepository,
    private readonly categoryRepository: CategoryRepository
  ) {}

  /**
   * Create a new budget
   */
  async createBudget(
    userId: string,
    budgetData: ICreateBudgetDto
  ): Promise<IBudget> {
    try {
      this.logger.info(`Creating budget for user ${userId}`);

      // Validate category allocations
      await this.validateCategoryAllocations(
        userId,
        budgetData.categoryAllocations
      );

      // Create the budget
      const budget = await this.budgetRepository.create({
        ...budgetData,
        userId: new Types.ObjectId(userId),
        categoryAllocations: budgetData.categoryAllocations.map(allocation => ({
          ...allocation,
          isFlexible: allocation.isFlexible ?? false, // Default to false if undefined
          priority: allocation.priority ?? 1, // Default to 1 if undefined
        })),
      });

      this.logger.info(`Budget created successfully: ${budget._id}`);
      return budget;
    } catch (error) {
      this.logger.error(`Failed to create budget: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Get budget by ID with full analytics
   */
  async getBudgetById(
    userId: string,
    budgetId: string
  ): Promise<IBudgetAnalytics> {
    try {
      this.logger.info(`Getting budget analytics for budget ${budgetId}`);

      const budget = await this.budgetRepository.findById(budgetId);
      if (!budget || budget.userId.toString() !== userId) {
        throw new Error('Budget not found or access denied');
      }

      return await this.calculateBudgetAnalytics(budget);
    } catch (error) {
      this.logger.error(`Failed to get budget: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Get budgets with filters and pagination
   */
  async getBudgets(
    userId: string,
    filters: IBudgetFilters = {},
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
      this.logger.info(`Getting budgets for user ${userId} with filters`);

      const filtersWithUser = { ...filters, userId };
      return await this.budgetRepository.findBudgetsWithFilters(
        filtersWithUser,
        page,
        limit,
        sortBy,
        sortOrder
      );
    } catch (error) {
      this.logger.error(`Failed to get budgets: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Update budget
   */
  async updateBudget(
    userId: string,
    budgetId: string,
    updateData: IUpdateBudgetDto
  ): Promise<IBudget> {
    try {
      this.logger.info(`Updating budget ${budgetId} for user ${userId}`);

      const budget = await this.budgetRepository.findById(budgetId);
      if (!budget || budget.userId.toString() !== userId) {
        throw new Error('Budget not found or access denied');
      }

      // Validate category allocations if they're being updated
      if (updateData.categoryAllocations) {
        // Filter out allocations with undefined values and provide defaults
        const validAllocations = updateData.categoryAllocations
          .filter(
            allocation =>
              allocation.categoryId && allocation.allocatedAmount !== undefined
          )
          .map(allocation => ({
            categoryId: allocation.categoryId,
            allocatedAmount: allocation.allocatedAmount!,
            isFlexible: allocation.isFlexible ?? false,
            priority: allocation.priority ?? 1,
          }));

        await this.validateCategoryAllocations(userId, validAllocations);
      }

      const updatedBudget = await this.budgetRepository.updateById(
        budgetId,
        updateData
      );

      if (!updatedBudget) {
        throw new Error('Failed to update budget');
      }

      this.logger.info(`Budget updated successfully: ${budgetId}`);
      return updatedBudget;
    } catch (error) {
      this.logger.error(`Failed to update budget: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Delete budget
   */
  async deleteBudget(userId: string, budgetId: string): Promise<boolean> {
    try {
      this.logger.info(`Deleting budget ${budgetId} for user ${userId}`);

      const budget = await this.budgetRepository.findById(budgetId);
      if (!budget || budget.userId.toString() !== userId) {
        throw new Error('Budget not found or access denied');
      }

      const result = await this.budgetRepository.deleteById(budgetId);
      this.logger.info(`Budget deleted successfully: ${budgetId}`);
      return !!result;
    } catch (error) {
      this.logger.error(`Failed to delete budget: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Get budget summary for user
   */
  async getBudgetSummary(userId: string): Promise<IBudgetSummary> {
    try {
      this.logger.info(`Getting budget summary for user ${userId}`);

      const summary = await this.budgetRepository.getBudgetSummary(userId);

      // Calculate actual spending data
      const activeBudgets =
        await this.budgetRepository.findActiveBudgetsInRange(
          userId,
          new Date(new Date().getFullYear(), 0, 1), // Start of year
          new Date()
        );

      let totalSpent = 0;
      let overBudgetCount = 0;

      for (const budget of activeBudgets) {
        const analytics = await this.calculateBudgetAnalytics(budget);
        totalSpent += analytics.totalSpent;

        if (analytics.isOverBudget) {
          overBudgetCount++;
        }

        // Update remaining amounts in summary
        const deadlineIndex = summary.upcomingDeadlines.findIndex(
          d => d.budgetId === (budget._id as Types.ObjectId).toString()
        );
        if (deadlineIndex !== -1) {
          summary.upcomingDeadlines[deadlineIndex].remainingAmount =
            budget.totalAmount - analytics.totalSpent;
          summary.upcomingDeadlines[deadlineIndex].isOverBudget =
            analytics.isOverBudget;
        }
      }

      summary.totalSpentAmount = totalSpent;
      summary.totalRemainingAmount = summary.totalBudgetAmount - totalSpent;
      summary.overBudgetCount = overBudgetCount;

      return summary;
    } catch (error) {
      this.logger.error(`Failed to get budget summary: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Get budget statistics
   */
  async getBudgetStatistics(
    userId: string,
    year: number
  ): Promise<IBudgetStatistics> {
    try {
      this.logger.info(
        `Getting budget statistics for user ${userId} for year ${year}`
      );

      const monthlyStats = await this.budgetRepository.getMonthlyBudgetStats(
        userId,
        year
      );

      // Get category statistics
      const categoryStats = this.getCategoryBudgetStats(userId, year);

      // Get spending patterns
      const spendingPatterns = this.analyzeSpendingPatterns(userId, year);

      return {
        monthlyStats: monthlyStats.map(stat => ({
          month: this.getMonthName(stat.month),
          year: year,
          totalBudgeted: stat.totalBudgeted,
          totalSpent: 0, // Will be calculated
          totalSaved: 0, // Will be calculated
          budgetCount: stat.budgetCount,
        })),
        categoryStats,
        spendingPatterns,
      };
    } catch (error) {
      this.logger.error(`Failed to get budget statistics: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Check budget alerts
   */
  async checkBudgetAlerts(userId: string): Promise<IBudgetAlert[]> {
    try {
      this.logger.info(`Checking budget alerts for user ${userId}`);

      const activeBudgets =
        await this.budgetRepository.findActiveBudgetsInRange(
          userId,
          new Date(new Date().getFullYear(), 0, 1),
          new Date()
        );

      const alerts: IBudgetAlert[] = [];

      for (const budget of activeBudgets) {
        const analytics = await this.calculateBudgetAnalytics(budget);

        // Check overall budget threshold
        if (analytics.progressPercentage >= budget.alertThreshold) {
          alerts.push({
            type: 'threshold',
            message: `Budget "${budget.name}" is ${analytics.progressPercentage.toFixed(1)}% used`,
            severity: analytics.progressPercentage >= 100 ? 'high' : 'medium',
            currentAmount: analytics.totalSpent,
            limitAmount: budget.totalAmount,
          });
        }

        // Check category overruns
        for (const category of analytics.categoryBreakdown) {
          if (category.isOverBudget && !category.isFlexible) {
            alerts.push({
              type: 'category_overbudget',
              message: `Category "${category.categoryName}" in budget "${budget.name}" is over budget`,
              severity: 'high',
              categoryId: category.categoryId,
              currentAmount: category.spentAmount,
              limitAmount: category.allocatedAmount,
            });
          }
        }
      }

      return alerts;
    } catch (error) {
      this.logger.error(`Failed to check budget alerts: ${String(error)}`);
      throw error;
    }
  }

  /**
   * Calculate budget analytics with actual spending data
   */
  private async calculateBudgetAnalytics(
    budget: IBudget
  ): Promise<IBudgetAnalytics> {
    try {
      // Get transactions within budget period
      const transactions = await this.transactionRepository.findByDateRange(
        budget.userId.toString(),
        budget.startDate,
        budget.endDate
      );

      // Calculate total spent
      const totalSpent = transactions.reduce(
        (sum: number, transaction: any): number => {
          if (transaction.type === TransactionType.EXPENSE) {
            return sum + transaction.amount;
          }
          return sum;
        },
        0
      );

      // Calculate category breakdown
      const categoryBreakdown: ICategoryBudgetBreakdown[] = [];

      for (const allocation of budget.categoryAllocations) {
        const categoryTransactions = transactions.filter(
          (t: any): boolean =>
            t.categoryId.toString() === allocation.categoryId.toString()
        );

        const categorySpent = categoryTransactions.reduce(
          (sum: number, transaction: any): number => {
            if (transaction.type === TransactionType.EXPENSE) {
              return sum + transaction.amount;
            }
            return sum;
          },
          0
        );

        const remaining = allocation.allocatedAmount - categorySpent;
        const progressPercentage =
          allocation.allocatedAmount > 0
            ? (categorySpent / allocation.allocatedAmount) * 100
            : 0;

        categoryBreakdown.push({
          categoryId: allocation.categoryId.toString(),
          categoryName: 'Unknown Category', // We'll need to populate this from the category
          allocatedAmount: allocation.allocatedAmount,
          spentAmount: categorySpent,
          remainingAmount: remaining,
          progressPercentage: Math.round(progressPercentage * 100) / 100,
          isOverBudget:
            categorySpent > allocation.allocatedAmount &&
            !allocation.isFlexible,
          isFlexible: allocation.isFlexible,
          priority: allocation.priority,
        });
      }

      // Calculate spending trend
      const spendingTrend = this.calculateSpendingTrend(
        transactions,
        budget.startDate,
        budget.endDate
      );

      // Generate alerts
      const alerts = this.generateBudgetAlerts(
        budget,
        totalSpent,
        categoryBreakdown
      );

      return {
        budgetId: (budget._id as Types.ObjectId).toString(),
        totalAllocated: budget.totalAmount,
        totalSpent,
        totalRemaining: budget.totalAmount - totalSpent,
        progressPercentage:
          budget.totalAmount > 0
            ? Math.round((totalSpent / budget.totalAmount) * 100 * 100) / 100
            : 0,
        isOverBudget: totalSpent > budget.totalAmount,
        categoryBreakdown,
        spendingTrend,
        alerts,
      };
    } catch (error) {
      this.logger.error(
        `Failed to calculate budget analytics: ${String(error)}`
      );
      throw error;
    }
  }

  /**
   * Validate category allocations
   */
  private async validateCategoryAllocations(
    userId: string,
    allocations: Array<{ categoryId: string; allocatedAmount: number }>
  ): Promise<void> {
    const categoryIds = allocations.map(a => new Types.ObjectId(a.categoryId));

    // Find categories one by one since findByIds doesn't exist
    const categories = [];
    for (const categoryId of categoryIds) {
      const category = await this.categoryRepository.findById(
        categoryId.toString()
      );
      if (category) {
        categories.push(category);
      }
    }

    const userCategories = categories.filter(
      (c: any): boolean => c.userId.toString() === userId
    );

    if (userCategories.length !== allocations.length) {
      throw new Error('One or more categories not found or access denied');
    }

    // Check for duplicate categories
    const uniqueCategoryIds = new Set(allocations.map(a => a.categoryId));
    if (uniqueCategoryIds.size !== allocations.length) {
      throw new Error('Duplicate categories are not allowed');
    }
  }

  /**
   * Calculate spending trend over time
   */
  private calculateSpendingTrend(
    transactions: any[],
    startDate: Date,
    endDate: Date
  ): ISpendingTrend[] {
    const trend: ISpendingTrend[] = [];
    const currentDate = new Date(startDate);
    let cumulativeAmount = 0;

    while (currentDate <= endDate) {
      const dayTransactions = transactions.filter((t: any) => {
        const transactionDate = new Date(t.date);
        return (
          transactionDate.getDate() === currentDate.getDate() &&
          transactionDate.getMonth() === currentDate.getMonth() &&
          transactionDate.getFullYear() === currentDate.getFullYear()
        );
      });

      const dayAmount = dayTransactions.reduce(
        (sum: number, t: any): number => {
          if (t.type === TransactionType.EXPENSE) {
            return sum + t.amount;
          }
          return sum;
        },
        0
      );

      cumulativeAmount += dayAmount;

      trend.push({
        date: new Date(currentDate),
        amount: dayAmount,
        cumulativeAmount,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trend;
  }

  /**
   * Generate budget alerts
   */
  private generateBudgetAlerts(
    budget: IBudget,
    totalSpent: number,
    categoryBreakdown: ICategoryBudgetBreakdown[]
  ): IBudgetAlert[] {
    const alerts: IBudgetAlert[] = [];

    // Overall budget threshold alert
    if (totalSpent >= budget.totalAmount * (budget.alertThreshold / 100)) {
      alerts.push({
        type: 'threshold',
        message: `Budget "${budget.name}" is ${((totalSpent / budget.totalAmount) * 100).toFixed(1)}% used`,
        severity: totalSpent >= budget.totalAmount ? 'high' : 'medium',
        currentAmount: totalSpent,
        limitAmount: budget.totalAmount,
      });
    }

    // Category overrun alerts
    for (const category of categoryBreakdown) {
      if (category.isOverBudget) {
        alerts.push({
          type: 'category_overbudget',
          message: `Category "${category.categoryName}" in budget "${budget.name}" is over budget`,
          severity: 'high',
          categoryId: category.categoryId,
          currentAmount: category.spentAmount,
          limitAmount: category.allocatedAmount,
        });
      }
    }

    return alerts;
  }

  /**
   * Get category budget statistics
   */
  private getCategoryBudgetStats(
    _userId: string,
    _year: number
  ): Array<{
    categoryId: string;
    categoryName: string;
    totalBudgeted: number;
    totalSpent: number;
    averageUtilization: number;
    overBudgetCount: number;
  }> {
    // Implementation for category statistics
    // This would aggregate data across all budgets for the year
    return [];
  }

  /**
   * Analyze spending patterns
   */
  private analyzeSpendingPatterns(
    _userId: string,
    _year: number
  ): Array<{
    pattern: 'consistent' | 'variable' | 'seasonal' | 'trending';
    description: string;
    confidence: number;
    recommendations: string[];
  }> {
    // Implementation for spending pattern analysis
    // This would analyze transaction data to identify patterns
    return [];
  }

  /**
   * Get month name from month number
   */
  private getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1] || 'Unknown';
  }
}

export default BudgetService;
