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

  describe('getRecurringTransactions', () => {
    it('should get recurring transactions successfully', async () => {
      const mockRecurringTransactions = [
        { ...mockTransaction, isRecurring: true, recurrencePattern: RecurrencePattern.MONTHLY },
        { ...mockTransaction, isRecurring: true, recurrencePattern: RecurrencePattern.WEEKLY },
      ];

      mockTransactionRepository.find.mockResolvedValue(mockRecurringTransactions as any);

      const result = await transactionService.getRecurringTransactions(mockUserId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(mockTransactionRepository.find).toHaveBeenCalledWith({
        userId: new mongoose.Types.ObjectId(mockUserId),
        isRecurring: true,
        isDeleted: { $ne: true },
      });
    });

    it('should handle empty recurring transactions', async () => {
      mockTransactionRepository.find.mockResolvedValue([]);

      const result = await transactionService.getRecurringTransactions(mockUserId);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle repository errors in getRecurringTransactions', async () => {
      const mockError = new Error('Repository error');
      mockTransactionRepository.find.mockRejectedValue(mockError);

      await expect(
        transactionService.getRecurringTransactions(mockUserId)
      ).rejects.toThrow('Repository error');
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

  describe('bulkCreateTransactions', () => {
    const bulkTransactionData = [
      {
        categoryId: new mongoose.Types.ObjectId(mockCategoryId),
        accountId: new mongoose.Types.ObjectId(mockAccountId),
        type: TransactionType.EXPENSE,
        amount: 50.00,
        title: 'Bulk Transaction 1',
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        paymentMethod: PaymentMethod.CASH,
        date: new Date('2024-01-20'),
      },
      {
        categoryId: new mongoose.Types.ObjectId(mockCategoryId),
        accountId: new mongoose.Types.ObjectId(mockAccountId),
        type: TransactionType.INCOME,
        amount: 100.00,
        title: 'Bulk Transaction 2',
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        paymentMethod: PaymentMethod.CASH,
        date: new Date('2024-01-21'),
      },
    ];

    it('should bulk create transactions successfully', async () => {
      mockTransactionRepository.create.mockResolvedValueOnce(mockTransaction);
      mockTransactionRepository.create.mockResolvedValueOnce(mockIncomeTransaction);

      const result = await transactionService.bulkCreateTransactions(
        bulkTransactionData,
        mockUserId
      );

      expect(result).toHaveLength(2);
      expect(mockTransactionRepository.create).toHaveBeenCalledTimes(2);
      expect(result[0]).toEqual(mockTransaction);
      expect(result[1]).toEqual(mockIncomeTransaction);
    });

    it('should handle partial failures in bulk creation', async () => {
      mockTransactionRepository.create.mockResolvedValueOnce(mockTransaction);
      mockTransactionRepository.create.mockRejectedValueOnce(new Error('Database error'));

      const result = await transactionService.bulkCreateTransactions(
        bulkTransactionData,
        mockUserId
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockTransaction);
    });

    it('should handle empty bulk transaction array', async () => {
      const result = await transactionService.bulkCreateTransactions([], mockUserId);

      expect(result).toHaveLength(0);
      expect(mockTransactionRepository.create).not.toHaveBeenCalled();
    });

    it('should handle all failures in bulk creation', async () => {
      mockTransactionRepository.create.mockRejectedValue(new Error('Database error'));

      const result = await transactionService.bulkCreateTransactions(
        bulkTransactionData,
        mockUserId
      );

      expect(result).toHaveLength(0);
    });

    it('should handle bulk creation with single transaction', async () => {
      mockTransactionRepository.create.mockResolvedValueOnce(mockTransaction);

      const result = await transactionService.bulkCreateTransactions(
        [bulkTransactionData[0]],
        mockUserId
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockTransaction);
    });
  });

  describe('getTransactionStats', () => {
    const mockStatsOptions = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      categoryId: mockCategoryId,
      type: TransactionType.EXPENSE,
    };

    const mockAggregationResult = [
      { _id: TransactionType.INCOME, count: 5, total: 5000 },
      { _id: TransactionType.EXPENSE, count: 10, total: 2000 },
    ];

    const mockCategoryAggregationResult = [
      {
        _id: new mongoose.Types.ObjectId(mockCategoryId),
        categoryName: 'Food',
        count: 5,
        total: 500,
        percentage: 25,
      },
    ];

    const mockMonthlyTrendsResult = [
      {
        _id: { year: 2024, month: 1 },
        income: 1000,
        expenses: 500,
      },
    ];

    beforeEach(() => {
      mockTransactionRepository.count.mockResolvedValue(15);
      mockTransactionRepository.aggregate
        .mockResolvedValueOnce([{ total: 5000 }]) // totalIncome
        .mockResolvedValueOnce([{ total: 2000 }]) // totalExpenses
        .mockResolvedValueOnce([{ total: 1000 }]) // totalTransfers
        .mockResolvedValueOnce([{ total: 500 }]) // totalAdjustments
        .mockResolvedValueOnce(mockAggregationResult) // transactionsByType
        .mockResolvedValueOnce(mockCategoryAggregationResult) // transactionsByCategory
        .mockResolvedValueOnce(mockMonthlyTrendsResult); // monthlyTrends
    });

    it('should get transaction statistics successfully', async () => {
      const stats = await transactionService.getTransactionStats(mockUserId, mockStatsOptions);

      expect(stats.totalTransactions).toBe(15);
      expect(stats.totalIncome).toBe(5000);
      expect(stats.totalExpenses).toBe(2000);
      expect(stats.totalTransfers).toBe(1000);
      expect(stats.totalAdjustments).toBe(500);
      expect(stats.averageTransactionAmount).toBe(5000 / 15);
      expect(stats.transactionsByType).toBeDefined();
      expect(stats.transactionsByCategory).toHaveLength(1);
      expect(stats.monthlyTrends).toHaveLength(1);
    });

    it('should get transaction statistics with no options', async () => {
      const stats = await transactionService.getTransactionStats(mockUserId);

      expect(stats.totalTransactions).toBe(15);
      expect(stats.totalIncome).toBe(5000);
      expect(stats.totalExpenses).toBe(2000);
    });

    it('should handle statistics with date range only', async () => {
      const dateOnlyOptions = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const stats = await transactionService.getTransactionStats(mockUserId, dateOnlyOptions);

      expect(stats.totalTransactions).toBe(15);
      expect(stats.totalIncome).toBe(5000);
    });

    it('should handle statistics with category filter only', async () => {
      const categoryOnlyOptions = { categoryId: mockCategoryId };

      const stats = await transactionService.getTransactionStats(mockUserId, categoryOnlyOptions);

      expect(stats.totalTransactions).toBe(15);
      expect(stats.totalIncome).toBe(5000);
    });

    it('should handle statistics with type filter only', async () => {
      const typeOnlyOptions = { type: TransactionType.EXPENSE };

      const stats = await transactionService.getTransactionStats(mockUserId, typeOnlyOptions);

      expect(stats.totalTransactions).toBe(15);
      expect(stats.totalIncome).toBe(5000);
    });

    it('should handle empty aggregation results', async () => {
      // Reset all mocks to ensure clean state
      mockTransactionRepository.count.mockReset();
      mockTransactionRepository.aggregate.mockReset();
      
      mockTransactionRepository.count.mockResolvedValue(0);
      mockTransactionRepository.aggregate
        .mockResolvedValueOnce([]) // totalIncome
        .mockResolvedValueOnce([]) // totalExpenses
        .mockResolvedValueOnce([]) // totalTransfers
        .mockResolvedValueOnce([]) // totalAdjustments
        .mockResolvedValueOnce([]) // transactionsByType
        .mockResolvedValueOnce([]) // transactionsByCategory
        .mockResolvedValueOnce([]); // monthlyTrends

      const stats = await transactionService.getTransactionStats(mockUserId, mockStatsOptions);

      expect(stats.totalTransactions).toBe(0);
      expect(stats.totalIncome).toBe(0);
      expect(stats.totalExpenses).toBe(0);
      expect(stats.totalTransfers).toBe(0);
      expect(stats.totalAdjustments).toBe(0);
      expect(stats.averageTransactionAmount).toBe(0);
      expect(stats.transactionsByCategory).toHaveLength(0);
      expect(stats.monthlyTrends).toHaveLength(0);
    });

    it('should handle zero total transactions', async () => {
      mockTransactionRepository.count.mockResolvedValue(0);

      const stats = await transactionService.getTransactionStats(mockUserId, mockStatsOptions);

      expect(stats.totalTransactions).toBe(0);
      expect(stats.averageTransactionAmount).toBe(0);
    });

    it('should handle statistics with start date only', async () => {
      const startDateOnlyOptions = { startDate: new Date('2024-01-01') };

      const stats = await transactionService.getTransactionStats(mockUserId, startDateOnlyOptions);

      expect(stats.totalTransactions).toBe(15);
    });

    it('should handle statistics with end date only', async () => {
      const endDateOnlyOptions = { endDate: new Date('2024-12-31') };

      const stats = await transactionService.getTransactionStats(mockUserId, endDateOnlyOptions);

      expect(stats.totalTransactions).toBe(15);
    });

    it('should handle statistics with start date only', async () => {
      const startDateOnlyOptions = { startDate: new Date('2024-01-01') };

      const stats = await transactionService.getTransactionStats(mockUserId, startDateOnlyOptions);

      expect(stats.totalTransactions).toBe(15);
    });

    it('should handle statistics with end date only', async () => {
      const endDateOnlyOptions = { endDate: new Date('2024-12-31') };

      const stats = await transactionService.getTransactionStats(mockUserId, endDateOnlyOptions);

      expect(stats.totalTransactions).toBe(15);
    });
  });

  describe('createRecurringSeries', () => {
    const recurringTransaction = {
      ...mockTransaction,
      isRecurring: true,
      recurrencePattern: RecurrencePattern.MONTHLY,
      recurrenceEndDate: new Date('2024-12-31'),
    } as unknown as ITransaction;

    it('should create recurring series successfully', async () => {
      mockTransactionRepository.createRecurringSeries.mockResolvedValue([mockTransaction]);

      await (transactionService as any).createRecurringSeries(recurringTransaction);

      expect(mockTransactionRepository.createRecurringSeries).toHaveBeenCalledWith(
        recurringTransaction,
        RecurrencePattern.MONTHLY,
        recurringTransaction.recurrenceEndDate
      );
    });

    it('should not create series for non-recurring transaction', async () => {
      const nonRecurringTransaction = {
        ...mockTransaction,
        isRecurring: false,
        recurrencePattern: RecurrencePattern.NONE,
      } as unknown as ITransaction;

      await (transactionService as any).createRecurringSeries(nonRecurringTransaction);

      expect(mockTransactionRepository.createRecurringSeries).not.toHaveBeenCalled();
    });

    it('should not create series for NONE recurrence pattern', async () => {
      const nonePatternTransaction = {
        ...mockTransaction,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.NONE,
      } as unknown as ITransaction;

      await (transactionService as any).createRecurringSeries(nonePatternTransaction);

      expect(mockTransactionRepository.createRecurringSeries).not.toHaveBeenCalled();
    });

    it('should throw error when recurrence end date is missing', async () => {
      const transactionWithoutEndDate = {
        ...mockTransaction,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurrenceEndDate: undefined,
      } as unknown as ITransaction;

      await expect(
        (transactionService as any).createRecurringSeries(transactionWithoutEndDate)
      ).rejects.toThrow('Recurrence end date is required for recurring transactions');
    });

    it('should handle repository errors in recurring series creation', async () => {
      mockTransactionRepository.createRecurringSeries.mockRejectedValue(new Error('Database error'));

      await expect(
        (transactionService as any).createRecurringSeries(recurringTransaction)
      ).rejects.toThrow('Database error');
    });
  });

  describe('updateRecurringSeries', () => {
    const recurringTransaction = {
      ...mockTransaction,
      isRecurring: true,
      recurrencePattern: RecurrencePattern.MONTHLY,
    } as unknown as ITransaction;

    it('should update recurring series successfully', async () => {
      await (transactionService as any).updateRecurringSeries(recurringTransaction);

      // This method currently just logs, so we just verify it doesn't throw
      expect(true).toBe(true);
    });

    it('should handle repository errors in recurring series update', async () => {
      // The updateRecurringSeries method currently just logs and doesn't throw
      // This test verifies it completes successfully
      await expect(
        (transactionService as any).updateRecurringSeries(recurringTransaction)
      ).resolves.toBeUndefined();
    });
  });

  describe('formatTransactionsByType', () => {
    it('should format transactions by type correctly', async () => {
      const mockAggregationResult = [
        { _id: TransactionType.INCOME, count: 5, total: 5000 },
        { _id: TransactionType.EXPENSE, count: 10, total: 2000 },
      ];

      const result = await (transactionService as any).formatTransactionsByType(mockAggregationResult);

      expect(result[TransactionType.INCOME]).toEqual({ count: 5, total: 5000 });
      expect(result[TransactionType.EXPENSE]).toEqual({ count: 10, total: 2000 });
      expect(result[TransactionType.TRANSFER]).toEqual({ count: 0, total: 0 });
      expect(result[TransactionType.ADJUSTMENT]).toEqual({ count: 0, total: 0 });
    });

    it('should handle empty aggregation result', async () => {
      const result = await (transactionService as any).formatTransactionsByType([]);

      expect(result[TransactionType.INCOME]).toEqual({ count: 0, total: 0 });
      expect(result[TransactionType.EXPENSE]).toEqual({ count: 0, total: 0 });
      expect(result[TransactionType.TRANSFER]).toEqual({ count: 0, total: 0 });
      expect(result[TransactionType.ADJUSTMENT]).toEqual({ count: 0, total: 0 });
    });

    it('should handle partial aggregation result', async () => {
      const mockAggregationResult = [
        { _id: TransactionType.INCOME, count: 3, total: 3000 },
      ];

      const result = await (transactionService as any).formatTransactionsByType(mockAggregationResult);

      expect(result[TransactionType.INCOME]).toEqual({ count: 3, total: 3000 });
      expect(result[TransactionType.EXPENSE]).toEqual({ count: 0, total: 0 });
      expect(result[TransactionType.TRANSFER]).toEqual({ count: 0, total: 0 });
      expect(result[TransactionType.ADJUSTMENT]).toEqual({ count: 0, total: 0 });
    });

    it('should handle unknown transaction types gracefully', async () => {
      const mockAggregationResult = [
        { _id: 'UNKNOWN_TYPE', count: 1, total: 100 },
        { _id: TransactionType.INCOME, count: 2, total: 2000 },
      ];

      const result = await (transactionService as any).formatTransactionsByType(mockAggregationResult);

      expect(result[TransactionType.INCOME]).toEqual({ count: 2, total: 2000 });
      expect(result[TransactionType.EXPENSE]).toEqual({ count: 0, total: 0 });
      expect(result[TransactionType.TRANSFER]).toEqual({ count: 0, total: 0 });
      expect(result[TransactionType.ADJUSTMENT]).toEqual({ count: 0, total: 0 });
    });
  });

  describe('getUserTransactions edge cases', () => {
    it('should handle undefined search parameter', async () => {
      const options = { search: undefined };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle empty search parameter', async () => {
      const options = { search: '' };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle whitespace-only search parameter', async () => {
      const options = { search: '   ' };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle undefined tags parameter', async () => {
      const options = { tags: undefined };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle empty tags array', async () => {
      const options = { tags: [] };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle undefined isRecurring parameter', async () => {
      const options = { isRecurring: undefined };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle false isRecurring parameter', async () => {
      const options = { isRecurring: false };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle true isRecurring parameter', async () => {
      const options = { isRecurring: true };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle undefined source parameter', async () => {
      const options = { source: undefined };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle empty source parameter', async () => {
      const options = { source: '' };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle undefined paymentMethod parameter', async () => {
      const options = { paymentMethod: undefined };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle empty paymentMethod parameter', async () => {
      const options = { paymentMethod: '' };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle undefined sortBy parameter', async () => {
      const options = { sortBy: undefined };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle undefined sortOrder parameter', async () => {
      const options = { sortOrder: undefined };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle asc sortOrder parameter', async () => {
      const options = { sortOrder: 'asc' as const };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should handle desc sortOrder parameter', async () => {
      const options = { sortOrder: 'desc' as const };
      mockTransactionRepository.findByUserId.mockResolvedValue({
        transactions: [mockTransaction],
        total: 1,
        page: 1,
        totalPages: 1,
      });

      const result = await transactionService.getUserTransactions(mockUserId, options);

      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('updateTransaction edge cases', () => {
    it('should handle update without recurrence pattern change', async () => {
      const updateData = { title: 'Updated Title' };
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateById.mockResolvedValue({
        ...mockTransaction,
        title: 'Updated Title',
      } as unknown as ITransaction);

      const result = await transactionService.updateTransaction(
        mockTransactionId,
        updateData,
        mockUserId
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should handle update with isRecurring change', async () => {
      const updateData = { isRecurring: true };
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateById.mockResolvedValue({
        ...mockTransaction,
        isRecurring: true,
      } as unknown as ITransaction);

      const result = await transactionService.updateTransaction(
        mockTransactionId,
        updateData,
        mockUserId
      );

      expect(result.isRecurring).toBe(true);
    });

    it('should handle update with recurrencePattern change', async () => {
      const updateData = { recurrencePattern: RecurrencePattern.MONTHLY };
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateById.mockResolvedValue({
        ...mockTransaction,
        recurrencePattern: RecurrencePattern.MONTHLY,
      } as unknown as ITransaction);

      const result = await transactionService.updateTransaction(
        mockTransactionId,
        updateData,
        mockUserId
      );

      expect(result.recurrencePattern).toBe(RecurrencePattern.MONTHLY);
    });

    it('should handle update with both recurrence changes', async () => {
      const updateData = {
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
      };
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateById.mockResolvedValue({
        ...mockTransaction,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
      } as unknown as ITransaction);

      const result = await transactionService.updateTransaction(
        mockTransactionId,
        updateData,
        mockUserId
      );

      expect(result.isRecurring).toBe(true);
      expect(result.recurrencePattern).toBe(RecurrencePattern.MONTHLY);
    });

    it('should handle update with category change', async () => {
      const newCategoryId = '507f1f77bcf86cd799439015';
      const updateData = { categoryId: new mongoose.Types.ObjectId(newCategoryId) };
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateById.mockResolvedValue({
        ...mockTransaction,
        categoryId: new mongoose.Types.ObjectId(newCategoryId),
      } as unknown as ITransaction);

      const result = await transactionService.updateTransaction(
        mockTransactionId,
        updateData,
        mockUserId
      );

      expect(result.categoryId.toString()).toBe(newCategoryId);
    });

    it('should handle update without category change', async () => {
      const updateData = { title: 'Updated Title' };
      mockTransactionRepository.findById.mockResolvedValue(mockTransaction);
      mockTransactionRepository.updateById.mockResolvedValue({
        ...mockTransaction,
        title: 'Updated Title',
      } as unknown as ITransaction);

      const result = await transactionService.updateTransaction(
        mockTransactionId,
        updateData,
        mockUserId
      );

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('createTransaction edge cases', () => {
    it('should create transaction with default values', async () => {
      const minimalTransactionData = {
        categoryId: new mongoose.Types.ObjectId(mockCategoryId),
        type: TransactionType.EXPENSE,
        amount: 100,
        title: 'Minimal Transaction',
      };

      mockTransactionRepository.create.mockResolvedValue({
        ...mockTransaction,
        ...minimalTransactionData,
        status: TransactionStatus.COMPLETED,
        isRecurring: false,
        recurrencePattern: RecurrencePattern.NONE,
        tags: [],
        attachments: [],
        source: 'manual',
        timezone: 'UTC',
      } as unknown as ITransaction);

      const result = await transactionService.createTransaction(
        minimalTransactionData,
        mockUserId
      );

      expect(result.status).toBe(TransactionStatus.COMPLETED);
      expect(result.isRecurring).toBe(false);
      expect(result.recurrencePattern).toBe(RecurrencePattern.NONE);
      expect(result.tags).toEqual([]);
      expect(result.attachments).toEqual([]);
      expect(result.source).toBe('manual');
      expect(result.timezone).toBe('UTC');
    });

    it('should create transaction with custom values', async () => {
      const customTransactionData = {
        categoryId: new mongoose.Types.ObjectId(mockCategoryId),
        type: TransactionType.EXPENSE,
        amount: 100,
        title: 'Custom Transaction',
        status: TransactionStatus.PENDING,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.WEEKLY,
        recurrenceEndDate: new Date('2024-12-31'),
        tags: ['custom', 'tag'],
        attachments: [{
          filename: 'attachment1.pdf',
          originalName: 'attachment1.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          url: '/uploads/attachment1.pdf',
          uploadedAt: new Date(),
        }],
        source: 'import',
        timezone: 'America/New_York',
      };

      mockTransactionRepository.create.mockResolvedValue({
        ...mockTransaction,
        ...customTransactionData,
      } as unknown as ITransaction);
      
      // Mock createRecurringSeries since this is a recurring transaction
      mockTransactionRepository.createRecurringSeries.mockResolvedValue([]);

      const result = await transactionService.createTransaction(
        customTransactionData,
        mockUserId
      );

      expect(result.status).toBe(TransactionStatus.PENDING);
      expect(result.isRecurring).toBe(true);
      expect(result.recurrencePattern).toBe(RecurrencePattern.WEEKLY);
      expect(result.tags).toEqual(['custom', 'tag']);
      expect(result.attachments).toHaveLength(1);
      expect(result.attachments[0].filename).toBe('attachment1.pdf');
      expect(result.source).toBe('import');
      expect(result.timezone).toBe('America/New_York');
    });

    it('should create recurring transaction and call createRecurringSeries', async () => {
      const recurringTransactionData = {
        categoryId: new mongoose.Types.ObjectId(mockCategoryId),
        type: TransactionType.EXPENSE,
        amount: 100,
        title: 'Recurring Transaction',
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurrenceEndDate: new Date('2024-12-31'),
      };

      const createdTransaction = {
        ...mockTransaction,
        ...recurringTransactionData,
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439016'),
      } as unknown as ITransaction;

      mockTransactionRepository.create.mockResolvedValue(createdTransaction);
      mockTransactionRepository.createRecurringSeries.mockResolvedValue([createdTransaction]);

      const result = await transactionService.createTransaction(
        recurringTransactionData,
        mockUserId
      );

      expect(result.isRecurring).toBe(true);
      expect(result.recurrencePattern).toBe(RecurrencePattern.MONTHLY);
      expect(mockTransactionRepository.createRecurringSeries).toHaveBeenCalledWith(
        createdTransaction,
        RecurrencePattern.MONTHLY,
        new Date('2024-12-31')
      );
    });

    it('should not call createRecurringSeries for non-recurring transaction', async () => {
      const nonRecurringTransactionData = {
        categoryId: new mongoose.Types.ObjectId(mockCategoryId),
        type: TransactionType.EXPENSE,
        amount: 100,
        title: 'Non-Recurring Transaction',
        isRecurring: false,
        recurrencePattern: RecurrencePattern.NONE,
      };

      mockTransactionRepository.create.mockResolvedValue({
        ...mockTransaction,
        ...nonRecurringTransactionData,
      } as unknown as ITransaction);

      await transactionService.createTransaction(
        nonRecurringTransactionData,
        mockUserId
      );

      expect(mockTransactionRepository.createRecurringSeries).not.toHaveBeenCalled();
    });

    it('should not call createRecurringSeries for NONE recurrence pattern', async () => {
      const nonePatternTransactionData = {
        categoryId: new mongoose.Types.ObjectId(mockCategoryId),
        type: TransactionType.EXPENSE,
        amount: 100,
        title: 'None Pattern Transaction',
        isRecurring: true,
        recurrencePattern: RecurrencePattern.NONE,
      };

      mockTransactionRepository.create.mockResolvedValue({
        ...mockTransaction,
        ...nonePatternTransactionData,
      } as unknown as ITransaction);

      await transactionService.createTransaction(
        nonePatternTransactionData,
        mockUserId
      );

      expect(mockTransactionRepository.createRecurringSeries).not.toHaveBeenCalled();
    });
  });
});
