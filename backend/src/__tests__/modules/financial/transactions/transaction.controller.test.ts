import { Request, Response } from 'express';
import { TransactionController } from '../../../../modules/financial/transactions/controllers/transaction.controller';
import { TransactionService } from '../../../../modules/financial/transactions/services/transaction.service';
import { logger } from '../../../../shared/services/logger.service';
import { transactionValidation } from '../../../../modules/financial/transactions/validators/transaction.validation';

// Mock dependencies
jest.mock('../../../../modules/financial/transactions/services/transaction.service');
jest.mock('../../../../shared/services/logger.service');
jest.mock('../../../../modules/financial/transactions/validators/transaction.validation');

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

describe('TransactionController', () => {
  let transactionController: TransactionController;
  let mockTransactionService: jest.Mocked<TransactionService>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create controller instance
    transactionController = new TransactionController();

    // Setup service mock - mock the instance methods directly
    mockTransactionService = {
      createTransaction: jest.fn(),
      getTransactionById: jest.fn(),
      getUserTransactions: jest.fn(),
      updateTransaction: jest.fn(),
      deleteTransaction: jest.fn(),
      getTransactionStats: jest.fn(),
      searchTransactions: jest.fn(),
      getRecurringTransactions: jest.fn(),
      bulkCreateTransactions: jest.fn(),
    } as any;

    // Replace the service instance in the controller
    (transactionController as any).transactionService = mockTransactionService;

    // Setup request and response mocks
    mockRequest = {
      user: { userId: 'user123' },
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createTransaction', () => {
    const validTransactionData = {
      title: 'Test Transaction',
      amount: 100.50,
      type: 'expense',
      categoryId: '507f1f77bcf86cd799439011',
      date: new Date().toISOString(),
    };

    const mockCreatedTransaction = {
      _id: '507f1f77bcf86cd799439012',
      title: 'Test Transaction',
      amount: 100.50,
      type: 'expense',
      categoryId: '507f1f77bcf86cd799439011',
      userId: 'user123',
      date: new Date(),
    };

    it('should create transaction successfully', async () => {
      (transactionValidation.create.validate as jest.Mock).mockReturnValue({
        error: null,
        value: validTransactionData,
      });

      mockTransactionService.createTransaction = jest.fn().mockResolvedValue(mockCreatedTransaction);

      mockRequest.body = validTransactionData;

      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transaction created successfully',
        data: mockCreatedTransaction,
      });
      expect(logger.info).toHaveBeenCalledWith('Transaction created via API', {
        transactionId: mockCreatedTransaction._id,
        userId: 'user123',
        title: mockCreatedTransaction.title,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 400 when validation fails', async () => {
      const validationError = {
        details: [
          {
            path: ['title'],
            message: 'Title is required',
          },
        ],
      };

      (transactionValidation.create.validate as jest.Mock).mockReturnValue({
        error: validationError,
        value: {},
      });

      mockRequest.body = {};

      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            field: 'title',
            message: 'Title is required',
          },
        ],
      });
    });

    it('should handle service errors (category not found)', async () => {
      (transactionValidation.create.validate as jest.Mock).mockReturnValue({
        error: null,
        value: validTransactionData,
      });

      mockTransactionService.createTransaction = jest.fn().mockRejectedValue(
        new Error('Category not found')
      );

      mockRequest.body = validTransactionData;

      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Category not found',
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle other service errors', async () => {
      (transactionValidation.create.validate as jest.Mock).mockReturnValue({
        error: null,
        value: validTransactionData,
      });

      mockTransactionService.createTransaction = jest.fn().mockRejectedValue(
        new Error('Invalid amount')
      );

      mockRequest.body = validTransactionData;

      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid amount',
      });
    });

    it('should handle unknown errors', async () => {
      (transactionValidation.create.validate as jest.Mock).mockReturnValue({
        error: null,
        value: validTransactionData,
      });

      mockTransactionService.createTransaction = jest.fn().mockRejectedValue('Unknown error');

      mockRequest.body = validTransactionData;

      await transactionController.createTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('getTransactionById', () => {
    const transactionId = '507f1f77bcf86cd799439012';
    const mockTransaction = {
      _id: transactionId,
      title: 'Test Transaction',
      amount: 100.50,
      type: 'expense',
      userId: 'user123',
    };

    it('should get transaction by ID successfully', async () => {
      mockTransactionService.getTransactionById = jest.fn().mockResolvedValue(mockTransaction);

      mockRequest.params = { id: transactionId };

      await transactionController.getTransactionById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTransaction,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await transactionController.getTransactionById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 400 when transaction ID is missing', async () => {
      mockRequest.params = {};

      await transactionController.getTransactionById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction ID is required',
      });
    });

    it('should handle transaction not found error', async () => {
      mockTransactionService.getTransactionById = jest.fn().mockRejectedValue(
        new Error('Transaction not found')
      );

      mockRequest.params = { id: transactionId };

      await transactionController.getTransactionById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction not found',
      });
    });

    it('should handle access denied error', async () => {
      mockTransactionService.getTransactionById = jest.fn().mockRejectedValue(
        new Error('access denied')
      );

      mockRequest.params = { id: transactionId };

      await transactionController.getTransactionById(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'access denied',
      });
    });
  });

  describe('getUserTransactions', () => {
    const mockTransactions = {
      transactions: [
        { _id: '1', title: 'Transaction 1', amount: 100 },
        { _id: '2', title: 'Transaction 2', amount: 200 },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    };

    it('should get user transactions successfully', async () => {
      mockTransactionService.getUserTransactions = jest.fn().mockResolvedValue(mockTransactions);

      mockRequest.query = { page: '1', limit: '10' };

      await transactionController.getUserTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockTransactions,
      });
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith('user123', {
        page: 1,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'desc',
      });
    });

    it('should handle array query parameters', async () => {
      mockTransactionService.getUserTransactions = jest.fn().mockResolvedValue(mockTransactions);

      mockRequest.query = { 
        page: ['1'], 
        limit: ['20'], 
        sort: ['amount'], 
        order: ['asc'] 
      };

      await transactionController.getUserTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith('user123', {
        page: 1,
        limit: 20,
        sortBy: 'amount',
        sortOrder: 'asc',
      });
    });

    it('should use default values for missing query parameters', async () => {
      mockTransactionService.getUserTransactions = jest.fn().mockResolvedValue(mockTransactions);

      mockRequest.query = {};

      await transactionController.getUserTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith('user123', {
        page: 1,
        limit: 10,
        sortBy: 'date',
        sortOrder: 'desc',
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await transactionController.getUserTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle service errors', async () => {
      mockTransactionService.getUserTransactions = jest.fn().mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.query = { page: '1', limit: '10' };

      await transactionController.getUserTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('updateTransaction', () => {
    const transactionId = '507f1f77bcf86cd799439012';
    const updateData = {
      title: 'Updated Transaction',
      amount: 150.75,
    };
    const mockUpdatedTransaction = {
      _id: transactionId,
      title: 'Updated Transaction',
      amount: 150.75,
      type: 'expense',
    };

    it('should update transaction successfully', async () => {
      (transactionValidation.update.validate as jest.Mock).mockReturnValue({
        error: null,
        value: updateData,
      });

      mockTransactionService.updateTransaction = jest.fn().mockResolvedValue(mockUpdatedTransaction);

      mockRequest.params = { id: transactionId };
      mockRequest.body = updateData;

      await transactionController.updateTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transaction updated successfully',
        data: mockUpdatedTransaction,
      });
      expect(logger.info).toHaveBeenCalledWith('Transaction updated via API', {
        transactionId,
        userId: 'user123',
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await transactionController.updateTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 400 when transaction ID is missing', async () => {
      mockRequest.params = {};

      await transactionController.updateTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction ID is required',
      });
    });

    it('should handle validation errors', async () => {
      const validationError = {
        details: [
          {
            path: ['amount'],
            message: 'Amount must be positive',
          },
        ],
      };

      (transactionValidation.update.validate as jest.Mock).mockReturnValue({
        error: validationError,
        value: {},
      });

      mockRequest.params = { id: transactionId };
      mockRequest.body = { amount: -10 };

      await transactionController.updateTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            field: 'amount',
            message: 'Amount must be positive',
          },
        ],
      });
    });

    it('should handle transaction not found error', async () => {
      (transactionValidation.update.validate as jest.Mock).mockReturnValue({
        error: null,
        value: updateData,
      });

      mockTransactionService.updateTransaction = jest.fn().mockRejectedValue(
        new Error('Transaction not found')
      );

      mockRequest.params = { id: transactionId };
      mockRequest.body = updateData;

      await transactionController.updateTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction not found',
      });
    });
  });

  describe('deleteTransaction', () => {
    const transactionId = '507f1f77bcf86cd799439012';

    it('should delete transaction successfully', async () => {
      mockTransactionService.deleteTransaction = jest.fn().mockResolvedValue(undefined);

      mockRequest.params = { id: transactionId };

      await transactionController.deleteTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Transaction deleted successfully',
      });
      expect(logger.info).toHaveBeenCalledWith('Transaction deleted via API', {
        transactionId,
        userId: 'user123',
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await transactionController.deleteTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 400 when transaction ID is missing', async () => {
      mockRequest.params = {};

      await transactionController.deleteTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction ID is required',
      });
    });

    it('should handle transaction not found error', async () => {
      mockTransactionService.deleteTransaction = jest.fn().mockRejectedValue(
        new Error('Transaction not found')
      );

      mockRequest.params = { id: transactionId };

      await transactionController.deleteTransaction(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Transaction not found',
      });
    });
  });

  describe('getTransactionStats', () => {
    const mockStats = {
      totalTransactions: 100,
      totalIncome: 5000,
      totalExpenses: 3000,
      netAmount: 2000,
      averageTransaction: 50,
      categoryBreakdown: [
        { category: 'Food', amount: 1000, count: 20 },
        { category: 'Transport', amount: 500, count: 10 },
      ],
    };

    it('should get transaction stats successfully', async () => {
      mockTransactionService.getTransactionStats = jest.fn().mockResolvedValue(mockStats);

      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      await transactionController.getTransactionStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await transactionController.getTransactionStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 400 when start date is missing', async () => {
      mockRequest.query = {
        endDate: '2024-01-31',
      };

      await transactionController.getTransactionStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required',
      });
    });

    it('should return 400 when end date is missing', async () => {
      mockRequest.query = {
        startDate: '2024-01-01',
      };

      await transactionController.getTransactionStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Start date and end date are required',
      });
    });

    it('should handle array query parameters for dates', async () => {
      mockTransactionService.getTransactionStats = jest.fn().mockResolvedValue(mockStats);

      mockRequest.query = {
        startDate: ['2024-01-01'],
        endDate: ['2024-01-31'],
      };

      await transactionController.getTransactionStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockTransactionService.getTransactionStats).toHaveBeenCalledWith('user123', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });
    });

    it('should handle service errors', async () => {
      mockTransactionService.getTransactionStats = jest.fn().mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      await transactionController.getTransactionStats(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('searchTransactions', () => {
    const mockResults = {
      transactions: [
        { _id: '1', title: 'Grocery Shopping', amount: 50 },
        { _id: '2', title: 'Gas Station', amount: 30 },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    };

    it('should search transactions successfully', async () => {
      mockTransactionService.getUserTransactions = jest.fn().mockResolvedValue(mockResults);

      mockRequest.query = {
        q: 'grocery',
        page: '1',
        limit: '10',
      };

      await transactionController.searchTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResults,
      });
      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith('user123', {
        search: 'grocery',
        page: 1,
        limit: 10,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await transactionController.searchTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should return 400 when search query is missing', async () => {
      mockRequest.query = {};

      await transactionController.searchTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Search query is required',
      });
    });

    it('should handle array query parameter for search', async () => {
      mockTransactionService.getUserTransactions = jest.fn().mockResolvedValue(mockResults);

      mockRequest.query = {
        q: ['grocery'],
        page: '1',
        limit: '10',
      };

      await transactionController.searchTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockTransactionService.getUserTransactions).toHaveBeenCalledWith('user123', {
        search: 'grocery',
        page: 1,
        limit: 10,
      });
    });

    it('should handle service errors', async () => {
      mockTransactionService.getUserTransactions = jest.fn().mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.query = {
        q: 'grocery',
        page: '1',
        limit: '10',
      };

      await transactionController.searchTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('getRecurringTransactions', () => {
    const mockRecurringTransactions = [
      { _id: '1', title: 'Monthly Rent', amount: 1200, frequency: 'monthly' },
      { _id: '2', title: 'Weekly Groceries', amount: 100, frequency: 'weekly' },
    ];

    it('should get recurring transactions successfully', async () => {
      mockTransactionService.getRecurringTransactions = jest.fn().mockResolvedValue(mockRecurringTransactions);

      await transactionController.getRecurringTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockRecurringTransactions,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await transactionController.getRecurringTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle service errors', async () => {
      mockTransactionService.getRecurringTransactions = jest.fn().mockRejectedValue(
        new Error('Database error')
      );

      await transactionController.getRecurringTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });

  describe('bulkCreateTransactions', () => {
    const validTransactionsData = {
      transactions: [
        { title: 'Transaction 1', amount: 100, type: 'expense' },
        { title: 'Transaction 2', amount: 200, type: 'income' },
      ],
    };

    const mockCreatedTransactions = [
      { _id: '1', title: 'Transaction 1', amount: 100, type: 'expense' },
      { _id: '2', title: 'Transaction 2', amount: 200, type: 'income' },
    ];

    it('should bulk create transactions successfully', async () => {
      (transactionValidation.bulk.validate as jest.Mock).mockReturnValue({
        error: null,
        value: validTransactionsData,
      });

      mockTransactionService.bulkCreateTransactions = jest.fn().mockResolvedValue(mockCreatedTransactions);

      mockRequest.body = validTransactionsData;

      await transactionController.bulkCreateTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Successfully created 2 transactions',
        data: mockCreatedTransactions,
        summary: {
          requested: 2,
          created: 2,
          failed: 0,
        },
      });
      expect(logger.info).toHaveBeenCalledWith('Bulk transactions created via API', {
        userId: 'user123',
        requested: 2,
        created: 2,
      });
    });

    it('should return 401 when user is not authenticated', async () => {
      mockRequest.user = undefined;

      await transactionController.bulkCreateTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required',
      });
    });

    it('should handle validation errors', async () => {
      const validationError = {
        details: [
          {
            path: ['transactions'],
            message: 'Transactions array is required',
          },
        ],
      };

      (transactionValidation.bulk.validate as jest.Mock).mockReturnValue({
        error: validationError,
        value: {},
      });

      mockRequest.body = {};

      await transactionController.bulkCreateTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            field: 'transactions',
            message: 'Transactions array is required',
          },
        ],
      });
    });

    it('should handle service errors', async () => {
      (transactionValidation.bulk.validate as jest.Mock).mockReturnValue({
        error: null,
        value: validTransactionsData,
      });

      mockTransactionService.bulkCreateTransactions = jest.fn().mockRejectedValue(
        new Error('Bulk creation failed')
      );

      mockRequest.body = validTransactionsData;

      await transactionController.bulkCreateTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bulk creation failed',
      });
    });

    it('should handle unknown service errors', async () => {
      (transactionValidation.bulk.validate as jest.Mock).mockReturnValue({
        error: null,
        value: validTransactionsData,
      });

      mockTransactionService.bulkCreateTransactions = jest.fn().mockRejectedValue('Unknown error');

      mockRequest.body = validTransactionsData;

      await transactionController.bulkCreateTransactions(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });
  });
});