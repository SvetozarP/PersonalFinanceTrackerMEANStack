import { Document, Model, Types } from 'mongoose';

// Budget Period Types
export type BudgetPeriod = 'monthly' | 'yearly' | 'custom';

// Budget Status Types
export type BudgetStatus = 'active' | 'paused' | 'completed' | 'archived';

// Category Allocation Interface
export interface ICategoryAllocation {
  categoryId: string;
  allocatedAmount: number;
  isFlexible: boolean;
  priority: number;
}

// Budget Interface
export interface IBudget extends Document {
  // Basic Information
  name: string;
  description?: string;

  // Budget Period
  period: BudgetPeriod;

  // Time Range
  startDate: Date;
  endDate: Date;

  // Total Budget Amount
  totalAmount: number;

  // Currency
  currency: string;

  // Category Allocations
  categoryAllocations: ICategoryAllocation[];

  // Budget Status
  status: BudgetStatus;

  // Alert Settings
  alertThreshold: number;

  // User and Metadata
  userId: string | Types.ObjectId;

  isActive: boolean;

  // Auto-adjustment settings
  autoAdjust: boolean;

  // Rollover settings
  allowRollover: boolean;

  rolloverAmount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Virtual Fields
  durationDays: number;
  remainingDays: number;
  progressPercentage: number;
  spentAmount: number;
  remainingAmount: number;
  isOverBudget: boolean;

  // Instance Methods
  isActiveForDate(date: Date): boolean;
  getCategoryAllocation(categoryId: string): ICategoryAllocation | undefined;
  updateCategoryAllocation(categoryId: string, newAmount: number): boolean;
}

// Budget Model Interface
export interface IBudgetModel extends Model<IBudget> {
  findActiveBudgets(userId: string, date?: Date): Promise<IBudget[]>;
}

// Budget Creation DTO
export interface ICreateBudgetDto {
  name: string;
  description?: string;
  period: BudgetPeriod;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  currency?: string;
  categoryAllocations: ICreateCategoryAllocationDto[];
  alertThreshold?: number;
  autoAdjust?: boolean;
  allowRollover?: boolean;
}

// Category Allocation Creation DTO
export interface ICreateCategoryAllocationDto {
  categoryId: string;
  allocatedAmount: number;
  isFlexible?: boolean;
  priority?: number;
}

// Budget Update DTO
export interface IUpdateBudgetDto {
  name?: string;
  description?: string;
  status?: BudgetStatus;
  totalAmount?: number;
  categoryAllocations?: IUpdateCategoryAllocationDto[];
  alertThreshold?: number;
  autoAdjust?: boolean;
  allowRollover?: boolean;
}

// Category Allocation Update DTO
export interface IUpdateCategoryAllocationDto {
  categoryId: string;
  allocatedAmount?: number;
  isFlexible?: boolean;
  priority?: number;
}

// Budget Query Filters
export interface IBudgetFilters {
  userId?: string;
  status?: BudgetStatus;
  period?: BudgetPeriod;
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  isActive?: boolean;
}

// Budget Analytics Response
export interface IBudgetAnalytics {
  budgetId: string;
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  progressPercentage: number;
  isOverBudget: boolean;
  categoryBreakdown: ICategoryBudgetBreakdown[];
  spendingTrend: ISpendingTrend[];
  alerts: IBudgetAlert[];
}

// Category Budget Breakdown
export interface ICategoryBudgetBreakdown {
  categoryId: string;
  categoryName: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  isOverBudget: boolean;
  isFlexible: boolean;
  priority: number;
}

// Spending Trend
export interface ISpendingTrend {
  date: Date;
  amount: number;
  cumulativeAmount: number;
}

// Budget Alert
export interface IBudgetAlert {
  type: 'threshold' | 'overbudget' | 'category_overbudget';
  message: string;
  severity: 'low' | 'medium' | 'high';
  categoryId?: string;
  currentAmount: number;
  limitAmount: number;
}

// Budget Summary
export interface IBudgetSummary {
  totalBudgets: number;
  activeBudgets: number;
  totalBudgetAmount: number;
  totalSpentAmount: number;
  totalRemainingAmount: number;
  overBudgetCount: number;
  upcomingDeadlines: IBudgetDeadline[];
}

// Budget Deadline
export interface IBudgetDeadline {
  budgetId: string;
  budgetName: string;
  endDate: Date;
  daysRemaining: number;
  remainingAmount: number;
  isOverBudget: boolean;
}

// Budget Statistics
export interface IBudgetStatistics {
  monthlyStats: IMonthlyBudgetStats[];
  categoryStats: ICategoryBudgetStats[];
  spendingPatterns: ISpendingPattern[];
}

// Monthly Budget Stats
export interface IMonthlyBudgetStats {
  month: string;
  year: number;
  totalBudgeted: number;
  totalSpent: number;
  totalSaved: number;
  budgetCount: number;
}

// Category Budget Stats
export interface ICategoryBudgetStats {
  categoryId: string;
  categoryName: string;
  totalBudgeted: number;
  totalSpent: number;
  averageUtilization: number;
  overBudgetCount: number;
}

// Spending Pattern
export interface ISpendingPattern {
  pattern: 'consistent' | 'variable' | 'seasonal' | 'trending';
  description: string;
  confidence: number;
  recommendations: string[];
}
