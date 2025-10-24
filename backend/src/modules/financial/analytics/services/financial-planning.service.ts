import { AnalyticsService } from './analytics.service';
import { TransactionService } from '../../transactions/services/transaction.service';
import { CategoryService } from '../../categories/service/category.service';
import { BudgetService } from '../../budgets/services/budget.service';
import { logger } from '../../../../shared/services/logger.service';
import { 
  IAnalyticsQuery, 
  ISpendingAnalysis, 
  IBudgetAnalytics, 
  IFinancialInsights 
} from '../interfaces/analytics.interface';

export interface IFinancialGoal {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'savings' | 'debt_payoff' | 'investment' | 'purchase' | 'emergency';
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  monthlyContribution: number;
  progressPercentage: number;
  estimatedCompletionDate: Date;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface IFinancialScenario {
  id: string;
  name: string;
  description: string;
  scenarioType: 'optimistic' | 'realistic' | 'pessimistic';
  assumptions: {
    incomeGrowth: number; // percentage
    expenseGrowth: number; // percentage
    inflationRate: number; // percentage
    investmentReturn: number; // percentage
  };
  projections: Array<{
    year: number;
    income: number;
    expenses: number;
    savings: number;
    netWorth: number;
    goalProgress: number;
  }>;
  recommendations: Array<{
    type: 'income' | 'expense' | 'savings' | 'investment';
    priority: 'high' | 'medium' | 'low';
    message: string;
    potentialImpact: number;
    actionRequired: string;
  }>;
}

export interface IRetirementPlan {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyContribution: number;
  expectedReturn: number;
  inflationRate: number;
  targetAmount: number;
  projectedAmount: number;
  shortfall: number;
  recommendations: Array<{
    type: 'increase_contribution' | 'delay_retirement' | 'reduce_target' | 'increase_return';
    message: string;
    impact: number;
  }>;
}

export interface IDebtPayoffPlan {
  debts: Array<{
    id: string;
    name: string;
    balance: number;
    interestRate: number;
    minimumPayment: number;
    priority: number;
  }>;
  strategy: 'snowball' | 'avalanche' | 'hybrid';
  totalDebt: number;
  monthlyPayment: number;
  payoffTime: number; // months
  totalInterest: number;
  savings: number;
  timeline: Array<{
    month: number;
    remainingDebt: number;
    payment: number;
    interest: number;
    principal: number;
  }>;
}

export class FinancialPlanningService {
  private analyticsService: AnalyticsService;
  private transactionService: TransactionService;
  private categoryService: CategoryService;
  private budgetService: BudgetService;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.transactionService = new TransactionService();
    this.categoryService = new CategoryService();
    this.budgetService = new BudgetService(
      null as any,
      null as any,
      null as any
    );
  }

  /**
   * Create a financial goal
   */
  async createFinancialGoal(userId: string, goalData: Omit<IFinancialGoal, 'id' | 'currentAmount' | 'progressPercentage' | 'estimatedCompletionDate' | 'riskLevel'>): Promise<IFinancialGoal> {
    try {
      logger.info('Creating financial goal', { userId, goalData });

      const goal: IFinancialGoal = {
        id: this.generateId(),
        ...goalData,
        currentAmount: 0,
        progressPercentage: 0,
        estimatedCompletionDate: this.calculateEstimatedCompletionDate(goalData.targetAmount, goalData.monthlyContribution),
        riskLevel: this.assessRiskLevel(goalData.targetAmount, goalData.monthlyContribution, goalData.targetDate)
      };

      // In a real implementation, this would be saved to the database
      logger.info('Financial goal created', { goalId: goal.id, userId });
      
      return goal;
    } catch (error) {
      logger.error('Error creating financial goal', { error: (error as Error).message, userId, goalData });
      throw error;
    }
  }

