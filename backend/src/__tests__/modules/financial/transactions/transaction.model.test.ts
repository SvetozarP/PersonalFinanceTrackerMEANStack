import mongoose from 'mongoose';
import { Transaction } from '../../../../modules/financial/transactions/models/transaction.model';
import { ITransaction } from '../../../../modules/financial/transactions/interfaces/transaction.interface';
import { TransactionType, TransactionStatus, PaymentMethod, RecurrencePattern } from '../../../../modules/financial/transactions/interfaces/transaction.interface';

describe('Transaction Model', () => {
  let testTransaction: ITransaction;
  let testUserId: mongoose.Types.ObjectId;
  let testCategoryId: mongoose.Types.ObjectId;
  let testAccountId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    testUserId = new mongoose.Types.ObjectId();
    testCategoryId = new mongoose.Types.ObjectId();
    testAccountId = new mongoose.Types.ObjectId();
  });

  beforeEach(async () => {
    await Transaction.deleteMany({});
  });

  afterAll(async () => {
    await Transaction.deleteMany({});
  });

  describe('Schema Validation', () => {
    it('should create a valid transaction with required fields', async () => {
      const transactionData = {
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
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.title).toBe('Test Transaction');
      expect(savedTransaction.amount).toBe(100.50);
      expect(savedTransaction.currency).toBe('USD');
      expect(savedTransaction.type).toBe(TransactionType.EXPENSE);
      expect(savedTransaction.status).toBe(TransactionStatus.COMPLETED);
      expect(savedTransaction.isRecurring).toBe(false);
      expect(savedTransaction.recurrencePattern).toBe(RecurrencePattern.NONE);
      expect(savedTransaction.isDeleted).toBe(false);
    });

    it('should create a transaction with all optional fields', async () => {
      const transactionData = {
        title: 'Full Transaction',
        description: 'A comprehensive transaction description',
        amount: 250.75,
        currency: 'EUR',
        type: TransactionType.INCOME,
        categoryId: testCategoryId,
        subcategoryId: new mongoose.Types.ObjectId(),
        tags: ['salary', 'monthly'],
        date: new Date(),
        time: '09:00',
        timezone: 'Europe/London',
        location: {
          name: 'Office',
          address: '123 Main St',
          coordinates: { latitude: 51.5074, longitude: -0.1278 },
        },
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        paymentReference: 'REF123456',
        merchantName: 'Company Inc',
        merchantId: 'MERCH001',
        originalAmount: 250.75,
        originalCurrency: 'EUR',
        exchangeRate: 1.0,
        fees: 2.50,
        tax: 25.08,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurrenceInterval: 1,
        recurrenceEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        nextOccurrence: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        attachments: [{
          filename: 'receipt.pdf',
          originalName: 'receipt.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          url: 'https://example.com/receipt.pdf',
          uploadedAt: new Date(),
        }],
        notes: 'Monthly salary payment',
        source: 'api',
        externalId: 'EXT123',
        lastSyncedAt: new Date(),
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.description).toBe('A comprehensive transaction description');
      expect(savedTransaction.subcategoryId).toEqual(transactionData.subcategoryId);
      expect(savedTransaction.tags).toEqual(['salary', 'monthly']);
      expect(savedTransaction.location).toEqual(transactionData.location);
      expect(savedTransaction.paymentReference).toBe('REF123456');
      expect(savedTransaction.merchantName).toBe('Company Inc');
      expect(savedTransaction.originalAmount).toBe(250.75);
      expect(savedTransaction.fees).toBe(2.50);
      expect(savedTransaction.tax).toBe(25.08);
      expect(savedTransaction.isRecurring).toBe(true);
      expect(savedTransaction.recurrencePattern).toBe(RecurrencePattern.MONTHLY);
      expect(savedTransaction.attachments).toHaveLength(1);
      expect(savedTransaction.notes).toBe('Monthly salary payment');
      expect(savedTransaction.source).toBe('api');
      expect(savedTransaction.externalId).toBe('EXT123');
    });

    it('should trim whitespace from text fields', async () => {
      const transactionData = {
        title: '  Trimmed Title  ',
        description: '  Trimmed Description  ',
        amount: 100,
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

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.title).toBe('Trimmed Title');
      expect(savedTransaction.description).toBe('Trimmed Description');
    });

    it('should validate title length constraints', async () => {
      const longTitle = 'A'.repeat(201);

      const longTransaction = new Transaction({
        title: longTitle,
        amount: 100,
        categoryId: new mongoose.Types.ObjectId(),
        userId: new mongoose.Types.ObjectId(),
      });

      await expect(longTransaction.save()).rejects.toThrow();
    });

    it('should validate description length constraints', async () => {
      const longDescription = 'A'.repeat(1001);

      const transaction = new Transaction({
        title: 'Test Transaction',
        description: longDescription,
        amount: 100,
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

      await expect(transaction.save()).rejects.toThrow();
    });

    it('should validate amount constraints', async () => {
      const invalidAmounts = [0, -1, -100.50];

      for (const invalidAmount of invalidAmounts) {
        const transaction = new Transaction({
          title: 'Test Transaction',
          amount: invalidAmount,
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

        await expect(transaction.save()).rejects.toThrow();
      }
    });

    it('should round amount to 2 decimal places', async () => {
      const transactionData = {
        title: 'Decimal Test',
        amount: 100.567,
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

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.amount).toBe(100.57);
    });

    it('should validate currency format', async () => {
      const invalidCurrencies = ['US', 'USDD', ''];

      for (const invalidCurrency of invalidCurrencies) {
        const transaction = new Transaction({
          title: 'Test Transaction',
          amount: 100,
          currency: invalidCurrency,
          type: TransactionType.EXPENSE,
          categoryId: testCategoryId,
          userId: testUserId,
          accountId: testAccountId,
          date: new Date(),
          timezone: 'UTC',
          paymentMethod: PaymentMethod.CASH,
          source: 'manual',
        });

        await expect(transaction.save()).rejects.toThrow();
      }
    });

    it('should validate transaction type enum', async () => {
      const transaction = new Transaction({
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: 'invalid_type' as any,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.CASH,
        source: 'manual',
      });

      await expect(transaction.save()).rejects.toThrow();
    });

    it('should validate transaction status enum', async () => {
      const transaction = new Transaction({
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        status: 'invalid_status' as any,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.CASH,
        source: 'manual',
      });

      await expect(transaction.save()).rejects.toThrow();
    });

    it('should validate payment method enum', async () => {
      const transaction = new Transaction({
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: 'invalid_method' as any,
        source: 'manual',
      });

      await expect(transaction.save()).rejects.toThrow();
    });

    it('should validate source enum', async () => {
      const transaction = new Transaction({
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.CASH,
        source: 'invalid_source',
      });

      await expect(transaction.save()).rejects.toThrow();
    });

    it('should validate recurrence pattern enum', async () => {
      const transaction = new Transaction({
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.CASH,
        source: 'manual',
        isRecurring: true,
        recurrencePattern: 'invalid_pattern' as any,
      });

      await expect(transaction.save()).rejects.toThrow();
    });

    it('should validate recurrence interval constraints', async () => {
      const transaction = new Transaction({
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.CASH,
        source: 'manual',
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurrenceInterval: 0,
      });

      await expect(transaction.save()).rejects.toThrow();
    });

    it('should validate recurrence end date', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday

      const transaction = new Transaction({
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.CASH,
        source: 'manual',
        isRecurring: true,
        recurrenceEndDate: pastDate,
      });

      await expect(transaction.save()).rejects.toThrow();
    });

    it('should validate attachment fields', async () => {
      const invalidAttachment = {
        filename: '',
        originalName: '',
        mimeType: '',
        size: -1,
        url: '',
        uploadedAt: new Date(),
      };

      const transaction = new Transaction({
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.CASH,
        source: 'manual',
        attachments: [invalidAttachment],
      });

      await expect(transaction.save()).rejects.toThrow();
    });

    it('should validate notes length constraints', async () => {
      const longNotes = 'A'.repeat(2001);

      const transaction = new Transaction({
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: testCategoryId,
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.CASH,
        source: 'manual',
        notes: longNotes,
      });

      await expect(transaction.save()).rejects.toThrow();
    });
  });

  describe('Indexes and Constraints', () => {
    it('should enforce required fields', async () => {
      const transactionWithoutTitle = new Transaction({
        amount: 100,
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

      await expect(transactionWithoutTitle.save()).rejects.toThrow();
    });

    it('should validate ObjectId references', async () => {
      const transaction = new Transaction({
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: 'invalid-object-id',
        userId: testUserId,
        accountId: testAccountId,
        date: new Date(),
        timezone: 'UTC',
        paymentMethod: PaymentMethod.CASH,
        source: 'manual',
      });

      await expect(transaction.save()).rejects.toThrow();
    });
  });

  describe('Virtuals', () => {
    it('should include virtuals in toJSON', async () => {
      const transaction = new Transaction({
        title: 'Virtual Test',
        amount: 100,
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

      const savedTransaction = await transaction.save();
      const jsonTransaction = savedTransaction.toJSON();

      expect(jsonTransaction._id).toBeDefined();
      expect(jsonTransaction.title).toBe('Virtual Test');
    });

    it('should include virtuals in toObject', async () => {
      const transaction = new Transaction({
        title: 'Virtual Test',
        amount: 100,
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

      const savedTransaction = await transaction.save();
      const objectTransaction = savedTransaction.toObject();

      expect(objectTransaction._id).toBeDefined();
      expect(objectTransaction.title).toBe('Virtual Test');
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const transaction = new Transaction({
        title: 'Timestamp Test',
        amount: 100,
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

      const savedTransaction = await transaction.save();
      
      expect(savedTransaction.createdAt).toBeDefined();
      expect(savedTransaction.updatedAt).toBeDefined();
      expect(savedTransaction.createdAt).toBeInstanceOf(Date);
      expect(savedTransaction.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when document is modified', async () => {
      const transaction = new Transaction({
        title: 'Update Test',
        amount: 100,
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

      const savedTransaction = await transaction.save();
      const originalUpdatedAt = savedTransaction.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      savedTransaction.title = 'Updated Title';
      const updatedTransaction = await savedTransaction.save();

      expect(updatedTransaction.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Text Search', () => {
    it('should create text index for searchable fields', async () => {
      const transaction = new Transaction({
        title: 'Searchable Transaction',
        description: 'This is a searchable description',
        amount: 100,
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

      const savedTransaction = await transaction.save();
      expect(savedTransaction._id).toBeDefined();
    });
  });
});
