// Financial data models for the frontend

export interface Category {
    _id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    parentId?: string;
    path: string[];
    level: number;
    isActive: boolean;
    isSystem: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface Transaction {
    _id: string;
    title: string;
    description?: string;
    amount: number;
    currency: string;
    type: TransactionType;
    status: TransactionStatus;
    categoryId: string;
    subcategoryId?: string;
    tags: string[];
    date: Date;
    time?: string;
    timezone: string;
    location?: {
      name?: string;
      address?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
    };
    paymentMethod: PaymentMethod;
    paymentReference?: string;
    merchantName?: string;
    merchantId?: string;
    originalAmount?: number;
    originalCurrency?: string;
    exchangeRate?: number;
    fees?: number;
    tax?: number;
    isRecurring: boolean;
    recurrencePattern: RecurrencePattern;
    recurrenceInterval?: number;
    recurrenceEndDate?: Date;
    nextOccurrence?: Date;
    parentTransactionId?: string;
    attachments: {
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
      uploadedAt: Date;
    }[];
    notes?: string;
    source: string;
    externalId?: string;
    lastSyncedAt?: Date;
    userId: string;
    accountId: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    isDeleted: boolean;
  }
  
  export enum TransactionType {
    INCOME = 'income',
    EXPENSE = 'expense',
    TRANSFER = 'transfer',
    ADJUSTMENT = 'adjustment',
  }
  
  export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    FAILED = 'failed',
  }
  
  export enum PaymentMethod {
    CASH = 'cash',
    DEBIT_CARD = 'debit_card',
    CREDIT_CARD = 'credit_card',
    BANK_TRANSFER = 'bank_transfer',
    CHECK = 'check',
    DIGITAL_WALLET = 'digital_wallet',
    CRYPTO = 'crypto',
    OTHER = 'other',
  }
  
  export enum RecurrencePattern {
    NONE = 'none',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    BIWEEKLY = 'biweekly',
    MONTHLY = 'monthly',
    QUARTERLY = 'quarterly',
    YEARLY = 'yearly',
    CUSTOM = 'custom',
  }
  
  export interface FinancialDashboard {
    overview: {
      totalBalance: number;
      monthlyIncome: number;
      monthlyExpenses: number;
      monthlyNet: number;
      pendingTransactions: number;
      upcomingRecurring: number;
    };
    recentTransactions: Transaction[];
    topCategories: any[];
    spendingTrends: any[];
    budgetStatus: any[];
  }
  
  export interface FinancialReport {
    reportType: string;
    period: { start: Date; end: Date };
    summary: {
      totalIncome: number;
      totalExpenses: number;
      totalTransfers: number;
      netAmount: number;
      transactionCount: number;
    };
    categories: any[];
    trends: any[];
    projections: any[];
    insights: string[];
  }
  
  export interface BudgetAnalysis {
    currentSpending: {
      total: number;
      byCategory: any[];
      vsBudget: any[];
    };
    recommendations: {
      category: string;
      action: string;
      reason: string;
      impact: 'high' | 'medium' | 'low';
    }[];
    alerts: {
      type: 'overspending' | 'unusual' | 'trend';
      message: string;
      severity: 'warning' | 'critical';
    }[];
  }
  
  export interface FinancialInsights {
    period: string;
    insights: {
      type: 'spending' | 'income' | 'savings' | 'trend';
      title: string;
      description: string;
      value: number;
      change: number;
      changeType: 'increase' | 'decrease' | 'stable';
    }[];
    trends: {
      category: string;
      trend: 'rising' | 'falling' | 'stable';
      change: number;
      confidence: number;
    }[];
    predictions: any[];
  }
  
  export interface TransactionStats {
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    totalTransfers: number;
    transactionsByType: Record<string, { count: number; total: number }>;
    transactionsByCategory: Array<{
      categoryId: string;
      categoryName: string;
      count: number;
      total: number;
      percentage: number;
      color: string;
      icon: string;
    }>;
    monthlyTrends: Array<{
      month: string;
      income: number;
      expenses: number;
      net: number;
    }>;
  }
  
  export interface CategoryStats {
    totalCategories: number;
    activeCategories: number;
    categoriesByLevel: Record<number, number>;
    topCategories: Array<{
      categoryId: string;
      name: string;
      transactionCount: number;
      totalAmount: number;
      percentage: number;
    }>;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
  }
  
  export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }
  
  export interface QueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    startDate?: Date;
    endDate?: Date;
  }