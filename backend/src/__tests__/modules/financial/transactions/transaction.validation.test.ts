import { transactionValidation } from '../../../../modules/financial/transactions/validators/transaction.validation';
import { TransactionType, TransactionStatus, PaymentMethod, RecurrencePattern } from '../../../../modules/financial/transactions/interfaces/transaction.interface';

describe('Transaction Validation', () => {
  describe('create schema', () => {
    const validTransactionData = {
      title: 'Test Transaction',
      amount: 100.50,
      currency: 'GBP',
      type: TransactionType.EXPENSE,
      categoryId: '507f1f77bcf86cd799439011',
      paymentMethod: PaymentMethod.CASH,
      date: new Date('2024-01-15'),
    };

    it('should validate valid transaction creation data', () => {
      const { error, value } = transactionValidation.create.validate(validTransactionData);

      expect(error).toBeUndefined();
      expect(value.title).toBe('Test Transaction');
      expect(value.amount).toBe(100.50);
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

      const { error, value } = transactionValidation.create.validate(minimalData);

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

      const { error } = transactionValidation.create.validate(invalidData, { abortEarly: false });

      expect(error).toBeDefined();
      expect(error?.details.some(d => d.path.includes('title'))).toBe(true);
      expect(error?.details.some(d => d.path.includes('categoryId'))).toBe(true);
      expect(error?.details.some(d => d.path.includes('paymentMethod'))).toBe(true);
    });

    it('should reject empty title', () => {
      const invalidData = {
        ...validTransactionData,
        title: '',
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Transaction title cannot be empty');
    });

    it('should reject title that is too long', () => {
      const invalidData = {
        ...validTransactionData,
        title: 'a'.repeat(201),
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Transaction title must be less than 200 characters');
    });

    it('should reject negative amount', () => {
      const invalidData = {
        ...validTransactionData,
        amount: -100,
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Transaction amount must be positive');
    });

    it('should reject zero amount', () => {
      const invalidData = {
        ...validTransactionData,
        amount: 0,
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Transaction amount must be positive');
    });

    it('should reject invalid currency format', () => {
      const invalidData = {
        ...validTransactionData,
        currency: 'INVALID',
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Currency must be a valid 3-letter ISO code (e.g. GBP, USD, EUR)');
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
      expect(error?.details[0].message).toBe('Transaction type must be one of: income, expense, transfer, adjustment');
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
      expect(error?.details[0].message).toBe('Tag must be less than 50 characters');
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidData = {
        ...validTransactionData,
        date: futureDate,
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Transaction date cannot be in the future');
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
      expect(error?.details[0].message).toBe('Latitude must be between -90 and 90');
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
        originalAmount: 120.00,
        originalCurrency: 'USD',
        exchangeRate: 0.8333,
      };

      const { error } = transactionValidation.create.validate(validData);

      expect(error).toBeUndefined();
    });

    it('should require exchange rate when original currency is provided', () => {
      const invalidData = {
        ...validTransactionData,
        originalAmount: 120.00,
        originalCurrency: 'USD',
        // exchangeRate missing
      };

      const { error } = transactionValidation.create.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Exchange rate is required when original currency is provided');
    });

    it('should validate recurring transaction fields', () => {
      const validData = {
        ...validTransactionData,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        recurenceInterval: 1,
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
      expect(error?.details.some(d => d.message.includes('Recurrence pattern is required'))).toBe(true);
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
      expect(error?.details[0].message).toBe('Maximum of 10 attachments allowed');
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
      expect(error?.details[0].message).toBe('File size must be less than 50MB');
    });

    it('should trim whitespace from string fields', () => {
      const dataWithWhitespace = {
        ...validTransactionData,
        title: '  Test Transaction  ',
        description: '  Test Description  ',
        notes: '  Test Notes  ',
      };

      const { error, value } = transactionValidation.create.validate(dataWithWhitespace);

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

      const { error } = transactionValidation.update.validate(invalidData, { abortEarly: false });

      expect(error).toBeDefined();
      expect(error?.details.some(d => d.message.includes('positive'))).toBe(true);
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
      expect(error?.details[0].message).toBe('At least one transaction is required');
    });

    it('should reject missing transactions array', () => {
      const invalidData = {};

      const { error } = transactionValidation.bulk.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('At least one transaction is required');
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
      expect(error?.details[0].message).toBe('Maximum of 100 transactions allowed');
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
      expect(error?.details[0].message).toBe('End date must be after start date');
    });

    it('should reject invalid amount range', () => {
      const invalidQuery = {
        minAmount: 1000,
        maxAmount: 100, // max less than min
      };

      const { error } = transactionValidation.query.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Maximum amount must be greater than minimum amount');
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const invalidQuery = {
        startDate: futureDate,
      };

      const { error } = transactionValidation.query.validate(invalidQuery);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toBe('Start date cannot be in the future');
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
      expect(error?.details[0].message).toBe('Search term must be less than 100 characters');
    });
  });

  describe('edge cases and complex validation', () => {
    it('should handle null values gracefully', () => {
      const dataWithNulls = {
        title: 'Test Transaction',
        amount: 100,
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        description: null,
        subcategoryId: null,
        time: null,
      };

      const { error } = transactionValidation.create.validate(dataWithNulls);

      expect(error).toBeUndefined();
    });

    it('should handle multiple validation errors', () => {
      const invalidData = {
        title: '', // empty title
        amount: -100, // negative amount
        type: 'invalid_type', // invalid type
        categoryId: 'invalid_id', // invalid ObjectId
        paymentMethod: 'invalid_method', // invalid payment method
        currency: 'INVALID', // invalid currency
      };

      const { error } = transactionValidation.create.validate(invalidData, { abortEarly: false });

      expect(error).toBeDefined();
      expect(error?.details.length).toBeGreaterThan(1);
    });

    it('should validate recurring pattern dependencies', () => {
      const invalidData = {
        title: 'Test Transaction',
        amount: 100,
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        isRecurring: true,
        recurrencePattern: RecurrencePattern.MONTHLY,
        // missing recurenceInterval, recurrenceEndDate, nextOccurrence
      };

      const { error } = transactionValidation.create.validate(invalidData, { abortEarly: false });

      expect(error).toBeDefined();
      expect(error?.details.length).toBeGreaterThanOrEqual(3);
    });

    it('should validate complex nested objects', () => {
      const complexData = {
        title: 'Complex Transaction',
        amount: 99.99,
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        location: {
          name: 'Complex Store Name',
          address: '123 Complex Street, Complex City, Complex Country',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.0060,
          },
        },
        attachments: [
          {
            filename: 'receipt1.pdf',
            originalName: 'Receipt 1.pdf',
            mimeType: 'application/pdf',
            size: 1024000,
            url: 'https://example.com/receipt1.pdf',
          },
          {
            filename: 'receipt2.jpg',
            originalName: 'Receipt 2.jpg',
            mimeType: 'image/jpeg',
            size: 512000,
            url: 'https://example.com/receipt2.jpg',
          },
        ],
        tags: ['business', 'travel', 'receipt'],
      };

      const { error } = transactionValidation.create.validate(complexData);

      expect(error).toBeUndefined();
    });

    it('should strip unknown fields', () => {
      const dataWithExtraFields = {
        title: 'Test Transaction',
        amount: 100,
        type: TransactionType.EXPENSE,
        categoryId: '507f1f77bcf86cd799439011',
        paymentMethod: PaymentMethod.CASH,
        unknownField: 'should be stripped',
      };

      const { error, value } = transactionValidation.create.validate(dataWithExtraFields, { stripUnknown: true });

      expect(error).toBeUndefined();
      expect(value).not.toHaveProperty('unknownField');
    });
  });
});
