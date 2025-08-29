import { TransactionRepository } from '../repositories/transaction.repository';
import {
  ITransaction,
  TransactionType,
  TransactionStatus,
  RecurrencePattern,
} from '../interfaces/transaction.interface';
import { logger } from '../../../../shared/services/logger.service';
import mongoose from 'mongoose';

export class TransactionService {
  private transactionRepository: TransactionRepository;

  constructor() {
    this.transactionRepository = new TransactionRepository();
  }

  /**
   * Create a new transaction
   */
  async createTransaction(
    transactionData: Partial<ITransaction>,
    userId: string
  ): Promise<ITransaction> {
    try {
      logger.info('Creating new transaction', {
        userId,
        transactionData: {
          title: transactionData.title,
          amount: transactionData.amount,
          type: transactionData.type,
        },
      });

      // Validate category belongs to user (you'll need to implement category service integration)
      // const categoryService = new CategoryService();
      // await categoryService.getCategoryById(transactionData.categoryId!.toString(), userId);

      // Set default values
      const newTransaction = await this.transactionRepository.create({
        ...transactionData,
        userId: new mongoose.Types.ObjectId(userId),
        status: transactionData.status || TransactionStatus.COMPLETED,
        isRecurring: transactionData.isRecurring || false,
        recurrencePattern:
          transactionData.recurrencePattern || RecurrencePattern.NONE,
        tags: transactionData.tags || [],
        attachments: transactionData.attachments || [],
        source: transactionData.source || 'manual',
        timezone: transactionData.timezone || 'UTC',
      });

      // If this is a recurring transaction, create the series
      if (
        newTransaction.isRecurring &&
        newTransaction.recurrencePattern !== RecurrencePattern.NONE
      ) {
        await this.createRecurringSeries(newTransaction);
      }

      logger.info('Transaction created successfully', {
        transactionId: newTransaction._id,
        userId,
        title: newTransaction.title,
      });

      return newTransaction;
    } catch (error) {
      logger.error('Error creating transaction', {
        error: String(error),
        userId,
        transactionData: {
          title: transactionData.title,
          amount: transactionData.amount,
        },
      });
      throw error;
    }
  }

