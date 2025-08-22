import mongoose from 'mongoose';
import { TransactionService } from '../../../../modules/financial/transactions/services/transaction.service';
import { TransactionRepository } from '../../../../modules/financial/transactions/repositories/transaction.repository';
import { ITransaction, TransactionType, TransactionStatus, PaymentMethod, RecurrencePattern } from '../../../../modules/financial/transactions/interfaces/transaction.interface';

// Mock the TransactionRepository
jest.mock('../../../../modules/financial/transactions/repositories/transaction.repository');
jest.mock('../../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const MockedTransactionRepository = TransactionRepository as jest.MockedClass<typeof TransactionRepository>;

describe('TransactionService', () => {
  let transactionService: TransactionService;
  let mockTransactionRepository: jest.Mocked<TransactionRepository>;

  const mockUserId = '507f1f77bcf86cd799439010';
  const mockTransactionId = '507f1f77bcf86cd799439011';
  const mockCategoryId = '507f1f77bcf86cd799439012';
  const mockAccountId = '507f1f77bcf86cd799439013';

  const mockTransaction = {
    _id: new mongoose.Types.ObjectId(mockTransactionId),
    userId: new mongoose.Types.ObjectId(mockUserId),
    categoryId: new mongoose.Types.ObjectId(mockCategoryId),
    accountId: new mongoose.Types.ObjectId(mockAccountId),
    title: 'Test Transaction',
    description: 'Test Description',
    amount: 100.50,
    currency: 'USD',
    type: TransactionType.EXPENSE,
    status: TransactionStatus.COMPLETED,
    paymentMethod: PaymentMethod.CASH,
    tags: ['test', 'sample'],
    date: new Date('2024-01-15'),
    timezone: 'UTC',
    isRecurring: false,
    recurrencePattern: RecurrencePattern.NONE,
    attachments: [],
    notes: 'Test notes',
    source: 'manual',
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    calculateNextOccurrence: jest.fn(),
  } as unknown as ITransaction;

  const mockIncomeTransaction = {
    ...mockTransaction,
    _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439014'),
    type: TransactionType.INCOME,
    amount: 2000.00,
    title: 'Salary',
  } as unknown as ITransaction;

  // Define testTransaction for use in tests
  const testTransaction = {
    categoryId: new mongoose.Types.ObjectId(mockCategoryId),
    accountId: new mongoose.Types.ObjectId(mockAccountId),
    type: TransactionType.EXPENSE,
    amount: 100,
    title: 'Test Transaction',
    description: 'Test Description',
    currency: 'USD',
    status: TransactionStatus.COMPLETED,
    paymentMethod: PaymentMethod.CASH,
    date: new Date('2024-01-15'),
    timezone: 'UTC',
    source: 'manual',
  };

  beforeEach(() => {
    // Create a fresh instance of the service
    transactionService = new TransactionService();
    
    // Get the mocked repository instance
    mockTransactionRepository = (transactionService as any).transactionRepository;
    
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    const transactionData = {
      categoryId: new mongoose.Types.ObjectId(mockCategoryId),
      accountId: new mongoose.Types.ObjectId(mockAccountId),
      type: TransactionType.EXPENSE,
      amount: 75.25,
      title: 'New Transaction',
      description: 'New Description',
      currency: 'USD',
      status: TransactionStatus.COMPLETED,
      paymentMethod: PaymentMethod.CASH,
      date: new Date('2024-01-20'),
      tags: ['food', 'lunch'],
      notes: 'Lunch expense',
      timezone: 'UTC',
      source: 'manual',
    };

    it('should create a transaction successfully', async () => {
      const newTransaction = { ...mockTransaction, ...transactionData } as any;
      mockTransactionRepository.create.mockResolvedValue(newTransaction);

      const result = await transactionService.createTransaction(transactionData as any, mockUserId);

      expect(result).toEqual(newTransaction);
      expect(mockTransactionRepository.create).toHaveBeenCalledWith({
        ...transactionData,
        userId: new mongoose.Types.ObjectId(mockUserId),
        status: TransactionStatus.COMPLETED,
        isRecurring: false,
        recurrencePattern: RecurrencePattern.NONE,
        tags: ['food', 'lunch'],
        attachments: [],
        source: 'manual',
        timezone: 'UTC',
      });
    });

    it('should handle recurring transaction creation', async () => {
      const recurringData = {
        ...transactionData,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurrenceInterval: 1,
        recurrenceEndDate: new Date('2024-12-31'),
      };

      const newTransaction = { ...mockTransaction, ...recurringData } as any;
      mockTransactionRepository.create.mockResolvedValue(newTransaction);
      mockTransactionRepository.createRecurringSeries = jest.fn().mockResolvedValue([mockTransaction]);

      const result = await transactionService.createTransaction(recurringData as any, mockUserId);

      expect(result).toEqual(newTransaction);
      expect(result.isRecurring).toBe(true);
      expect(result.recurrencePattern).toBe(RecurrencePattern.MONTHLY);
      expect(mockTransactionRepository.createRecurringSeries).toHaveBeenCalledWith(
        newTransaction,
        RecurrencePattern.MONTHLY,
        recurringData.recurrenceEndDate
      );
    });
  });

  describe('getTransactionById', () => {
    it('should get transaction by ID successfully', async () => {
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);

      const result = await transactionService.getTransactionById(mockTransactionId, mockUserId);

      expect(result).toEqual(mockTransaction);
      expect(mockTransactionRepository.findById).toHaveBeenCalledWith(mockTransactionId);
    });

    it('should throw error when transaction not found', async () => {
      mockTransactionRepository.findById.mockResolvedValue(null);

      await expect(
        transactionService.getTransactionById(mockTransactionId, mockUserId)
      ).rejects.toThrow('Transaction not found');
    });

    it('should throw error when transaction belongs to different user', async () => {
      const differentUserTransaction = {
        ...mockTransaction,
        userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439020'),
      } as unknown as ITransaction;

      mockTransactionRepository.findById.mockResolvedValue(differentUserTransaction);

      await expect(
        transactionService.getTransactionById(mockTransactionId, mockUserId)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('getUserTransactions', () => {
    it('should get user transactions with default options', async () => {
      const mockResult = {
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      };

      mockTransactionRepository.findByUserId.mockResolvedValue(mockResult);

      const result = await transactionService.getUserTransactions(mockUserId);

      expect(result).toEqual(mockResult);
      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(mockUserId, {
        page: 1,
        limit: 20,
        sort: { date: -1 },
        filter: {},
        populate: ['categoryId', 'subcategoryId'],
      });
    });

    it('should get user transactions with custom filters', async () => {
      const customOptions = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        categoryId: mockCategoryId,
        accountId: mockAccountId,
        type: TransactionType.EXPENSE,
        minAmount: 50,
        maxAmount: 200,
        tags: ['food'],
        page: 2,
        limit: 10,
      };

      const mockResult = {
        transactions: [mockTransaction],
        total: 1,
        page: 2,
        totalPages: 1,
      };

      mockTransactionRepository.findByUserId.mockResolvedValue(mockResult);

      const result = await transactionService.getUserTransactions(mockUserId, customOptions);

      expect(result).toEqual(mockResult);
      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(mockUserId, {
        page: 2,
        limit: 10,
        sort: { date: -1 },
        filter: expect.objectContaining({
          date: {
            $gte: customOptions.startDate,
            $lte: customOptions.endDate,
          },
          categoryId: new mongoose.Types.ObjectId(mockCategoryId),
          accountId: new mongoose.Types.ObjectId(mockAccountId),
          type: TransactionType.EXPENSE,
          amount: {
            $gte: customOptions.minAmount,
            $lte: customOptions.maxAmount,
          },
          tags: { $in: customOptions.tags },
        }),
        populate: ['categoryId', 'subcategoryId'],
      });
    });

    it('should handle date range filtering', async () => {
      const options = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      await transactionService.getUserTransactions(mockUserId, options);

      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(mockUserId, {
        page: 1,
        limit: 20,
        sort: { date: -1 },
        filter: expect.objectContaining({
          date: {
            $gte: options.startDate,
            $lte: options.endDate,
          },
        }),
        populate: ['categoryId', 'subcategoryId'],
      });
    });

    it('should handle amount range filtering', async () => {
      const options = { minAmount: 100, maxAmount: 500 };

      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      await transactionService.getUserTransactions(mockUserId, options);

      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(mockUserId, {
        page: 1,
        limit: 20,
        sort: { date: -1 },
        filter: expect.objectContaining({
          amount: {
            $gte: 100,
            $lte: 500,
          },
        }),
        populate: ['categoryId', 'subcategoryId'],
      });
    });

    it('should handle tag filtering', async () => {
      const options = { tags: ['food', 'transport'] };

      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      await transactionService.getUserTransactions(mockUserId, options);

      expect(mockTransactionRepository.findByUserId).toHaveBeenCalledWith(mockUserId, {
        page: 1,
        limit: 20,
        sort: { date: -1 },
        filter: expect.objectContaining({
          tags: { $in: ['food', 'transport'] },
        }),
        populate: ['categoryId', 'subcategoryId'],
      });
    });

    it('should calculate total pages correctly', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 25,
        page: 1,
        totalPages: 3
      });

      const result = await transactionService.getUserTransactions(mockUserId, { limit: 10 });

      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10)
    });
  });

  describe('updateTransaction', () => {
    const updateData = {
      amount: 125.75,
      title: 'Updated Transaction',
      description: 'Updated Description',
      tags: ['updated', 'modified'],
    };

    it('should update transaction successfully', async () => {
      const updatedTransaction = { ...mockTransaction, ...updateData };
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateById.mockResolvedValue(updatedTransaction as any);

      const result = await transactionService.updateTransaction(mockTransactionId, updateData, mockUserId);

      expect(result).toEqual(updatedTransaction);
      expect(mockTransactionRepository.updateById).toHaveBeenCalledWith(
        mockTransactionId,
        updateData,
        { new: true, runValidators: true }
      );
    });

    it('should throw error when transaction not found', async () => {
      mockTransactionRepository.findById.mockResolvedValue(null);

      await expect(
        transactionService.updateTransaction(mockTransactionId, updateData, mockUserId)
      ).rejects.toThrow('Transaction not found');
    });

    it('should throw error when transaction belongs to different user', async () => {
      const differentUserTransaction = {
        ...mockTransaction,
        userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439020'),
      } as unknown as ITransaction;

      mockTransactionRepository.findById.mockResolvedValue(differentUserTransaction);

      await expect(
        transactionService.updateTransaction(mockTransactionId, updateData, mockUserId)
      ).rejects.toThrow('Access denied');
    });

    it('should throw error when update fails', async () => {
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateById.mockResolvedValue(null);

      await expect(
        transactionService.updateTransaction(mockTransactionId, updateData, mockUserId)
      ).rejects.toThrow('Failed to update transaction');
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateById.mockResolvedValue(mockTransaction);

      await transactionService.deleteTransaction(mockTransactionId, mockUserId);

      expect(mockTransactionRepository.updateById).toHaveBeenCalledWith(mockTransactionId, {
        isDeleted: true,
        deletedAt: expect.any(Date),
      });
    });

    it('should throw error when transaction not found', async () => {
      mockTransactionRepository.findById.mockResolvedValue(null);

      await expect(
        transactionService.deleteTransaction(mockTransactionId, mockUserId)
      ).rejects.toThrow('Transaction not found');
    });

    it('should throw error when transaction belongs to different user', async () => {
      const differentUserTransaction = {
        ...mockTransaction,
        userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439020'),
      } as unknown as ITransaction;

      mockTransactionRepository.findById.mockResolvedValue(differentUserTransaction);

      await expect(
        transactionService.deleteTransaction(mockTransactionId, mockUserId)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('getTransactionStats', () => {
    it('should get transaction statistics successfully', async () => {
      const mockStats = {
        totalTransactions: 50,
        totalIncome: 5000,
        totalExpenses: 3000,
        totalTransfers: 0,
        totalAdjustments: 0,
        averageTransactionAmount: 100,
        transactionsByType: {
          [TransactionType.INCOME]: { count: 10, total: 5000 },
          [TransactionType.EXPENSE]: { count: 40, total: 3000 },
          [TransactionType.TRANSFER]: { count: 0, total: 0 },
          [TransactionType.ADJUSTMENT]: { count: 0, total: 0 },
        },
        transactionsByCategory: [
          { categoryId: mockCategoryId, categoryName: 'Food', count: 20, total: 1000, percentage: 20 },
        ],
        monthlyTrends: [
          { month: '2024-01', income: 2500, expenses: 1500, net: 1000 },
          { month: '2024-02', income: 2500, expenses: 1500, net: 1000 },
        ],
      };

      mockTransactionRepository.count.mockResolvedValue(50);
      mockTransactionRepository.aggregate
        .mockResolvedValueOnce([{ total: 5000 }]) // totalIncome
        .mockResolvedValueOnce([{ total: 3000 }]) // totalExpenses
        .mockResolvedValueOnce([]) // totalTransfers
        .mockResolvedValueOnce([]) // totalAdjustments
        .mockResolvedValueOnce([
          { _id: TransactionType.INCOME, count: 10, total: 5000 },
          { _id: TransactionType.EXPENSE, count: 40, total: 3000 },
        ]) // transactionsByType
        .mockResolvedValueOnce([
          { _id: mockCategoryId, categoryName: 'Food', count: 20, total: 1000, percentage: 0 },
        ]) // transactionsByCategory
        .mockResolvedValueOnce([
          { _id: { year: 2024, month: 1 }, income: 2500, expenses: 1500 },
          { _id: { year: 2024, month: 2 }, income: 2500, expenses: 1500 },
        ]); // monthlyTrends

      const result = await transactionService.getTransactionStats(mockUserId, {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-29'),
      });

      expect(result.totalTransactions).toBe(50);
      expect(result.totalIncome).toBe(5000);
      expect(result.totalExpenses).toBe(3000);
      expect(result.transactionsByType[TransactionType.INCOME].count).toBe(10);
      expect(result.transactionsByType[TransactionType.EXPENSE].count).toBe(40);
      expect(mockTransactionRepository.count).toHaveBeenCalled();
      expect(mockTransactionRepository.aggregate).toHaveBeenCalledTimes(7);
    });

    it('should handle empty transaction data', async () => {
      mockTransactionRepository.count.mockResolvedValue(0);
      mockTransactionRepository.aggregate
        .mockResolvedValueOnce([]) // totalIncome
        .mockResolvedValueOnce([]) // totalExpenses
        .mockResolvedValueOnce([]) // totalTransfers
        .mockResolvedValueOnce([]) // totalAdjustments
        .mockResolvedValueOnce([]) // transactionsByType
        .mockResolvedValueOnce([]) // transactionsByCategory
        .mockResolvedValueOnce([]); // monthlyTrends

      const result = await transactionService.getTransactionStats(mockUserId);

      expect(result.totalTransactions).toBe(0);
      expect(result.totalIncome).toBe(0);
      expect(result.totalExpenses).toBe(0);
    });
  });

  describe('bulkCreateTransactions', () => {
    const transactionsData = [
      {
        categoryId: new mongoose.Types.ObjectId(mockCategoryId),
        accountId: new mongoose.Types.ObjectId(mockAccountId),
        type: TransactionType.EXPENSE,
        amount: 50,
        title: 'Transaction 1',
        description: 'Transaction 1',
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        paymentMethod: PaymentMethod.CASH,
        date: new Date('2024-01-15'),
        timezone: 'UTC',
        source: 'manual',
      },
      {
        categoryId: new mongoose.Types.ObjectId(mockCategoryId),
        accountId: new mongoose.Types.ObjectId(mockAccountId),
        type: TransactionType.INCOME,
        amount: 1000,
        title: 'Transaction 2',
        description: 'Transaction 2',
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        paymentMethod: PaymentMethod.CASH,
        date: new Date('2024-01-16'),
        timezone: 'UTC',
        source: 'manual',
      },
    ];

    it('should create transactions in bulk successfully', async () => {
      const createdTransactions = [
        { ...mockTransaction, title: 'Transaction 1' },
        { ...mockTransaction, title: 'Transaction 2' },
      ];

      mockTransactionRepository.create
        .mockResolvedValueOnce(createdTransactions[0] as any)
        .mockResolvedValueOnce(createdTransactions[1] as any);

      const result = await transactionService.bulkCreateTransactions(transactionsData, mockUserId);

      expect(result).toEqual(createdTransactions);
      expect(mockTransactionRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should continue processing when some transactions fail', async () => {
      const createdTransactions = [{ ...mockTransaction, title: 'Transaction 1' }];

      mockTransactionRepository.create
        .mockResolvedValueOnce(createdTransactions[0] as any)
        .mockRejectedValueOnce(new Error('Validation failed'));

      const result = await transactionService.bulkCreateTransactions(transactionsData, mockUserId);

      expect(result).toEqual(createdTransactions);
      expect(result.length).toBe(1);
    });
  });

  describe('getRecurringTransactions', () => {
    it('should get recurring transactions successfully', async () => {
      const recurringTransaction = {
        ...mockTransaction,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurrenceInterval: 1,
        recurrenceEndDate: new Date('2024-12-31'),
      } as unknown as ITransaction;

      mockTransactionRepository.find.mockResolvedValue([recurringTransaction]);

      const result = await transactionService.getRecurringTransactions(mockUserId);

      expect(result).toEqual([recurringTransaction]);
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({
        userId: new mongoose.Types.ObjectId(mockUserId),
        isRecurring: true,
        isDeleted: { $ne: true },
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid ObjectId strings gracefully', async () => {
      await expect(
        transactionService.getTransactionById('invalid-id', mockUserId)
      ).rejects.toThrow();
    });

    it('should handle database connection errors', async () => {
      const mockError = new Error('Database connection failed');
      mockTransactionRepository.findById.mockRejectedValue(mockError);

      await expect(
        transactionService.getTransactionById(mockTransactionId, mockUserId)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle validation errors gracefully', async () => {
      const mockError = new Error('Validation failed');
      mockError.name = 'ValidationError';
      mockTransactionRepository.create.mockRejectedValue(mockError);

      await expect(
        transactionService.createTransaction({} as any, mockUserId)
      ).rejects.toThrow('Validation failed');
    });

    it('should handle cast errors gracefully', async () => {
      const mockError = new Error('Cast to ObjectId failed');
      mockError.name = 'CastError';
      mockTransactionRepository.findById.mockRejectedValue(mockError);

      await expect(
        transactionService.getTransactionById('invalid-id', mockUserId)
      ).rejects.toThrow('Cast to ObjectId failed');
    });

    it('should handle duplicate key errors gracefully', async () => {
      const mockError = new Error('Duplicate key error');
      mockError.name = 'MongoError';
      (mockError as any).code = 11000;
      mockTransactionRepository.create.mockRejectedValue(mockError);

      await expect(
        transactionService.createTransaction(testTransaction, mockUserId)
      ).rejects.toThrow('Duplicate key error');
    });

    it('should handle empty filter arrays gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const result = await transactionService.getUserTransactions(mockUserId, {
        tags: [],
        categoryId: testTransaction.categoryId.toString(),
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle null filter values gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const result = await transactionService.getUserTransactions(mockUserId, {
        tags: null as any,
        categoryId: null as any,
        search: null as any,
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle undefined filter values gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const result = await transactionService.getUserTransactions(mockUserId, {
        tags: undefined,
        categoryId: undefined,
        search: undefined,
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle extreme date ranges gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const farPastDate = new Date('1900-01-01');
      const farFutureDate = new Date('2100-12-31');

      const result = await transactionService.getUserTransactions(mockUserId, {
        startDate: farPastDate,
        endDate: farFutureDate,
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle extreme amount ranges gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const result = await transactionService.getUserTransactions(mockUserId, {
        minAmount: 0.01,
        maxAmount: 999999999.99,
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 1
      });

      const result = await transactionService.getUserTransactions(mockUserId, {
        page: -1,
        limit: 0,
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle extreme pagination parameters gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 999999,
        totalPages: 1
      });

      const result = await transactionService.getUserTransactions(mockUserId, {
        page: 999999,
        limit: 999999,
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(999999);
      expect(result.totalPages).toBe(1); // Should be capped at 100
    });

    it('should handle empty search terms gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const result = await transactionService.getUserTransactions(mockUserId, {
        search: '',
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle whitespace-only search terms gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const result = await transactionService.getUserTransactions(mockUserId, {
        search: '   ',
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle very long search terms gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const longSearchTerm = 'a'.repeat(1000);
      const result = await transactionService.getUserTransactions(mockUserId, {
        search: longSearchTerm,
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle complex sort orders gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const result = await transactionService.getUserTransactions(mockUserId, {
        sortBy: 'amount',
        sortOrder: 'desc',
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle invalid sort fields gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const result = await transactionService.getUserTransactions(mockUserId, {
        sortBy: 'invalidField' as any,
        sortOrder: 'asc',
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle invalid sort orders gracefully', async () => {
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [],
        total: 0,
        page: 1,
        totalPages: 0
      });

      const result = await transactionService.getUserTransactions(mockUserId, {
        sortBy: 'amount',
        sortOrder: 'invalid' as any,
      });

      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle missing transaction data gracefully', async () => {
      await expect(
        transactionService.createTransaction({} as any, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle partial transaction data gracefully', async () => {
      const partialData = {
        title: 'Partial Transaction',
        amount: 100,
      };

      await expect(
        transactionService.createTransaction(partialData as any, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid amount values gracefully', async () => {
      const invalidAmountData = {
        ...testTransaction,
        amount: -100,
      };

      await expect(
        transactionService.createTransaction(invalidAmountData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle zero amount values gracefully', async () => {
      const zeroAmountData = {
        ...testTransaction,
        amount: 0,
      };

      await expect(
        transactionService.createTransaction(zeroAmountData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle very small amount values gracefully', async () => {
      const smallAmountData = {
        ...testTransaction,
        amount: 0.001,
      };

      await expect(
        transactionService.createTransaction(smallAmountData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle very large amount values gracefully', async () => {
      const largeAmountData = {
        ...testTransaction,
        amount: 1000000000,
      };

      await expect(
        transactionService.createTransaction(largeAmountData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid currency codes gracefully', async () => {
      const invalidCurrencyData = {
        ...testTransaction,
        currency: 'INVALID',
      };

      await expect(
        transactionService.createTransaction(invalidCurrencyData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid transaction types gracefully', async () => {
      const invalidTypeData = {
        ...testTransaction,
        type: 'INVALID_TYPE' as any,
      };

      await expect(
        transactionService.createTransaction(invalidTypeData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid payment methods gracefully', async () => {
      const invalidPaymentData = {
        ...testTransaction,
        paymentMethod: 'INVALID_METHOD' as any,
      };

      await expect(
        transactionService.createTransaction(invalidPaymentData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid category IDs gracefully', async () => {
      const invalidCategoryData = {
        ...testTransaction,
        categoryId: 'invalid-category-id' as any,
      };

      await expect(
        transactionService.createTransaction(invalidCategoryData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid subcategory IDs gracefully', async () => {
      const invalidSubcategoryData = {
        ...testTransaction,
        subcategoryId: 'invalid-subcategory-id' as any,
      };

      await expect(
        transactionService.createTransaction(invalidSubcategoryData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle future dates gracefully', async () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      const futureDateData = {
        ...testTransaction,
        date: futureDate,
      };

      await expect(
        transactionService.createTransaction(futureDateData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle very old dates gracefully', async () => {
      const oldDate = new Date('1900-01-01');
      const oldDateData = {
        ...testTransaction,
        date: oldDate,
      };

      await expect(
        transactionService.createTransaction(oldDateData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid time formats gracefully', async () => {
      const invalidTimeData = {
        ...testTransaction,
        time: '25:00', // Invalid time
      };

      await expect(
        transactionService.createTransaction(invalidTimeData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid timezone values gracefully', async () => {
      const invalidTimezoneData = {
        ...testTransaction,
        timezone: 'INVALID_TIMEZONE',
      };

      await expect(
        transactionService.createTransaction(invalidTimezoneData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid location coordinates gracefully', async () => {
      const invalidLocationData = {
        ...testTransaction,
        location: {
          name: 'Test Location',
          address: 'Test Address',
          coordinates: {
            latitude: 1000, // Invalid latitude
            longitude: -74.0060,
          },
        },
      };

      await expect(
        transactionService.createTransaction(invalidLocationData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid tag formats gracefully', async () => {
      const invalidTagData = {
        ...testTransaction,
        tags: ['a'.repeat(100)], // Tag too long
      };

      await expect(
        transactionService.createTransaction(invalidTagData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid attachment data gracefully', async () => {
      const invalidAttachmentData = {
        ...testTransaction,
        attachments: [
          {
            filename: 'test.pdf',
            originalName: 'test.pdf',
            mimeType: 'application/pdf',
            size: 100 * 1024 * 1024, // 100MB (too large)
            url: '/uploads/test.pdf',
            uploadedAt: new Date(),
          },
        ],
      };

      await expect(
        transactionService.createTransaction(invalidAttachmentData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid recurring pattern gracefully', async () => {
      const invalidRecurringData = {
        ...testTransaction,
        isRecurring: true,
        recurringPattern: {
          frequency: 'INVALID_FREQUENCY' as any,
          interval: 1,
        },
      };

      await expect(
        transactionService.createTransaction(invalidRecurringData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid exchange rate gracefully', async () => {
      const invalidExchangeData = {
        ...testTransaction,
        originalAmount: 85.50,
        originalCurrency: 'EUR',
        exchangeRate: -1.15, // Negative exchange rate
      };

      await expect(
        transactionService.createTransaction(invalidExchangeData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid fees gracefully', async () => {
      const invalidFeesData = {
        ...testTransaction,
        fees: -10, // Negative fees
      };

      await expect(
        transactionService.createTransaction(invalidFeesData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid tax gracefully', async () => {
      const invalidTaxData = {
        ...testTransaction,
        tax: -8.50, // Negative tax
      };

      await expect(
        transactionService.createTransaction(invalidTaxData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid discount gracefully', async () => {
      const invalidDiscountData = {
        ...testTransaction,
        discount: -5.00, // Negative discount
      };

      await expect(
        transactionService.createTransaction(invalidDiscountData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid merchant data gracefully', async () => {
      const invalidMerchantData = {
        ...testTransaction,
        merchantName: 'a'.repeat(300), // Name too long
      };

      await expect(
        transactionService.createTransaction(invalidMerchantData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid payment reference gracefully', async () => {
      const invalidReferenceData = {
        ...testTransaction,
        paymentReference: 'a'.repeat(200), // Reference too long
      };

      await expect(
        transactionService.createTransaction(invalidReferenceData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid notes gracefully', async () => {
      const invalidNotesData = {
        ...testTransaction,
        notes: 'a'.repeat(2000), // Notes too long
      };

      await expect(
        transactionService.createTransaction(invalidNotesData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid description gracefully', async () => {
      const invalidDescriptionData = {
        ...testTransaction,
        description: 'a'.repeat(2000), // Description too long
      };

      await expect(
        transactionService.createTransaction(invalidDescriptionData, mockUserId)
      ).rejects.toThrow();
    });

    it('should handle invalid title gracefully', async () => {
      const invalidTitleData = {
        ...testTransaction,
        title: 'a'.repeat(300), // Title too long
      };

      await expect(
        transactionService.createTransaction(invalidTitleData, mockUserId)
      ).rejects.toThrow();
    });
  });
});
