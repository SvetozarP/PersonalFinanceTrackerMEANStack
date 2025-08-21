import mongoose from 'mongoose';
import { TransactionRepository } from '../../../../modules/financial/transactions/repositories/transaction.repository';
import { Transaction } from '../../../../modules/financial/transactions/models/transaction.model';
import { ITransaction } from '../../../../modules/financial/transactions/interfaces/transaction.interface';
import { TransactionType, TransactionStatus, PaymentMethod } from '../../../../modules/financial/transactions/interfaces/transaction.interface';

describe('Transaction Repository', () => {
  let transactionRepository: TransactionRepository;
  let testUserId: mongoose.Types.ObjectId;
  let testCategoryId: mongoose.Types.ObjectId;
  let testAccountId: mongoose.Types.ObjectId;
  let testTransaction: any;

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId();
    testCategoryId = new mongoose.Types.ObjectId();
    testAccountId = new mongoose.Types.ObjectId();
  });

  beforeEach(async () => {
    await Transaction.deleteMany({});
    transactionRepository = new TransactionRepository();
    
    // Create a test transaction
    testTransaction = await Transaction.create({
      title: 'Test Transaction',
      amount: 100.50,
      currency: 'USD',
      type: TransactionType.EXPENSE,
      categoryId: testCategoryId,
      userId: testUserId,
      accountId: testAccountId,
      date: new Date(),
      timezone: 'UTC',
      paymentMethod: PaymentMethod.CASH,
      source: 'manual',
    });
  });

  afterAll(async () => {
    await Transaction.deleteMany({});
  });

  describe('findByUserId', () => {
    it('should find transactions by user ID', async () => {
      const transactions = await transactionRepository.findByUserId(testUserId.toString(), { populate: [] });

      expect(transactions.transactions).toHaveLength(1);
      expect(transactions.transactions[0].title).toBe('Test Transaction');
      expect(transactions.transactions[0].userId).toEqual(testUserId);
    });

    it('should return empty array for non-existent user', async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId();
      const transactions = await transactionRepository.findByUserId(nonExistentUserId.toString(), { populate: [] });

      expect(transactions.transactions).toHaveLength(0);
    });

    it('should only return non-deleted transactions', async () => {
      // Create a deleted transaction
      await Transaction.create({
        title: 'Deleted Transaction',
        amount: 50,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.CASH,
        source: 'manual',
        isDeleted: true,
      });

      const transactions = await transactionRepository.findByUserId(testUserId.toString(), { populate: [] });

      expect(transactions.transactions).toHaveLength(1);
      expect(transactions.transactions[0].title).toBe('Test Transaction');
    });

    it('should apply filters correctly', async () => {
      // Create additional transactions
      await Transaction.create({
        title: 'Income Transaction',
        amount: 500,
        currency: 'USD',
        type: TransactionType.INCOME,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        source: 'manual',
      });

      const expenseTransactions = await transactionRepository.findByUserId(
        testUserId.toString(),
        { filter: { type: TransactionType.EXPENSE }, populate: [] }
      );

      expect(expenseTransactions.transactions).toHaveLength(1);
      expect(expenseTransactions.transactions[0].type).toBe(TransactionType.EXPENSE);
    });

    it('should apply sorting correctly', async () => {
      // Create additional transactions with different amounts
      await Transaction.create({
        title: 'Small Transaction',
        amount: 25,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.CASH,
        source: 'manual',
      });

      const transactions = await transactionRepository.findByUserId(
        testUserId.toString(),
        { sort: { amount: -1 }, populate: [] }
      );

      expect(transactions.transactions).toHaveLength(2);
      expect(transactions.transactions[0].amount).toBe(100.50);
      expect(transactions.transactions[1].amount).toBe(25);
    });

    it('should apply pagination correctly', async () => {
      // Create additional transactions
      for (let i = 0; i < 5; i++) {
        await Transaction.create({
          title: `Transaction ${i}`,
          amount: 100 + i,
          currency: 'USD',
          type: TransactionType.EXPENSE,
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: testAccountId,
          date: new Date(),
          timezone: 'UTC',
          paymentMethod: PaymentMethod.CASH,
          source: 'manual',
        });
      }

      const transactions = await transactionRepository.findByUserId(
        testUserId.toString(),
        { limit: 3, page: 1, populate: [] }
      );

      expect(transactions.transactions).toHaveLength(3);
    });
  });



  describe('findByDateRange', () => {
    it('should find transactions within date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

      const transactions = await transactionRepository.findByDateRange(
        testUserId.toString(),
        startDate,
        endDate
      );

      expect(transactions).toHaveLength(1);
      expect(transactions[0].title).toBe('Test Transaction');
    });

    it('should return empty array for transactions outside date range', async () => {
      const futureStartDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Next year
      const futureEndDate = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000);

      const transactions = await transactionRepository.findByDateRange(
        testUserId.toString(),
        futureStartDate,
        futureEndDate
      );

      expect(transactions).toHaveLength(0);
    });
  });



  describe('getTransactionStats', () => {
    it('should get transaction statistics', async () => {
      // Create additional transactions for better stats
      await Transaction.create({
        title: 'Income Transaction',
        amount: 500,
        currency: 'USD',
        type: TransactionType.INCOME,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        source: 'manual',
      });

      const stats = await transactionRepository.getTransactionStats(testUserId.toString(), { groupBy: 'type' });

      expect(stats).toHaveLength(2); // Should have income and expense types
      const incomeStat = stats.find((s: any) => s._id === 'income');
      const expenseStat = stats.find((s: any) => s._id === 'expense');
      expect(incomeStat?.count).toBe(1);
      expect(expenseStat?.count).toBe(1);
      expect(incomeStat?.totalAmount).toBe(500);
      expect(expenseStat?.totalAmount).toBe(100.50);
    });

    it('should handle empty transaction data', async () => {
      const otherUserId = new mongoose.Types.ObjectId();
      const stats = await transactionRepository.getTransactionStats(otherUserId.toString(), { groupBy: 'type' });

      expect(stats).toHaveLength(0); // No transactions for this user
    });
  });

  describe('searchTransactions', () => {
    it('should search transactions by text', async () => {
      const searchResults = await transactionRepository.searchTransactions(
        testUserId.toString(),
        'Test'
      );

      expect(searchResults.transactions).toHaveLength(1);
      expect(searchResults.transactions[0].title).toBe('Test Transaction');
    });

    it('should search in description and tags', async () => {
      // Create transaction with description and tags
      await Transaction.create({
        title: 'Searchable Transaction',
        description: 'This is a searchable description',
        amount: 150,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.CASH,
        source: 'manual',
        tags: ['searchable', 'test'],
      });

      const searchResults = await transactionRepository.searchTransactions(
        testUserId.toString(),
        'searchable'
      );

      expect(searchResults.transactions).toHaveLength(1);
      expect(searchResults.transactions[0].title).toBe('Searchable Transaction');
    });

    it('should return empty array for no search matches', async () => {
      const searchResults = await transactionRepository.searchTransactions(
        testUserId.toString(),
        'NonExistentText'
      );

      expect(searchResults.transactions).toHaveLength(0);
    });
  });

  describe('Inherited Base Repository Methods', () => {
    describe('findById', () => {
      it('should find transaction by ID', async () => {
        const foundTransaction = await transactionRepository.findById(testTransaction._id.toString());

        expect(foundTransaction).toBeDefined();
        expect(foundTransaction?.title).toBe('Test Transaction');
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const foundTransaction = await transactionRepository.findById(nonExistentId.toString());

        expect(foundTransaction).toBeNull();
      });
    });

    describe('create', () => {
      it('should create a new transaction', async () => {
        const newTransactionData = {
          title: 'New Transaction',
          amount: 200,
          currency: 'USD',
          type: TransactionType.EXPENSE,
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: testAccountId,
          date: new Date(),
          timezone: 'UTC',
          paymentMethod: PaymentMethod.CASH,
          source: 'manual',
        };

        const newTransaction = await transactionRepository.create(newTransactionData);

        expect(newTransaction.title).toBe('New Transaction');
        expect(newTransaction.amount).toBe(200);
        expect(newTransaction._id).toBeDefined();
      });
    });

    describe('updateById', () => {
      it('should update transaction by ID', async () => {
        const updateData = { amount: 150.75 };
        const updatedTransaction = await transactionRepository.updateById(
          testTransaction._id.toString(),
          updateData
        );

        expect(updatedTransaction).toBeDefined();
        expect(updatedTransaction?.amount).toBe(150.75);
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const updatedTransaction = await transactionRepository.updateById(
          nonExistentId.toString(),
          { amount: 200 }
        );

        expect(updatedTransaction).toBeNull();
      });
    });

    describe('deleteById', () => {
      it('should delete transaction by ID', async () => {
        const deletedTransaction = await transactionRepository.deleteById(testTransaction._id.toString());

        expect(deletedTransaction).toBeDefined();
        expect(deletedTransaction?.title).toBe('Test Transaction');

        // Verify it's deleted
        const foundTransaction = await Transaction.findById(testTransaction._id);
        expect(foundTransaction).toBeNull();
      });

      it('should return null for non-existent ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const deletedTransaction = await transactionRepository.deleteById(nonExistentId.toString());

        expect(deletedTransaction).toBeNull();
      });
    });

    describe('find', () => {
      it('should find transactions with filter', async () => {
        const transactions = await transactionRepository.find({ type: TransactionType.EXPENSE });

        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionType.EXPENSE);
      });

      it('should return empty array for no matches', async () => {
        const transactions = await transactionRepository.find({ type: TransactionType.INCOME });

        expect(transactions).toHaveLength(0);
      });
    });

    describe('findOne', () => {
      it('should find one transaction with filter', async () => {
        const transaction = await transactionRepository.findOne({ title: 'Test Transaction' });

        expect(transaction).toBeDefined();
        expect(transaction?.title).toBe('Test Transaction');
      });

      it('should return null for no matches', async () => {
        const transaction = await transactionRepository.findOne({ title: 'Non-existent' });

        expect(transaction).toBeNull();
      });
    });

    describe('count', () => {
      it('should count transactions with filter', async () => {
        const count = await transactionRepository.count({ type: TransactionType.EXPENSE });

        expect(count).toBe(1);
      });

      it('should return 0 for no matches', async () => {
        const count = await transactionRepository.count({ type: TransactionType.INCOME });

        expect(count).toBe(0);
      });
    });

    describe('exists', () => {
      it('should return true for existing transaction', async () => {
        const exists = await transactionRepository.exists({ _id: testTransaction._id });

        expect(exists).toBe(true);
      });

      it('should return false for non-existent transaction', async () => {
        const nonExistentId = new mongoose.Types.ObjectId();
        const exists = await transactionRepository.exists({ _id: nonExistentId });

        expect(exists).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Mock a database error by mocking the repository's model
      const originalFind = transactionRepository['model'].find;
      const mockFind = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      });
      transactionRepository['model'].find = mockFind;

      // Mock the countDocuments method to throw an error
      const originalCount = transactionRepository['model'].countDocuments;
      transactionRepository['model'].countDocuments = jest.fn().mockRejectedValue(new Error('Connection failed'));

      await expect(transactionRepository.findByUserId(testUserId.toString(), { populate: [] })).rejects.toThrow('Connection failed');
      
      // Restore the original methods
      transactionRepository['model'].find = originalFind;
      transactionRepository['model'].countDocuments = originalCount;
    });

    it('should handle validation errors gracefully', async () => {
      // Test with invalid data that will cause validation to fail
      const invalidData = { title: 'Invalid' } as any;
      
      await expect(transactionRepository.create(invalidData)).rejects.toThrow();
    });
  });
});
