import { BaseRepository } from '../../../../shared/repositories/base.repository';
import { Transaction } from '../../transactions/models/transaction.model';
import { Category } from '../../categories/models/category.model';
import Budget  from '../../budgets/models/budget.model';
import { IAnalyticsQuery, ISpendingAnalysis, IBudgetAnalytics } from '../interfaces/analytics.interface';
import { logger } from '../../../../shared/services/logger.service';
import { TransactionType, TransactionStatus } from '../../transactions/interfaces/transaction.interface';
import { IBudget } from '../../budgets';
import { PipelineStage, Types } from 'mongoose';

export class AnalyticsRepository extends BaseRepository<IBudget> {
    constructor() {
      // Fix: Pass the Budget model, not the Budget class
      super(Budget);
    }

  /**
   * Get comprehensive spending analysis with complex aggregations
   */
  async getSpendingAnalysis(query: IAnalyticsQuery): Promise<ISpendingAnalysis> {
    try {
      const { userId, startDate, endDate, groupBy = 'month', categories, transactionTypes, minAmount, maxAmount, includeRecurring = true, includePending = true } = query;

      // Build match conditions
      const matchConditions: any = {
        userId: new Types.ObjectId(userId),
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      };

      if (categories && categories.length > 0) {
        matchConditions.categoryId = { $in: categories.map(id => new Types.ObjectId(id)) };
      }

      if (transactionTypes && transactionTypes.length > 0) {
        matchConditions.type = { $in: transactionTypes };
      }

      if (minAmount !== undefined) {
        matchConditions.amount = { ...matchConditions.amount, $gte: minAmount };
      }

      if (maxAmount !== undefined) {
        matchConditions.amount = { ...matchConditions.amount, $lte: maxAmount };
      }

      if (!includePending) {
        matchConditions.status = { $ne: TransactionStatus.PENDING };
      }

      // Pipeline for spending analysis
      const pipeline = [
        { $match: matchConditions },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $facet: {
            // Overall statistics
            overall: [
              {
                $group: {
                  _id: null,
                  totalSpent: {
                    $sum: {
                      $cond: [
                        { $eq: ['$type', TransactionType.EXPENSE] },
                        '$amount',
                        0,
                      ],
                    },
                  },
                  totalIncome: {
                    $sum: {
                      $cond: [
                        { $eq: ['$type', TransactionType.INCOME] },
                        '$amount',
                        0,
                      ],
                    },
                  },
                  transactionCount: { $sum: 1 },
                  averageAmount: { $avg: '$amount' },
                },
              },
            ],
            // Spending by category
            byCategory: [
              {
                $match: { type: TransactionType.EXPENSE },
              },
              {
                $group: {
                  _id: '$categoryId',
                  categoryName: { $first: '$category.name' },
                  categoryPath: { $first: '$category.path' },
                  amount: { $sum: '$amount' },
                  transactionCount: { $sum: 1 },
                  averageAmount: { $avg: '$amount' },
                },
              },
              {
                $sort: { amount: -1 },
              },
            ],
            // Spending by day
            byDay: [
              {
                $match: { type: TransactionType.EXPENSE },
              },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$date',
                    },
                  },
                  amount: { $sum: '$amount' },
                  transactionCount: { $sum: 1 },
                },
              },
              {
                $sort: { _id: 1 },
              },
            ],
            // Spending by month
            byMonth: [
              {
                $match: { type: TransactionType.EXPENSE },
              },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m',
                      date: '$date',
                    },
                  },
                  amount: { $sum: '$amount' },
                  transactionCount: { $sum: 1 },
                  averageAmount: { $avg: '$amount' },
                },
              },
              {
                $sort: { _id: 1 },
              },
            ],
            // Top spending days
            topDays: [
              {
                $match: { type: TransactionType.EXPENSE },
              },
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$date',
                    },
                  },
                  amount: { $sum: '$amount' },
                  transactionCount: { $sum: 1 },
                },
              },
              {
                $sort: { amount: -1 },
              },
              { $limit: 10 },
            ],
          },
        },
      ];

      const result = await Transaction.aggregate(pipeline as PipelineStage[]);
      const data = result[0];

      // Calculate percentages and additional metrics
      const overall = data.overall[0] || { totalSpent: 0, totalIncome: 0, transactionCount: 0, averageAmount: 0 };
      const netAmount = overall.totalIncome - overall.totalSpent;

      // Calculate spending trends (month over month)
      const monthlyData = data.byMonth || [];
      const spendingTrends = this.calculateSpendingTrends(monthlyData);

      // Calculate daily averages
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const averageDailySpending = totalDays > 0 ? overall.totalSpent / totalDays : 0;
      const averageMonthlySpending = overall.totalSpent * (30 / totalDays);

      // Calculate category percentages
      const byCategory = (data.byCategory || []).map((cat: any) => ({
        ...cat,
        percentage: overall.totalSpent > 0 ? (cat.amount / overall.totalSpent) * 100 : 0,
      }));

      return {
        totalSpent: overall.totalSpent,
        totalIncome: overall.totalIncome,
        netAmount,
        averageDailySpending,
        averageMonthlySpending,
        spendingByCategory: byCategory,
        spendingByDay: data.byDay || [],
        spendingByMonth: data.byMonth || [],
        topSpendingDays: data.topDays || [],
        spendingTrends,
      };
    } catch (error) {
      logger.error('Error in getSpendingAnalysis', { error: String(error), query });
      throw error;
    }
  }

  /**
   * Get budget analytics with spending tracking
   */
  async getBudgetAnalytics(userId: string, budgetId: string, startDate: Date, endDate: Date): Promise<IBudgetAnalytics> {
    try {
      // Get budget details
      const budget = await Budget.findOne({ _id: budgetId, userId: new Types.ObjectId(userId) });
      if (!budget) {
        throw new Error('Budget not found');
      }

      // Get spending data for budget period
      const spendingData = await Transaction.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            date: { $gte: startDate, $lte: endDate },
            type: TransactionType.EXPENSE,
            status: { $ne: TransactionStatus.PENDING },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$categoryId',
            categoryName: { $first: '$category.name' },
            spentAmount: { $sum: '$amount' },
            transactions: {
              $push: {
                id: '$_id',
                amount: '$amount',
                date: '$date',
                description: '$description',
              },
            },
          },
        },
      ]);

      // Calculate budget utilization
      const totalAllocated = budget.totalAmount;
      const totalSpent = spendingData.reduce((sum, cat) => sum + cat.spentAmount, 0);
      const remainingAmount = totalAllocated - totalSpent;
      const utilizationPercentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

      // Determine overall status
      let status: 'under' | 'on-track' | 'over' | 'critical';
      if (utilizationPercentage < 80) status = 'under';
      else if (utilizationPercentage < 95) status = 'on-track';
      else if (utilizationPercentage < 110) status = 'over';
      else status = 'critical';

      // Build category breakdown
      const categoryBreakdown = budget.categoryAllocations.map(allocation => {
        const spent = spendingData.find(cat => cat._id.toString() === allocation.categoryId.toString());
        const spentAmount = spent?.spentAmount || 0;
        const remaining = allocation.allocatedAmount - spentAmount;
        const utilization = allocation.allocatedAmount > 0 ? (spentAmount / allocation.allocatedAmount) * 100 : 0;

        let catStatus: 'under' | 'on-track' | 'over' | 'critical';
        if (utilization < 80) catStatus = 'under';
        else if (utilization < 95) catStatus = 'on-track';
        else if (utilization < 110) catStatus = 'over';
        else catStatus = 'critical';

        return {
          categoryId: allocation.categoryId.toString(),
          categoryName: spent?.categoryName || 'Unknown',
          allocatedAmount: allocation.allocatedAmount,
          spentAmount,
          remainingAmount: remaining,
          utilizationPercentage: utilization,
          status: catStatus,
          transactions: spent?.transactions || [],
        };
      });

      // Generate alerts
      const alerts = this.generateBudgetAlerts(categoryBreakdown, totalAllocated, totalSpent);

      // Calculate daily progress
      const dailyProgress = await this.calculateDailyBudgetProgress(budgetId, userId, startDate, endDate);

      return {
        budgetId: (budget._id as Types.ObjectId).toString(),
        budgetName: budget.name,
        totalAllocated,
        totalSpent,
        remainingAmount,
        utilizationPercentage,
        status,
        categoryBreakdown,
        dailyProgress,
        alerts,
      };
    } catch (error) {
      logger.error('Error in getBudgetAnalytics', { error: String(error), userId, budgetId });
      throw error;
    }
  }

  /**
   * Calculate spending trends month over month
   */
  private calculateSpendingTrends(monthlyData: any[]): any[] {
    const trends = [];
    
    for (let i = 1; i < monthlyData.length; i++) {
      const current = monthlyData[i];
      const previous = monthlyData[i - 1];
      
      if (previous && current) {
        const change = current.amount - previous.amount;
        const percentageChange = previous.amount > 0 ? (change / previous.amount) * 100 : 0;
        
        trends.push({
          period: current._id,
          amount: current.amount,
          change,
          percentageChange,
        });
      }
    }
    
    return trends;
  }

  /**
   * Generate budget alerts based on spending patterns
   */
  private generateBudgetAlerts(categoryBreakdown: any[], totalAllocated: number, totalSpent: number): any[] {
    const alerts = [];
    
    // Overall budget alerts
    const overallUtilization = (totalSpent / totalAllocated) * 100;
    if (overallUtilization > 90) {
      alerts.push({
        type: overallUtilization > 100 ? 'critical' : 'warning',
        message: `Budget utilization is at ${overallUtilization.toFixed(1)}%`,
        threshold: 90,
        currentValue: overallUtilization,
      });
    }
    
    // Category-specific alerts
    categoryBreakdown.forEach(cat => {
      if (cat.utilizationPercentage > 90) {
        alerts.push({
          type: cat.utilizationPercentage > 100 ? 'critical' : 'warning',
          message: `${cat.categoryName} category is at ${cat.utilizationPercentage.toFixed(1)}% utilization`,
          categoryId: cat.categoryId,
          threshold: 90,
          currentValue: cat.utilizationPercentage,
        });
      }
    });
    
    return alerts;
  }

  /**
   * Calculate daily budget progress
   */
  private async calculateDailyBudgetProgress(budgetId: string, userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const dailySpending = await Transaction.aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            date: { $gte: startDate, $lte: endDate },
            type: TransactionType.EXPENSE,
            status: { $ne: TransactionStatus.PENDING },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$date',
              },
            },
            spentAmount: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Calculate cumulative spending and remaining amounts
      const budget = await Budget.findById(budgetId);
      if (!budget) return [];

      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const dailyAllocation = budget.totalAmount / totalDays;

      let cumulativeSpent = 0;
      return dailySpending.map(day => {
        cumulativeSpent += day.spentAmount;
        const allocatedAmount = dailyAllocation * (dailySpending.indexOf(day) + 1);
        const remainingAmount = allocatedAmount - cumulativeSpent;

        return {
          date: day._id,
          allocatedAmount,
          spentAmount: cumulativeSpent,
          remainingAmount,
        };
      });
    } catch (error) {
      logger.error('Error calculating daily budget progress', { error: String(error) });
      return [];
    }
  }
}