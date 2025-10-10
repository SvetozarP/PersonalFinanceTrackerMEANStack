// Predictive Analytics Interfaces
// This file defines interfaces for predictive analysis algorithms including:
// - Spending prediction models
// - Anomaly detection results
// - Financial forecasting
// - Trend analysis
// - Machine learning model outputs

export interface ISpendingPrediction {
  period: {
    startDate: Date;
    endDate: Date;
  };
  predictions: Array<{
    date: string;
    predictedAmount: number;
    confidence: number; // 0-1 confidence score
    factors: Array<{
      factor: string;
      impact: number;
      weight: number;
    }>;
  }>;
  totalPredictedAmount: number;
  averageDailyPrediction: number;
  confidence: 'high' | 'medium' | 'low';
  methodology: 'linear_regression' | 'time_series' | 'seasonal_decomposition' | 'hybrid';
  accuracy: {
    historicalAccuracy: number; // 0-1 accuracy score based on historical data
    lastPredictionAccuracy: number;
    trendAccuracy: number;
  };
  riskFactors: Array<{
    factor: string;
    impact: 'high' | 'medium' | 'low';
    probability: number;
    description: string;
  }>;
}

export interface IAnomalyDetection {
  period: {
    startDate: Date;
    endDate: Date;
  };
  anomalies: Array<{
    id: string;
    type: 'spending_spike' | 'unusual_category' | 'timing_anomaly' | 'amount_anomaly' | 'pattern_break';
    severity: 'low' | 'medium' | 'high' | 'critical';
    detectedAt: Date;
    transactionId?: string;
    description: string;
    data: {
      expectedValue: number;
      actualValue: number;
      deviation: number;
      deviationPercentage: number;
      categoryId?: string;
      categoryName?: string;
      date: Date;
    };
    confidence: number; // 0-1 confidence score
    explanation: string;
    recommendations: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      expectedImpact: string;
    }>;
  }>;
  summary: {
    totalAnomalies: number;
    criticalAnomalies: number;
    highSeverityAnomalies: number;
    averageConfidence: number;
    detectionAccuracy: number;
  };
  model: {
    algorithm: 'statistical' | 'isolation_forest' | 'local_outlier_factor' | 'one_class_svm' | 'hybrid';
    parameters: Record<string, any>;
    trainingDataSize: number;
    lastTrained: Date;
  };
}

export interface IFinancialForecast {
  forecastPeriod: {
    startDate: Date;
    endDate: Date;
  };
  baseScenario: {
    projectedIncome: number;
    projectedExpenses: number;
    projectedNetWorth: number;
    projectedSavings: number;
    confidence: 'high' | 'medium' | 'low';
  };
  scenarios: Array<{
    name: 'optimistic' | 'realistic' | 'pessimistic' | 'custom';
    probability: number; // 0-1 probability of this scenario
    projectedIncome: number;
    projectedExpenses: number;
    projectedNetWorth: number;
    projectedSavings: number;
    keyAssumptions: Array<{
      assumption: string;
      impact: number;
      confidence: number;
    }>;
  }>;
  categoryForecasts: Array<{
    categoryId: string;
    categoryName: string;
    projectedAmount: number;
    confidence: 'high' | 'medium' | 'low';
    trend: 'increasing' | 'decreasing' | 'stable';
    factors: Array<{
      factor: string;
      impact: number;
      weight: number;
    }>;
  }>;
  monthlyProjections: Array<{
    month: string;
    projectedIncome: number;
    projectedExpenses: number;
    projectedNetWorth: number;
    projectedSavings: number;
    confidence: number;
  }>;
  riskFactors: Array<{
    factor: string;
    impact: 'high' | 'medium' | 'low';
    probability: number;
    description: string;
    mitigation: string;
  }>;
  methodology: {
    algorithm: 'arima' | 'exponential_smoothing' | 'linear_regression' | 'neural_network' | 'hybrid';
    parameters: Record<string, any>;
    trainingPeriod: {
      startDate: Date;
      endDate: Date;
    };
    accuracy: number;
  };
}

