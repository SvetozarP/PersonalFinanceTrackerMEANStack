import request from 'supertest';
import express from 'express';
import transactionRoutes from '../../../../modules/financial/transactions/routes/transaction.routes';
import { TransactionService } from '../../../../modules/financial/transactions/services/transaction.service';
import { authenticateToken } from '../../../../modules/auth/auth.middleware';
import mongoose from 'mongoose';

// Mock the TransactionService at module level
jest.mock('../../../../modules/financial/transactions/services/transaction.service');
jest.mock('../../../../modules/auth/auth.middleware');

describe('Transaction Routes', () => {
  let app: express.Application;
  let mockTransactionService: jest.Mocked<TransactionService>;
  let testUserId: string;

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId().toString();
  });

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock service
    mockTransactionService = {
      createTransaction: jest.fn(),
      getTransactionById: jest.fn(),
      getUserTransactions: jest.fn(),
      updateTransaction: jest.fn(),
      deleteTransaction: jest.fn(),
      getTransactionStats: jest.fn(),
      getRecurringTransactions: jest.fn(),
      bulkCreateTransactions: jest.fn(),
    } as any;

    // Mock the TransactionService constructor
    (TransactionService as jest.MockedClass<typeof TransactionService>).mockImplementation(() => mockTransactionService);
    
    // Mock auth middleware to always pass
    (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
      req.user = { userId: testUserId };
      next();
    });

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/transactions', transactionRoutes);
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction successfully', async () => {
      const transactionData = {
        title: 'New Transaction',
        amount: 100.50,
        currency: 'USD',
        type: 'expense',
        categoryId: new mongoose.Types.ObjectId().toString(),
        date: new Date().toISOString(),
        timezone: 'UTC',
        paymentMethod: 'cash',
        source: 'manual',
      };

      const createdTransaction = {
        _id: new mongoose.Types.ObjectId(),
        ...transactionData,
        userId: testUserId,
        status: 'completed',
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTransactionService.createTransaction.mockResolvedValue(createdTransaction as any);

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Transaction created successfully',
        data: createdTransaction,
      });
      expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(transactionData, testUserId);
    });

    it('should return 400 when validation fails', async () => {
      const invalidData = { title: '' }; // Empty title

      const response = await request(app)
        .post('/api/transactions')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.createTransaction).not.toHaveBeenCalled();
    });

    it('should return 500 when service throws error', async () => {
      const transactionData = { title: 'Error Transaction', amount: 100 };
      const error = new Error('Service error');

      mockTransactionService.createTransaction.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(500);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(transactionData, testUserId);
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should get transaction by ID successfully', async () => {
      const transactionId = new mongoose.Types.ObjectId().toString();
      const transaction = {
        _id: transactionId,
        title: 'Test Transaction',
        amount: 100.50,
        userId: testUserId,
        status: 'completed',
      };

      mockTransactionService.getTransactionById.mockResolvedValue(transaction as any);

      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: transaction,
      });
      expect(mockTransactionService.getTransactionById).toHaveBeenCalledWith(transactionId, testUserId);
    });

    it('should return 400 when ID is invalid', async () => {
      const invalidId = 'invalid-id';

      const response = await request(app)
        .get(`/api/transactions/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.getTransactionById).not.toHaveBeenCalled();
    });

    it('should return 500 when service throws error', async () => {
      const transactionId = new mongoose.Types.ObjectId().toString();
      const error = new Error('Service error');

      mockTransactionService.getTransactionById.mockRejectedValue(error);

      const response = await request(app)
        .get(`/api/transactions/${transactionId}`)
        .expect(500);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.getTransactionById).toHaveBeenCalledWith(transactionId, testUserId);
    });
  });

  describe('GET /api/transactions', () => {
    it('should get user transactions successfully', async () => {
      const transactions = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Transaction 1',
          amount: 100,
          userId: testUserId,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Transaction 2',
          amount: 200,
          userId: testUserId,
        },
      ];

      mockTransactionService.getUserTransactions.mockResolvedValue(transactions as any);

      const response = await request(app)
        .get('/api/transactions')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: transactions,
      });
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith(testUserId, {});
    });

    it('should get user transactions with query parameters', async () => {
      const transactions = [{ _id: new mongoose.Types.ObjectId(), title: 'Filtered Transaction' }];
      const queryParams = { type: 'expense', startDate: '2024-01-01', endDate: '2024-01-31' };

      mockTransactionService.getUserTransactions.mockResolvedValue(transactions as any);

      const response = await request(app)
        .get('/api/transactions')
        .query(queryParams)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: transactions,
      });
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith(testUserId, queryParams);
    });

    it('should return 500 when service throws error', async () => {
      const error = new Error('Service error');

      mockTransactionService.getUserTransactions.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/transactions')
        .expect(500);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith(testUserId, {});
    });
  });

  describe('PUT /api/transactions/:id', () => {
    it('should update transaction successfully', async () => {
      const transactionId = new mongoose.Types.ObjectId().toString();
      const updateData = {
        title: 'Updated Transaction',
        amount: 150.75,
      };

      const updatedTransaction = {
        _id: transactionId,
        ...updateData,
        userId: testUserId,
        status: 'completed',
      };

      mockTransactionService.updateTransaction.mockResolvedValue(updatedTransaction as any);

      const response = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Transaction updated successfully',
        data: updatedTransaction,
      });
      expect(mockTransactionService.updateTransaction).toHaveBeenCalledWith(transactionId, updateData, testUserId);
    });

    it('should return 400 when ID is invalid', async () => {
      const invalidId = 'invalid-id';
      const updateData = { title: 'Updated' };

      const response = await request(app)
        .put(`/api/transactions/${invalidId}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.updateTransaction).not.toHaveBeenCalled();
    });

    it('should return 400 when validation fails', async () => {
      const transactionId = new mongoose.Types.ObjectId().toString();
      const invalidData = { title: '' }; // Empty title

      const response = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.updateTransaction).not.toHaveBeenCalled();
    });

    it('should return 500 when service throws error', async () => {
      const transactionId = new mongoose.Types.ObjectId().toString();
      const updateData = { title: 'Updated' };
      const error = new Error('Service error');

      mockTransactionService.updateTransaction.mockRejectedValue(error);

      const response = await request(app)
        .put(`/api/transactions/${transactionId}`)
        .send(updateData)
        .expect(500);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.updateTransaction).toHaveBeenCalledWith(transactionId, updateData, testUserId);
    });
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete transaction successfully', async () => {
      const transactionId = new mongoose.Types.ObjectId().toString();
      const deletedTransaction = {
        _id: transactionId,
        title: 'Deleted Transaction',
        userId: testUserId,
      };

      mockTransactionService.deleteTransaction.mockResolvedValue(deletedTransaction as any);

      const response = await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Transaction deleted successfully',
        data: deletedTransaction,
      });
      expect(mockTransactionService.deleteTransaction).toHaveBeenCalledWith(transactionId, testUserId);
    });

    it('should return 400 when ID is invalid', async () => {
      const invalidId = 'invalid-id';

      const response = await request(app)
        .delete(`/api/transactions/${invalidId}`)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.deleteTransaction).not.toHaveBeenCalled();
    });

    it('should return 500 when service throws error', async () => {
      const transactionId = new mongoose.Types.ObjectId().toString();
      const error = new Error('Service error');

      mockTransactionService.deleteTransaction.mockRejectedValue(error);

      const response = await request(app)
        .delete(`/api/transactions/${transactionId}`)
        .expect(500);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.deleteTransaction).toHaveBeenCalledWith(transactionId, testUserId);
    });
  });

  describe('GET /api/transactions/stats', () => {
    it('should get transaction stats successfully', async () => {
      const stats = {
        totalTransactions: 10,
        totalIncome: 1000,
        totalExpenses: 500,
        netAmount: 500,
      };

      mockTransactionService.getTransactionStats.mockResolvedValue(stats as any);

      const response = await request(app)
        .get('/api/transactions/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: stats,
      });
      expect(mockTransactionService.getTransactionStats).toHaveBeenCalledWith(testUserId, {});
    });

    it('should get transaction stats with date range', async () => {
      const stats = { totalTransactions: 5, totalIncome: 500, totalExpenses: 200, netAmount: 300 };
      const queryParams = { startDate: '2024-01-01', endDate: '2024-01-31' };

      mockTransactionService.getTransactionStats.mockResolvedValue(stats as any);

      const response = await request(app)
        .get('/api/transactions/stats')
        .query(queryParams)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: stats,
      });
      expect(mockTransactionService.getTransactionStats).toHaveBeenCalledWith(testUserId, queryParams);
    });

    it('should return 400 when required date parameters are missing', async () => {
      const response = await request(app)
        .get('/api/transactions/stats')
        .query({ startDate: '2024-01-01' }) // Missing endDate
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.getTransactionStats).not.toHaveBeenCalled();
    });

    it('should return 500 when service throws error', async () => {
      const error = new Error('Service error');

      mockTransactionService.getTransactionStats.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/transactions/stats')
        .query({ startDate: '2024-01-01', endDate: '2024-01-31' })
        .expect(500);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.getTransactionStats).toHaveBeenCalledWith(testUserId, { startDate: '2024-01-01', endDate: '2024-01-31' });
    });
  });

  // Search transactions test removed - method not implemented in TransactionService

  describe('GET /api/transactions/recurring', () => {
    it('should get recurring transactions successfully', async () => {
      const recurringTransactions = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Recurring Transaction',
          isRecurring: true,
          userId: testUserId,
        },
      ];

      mockTransactionService.getRecurringTransactions.mockResolvedValue(recurringTransactions as any);

      const response = await request(app)
        .get('/api/transactions/recurring')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: recurringTransactions,
      });
      expect(mockTransactionService.getRecurringTransactions).toHaveBeenCalledWith(testUserId);
    });

    it('should return 500 when service throws error', async () => {
      const error = new Error('Service error');

      mockTransactionService.getRecurringTransactions.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/transactions/recurring')
        .expect(500);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.getRecurringTransactions).toHaveBeenCalledWith(testUserId);
    });
  });

  describe('POST /api/transactions/bulk', () => {
    it('should bulk create transactions successfully', async () => {
      const transactionsData = [
        {
          title: 'Transaction 1',
          amount: 100,
          type: 'expense',
          categoryId: new mongoose.Types.ObjectId().toString(),
          date: new Date().toISOString(),
          timezone: 'UTC',
          paymentMethod: 'cash',
          source: 'manual',
        },
        {
          title: 'Transaction 2',
          amount: 200,
          type: 'expense',
          categoryId: new mongoose.Types.ObjectId().toString(),
          date: new Date().toISOString(),
          timezone: 'UTC',
          paymentMethod: 'cash',
          source: 'manual',
        },
      ];

      const createdTransactions = transactionsData.map((data, index) => ({
        _id: new mongoose.Types.ObjectId(),
        ...data,
        userId: testUserId,
        status: 'completed',
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      mockTransactionService.bulkCreateTransactions.mockResolvedValue(createdTransactions as any);

      const response = await request(app)
        .post('/api/transactions/bulk')
        .send({ transactions: transactionsData })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Transactions created successfully',
        data: createdTransactions,
      });
      expect(mockTransactionService.bulkCreateTransactions).toHaveBeenCalledWith(transactionsData, testUserId);
    });

    it('should return 400 when validation fails', async () => {
      const invalidData = { transactions: [{ title: '' }] }; // Empty title

      const response = await request(app)
        .post('/api/transactions/bulk')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.bulkCreateTransactions).not.toHaveBeenCalled();
    });

    it('should return 500 when service throws error', async () => {
      const transactionsData = [{ title: 'Error Transaction', amount: 100 }];
      const error = new Error('Service error');

      mockTransactionService.bulkCreateTransactions.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/transactions/bulk')
        .send({ transactions: transactionsData })
        .expect(500);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.bulkCreateTransactions).toHaveBeenCalledWith(transactionsData, testUserId);
    });
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock auth middleware to fail
      (authenticateToken as jest.Mock).mockImplementation((req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/transactions')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown errors gracefully', async () => {
      const transactionData = { title: 'Unknown Error', amount: 100 };
      const unknownError = 'Unknown error occurred';

      mockTransactionService.createTransaction.mockRejectedValue(unknownError);

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData)
        .expect(500);

      expect(response.body).toHaveProperty('errors');
      expect(mockTransactionService.createTransaction).toHaveBeenCalledWith(transactionData, testUserId);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('Route Configuration', () => {
    it('should have all required routes configured', async () => {
      const routes = transactionRoutes.stack
        .filter((layer: any) => layer.route)
        .map((layer: any) => ({
          path: layer.route.path,
          methods: Object.keys(layer.route.methods),
        }));

      const expectedRoutes = [
        { path: '/', methods: ['post', 'get'] },
        { path: '/:id', methods: ['get', 'put', 'delete'] },
        { path: '/stats', methods: ['get'] },
        { path: '/recurring', methods: ['get'] },
        { path: '/bulk', methods: ['post'] },
      ];

      expectedRoutes.forEach(expectedRoute => {
        const foundRoute = routes.find(
          route => route.path === expectedRoute.path
        );
        expect(foundRoute).toBeDefined();
        expectedRoute.methods.forEach(method => {
          expect(foundRoute?.methods).toContain(method);
        });
      });
    });
  });
});
