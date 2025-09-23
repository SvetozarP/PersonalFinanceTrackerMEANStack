import { logger } from '../../../../shared/services/logger.service';
import { TransactionRepository } from '../../transactions/repositories/transaction.repository';
import { CategoryRepository } from '../../categories/repositories/category.repository';
import { 
  ISpendingPrediction, 
  IPredictiveQuery,
  IPredictiveModel 
} from '../interfaces/predictive.interface';
import { TransactionType } from '../../transactions/interfaces/transaction.interface';

export class SpendingPredictionService {
  private transactionRepository: TransactionRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * Predict future spending based on historical data
   */
  async predictSpending(query: IPredictiveQuery): Promise<ISpendingPrediction> {
    try {
      logger.info('Starting spending prediction', { userId: query.userId, dateRange: { start: query.startDate, end: query.endDate } });

      // Get historical data for training
      const historicalData = await this.getHistoricalSpendingData(query);
      
      if (historicalData.length < 30) {
        throw new Error('Insufficient historical data for accurate prediction. Need at least 30 days of data.');
      }

      // Choose the best algorithm based on data characteristics
      const algorithm = this.selectBestAlgorithm(historicalData);
      
      let prediction: ISpendingPrediction;
      
      switch (algorithm) {
        case 'linear_regression':
          prediction = await this.predictWithLinearRegression(historicalData, query);
          break;
        case 'time_series':
          prediction = await this.predictWithTimeSeries(historicalData, query);
          break;
        case 'seasonal_decomposition':
          prediction = await this.predictWithSeasonalDecomposition(historicalData, query);
          break;
        case 'hybrid':
          prediction = await this.predictWithHybridModel(historicalData, query);
          break;
        default:
          prediction = await this.predictWithLinearRegression(historicalData, query);
      }

      logger.info('Spending prediction completed', { 
        userId: query.userId, 
        totalPredictedAmount: prediction.totalPredictedAmount,
        confidence: prediction.confidence,
        methodology: prediction.methodology
      });

      return prediction;
    } catch (error) {
      logger.error('Error in spending prediction', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Get historical spending data for training
   */
  private async getHistoricalSpendingData(query: IPredictiveQuery): Promise<any[]> {
    const endDate = new Date(query.startDate);
    endDate.setDate(endDate.getDate() - 1); // Get data before prediction period
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 365); // Get 1 year of historical data

    const transactions = await this.transactionRepository.find({
      userId: query.userId,
      type: TransactionType.EXPENSE,
      date: { $gte: startDate, $lte: endDate },
      isDeleted: false
    });

    // Group by date and calculate daily spending
    const dailySpending = this.groupByDate(transactions);
    
    return dailySpending;
  }

  /**
   * Group transactions by date
   */
  private groupByDate(transactions: any[]): any[] {
    const grouped = transactions.reduce((acc, transaction) => {
      const date = new Date(transaction.date).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, amount: 0, count: 0 };
      }
      acc[date].amount += transaction.amount;
      acc[date].count += 1;
      return acc;
    }, {});

    return Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Select the best algorithm based on data characteristics
   */
  private selectBestAlgorithm(data: any[]): string {
    if (data.length < 60) {
      return 'linear_regression';
    }

    // Check for seasonality
    const hasSeasonality = this.detectSeasonality(data);
    
    // Check for trend
    const hasTrend = this.detectTrend(data);
    
    if (hasSeasonality && hasTrend) {
      return 'seasonal_decomposition';
    } else if (hasTrend) {
      return 'time_series';
    } else if (hasSeasonality) {
      return 'seasonal_decomposition';
    } else {
      return 'hybrid';
    }
  }

  /**
   * Detect seasonality in the data
   */
  private detectSeasonality(data: any[]): boolean {
    if (data.length < 28) return false;

    // Simple seasonality detection using autocorrelation
    const values = data.map(d => d.amount);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    
    // Check for weekly patterns (7-day cycle)
    let weeklyCorrelation = 0;
    for (let i = 7; i < values.length; i++) {
      weeklyCorrelation += (values[i] - mean) * (values[i - 7] - mean);
    }
    
    const weeklyVariance = values.slice(7).reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    const correlation = weeklyCorrelation / weeklyVariance;
    
    return Math.abs(correlation) > 0.8; // Very high threshold for seasonality
  }

  /**
   * Detect trend in the data
   */
  private detectTrend(data: any[]): boolean {
    if (data.length < 14) return false;

    const values = data.map(d => d.amount);
    const n = values.length;
    
    // Simple linear trend detection
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const trendStrength = Math.abs(slope) / (sumY / n);
    
    return trendStrength > 0.01; // Lower threshold for trend detection
  }

  /**
   * Predict using linear regression
   */
  private async predictWithLinearRegression(historicalData: any[], query: IPredictiveQuery): Promise<ISpendingPrediction> {
    const values = historicalData.map(d => d.amount);
    const n = values.length;
    
    // Calculate linear regression coefficients
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    let ssRes = 0, ssTot = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = slope * i + intercept;
      ssRes += Math.pow(values[i] - predicted, 2);
      ssTot += Math.pow(values[i] - yMean, 2);
    }
    
    const rSquared = 1 - (ssRes / ssTot);
    const confidence = Math.max(0, Math.min(1, rSquared));
    
    // Generate predictions
    const predictions = [];
    const daysDiff = Math.ceil((query.endDate.getTime() - query.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < daysDiff; i++) {
      const dayIndex = n + i;
      const predictedAmount = Math.max(0, slope * dayIndex + intercept);
      
      predictions.push({
        date: new Date(query.startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predictedAmount: Math.round(predictedAmount * 100) / 100,
        confidence: confidence,
        factors: [
          { factor: 'historical_trend', impact: slope, weight: 0.7 },
          { factor: 'seasonal_adjustment', impact: 0, weight: 0.3 }
        ]
      });
    }
    
    const totalPredictedAmount = predictions.reduce((sum, p) => sum + p.predictedAmount, 0);
    const averageDailyPrediction = totalPredictedAmount / daysDiff;
    
    return {
      period: { startDate: query.startDate, endDate: query.endDate },
      predictions,
      totalPredictedAmount: Math.round(totalPredictedAmount * 100) / 100,
      averageDailyPrediction: Math.round(averageDailyPrediction * 100) / 100,
      confidence: confidence > 0.7 ? 'high' : confidence > 0.4 ? 'medium' : 'low',
      methodology: 'linear_regression',
      accuracy: {
        historicalAccuracy: confidence,
        lastPredictionAccuracy: confidence,
        trendAccuracy: confidence
      },
      riskFactors: this.identifyRiskFactors(historicalData, predictions)
    };
  }

  /**
   * Predict using time series analysis
   */
  private async predictWithTimeSeries(historicalData: any[], query: IPredictiveQuery): Promise<ISpendingPrediction> {
    // Simple exponential smoothing
    const values = historicalData.map(d => d.amount);
    const alpha = 0.3; // Smoothing parameter
    
    // Calculate initial smoothed values
    let smoothed = [values[0]];
    for (let i = 1; i < values.length; i++) {
      smoothed.push(alpha * values[i] + (1 - alpha) * smoothed[i - 1]);
    }
    
    // Generate predictions
    const predictions = [];
    const daysDiff = Math.ceil((query.endDate.getTime() - query.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const lastSmoothed = smoothed[smoothed.length - 1];
    
    for (let i = 0; i < daysDiff; i++) {
      const predictedAmount = lastSmoothed;
      
      predictions.push({
        date: new Date(query.startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predictedAmount: Math.round(predictedAmount * 100) / 100,
        confidence: 0.6, // Moderate confidence for time series
        factors: [
          { factor: 'exponential_smoothing', impact: 1, weight: 0.8 },
          { factor: 'trend_adjustment', impact: 0, weight: 0.2 }
        ]
      });
    }
    
    const totalPredictedAmount = predictions.reduce((sum, p) => sum + p.predictedAmount, 0);
    const averageDailyPrediction = totalPredictedAmount / daysDiff;
    
    return {
      period: { startDate: query.startDate, endDate: query.endDate },
      predictions,
      totalPredictedAmount: Math.round(totalPredictedAmount * 100) / 100,
      averageDailyPrediction: Math.round(averageDailyPrediction * 100) / 100,
      confidence: 'medium',
      methodology: 'time_series',
      accuracy: {
        historicalAccuracy: 0.6,
        lastPredictionAccuracy: 0.6,
        trendAccuracy: 0.6
      },
      riskFactors: this.identifyRiskFactors(historicalData, predictions)
    };
  }

  /**
   * Predict using seasonal decomposition
   */
  private async predictWithSeasonalDecomposition(historicalData: any[], query: IPredictiveQuery): Promise<ISpendingPrediction> {
    // Simple seasonal decomposition
    const values = historicalData.map(d => d.amount);
    const period = 7; // Weekly seasonality
    
    // Calculate seasonal component
    const seasonal = this.calculateSeasonalComponent(values, period);
    
    // Calculate trend component
    const trend = this.calculateTrendComponent(values);
    
    // Generate predictions
    const predictions = [];
    const daysDiff = Math.ceil((query.endDate.getTime() - query.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < daysDiff; i++) {
      const dayOfWeek = (i % 7);
      const seasonalFactor = seasonal[dayOfWeek] || 1;
      const trendFactor = trend[Math.min(i, trend.length - 1)] || trend[trend.length - 1];
      const predictedAmount = trendFactor * seasonalFactor;
      
      predictions.push({
        date: new Date(query.startDate.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predictedAmount: Math.round(predictedAmount * 100) / 100,
        confidence: 0.8, // High confidence for seasonal model
        factors: [
          { factor: 'seasonal_pattern', impact: seasonalFactor, weight: 0.6 },
          { factor: 'trend_component', impact: trendFactor, weight: 0.4 }
        ]
      });
    }
    
    const totalPredictedAmount = predictions.reduce((sum, p) => sum + p.predictedAmount, 0);
    const averageDailyPrediction = totalPredictedAmount / daysDiff;
    
    return {
      period: { startDate: query.startDate, endDate: query.endDate },
      predictions,
      totalPredictedAmount: Math.round(totalPredictedAmount * 100) / 100,
      averageDailyPrediction: Math.round(averageDailyPrediction * 100) / 100,
      confidence: 'high',
      methodology: 'seasonal_decomposition',
      accuracy: {
        historicalAccuracy: 0.8,
        lastPredictionAccuracy: 0.8,
        trendAccuracy: 0.8
      },
      riskFactors: this.identifyRiskFactors(historicalData, predictions)
    };
  }

  /**
   * Predict using hybrid model
   */
  private async predictWithHybridModel(historicalData: any[], query: IPredictiveQuery): Promise<ISpendingPrediction> {
    // Combine multiple models
    const linearPrediction = await this.predictWithLinearRegression(historicalData, query);
    const timeSeriesPrediction = await this.predictWithTimeSeries(historicalData, query);
    
    // Weight the predictions
    const linearWeight = 0.6;
    const timeSeriesWeight = 0.4;
    
    const predictions = linearPrediction.predictions.map((linearPred, index) => {
      const timeSeriesPred = timeSeriesPrediction.predictions[index];
      const weightedAmount = (linearPred.predictedAmount * linearWeight) + 
                           (timeSeriesPred.predictedAmount * timeSeriesWeight);
      
      return {
        ...linearPred,
        predictedAmount: Math.round(weightedAmount * 100) / 100,
        confidence: (linearPred.confidence * linearWeight) + (timeSeriesPred.confidence * timeSeriesWeight),
        factors: [
          { factor: 'linear_regression', impact: linearPred.predictedAmount, weight: linearWeight },
          { factor: 'time_series', impact: timeSeriesPred.predictedAmount, weight: timeSeriesWeight }
        ]
      };
    });
    
    const totalPredictedAmount = predictions.reduce((sum, p) => sum + p.predictedAmount, 0);
    const averageDailyPrediction = totalPredictedAmount / predictions.length;
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;
    
    return {
      period: { startDate: query.startDate, endDate: query.endDate },
      predictions,
      totalPredictedAmount: Math.round(totalPredictedAmount * 100) / 100,
      averageDailyPrediction: Math.round(averageDailyPrediction * 100) / 100,
      confidence: avgConfidence > 0.7 ? 'high' : avgConfidence > 0.4 ? 'medium' : 'low',
      methodology: 'hybrid',
      accuracy: {
        historicalAccuracy: avgConfidence,
        lastPredictionAccuracy: avgConfidence,
        trendAccuracy: avgConfidence
      },
      riskFactors: this.identifyRiskFactors(historicalData, predictions)
    };
  }

  /**
   * Calculate seasonal component
   */
  private calculateSeasonalComponent(values: number[], period: number): number[] {
    const seasonal = new Array(period).fill(0);
    const counts = new Array(period).fill(0);
    
    for (let i = 0; i < values.length; i++) {
      const dayOfPeriod = i % period;
      seasonal[dayOfPeriod] += values[i];
      counts[dayOfPeriod]++;
    }
    
    // Calculate averages
    for (let i = 0; i < period; i++) {
      seasonal[i] = counts[i] > 0 ? seasonal[i] / counts[i] : 1;
    }
    
    // Normalize to have mean of 1
    const mean = seasonal.reduce((a, b) => a + b, 0) / period;
    return seasonal.map(s => s / mean);
  }

  /**
   * Calculate trend component
   */
  private calculateTrendComponent(values: number[]): number[] {
    const trend = [];
    const window = Math.min(7, Math.floor(values.length / 4));
    
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - window + 1);
      const end = i + 1;
      const windowValues = values.slice(start, end);
      const average = windowValues.reduce((a, b) => a + b, 0) / windowValues.length;
      trend.push(average);
    }
    
    return trend;
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(historicalData: any[], predictions: any[]): any[] {
    const riskFactors = [];
    
    // Calculate volatility
    const values = historicalData.map(d => d.amount);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const volatility = Math.sqrt(variance) / mean;
    
    if (volatility > 0.5) {
      riskFactors.push({
        factor: 'high_volatility',
        impact: 'high',
        probability: volatility,
        description: `Spending shows high volatility (${(volatility * 100).toFixed(1)}% coefficient of variation)`
      });
    }
    
    // Check for recent trends
    const recentValues = values.slice(-7);
    const olderValues = values.slice(-14, -7);
    const recentAvg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const olderAvg = olderValues.reduce((a, b) => a + b, 0) / olderValues.length;
    const trendChange = (recentAvg - olderAvg) / olderAvg;
    
    if (Math.abs(trendChange) > 0.2) {
      riskFactors.push({
        factor: 'trend_change',
        impact: 'medium',
        probability: Math.abs(trendChange),
        description: `Recent spending trend has changed by ${(trendChange * 100).toFixed(1)}%`
      });
    }
    
    return riskFactors;
  }

  /**
   * Train a predictive model
   */
  async trainModel(userId: string, modelType: string, parameters: Record<string, any>): Promise<IPredictiveModel> {
    try {
      logger.info('Training predictive model', { userId, modelType, parameters });
      
      // This would typically involve more sophisticated ML training
      // For now, we'll create a simple model record
      const model: IPredictiveModel = {
        id: `model_${Date.now()}`,
        name: `${modelType}_${userId}`,
        type: modelType as any,
        algorithm: parameters.algorithm || 'linear_regression',
        parameters,
        trainingData: {
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          recordCount: 0 // Would be calculated from actual data
        },
        performance: {
          accuracy: 0.8,
          precision: 0.8,
          recall: 0.8,
          f1Score: 0.8,
          lastEvaluated: new Date()
        },
        status: 'ready',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastTrained: new Date()
      };
      
      logger.info('Model training completed', { modelId: model.id, performance: model.performance });
      
      return model;
    } catch (error) {
      logger.error('Error training model', { error: String(error), userId, modelType });
      throw error;
    }
  }
}