  /**
   * Update financial goal progress
   */
  async updateGoalProgress(userId: string, goalId: string, currentAmount: number): Promise<IFinancialGoal> {
    try {
      logger.info('Updating goal progress', { userId, goalId, currentAmount });

      // In a real implementation, this would fetch from database
      const goal: IFinancialGoal = {
        id: goalId,
        name: 'Sample Goal',
        description: 'Sample goal description',
        targetAmount: 10000,
        currentAmount,
        targetDate: new Date('2025-12-31'),
        priority: 'medium',
        category: 'savings',
        status: 'in_progress',
        monthlyContribution: 500,
        progressPercentage: (currentAmount / 10000) * 100,
        estimatedCompletionDate: new Date('2025-12-31'),
        riskLevel: 'medium'
      };

      goal.progressPercentage = (currentAmount / goal.targetAmount) * 100;
      goal.status = goal.progressPercentage >= 100 ? 'completed' : 'in_progress';

      logger.info('Goal progress updated', { goalId, progressPercentage: goal.progressPercentage });
      
      return goal;
    } catch (error) {
      logger.error('Error updating goal progress', { error: (error as Error).message, userId, goalId });
      throw error;
    }
  }

  /**
   * Generate financial scenarios
   */
  async generateFinancialScenarios(userId: string, timeHorizon: number = 10): Promise<IFinancialScenario[]> {
    try {
      logger.info('Generating financial scenarios', { userId, timeHorizon });

      // Get current financial data
      const currentData = await this.getCurrentFinancialData(userId);

      const scenarios: IFinancialScenario[] = [
        this.createOptimisticScenario(currentData, timeHorizon),
        this.createRealisticScenario(currentData, timeHorizon),
        this.createPessimisticScenario(currentData, timeHorizon)
      ];

      logger.info('Financial scenarios generated', { userId, scenarioCount: scenarios.length });
      
      return scenarios;
    } catch (error) {
      logger.error('Error generating financial scenarios', { error: (error as Error).message, userId });
      throw error;
    }
  }

  /**
   * Create retirement plan
   */
  async createRetirementPlan(userId: string, planData: Omit<IRetirementPlan, 'projectedAmount' | 'shortfall' | 'recommendations'>): Promise<IRetirementPlan> {
    try {
      logger.info('Creating retirement plan', { userId, planData });

      const yearsToRetirement = planData.retirementAge - planData.currentAge;
      const projectedAmount = this.calculateRetirementProjection(
        planData.currentSavings,
        planData.monthlyContribution,
        planData.expectedReturn,
        yearsToRetirement
      );

      const shortfall = Math.max(0, planData.targetAmount - projectedAmount);
      const recommendations = this.generateRetirementRecommendations(
        {
          ...planData,
          projectedAmount,
          shortfall,
          recommendations: []
        },
        projectedAmount,
        shortfall
      );

      const retirementPlan: IRetirementPlan = {
        currentAge: planData.currentAge,
        retirementAge: planData.retirementAge,
        currentSavings: planData.currentSavings,
        monthlyContribution: planData.monthlyContribution,
        expectedReturn: planData.expectedReturn,
        inflationRate: planData.inflationRate,
        targetAmount: planData.targetAmount,
        projectedAmount,
        shortfall,
        recommendations
      };

      logger.info('Retirement plan created', { userId, projectedAmount, shortfall });
      
      return retirementPlan;
    } catch (error) {
      logger.error('Error creating retirement plan', { error: (error as Error).message, userId, planData });
      throw error;
    }
  }

  /**
   * Create debt payoff plan
   */
  async createDebtPayoffPlan(userId: string, debts: Array<Omit<IDebtPayoffPlan['debts'][0], 'id'>>, strategy: 'snowball' | 'avalanche' | 'hybrid' = 'avalanche'): Promise<IDebtPayoffPlan> {
    try {
      logger.info('Creating debt payoff plan', { userId, debts, strategy });

      const debtPlan = this.calculateDebtPayoffPlan(debts, strategy);
      
      logger.info('Debt payoff plan created', { userId, totalDebt: debtPlan.totalDebt, payoffTime: debtPlan.payoffTime });
      
      return debtPlan;
    } catch (error) {
      logger.error('Error creating debt payoff plan', { error: (error as Error).message, userId, debts });
      throw error;
    }
  }

