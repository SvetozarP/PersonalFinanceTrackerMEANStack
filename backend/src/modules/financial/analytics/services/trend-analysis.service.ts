import { logger } from '../../../../shared/services/logger.service';
import { TransactionRepository } from '../../transactions/repositories/transaction.repository';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import { 
  ITrendAnalysis, 
  IPredictiveQuery 
} from '../interfaces/predictive.interface';
import { TransactionType } from '../../transactions/interfaces/transaction.interface';

export class TrendAnalysisService {
  private transactionRepository: TransactionRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * Analyze spending trends and patterns
   */
  async analyzeTrends(query: IPredictiveQuery): Promise<ITrendAnalysis> {
    try {
      logger.info('Starting trend analysis', { userId: query.userId, dateRange: { start: query.startDate, end: query.endDate } });

      // Get historical data for trend analysis
      const historicalData = await this.getHistoricalTrendData(query);
      
      if (historicalData.length < 14) {
        throw new Error('Insufficient historical data for trend analysis. Need at least 14 days of data.');
      }

      // Analyze overall trend
      const overallTrend = await this.analyzeOverallTrend(historicalData);
      
      // Analyze category trends
      const categoryTrends = await this.analyzeCategoryTrends(historicalData, query.userId);
      
      // Analyze spending patterns
      const spendingPatterns = await this.analyzeSpendingPatterns(historicalData);
      
      // Generate insights
      const insights = await this.generateTrendInsights(overallTrend, categoryTrends, spendingPatterns);
      
      // Calculate methodology
      const methodology = this.calculateTrendMethodology(historicalData);

      const trendAnalysis: ITrendAnalysis = {
        analysisPeriod: { startDate: query.startDate, endDate: query.endDate },
        overallTrend,
        categoryTrends,
        spendingPatterns,
        insights,
        methodology
      };

      logger.info('Trend analysis completed', { 
        userId: query.userId, 
        overallDirection: overallTrend.direction,
        overallStrength: overallTrend.strength,
        categoryCount: categoryTrends.length
      });

      return trendAnalysis;
    } catch (error) {
      logger.error('Error in trend analysis', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Get historical data for trend analysis
   */
  private async getHistoricalTrendData(query: IPredictiveQuery): Promise<any[]> {
    const endDate = new Date(query.startDate);
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 180); // 6 months of historical data

    const transactions = await this.transactionRepository.find({
      userId: query.userId,
      type: TransactionType.EXPENSE,
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
          amount: 0, 
          count: 0,
          transactions: []
        };
      }
      
      acc[date].amount += transaction.amount;
      acc[date].count += 1;
      acc[date].transactions.push(transaction);
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Analyze overall spending trend
   */
  private async analyzeOverallTrend(historicalData: any[]): Promise<any> {
    const amounts = historicalData.map(d => d.amount);
    const dates = historicalData.map(d => new Date(d.date));
    
    // Calculate linear trend
    const trend = this.calculateLinearTrend(amounts, dates);
    
    // Calculate trend strength
    const strength = this.calculateTrendStrength(amounts, trend);
    
    // Calculate confidence
    const confidence = this.calculateTrendConfidence(amounts, trend);
    
    // Determine direction
    let direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    if (Math.abs(trend.slope) < 0.01) {
      direction = 'stable';
    } else if (trend.slope > 0) {
      direction = strength > 0.5 ? 'increasing' : 'volatile';
    } else {
      direction = strength > 0.5 ? 'decreasing' : 'volatile';
    }
    
    // Determine strength level
    let strengthLevel: 'weak' | 'moderate' | 'strong';
    if (strength > 0.7) {
      strengthLevel = 'strong';
    } else if (strength > 0.4) {
      strengthLevel = 'moderate';
    } else {
      strengthLevel = 'weak';
    }
    
    const description = this.generateTrendDescription(direction, strengthLevel, trend.slope);

    return {
      direction,
      strength: strengthLevel,
      confidence,
      description
    };
  }

  /**
   * Analyze category trends
   */
  private async analyzeCategoryTrends(historicalData: any[], userId: string): Promise<any[]> {
    const categoryTrends: any[] = [];
    
    // Group by category
    const categoryData = this.groupByCategory(historicalData);
    
    // Get category names
    const categories = await this.categoryRepository.find({ userId });
    const categoryMap = new Map(categories.map((c: any) => [c._id.toString(), c.name]));
    
    Object.entries(categoryData).forEach(([categoryId, data]) => {
      const trend = this.analyzeCategoryTrend(data);
      const categoryName = categoryMap.get(categoryId) || 'Unknown';
      
      categoryTrends.push({
        categoryId,
        categoryName,
        trend: {
          direction: trend.direction,
          strength: trend.strength,
          confidence: trend.confidence
        },
        data: trend.data,
        seasonalPattern: trend.seasonalPattern,
        forecast: trend.forecast
      });
    });

    return categoryTrends;
  }

  /**
   * Analyze individual category trend
   */
  private analyzeCategoryTrend(categoryData: any): any {
    const amounts = categoryData.amounts;
    const dates = categoryData.dates;
    
    if (amounts.length < 3) {
      return {
        direction: 'stable',
        strength: 'weak',
        confidence: 0.3,
        data: [],
        seasonalPattern: { hasSeasonality: false, peakMonths: [], lowMonths: [], seasonalStrength: 0 },
        forecast: { nextPeriodPrediction: 0, confidence: 0.3, trend: 'stable' }
      };
    }
    
    // Calculate trend
    const trend = this.calculateLinearTrend(amounts, dates);
    const strength = this.calculateTrendStrength(amounts, trend);
    const confidence = this.calculateTrendConfidence(amounts, trend);
    
    // Determine direction and strength
    let direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    if (Math.abs(trend.slope) < 0.01) {
      direction = 'stable';
    } else if (trend.slope > 0) {
      direction = strength > 0.5 ? 'increasing' : 'volatile';
    } else {
      direction = strength > 0.5 ? 'decreasing' : 'volatile';
    }
    
    let strengthLevel: 'weak' | 'moderate' | 'strong';
    if (strength > 0.7) {
      strengthLevel = 'strong';
    } else if (strength > 0.4) {
      strengthLevel = 'moderate';
    } else {
      strengthLevel = 'weak';
    }
    
    // Generate data points
    const data = this.generateTrendDataPoints(amounts, dates, trend);
    
    // Analyze seasonal pattern
    const seasonalPattern = this.analyzeSeasonalPattern(amounts, dates);
    
    // Generate forecast
    const forecast = this.generateCategoryForecast(amounts, trend, confidence);
    
    return {
      direction,
      strength: strengthLevel,
      confidence,
      data,
      seasonalPattern,
      forecast
    };
  }

  /**
   * Analyze spending patterns
   */
  private async analyzeSpendingPatterns(historicalData: any[]): Promise<any> {
    // Weekly patterns
    const weeklyPattern = this.analyzeWeeklyPattern(historicalData);
    
    // Monthly patterns
    const monthlyPattern = this.analyzeMonthlyPattern(historicalData);
    
    // Seasonal patterns
    const seasonalPattern = this.analyzeSeasonalPattern(historicalData.map(d => d.amount), historicalData.map(d => new Date(d.date)));

    return {
      weeklyPattern,
      monthlyPattern,
      seasonalPattern: {
        season: seasonalPattern.season || 'unknown',
        averageAmount: seasonalPattern.averageAmount || 0,
        trend: seasonalPattern.trend || 'stable'
      }
    };
  }

  /**
   * Analyze weekly spending patterns
   */
  private analyzeWeeklyPattern(historicalData: any[]): any[] {
    const dayOfWeekTotals: Record<string, { amount: number, count: number }> = {};
    
    historicalData.forEach(day => {
      const dayOfWeek = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      if (!dayOfWeekTotals[dayOfWeek]) {
        dayOfWeekTotals[dayOfWeek] = { amount: 0, count: 0 };
      }
      
      dayOfWeekTotals[dayOfWeek].amount += day.amount;
      dayOfWeekTotals[dayOfWeek].count += 1;
    });
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return days.map(day => {
      const data = dayOfWeekTotals[day] || { amount: 0, count: 0 };
      const averageAmount = data.count > 0 ? data.amount / data.count : 0;
      
      return {
        day: day.charAt(0).toUpperCase() + day.slice(1),
        averageAmount: Math.round(averageAmount * 100) / 100,
        frequency: data.count,
        trend: 'stable' // Would be calculated based on historical comparison
      };
    });
  }

  /**
   * Analyze monthly spending patterns
   */
  private analyzeMonthlyPattern(historicalData: any[]): any[] {
    const monthlyTotals: Record<string, { amount: number, count: number }> = {};
    
    historicalData.forEach(day => {
      const month = new Date(day.date).toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = { amount: 0, count: 0 };
      }
      
      monthlyTotals[month].amount += day.amount;
      monthlyTotals[month].count += 1;
    });
    
    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const averageAmount = data.count > 0 ? data.amount / data.count : 0;
        
        return {
          month,
          averageAmount: Math.round(averageAmount * 100) / 100,
          trend: 'stable' // Would be calculated based on historical comparison
        };
      });
  }

