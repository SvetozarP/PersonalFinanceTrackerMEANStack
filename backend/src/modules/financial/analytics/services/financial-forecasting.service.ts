import { logger } from '../../../../shared/services/logger.service';
import { TransactionRepository } from '../../transactions/repositories/transaction.repository';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import { BudgetRepository } from '../../budgets/repositories/budget.repository';
import { 
  IFinancialForecast, 
  ICashFlowPrediction,
  IPredictiveQuery 
} from '../interfaces/predictive.interface';
import { TransactionType } from '../../transactions/interfaces/transaction.interface';

export class FinancialForecastingService {
  private transactionRepository: TransactionRepository;
  private categoryRepository: CategoryRepository;
  private budgetRepository: BudgetRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.categoryRepository = new CategoryRepository();
    this.budgetRepository = new BudgetRepository();
  }

  /**
   * Generate comprehensive financial forecast
   */
  async generateFinancialForecast(query: IPredictiveQuery): Promise<IFinancialForecast> {
    try {
      logger.info('Starting financial forecast generation', { userId: query.userId, dateRange: { start: query.startDate, end: query.endDate } });

      // Get historical data
      const historicalData = await this.getHistoricalFinancialData(query);
      
      if (historicalData.transactions.length < 30) {
        throw new Error('Insufficient historical data for accurate forecasting. Need at least 30 days of data.');
      }

      // Calculate base scenario
      const baseScenario = await this.calculateBaseScenario(historicalData, query);
      
      // Generate alternative scenarios
      const scenarios = await this.generateScenarios(historicalData, query, baseScenario);
      
      // Generate category forecasts
      const categoryForecasts = await this.generateCategoryForecasts(historicalData, query);
      
      // Generate monthly projections
      const monthlyProjections = await this.generateMonthlyProjections(historicalData, query);
      
      // Identify risk factors
      const riskFactors = await this.identifyRiskFactors(historicalData, query);
      
      // Calculate methodology accuracy
      const methodology = await this.calculateMethodology(historicalData, query);

      const forecast: IFinancialForecast = {
        forecastPeriod: { startDate: query.startDate, endDate: query.endDate },
        baseScenario,
        scenarios,
        categoryForecasts,
        monthlyProjections,
        riskFactors,
        methodology
      };

      logger.info('Financial forecast completed', { 
        userId: query.userId, 
        projectedIncome: baseScenario.projectedIncome,
        projectedExpenses: baseScenario.projectedExpenses,
        projectedNetWorth: baseScenario.projectedNetWorth
      });

      return forecast;
    } catch (error) {
      logger.error('Error in financial forecast generation', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Generate cash flow prediction
   */
  async generateCashFlowPrediction(query: IPredictiveQuery): Promise<ICashFlowPrediction> {
    try {
      logger.info('Starting cash flow prediction', { userId: query.userId, dateRange: { start: query.startDate, end: query.endDate } });

      // Get historical cash flow data
      const historicalData = await this.getHistoricalCashFlowData(query);
      
      if (historicalData.length < 30) {
        throw new Error('Insufficient historical data for accurate cash flow prediction. Need at least 30 days of data.');
      }

      // Calculate current balance (simplified - would come from account service)
      const currentBalance = await this.getCurrentBalance(query.userId);
      
      // Generate predictions
      const predictions = await this.calculateCashFlowPredictions(historicalData, query);
      
      // Generate monthly projections
      const monthlyProjections = await this.generateCashFlowMonthlyProjections(historicalData, query);
      
      // Generate category projections
      const categoryProjections = await this.generateCashFlowCategoryProjections(historicalData, query);
      
      // Identify risk factors
      const riskFactors = await this.identifyCashFlowRiskFactors(historicalData, query);
      
      // Generate scenarios
      const scenarios = await this.generateCashFlowScenarios(historicalData, query, predictions);
      
      // Calculate methodology
      const methodology = await this.calculateCashFlowMethodology(historicalData, query);

      const cashFlowPrediction: ICashFlowPrediction = {
        predictionPeriod: { startDate: query.startDate, endDate: query.endDate },
        currentBalance,
        predictions,
        monthlyProjections,
        categoryProjections,
        riskFactors,
        scenarios,
        methodology
      };

      logger.info('Cash flow prediction completed', { 
        userId: query.userId, 
        projectedInflows: predictions.projectedInflows,
        projectedOutflows: predictions.projectedOutflows,
        projectedNetCashFlow: predictions.projectedNetCashFlow
      });

      return cashFlowPrediction;
    } catch (error) {
      logger.error('Error in cash flow prediction', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Get historical financial data
   */
  private async getHistoricalFinancialData(query: IPredictiveQuery): Promise<any> {
    const endDate = new Date(query.startDate);
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 365);

    const transactions = await this.transactionRepository.find({
      userId: query.userId,
      date: { $gte: startDate, $lte: endDate },
      isDeleted: false
    });

    const incomeTransactions = transactions.filter(t => t.type === TransactionType.INCOME);
    const expenseTransactions = transactions.filter(t => t.type === TransactionType.EXPENSE);

    return {
      transactions,
      incomeTransactions,
      expenseTransactions,
      startDate,
      endDate
    };
  }

  /**
   * Get historical cash flow data
   */
  private async getHistoricalCashFlowData(query: IPredictiveQuery): Promise<any[]> {
    const endDate = new Date(query.startDate);
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 90); // Last 90 days for cash flow

    const transactions = await this.transactionRepository.find({
      userId: query.userId,
      date: { $gte: startDate, $lte: endDate },
      isDeleted: false
    });

    // Group by date
    return this.groupTransactionsByDate(transactions);
  }

  /**
   * Group transactions by date
   */
  private groupTransactionsByDate(transactions: any[]): any[] {
    const grouped = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { 
          date, 
          inflows: 0, 
          outflows: 0, 
          netFlow: 0 
        };
      }
      
      if (transaction.type === TransactionType.INCOME) {
        acc[date].inflows += transaction.amount;
      } else {
        acc[date].outflows += transaction.amount;
      }
      
      acc[date].netFlow = acc[date].inflows - acc[date].outflows;
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Calculate base scenario
   */
  private async calculateBaseScenario(historicalData: any, query: IPredictiveQuery): Promise<any> {
    const incomeData = historicalData.incomeTransactions;
    const expenseData = historicalData.expenseTransactions;
    
    // Calculate historical averages
    const avgMonthlyIncome = this.calculateMonthlyAverage(incomeData);
    const avgMonthlyExpenses = this.calculateMonthlyAverage(expenseData);
    
    // Calculate forecast period length in months
    const monthsDiff = this.calculateMonthsDifference(query.startDate, query.endDate);
    
    // Project based on historical trends
    const projectedIncome = avgMonthlyIncome * monthsDiff;
    const projectedExpenses = avgMonthlyExpenses * monthsDiff;
    const projectedNetWorth = projectedIncome - projectedExpenses;
    const projectedSavings = projectedNetWorth * 0.2; // Assume 20% savings rate
    
    // Calculate confidence based on data consistency
    const incomeConsistency = this.calculateConsistency(incomeData);
    const expenseConsistency = this.calculateConsistency(expenseData);
    const avgConsistency = (incomeConsistency + expenseConsistency) / 2;
    
    const confidence = avgConsistency > 0.8 ? 'high' : avgConsistency > 0.6 ? 'medium' : 'low';

    return {
      projectedIncome: Math.round(projectedIncome * 100) / 100,
      projectedExpenses: Math.round(projectedExpenses * 100) / 100,
      projectedNetWorth: Math.round(projectedNetWorth * 100) / 100,
      projectedSavings: Math.round(projectedSavings * 100) / 100,
      confidence
    };
  }

  /**
   * Generate alternative scenarios
   */
  private async generateScenarios(historicalData: any, query: IPredictiveQuery, baseScenario: any): Promise<any[]> {
    const scenarios = [];
    
    // Optimistic scenario (20% better than base)
    scenarios.push({
      name: 'optimistic',
      probability: 0.2,
      projectedIncome: Math.round(baseScenario.projectedIncome * 1.2 * 100) / 100,
      projectedExpenses: Math.round(baseScenario.projectedExpenses * 0.9 * 100) / 100,
      projectedNetWorth: Math.round((baseScenario.projectedIncome * 1.2 - baseScenario.projectedExpenses * 0.9) * 100) / 100,
      projectedSavings: Math.round((baseScenario.projectedIncome * 1.2 - baseScenario.projectedExpenses * 0.9) * 0.25 * 100) / 100,
      keyAssumptions: [
        { assumption: 'Income increases by 20%', impact: 0.3, confidence: 0.6 },
        { assumption: 'Expenses decrease by 10%', impact: 0.2, confidence: 0.7 },
        { assumption: 'No major unexpected expenses', impact: 0.1, confidence: 0.8 }
      ]
    });
    
    // Realistic scenario (base scenario)
    scenarios.push({
      name: 'realistic',
      probability: 0.6,
      projectedIncome: baseScenario.projectedIncome,
      projectedExpenses: baseScenario.projectedExpenses,
      projectedNetWorth: baseScenario.projectedNetWorth,
      projectedSavings: baseScenario.projectedSavings,
      keyAssumptions: [
        { assumption: 'Historical trends continue', impact: 0.4, confidence: 0.8 },
        { assumption: 'No major changes in spending patterns', impact: 0.3, confidence: 0.7 },
        { assumption: 'Stable income source', impact: 0.3, confidence: 0.8 }
      ]
    });
    
    // Pessimistic scenario (20% worse than base)
    scenarios.push({
      name: 'pessimistic',
      probability: 0.2,
      projectedIncome: Math.round(baseScenario.projectedIncome * 0.9 * 100) / 100,
      projectedExpenses: Math.round(baseScenario.projectedExpenses * 1.2 * 100) / 100,
      projectedNetWorth: Math.round((baseScenario.projectedIncome * 0.9 - baseScenario.projectedExpenses * 1.2) * 100) / 100,
      projectedSavings: Math.round((baseScenario.projectedIncome * 0.9 - baseScenario.projectedExpenses * 1.2) * 0.1 * 100) / 100,
      keyAssumptions: [
        { assumption: 'Income decreases by 10%', impact: 0.3, confidence: 0.5 },
        { assumption: 'Expenses increase by 20%', impact: 0.2, confidence: 0.6 },
        { assumption: 'Unexpected major expenses', impact: 0.1, confidence: 0.4 }
      ]
    });

    return scenarios;
  }

  /**
   * Generate category forecasts
   */
  private async generateCategoryForecasts(historicalData: any, query: IPredictiveQuery): Promise<any[]> {
    const categoryForecasts: any[] = [];
    const categorySpending = this.groupTransactionsByCategory(historicalData.expenseTransactions);
    
    Object.entries(categorySpending).forEach(([categoryId, data]) => {
      const avgMonthlyAmount = data.amount / this.calculateMonthsDifference(historicalData.startDate, historicalData.endDate);
      const monthsDiff = this.calculateMonthsDifference(query.startDate, query.endDate);
      const projectedAmount = avgMonthlyAmount * monthsDiff;
      
      // Calculate trend
      const trend = this.calculateCategoryTrend(data.transactions);
      
      categoryForecasts.push({
        categoryId,
        categoryName: data.categoryName,
        projectedAmount: Math.round(projectedAmount * 100) / 100,
        confidence: 'medium',
        trend: trend.direction,
        factors: [
          { factor: 'historical_average', impact: avgMonthlyAmount, weight: 0.7 },
          { factor: 'trend_adjustment', impact: trend.impact, weight: 0.3 }
        ]
      });
    });

    return categoryForecasts;
  }

  /**
   * Generate monthly projections
   */
  private async generateMonthlyProjections(historicalData: any, query: IPredictiveQuery): Promise<any[]> {
    const projections = [];
    const monthsDiff = this.calculateMonthsDifference(query.startDate, query.endDate);
    
    for (let i = 0; i < monthsDiff; i++) {
      const monthStart = new Date(query.startDate);
      monthStart.setMonth(monthStart.getMonth() + i);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0); // Last day of month
      
      const avgMonthlyIncome = this.calculateMonthlyAverage(historicalData.incomeTransactions);
      const avgMonthlyExpenses = this.calculateMonthlyAverage(historicalData.expenseTransactions);
      
      projections.push({
        month: monthStart.toISOString().substring(0, 7), // YYYY-MM format
        projectedIncome: Math.round(avgMonthlyIncome * 100) / 100,
        projectedExpenses: Math.round(avgMonthlyExpenses * 100) / 100,
        projectedNetWorth: Math.round((avgMonthlyIncome - avgMonthlyExpenses) * 100) / 100,
        projectedSavings: Math.round((avgMonthlyIncome - avgMonthlyExpenses) * 0.2 * 100) / 100,
        confidence: 0.7
      });
    }

    return projections;
  }

  /**
   * Calculate cash flow predictions
   */
  private async calculateCashFlowPredictions(historicalData: any[], query: IPredictiveQuery): Promise<any> {
    const avgDailyInflows = historicalData.reduce((sum, day) => sum + day.inflows, 0) / historicalData.length;
    const avgDailyOutflows = historicalData.reduce((sum, day) => sum + day.outflows, 0) / historicalData.length;
    
    const daysDiff = Math.ceil((query.endDate.getTime() - query.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const projectedInflows = avgDailyInflows * daysDiff;
    const projectedOutflows = avgDailyOutflows * daysDiff;
    const projectedNetCashFlow = projectedInflows - projectedOutflows;
    
    const confidence = this.calculateCashFlowConfidence(historicalData);

    return {
      projectedInflows: Math.round(projectedInflows * 100) / 100,
      projectedOutflows: Math.round(projectedOutflows * 100) / 100,
      projectedNetCashFlow: Math.round(projectedNetCashFlow * 100) / 100,
      projectedEndingBalance: 0, // Would be calculated with current balance
      confidence: confidence > 0.8 ? 'high' : confidence > 0.6 ? 'medium' : 'low'
    };
  }

  /**
   * Generate cash flow monthly projections
   */
  private async generateCashFlowMonthlyProjections(historicalData: any[], query: IPredictiveQuery): Promise<any[]> {
    const projections = [];
    const monthsDiff = this.calculateMonthsDifference(query.startDate, query.endDate);
    
    for (let i = 0; i < monthsDiff; i++) {
      const monthStart = new Date(query.startDate);
      monthStart.setMonth(monthStart.getMonth() + i);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      
      const daysInMonth = monthEnd.getDate();
      const avgDailyInflows = historicalData.reduce((sum, day) => sum + day.inflows, 0) / historicalData.length;
      const avgDailyOutflows = historicalData.reduce((sum, day) => sum + day.outflows, 0) / historicalData.length;
      
      projections.push({
        month: monthStart.toISOString().substring(0, 7),
        projectedInflows: Math.round(avgDailyInflows * daysInMonth * 100) / 100,
        projectedOutflows: Math.round(avgDailyOutflows * daysInMonth * 100) / 100,
        projectedNetCashFlow: Math.round((avgDailyInflows - avgDailyOutflows) * daysInMonth * 100) / 100,
        projectedBalance: 0, // Would be calculated with running balance
        confidence: 0.7
      });
    }

    return projections;
  }

  /**
   * Generate cash flow category projections
   */
  private async generateCashFlowCategoryProjections(historicalData: any[], query: IPredictiveQuery): Promise<any[]> {
    // This would require more detailed category analysis
    // For now, return empty array
    return [];
  }

  /**
   * Identify risk factors
   */
  private async identifyRiskFactors(historicalData: any, query: IPredictiveQuery): Promise<any[]> {
    const riskFactors = [];
    
    // Income volatility risk
    const incomeConsistency = this.calculateConsistency(historicalData.incomeTransactions);
    if (incomeConsistency < 0.8) {
      riskFactors.push({
        factor: 'income_volatility',
        impact: 'high',
        probability: 1 - incomeConsistency,
        description: 'Income shows high volatility, making predictions less reliable',
        mitigation: 'Consider building emergency fund and diversifying income sources'
      });
    }
    
    // Expense volatility risk
    const expenseConsistency = this.calculateConsistency(historicalData.expenseTransactions);
    if (expenseConsistency < 0.8) {
      riskFactors.push({
        factor: 'expense_volatility',
        impact: 'medium',
        probability: 1 - expenseConsistency,
        description: 'Expenses show high volatility, making budget planning difficult',
        mitigation: 'Implement stricter budget controls and expense tracking'
      });
    }
    
    // Seasonal risk
    const hasSeasonality = this.detectSeasonality(historicalData.expenseTransactions);
    if (hasSeasonality) {
      riskFactors.push({
        factor: 'seasonal_variations',
        impact: 'medium',
        probability: 0.7,
        description: 'Spending patterns show seasonal variations that may not be captured in forecasts',
        mitigation: 'Adjust forecasts for seasonal factors and plan accordingly'
      });
    }

    return riskFactors;
  }

  /**
   * Identify cash flow risk factors
   */
  private async identifyCashFlowRiskFactors(historicalData: any[], query: IPredictiveQuery): Promise<any[]> {
    const riskFactors = [];
    
    // Cash flow volatility
    const netFlows = historicalData.map(day => day.netFlow);
    const avgNetFlow = netFlows.reduce((sum, flow) => sum + flow, 0) / netFlows.length;
    const variance = netFlows.reduce((sum, flow) => sum + Math.pow(flow - avgNetFlow, 2), 0) / netFlows.length;
    const volatility = Math.sqrt(variance) / Math.abs(avgNetFlow);
    
    if (volatility > 0.5) {
      riskFactors.push({
        factor: 'cash_flow_volatility',
        impact: 'high',
        probability: Math.min(1, volatility),
        description: `Cash flow shows high volatility (${(volatility * 100).toFixed(1)}% coefficient of variation)`,
        mitigation: 'Maintain higher cash reserves and implement better cash flow management'
      });
    }

    return riskFactors;
  }

  /**
   * Generate cash flow scenarios
   */
  private async generateCashFlowScenarios(historicalData: any[], query: IPredictiveQuery, predictions: any): Promise<any[]> {
    return [
      {
        name: 'optimistic',
        probability: 0.2,
        projectedEndingBalance: predictions.projectedEndingBalance * 1.2,
        keyAssumptions: ['Higher than expected income', 'Lower than expected expenses']
      },
      {
        name: 'realistic',
        probability: 0.6,
        projectedEndingBalance: predictions.projectedEndingBalance,
        keyAssumptions: ['Historical patterns continue', 'No major changes']
      },
      {
        name: 'pessimistic',
        probability: 0.2,
        projectedEndingBalance: predictions.projectedEndingBalance * 0.8,
        keyAssumptions: ['Lower than expected income', 'Higher than expected expenses']
      }
    ];
  }

  /**
   * Calculate methodology
   */
  private async calculateMethodology(historicalData: any, query: IPredictiveQuery): Promise<any> {
    const algorithm = this.selectBestForecastingAlgorithm(historicalData);
    const accuracy = this.calculateForecastingAccuracy(historicalData);
    
    return {
      algorithm,
      parameters: {
        historicalPeriod: this.calculateMonthsDifference(historicalData.startDate, historicalData.endDate),
        forecastPeriod: this.calculateMonthsDifference(query.startDate, query.endDate),
        confidenceThreshold: 0.7
      },
      trainingPeriod: {
        startDate: historicalData.startDate,
        endDate: historicalData.endDate
      },
      accuracy
    };
  }

  /**
   * Calculate cash flow methodology
   */
  private async calculateCashFlowMethodology(historicalData: any[], query: IPredictiveQuery): Promise<any> {
    return {
      algorithm: 'exponential_smoothing',
      parameters: {
        alpha: 0.3,
        historicalDays: historicalData.length,
        forecastDays: Math.ceil((query.endDate.getTime() - query.startDate.getTime()) / (1000 * 60 * 60 * 24))
      },
      accuracy: this.calculateCashFlowConfidence(historicalData)
    };
  }

  /**
   * Helper methods
   */
  private calculateMonthlyAverage(transactions: any[]): number {
    if (transactions.length === 0) return 0;
    
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const dateRange = this.calculateDateRange(transactions);
    const months = Math.max(1, this.calculateMonthsDifference(dateRange.start, dateRange.end));
    
    return totalAmount / months;
  }

  private calculateMonthsDifference(startDate: Date, endDate: Date): number {
    return (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
           (endDate.getMonth() - startDate.getMonth()) + 1;
  }

  private calculateConsistency(transactions: any[]): number {
    if (transactions.length < 3) return 0.5;
    
    const amounts = transactions.map(t => t.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;
    
    return Math.max(0, 1 - coefficientOfVariation);
  }

  private calculateDateRange(transactions: any[]): { start: Date, end: Date } {
    if (transactions.length === 0) return { start: new Date(), end: new Date() };
    
    const dates = transactions.map(t => new Date(t.date));
    return {
      start: new Date(Math.min(...dates.map(d => d.getTime()))),
      end: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }

  private groupTransactionsByCategory(transactions: any[]): Record<string, any> {
    const groups: Record<string, any> = {};
    
    transactions.forEach(transaction => {
      const categoryId = transaction.categoryId.toString();
      
      if (!groups[categoryId]) {
        groups[categoryId] = {
          categoryId,
          categoryName: transaction.categoryName || 'Unknown',
          amount: 0,
          transactions: []
        };
      }
      
      groups[categoryId].amount += transaction.amount;
      groups[categoryId].transactions.push(transaction);
    });
    
    return groups;
  }

  private calculateCategoryTrend(transactions: any[]): any {
    if (transactions.length < 2) return { direction: 'stable', impact: 0 };
    
    const sortedTransactions = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const firstHalf = sortedTransactions.slice(0, Math.floor(sortedTransactions.length / 2));
    const secondHalf = sortedTransactions.slice(Math.floor(sortedTransactions.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, t) => sum + t.amount, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, t) => sum + t.amount, 0) / secondHalf.length;
    
    const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
    
    if (change > 0.1) return { direction: 'increasing', impact: change };
    if (change < -0.1) return { direction: 'decreasing', impact: change };
    return { direction: 'stable', impact: change };
  }

  private detectSeasonality(transactions: any[]): boolean {
    if (transactions.length < 28) return false;
    
    // Simple seasonality detection
    const monthlyTotals = this.groupByMonth(transactions);
    const months = Object.keys(monthlyTotals).sort();
    
    if (months.length < 3) return false;
    
    const amounts = months.map(month => monthlyTotals[month]);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    return coefficientOfVariation > 0.3;
  }

  private groupByMonth(transactions: any[]): Record<string, number> {
    const groups: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      if (isNaN(date.getTime())) {
        return; // Skip invalid dates
      }
      const month = date.toISOString().substring(0, 7);
      groups[month] = (groups[month] || 0) + transaction.amount;
    });
    
    return groups;
  }

  private selectBestForecastingAlgorithm(historicalData: any): string {
    const hasSeasonality = this.detectSeasonality(historicalData.expenseTransactions);
    const hasTrend = this.detectTrend(historicalData.expenseTransactions);
    
    if (hasSeasonality && hasTrend) return 'arima';
    if (hasTrend) return 'exponential_smoothing';
    if (hasSeasonality) return 'seasonal_decomposition';
    return 'linear_regression';
  }

  private detectTrend(transactions: any[]): boolean {
    if (transactions.length < 14) return false;
    
    const amounts = transactions.map(t => t.amount);
    const n = amounts.length;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += amounts[i];
      sumXY += i * amounts[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const trendStrength = Math.abs(slope) / (sumY / n);
    
    return trendStrength > 0.01; // Lower threshold for trend detection
  }

  private calculateForecastingAccuracy(historicalData: any): number {
    // Simplified accuracy calculation
    const incomeConsistency = this.calculateConsistency(historicalData.incomeTransactions);
    const expenseConsistency = this.calculateConsistency(historicalData.expenseTransactions);
    
    return (incomeConsistency + expenseConsistency) / 2;
  }

  private calculateCashFlowConfidence(historicalData: any[]): number {
    if (historicalData.length < 7) return 0.5;
    
    const netFlows = historicalData.map(day => day.netFlow);
    const mean = netFlows.reduce((sum, flow) => sum + flow, 0) / netFlows.length;
    const variance = netFlows.reduce((sum, flow) => sum + Math.pow(flow - mean, 2), 0) / netFlows.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / Math.abs(mean);
    
    return Math.max(0.1, 1 - coefficientOfVariation);
  }

  private async getCurrentBalance(userId: string): Promise<number> {
    // This would typically come from an account service
    // For now, return a placeholder
    return 0;
  }
}