  /**
   * Get financial recommendations
   */
  async getFinancialRecommendations(userId: string): Promise<Array<{
    category: 'budget' | 'savings' | 'investment' | 'debt' | 'insurance';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
    potentialImpact: number;
    timeframe: string;
  }>> {
    try {
      logger.info('Generating financial recommendations', { userId });

      const currentData = await this.getCurrentFinancialData(userId);
      const recommendations = this.analyzeFinancialHealth(currentData);
      
      logger.info('Financial recommendations generated', { userId, recommendationCount: recommendations.length });
      
      return recommendations;
    } catch (error) {
      logger.error('Error generating financial recommendations', { error: (error as Error).message, userId });
      throw error;
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async getCurrentFinancialData(userId: string): Promise<any> {
    const query: IAnalyticsQuery = {
      userId,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      groupBy: 'month'
    };

    const [spending, budgets, insights, cashFlow] = await Promise.all([
      this.analyticsService.getSpendingAnalysis(query),
      this.analyticsService.getAllBudgetAnalytics(userId, query.startDate, query.endDate),
      this.analyticsService.getFinancialInsights(userId, query.startDate, query.endDate),
      this.analyticsService.getCashFlowAnalysis(userId, query.startDate, query.endDate)
    ]);

    return { spending, budgets, insights, cashFlow };
  }

  private createOptimisticScenario(currentData: any, timeHorizon: number): IFinancialScenario {
    return {
      id: this.generateId(),
      name: 'Optimistic Scenario',
      description: 'Best-case scenario with high growth and low inflation',
      scenarioType: 'optimistic',
      assumptions: {
        incomeGrowth: 5,
        expenseGrowth: 2,
        inflationRate: 2,
        investmentReturn: 8
      },
      projections: this.generateProjections(currentData, { incomeGrowth: 5, expenseGrowth: 2, inflationRate: 2, investmentReturn: 8 }, timeHorizon),
      recommendations: []
    };
  }

  private createRealisticScenario(currentData: any, timeHorizon: number): IFinancialScenario {
    return {
      id: this.generateId(),
      name: 'Realistic Scenario',
      description: 'Most likely scenario based on historical averages',
      scenarioType: 'realistic',
      assumptions: {
        incomeGrowth: 3,
        expenseGrowth: 3,
        inflationRate: 3,
        investmentReturn: 6
      },
      projections: this.generateProjections(currentData, { incomeGrowth: 3, expenseGrowth: 3, inflationRate: 3, investmentReturn: 6 }, timeHorizon),
      recommendations: []
    };
  }

  private createPessimisticScenario(currentData: any, timeHorizon: number): IFinancialScenario {
    return {
      id: this.generateId(),
      name: 'Pessimistic Scenario',
      description: 'Worst-case scenario with low growth and high inflation',
      scenarioType: 'pessimistic',
      assumptions: {
        incomeGrowth: 1,
        expenseGrowth: 4,
        inflationRate: 4,
        investmentReturn: 3
      },
      projections: this.generateProjections(currentData, { incomeGrowth: 1, expenseGrowth: 4, inflationRate: 4, investmentReturn: 3 }, timeHorizon),
      recommendations: []
    };
  }

  private generateProjections(currentData: any, assumptions: any, timeHorizon: number): Array<{
    year: number;
    income: number;
    expenses: number;
    savings: number;
    netWorth: number;
    goalProgress: number;
  }> {
    const projections = [];
    let currentIncome = currentData.spending?.totalIncome || 50000;
    let currentExpenses = currentData.spending?.totalSpent || 40000;
    let currentNetWorth = 10000;

    for (let year = 1; year <= timeHorizon; year++) {
      currentIncome *= (1 + assumptions.incomeGrowth / 100);
      currentExpenses *= (1 + assumptions.expenseGrowth / 100);
      const savings = currentIncome - currentExpenses;
      currentNetWorth += savings;
      currentNetWorth *= (1 + assumptions.investmentReturn / 100);

      projections.push({
        year,
        income: Math.round(currentIncome),
        expenses: Math.round(currentExpenses),
        savings: Math.round(savings),
        netWorth: Math.round(currentNetWorth),
        goalProgress: Math.min(100, (currentNetWorth / 100000) * 100) // Assuming 100k goal
      });
    }

    return projections;
  }

  private calculateRetirementProjection(currentSavings: number, monthlyContribution: number, expectedReturn: number, yearsToRetirement: number): number {
    const monthlyReturn = expectedReturn / 12 / 100;
    const totalMonths = yearsToRetirement * 12;
    
    // Future value of current savings
    const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + expectedReturn / 100, yearsToRetirement);
    
    // Future value of monthly contributions (annuity)
    const futureValueOfContributions = monthlyContribution * 
      ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
    
    return Math.round(futureValueOfCurrentSavings + futureValueOfContributions);
  }

  private generateRetirementRecommendations(planData: IRetirementPlan, projectedAmount: number, shortfall: number): Array<{
    type: 'increase_contribution' | 'delay_retirement' | 'reduce_target' | 'increase_return';
    message: string;
    impact: number;
  }> {
    const recommendations = [];

    if (shortfall > 0) {
      // Calculate required monthly contribution to meet target
      const requiredContribution = this.calculateRequiredContribution(
        planData.currentSavings,
        planData.targetAmount,
        planData.expectedReturn,
        planData.retirementAge - planData.currentAge
      );

      if (requiredContribution > planData.monthlyContribution) {
      recommendations.push({
        type: 'increase_contribution' as const,
        message: `Increase monthly contribution to $${Math.round(requiredContribution)} to meet your retirement goal`,
        impact: requiredContribution - planData.monthlyContribution
      });
      }

      recommendations.push({
        type: 'delay_retirement' as const,
        message: `Consider delaying retirement by ${Math.ceil(shortfall / (projectedAmount * 0.04))} years to meet your goal`,
        impact: shortfall
      });
    }

    return recommendations;
  }

  private calculateRequiredContribution(currentSavings: number, targetAmount: number, expectedReturn: number, yearsToRetirement: number): number {
    const monthlyReturn = expectedReturn / 12 / 100;
    const totalMonths = yearsToRetirement * 12;
    
    const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + expectedReturn / 100, yearsToRetirement);
    const remainingNeeded = targetAmount - futureValueOfCurrentSavings;
    
    if (remainingNeeded <= 0) return 0;
    
    return remainingNeeded / ((Math.pow(1 + monthlyReturn, totalMonths) - 1) / monthlyReturn);
  }

