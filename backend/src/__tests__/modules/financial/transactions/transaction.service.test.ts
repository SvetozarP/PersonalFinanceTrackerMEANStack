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

      mockTransactionRepository.count.mockResolvedValue(1);
      mockTransactionRepository.find.mockResolvedValue([mockTransaction]);

      const result = await transactionService.getUserTransactions(mockUserId);

      expect(result).toEqual(mockResult);
      expect(mockTransactionRepository.count).toHaveBeenCalledWith({
        userId: new mongoose.Types.ObjectId(mockUserId),
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

      mockTransactionRepository.count.mockResolvedValue(1);
      mockTransactionRepository.find.mockResolvedValue([mockTransaction]);

      const result = await transactionService.getUserTransactions(mockUserId, customOptions);

      expect(result).toEqual(mockResult);
      expect(mockTransactionRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: new mongoose.Types.ObjectId(mockUserId),
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
        })
      );
    });

    it('should handle date range filtering', async () => {
      const options = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      };

      mockTransactionRepository.count.mockResolvedValue(1);
      mockTransactionRepository.find.mockResolvedValue([mockTransaction]);

      await transactionService.getUserTransactions(mockUserId, options);

      expect(mockTransactionRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          date: {
            $gte: options.startDate,
            $lte: options.endDate,
          },
        })
      );
    });

    it('should handle amount range filtering', async () => {
      const options = { minAmount: 100, maxAmount: 500 };

      mockTransactionRepository.count.mockResolvedValue(1);
      mockTransactionRepository.find.mockResolvedValue([mockTransaction]);

      await transactionService.getUserTransactions(mockUserId, options);

      expect(mockTransactionRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: {
            $gte: 100,
            $lte: 500,
          },
        })
      );
    });

    it('should handle tag filtering', async () => {
      const options = { tags: ['food', 'transport'] };

      mockTransactionRepository.count.mockResolvedValue(1);
      mockTransactionRepository.find.mockResolvedValue([mockTransaction]);

      await transactionService.getUserTransactions(mockUserId, options);

      expect(mockTransactionRepository.count).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: { $in: ['food', 'transport'] },
        })
      );
    });

    it('should calculate total pages correctly', async () => {
      mockTransactionRepository.count.mockResolvedValue(25);
      mockTransactionRepository.find.mockResolvedValue([mockTransaction]);

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
});
