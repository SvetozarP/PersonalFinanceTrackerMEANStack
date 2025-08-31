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