  /**
   * Analyze seasonal patterns
   */
  private analyzeSeasonalPattern(amounts: number[], dates: Date[]): any {
    if (amounts.length < 28) {
      return { hasSeasonality: false, peakMonths: [], lowMonths: [], seasonalStrength: 0 };
    }
    
    // Group by month
    const monthlyTotals: Record<string, number[]> = {};
    
    dates.forEach((date, index) => {
      const month = date.getMonth();
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = [];
      }
      monthlyTotals[month].push(amounts[index]);
    });
    
    // Calculate monthly averages
    const monthlyAverages: Record<string, number> = {};
    Object.entries(monthlyTotals).forEach(([month, values]) => {
      monthlyAverages[month] = values.reduce((sum, val) => sum + val, 0) / values.length;
    });
    
    // Find peak and low months
    const sortedMonths = Object.entries(monthlyAverages).sort(([,a], [,b]) => b - a);
    const peakMonths = sortedMonths.slice(0, 2).map(([month]) => this.getMonthName(parseInt(month)));
    const lowMonths = sortedMonths.slice(-2).map(([month]) => this.getMonthName(parseInt(month)));
    
    // Calculate seasonal strength
    const values = Object.values(monthlyAverages);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const seasonalStrength = Math.sqrt(variance) / mean;
    
