import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { logger } from '../../../../shared/services/logger.service';
import { transactionValidation } from '../validators/transaction.validation';
import { AuthenticatedRequest } from '../../../auth/auth.middleware';

export class TransactionController {
  private transactionService: TransactionService;

  constructor() {
    this.transactionService = new TransactionService();
  }

  /**
   * Create a new transaction
   * POST /api/transactions
   */
  createTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      // Validate request body
      const { error, value } = transactionValidation.create.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
        return;
      }

      const transaction = await this.transactionService.createTransaction(value, userId);

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction
      });

      logger.info('Transaction created via API', { 
        transactionId: transaction._id, 
        userId, 
        title: transaction.title 
      });
    } catch (error) {
      logger.error('Error in createTransaction controller', { 
        error: String(error), 
        userId: req.user?.userId 
      });

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('access denied')) {
          res.status(404).json({
            success: false,
            message: error.message
          });
        } else {
          res.status(400).json({
            success: false,
            message: error.message
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  };

  /**
   * Get transaction by ID
   * GET /api/transactions/:id
   */
  getTransactionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Transaction ID is required'
        });
        return;
      }

      const transaction = await this.transactionService.getTransactionById(id, userId);

      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Error in getTransactionById controller', { 
        error: String(error), 
        userId: req.user?.userId 
      });

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('access denied')) {
          res.status(404).json({
            success: false,
            message: error.message
          });
        } else {
          res.status(400).json({
            success: false,
            message: error.message
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  };

  /**
   * Get all transactions for a user
   * GET /api/transactions
   */
  getUserTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const { page = 1, limit = 10, sort = 'date', order = 'desc' } = req.query;

      const transactions = await this.transactionService.getUserTransactions(userId, {
        page: Number(page),
        limit: Number(limit),
        sortBy: String(sort),
        sortOrder: String(order) as 'asc' | 'desc'
      });

      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      logger.error('Error in getUserTransactions controller', { 
        error: String(error), 
        userId: req.user?.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Update a transaction
   * PUT /api/transactions/:id
   */
  updateTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Transaction ID is required'
        });
        return;
      }

      // Validate request body
      const { error, value } = transactionValidation.update.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
        return;
      }

      const transaction = await this.transactionService.updateTransaction(
        id,
        value,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction
      });

      logger.info('Transaction updated via API', { 
        transactionId: id, 
        userId 
      });
    } catch (error) {
      logger.error('Error in updateTransaction controller', { 
        error: String(error), 
        userId: req.user?.userId 
      });

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('access denied')) {
          res.status(404).json({
            success: false,
            message: error.message
          });
        } else {
          res.status(400).json({
            success: false,
            message: error.message
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  };

  /**
   * Delete a transaction
   * DELETE /api/transactions/:id
   */
  deleteTransaction = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Transaction ID is required'
        });
        return;
      }

      await this.transactionService.deleteTransaction(id, userId);

      res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully'
      });

      logger.info('Transaction deleted via API', { 
        transactionId: id, 
        userId 
      });
    } catch (error) {
      logger.error('Error in deleteTransaction controller', { 
        error: String(error), 
        userId: req.user?.userId 
      });

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('access denied')) {
          res.status(404).json({
            success: false,
            message: error.message
          });
        } else {
          res.status(400).json({
            success: false,
            message: error.message
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  };

  /**
   * Get transaction statistics
   * GET /api/transactions/stats
   */
  getTransactionStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const { startDate, endDate, groupBy = 'category' } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
        return;
      }

      const stats = await this.transactionService.getTransactionStats(userId, {
        startDate: new Date(String(startDate)),
        endDate: new Date(String(endDate))
      });

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error in getTransactionStats controller', { 
        error: String(error), 
        userId: req.user?.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Search transactions
   * GET /api/transactions/search
   */
  searchTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const { q, page = 1, limit = 10 } = req.query;

      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const results = await this.transactionService.getUserTransactions(userId, {
        search: String(q),
        page: Number(page),
        limit: Number(limit)
      });

      res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      logger.error('Error in searchTransactions controller', { 
        error: String(error), 
        userId: req.user?.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get recurring transactions
   * GET /api/transactions/recurring
   */
  getRecurringTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      const recurringTransactions = await this.transactionService.getRecurringTransactions(userId);

      res.status(200).json({
        success: true,
        data: recurringTransactions
      });
    } catch (error) {
      logger.error('Error in getRecurringTransactions controller', { 
        error: String(error), 
        userId: req.user?.userId 
      });

      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Bulk create transactions
   * POST /api/transactions/bulk
   */
  bulkCreateTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: 'Authentication required' 
        });
        return;
      }

      // Validate request body
      const { error, value } = transactionValidation.bulk.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        });
        return;
      }

      const createdTransactions = await this.transactionService.bulkCreateTransactions(
        value.transactions,
        userId
      );

      res.status(201).json({
        success: true,
        message: `Successfully created ${createdTransactions.length} transactions`,
        data: createdTransactions,
        summary: {
          requested: value.transactions.length,
          created: createdTransactions.length,
          failed: value.transactions.length - createdTransactions.length
        }
      });

      logger.info('Bulk transactions created via API', { 
        userId, 
        requested: value.transactions.length, 
        created: createdTransactions.length 
      });
    } catch (error) {
      logger.error('Error in bulkCreateTransactions controller', { 
        error: String(error), 
        userId: req.user?.userId 
      });

      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    }
  };
}

export default TransactionController;