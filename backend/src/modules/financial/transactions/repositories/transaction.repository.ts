import mongoose, { PipelineStage } from 'mongoose';
import { BaseRepository } from '../../../../shared/repositories/base.repository';
import { logger } from '../../../../shared/services/logger.service';
import {
  ITransaction,
  ITransactionModel,
  TransactionStatus,
  TransactionType,
} from '../interfaces/transaction.interface';
import { Transaction } from '../models/transaction.model';

export class TransactionRepository extends BaseRepository<ITransaction> {
  protected model: ITransactionModel;

  constructor() {
    super(Transaction);
    this.model = Transaction;
  }

  /**
   * Find transactions by user ID with pagination and filtering
   */
  async findByUserId(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
      filter?: Record<string, unknown>;
      populate: string[];
    }
  ): Promise<{
    transactions: ITransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { date: -1, createdAt: -1 },
        filter = {},
        populate = ['categoryId', 'subcategoryId'],
      } = options;

      const queryFilter = { ...filter, userId, isDeleted: false };
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        this.model
          .find(queryFilter)
          .populate(populate)
          .sort(sort)
          .skip(skip)
          .limit(limit),
        this.model.countDocuments(queryFilter),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info('Found transactions for user', {
        userId,
        count: transactions.length,
        total,
        page,
        totalPages,
      });

      return {
        transactions,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error finding transactions for user', {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Find transactions by account ID
   */
  async findByAccountId(
    accountId: string,
    userId: string,
    options: {
      page?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
      filter?: Record<string, unknown>;
    } = {}
  ): Promise<{
    transactions: ITransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        sort = { date: -1, createdAt: -1 },
        filter = {},
      } = options;

      const queryFilter = { ...filter, accountId, userId, isDeleted: false };
      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        this.model
          .find(queryFilter)
          .populate(['categoryId', 'subcategoryId'])
          .sort(sort)
          .skip(skip)
          .limit(limit),
        this.model.countDocuments(queryFilter),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Found transactions for account`, {
        accountId,
        userId,
        count: transactions.length,
        total,
        page,
        totalPages,
      });

      return {
        transactions,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error finding transactions for account`, {
        error: String(error),
        accountId,
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Find transactions by date range with advanced filtering
   */
  async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    options: {
      accountId?: string;
      categoryId?: string;
      type?: TransactionType;
      status?: TransactionStatus;
      minAmount?: number;
      maxAmount?: number;
      tags?: string[];
      populate?: string[];
    } = {}
  ): Promise<ITransaction[]> {
    try {
      const {
        accountId,
        categoryId,
        type,
        status,
        minAmount,
        maxAmount,
        tags,
        populate = [],
      } = options;

      const filter: Record<string, unknown> = {
        userId,
        date: { $gte: startDate, $lte: endDate } as Record<string, unknown>,
        isDeleted: false,
      };

      if (accountId) filter.accountId = accountId;
      if (categoryId) filter.categoryId = categoryId;
      if (type) filter.type = type;
      if (status) filter.status = status;
      if (minAmount !== undefined || maxAmount !== undefined) {
        filter.amount = {} as Record<string, unknown>;
        if (minAmount !== undefined) {
          (filter.amount as Record<string, unknown>).$gte = minAmount;
        }
        if (maxAmount !== undefined) {
          (filter.amount as Record<string, unknown>).$lte = maxAmount;
        }
      }
      if (tags && tags.length > 0) filter.tags = { $in: tags };

      const transactions = await this.model
        .find(filter)
        .populate(populate)
        .sort({ date: -1, createdAt: -1 });

      logger.info(`Found transactions by date range`, {
        userId,
        startDate,
        endDate,
        count: transactions.length,
        filters: options,
      });

      return transactions;
    } catch (error) {
      logger.error(`Error finding transactions by date range`, {
        error: String(error),
        userId,
        startDate,
        endDate,
        options,
      });
      throw error;
    }
  }

  /**
   * Get transaction statistics with advanced aggregations
   */
  async getTransactionStats(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      accountId?: string;
      groupBy?: 'category' | 'type' | 'month' | 'day' | 'paymentMethod';
      includeSubcategories?: boolean;
    } = {}
  ): Promise<any[]> {
    try {
      const {
        startDate,
        endDate,
        accountId,
        groupBy = 'category',
        includeSubcategories = false,
      } = options;

      const matchStage: Record<string, any> = {
        userId: new mongoose.Types.ObjectId(userId),
        isDeleted: false,
      };

      if (startDate || endDate) {
        matchStage.date = {} as Record<string, unknown>;
        if (startDate)
          (matchStage.date as Record<string, unknown>).$gte = startDate;
        if (endDate)
          (matchStage.date as Record<string, unknown>).$lte = endDate;
      }

      if (accountId) {
        matchStage.accountId = new mongoose.Types.ObjectId(accountId);
      }

      let groupStage: { _id: unknown; [key: string]: unknown };
      let lookupStage:
        | {
            $lookup: {
              from: string;
              localField: string;
              foreignField: string;
              as: string;
            };
          }
        | undefined;

      switch (groupBy) {
        case 'category':
          groupStage = {
            _id: {
              categoryId: '$categoryId',
              subcategoryId: includeSubcategories ? '$subcategoryId' : null,
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            minAmount: { $min: '$amount' },
            maxAmount: { $max: '$amount' },
            incomeAmount: {
              $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
            },
            expenseAmount: {
              $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
            },
          };

          lookupStage = {
            $lookup: {
              from: 'categories',
              localField: '_id.categoryId',
              foreignField: '_id',
              as: 'category',
            },
          };
          break;

        case 'type':
          groupStage = {
            _id: '$type',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
            minAmount: { $min: '$amount' },
            maxAmount: { $max: '$amount' },
          };
          break;

        case 'month':
          groupStage = {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            incomeAmount: {
              $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
            },
            expenseAmount: {
              $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
            },
          };
          break;

        case 'day':
          groupStage = {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' },
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            incomeAmount: {
              $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
            },
            expenseAmount: {
              $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
            },
          };
          break;

        case 'paymentMethod':
          groupStage = {
            _id: '$paymentMethod',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
          };
          break;

        default:
          groupStage = {
            _id: '$categoryId',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          };
      }

      const pipeline: PipelineStage[] = [
        { $match: matchStage },
        { $group: groupStage },
      ];

      if (lookupStage) {
        pipeline.push(lookupStage);
        pipeline.push({
          $unwind: '$category',
        });
      }

      // Add sorting
      if (groupBy === 'month' || groupBy === 'day') {
        pipeline.push({
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
        });
      } else {
        pipeline.push({
          $sort: { totalAmount: -1 },
        });
      }

      const results = await this.model.aggregate(pipeline);

      logger.info(`Generated transaction statistics`, {
        userId,
        groupBy,
        count: results.length,
        options,
      });

      return results;
    } catch (error) {
      logger.error(`Error generating transaction statistics`, {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Get cash flow analysis with trend calculations
   */
  async getCashFlowAnalysis(
    userId: string,
    options: {
      startDate: Date;
      endDate: Date;
      accountId?: string;
      interval?: 'daily' | 'weekly' | 'monthly';
    }
  ): Promise<any[]> {
    try {
      const { startDate, endDate, accountId, interval = 'monthly' } = options;

      const matchStage: Record<string, unknown> = {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      };

      if (accountId) {
        matchStage.accountId = new mongoose.Types.ObjectId(accountId);
      }

      let dateGrouping: Record<string, unknown>;
      switch (interval) {
        case 'daily':
          dateGrouping = {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' },
          };
          break;
        case 'weekly':
          dateGrouping = {
            year: { $year: '$date' },
            week: { $week: '$date' },
          };
          break;
        case 'monthly':
        default:
          dateGrouping = {
            year: { $year: '$date' },
            month: { $month: '$date' },
          };
          break;
      }

      const pipeline: PipelineStage[] = [
        { $match: matchStage },
        {
          $group: {
            _id: dateGrouping,
            date: { $first: '$date' },
            income: {
              $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
            },
            expenses: {
              $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
            },
            transfers: {
              $sum: { $cond: [{ $eq: ['$type', 'transfer'] }, '$amount', 0] },
            },
            netFlow: {
              $sum: {
                $cond: [
                  { $eq: ['$type', 'income'] },
                  '$amount',
                  {
                    $cond: [
                      { $eq: ['$type', 'expense'] },
                      { $multiply: ['$amount', -1] },
                      0,
                    ],
                  },
                ],
              },
            },
            transactionCount: { $sum: 1 },
          },
        },
        {
          $addFields: {
            formattedDate: {
              $dateToString: {
                format:
                  interval === 'daily'
                    ? '%Y-%m-%d'
                    : interval === 'weekly'
                      ? '%Y-W%V'
                      : '%Y-%m',
                date: '$date',
              },
            },
          },
        },
        {
          $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 },
        },
      ];

      const results = await this.model.aggregate(pipeline);

      logger.info(`Generated cash flow analysis`, {
        userId,
        interval,
        startDate,
        endDate,
        count: results.length,
      });

      return results;
    } catch (error) {
      logger.error(`Error generating cash flow analysis`, {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Get spending patterns and insights
   */
  async getSpendingInsights(
    userId: string,
    options: {
      startDate: Date;
      endDate: Date;
      accountId?: string;
      topCategories?: number;
    }
  ): Promise<any> {
    try {
      const { startDate, endDate, accountId, topCategories = 5 } = options;

      const matchStage: Record<string, unknown> = {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate } as Record<string, unknown>,
        type: 'expense',
        isDeleted: false,
      };

      if (accountId) {
        matchStage.accountId = new mongoose.Types.ObjectId(accountId);
      }

      const pipeline: PipelineStage[] = [
        { $match: matchStage },
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
            categoryColor: { $first: '$category.color' },
            categoryIcon: { $first: '$category.icon' },
            totalSpent: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
            avgTransaction: { $avg: '$amount' },
            maxTransaction: { $max: '$amount' },
            minTransaction: { $min: '$amount' },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: topCategories },
        {
          $group: {
            _id: null,
            topCategories: { $push: '$$ROOT' },
            totalSpent: { $sum: '$totalSpent' },
            totalTransactions: { $sum: '$transactionCount' },
          },
        },
        {
          $addFields: {
            topCategories: {
              $map: {
                input: '$topCategories',
                as: 'category',
                in: {
                  $mergeObjects: [
                    '$$category',
                    {
                      percentage: {
                        $multiply: [
                          { $divide: ['$$category.totalSpent', '$totalSpent'] },
                          100,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ];

      const results = await this.model.aggregate(pipeline);
      const result = results[0] || {
        topCategories: [],
        totalSpent: 0,
        totalTransactions: 0,
      };

      logger.info(`Generated spending insights`, {
        userId,
        startDate,
        endDate,
        topCategoriesCount: result.topCategories.length,
      });

      return result;
    } catch (error) {
      logger.error(`Error generating spending insights`, {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Get recurring transaction analysis
   */
  async getRecurringTransactionAnalysis(
    userId: string,
    options: {
      accountId?: string;
      includeInactive?: boolean;
    } = {}
  ): Promise<any[]> {
    try {
      const { accountId, includeInactive = false } = options;

      const matchStage: Record<string, unknown> = {
        userId: new mongoose.Types.ObjectId(userId),
        isRecurring: true,
        isDeleted: false,
      };

      if (accountId) {
        matchStage.accountId = new mongoose.Types.ObjectId(accountId);
      }

      if (!includeInactive) {
        matchStage.status = 'completed';
      }

      const pipeline: PipelineStage[] = [
        { $match: matchStage },
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
            _id: {
              recurrencePattern: '$recurrencePattern',
              categoryId: '$categoryId',
            },
            categoryName: { $first: '$category.name' },
            categoryColor: { $first: '$category.color' },
            categoryIcon: { $first: '$category.icon' },
            totalAmount: { $sum: '$amount' },
            transactionCount: { $sum: 1 },
            avgAmount: { $avg: '$amount' },
            nextOccurrence: { $min: '$nextOccurrence' },
            lastTransaction: { $max: '$date' },
          },
        },
        {
          $addFields: {
            estimatedMonthly: {
              $switch: {
                branches: [
                  {
                    case: { $eq: ['$_id.recurrencePattern', 'monthly'] },
                    then: '$avgAmount',
                  },
                  {
                    case: { $eq: ['$_id.recurrencePattern', 'weekly'] },
                    then: { $multiply: ['$avgAmount', 4.33] },
                  },
                  {
                    case: { $eq: ['$_id.recurrencePattern', 'biweekly'] },
                    then: { $multiply: ['$avgAmount', 2.17] },
                  },
                  {
                    case: { $eq: ['$_id.recurrencePattern', 'quarterly'] },
                    then: { $divide: ['$avgAmount', 3] },
                  },
                  {
                    case: { $eq: ['$_id.recurrencePattern', 'yearly'] },
                    then: { $divide: ['$avgAmount', 12] },
                  },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { estimatedMonthly: -1 } },
      ];

      const results = await this.model.aggregate(pipeline);

      logger.info(`Generated recurring transaction analysis`, {
        userId,
        count: results.length,
      });

      return results;
    } catch (error) {
      logger.error(`Error generating recurring transaction analysis`, {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Search transactions with full-text search and filters
   */
  async searchTransactions(
    userId: string,
    searchQuery: string,
    options: {
      accountId?: string;
      categoryId?: string;
      type?: TransactionType;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      populate?: string[];
    } = {}
  ): Promise<{
    transactions: ITransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const {
        accountId,
        categoryId,
        type,
        startDate,
        endDate,
        page = 1,
        limit = 10,
      } = options;

      const filter: Record<string, unknown> = {
        userId,
        isDeleted: false,
        $or: [
          { title: { $regex: searchQuery, $options: 'i' } },
          { description: { $regex: searchQuery, $options: 'i' } },
          { tags: { $in: [new RegExp(searchQuery, 'i')] } },
        ],
      };

      if (accountId) filter.accountId = accountId;
      if (categoryId) filter.categoryId = categoryId;
      if (type) filter.type = type;
      if (startDate || endDate) {
        filter.date = {} as Record<string, unknown>;
        if (startDate)
          (filter.date as Record<string, unknown>).$gte = startDate;
        if (endDate) (filter.date as Record<string, unknown>).$lte = endDate;
      }

      const skip = (page - 1) * limit;

      const [transactions, total] = await Promise.all([
        this.model
          .find(filter)
          .populate(options.populate || [])
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit),
        this.model.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Searched transactions`, {
        userId,
        searchQuery,
        count: transactions.length,
        total,
        page,
        totalPages,
      });

      return {
        transactions,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error(`Error searching transactions`, {
        error: String(error),
        userId,
        searchQuery,
        options,
      });
      throw error;
    }
  }

  /**
   * Get transaction summary for dashboard
   */
  async getDashboardSummary(
    userId: string,
    options: {
      accountId?: string;
      days?: number;
    } = {}
  ): Promise<any> {
    try {
      const { accountId, days = 30 } = options;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const matchStage: Record<string, unknown> = {
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      };

      if (accountId) {
        matchStage.accountId = new mongoose.Types.ObjectId(accountId);
      }

      const pipeline: PipelineStage[] = [
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
            },
            totalExpenses: {
              $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
            },
            totalTransfers: {
              $sum: { $cond: [{ $eq: ['$type', 'transfer'] }, '$amount', 0] },
            },
            transactionCount: { $sum: 1 },
            avgTransactionAmount: { $avg: '$amount' },
            largestTransaction: { $max: '$amount' },
            smallestTransaction: { $min: '$amount' },
          },
        },
        {
          $addFields: {
            netIncome: { $subtract: ['$totalIncome', '$totalExpenses'] },
          },
        },
        {
          $addFields: {
            savingsRate: {
              $cond: [
                { $gt: ['$totalIncome', 0] },
                {
                  $multiply: [{ $divide: ['$netIncome', '$totalIncome'] }, 100],
                },
                0,
              ],
            },
          },
        },
      ];

      const results = await this.model.aggregate(pipeline);
      const result = results[0] || {
        totalIncome: 0,
        totalExpenses: 0,
        totalTransfers: 0,
        transactionCount: 0,
        avgTransactionAmount: 0,
        largestTransaction: 0,
        smallestTransaction: 0,
        netIncome: 0,
        savingsRate: 0,
      };

      logger.info(`Generated dashboard summary`, {
        userId,
        days,
        result,
      });

      return result;
    } catch (error) {
      logger.error(`Error generating dashboard summary`, {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Get transactions by tags with aggregation
   */
  async getTransactionsByTags(
    userId: string,
    tags: string[],
    options: {
      accountId?: string;
      startDate?: Date;
      endDate?: Date;
      groupBy?: 'tag' | 'category' | 'month';
    } = {}
  ): Promise<any[]> {
    try {
      const { accountId, startDate, endDate, groupBy = 'tag' } = options;

      const matchStage: Record<string, unknown> = {
        userId: new mongoose.Types.ObjectId(userId),
        tags: { $in: tags },
        isDeleted: false,
      };

      if (accountId) {
        matchStage.accountId = new mongoose.Types.ObjectId(accountId);
      }

      if (startDate || endDate) {
        matchStage.date = {} as Record<string, unknown>;
        if (startDate)
          (matchStage.date as Record<string, unknown>).$gte = startDate;
        if (endDate)
          (matchStage.date as Record<string, unknown>).$lte = endDate;
      }

      let groupStage: { _id: unknown; [key: string]: unknown };
      switch (groupBy) {
        case 'tag':
          groupStage = {
            _id: '$tags',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
          };
          break;
        case 'category':
          groupStage = {
            _id: '$categoryId',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
          };
          break;
        case 'month':
          groupStage = {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
            avgAmount: { $avg: '$amount' },
          };
          break;
        default:
          groupStage = {
            _id: '$tags',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' },
          };
      }

      const pipeline: PipelineStage[] = [
        { $match: matchStage },
        { $unwind: '$tags' },
        { $match: { tags: { $in: tags } } },
        { $group: groupStage },
        { $sort: { totalAmount: -1 } },
      ];

      const results = await this.model.aggregate(pipeline);

      logger.info(`Generated transactions by tags analysis`, {
        userId,
        tags,
        count: results.length,
        groupBy,
      });

      return results;
    } catch (error) {
      logger.error(`Error generating transactions by tags analysis`, {
        error: String(error),
        userId,
        tags,
        options,
      });
      throw error;
    }
  }

  /**
   * Create recurring transaction series
   */
  async createRecurringSeries(
    transactionData: Partial<ITransaction>,
    pattern: string,
    endDate: Date
  ): Promise<ITransaction[]> {
    try {
      return await this.model.createRecurringSeries(
        transactionData,
        pattern as any,
        endDate
      );
    } catch (error) {
      logger.error('Error creating recurring transaction series', {
        error: String(error),
        transactionData,
        pattern,
        endDate,
      });
      throw error;
    }
  }
}