    return {
      hasSeasonality: seasonalStrength > 0.2,
      peakMonths,
      lowMonths,
      seasonalStrength: Math.round(seasonalStrength * 100) / 100
    };
  }

  /**
   * Generate trend insights
   */
  private async generateTrendInsights(overallTrend: any, categoryTrends: any[], spendingPatterns: any): Promise<any[]> {
    const insights = [];
    
    // Overall trend insights
    if (overallTrend.direction === 'increasing' && overallTrend.strength === 'strong') {
      insights.push({
        type: 'trend',
        priority: 'high',
        message: `Strong increasing spending trend detected. Consider reviewing budget allocations.`,
        data: { direction: overallTrend.direction, strength: overallTrend.strength },
        recommendations: [
          {
            action: 'Review and adjust budget categories',
            priority: 'high',
            expectedImpact: 'Better control over spending growth'
          }
        ]
      });
    }
    
    // Category trend insights
    const increasingCategories = categoryTrends.filter(ct => ct.trend.direction === 'increasing' && ct.trend.strength === 'strong');
    if (increasingCategories.length > 0) {
      insights.push({
        type: 'pattern',
        priority: 'medium',
        message: `${increasingCategories.length} categories showing strong increasing trends.`,
        data: { categories: increasingCategories.map(c => c.categoryName) },
        recommendations: [
          {
            action: 'Monitor high-growth categories closely',
            priority: 'medium',
            expectedImpact: 'Early detection of budget overruns'
          }
        ]
      });
    }
    
    // Seasonal insights
    if (spendingPatterns.seasonalPattern.hasSeasonality) {
      insights.push({
        type: 'pattern',
        priority: 'low',
        message: `Seasonal spending patterns detected. Peak months: ${spendingPatterns.seasonalPattern.peakMonths.join(', ')}`,
        data: spendingPatterns.seasonalPattern,
        recommendations: [
          {
            action: 'Plan for seasonal variations in budget',
            priority: 'low',
            expectedImpact: 'Better seasonal budget planning'
          }
        ]
      });
    }

    return insights;
  }

  /**
   * Calculate trend methodology
   */
  private calculateTrendMethodology(historicalData: any[]): any {
    const algorithm = this.selectBestTrendAlgorithm(historicalData);
    const accuracy = this.calculateTrendAccuracy(historicalData);
    
    return {
      algorithm,
      parameters: {
        dataPoints: historicalData.length,
        timeWindow: this.calculateTimeWindow(historicalData),
        confidenceThreshold: 0.7
      },
      accuracy
    };
  }

  /**
   * Helper methods
   */
  private calculateLinearTrend(amounts: number[], dates: Date[]): any {
    const n = amounts.length;
    const xValues = dates.map((_, index) => index);
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += xValues[i];
      sumY += amounts[i];
      sumXY += xValues[i] * amounts[i];
      sumXX += xValues[i] * xValues[i];
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }

  private calculateTrendStrength(amounts: number[], trend: any): number {
    const n = amounts.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    
    // Calculate R-squared
    const yMean = amounts.reduce((a, b) => a + b, 0) / n;
    let ssRes = 0, ssTot = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = trend.slope * xValues[i] + trend.intercept;
      ssRes += Math.pow(amounts[i] - predicted, 2);
      ssTot += Math.pow(amounts[i] - yMean, 2);
    }
    
    const rSquared = 1 - (ssRes / ssTot);
    return Math.max(0, Math.min(1, rSquared));
  }

  private calculateTrendConfidence(amounts: number[], trend: any): number {
    const strength = this.calculateTrendStrength(amounts, trend);
    const dataPoints = amounts.length;
    
    // Adjust confidence based on data points
    const dataPointFactor = Math.min(1, dataPoints / 30);
    
    return strength * dataPointFactor;
  }

  private generateTrendDescription(direction: string, strength: string, slope: number): string {
    const directionText = direction === 'increasing' ? 'increasing' : 
                         direction === 'decreasing' ? 'decreasing' : 
                         direction === 'stable' ? 'stable' : 'volatile';
    
    const strengthText = strength === 'strong' ? 'strong' : 
                        strength === 'moderate' ? 'moderate' : 'weak';
    
    return `Spending shows a ${strengthText} ${directionText} trend with a slope of ${slope.toFixed(4)}.`;
  }

  private groupByCategory(historicalData: any[]): Record<string, any> {
    const groups: Record<string, any> = {};
    
    historicalData.forEach(day => {
      day.transactions.forEach((transaction: any) => {
        const categoryId = transaction.categoryId.toString();
        
        if (!groups[categoryId]) {
          groups[categoryId] = {
            amounts: [],
            dates: [],
            transactions: []
          };
        }
        
        groups[categoryId].amounts.push(transaction.amount);
        groups[categoryId].dates.push(new Date(transaction.date));
        groups[categoryId].transactions.push(transaction);
      });
    });
    
    return groups;
  }

  private generateTrendDataPoints(amounts: number[], dates: Date[], trend: any): any[] {
    return amounts.map((amount, index) => {
      const predicted = trend.slope * index + trend.intercept;
      const change = index > 0 ? amount - amounts[index - 1] : 0;
      const percentageChange = index > 0 ? (change / amounts[index - 1]) * 100 : 0;
      
      return {
        period: dates[index].toISOString().substring(0, 10),
        amount: Math.round(amount * 100) / 100,
        change: Math.round(change * 100) / 100,
        percentageChange: Math.round(percentageChange * 100) / 100
      };
    });
  }

  private generateCategoryForecast(amounts: number[], trend: any, confidence: number): any {
    const lastAmount = amounts[amounts.length - 1];
    const nextPeriodPrediction = Math.max(0, trend.slope + lastAmount);
    
    return {
      nextPeriodPrediction: Math.round(nextPeriodPrediction * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
      trend: trend.slope > 0.01 ? 'continuing' : trend.slope < -0.01 ? 'reversing' : 'stabilizing'
    };
  }

  private selectBestTrendAlgorithm(historicalData: any[]): string {
    if (historicalData.length < 30) return 'linear_regression';
    
    const amounts = historicalData.map(d => d.amount);
    const hasSeasonality = this.detectSeasonality(amounts);
    const hasTrend = this.detectTrend(amounts);
    
    if (hasSeasonality && hasTrend) return 'seasonal_decomposition';
    if (hasTrend) return 'exponential_smoothing';
    if (hasSeasonality) return 'seasonal_decomposition';
    return 'linear_regression';
  }

  private detectSeasonality(amounts: number[]): boolean {
    if (amounts.length < 28) return false;
    
    // Simple seasonality detection using autocorrelation
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    
    // Check for weekly patterns (7-day cycle)
    let weeklyCorrelation = 0;
    for (let i = 7; i < amounts.length; i++) {
      weeklyCorrelation += (amounts[i] - mean) * (amounts[i - 7] - mean);
    }
    
    const weeklyVariance = amounts.slice(7).reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    const correlation = weeklyCorrelation / weeklyVariance;
    
    return Math.abs(correlation) > 0.3;
  }

  private detectTrend(amounts: number[]): boolean {
    if (amounts.length < 14) return false;
    
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
    
    return trendStrength > 0.1;
  }

  private calculateTrendAccuracy(historicalData: any[]): number {
    // Simplified accuracy calculation
    const amounts = historicalData.map(d => d.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;
    
    return Math.max(0.1, 1 - coefficientOfVariation);
  }

  private calculateTimeWindow(historicalData: any[]): number {
    if (historicalData.length === 0) return 0;
    
    const dates = historicalData.map(d => new Date(d.date));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getMonthName(monthIndex: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex] || 'Unknown';
  }
}
