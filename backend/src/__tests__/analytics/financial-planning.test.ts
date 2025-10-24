import { FinancialPlanningService } from '../../modules/financial/analytics/services/financial-planning.service';
import { 
  IFinancialGoal, 
  IFinancialScenario, 
  IRetirementPlan, 
  IDebtPayoffPlan 
} from '../../modules/financial/analytics/services/financial-planning.service';

// Mock dependencies
jest.mock('../../modules/financial/analytics/services/analytics.service', () => ({
  AnalyticsService: jest.fn().mockImplementation(() => ({
    getSpendingAnalysis: jest.fn(),
    getAllBudgetAnalytics: jest.fn(),
    getFinancialInsights: jest.fn(),
    getCashFlowAnalysis: jest.fn()
  }))
}));

jest.mock('../../modules/financial/transactions/services/transaction.service', () => ({
  TransactionService: jest.fn()
}));

jest.mock('../../modules/financial/categories/service/category.service', () => ({
  CategoryService: jest.fn()
}));

jest.mock('../../modules/financial/budgets/services/budget.service', () => ({
  BudgetService: jest.fn()
}));

describe('FinancialPlanningService', () => {
  let financialPlanningService: FinancialPlanningService;
  const mockUserId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    jest.clearAllMocks();
    financialPlanningService = new FinancialPlanningService();
  });

  describe('Financial Goals', () => {
    it('should create a financial goal successfully', async () => {
      const goalData = {
        name: 'Emergency Fund',
        description: 'Build a 6-month emergency fund',
        targetAmount: 10000,
        targetDate: new Date('2025-12-31'),
        priority: 'high' as const,
        category: 'savings' as const,
        status: 'not_started' as const,
        monthlyContribution: 500
      };

      const goal = await financialPlanningService.createFinancialGoal(mockUserId, goalData);

      expect(goal).toBeDefined();
      expect(goal.id).toBeDefined();
      expect(goal.name).toBe(goalData.name);
      expect(goal.targetAmount).toBe(goalData.targetAmount);
      expect(goal.monthlyContribution).toBe(goalData.monthlyContribution);
      expect(goal.currentAmount).toBe(0);
      expect(goal.progressPercentage).toBe(0);
      expect(goal.status).toBe('not_started');
      expect(goal.estimatedCompletionDate).toBeDefined();
      expect(goal.riskLevel).toBeDefined();
    });

    it('should update goal progress correctly', async () => {
      const goalId = 'goal_123';
      const currentAmount = 2500;

      const updatedGoal = await financialPlanningService.updateGoalProgress(mockUserId, goalId, currentAmount);

      expect(updatedGoal).toBeDefined();
      expect(updatedGoal.currentAmount).toBe(currentAmount);
      expect(updatedGoal.progressPercentage).toBe(25); // 2500 / 10000 * 100
      expect(updatedGoal.status).toBe('in_progress');
    });

    it('should mark goal as completed when progress reaches 100%', async () => {
      const goalId = 'goal_123';
      const currentAmount = 10000;

      const updatedGoal = await financialPlanningService.updateGoalProgress(mockUserId, goalId, currentAmount);

      expect(updatedGoal.progressPercentage).toBe(100);
      expect(updatedGoal.status).toBe('completed');
    });
  });

  describe('Financial Scenarios', () => {
    it('should generate optimistic scenario', async () => {
      // Mock current financial data
      const mockCurrentData = {
        spending: {
          totalIncome: 50000,
          totalSpent: 40000
        },
        budgets: [],
        insights: {},
        cashFlow: {}
      };

      // Mock the getCurrentFinancialData method
      (financialPlanningService as any).getCurrentFinancialData = jest.fn().mockResolvedValue(mockCurrentData);

      const scenarios = await financialPlanningService.generateFinancialScenarios(mockUserId, 5);

      expect(scenarios).toHaveLength(3);
      expect(scenarios[0].scenarioType).toBe('optimistic');
      expect(scenarios[0].assumptions.incomeGrowth).toBe(5);
      expect(scenarios[0].assumptions.expenseGrowth).toBe(2);
      expect(scenarios[0].projections).toHaveLength(5);
    });

    it('should generate realistic scenario', async () => {
      const mockCurrentData = {
        spending: { totalIncome: 50000, totalSpent: 40000 },
        budgets: [],
        insights: {},
        cashFlow: {}
      };

      (financialPlanningService as any).getCurrentFinancialData = jest.fn().mockResolvedValue(mockCurrentData);

      const scenarios = await financialPlanningService.generateFinancialScenarios(mockUserId, 3);

      expect(scenarios[1].scenarioType).toBe('realistic');
      expect(scenarios[1].assumptions.incomeGrowth).toBe(3);
      expect(scenarios[1].assumptions.expenseGrowth).toBe(3);
    });

    it('should generate pessimistic scenario', async () => {
      const mockCurrentData = {
        spending: { totalIncome: 50000, totalSpent: 40000 },
        budgets: [],
        insights: {},
        cashFlow: {}
      };

      (financialPlanningService as any).getCurrentFinancialData = jest.fn().mockResolvedValue(mockCurrentData);

      const scenarios = await financialPlanningService.generateFinancialScenarios(mockUserId, 3);

      expect(scenarios[2].scenarioType).toBe('pessimistic');
      expect(scenarios[2].assumptions.incomeGrowth).toBe(1);
      expect(scenarios[2].assumptions.expenseGrowth).toBe(4);
    });
  });

  describe('Retirement Planning', () => {
    it('should create retirement plan successfully', async () => {
      const planData = {
        currentAge: 30,
        retirementAge: 65,
        currentSavings: 10000,
        monthlyContribution: 500,
        expectedReturn: 7,
        inflationRate: 3,
        targetAmount: 1000000
      };

      const retirementPlan = await financialPlanningService.createRetirementPlan(mockUserId, planData);

      expect(retirementPlan).toBeDefined();
      expect(retirementPlan.currentAge).toBe(planData.currentAge);
      expect(retirementPlan.retirementAge).toBe(planData.retirementAge);
      expect(retirementPlan.projectedAmount).toBeGreaterThan(0);
      expect(retirementPlan.recommendations).toBeDefined();
      expect(Array.isArray(retirementPlan.recommendations)).toBe(true);
    });

    it('should calculate retirement projection correctly', () => {
      const currentSavings = 10000;
      const monthlyContribution = 500;
      const expectedReturn = 7;
      const yearsToRetirement = 35;

      const projection = (financialPlanningService as any).calculateRetirementProjection(
        currentSavings,
        monthlyContribution,
        expectedReturn,
        yearsToRetirement
      );

      expect(projection).toBeGreaterThan(0);
      expect(typeof projection).toBe('number');
    });

    it('should generate recommendations for shortfall', async () => {
      const planData = {
        currentAge: 30,
        retirementAge: 65,
        currentSavings: 1000,
        monthlyContribution: 100,
        expectedReturn: 7,
        inflationRate: 3,
        targetAmount: 1000000
      };

      const retirementPlan = await financialPlanningService.createRetirementPlan(mockUserId, planData);

      expect(retirementPlan.shortfall).toBeGreaterThan(0);
      expect(retirementPlan.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Debt Payoff Planning', () => {
    it('should create debt payoff plan with avalanche strategy', async () => {
      const debts = [
        {
          name: 'Credit Card',
          balance: 5000,
          interestRate: 18,
          minimumPayment: 150,
          priority: 1
        },
        {
          name: 'Car Loan',
          balance: 15000,
          interestRate: 6,
          minimumPayment: 300,
          priority: 2
        }
      ];

      const debtPlan = await financialPlanningService.createDebtPayoffPlan(mockUserId, debts, 'avalanche');

      expect(debtPlan).toBeDefined();
      expect(debtPlan.strategy).toBe('avalanche');
      expect(debtPlan.totalDebt).toBe(20000);
      expect(debtPlan.debts).toHaveLength(2);
      expect(debtPlan.timeline).toBeDefined();
      expect(Array.isArray(debtPlan.timeline)).toBe(true);
    });

    it('should create debt payoff plan with snowball strategy', async () => {
      const debts = [
        {
          name: 'Small Loan',
          balance: 2000,
          interestRate: 12,
          minimumPayment: 100,
          priority: 1
        },
        {
          name: 'Large Loan',
          balance: 10000,
          interestRate: 8,
          minimumPayment: 200,
          priority: 2
        }
      ];

      const debtPlan = await financialPlanningService.createDebtPayoffPlan(mockUserId, debts, 'snowball');

      expect(debtPlan.strategy).toBe('snowball');
      expect(debtPlan.debts[0].balance).toBeLessThanOrEqual(debtPlan.debts[1].balance);
    });

    it('should calculate payoff timeline correctly', () => {
      const debts = [
        {
          id: 'debt1',
          name: 'Test Debt',
          balance: 1000,
          interestRate: 12,
          minimumPayment: 100,
          priority: 1
        }
      ];

      const timeline = (financialPlanningService as any).calculatePayoffTimeline(debts, 100);

      expect(timeline).toBeDefined();
      expect(Array.isArray(timeline)).toBe(true);
      expect(timeline.length).toBeGreaterThan(0);
      expect(timeline[0]).toHaveProperty('month');
      expect(timeline[0]).toHaveProperty('remainingDebt');
      expect(timeline[0]).toHaveProperty('payment');
      expect(timeline[0]).toHaveProperty('interest');
      expect(timeline[0]).toHaveProperty('principal');
    });
  });

  describe('Financial Recommendations', () => {
    it('should generate financial recommendations', async () => {
      const mockCurrentData = {
        spending: {
          totalIncome: 50000,
          totalSpent: 45000
        },
        budgets: [
          {
            utilizationPercentage: 120,
            budgetName: 'Test Budget'
          }
        ],
        insights: {},
        cashFlow: {}
      };

      (financialPlanningService as any).getCurrentFinancialData = jest.fn().mockResolvedValue(mockCurrentData);

      const recommendations = await financialPlanningService.getFinancialRecommendations(mockUserId);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('category');
      expect(recommendations[0]).toHaveProperty('priority');
      expect(recommendations[0]).toHaveProperty('title');
      expect(recommendations[0]).toHaveProperty('description');
      expect(recommendations[0]).toHaveProperty('action');
    });

    it('should identify budget overruns', async () => {
      const mockCurrentData = {
        spending: { totalIncome: 50000, totalSpent: 40000 },
        budgets: [
          { utilizationPercentage: 150, budgetName: 'Over Budget' },
          { utilizationPercentage: 80, budgetName: 'Under Budget' }
        ],
        insights: {},
        cashFlow: {}
      };

      (financialPlanningService as any).getCurrentFinancialData = jest.fn().mockResolvedValue(mockCurrentData);

      const recommendations = await financialPlanningService.getFinancialRecommendations(mockUserId);

      const budgetRecommendations = recommendations.filter(r => r.category === 'budget');
      expect(budgetRecommendations.length).toBeGreaterThan(0);
      expect(budgetRecommendations[0].priority).toBe('high');
    });

    it('should identify low savings rate', async () => {
      const mockCurrentData = {
        spending: {
          totalIncome: 50000,
          totalSpent: 48000 // 4% savings rate
        },
        budgets: [],
        insights: {},
        cashFlow: {}
      };

      (financialPlanningService as any).getCurrentFinancialData = jest.fn().mockResolvedValue(mockCurrentData);

      const recommendations = await financialPlanningService.getFinancialRecommendations(mockUserId);

      const savingsRecommendations = recommendations.filter(r => r.category === 'savings');
      expect(savingsRecommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Helper Methods', () => {
    it('should calculate estimated completion date correctly', () => {
      const targetAmount = 10000;
      const monthlyContribution = 500;
      const expectedMonths = 20;

      const completionDate = (financialPlanningService as any).calculateEstimatedCompletionDate(
        targetAmount,
        monthlyContribution
      );

      expect(completionDate).toBeInstanceOf(Date);
      expect(completionDate.getTime()).toBeGreaterThan(Date.now());
    });

    it('should assess risk level correctly', () => {
      const targetAmount = 10000;
      const monthlyContribution = 500;
      const targetDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

      const riskLevel = (financialPlanningService as any).assessRiskLevel(
        targetAmount,
        monthlyContribution,
        targetDate
      );

      expect(['low', 'medium', 'high']).toContain(riskLevel);
    });

    it('should generate unique IDs', () => {
      const id1 = (financialPlanningService as any).generateId();
      const id2 = (financialPlanningService as any).generateId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in goal creation gracefully', async () => {
      // Mock an error in the service
      jest.spyOn(financialPlanningService as any, 'generateId').mockImplementation(() => {
        throw new Error('ID generation failed');
      });

      const goalData = {
        name: 'Test Goal',
        description: 'Test description',
        targetAmount: 1000,
        targetDate: new Date('2025-12-31'),
        priority: 'medium' as const,
        category: 'savings' as const,
        status: 'not_started' as const,
        monthlyContribution: 100
      };

      await expect(financialPlanningService.createFinancialGoal(mockUserId, goalData))
        .rejects.toThrow('ID generation failed');
    });

    it('should handle missing financial data gracefully', async () => {
      (financialPlanningService as any).getCurrentFinancialData = jest.fn().mockResolvedValue({
        spending: null,
        budgets: null,
        insights: null,
        cashFlow: null
      });

      const recommendations = await financialPlanningService.getFinancialRecommendations(mockUserId);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });
});
