import { logger } from '../../../../shared/services/logger.service';
import { SpendingPredictionService } from './spending-prediction.service';
import { AnomalyDetectionService } from './anomaly-detection.service';
import { FinancialForecastingService } from './financial-forecasting.service';
import { TrendAnalysisService } from './trend-analysis.service';
import { 
  ISpendingPrediction,
  IAnomalyDetection,
  IFinancialForecast,
  ICashFlowPrediction,
  ITrendAnalysis,
  IBudgetPrediction,
  IPredictiveInsights,
  IPredictiveQuery,
  IPredictiveModel
} from '../interfaces/predictive.interface';

export class PredictiveAnalyticsService {
  private spendingPredictionService: SpendingPredictionService;
  private anomalyDetectionService: AnomalyDetectionService;
  private financialForecastingService: FinancialForecastingService;
  private trendAnalysisService: TrendAnalysisService;

  constructor() {
    this.spendingPredictionService = new SpendingPredictionService();
    this.anomalyDetectionService = new AnomalyDetectionService();
    this.financialForecastingService = new FinancialForecastingService();
    this.trendAnalysisService = new TrendAnalysisService();
  }

  /**
   * Get comprehensive predictive insights
   */
  async getPredictiveInsights(query: IPredictiveQuery): Promise<IPredictiveInsights> {
    try {
      logger.info('Generating comprehensive predictive insights', { userId: query.userId });

      // Run all predictive analyses in parallel
      const [
        spendingPrediction,
        anomalyDetection,
        financialForecast,
        trendAnalysis
      ] = await Promise.all([
        this.spendingPredictionService.predictSpending(query),
        this.anomalyDetectionService.detectAnomalies(query),
        this.financialForecastingService.generateFinancialForecast(query),
        this.trendAnalysisService.analyzeTrends(query)
      ]);

      // Generate insights from all analyses
      const insights = await this.generateComprehensiveInsights(
        spendingPrediction,
        anomalyDetection,
        financialForecast,
        trendAnalysis,
        query
      );

      // Extract trends and risks
      const trends = this.extractTrends(trendAnalysis);
      const risks = this.extractRisks(anomalyDetection, financialForecast);
      const opportunities = this.extractOpportunities(spendingPrediction, financialForecast);

      const predictiveInsights: IPredictiveInsights = {
        summary: {
          totalInsights: insights.length,
          highPriorityInsights: insights.filter(i => i.priority === 'high' || i.priority === 'critical').length,
          criticalInsights: insights.filter(i => i.priority === 'critical').length
        },
        insights,
        trends,
        risks,
        opportunities
      };

      logger.info('Predictive insights generated successfully', { 
        userId: query.userId,
        totalInsights: predictiveInsights.summary.totalInsights,
        criticalInsights: predictiveInsights.summary.criticalInsights
      });

      return predictiveInsights;
    } catch (error) {
      logger.error('Error generating predictive insights', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Get spending prediction
   */
  async getSpendingPrediction(query: IPredictiveQuery): Promise<ISpendingPrediction> {
    try {
      logger.info('Getting spending prediction', { userId: query.userId });
      return await this.spendingPredictionService.predictSpending(query);
    } catch (error) {
      logger.error('Error getting spending prediction', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Get anomaly detection results
   */
  async getAnomalyDetection(query: IPredictiveQuery): Promise<IAnomalyDetection> {
    try {
      logger.info('Getting anomaly detection', { userId: query.userId });
      return await this.anomalyDetectionService.detectAnomalies(query);
    } catch (error) {
      logger.error('Error getting anomaly detection', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Get financial forecast
   */
  async getFinancialForecast(query: IPredictiveQuery): Promise<IFinancialForecast> {
    try {
      logger.info('Getting financial forecast', { userId: query.userId });
      return await this.financialForecastingService.generateFinancialForecast(query);
    } catch (error) {
      logger.error('Error getting financial forecast', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Get cash flow prediction
   */
  async getCashFlowPrediction(query: IPredictiveQuery): Promise<ICashFlowPrediction> {
    try {
      logger.info('Getting cash flow prediction', { userId: query.userId });
      return await this.financialForecastingService.generateCashFlowPrediction(query);
    } catch (error) {
      logger.error('Error getting cash flow prediction', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Get trend analysis
   */
  async getTrendAnalysis(query: IPredictiveQuery): Promise<ITrendAnalysis> {
    try {
      logger.info('Getting trend analysis', { userId: query.userId });
      return await this.trendAnalysisService.analyzeTrends(query);
    } catch (error) {
      logger.error('Error getting trend analysis', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Train a predictive model
   */
  async trainModel(userId: string, modelType: string, parameters: Record<string, any>): Promise<IPredictiveModel> {
    try {
      logger.info('Training predictive model', { userId, modelType, parameters });
      
      switch (modelType) {
        case 'spending_prediction':
          return await this.spendingPredictionService.trainModel(userId, modelType, parameters);
        default:
          throw new Error(`Unsupported model type: ${modelType}`);
      }
    } catch (error) {
      logger.error('Error training model', { error: String(error), userId, modelType });
      throw error;
    }
  }

  /**
   * Generate comprehensive insights from all analyses
   */
  private async generateComprehensiveInsights(
    spendingPrediction: ISpendingPrediction,
    anomalyDetection: IAnomalyDetection,
    financialForecast: IFinancialForecast,
    trendAnalysis: ITrendAnalysis,
    query: IPredictiveQuery
  ): Promise<any[]> {
    const insights = [];

    // Spending prediction insights
    if (spendingPrediction.confidence === 'high' && spendingPrediction.totalPredictedAmount > 0) {
      const avgDailySpending = spendingPrediction.averageDailyPrediction;
      const monthlyProjection = avgDailySpending * 30;
      
      insights.push({
        id: `spending_prediction_${Date.now()}`,
        type: 'prediction',
        priority: spendingPrediction.confidence === 'high' ? 'high' : 'medium',
        title: 'Spending Prediction Available',
        description: `Based on historical data, your projected spending is $${monthlyProjection.toFixed(2)} per month with ${spendingPrediction.confidence} confidence.`,
        data: {
          totalPredictedAmount: spendingPrediction.totalPredictedAmount,
          averageDailyPrediction: spendingPrediction.averageDailyPrediction,
          confidence: spendingPrediction.confidence,
          methodology: spendingPrediction.methodology
        },
        recommendations: [
          {
            action: 'Review predicted spending against your budget',
            priority: 'high',
            expectedImpact: 'Better budget planning and control',
            effort: 'low'
          }
        ],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });
    }

    // Anomaly detection insights
    if (anomalyDetection.summary.totalAnomalies > 0) {
      const criticalAnomalies = anomalyDetection.anomalies.filter(a => a.severity === 'critical');
      const highAnomalies = anomalyDetection.anomalies.filter(a => a.severity === 'high');
      
      if (criticalAnomalies.length > 0) {
        insights.push({
          id: `critical_anomalies_${Date.now()}`,
          type: 'anomaly',
          priority: 'critical',
          title: 'Critical Spending Anomalies Detected',
          description: `${criticalAnomalies.length} critical spending anomalies detected that require immediate attention.`,
          data: {
            anomalies: criticalAnomalies,
            totalAnomalies: anomalyDetection.summary.totalAnomalies
          },
          recommendations: criticalAnomalies.flatMap(a => a.recommendations),
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
        });
      } else if (highAnomalies.length > 0) {
        insights.push({
          id: `high_anomalies_${Date.now()}`,
          type: 'anomaly',
          priority: 'high',
          title: 'High Priority Spending Anomalies',
          description: `${highAnomalies.length} high priority spending anomalies detected.`,
          data: {
            anomalies: highAnomalies,
            totalAnomalies: anomalyDetection.summary.totalAnomalies
          },
          recommendations: highAnomalies.flatMap(a => a.recommendations),
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
        });
      }
    }

    // Financial forecast insights
    if (financialForecast.baseScenario.confidence === 'high') {
      const projectedNetWorth = financialForecast.baseScenario.projectedNetWorth;
      const projectedSavings = financialForecast.baseScenario.projectedSavings;
      
      if (projectedNetWorth < 0) {
        insights.push({
          id: `negative_net_worth_${Date.now()}`,
          type: 'risk',
          priority: 'critical',
          title: 'Projected Negative Net Worth',
          description: `Based on current trends, your projected net worth is negative: $${Math.abs(projectedNetWorth).toFixed(2)}.`,
          data: {
            projectedNetWorth,
            projectedSavings,
            scenarios: financialForecast.scenarios
          },
          recommendations: [
            {
              action: 'Immediately review and reduce expenses',
              priority: 'critical',
              expectedImpact: 'Prevent negative net worth',
              effort: 'high'
            },
            {
              action: 'Increase income sources',
              priority: 'high',
              expectedImpact: 'Improve financial position',
              effort: 'high'
            }
          ],
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
        });
      } else if (projectedSavings < 0) {
        insights.push({
          id: `negative_savings_${Date.now()}`,
          type: 'risk',
          priority: 'high',
          title: 'Projected Negative Savings',
          description: `Based on current trends, you may not be able to save money in the forecast period.`,
          data: {
            projectedNetWorth,
            projectedSavings,
            scenarios: financialForecast.scenarios
          },
          recommendations: [
            {
              action: 'Review budget allocations',
              priority: 'high',
              expectedImpact: 'Enable savings',
              effort: 'medium'
            }
          ],
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
      }
    }

    // Trend analysis insights
    if (trendAnalysis.overallTrend.direction === 'increasing' && trendAnalysis.overallTrend.strength === 'strong') {
      insights.push({
        id: `increasing_trend_${Date.now()}`,
        type: 'trend',
        priority: 'high',
        title: 'Strong Increasing Spending Trend',
        description: `Your spending shows a strong increasing trend. Consider reviewing your budget and spending habits.`,
        data: {
          direction: trendAnalysis.overallTrend.direction,
          strength: trendAnalysis.overallTrend.strength,
          confidence: trendAnalysis.overallTrend.confidence
        },
        recommendations: [
          {
            action: 'Implement spending controls',
            priority: 'high',
            expectedImpact: 'Control spending growth',
            effort: 'medium'
          },
          {
            action: 'Review and adjust budget categories',
            priority: 'medium',
            expectedImpact: 'Better budget alignment',
            effort: 'low'
          }
        ],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
      });
    }

    // Risk factors insights
    if (financialForecast.riskFactors.length > 0) {
      const highImpactRisks = financialForecast.riskFactors.filter(r => r.impact === 'high');
      
      if (highImpactRisks.length > 0) {
        insights.push({
          id: `high_impact_risks_${Date.now()}`,
          type: 'risk',
          priority: 'high',
          title: 'High Impact Financial Risks Identified',
          description: `${highImpactRisks.length} high impact financial risks have been identified in your forecast.`,
          data: {
            risks: highImpactRisks,
            totalRisks: financialForecast.riskFactors.length
          },
          recommendations: highImpactRisks.map(risk => ({
            action: risk.mitigation,
            priority: 'high',
            expectedImpact: 'Risk mitigation',
            effort: 'medium'
          })),
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });
      }
    }

    return insights;
  }

  /**
   * Extract trends from trend analysis
   */
  private extractTrends(trendAnalysis: ITrendAnalysis): any[] {
    return trendAnalysis.categoryTrends.map(trend => ({
      categoryId: trend.categoryId,
      categoryName: trend.categoryName,
      trend: trend.trend.direction,
      strength: trend.trend.strength,
      confidence: trend.trend.confidence,
      description: `Category ${trend.categoryName} shows ${trend.trend.direction} trend with ${trend.trend.strength} strength`
    }));
  }

  /**
   * Extract risks from analyses
   */
  private extractRisks(anomalyDetection: IAnomalyDetection, financialForecast: IFinancialForecast): any[] {
    const risks = [];

    // Anomaly-based risks
    if (anomalyDetection.summary.criticalAnomalies > 0) {
      risks.push({
        type: 'spending_risk',
        severity: 'critical',
        description: `${anomalyDetection.summary.criticalAnomalies} critical spending anomalies detected`,
        probability: 1.0,
        impact: 0.9
      });
    }

    // Financial forecast risks
    financialForecast.riskFactors.forEach(risk => {
      risks.push({
        type: 'forecast_risk',
        severity: risk.impact === 'high' ? 'high' : risk.impact === 'medium' ? 'medium' : 'low',
        description: risk.description,
        probability: risk.probability,
        impact: risk.impact === 'high' ? 0.8 : risk.impact === 'medium' ? 0.5 : 0.3
      });
    });

    return risks;
  }

  /**
   * Extract opportunities from analyses
   */
  private extractOpportunities(spendingPrediction: ISpendingPrediction, financialForecast: IFinancialForecast): any[] {
    const opportunities = [];

    // Savings opportunities based on spending prediction
    if (spendingPrediction.confidence === 'high') {
      const potentialSavings = spendingPrediction.totalPredictedAmount * 0.1; // 10% reduction opportunity
      
      if (potentialSavings > 100) {
        opportunities.push({
          type: 'saving_opportunity',
          potential: 'medium',
          description: `Potential savings of $${potentialSavings.toFixed(2)} through spending optimization`,
          expectedBenefit: potentialSavings,
          effort: 'medium',
          action: 'Implement spending controls and budget optimization'
        });
      }
    }

    // Budget optimization opportunities
    if (financialForecast.baseScenario.projectedSavings > 0) {
      opportunities.push({
        type: 'budget_optimization',
        potential: 'high',
        description: 'Current budget allows for savings - consider investment opportunities',
        expectedBenefit: financialForecast.baseScenario.projectedSavings,
        effort: 'low',
        action: 'Explore investment options for surplus funds'
      });
    }

    return opportunities;
  }
}