  /**
   * Get transaction by ID with user validation
   */
  async getTransactionById(
    transactionId: string,
    userId: string
  ): Promise<ITransaction> {
    try {
      logger.info('Getting transaction by ID', { transactionId, userId });

      const transaction =
        await this.transactionRepository.findById(transactionId);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.userId.toString() !== userId) {
        throw new Error('Access denied');
      }

      return transaction;
    } catch (error) {
      logger.error('Error getting transaction by ID', {
        error: String(error),
        transactionId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get transactions for a user with filtering and pagination
   */
  async getUserTransactions(
    userId: string,
    options: {
      type?: TransactionType;
      status?: TransactionStatus;
      categoryId?: string;
      subcategoryId?: string;
      accountId?: string;
      paymentMethod?: string;
      isRecurring?: boolean;
      source?: string;
      startDate?: Date;
      endDate?: Date;
      minAmount?: number;
      maxAmount?: number;
      search?: string;
      tags?: string[];
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    transactions: ITransaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      logger.info('Getting user transactions', { userId, options });

      const {
        type,
        status,
        categoryId,
        subcategoryId,
        accountId,
        paymentMethod,
        isRecurring,
        source,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        search,
        tags,
        page = 1,
        limit = 20,
        sortBy = 'date',
        sortOrder = 'desc',
      } = options;

      // Build query
      const query: any = {};

      if (type) query.type = type;
      if (status) query.status = status;
      if (categoryId)
        query.categoryId = new mongoose.Types.ObjectId(categoryId);
      if (subcategoryId)
        query.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);
      if (accountId) query.accountId = new mongoose.Types.ObjectId(accountId);
      if (paymentMethod) query.paymentMethod = paymentMethod;
      if (isRecurring !== undefined) query.isRecurring = isRecurring;
      if (source) query.source = source;

      // Date range filtering
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
      }

      // Amount range filtering
      if (minAmount !== undefined || maxAmount !== undefined) {
        query.amount = {};
        if (minAmount !== undefined) query.amount.$gte = minAmount;
        if (maxAmount !== undefined) query.amount.$lte = maxAmount;
      }

      // Search functionality
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { merchantName: { $regex: search, $options: 'i' } },
          { paymentReference: { $regex: search, $options: 'i' } },
        ];
      }

      // Tags filtering
      if (tags && tags.length > 0) {
        query.tags = { $in: tags };
      }

      // Validate and sanitize pagination parameters
      const sanitizedPage = Math.max(1, page);
      const sanitizedLimit = Math.min(Math.max(1, limit), 100); // Cap at 100

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Get paginated results using findByUserId
      const result = await this.transactionRepository.findByUserId(userId, {
        page: sanitizedPage,
        limit: sanitizedLimit,
        sort,
        filter: query,
        populate: ['categoryId', 'subcategoryId'],
      });

      const { transactions, total, totalPages } = result;

      logger.info('Retrieved user transactions', {
        userId,
        count: transactions.length,
        total,
        page,
        totalPages,
      });

      return { transactions, total, page: sanitizedPage, totalPages };
    } catch (error) {
      logger.error('Error getting user transactions', {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Update transaction
   */
  async updateTransaction(
    transactionId: string,
    updateData: Partial<ITransaction>,
    userId: string
  ): Promise<ITransaction> {
    try {
      logger.info('Updating transaction', {
        transactionId,
        userId,
        updateData: { title: updateData.title, amount: updateData.amount },
      });

      // Get existing transaction and validate access
      const existingTransaction = await this.getTransactionById(
        transactionId,
        userId
      );

      // Validate category if changing
      if (
        updateData.categoryId &&
        updateData.categoryId.toString() !==
          existingTransaction.categoryId.toString()
      ) {
        // Validate category belongs to user (you'll need to implement category service integration)
        // const categoryService = new CategoryService();
        // await categoryService.getCategoryById(updateData.categoryId.toString(), userId);
      }

      // Update the transaction
      const updatedTransaction = await this.transactionRepository.updateById(
        transactionId,
        updateData,
        { new: true, runValidators: true }
      );

      // If recurrence pattern changed, update the series
      if (
        updateData.isRecurring !== undefined ||
        updateData.recurrencePattern !== undefined
      ) {
        if (updatedTransaction) {
          await this.updateRecurringSeries(updatedTransaction);
        }
      }

      if (!updatedTransaction) {
        throw new Error('Failed to update transaction');
      }

      logger.info('Transaction updated successfully', {
        transactionId,
        userId,
        title: updatedTransaction.title,
      });

      return updatedTransaction;
    } catch (error) {
      logger.error('Error updating transaction', {
        error: String(error),
        transactionId,
        userId,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Delete transaction (soft delete)
   */
  async deleteTransaction(
    transactionId: string,
    userId: string
  ): Promise<void> {
    try {
      logger.info('Deleting transaction', { transactionId, userId });

      // Get existing transaction and validate access
      await this.getTransactionById(transactionId, userId);

      // Soft delete
      await this.transactionRepository.updateById(transactionId, {
        isDeleted: true,
        deletedAt: new Date(),
      });

      logger.info('Transaction deleted successfully', {
        transactionId,
        userId,
      });
    } catch (error) {
      logger.error('Error deleting transaction', {
        error: String(error),
        transactionId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Bulk create transactions
   */
  async bulkCreateTransactions(
    transactionsData: Partial<ITransaction>[],
    userId: string
  ): Promise<ITransaction[]> {
    try {
      logger.info('Bulk creating transactions', {
        userId,
        count: transactionsData.length,
      });

      const createdTransactions: ITransaction[] = [];

      for (const transactionData of transactionsData) {
        try {
          const transaction = await this.createTransaction(
            transactionData,
            userId
          );
          createdTransactions.push(transaction);
        } catch (error) {
          logger.warn('Failed to create transaction in bulk operation', {
            error: String(error),
            transactionData: {
              title: transactionData.title,
              amount: transactionData.amount,
            },
          });
          // Continue with other transactions
        }
      }

      logger.info('Bulk transaction creation completed', {
        userId,
        requested: transactionsData.length,
        created: createdTransactions.length,
      });

      return createdTransactions;
    } catch (error) {
      logger.error('Error in bulk transaction creation', {
        error: String(error),
        userId,
        count: transactionsData.length,
      });
      throw error;
    }
  }

  /**
   * Get transaction statistics
   */
  async getTransactionStats(
    userId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      categoryId?: string;
      type?: TransactionType;
    } = {}
  ): Promise<{
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    totalTransfers: number;
    totalAdjustments: number;
    averageTransactionAmount: number;
    transactionsByType: {
      [key in TransactionType]: { count: number; total: number };
    };
    transactionsByCategory: Array<{
      categoryId: string;
      categoryName: string;
      count: number;
      total: number;
      percentage: number;
    }>;
    monthlyTrends: Array<{
      month: string;
      income: number;
      expenses: number;
      net: number;
    }>;
  }> {
    try {
      logger.info('Getting transaction statistics', { userId, options });

      const { startDate, endDate, categoryId, type } = options;

      // Build base query
      const baseQuery: any = { userId: new mongoose.Types.ObjectId(userId) };
      if (startDate || endDate) {
        baseQuery.date = {};
        if (startDate) baseQuery.date.$gte = startDate;
        if (endDate) baseQuery.date.$lte = endDate;
      }
      if (categoryId)
        baseQuery.categoryId = new mongoose.Types.ObjectId(categoryId);
      if (type) baseQuery.type = type;

      // Get basic stats
      const [
        totalTransactions,
        totalIncome,
        totalExpenses,
        totalTransfers,
        totalAdjustments,
      ] = await Promise.all([
        this.transactionRepository.count(baseQuery),
        this.transactionRepository.aggregate([
          { $match: { ...baseQuery, type: TransactionType.INCOME } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        this.transactionRepository.aggregate([
          { $match: { ...baseQuery, type: TransactionType.EXPENSE } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        this.transactionRepository.aggregate([
          { $match: { ...baseQuery, type: TransactionType.TRANSFER } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        this.transactionRepository.aggregate([
          { $match: { ...baseQuery, type: TransactionType.ADJUSTMENT } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

      // Get transactions by type
      const transactionsByType = await this.transactionRepository.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            total: { $sum: '$amount' },
          },
        },
      ]);

      // Get transactions by category
      const transactionsByCategory = await this.transactionRepository.aggregate(
        [
          { $match: baseQuery },
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
              count: { $sum: 1 },
              total: { $sum: '$amount' },
            },
          },
          { $sort: { total: -1 } },
        ]
      );

      // Calculate percentages
      const totalAmount = totalIncome[0]?.total || 0;
      transactionsByCategory.forEach(cat => {
        cat.percentage = totalAmount > 0 ? (cat.total / totalAmount) * 100 : 0;
      });

      // Get monthly trends
      const monthlyTrends = await this.transactionRepository.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
            },
            income: {
              $sum: {
                $cond: [
                  { $eq: ['$type', TransactionType.INCOME] },
                  '$amount',
                  0,
                ],
              },
            },
            expenses: {
              $sum: {
                $cond: [
                  { $eq: ['$type', TransactionType.EXPENSE] },
                  '$amount',
                  0,
                ],
              },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const stats = {
        totalTransactions,
        totalIncome: totalIncome[0]?.total || 0,
        totalExpenses: totalExpenses[0]?.total || 0,
        totalTransfers: totalTransfers[0]?.total || 0,
        totalAdjustments: totalAdjustments[0]?.total || 0,
        averageTransactionAmount:
          totalTransactions > 0
            ? (totalIncome[0]?.total || 0) / totalTransactions
            : 0,
        transactionsByType: this.formatTransactionsByType(transactionsByType),
        transactionsByCategory: transactionsByCategory.map(cat => ({
          categoryId: cat._id.toString(),
          categoryName: cat.categoryName,
          count: cat.count,
          total: cat.total,
          percentage: cat.percentage,
        })),
        monthlyTrends: monthlyTrends.map(trend => ({
          month: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}`,
          income: trend.income,
          expenses: trend.expenses,
          net: trend.income - trend.expenses,
        })),
      };

      logger.info('Transaction statistics retrieved', { userId, stats });

      return stats;
    } catch (error) {
      logger.error('Error getting transaction statistics', {
        error: String(error),
        userId,
        options,
      });
      throw error;
    }
  }

  /**
   * Get recurring transactions for a user
   */
  async getRecurringTransactions(userId: string): Promise<ITransaction[]> {
    try {
      logger.info('Getting recurring transactions', { userId });

      const recurringTransactions = await this.transactionRepository.find({
        userId: new mongoose.Types.ObjectId(userId),
        isRecurring: true,
        isDeleted: { $ne: true },
      });

      logger.info('Recurring transactions retrieved', {
        userId,
        count: recurringTransactions.length,
      });

      return recurringTransactions;
    } catch (error) {
      logger.error('Error getting recurring transactions', {
        error: String(error),
        userId,
      });
      throw error;
    }
  }

  /**
   * Create recurring transaction series
   */
  private async createRecurringSeries(
    transaction: ITransaction
  ): Promise<void> {
    try {
      if (
        !transaction.isRecurring ||
        transaction.recurrencePattern === RecurrencePattern.NONE
      ) {
        return;
      }

      const endDate = transaction.recurrenceEndDate;
      if (!endDate) {
        throw new Error(
          'Recurrence end date is required for recurring transactions'
        );
      }

      const series = await this.transactionRepository.createRecurringSeries(
        transaction,
        transaction.recurrencePattern,
        endDate
      );

      logger.info('Recurring transaction series created', {
        parentTransactionId: transaction._id,
        seriesCount: series.length,
      });
    } catch (error) {
      logger.error('Error creating recurring transaction series', {
        error: String(error),
        transactionId: transaction._id,
      });
      throw error;
    }
  }

  /**
   * Update recurring transaction series
   */
  private async updateRecurringSeries(transaction: ITransaction): Promise<void> {
    try {
      // This would involve updating all related recurring transactions
      // Implementation depends on your specific requirements
      logger.info('Updating recurring transaction series', {
        transactionId: transaction._id,
      });
    } catch (error) {
      logger.error('Error updating recurring transaction series', {
        error: String(error),
        transactionId: transaction._id,
      });
      throw error;
    }
  }

  /**
   * Format transactions by type for statistics
   */
  private formatTransactionsByType(aggregationResult: any[]): {
    [key in TransactionType]: { count: number; total: number };
  } {
    const result: {
      [key in TransactionType]: { count: number; total: number };
    } = {
      [TransactionType.INCOME]: { count: 0, total: 0 },
      [TransactionType.EXPENSE]: { count: 0, total: 0 },
      [TransactionType.TRANSFER]: { count: 0, total: 0 },
      [TransactionType.ADJUSTMENT]: { count: 0, total: 0 },
    };

    aggregationResult.forEach(
      (item: { _id: TransactionType; count: number; total: number }) => {
        if (result[item._id]) {
          result[item._id] = { count: item.count, total: item.total };
        }
      }
    );

    return result;
  }
}

export default TransactionService;