export interface ITrendAnalysis {
  analysisPeriod: {
    startDate: Date;
    endDate: Date;
  };
  overallTrend: {
    direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    strength: 'weak' | 'moderate' | 'strong';
    confidence: number;
    description: string;
  };
  categoryTrends: Array<{
    categoryId: string;
    categoryName: string;
    trend: {
      direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
      strength: 'weak' | 'moderate' | 'strong';
      confidence: number;
    };
    data: Array<{
      period: string;
      amount: number;
      change: number;
      percentageChange: number;
    }>;
    seasonalPattern: {
      hasSeasonality: boolean;
      peakMonths: string[];
      lowMonths: string[];
      seasonalStrength: number;
    };
    forecast: {
      nextPeriodPrediction: number;
      confidence: number;
      trend: 'continuing' | 'reversing' | 'stabilizing';
    };
  }>;
  spendingPatterns: {
    weeklyPattern: Array<{
      day: string;
      averageAmount: number;
      frequency: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    monthlyPattern: Array<{
      month: string;
      averageAmount: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    seasonalPattern: Array<{
      season: string;
      averageAmount: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
  };
  insights: Array<{
    type: 'trend' | 'pattern' | 'anomaly' | 'opportunity';
    priority: 'high' | 'medium' | 'low';
    message: string;
    data?: any;
    recommendations?: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      expectedImpact: string;
    }>;
  }>;
  methodology: {
    algorithm: 'linear_regression' | 'moving_average' | 'exponential_smoothing' | 'seasonal_decomposition' | 'hybrid';
    parameters: Record<string, any>;
    accuracy: number;
  };
}

export interface IBudgetPrediction {
  budgetId: string;
  budgetName: string;
  predictionPeriod: {
    startDate: Date;
    endDate: Date;
  };
  currentStatus: {
    allocatedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    utilizationPercentage: number;
    daysRemaining: number;
  };
  predictions: {
    endOfPeriodProjection: {
      projectedSpending: number;
      projectedVariance: number;
      confidence: 'high' | 'medium' | 'low';
      methodology: 'historical' | 'trend' | 'seasonal' | 'hybrid';
    };
    categoryProjections: Array<{
      categoryId: string;
      categoryName: string;
      projectedSpending: number;
      projectedVariance: number;
      confidence: 'high' | 'medium' | 'low';
      factors: Array<{
        factor: string;
        impact: number;
        weight: number;
      }>;
    }>;
    dailyProjections: Array<{
      date: string;
      projectedSpending: number;
      projectedCumulativeSpending: number;
      projectedRemainingAmount: number;
      confidence: number;
    }>;
  };
  riskAssessment: {
    overBudgetRisk: 'low' | 'medium' | 'high';
    underSpendingRisk: 'low' | 'medium' | 'high';
    categoryRisks: Array<{
      categoryId: string;
      categoryName: string;
      riskLevel: 'low' | 'medium' | 'high';
      riskFactors: string[];
    }>;
  };
  recommendations: Array<{
    type: 'budget_adjustment' | 'spending_control' | 'category_reallocation' | 'timeline_adjustment';
    priority: 'high' | 'medium' | 'low';
    message: string;
    expectedImpact: string;
    actionRequired: string;
  }>;
}

export interface ICashFlowPrediction {
  predictionPeriod: {
    startDate: Date;
    endDate: Date;
  };
  currentBalance: number;
  predictions: {
    projectedInflows: number;
    projectedOutflows: number;
    projectedNetCashFlow: number;
    projectedEndingBalance: number;
    confidence: 'high' | 'medium' | 'low';
  };
  monthlyProjections: Array<{
    month: string;
    projectedInflows: number;
    projectedOutflows: number;
    projectedNetCashFlow: number;
    projectedBalance: number;
    confidence: number;
  }>;
  categoryProjections: Array<{
    categoryId: string;
    categoryName: string;
    projectedInflows: number;
    projectedOutflows: number;
    projectedNetAmount: number;
    confidence: 'high' | 'medium' | 'low';
  }>;
  riskFactors: Array<{
    factor: string;
    impact: 'high' | 'medium' | 'low';
    probability: number;
    description: string;
    mitigation: string;
  }>;
  scenarios: Array<{
    name: 'optimistic' | 'realistic' | 'pessimistic';
    probability: number;
    projectedEndingBalance: number;
    keyAssumptions: string[];
  }>;
  methodology: {
    algorithm: 'arima' | 'exponential_smoothing' | 'linear_regression' | 'neural_network' | 'hybrid';
    parameters: Record<string, any>;
    accuracy: number;
  };
}

export interface IPredictiveModel {
  id: string;
  name: string;
  type: 'spending_prediction' | 'anomaly_detection' | 'forecasting' | 'trend_analysis' | 'budget_prediction';
  algorithm: string;
  parameters: Record<string, any>;
  trainingData: {
    startDate: Date;
    endDate: Date;
    recordCount: number;
  };
  performance: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    lastEvaluated: Date;
  };
  status: 'training' | 'ready' | 'degraded' | 'error';
  createdAt: Date;
  updatedAt: Date;
  lastTrained: Date;
}

export interface IPredictiveQuery {
  userId: string;
  startDate: Date;
  endDate: Date;
  categories?: string[];
  transactionTypes?: string[];
  accounts?: string[];
  includeRecurring?: boolean;
  confidenceThreshold?: number;
  modelType?: 'spending_prediction' | 'anomaly_detection' | 'forecasting' | 'trend_analysis' | 'budget_prediction';
  algorithm?: string;
}

export interface IPredictiveInsights {
  summary: {
    totalInsights: number;
    highPriorityInsights: number;
    criticalInsights: number;
  };
  insights: Array<{
    id: string;
    type: 'prediction' | 'anomaly' | 'trend' | 'risk' | 'opportunity';
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    data: any;
    recommendations: Array<{
      action: string;
      priority: 'high' | 'medium' | 'low';
      expectedImpact: string;
      effort: 'low' | 'medium' | 'high';
    }>;
    createdAt: Date;
    expiresAt?: Date;
  }>;
  trends: Array<{
    categoryId: string;
    categoryName: string;
    trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
    strength: 'weak' | 'moderate' | 'strong';
    confidence: number;
    description: string;
  }>;
  risks: Array<{
    type: 'budget_risk' | 'cash_flow_risk' | 'spending_risk' | 'saving_risk';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    probability: number;
    impact: number;
    mitigation: string;
  }>;
  opportunities: Array<{
    type: 'saving_opportunity' | 'budget_optimization' | 'investment_opportunity' | 'cost_reduction';
    potential: 'low' | 'medium' | 'high';
    description: string;
    expectedBenefit: number;
    effort: 'low' | 'medium' | 'high';
    action: string;
  }>;
}






