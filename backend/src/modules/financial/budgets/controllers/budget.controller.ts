import { Request, Response } from 'express';
import { BudgetService } from '../services/budget.service';
import { logger } from '../../../../shared/services/logger.service';
import { AuthenticatedRequest } from '../../../auth/auth.middleware';
import { validateBudgetInput } from '../validation/budget.validation';

export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  /**
   * Create a new budget
   * POST /api/budgets
   */
  async createBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validate input using Joi validation
      const { error, value } = validateBudgetInput.createBudget(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const budget = await this.budgetService.createBudget(userId, value);

      logger.info(
        `Budget created successfully: ${budget._id} for user ${userId}`
      );
      res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        data: budget,
      });
    } catch (error: any) {
      logger.error(`Failed to create budget: ${error.message}`);

      if (
        error.message.includes('not found') ||
        error.message.includes('access denied')
      ) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (
        error.message.includes('Validation failed') ||
        error.message.includes('duplicate')
      ) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get budget by ID with full analytics
   * GET /api/budgets/:id
   */
  async getBudgetById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id: budgetId } = req.params;
      if (!budgetId) {
        res.status(400).json({ error: 'Budget ID is required' });
        return;
      }

      const budgetAnalytics = await this.budgetService.getBudgetById(
        userId,
        budgetId
      );

      logger.info(
        `Budget retrieved successfully: ${budgetId} for user ${userId}`
      );
      res.status(200).json({
        success: true,
        data: budgetAnalytics,
      });
    } catch (error: any) {
      logger.error(`Failed to get budget ${req.params.id}: ${error.message}`);

      if (
        error.message.includes('not found') ||
        error.message.includes('access denied')
      ) {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get budgets with filters and pagination
   * GET /api/budgets
   */
  async getBudgets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Extract query parameters
      const {
        page = '1',
        limit = '20',
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status,
        period,
        startDate,
        endDate,
        categoryId,
        isActive,
      } = req.query;

      // Validate and parse pagination parameters
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({ error: 'Invalid page number' });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res
          .status(400)
          .json({ error: 'Invalid limit (must be between 1 and 100)' });
        return;
      }

      // Validate sort order
      if (!['asc', 'desc'].includes(sortOrder as string)) {
        res
          .status(400)
          .json({ error: 'Invalid sort order (must be asc or desc)' });
        return;
      }

      // Build filters object
      const filters: any = {};
      if (status) filters.status = status;
      if (period) filters.period = period;
      if (categoryId) filters.categoryId = categoryId;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      // Parse dates if provided
      if (startDate) {
        const parsedStartDate = new Date(startDate as string);
        if (isNaN(parsedStartDate.getTime())) {
          res.status(400).json({ error: 'Invalid start date format' });
          return;
        }
        filters.startDate = parsedStartDate;
      }

      if (endDate) {
        const parsedEndDate = new Date(endDate as string);
        if (isNaN(parsedEndDate.getTime())) {
          res.status(400).json({ error: 'Invalid end date format' });
          return;
        }
        filters.endDate = parsedEndDate;
      }

      const result = await this.budgetService.getBudgets(
        userId,
        filters,
        pageNum,
        limitNum,
        sortBy as string,
        sortOrder as 'asc' | 'desc'
      );

      logger.info(
        `Budgets retrieved successfully for user ${userId} (page ${pageNum})`
      );
      res.status(200).json({
        success: true,
        data: result.budgets,
        pagination: {
          page: result.page,
          limit: limitNum,
          total: result.total,
          totalPages: result.totalPages,
        },
      });
    } catch (error: any) {
      logger.error(`Failed to get budgets: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update budget
   * PUT /api/budgets/:id
   */
  async updateBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id: budgetId } = req.params;
      if (!budgetId) {
        res.status(400).json({ error: 'Budget ID is required' });
        return;
      }

      // Validate input using Joi validation
      const { error, value } = validateBudgetInput.updateBudget(req.body);
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message),
        });
        return;
      }

      const updatedBudget = await this.budgetService.updateBudget(
        userId,
        budgetId,
        value
      );

      logger.info(
        `Budget updated successfully: ${budgetId} for user ${userId}`
      );
      res.status(200).json({
        success: true,
        message: 'Budget updated successfully',
        data: updatedBudget,
      });
    } catch (error: any) {
      logger.error(
        `Failed to update budget ${req.params.id}: ${error.message}`
      );

      if (
        error.message.includes('not found') ||
        error.message.includes('access denied')
      ) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('Validation failed')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete budget
   * DELETE /api/budgets/:id
   */
  async deleteBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id: budgetId } = req.params;
      if (!budgetId) {
        res.status(400).json({ error: 'Budget ID is required' });
        return;
      }

      const result = await this.budgetService.deleteBudget(userId, budgetId);

      if (result) {
        logger.info(
          `Budget deleted successfully: ${budgetId} for user ${userId}`
        );
        res.status(200).json({
          success: true,
          message: 'Budget deleted successfully',
        });
      } else {
        res.status(404).json({ error: 'Budget not found' });
      }
    } catch (error: any) {
      logger.error(
        `Failed to delete budget ${req.params.id}: ${error.message}`
      );

      if (
        error.message.includes('not found') ||
        error.message.includes('access denied')
      ) {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get budget summary for user
   * GET /api/budgets/summary
   */
  async getBudgetSummary(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const summary = await this.budgetService.getBudgetSummary(userId);

      logger.info(`Budget summary retrieved successfully for user ${userId}`);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      logger.error(`Failed to get budget summary: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get budget statistics
   * GET /api/budgets/statistics
   */
  async getBudgetStatistics(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { year } = req.query;
      const yearNum = year
        ? parseInt(year as string, 10)
        : new Date().getFullYear();

      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        res
          .status(400)
          .json({ error: 'Invalid year (must be between 1900 and 2100)' });
        return;
      }

      const statistics = await this.budgetService.getBudgetStatistics(
        userId,
        yearNum
      );

      logger.info(
        `Budget statistics retrieved successfully for user ${userId} for year ${yearNum}`
      );
      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      logger.error(`Failed to get budget statistics: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Check budget alerts
   * GET /api/budgets/alerts
   */
  async checkBudgetAlerts(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const alerts = await this.budgetService.checkBudgetAlerts(userId);

      logger.info(`Budget alerts checked successfully for user ${userId}`);
      res.status(200).json({
        success: true,
        data: alerts,
      });
    } catch (error: any) {
      logger.error(`Failed to check budget alerts: ${error.message}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update category allocation for a budget
   * PATCH /api/budgets/:id/categories/:categoryId
   */
  async updateCategoryAllocation(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { id: budgetId, categoryId } = req.params;
      const { allocatedAmount } = req.body;

      if (!budgetId || !categoryId) {
        res
          .status(400)
          .json({ error: 'Budget ID and Category ID are required' });
        return;
      }

      // Validate input using Joi validation
      const { error, value } = validateBudgetInput.updateCategoryAllocation(
        req.body
      );
      if (error) {
        res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => d.message),
        });
        return;
      }

      // Get current budget to update the specific allocation
      const budget = await this.budgetService.getBudgetById(userId, budgetId);
      const categoryAllocation = budget.categoryBreakdown.find(
        cat => cat.categoryId === categoryId
      );

      if (!categoryAllocation) {
        res
          .status(404)
          .json({ error: 'Category allocation not found in this budget' });
        return;
      }

      // Update the budget with new allocation
      const updateData = {
        categoryAllocations: budget.categoryBreakdown.map(cat => ({
          categoryId: cat.categoryId,
          allocatedAmount:
            cat.categoryId === categoryId
              ? value.allocatedAmount
              : cat.allocatedAmount,
          isFlexible:
            cat.categoryId === categoryId
              ? (value.isFlexible ?? cat.isFlexible)
              : cat.isFlexible,
          priority:
            cat.categoryId === categoryId
              ? (value.priority ?? cat.priority)
              : cat.priority,
        })),
      };

      const updatedBudget = await this.budgetService.updateBudget(
        userId,
        budgetId,
        updateData
      );

      logger.info(
        `Category allocation updated successfully for budget ${budgetId}, category ${categoryId}`
      );
      res.status(200).json({
        success: true,
        message: 'Category allocation updated successfully',
        data: updatedBudget,
      });
    } catch (error: any) {
      logger.error(`Failed to update category allocation: ${error.message}`);

      if (
        error.message.includes('not found') ||
        error.message.includes('access denied')
      ) {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default BudgetController;
