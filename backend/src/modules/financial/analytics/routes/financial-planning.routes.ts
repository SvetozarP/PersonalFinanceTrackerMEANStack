import { Router } from 'express';
import { FinancialPlanningController } from '../controllers/financial-planning.controller';
import { authenticateToken } from '../../../auth/auth.middleware';
import { validateRequest } from '../../../../shared/middleware/validation.middleware';
import Joi from 'joi';

const router = Router();
const financialPlanningController = new FinancialPlanningController();

// Apply authentication middleware to all planning routes
router.use(authenticateToken);

/**
 * @route   POST /api/analytics/planning/goals
 * @desc    Create a financial goal
 * @access  Private
 * @body    name, description, targetAmount, targetDate, priority, category, monthlyContribution
 */
router.post(
  '/goals',
  validateRequest(Joi.object({
    name: Joi.string().required().min(1).max(100),
    description: Joi.string().optional().max(500),
    targetAmount: Joi.number().positive().required(),
    targetDate: Joi.date().iso().min('now').required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
    category: Joi.string().valid('savings', 'debt_payoff', 'investment', 'purchase', 'emergency').required(),
    monthlyContribution: Joi.number().positive().required()
  }), 'body'),
  financialPlanningController.createFinancialGoal
);

/**
 * @route   PUT /api/analytics/planning/goals/:goalId/progress
 * @desc    Update financial goal progress
 * @access  Private
 * @param   goalId - Goal ID
 * @body    currentAmount
 */
router.put(
  '/goals/:goalId/progress',
  validateRequest(Joi.object({
    currentAmount: Joi.number().min(0).required()
  }), 'body'),
  financialPlanningController.updateGoalProgress
);

/**
 * @route   GET /api/analytics/planning/scenarios
 * @desc    Generate financial scenarios
 * @access  Private
 * @query   timeHorizon (optional, default 10)
 */
router.get(
  '/scenarios',
  validateRequest(Joi.object({
    timeHorizon: Joi.number().integer().min(1).max(50).optional().default(10)
  }), 'query'),
  financialPlanningController.generateFinancialScenarios
);

/**
 * @route   POST /api/analytics/planning/retirement
 * @desc    Create retirement plan
 * @access  Private
 * @body    currentAge, retirementAge, currentSavings, monthlyContribution, expectedReturn, inflationRate, targetAmount
 */
router.post(
  '/retirement',
  validateRequest(Joi.object({
    currentAge: Joi.number().integer().min(18).max(100).required(),
    retirementAge: Joi.number().integer().min(50).max(100).required(),
    currentSavings: Joi.number().min(0).required(),
    monthlyContribution: Joi.number().min(0).required(),
    expectedReturn: Joi.number().min(0).max(20).required(),
    inflationRate: Joi.number().min(0).max(10).optional().default(3),
    targetAmount: Joi.number().positive().required()
  }), 'body'),
  financialPlanningController.createRetirementPlan
);

/**
 * @route   POST /api/analytics/planning/debt-payoff
 * @desc    Create debt payoff plan
 * @access  Private
 * @body    debts, strategy
 */
router.post(
  '/debt-payoff',
  validateRequest(Joi.object({
    debts: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        balance: Joi.number().positive().required(),
        interestRate: Joi.number().min(0).max(50).required(),
        minimumPayment: Joi.number().positive().required(),
        priority: Joi.number().integer().min(1).optional()
      })
    ).min(1).required(),
    strategy: Joi.string().valid('snowball', 'avalanche', 'hybrid').optional().default('avalanche')
  }), 'body'),
  financialPlanningController.createDebtPayoffPlan
);

/**
 * @route   GET /api/analytics/planning/recommendations
 * @desc    Get financial recommendations
 * @access  Private
 */
router.get(
  '/recommendations',
  financialPlanningController.getFinancialRecommendations
);

/**
 * @route   GET /api/analytics/planning/dashboard
 * @desc    Get financial planning dashboard data
 * @access  Private
 */
router.get(
  '/dashboard',
  financialPlanningController.getPlanningDashboard
);

export default router;

