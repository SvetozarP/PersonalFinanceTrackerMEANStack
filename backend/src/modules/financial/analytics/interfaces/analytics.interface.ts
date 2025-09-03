export interface IAnalyticsQuery {
  userId: string;
  startDate: Date;
  endDate: Date;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  categories?: string[];
  transactionTypes?: string[];
  accounts?: string[];
  tags?: string[];
  minAmount?: number;
  maxAmount?: number;
  includeRecurring?: boolean;
  includePending?: boolean;
}

export interface ISpendingAnalysis {
  totalSpent: number;
  totalIncome: number;
  netAmount: number;
  averageDailySpending: number;
  averageMonthlySpending: number;
  spendingByCategory: Array<{
    categoryId: string;
    categoryName: string;
    categoryPath: string;
    amount: number;
    percentage: number;
    transactionCount: number;
    averageAmount: number;
  }>;
  spendingByDay: Array<{
    date: string;
    amount: number;
    transactionCount: number;
  }>;
  spendingByMonth: Array<{
    month: string;
    amount: number;
    transactionCount: number;
    averageAmount: number;
  }>;
  topSpendingDays: Array<{
    date: string;
    amount: number;
    transactionCount: number;
  }>;
  spendingTrends: Array<{
    period: string;
    amount: number;
    change: number;
    percentageChange: number;
  }>;
}

export interface IBudgetAnalytics {
  budgetId: string;
  budgetName: string;
  totalAllocated: number;
  totalSpent: number;
  remainingAmount: number;
  utilizationPercentage: number;
  status: 'under' | 'on-track' | 'over' | 'critical';
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    allocatedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    utilizationPercentage: number;
    status: 'under' | 'on-track' | 'over' | 'critical';
    transactions: Array<{
      id: string;
      amount: number;
      date: Date;
      description: string;
    }>;
  }>;
  dailyProgress: Array<{
    date: string;
    allocatedAmount: number;
    spentAmount: number;
    remainingAmount: number;
  }>;
  alerts: Array<{
    type: 'warning' | 'critical';
    message: string;
    categoryId?: string;
    threshold: number;
    currentValue: number;
  }>;
}

