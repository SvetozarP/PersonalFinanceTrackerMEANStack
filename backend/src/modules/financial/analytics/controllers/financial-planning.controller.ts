import { Request, Response } from 'express';
import { FinancialPlanningService } from '../services/financial-planning.service';
import { logger } from '../../../../shared/services/logger.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export class FinancialPlanningController {
  private financialPlanningService: FinancialPlanningService;

  constructor() {
    this.financialPlanningService = new FinancialPlanningService();
  }

  /**
   * Create a financial goal
   * POST /api/analytics/planning/goals
   */
  createFinancialGoal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        name,
        description,
        targetAmount,
        targetDate,
        priority,
        category,
        monthlyContribution
      } = req.body;

      // Validate required fields
      if (!name || !targetAmount || !targetDate || !priority || !category || !monthlyContribution) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: name, targetAmount, targetDate, priority, category, monthlyContribution'
        });
        return;
      }

      const goal = await this.financialPlanningService.createFinancialGoal(userId, {
        name,
        description: description || '',
        targetAmount: parseFloat(targetAmount),
        targetDate: new Date(targetDate),
        priority,
        category,
        monthlyContribution: parseFloat(monthlyContribution)
      });

      res.status(201).json({
        success: true,
        data: goal,
        message: 'Financial goal created successfully'
      });

      logger.info('Financial goal created via API', { userId, goalId: goal.id, goalName: goal.name });
    } catch (error) {
      logger.error('Error in createFinancialGoal controller', {
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
   * Update financial goal progress
   * PUT /api/analytics/planning/goals/:goalId/progress
   */
  updateGoalProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { goalId } = req.params;
      const { currentAmount } = req.body;

      if (!currentAmount && currentAmount !== 0) {
        res.status(400).json({
          success: false,
          message: 'currentAmount is required'
        });
        return;
      }

      const updatedGoal = await this.financialPlanningService.updateGoalProgress(
        userId,
        goalId,
        parseFloat(currentAmount)
      );

      res.status(200).json({
        success: true,
        data: updatedGoal,
        message: 'Goal progress updated successfully'
      });

      logger.info('Goal progress updated via API', { userId, goalId, currentAmount });
    } catch (error) {
      logger.error('Error in updateGoalProgress controller', {
        error: String(error),
        userId: req.user?.userId,
        goalId: req.params.goalId,
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Generate financial scenarios
   * GET /api/analytics/planning/scenarios
   */
  generateFinancialScenarios = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { timeHorizon = 10 } = req.query;

      const scenarios = await this.financialPlanningService.generateFinancialScenarios(
        userId,
        parseInt(timeHorizon as string)
      );

      res.status(200).json({
        success: true,
        data: scenarios,
        message: 'Financial scenarios generated successfully'
      });

      logger.info('Financial scenarios generated via API', { userId, timeHorizon, scenarioCount: scenarios.length });
    } catch (error) {
      logger.error('Error in generateFinancialScenarios controller', {
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
   * Create retirement plan
   * POST /api/analytics/planning/retirement
   */
  createRetirementPlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const {
        currentAge,
        retirementAge,
        currentSavings,
        monthlyContribution,
        expectedReturn,
        inflationRate,
        targetAmount
      } = req.body;

      // Validate required fields
      if (!currentAge || !retirementAge || !currentSavings || !monthlyContribution || !expectedReturn || !targetAmount) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: currentAge, retirementAge, currentSavings, monthlyContribution, expectedReturn, targetAmount'
        });
        return;
      }

      const retirementPlan = await this.financialPlanningService.createRetirementPlan(userId, {
        currentAge: parseInt(currentAge),
        retirementAge: parseInt(retirementAge),
        currentSavings: parseFloat(currentSavings),
        monthlyContribution: parseFloat(monthlyContribution),
        expectedReturn: parseFloat(expectedReturn),
        inflationRate: parseFloat(inflationRate) || 3,
        targetAmount: parseFloat(targetAmount)
      });

      res.status(201).json({
        success: true,
        data: retirementPlan,
        message: 'Retirement plan created successfully'
      });

      logger.info('Retirement plan created via API', { userId, projectedAmount: retirementPlan.projectedAmount });
    } catch (error) {
      logger.error('Error in createRetirementPlan controller', {
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
   * Create debt payoff plan
   * POST /api/analytics/planning/debt-payoff
   */
  createDebtPayoffPlan = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { debts, strategy = 'avalanche' } = req.body;

      if (!debts || !Array.isArray(debts) || debts.length === 0) {
        res.status(400).json({
          success: false,
          message: 'debts array is required and must not be empty'
        });
        return;
      }

      // Validate debt structure
      for (const debt of debts) {
        if (!debt.name || !debt.balance || !debt.interestRate || !debt.minimumPayment) {
          res.status(400).json({
            success: false,
            message: 'Each debt must have: name, balance, interestRate, minimumPayment'
          });
          return;
        }
      }

      const debtPlan = await this.financialPlanningService.createDebtPayoffPlan(
        userId,
        debts,
        strategy
      );

      res.status(201).json({
        success: true,
        data: debtPlan,
        message: 'Debt payoff plan created successfully'
      });

      logger.info('Debt payoff plan created via API', { userId, totalDebt: debtPlan.totalDebt, strategy });
    } catch (error) {
      logger.error('Error in createDebtPayoffPlan controller', {
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
   * Get financial recommendations
   * GET /api/analytics/planning/recommendations
   */
  getFinancialRecommendations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const recommendations = await this.financialPlanningService.getFinancialRecommendations(userId);

      res.status(200).json({
        success: true,
        data: recommendations,
        message: 'Financial recommendations generated successfully'
      });

      logger.info('Financial recommendations generated via API', { userId, recommendationCount: recommendations.length });
    } catch (error) {
      logger.error('Error in getFinancialRecommendations controller', {
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
   * Get financial planning dashboard data
   * GET /api/analytics/planning/dashboard
   */
  getPlanningDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      // Get all planning data
      const [scenarios, recommendations] = await Promise.all([
        this.financialPlanningService.generateFinancialScenarios(userId, 5),
        this.financialPlanningService.getFinancialRecommendations(userId)
      ]);

      const dashboard = {
        scenarios,
        recommendations,
        summary: {
          totalRecommendations: recommendations.length,
          highPriorityRecommendations: recommendations.filter(r => r.priority === 'high').length,
          scenarioCount: scenarios.length
        }
      };

      res.status(200).json({
        success: true,
        data: dashboard,
        message: 'Planning dashboard data retrieved successfully'
      });

      logger.info('Planning dashboard data retrieved via API', { userId });
    } catch (error) {
      logger.error('Error in getPlanningDashboard controller', {
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
