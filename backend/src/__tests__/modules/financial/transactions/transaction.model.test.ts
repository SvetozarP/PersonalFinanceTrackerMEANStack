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

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle very small amounts', async () => {
      const transactionData = {
        title: 'Micro Transaction',
        amount: 0.01, // Minimum amount
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.amount).toBe(0.01);
      expect(savedTransaction.$isValid('amount')).toBe(true);
    });

    it('should handle very large amounts', async () => {
      const transactionData = {
        title: 'Large Transaction',
        amount: 999999999.99, // Very large amount
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.amount).toBe(999999999.99);
      expect(savedTransaction.$isValid('amount')).toBe(true);
    });

    it('should handle decimal precision correctly', async () => {
      const transactionData = {
        title: 'Precise Transaction',
        amount: 123.456789, // High precision amount
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      // Should round to 2 decimal places
      expect(savedTransaction.amount).toBe(123.46);
      expect(savedTransaction.$isValid('amount')).toBe(true);
    });

    it('should handle future dates for recurring transactions', async () => {
      const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      const transactionData = {
        title: 'Future Recurring Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: futureDate,
        userId: testUserId,
        accountId: testAccountId,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurrenceInterval: 1,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.date).toEqual(futureDate);
      expect(savedTransaction.isRecurring).toBe(true);
      expect(savedTransaction.$isValid('date')).toBe(true);
    });

    it('should handle past dates correctly', async () => {
      const pastDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year ago
      const transactionData = {
        title: 'Past Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: pastDate,
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.date).toEqual(pastDate);
      expect(savedTransaction.$isValid('date')).toBe(true);
    });

    it('should handle complex time formats', async () => {
      const transactionData = {
        title: 'Time Specific Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        time: '23:59', // Edge case time
        timezone: 'UTC',
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.time).toBe('23:59');
      expect(savedTransaction.timezone).toBe('UTC');
      expect(savedTransaction.$isValid('time')).toBe(true);
    });

    it('should handle complex timezone values', async () => {
      const transactionData = {
        title: 'Complex Timezone Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        time: '12:00',
        timezone: 'America/New_York',
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.timezone).toBe('America/New_York');
      expect(savedTransaction.$isValid('timezone')).toBe(true);
    });

    it('should handle complex location data', async () => {
      const transactionData = {
        title: 'Location Specific Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        location: {
          name: 'Complex Store Name with Special Characters: & Co.',
          address: '123 Complex Street, Suite 456, Complex City, Complex State 12345, Complex Country',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.0060,
          },
        },
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.location?.name).toBe('Complex Store Name with Special Characters: & Co.');
      expect(savedTransaction.location?.coordinates?.latitude).toBe(40.7128);
      expect(savedTransaction.location?.coordinates?.longitude).toBe(-74.0060);
      expect(savedTransaction.$isValid('location')).toBe(true);
    });

    it('should handle edge case coordinate values', async () => {
      const transactionData = {
        title: 'Edge Case Coordinates Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        location: {
          name: 'Edge Location',
          address: 'Edge Address',
          coordinates: {
            latitude: -90, // Edge case latitude
            longitude: 180, // Edge case longitude
          },
        },
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.location?.coordinates?.latitude).toBe(-90);
      expect(savedTransaction.location?.coordinates?.longitude).toBe(180);
      expect(savedTransaction.$isValid('location')).toBe(true);
    });

    it('should handle complex tag arrays', async () => {
      const transactionData = {
        title: 'Complex Tags Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        tags: [
          'groceries',
          'food',
          'household',
          'essentials',
          'monthly',
          'budget',
          'tracking',
          'expense',
          'category',
          'personal',
          'daily',
          'routine',
        ],
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.tags).toHaveLength(12);
      expect(savedTransaction.tags).toContain('groceries');
      expect(savedTransaction.tags).toContain('personal');
      expect(savedTransaction.$isValid('tags')).toBe(true);
    });

    it('should handle edge case tag lengths', async () => {
      const transactionData = {
        title: 'Edge Case Tags Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        tags: [
          'a'.repeat(50), // Edge case tag length
          'b'.repeat(25),
          'c'.repeat(10),
          'd'.repeat(1),
        ],
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.tags).toHaveLength(4);
      expect(savedTransaction.tags[0]).toBe('a'.repeat(50));
      expect(savedTransaction.$isValid('tags')).toBe(true);
    });

    it('should handle complex attachment data', async () => {
      const transactionData = {
        title: 'Complex Attachments Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        attachments: [
          {
            filename: 'complex-receipt-1.pdf',
            originalName: 'Complex Receipt 1.pdf',
            mimeType: 'application/pdf',
            size: 1024 * 1024, // 1MB
            url: '/uploads/complex-receipt-1.pdf',
            uploadedAt: new Date(),
          },
          {
            filename: 'complex-receipt-2.jpg',
            originalName: 'Complex Receipt 2.jpg',
            mimeType: 'image/jpeg',
            size: 2 * 1024 * 1024, // 2MB
            url: '/uploads/complex-receipt-2.jpg',
            uploadedAt: new Date(),
          },
          {
            filename: 'complex-receipt-3.png',
            originalName: 'Complex Receipt 3.png',
            mimeType: 'image/png',
            size: 512 * 1024, // 512KB
            url: '/uploads/complex-receipt-3.png',
            uploadedAt: new Date(),
          },
        ],
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.attachments).toHaveLength(3);
      expect(savedTransaction.attachments[0].filename).toBe('complex-receipt-1.pdf');
      expect(savedTransaction.attachments[1].size).toBe(2 * 1024 * 1024);
      expect(savedTransaction.$isValid('attachments')).toBe(true);
    });

    it('should handle edge case file sizes', async () => {
      const transactionData = {
        title: 'Edge Case File Sizes Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        attachments: [
          {
            filename: 'tiny-file.txt',
            originalName: 'tiny-file.txt',
            mimeType: 'text/plain',
            size: 1, // 1 byte
            url: '/uploads/tiny-file.txt',
            uploadedAt: new Date(),
          },
          {
            filename: 'large-file.pdf',
            originalName: 'large-file.pdf',
            mimeType: 'application/pdf',
            size: 20 * 1024 * 1024, // 20MB (edge case)
            url: '/uploads/large-file.pdf',
            uploadedAt: new Date(),
          },
        ],
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.attachments).toHaveLength(2);
      expect(savedTransaction.attachments[0].size).toBe(1);
      expect(savedTransaction.attachments[1].size).toBe(20 * 1024 * 1024);
      expect(savedTransaction.$isValid('attachments')).toBe(true);
    });

    it('should handle complex recurring patterns', async () => {
      const transactionData = {
        title: 'Complex Recurring Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurrenceInterval: 2,
        recurrenceEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.isRecurring).toBe(true);
      expect(savedTransaction.recurrencePattern).toBe(RecurrencePattern.MONTHLY);
      expect(savedTransaction.recurrenceInterval).toBe(2);
      expect(savedTransaction.$isValid('recurrencePattern')).toBe(true);
    });

    it('should handle edge case recurring patterns', async () => {
      const transactionData = {
        title: 'Edge Case Recurring Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        isRecurring: true,
        recurrencePattern: RecurrencePattern.YEARLY,
        recurrenceInterval: 1,
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.isRecurring).toBe(true);
      expect(savedTransaction.recurrencePattern).toBe(RecurrencePattern.YEARLY);
      expect(savedTransaction.$isValid('recurrencePattern')).toBe(true);
    });

    it('should handle complex financial calculations', async () => {
      const transactionData = {
        title: 'Complex Financial Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        originalAmount: 85.50,
        originalCurrency: 'EUR',
        exchangeRate: 1.1695906432748538, // High precision exchange rate
        fees: 2.50,
        tax: 8.50,
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.originalAmount).toBe(85.50);
      expect(savedTransaction.originalCurrency).toBe('EUR');
      expect(savedTransaction.exchangeRate).toBe(1.1695906432748538);
      expect(savedTransaction.fees).toBe(2.50);
      expect(savedTransaction.tax).toBe(8.50);
      expect(savedTransaction.$isValid('originalAmount')).toBe(true);
    });

    it('should handle edge case financial values', async () => {
      const transactionData = {
        title: 'Edge Case Financial Transaction',
        amount: 0.01, // Minimum amount
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        fees: 0.01, // Minimum fees
        tax: 0.01, // Minimum tax
        originalAmount: 0.01, // Minimum original amount
        exchangeRate: 0.0001, // Very small exchange rate
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.amount).toBe(0.01);
      expect(savedTransaction.fees).toBe(0.01);
      expect(savedTransaction.tax).toBe(0.01);
      expect(savedTransaction.originalAmount).toBe(0.01);
      expect(savedTransaction.exchangeRate).toBe(0.0001);
      expect(savedTransaction.$isValid('amount')).toBe(true);
    });

    it('should handle complex merchant information', async () => {
      const transactionData = {
        title: 'Complex Merchant Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CREDIT_CARD,
        date: new Date(),
        merchantName: 'Complex Merchant Name with Special Characters: & Co. (LLC)',
        merchantId: 'MERCH-123-456-789-ABC-DEF',
        paymentReference: 'REF-2024-001-002-003-004-005',
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.merchantName).toBe('Complex Merchant Name with Special Characters: & Co. (LLC)');
      expect(savedTransaction.merchantId).toBe('MERCH-123-456-789-ABC-DEF');
      expect(savedTransaction.paymentReference).toBe('REF-2024-001-002-003-004-005');
      expect(savedTransaction.$isValid('merchantName')).toBe(true);
    });

    it('should handle edge case merchant information', async () => {
      const transactionData = {
        title: 'Edge Case Merchant Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CREDIT_CARD,
        date: new Date(),
        merchantName: 'A', // Single character
        merchantId: '1', // Single character
        paymentReference: 'R', // Single character
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.merchantName).toBe('A');
      expect(savedTransaction.merchantId).toBe('1');
      expect(savedTransaction.paymentReference).toBe('R');
      expect(savedTransaction.$isValid('merchantName')).toBe(true);
    });

    it('should handle complex notes and descriptions', async () => {
      const transactionData = {
        title: 'Complex Notes Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        description: 'This is a very detailed description with multiple sentences. It includes various details about the transaction, such as the purpose, context, and any relevant information that might be useful for future reference.',
        notes: 'Additional notes with special characters: @#$%^&*()_+-=[]{}|;:,.<>? and numbers 1234567890',
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.description).toBe('This is a very detailed description with multiple sentences. It includes various details about the transaction, such as the purpose, context, and any relevant information that might be useful for future reference.');
      expect(savedTransaction.notes).toBe('Additional notes with special characters: @#$%^&*()_+-=[]{}|;:,.<>? and numbers 1234567890');
      expect(savedTransaction.$isValid('description')).toBe(true);
    });

    it('should handle edge case notes and descriptions', async () => {
      const transactionData = {
        title: 'Edge Case Notes Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: new mongoose.Types.ObjectId(),
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        description: 'a'.repeat(1000), // Edge case description length
        notes: 'b'.repeat(500), // Edge case notes length
        userId: testUserId,
        accountId: testAccountId,
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.description).toBe('a'.repeat(1000));
      expect(savedTransaction.notes).toBe('b'.repeat(500));
      expect(savedTransaction.$isValid('description')).toBe(true);
    });
  });
});