export interface IFinancialInsights {
  spendingPatterns: {
    mostExpensiveDay: string;
    mostExpensiveMonth: string;
    leastExpensiveDay: string;
    leastExpensiveMonth: string;
    averageTransactionAmount: number;
    largestTransaction: number;
    smallestTransaction: number;
  };
  categoryInsights: {
    highestSpendingCategory: string;
    lowestSpendingCategory: string;
    mostFrequentCategory: string;
    categoryGrowthRates: Array<{
      categoryId: string;
      categoryName: string;
      growthRate: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
  };
  timeInsights: {
    peakSpendingTime: string;
    peakSpendingDay: string;
    seasonalPatterns: Array<{
      season: string;
      averageSpending: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
  };
  recommendations: Array<{
    type: 'spending' | 'saving' | 'budget' | 'category';
    priority: 'high' | 'medium' | 'low';
    message: string;
    action: string;
    potentialSavings?: number;
  }>;
}

export interface ICashFlowAnalysis {
  period: string;
  openingBalance: number;
  closingBalance: number;
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  cashFlowByType: Array<{
    type: string;
    amount: number;
    percentage: number;
    transactionCount: number;
  }>;
  cashFlowByCategory: Array<{
    categoryId: string;
    categoryName: string;
    inflows: number;
    outflows: number;
    netAmount: number;
  }>;
  cashFlowByPeriod: Array<{
    period: string;
    inflows: number;
    outflows: number;
    netAmount: number;
    balance: number;
  }>;
  projections: Array<{
    period: string;
    projectedInflows: number;
    projectedOutflows: number;
    projectedBalance: number;
    confidence: 'high' | 'medium' | 'low';
  }>;
}

export interface IComparisonAnalysis {
  currentPeriod: {
    startDate: Date;
    endDate: Date;
    data: ISpendingAnalysis;
  };
  previousPeriod: {
    startDate: Date;
    endDate: Date;
    data: ISpendingAnalysis;
  };
  changes: {
    totalSpent: {
      amount: number;
      percentage: number;
      trend: 'increase' | 'decrease' | 'no-change';
    };
    totalIncome: {
      amount: number;
      percentage: number;
      trend: 'increase' | 'decrease' | 'no-change';
    };
    netAmount: {
      amount: number;
      percentage: number;
      trend: 'increase' | 'decrease' | 'no-change';
    };
    categoryChanges: Array<{
      categoryId: string;
      categoryName: string;
      currentAmount: number;
      previousAmount: number;
      change: number;
      percentageChange: number;
      trend: 'increase' | 'decrease' | 'no-change';
    }>;
  };
  insights: string[];
}

// Budget Reporting Interfaces
export interface IBudgetPerformanceReport {
  budgetId: string;
  budgetName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  performance: {
    totalAllocated: number;
    totalSpent: number;
    remainingAmount: number;
    utilizationPercentage: number;
    varianceAmount: number;
    variancePercentage: number;
    status: 'under' | 'on-track' | 'over' | 'critical';
  };
  categoryPerformance: Array<{
    categoryId: string;
    categoryName: string;
    allocatedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    utilizationPercentage: number;
    varianceAmount: number;
    variancePercentage: number;
    status: 'under' | 'on-track' | 'over' | 'critical';
    topTransactions: Array<{
      id: string;
      amount: number;
      date: Date;
      description: string;
    }>;
  }>;
  trends: {
    dailySpending: Array<{
      date: string;
      allocatedAmount: number;
      spentAmount: number;
      cumulativeSpent: number;
      remainingAmount: number;
    }>;
    weeklyTrends: Array<{
      week: string;
      allocatedAmount: number;
      spentAmount: number;
      varianceAmount: number;
      variancePercentage: number;
    }>;
  };
  insights: Array<{
    type: 'performance' | 'trend' | 'alert' | 'recommendation';
    priority: 'high' | 'medium' | 'low';
    message: string;
    data?: any;
  }>;
}

export interface IBudgetVsActualReport {
  budgetId: string;
  budgetName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalBudgeted: number;
    totalActual: number;
    variance: number;
    variancePercentage: number;
    status: 'under' | 'on-track' | 'over' | 'critical';
  };
  categoryComparison: Array<{
    categoryId: string;
    categoryName: string;
    budgetedAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
    status: 'under' | 'on-track' | 'over' | 'critical';
    efficiency: number; // actual/budgeted ratio
  }>;
  monthlyBreakdown: Array<{
    month: string;
    budgetedAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
    cumulativeVariance: number;
  }>;
  topVariances: Array<{
    categoryId: string;
    categoryName: string;
    variance: number;
    variancePercentage: number;
    type: 'over' | 'under';
  }>;
  recommendations: Array<{
    type: 'budget_adjustment' | 'spending_control' | 'category_reallocation';
    priority: 'high' | 'medium' | 'low';
    message: string;
    potentialSavings?: number;
    suggestedAction: string;
  }>;
}

export interface IBudgetTrendAnalysis {
  budgetId: string;
  budgetName: string;
  analysisPeriod: {
    startDate: Date;
    endDate: Date;
  };
  trends: {
    utilizationTrend: Array<{
      period: string;
      utilizationPercentage: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
    spendingVelocity: Array<{
      period: string;
      dailyAverageSpending: number;
      projectedEndOfPeriodSpending: number;
      confidence: 'high' | 'medium' | 'low';
    }>;
    categoryTrends: Array<{
      categoryId: string;
      categoryName: string;
      trend: Array<{
        period: string;
        utilizationPercentage: number;
        trend: 'increasing' | 'decreasing' | 'stable';
      }>;
    }>;
  };
  projections: {
    endOfPeriodProjection: {
      projectedSpending: number;
      projectedVariance: number;
      confidence: 'high' | 'medium' | 'low';
      basedOnTrend: 'last_week' | 'last_month' | 'average';
    };
    categoryProjections: Array<{
      categoryId: string;
      categoryName: string;
      projectedSpending: number;
      projectedVariance: number;
      confidence: 'high' | 'medium' | 'low';
    }>;
  };
  insights: Array<{
    type: 'trend' | 'projection' | 'alert' | 'opportunity';
    priority: 'high' | 'medium' | 'low';
    message: string;
    data?: any;
  }>;
}

export interface IBudgetVarianceAnalysis {
  budgetId: string;
  budgetName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  varianceSummary: {
    totalVariance: number;
    totalVariancePercentage: number;
    favorableVariances: number;
    unfavorableVariances: number;
    netVariance: number;
  };
  categoryVariances: Array<{
    categoryId: string;
    categoryName: string;
    budgetedAmount: number;
    actualAmount: number;
    variance: number;
    variancePercentage: number;
    varianceType: 'favorable' | 'unfavorable';
    impact: 'high' | 'medium' | 'low';
    rootCause?: string;
  }>;
  varianceDrivers: Array<{
    categoryId: string;
    categoryName: string;
    varianceContribution: number;
    varianceContributionPercentage: number;
    type: 'positive' | 'negative';
  }>;
  varianceTrends: Array<{
    period: string;
    totalVariance: number;
    favorableVariances: number;
    unfavorableVariances: number;
    netVariance: number;
  }>;
  recommendations: Array<{
    type: 'budget_revision' | 'process_improvement' | 'category_adjustment';
    priority: 'high' | 'medium' | 'low';
    message: string;
    expectedImpact: number;
    actionRequired: string;
  }>;
}

export interface IBudgetForecast {
  budgetId: string;
  budgetName: string;
  forecastPeriod: {
    startDate: Date;
    endDate: Date;
  };
  forecast: {
    projectedSpending: number;
    projectedVariance: number;
    confidence: 'high' | 'medium' | 'low';
    methodology: 'historical' | 'trend' | 'seasonal' | 'hybrid';
  };
  categoryForecasts: Array<{
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
  scenarios: Array<{
    scenario: 'optimistic' | 'realistic' | 'pessimistic';
    projectedSpending: number;
    projectedVariance: number;
    probability: number;
    keyAssumptions: string[];
  }>;
  riskFactors: Array<{
    factor: string;
    impact: 'high' | 'medium' | 'low';
    probability: 'high' | 'medium' | 'low';
    description: string;
    mitigation: string;
  }>;
  recommendations: Array<{
    type: 'budget_adjustment' | 'spending_control' | 'risk_mitigation';
    priority: 'high' | 'medium' | 'low';
    message: string;
    expectedOutcome: string;
    actionRequired: string;
  }>;
}

export interface IBudgetCategoryBreakdown {
  budgetId: string;
  budgetName: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    categoryPath: string;
    allocatedAmount: number;
    spentAmount: number;
    remainingAmount: number;
    utilizationPercentage: number;
    transactionCount: number;
    averageTransactionAmount: number;
    largestTransaction: number;
    smallestTransaction: number;
    status: 'under' | 'on-track' | 'over' | 'critical';
    subcategories?: Array<{
      subcategoryId: string;
      subcategoryName: string;
      allocatedAmount: number;
      spentAmount: number;
      utilizationPercentage: number;
    }>;
  }>;
  spendingPatterns: {
    topSpendingCategories: Array<{
      categoryId: string;
      categoryName: string;
      amount: number;
      percentage: number;
    }>;
    mostActiveCategories: Array<{
      categoryId: string;
      categoryName: string;
      transactionCount: number;
      averageAmount: number;
    }>;
    categoryEfficiency: Array<{
      categoryId: string;
      categoryName: string;
      efficiency: number; // spent/allocated ratio
      status: 'efficient' | 'inefficient' | 'over-spent';
    }>;
  };
  insights: Array<{
    type: 'allocation' | 'spending' | 'efficiency' | 'pattern';
    priority: 'high' | 'medium' | 'low';
    message: string;
    data?: any;
  }>;
}

export interface IBudgetAlert {
  id: string;
  budgetId: string;
  budgetName: string;
  type: 'threshold' | 'variance' | 'trend' | 'projection';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  triggeredAt: Date;
  data: {
    currentValue: number;
    threshold?: number;
    variance?: number;
    variancePercentage?: number;
    categoryId?: string;
    categoryName?: string;
  };
  actions: Array<{
    type: 'notification' | 'email' | 'sms' | 'dashboard_alert';
    status: 'sent' | 'pending' | 'failed';
    sentAt?: Date;
  }>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface IBudgetExportOptions {
  format: 'json' | 'csv' | 'pdf' | 'excel';
  reportType: 'performance' | 'variance' | 'trend' | 'forecast' | 'breakdown' | 'all';
  includeCharts: boolean;
  includeDetails: boolean;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  budgetIds?: string[];
  categories?: string[];
}