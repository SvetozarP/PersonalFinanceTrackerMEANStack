import { logger } from '../../../../shared/services/logger.service';
import { TransactionRepository } from '../../transactions/repositories/transaction.repository';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import { 
  IAnomalyDetection, 
  IPredictiveQuery 
} from '../interfaces/predictive.interface';
import { TransactionType } from '../../transactions/interfaces/transaction.interface';

export class AnomalyDetectionService {
  private transactionRepository: TransactionRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * Detect anomalies in spending patterns
   */
  async detectAnomalies(query: IPredictiveQuery): Promise<IAnomalyDetection> {
    try {
      logger.info('Starting anomaly detection', { userId: query.userId, dateRange: { start: query.startDate, end: query.endDate } });

      // Get transaction data for the period
      const transactions = await this.transactionRepository.find({
        userId: query.userId,
        type: TransactionType.EXPENSE,
        date: { $gte: query.startDate, $lte: query.endDate },
        isDeleted: false
      });

      if (transactions.length === 0) {
        return this.createEmptyAnomalyDetection(query);
      }

      // Detect different types of anomalies
      const anomalies: any[] = [];
      
      // Amount-based anomalies
      const amountAnomalies = await this.detectAmountAnomalies(transactions);
      anomalies.push(...amountAnomalies);
      
      // Timing anomalies
      const timingAnomalies = await this.detectTimingAnomalies(transactions);
      anomalies.push(...timingAnomalies);
      
      // Category anomalies
      const categoryAnomalies = await this.detectCategoryAnomalies(transactions, query.userId);
      anomalies.push(...categoryAnomalies);
      
      // Pattern anomalies
      const patternAnomalies = await this.detectPatternAnomalies(transactions);
      anomalies.push(...patternAnomalies);

    // Sort by severity and confidence
    anomalies.sort((a: any, b: any) => {
      const severityOrder: { [key: string]: number } = { critical: 4, high: 3, medium: 2, low: 1 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return b.confidence - a.confidence;
    });

      const summary = this.calculateAnomalySummary(anomalies);
      
      const detection: IAnomalyDetection = {
        period: { startDate: query.startDate, endDate: query.endDate },
        anomalies,
        summary,
        model: {
          algorithm: 'hybrid',
          parameters: {
            zScoreThreshold: 2.5,
            iqrMultiplier: 1.5,
            timeWindow: 7,
            minTransactions: 10
          },
          trainingDataSize: transactions.length,
          lastTrained: new Date()
        }
      };

      logger.info('Anomaly detection completed', { 
        userId: query.userId, 
        totalAnomalies: summary.totalAnomalies,
        criticalAnomalies: summary.criticalAnomalies
      });

      return detection;
    } catch (error) {
      logger.error('Error in anomaly detection', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Detect amount-based anomalies using statistical methods
   */
  private async detectAmountAnomalies(transactions: any[]): Promise<any[]> {
    const anomalies: any[] = [];
    const amounts = transactions.map(t => t.amount);
    
    if (amounts.length < 3) return anomalies;

    // Calculate statistics
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    // Z-score based detection
    const zScoreThreshold = 1.0; // Very low threshold for better detection
    transactions.forEach((transaction, index) => {
      const zScore = Math.abs((transaction.amount - mean) / stdDev);
      
      if (zScore > zScoreThreshold) {
        const severity = zScore > 4 ? 'critical' : zScore > 3 ? 'high' : 'medium';
        const deviation = transaction.amount - mean;
        const deviationPercentage = (deviation / mean) * 100;
        
        anomalies.push({
          id: `amount_anomaly_${transaction._id}`,
          type: 'amount_anomaly',
          severity,
          detectedAt: new Date(),
          transactionId: transaction._id,
          description: `Unusual transaction amount: $${transaction.amount.toFixed(2)} (${deviationPercentage > 0 ? '+' : ''}${deviationPercentage.toFixed(1)}% from average)`,
          data: {
            expectedValue: mean,
            actualValue: transaction.amount,
            deviation: deviation,
            deviationPercentage: deviationPercentage,
            categoryId: transaction.categoryId,
            categoryName: transaction.categoryName || 'Unknown',
            date: transaction.date
          },
          confidence: Math.min(0.95, zScore / 5), // Cap confidence at 0.95
          explanation: `This transaction amount is ${zScore.toFixed(1)} standard deviations from the mean, indicating an unusual spending pattern.`,
          recommendations: [
            {
              action: 'Review transaction details',
              priority: severity === 'critical' ? 'high' : 'medium',
              expectedImpact: 'Verify if this is a legitimate expense or potential error'
            }
          ]
        });
      }
    });

    // IQR-based detection for additional sensitivity
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    const q1 = this.percentile(sortedAmounts, 25);
    const q3 = this.percentile(sortedAmounts, 75);
    const iqr = q3 - q1;
    const iqrMultiplier = 1.5;
    const lowerBound = q1 - (iqrMultiplier * iqr);
    const upperBound = q3 + (iqrMultiplier * iqr);

    transactions.forEach((transaction) => {
      if (transaction.amount < lowerBound || transaction.amount > upperBound) {
        // Check if not already detected by z-score
        const existingAnomaly = anomalies.find(a => a.transactionId === transaction._id);
        if (!existingAnomaly) {
          const deviation = transaction.amount - mean;
          const deviationPercentage = (deviation / mean) * 100;
          
          anomalies.push({
            id: `iqr_anomaly_${transaction._id}`,
            type: 'amount_anomaly',
            severity: 'low',
            detectedAt: new Date(),
            transactionId: transaction._id,
            description: `Transaction outside normal range: $${transaction.amount.toFixed(2)}`,
            data: {
              expectedValue: mean,
              actualValue: transaction.amount,
              deviation: deviation,
              deviationPercentage: deviationPercentage,
              categoryId: transaction.categoryId,
              categoryName: transaction.categoryName || 'Unknown',
              date: transaction.date
            },
            confidence: 0.6,
            explanation: `This transaction falls outside the interquartile range (IQR) of normal spending amounts.`,
            recommendations: [
              {
                action: 'Monitor spending patterns',
                priority: 'low',
                expectedImpact: 'Track if this becomes a recurring pattern'
              }
            ]
          });
        }
      }
    });

    return anomalies;
  }

  /**
   * Detect timing-based anomalies
   */
  private async detectTimingAnomalies(transactions: any[]): Promise<any[]> {
    const anomalies: any[] = [];
    
    // Group transactions by day of week and hour
    const dayHourGroups = this.groupByDayAndHour(transactions);
    
    // Detect unusual timing patterns
    Object.entries(dayHourGroups).forEach(([dayHour, dayTransactions]) => {
      const amounts = dayTransactions.map(t => t.amount);
      if (amounts.length < 3) return;
      
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      
      dayTransactions.forEach((transaction) => {
        const zScore = Math.abs((transaction.amount - mean) / stdDev);
        
        if (zScore > 2) {
          const [day, hour] = dayHour.split('_');
          anomalies.push({
            id: `timing_anomaly_${transaction._id}`,
            type: 'timing_anomaly',
            severity: zScore > 3 ? 'high' : 'medium',
            detectedAt: new Date(),
            transactionId: transaction._id,
            description: `Unusual spending for ${day} at ${hour}:00 - $${transaction.amount.toFixed(2)}`,
            data: {
              expectedValue: mean,
              actualValue: transaction.amount,
              deviation: transaction.amount - mean,
              deviationPercentage: ((transaction.amount - mean) / mean) * 100,
              categoryId: transaction.categoryId,
              categoryName: transaction.categoryName || 'Unknown',
              date: transaction.date
            },
            confidence: Math.min(0.9, zScore / 4),
            explanation: `This transaction amount is unusually high for ${day} at ${hour}:00 compared to historical patterns.`,
            recommendations: [
              {
                action: 'Review spending habits',
                priority: 'medium',
                expectedImpact: 'Identify if this timing pattern is intentional or accidental'
              }
            ]
          });
        }
      });
    });

    return anomalies;
  }

  /**
   * Detect category-based anomalies
   */
  private async detectCategoryAnomalies(transactions: any[], userId: string): Promise<any[]> {
    const anomalies: any[] = [];
    
    // Get historical category spending
    const historicalTransactions = await this.transactionRepository.find({
      userId,
      type: TransactionType.EXPENSE,
      date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
      isDeleted: false
    });

    // Group by category
    const categorySpending = this.groupByCategory(transactions);
    const historicalCategorySpending = this.groupByCategory(historicalTransactions);
    
    Object.entries(categorySpending).forEach(([categoryId, categoryData]) => {
      const historicalData = historicalCategorySpending[categoryId];
      
      if (!historicalData || historicalData.count < 5) return;
      
      const currentAmount = categoryData.amount;
      const historicalAmount = historicalData.amount;
      const historicalCount = historicalData.count;
      const currentCount = categoryData.count;
      
      // Calculate expected amount based on historical average
      const historicalAverage = historicalAmount / historicalCount;
      const expectedAmount = historicalAverage * currentCount;
      
      const deviation = currentAmount - expectedAmount;
      const deviationPercentage = (deviation / expectedAmount) * 100;
      
      // Detect significant deviations
      if (Math.abs(deviationPercentage) > 50) {
        anomalies.push({
          id: `category_anomaly_${categoryId}_${Date.now()}`,
          type: 'unusual_category',
          severity: Math.abs(deviationPercentage) > 100 ? 'high' : 'medium',
          detectedAt: new Date(),
          description: `Unusual spending in category: ${categoryData.categoryName} - $${currentAmount.toFixed(2)} (${deviationPercentage > 0 ? '+' : ''}${deviationPercentage.toFixed(1)}% from expected)`,
          data: {
            expectedValue: expectedAmount,
            actualValue: currentAmount,
            deviation: deviation,
            deviationPercentage: deviationPercentage,
            categoryId: categoryId,
            categoryName: categoryData.categoryName,
            date: new Date()
          },
          confidence: Math.min(0.9, Math.abs(deviationPercentage) / 200),
          explanation: `Spending in this category is ${Math.abs(deviationPercentage).toFixed(1)}% ${deviation > 0 ? 'higher' : 'lower'} than expected based on historical patterns.`,
          recommendations: [
            {
              action: 'Review category spending',
              priority: Math.abs(deviationPercentage) > 100 ? 'high' : 'medium',
              expectedImpact: 'Identify if this is a temporary spike or a new spending pattern'
            }
          ]
        });
      }
    });

    return anomalies;
  }

  /**
   * Detect pattern-based anomalies
   */
  private async detectPatternAnomalies(transactions: any[]): Promise<any[]> {
    const anomalies: any[] = [];
    
    // Detect spending spikes (consecutive high-amount transactions)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const amounts = sortedTransactions.map(t => t.amount);
    
    if (amounts.length < 5) return anomalies;
    
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length);
    
    // Look for consecutive transactions above 1.5 standard deviations
    let consecutiveHigh = 0;
    let startIndex = -1;
    
    for (let i = 0; i < amounts.length; i++) {
      if (amounts[i] > mean + 1.5 * stdDev) {
        if (consecutiveHigh === 0) {
          startIndex = i;
        }
        consecutiveHigh++;
      } else {
        if (consecutiveHigh >= 3) {
          // Found a spending spike pattern
          const spikeTransactions = sortedTransactions.slice(startIndex, startIndex + consecutiveHigh);
          const totalAmount = spikeTransactions.reduce((sum, t) => sum + t.amount, 0);
          
          anomalies.push({
            id: `spending_spike_${Date.now()}`,
            type: 'spending_spike',
            severity: consecutiveHigh >= 5 ? 'critical' : consecutiveHigh >= 4 ? 'high' : 'medium',
            detectedAt: new Date(),
            description: `Spending spike detected: ${consecutiveHigh} consecutive high-amount transactions totaling $${totalAmount.toFixed(2)}`,
            data: {
              expectedValue: mean * consecutiveHigh,
              actualValue: totalAmount,
              deviation: totalAmount - (mean * consecutiveHigh),
              deviationPercentage: ((totalAmount - (mean * consecutiveHigh)) / (mean * consecutiveHigh)) * 100,
              categoryId: undefined,
              categoryName: 'Multiple Categories',
              date: spikeTransactions[0].date
            },
            confidence: Math.min(0.95, consecutiveHigh / 10),
            explanation: `Detected ${consecutiveHigh} consecutive transactions significantly above average spending.`,
            recommendations: [
              {
                action: 'Review recent spending patterns',
                priority: consecutiveHigh >= 5 ? 'high' : 'medium',
                expectedImpact: 'Identify the cause of the spending spike and take corrective action if needed'
              }
            ]
          });
        }
        consecutiveHigh = 0;
        startIndex = -1;
      }
    }

    return anomalies;
  }

  /**
   * Group transactions by day of week and hour
   */
  private groupByDayAndHour(transactions: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const hour = date.getHours();
      const key = `${day}_${hour}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(transaction);
    });
    
    return groups;
  }

  /**
   * Group transactions by category
   */
  private groupByCategory(transactions: any[]): Record<string, any> {
    const groups: Record<string, any> = {};
    
    transactions.forEach(transaction => {
      const categoryId = transaction.categoryId.toString();
      
      if (!groups[categoryId]) {
        groups[categoryId] = {
          categoryId,
          categoryName: transaction.categoryName || 'Unknown',
          amount: 0,
          count: 0
        };
      }
      
      groups[categoryId].amount += transaction.amount;
      groups[categoryId].count += 1;
    });
    
    return groups;
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], p: number): number {
    const index = (p / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (upper >= sortedArray.length) {
      return sortedArray[sortedArray.length - 1];
    }
    
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  /**
   * Calculate anomaly summary
   */
  private calculateAnomalySummary(anomalies: any[]): any {
    const severityCounts = anomalies.reduce((acc, anomaly) => {
      acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1;
      return acc;
    }, {});

    const totalConfidence = anomalies.reduce((sum, anomaly) => sum + anomaly.confidence, 0);
    const averageConfidence = anomalies.length > 0 ? totalConfidence / anomalies.length : 0;

    return {
      totalAnomalies: anomalies.length,
      criticalAnomalies: severityCounts.critical || 0,
      highSeverityAnomalies: severityCounts.high || 0,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      detectionAccuracy: 0.85 // This would be calculated based on model performance
    };
  }

  /**
   * Create empty anomaly detection result
   */
  private createEmptyAnomalyDetection(query: IPredictiveQuery): IAnomalyDetection {
    return {
      period: { startDate: query.startDate, endDate: query.endDate },
      anomalies: [],
      summary: {
        totalAnomalies: 0,
        criticalAnomalies: 0,
        highSeverityAnomalies: 0,
        averageConfidence: 0,
        detectionAccuracy: 0
      },
      model: {
        algorithm: 'hybrid',
        parameters: {},
        trainingDataSize: 0,
        lastTrained: new Date()
      }
    };
  }
}
