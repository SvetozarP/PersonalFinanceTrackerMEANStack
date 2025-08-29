import { transactionValidation } from '../../../../modules/financial/transactions/validators/transaction.validation';
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  RecurrencePattern,
} from '../../../../modules/financial/transactions/interfaces/transaction.interface';

describe('Transaction Validation', () => {
  describe('create schema', () => {
    const validTransactionData = {
      title: 'Test Transaction',
      amount: 100.5,
      currency: 'GBP',
      type: TransactionType.EXPENSE,
      categoryId: '507f1f77bcf86cd799439011',
      paymentMethod: PaymentMethod.CASH,
      date: new Date('2024-01-15'),
    };

    it('should validate valid transaction creation data', () => {
      const { error, value } =
        transactionValidation.create.validate(validTransactionData);

      expect(error).toBeUndefined();
      expect(value.title).toBe('Test Transaction');
      expect(value.amount).toBe(100.5);
      expect(value.currency).toBe('GBP');
      expect(value.type).toBe(TransactionType.EXPENSE);
    });

    it('should apply default values', () => {
      const minimalData = {
        title: 'Test Transaction',
        amount: 100,
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
      };

      const { error, value } =
        transactionValidation.create.validate(minimalData);

      expect(error).toBeUndefined();
      expect(value.currency).toBe('GBP'); // default
      expect(value.status).toBe(TransactionStatus.COMPLETED); // default
      expect(value.source).toBe('manual'); // default
      expect(value.timezone).toBe('Europe/London'); // default
      expect(value.isRecurring).toBe(false); // default
      expect(value.fees).toBe(0); // default
      expect(value.tax).toBe(0); // default
      expect(value.tags).toEqual([]); // default
      expect(value.attachments).toEqual([]); // default
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        amount: 100,
        type: TransactionType.EXPENSE,
      };

      const { error } = transactionValidation.create.validate(invalidData, {
        abortEarly: false,
      });

      expect(error).toBeDefined();
      expect(error?.details.some(d => d.path.includes('title'))).toBe(true);
      expect(error?.details.some(d => d.path.includes('categoryId'))).toBe(
        true
      );
      expect(error?.details.some(d => d.path.includes('paymentMethod'))).toBe(
        true
      );
    });

    it('should reject empty title', () => {
      const invalidData = {
        ...validTransactionData,
        title: '',
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Transaction title cannot be empty'
      );
    });

    it('should reject title that is too long', () => {
      const invalidData = {
        ...validTransactionData,
        title: 'a'.repeat(201),
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Transaction title must be less than 200 characters'
      );
    });

    it('should reject negative amount', () => {
      const invalidData = {
        ...validTransactionData,
        amount: -100,
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Transaction amount must be at least 0.01'
      );
    });

    it('should reject zero amount', () => {
      const invalidData = {
        ...validTransactionData,
        amount: 0,
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Transaction amount must be at least 0.01'
      );
    });

    it('should reject invalid currency format', () => {
      const invalidData = {
        ...validTransactionData,
        currency: 'INVALID',
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Currency must be a valid 3-letter ISO code (e.g. GBP, USD, EUR)'
      );
    });

    it('should accept valid currency codes', () => {
      const validCurrencies = ['GBP', 'USD', 'EUR', 'JPY', 'CAD'];

      validCurrencies.forEach(currency => {
        const data = {
          ...validTransactionData,
          currency,
        };

        const { error } = transactionValidation.create.validate(data);
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid transaction type', () => {
      const invalidData = {
        ...validTransactionData,
        type: 'invalid_type',
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Transaction type must be one of: income, expense, transfer, adjustment'
      );
    });

    it('should validate all transaction types', () => {
      Object.values(TransactionType).forEach(type => {
        const data = {
          ...validTransactionData,
          type,
        };

        const { error } = transactionValidation.create.validate(data);
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid transaction status', () => {
      const invalidData = {
        ...validTransactionData,
        status: 'invalid_status',
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Invalid transaction status');
    });

    it('should validate all transaction statuses', () => {
      Object.values(TransactionStatus).forEach(status => {
        const data = {
          ...validTransactionData,
          status,
        };

        const { error } = transactionValidation.create.validate(data);
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid categoryId format', () => {
      const invalidData = {
        ...validTransactionData,
        categoryId: 'invalid-id',
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Invalid category ID');
    });

    it('should accept valid subcategoryId', () => {
      const validData = {
        ...validTransactionData,
        subcategoryId: '507f1f77bcf86cd799439012',
      };

      const { error } = transactionValidation.create.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject invalid subcategoryId format', () => {
      const invalidData = {
        ...validTransactionData,
        subcategoryId: 'invalid-id',
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Invalid subcategory ID');
    });

    it('should validate tags array', () => {
      const validData = {
        ...validTransactionData,
        tags: ['shopping', 'groceries', 'food'],
      };

      const { error } = transactionValidation.create.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject too many tags', () => {
      const invalidData = {
        ...validTransactionData,
        tags: Array(21).fill('tag'), // 21 tags, max is 20
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Maximum of 20 tags allowed');
    });

    it('should reject tags that are too long', () => {
      const invalidData = {
        ...validTransactionData,
        tags: ['a'.repeat(51)], // max tag length is 50
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Tag must be less than 50 characters'
      );
    });

    it('should accept future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const validData = {
        ...validTransactionData,
        date: futureDate,
      };

      const { error } = transactionValidation.create.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should validate time format', () => {
      const validTimes = ['09:30', '15:45', '00:00', '23:59'];

      validTimes.forEach(time => {
        const data = {
          ...validTransactionData,
          time,
        };

        const { error } = transactionValidation.create.validate(data);
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid time format', () => {
      const invalidTimes = ['25:00', '12:60', 'invalid', '24:00'];

      invalidTimes.forEach(time => {
        const data = {
          ...validTransactionData,
          time,
        };

        const { error } = transactionValidation.create.validate(data);
        expect(error).toBeDefined();
      });
    });

    it('should validate location object', () => {
      const validData = {
        ...validTransactionData,
        location: {
          name: 'Test Store',
          address: '123 Test Street, Test City',
          coordinates: {
            latitude: 51.5074,
            longitude: -0.1278,
          },
        },
      };

      const { error } = transactionValidation.create.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject invalid coordinates', () => {
      const invalidData = {
        ...validTransactionData,
        location: {
          coordinates: {
            latitude: 91, // invalid latitude
            longitude: -0.1278,
          },
        },
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Latitude must be between -90 and 90'
      );
    });

    it('should validate all payment methods', () => {
      Object.values(PaymentMethod).forEach(paymentMethod => {
        const data = {
          ...validTransactionData,
          paymentMethod,
        };

        const { error } = transactionValidation.create.validate(data);
        expect(error).toBeUndefined();
      });
    });

    it('should reject invalid payment method', () => {
      const invalidData = {
        ...validTransactionData,
        paymentMethod: 'invalid_method',
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Invalid payment method');
    });

    it('should validate original currency fields together', () => {
      const validData = {
        ...validTransactionData,
        originalAmount: 120.0,
        originalCurrency: 'USD',
        exchangeRate: 0.8333,
      };

      const { error } = transactionValidation.create.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should require exchange rate when original currency is provided', () => {
      const invalidData = {
        ...validTransactionData,
        originalAmount: 120.0,
        originalCurrency: 'USD',
        // exchangeRate missing
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Exchange rate is required when original currency is provided'
      );
    });

    it('should validate recurring transaction fields', () => {
      const validData = {
        ...validTransactionData,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurrenceInterval: 1,
        recurrenceEndDate: new Date('2024-12-31'),
        nextOccurrence: new Date('2024-02-15'),
      };

      const { error } = transactionValidation.create.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should require recurrence fields when isRecurring is true', () => {
      const invalidData = {
        ...validTransactionData,
        isRecurring: true,
        // missing recurrence fields
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(
        error?.details.some(d =>
          d.message.includes('Recurrence pattern is required')
        )
      ).toBe(true);
    });

    it('should validate attachments array', () => {
      const validData = {
        ...validTransactionData,
        attachments: [
          {
            filename: 'receipt.jpg',
            originalName: 'IMG_001.jpg',
            mimeType: 'image/jpeg',
            size: 1024000,
            url: 'https://example.com/receipt.jpg',
          },
        ],
      };

      const { error } = transactionValidation.create.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should reject too many attachments', () => {
      const invalidData = {
        ...validTransactionData,
        attachments: Array(11).fill({
          filename: 'file.jpg',
          originalName: 'file.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          url: 'https://example.com/file.jpg',
        }),
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Maximum of 10 attachments allowed'
      );
    });

    it('should reject files that are too large', () => {
      const invalidData = {
        ...validTransactionData,
        attachments: [
          {
            filename: 'large_file.pdf',
            originalName: 'large_file.pdf',
            mimeType: 'application/pdf',
            size: 51 * 1024 * 1024, // 51MB, max is 50MB
            url: 'https://example.com/large_file.pdf',
          },
        ],
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'File size must be less than 50MB'
      );
    });

    it('should trim whitespace from string fields', () => {
      const dataWithWhitespace = {
        ...validTransactionData,
        title: '  Test Transaction  ',
        description: '  Test Description  ',
        notes: '  Test Notes  ',
      };

      const { error, value } =
        transactionValidation.create.validate(dataWithWhitespace);

      expect(error).toBeUndefined();
      expect(value.title).toBe('Test Transaction');
      expect(value.description).toBe('Test Description');
      expect(value.notes).toBe('Test Notes');
    });
  });

  describe('update schema', () => {
    const validUpdateData = {
      title: 'Updated Transaction',
      amount: 150.75,
      description: 'Updated description',
    };

    it('should validate partial update data', () => {
      const { error } = transactionValidation.update.validate(validUpdateData);

      expect(error).toBeUndefined();
    });

    it('should validate empty update data', () => {
      const { error } = transactionValidation.update.validate({});

      expect(error).toBeUndefined();
    });

    it('should apply same validation rules as create', () => {
      const invalidData = {
        amount: -100, // negative amount
        title: '', // empty title
      };

      const { error } = transactionValidation.update.validate(invalidData, {
        abortEarly: false,
      });

      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('positive'))).toBe(
        true
      );
      expect(error?.details.some(d => d.message.includes('empty'))).toBe(true);
    });
  });

  describe('bulk schema', () => {
    const validBulkData = {
      transactions: [
        {
          title: 'Transaction 1',
          amount: 100,
          type: TransactionType.EXPENSE,
          categoryId: '507f1f77bcf86cd799439011',
          paymentMethod: PaymentMethod.CASH,
        },
        {
          title: 'Transaction 2',
          amount: 200,
          type: TransactionType.INCOME,
          categoryId: '507f1f77bcf86cd799439012',
          paymentMethod: PaymentMethod.BANK_TRANSFER,
        },
      ],
    };

    it('should validate valid bulk transaction data', () => {
      const { error } = transactionValidation.bulk.validate(validBulkData);

      expect(error).toBeUndefined();
    });

    it('should reject empty transactions array', () => {
      const invalidData = {
        transactions: [],
      };

      const { error } = transactionValidation.bulk.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'At least one transaction is required'
      );
    });

    it('should reject missing transactions array', () => {
      const invalidData = {};

      const { error } = transactionValidation.bulk.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'At least one transaction is required'
      );
    });

    it('should reject too many transactions', () => {
      const invalidData = {
        transactions: Array(101).fill({
          title: 'Transaction',
          amount: 100,
          type: TransactionType.EXPENSE,
          categoryId: '507f1f77bcf86cd799439011',
          paymentMethod: PaymentMethod.CASH,
        }),
      };

      const { error } = transactionValidation.bulk.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Maximum of 100 transactions allowed'
      );
    });
  });

  describe('query schema', () => {
    it('should validate empty query parameters', () => {
      const { error, value } = transactionValidation.query.validate({});

      expect(error).toBeUndefined();
      expect(value.page).toBe(1); // default
      expect(value.limit).toBe(20); // default
      expect(value.sortBy).toBe('date'); // default
      expect(value.sortOrder).toBe('desc'); // default
    });

    it('should validate full query parameters', () => {
      const validQuery = {
        page: 2,
        limit: 50,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.COMPLETED,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        minAmount: 10,
        maxAmount: 1000,
        search: 'grocery',
        tags: ['food', 'shopping'],
        sortBy: 'amount',
        sortOrder: 'asc',
      };

      const { error } = transactionValidation.query.validate(validQuery);

      expect(error).toBeUndefined();
    });

    it('should reject invalid page number', () => {
      const invalidQuery = {
        page: 0,
      };

      const { error } = transactionValidation.query.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Page must be at least 1');
    });

    it('should reject invalid limit', () => {
      const invalidQuery = {
        limit: 101,
      };

      const { error } = transactionValidation.query.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Limit must be less than 100');
    });

    it('should reject invalid date range', () => {
      const invalidQuery = {
        startDate: new Date('2024-01-31'),
        endDate: new Date('2024-01-01'), // end before start
      };

      const { error } = transactionValidation.query.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'End date must be after start date'
      );
    });

    it('should reject invalid amount range', () => {
      const invalidQuery = {
        minAmount: 1000,
        maxAmount: 100, // max less than min
      };

      const { error } = transactionValidation.query.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Maximum amount must be greater than minimum amount'
      );
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidQuery = {
        startDate: futureDate,
      };

      const { error } = transactionValidation.query.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Start date cannot be in the future'
      );
    });

    it('should reject invalid sort field', () => {
      const invalidQuery = {
        sortBy: 'invalid_field',
      };

      const { error } = transactionValidation.query.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be one of');
    });

    it('should reject invalid sort order', () => {
      const invalidQuery = {
        sortOrder: 'invalid_order',
      };

      const { error } = transactionValidation.query.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('must be one of');
    });

    it('should reject empty search term', () => {
      const invalidQuery = {
        search: '',
      };

      const { error } = transactionValidation.query.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Search term cannot be empty');
    });

    it('should reject search term that is too long', () => {
      const invalidQuery = {
        search: 'a'.repeat(101),
      };

      const { error } = transactionValidation.query.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe(
        'Search term must be less than 100 characters'
      );
    });
  });

  describe('Edge Cases and Complex Validation', () => {
    it('should handle null values gracefully', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        time: null,
        timezone: null,
        location: null,
        tags: [],
        notes: null,
        attachments: null,
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
        fees: null,
        tax: null,
        discount: null,
        merchantName: null,
        merchantId: null,
        paymentReference: null,
        recurrencePattern: null,
        recurrenceEndDate: null,
        isRecurring: false,
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle undefined values gracefully', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        time: undefined,
        timezone: undefined,
        location: undefined,
        tags: undefined,
        notes: undefined,
        attachments: undefined,
        originalAmount: undefined,
        originalCurrency: undefined,
        exchangeRate: undefined,
        fees: undefined,
        tax: undefined,
        discount: undefined,
        merchantName: undefined,
        merchantId: undefined,
        paymentReference: undefined,
        recurrencePattern: undefined,
        recurrenceEndDate: undefined,
        isRecurring: false,
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle empty string values', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        description: '',
        time: '',
        timezone: '',
        tags: [''],
        notes: '',
        merchantName: '',
        merchantId: '',
        paymentReference: '',
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle whitespace-only values', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        description: '   ',
        time: '   ',
        timezone: '   ',
        tags: ['   '],
        notes: '   ',
        merchantName: '   ',
        merchantId: '   ',
        paymentReference: '   ',
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle extreme numeric values', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 0.01, // Minimum amount
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        fees: 999999.99,
        tax: 999999.99,
        discount: 999999.99,
        originalAmount: 999999.99,
        exchangeRate: 999999.99,
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle complex nested location objects', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        location: {
          name: 'Test Location',
          address: 'Test Address',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.006,
          },
        },
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle complex recurring patterns', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurrenceInterval: 1,
        recurrenceEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        nextOccurrence: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle complex attachment arrays', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        attachments: [
          {
            filename: 'receipt1.pdf',
            originalName: 'receipt1.pdf',
            mimeType: 'application/pdf',
            size: 1024,
            url: 'https://example.com/uploads/receipt1.pdf',
            uploadDate: new Date(),
          },
          {
            filename: 'receipt2.jpg',
            originalName: 'receipt2.jpg',
            mimeType: 'image/jpeg',
            size: 2048,
            url: 'https://example.com/uploads/receipt2.jpg',
            uploadDate: new Date(),
          },
        ],
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle complex tag arrays', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
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
        ],
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle future dates for recurring transactions', () => {
      const schema = transactionValidation.create;
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: futureDate,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurrenceInterval: 1,
        recurrenceEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        nextOccurrence: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now (after the transaction date)
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case currency codes', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'EUR', // Different currency
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        originalAmount: 86.96, // Original amount in GBP
        originalCurrency: 'GBP', // Different original currency
        exchangeRate: 1.15,
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case payment methods', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        date: new Date(),
        merchantName: 'Test Merchant',
        merchantId: 'MERCH123',
        paymentReference: 'REF123456',
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case transaction types', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.TRANSFER, // Different type
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        date: new Date(),
        subcategoryId: '507f1f77bcf86cd799439012',
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case status values', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        status: TransactionStatus.PENDING, // Different status
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case time formats', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        time: '00:00', // Edge case time
        timezone: 'UTC',
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case timezone values', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        time: '12:00',
        timezone: 'America/New_York', // Complex timezone
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case coordinate values', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        location: {
          name: 'Test Location',
          address: 'Test Address',
          coordinates: {
            latitude: -90, // Edge case latitude
            longitude: 180, // Edge case longitude
          },
        },
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case file sizes', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        attachments: [
          {
            filename: 'large-file.pdf',
            originalName: 'large-file.pdf',
            mimeType: 'application/pdf',
            size: 20 * 1024 * 1024, // 20MB (edge case)
            url: 'https://example.com/uploads/large-file.pdf',
          },
        ],
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case tag lengths', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        tags: [
          'a'.repeat(50), // Edge case tag length
          'b'.repeat(25),
          'c'.repeat(10),
        ],
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case description lengths', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        description: 'a'.repeat(1000), // Edge case description length
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case title lengths', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'a'.repeat(200), // Edge case title length
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case amount precision', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 0.01, // Minimum valid amount
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });

    it('should handle edge case exchange rate precision', () => {
      const schema = transactionValidation.create;
      const data = {
        title: 'Test Transaction',
        amount: 100,
        currency: 'USD',
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        date: new Date(),
        originalAmount: 85.5,
        originalCurrency: 'EUR',
        exchangeRate: 1.1695906432748538, // High precision exchange rate
      };

      const result = schema.validate(data);
      expect(result.error).toBeUndefined();
    });
  });
});