  private calculateDebtPayoffPlan(debts: Array<Omit<IDebtPayoffPlan['debts'][0], 'id'>>, strategy: 'snowball' | 'avalanche' | 'hybrid'): IDebtPayoffPlan {
    const totalDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);
    const totalMinimumPayment = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
    
    // Sort debts based on strategy
    let sortedDebts = [...debts];
    if (strategy === 'avalanche') {
      sortedDebts.sort((a, b) => b.interestRate - a.interestRate);
    } else if (strategy === 'snowball') {
      sortedDebts.sort((a, b) => a.balance - b.balance);
    }

    // Add IDs to debts
    const debtsWithIds = sortedDebts.map((debt, index) => ({
      ...debt,
      id: `debt_${index + 1}`
    }));

    // Calculate payoff timeline
    const timeline = this.calculatePayoffTimeline(debtsWithIds, totalMinimumPayment);
    const payoffTime = timeline.length;
    const totalInterest = timeline.reduce((sum, payment) => sum + payment.interest, 0);
    const savings = this.calculateInterestSavings(debts, timeline);

    return {
      debts: debtsWithIds,
      strategy,
      totalDebt,
      monthlyPayment: totalMinimumPayment,
      payoffTime,
      totalInterest,
      savings,
      timeline
    };
  }

  private calculatePayoffTimeline(debts: IDebtPayoffPlan['debts'], monthlyPayment: number): Array<{
    month: number;
    remainingDebt: number;
    payment: number;
    interest: number;
    principal: number;
  }> {
    const timeline = [];
    let currentDebts = debts.map(debt => ({ ...debt, balance: debt.balance }));
    let month = 0;
    let totalRemainingDebt = debts.reduce((sum, debt) => sum + debt.balance, 0);

    while (totalRemainingDebt > 0 && month < 360) { // Max 30 years
      month++;
      let totalInterest = 0;
      let totalPrincipal = 0;

      // Calculate interest for each debt
      currentDebts.forEach(debt => {
        const monthlyInterest = debt.balance * (debt.interestRate / 12 / 100);
        totalInterest += monthlyInterest;
        debt.balance += monthlyInterest;
      });

      // Apply payment
      let remainingPayment = monthlyPayment;
      currentDebts.forEach(debt => {
        if (remainingPayment > 0 && debt.balance > 0) {
          const payment = Math.min(remainingPayment, debt.balance);
          debt.balance -= payment;
          totalPrincipal += payment;
          remainingPayment -= payment;
        }
      });

      totalRemainingDebt = currentDebts.reduce((sum, debt) => sum + debt.balance, 0);

      timeline.push({
        month,
        remainingDebt: totalRemainingDebt,
        payment: monthlyPayment,
        interest: totalInterest,
        principal: totalPrincipal
      });
    }

    return timeline;
  }

  private calculateInterestSavings(originalDebts: Array<Omit<IDebtPayoffPlan['debts'][0], 'id'>>, timeline: IDebtPayoffPlan['timeline']): number {
    // Calculate what interest would be paid with minimum payments only
    const minimumOnlyInterest = originalDebts.reduce((sum, debt) => {
      const monthlyInterest = debt.balance * (debt.interestRate / 12 / 100);
      return sum + (monthlyInterest * 12 * 10); // Assume 10 years of minimum payments
    }, 0);

    const actualInterest = timeline.reduce((sum, payment) => sum + payment.interest, 0);
    
    return Math.max(0, minimumOnlyInterest - actualInterest);
  }

  private analyzeFinancialHealth(currentData: any): Array<{
    category: 'budget' | 'savings' | 'investment' | 'debt' | 'insurance';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
    potentialImpact: number;
    timeframe: string;
  }> {
    const recommendations = [];

    // Budget analysis
    if (currentData.budgets && currentData.budgets.length > 0) {
      const overBudgetCount = currentData.budgets.filter((budget: any) => budget.utilizationPercentage > 100).length;
      if (overBudgetCount > 0) {
        recommendations.push({
          category: 'budget' as const,
          priority: 'high' as const,
          title: 'Budget Overruns Detected',
          description: `${overBudgetCount} budget(s) are over their allocated amounts`,
          action: 'Review and adjust spending in over-budget categories',
          potentialImpact: 1000,
          timeframe: '1 month'
        });
      }
    }

    // Savings analysis
    const savingsRate = currentData.spending ? 
      ((currentData.spending.totalIncome - currentData.spending.totalSpent) / currentData.spending.totalIncome) * 100 : 0;
    
    if (savingsRate < 20) {
        recommendations.push({
          category: 'savings' as const,
          priority: 'medium' as const,
          title: 'Low Savings Rate',
          description: `Current savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20%`,
          action: 'Increase monthly savings by reducing discretionary spending',
          potentialImpact: 500,
          timeframe: '3 months'
        });
    }

    // Investment analysis
    if (currentData.spending && currentData.spending.totalIncome > 50000) {
      recommendations.push({
        category: 'investment' as const,
        priority: 'medium' as const,
        title: 'Consider Investment Opportunities',
        description: 'With your income level, consider investing for long-term growth',
        action: 'Open an investment account and start with index funds',
        potentialImpact: 2000,
        timeframe: '6 months'
      });
    }

    return recommendations;
  }

  private calculateEstimatedCompletionDate(targetAmount: number, monthlyContribution: number): Date {
    if (monthlyContribution <= 0) return new Date('2099-12-31');
    
    const monthsToComplete = Math.ceil(targetAmount / monthlyContribution);
    const completionDate = new Date();
    completionDate.setMonth(completionDate.getMonth() + monthsToComplete);
    
    return completionDate;
  }

  private assessRiskLevel(targetAmount: number, monthlyContribution: number, targetDate: Date): 'low' | 'medium' | 'high' {
    const monthsToTarget = Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30));
    const requiredMonthlyContribution = targetAmount / monthsToTarget;
    
    if (monthlyContribution >= requiredMonthlyContribution * 1.2) return 'low';
    if (monthlyContribution >= requiredMonthlyContribution) return 'medium';
    return 'high';
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
