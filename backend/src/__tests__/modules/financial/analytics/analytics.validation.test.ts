import {
  analyticsQuerySchema,
  periodComparisonSchema,
  dateRangeSchema,
  cashFlowQuerySchema,
  validateAnalyticsQuery,
  validatePeriodComparison,
  validateDateRange,
  validateCashFlowQuery,
  validateDateRangeSize,
  validateGroupByForDateRange,
  validateAmountRange,
  validateAnalyticsQueryEnhanced
} from '../../../../modules/financial/analytics/validation/analytics.validation';

describe('Analytics Validation - Comprehensive Branch Coverage Tests', () => {
  describe('analyticsQuerySchema', () => {
    it('should validate valid analytics query', () => {
      const validQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        groupBy: 'month',
        categories: ['507f1f77bcf86cd799439011'],
        transactionTypes: ['expense'],
        accounts: ['507f1f77bcf86cd799439012'],
        tags: ['groceries'],
        minAmount: 10.50,
        maxAmount: 100.00,
        includeRecurring: true,
        includePending: false
      };

      const result = analyticsQuerySchema.validate(validQuery);
      expect(result.error).toBeUndefined();
      expect(result.value).toBeDefined();
    });

    it('should validate with minimal required fields', () => {
      const minimalQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const result = analyticsQuerySchema.validate(minimalQuery);
      expect(result.error).toBeUndefined();
      expect(result.value.groupBy).toBe('month'); // default value
      expect(result.value.includeRecurring).toBe(true); // default value
      expect(result.value.includePending).toBe(true); // default value
    });

    it('should reject missing startDate', () => {
      const invalidQuery = {
        endDate: '2024-01-31'
      };

      const result = analyticsQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Start date is required');
    });

    it('should reject missing endDate', () => {
      const invalidQuery = {
        startDate: '2024-01-01'
      };

      const result = analyticsQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('End date is required');
    });

    it('should reject invalid date format', () => {
      const invalidQuery = {
        startDate: 'invalid-date',
        endDate: '2024-01-31'
      };

      const result = analyticsQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Start date must be in ISO format');
    });

    it('should reject endDate before startDate', () => {
      const invalidQuery = {
        startDate: '2024-01-31',
        endDate: '2024-01-01'
      };

      const result = analyticsQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('End date must be after start date');
    });

    it('should reject invalid groupBy value', () => {
      const invalidQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        groupBy: 'invalid'
      };

      const result = analyticsQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Group by must be one of: day, week, month, quarter, year');
    });

    it('should accept all valid groupBy values', () => {
      const validGroupByValues = ['day', 'week', 'month', 'quarter', 'year'];
      
      validGroupByValues.forEach(groupBy => {
        const query = {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          groupBy
        };

        const result = analyticsQuerySchema.validate(query);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid category ID format', () => {
      const invalidQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        categories: ['invalid-id']
      };

      const result = analyticsQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Category ID must be a valid MongoDB ObjectId');
    });

    it('should reject category ID with wrong length', () => {
      const invalidQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        categories: ['507f1f77bcf86cd79943901'] // 23 characters instead of 24
      };

      const result = analyticsQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Category ID must be 24 characters long');
    });

    it('should reject invalid transaction type', () => {
      const invalidQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        transactionTypes: ['invalid']
      };

      const result = analyticsQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Transaction type must be one of: income, expense, transfer');
    });

    it('should accept all valid transaction types', () => {
      const validTransactionTypes = ['income', 'expense', 'transfer'];
      
      validTransactionTypes.forEach(transactionType => {
        const query = {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          transactionTypes: [transactionType]
        };

        const result = analyticsQuerySchema.validate(query);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject invalid account ID format', () => {
      const invalidQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        accounts: ['invalid-id']
      };

      const result = analyticsQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Account ID must be a valid MongoDB ObjectId');
    });

    it('should reject tag that is too long', () => {
      const longTag = 'a'.repeat(51); // 51 characters
      const invalidQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        tags: [longTag]
      };

      const result = analyticsQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Tag must be less than 50 characters');
    });

    it('should reject negative minAmount', () => {
      const invalidQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        minAmount: -10
      };

      const result = analyticsQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Minimum amount must be positive');
    });

    it('should accept minAmount with decimal places', () => {
      const validQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        minAmount: 10.12
      };

      const result = analyticsQuerySchema.validate(validQuery);
      expect(result.error).toBeUndefined();
    });

    it('should reject maxAmount less than minAmount', () => {
      const invalidQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        minAmount: 100,
        maxAmount: 50
      };

      const result = analyticsQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Maximum amount must be greater than or equal to minimum amount');
    });

    it('should coerce string to boolean for includeRecurring', () => {
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includeRecurring: 'true'
      };

      const result = analyticsQuerySchema.validate(query);
      expect(result.error).toBeUndefined();
      expect(result.value.includeRecurring).toBe(true);
    });

    it('should coerce string to boolean for includePending', () => {
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        includePending: 'false'
      };

      const result = analyticsQuerySchema.validate(query);
      expect(result.error).toBeUndefined();
      expect(result.value.includePending).toBe(false);
    });
  });

  describe('periodComparisonSchema', () => {
    it('should validate valid period comparison', () => {
      const validBody = {
        currentStart: '2024-01-01',
        currentEnd: '2024-01-31',
        previousStart: '2023-01-01',
        previousEnd: '2023-01-31'
      };

      const result = periodComparisonSchema.validate(validBody);
      expect(result.error).toBeUndefined();
    });

    it('should reject missing currentStart', () => {
      const invalidBody = {
        currentEnd: '2024-01-31',
        previousStart: '2023-01-01',
        previousEnd: '2023-01-31'
      };

      const result = periodComparisonSchema.validate(invalidBody);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Current start date is required');
    });

    it('should reject currentEnd before currentStart', () => {
      const invalidBody = {
        currentStart: '2024-01-31',
        currentEnd: '2024-01-01',
        previousStart: '2023-01-01',
        previousEnd: '2023-01-31'
      };

      const result = periodComparisonSchema.validate(invalidBody);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Current end date must be after current start date');
    });

    it('should reject previousEnd before previousStart', () => {
      const invalidBody = {
        currentStart: '2024-01-01',
        currentEnd: '2024-01-31',
        previousStart: '2023-01-31',
        previousEnd: '2023-01-01'
      };

      const result = periodComparisonSchema.validate(invalidBody);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Previous end date must be after previous start date');
    });
  });

  describe('dateRangeSchema', () => {
    it('should validate valid date range', () => {
      const validQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const result = dateRangeSchema.validate(validQuery);
      expect(result.error).toBeUndefined();
    });

    it('should validate with only startDate', () => {
      const validQuery = {
        startDate: '2024-01-01'
      };

      const result = dateRangeSchema.validate(validQuery);
      expect(result.error).toBeUndefined();
    });

    it('should reject only endDate without startDate', () => {
      const invalidQuery = {
        endDate: '2024-01-31'
      };

      const result = dateRangeSchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('references "ref:startDate"');
    });

    it('should validate with no dates', () => {
      const validQuery = {};

      const result = dateRangeSchema.validate(validQuery);
      expect(result.error).toBeUndefined();
    });

    it('should reject endDate before startDate', () => {
      const invalidQuery = {
        startDate: '2024-01-31',
        endDate: '2024-01-01'
      };

      const result = dateRangeSchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('End date must be after start date');
    });
  });

  describe('cashFlowQuerySchema', () => {
    it('should validate valid cash flow query', () => {
      const validQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        groupBy: 'month'
      };

      const result = cashFlowQuerySchema.validate(validQuery);
      expect(result.error).toBeUndefined();
    });

    it('should use default groupBy value', () => {
      const validQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const result = cashFlowQuerySchema.validate(validQuery);
      expect(result.error).toBeUndefined();
      expect(result.value.groupBy).toBe('month');
    });

    it('should reject invalid groupBy value', () => {
      const invalidQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        groupBy: 'year'
      };

      const result = cashFlowQuerySchema.validate(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Group by must be one of: day, week, month');
    });

    it('should accept all valid groupBy values', () => {
      const validGroupByValues = ['day', 'week', 'month'];
      
      validGroupByValues.forEach(groupBy => {
        const query = {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          groupBy
        };

        const result = cashFlowQuerySchema.validate(query);
        expect(result.error).toBeUndefined();
      });
    });
  });

  describe('validateDateRangeSize', () => {
    it('should return true for date range within 5 years', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const result = validateDateRangeSize(startDate, endDate);
      expect(result).toBe(true);
    });

    it('should return false for date range exceeding 5 years', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2030-01-01'); // 6 years
      
      const result = validateDateRangeSize(startDate, endDate);
      expect(result).toBe(false);
    });

    it('should return false for exactly 5 years (exceeds limit)', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2028-12-31'); // Exactly 5 years (1826 days)
      
      const result = validateDateRangeSize(startDate, endDate);
      expect(result).toBe(false); // 1826 > 1825 (365 * 5)
    });
  });

  describe('validateGroupByForDateRange', () => {
    it('should return true for day grouping with 1 year range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const result = validateGroupByForDateRange(startDate, endDate, 'day');
      expect(result).toBe(true);
    });

    it('should return false for day grouping with more than 1 year', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2025-01-01'); // 1 year and 1 day
      
      const result = validateGroupByForDateRange(startDate, endDate, 'day');
      expect(result).toBe(false);
    });

    it('should return true for week grouping with 2 years range', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2025-12-31');
      
      const result = validateGroupByForDateRange(startDate, endDate, 'week');
      expect(result).toBe(true);
    });

    it('should return false for week grouping with more than 2 years', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2026-01-01'); // 2 years and 1 day
      
      const result = validateGroupByForDateRange(startDate, endDate, 'week');
      expect(result).toBe(false);
    });

    it('should return false for month grouping with 5 years range (exceeds limit)', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2028-12-31'); // 1826 days
      
      const result = validateGroupByForDateRange(startDate, endDate, 'month');
      expect(result).toBe(false); // 1826 > 1825 (365 * 5)
    });

    it('should return false for month grouping with more than 5 years', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2029-01-01'); // 5 years and 1 day
      
      const result = validateGroupByForDateRange(startDate, endDate, 'month');
      expect(result).toBe(false);
    });

    it('should return false for quarter grouping with 10 years range (exceeds limit)', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2033-12-31'); // 3653 days
      
      const result = validateGroupByForDateRange(startDate, endDate, 'quarter');
      expect(result).toBe(false); // 3653 > 3650 (365 * 10)
    });

    it('should return false for quarter grouping with more than 10 years', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2034-01-01'); // 10 years and 1 day
      
      const result = validateGroupByForDateRange(startDate, endDate, 'quarter');
      expect(result).toBe(false);
    });

    it('should return false for year grouping with 20 years range (exceeds limit)', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2043-12-31'); // 7305 days
      
      const result = validateGroupByForDateRange(startDate, endDate, 'year');
      expect(result).toBe(false); // 7305 > 7300 (365 * 20)
    });

    it('should return false for year grouping with more than 20 years', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2044-01-01'); // 20 years and 1 day
      
      const result = validateGroupByForDateRange(startDate, endDate, 'year');
      expect(result).toBe(false);
    });

    it('should return true for unknown groupBy', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const result = validateGroupByForDateRange(startDate, endDate, 'unknown');
      expect(result).toBe(true);
    });
  });

  describe('validateAmountRange', () => {
    it('should return true when minAmount and maxAmount are undefined', () => {
      const result = validateAmountRange();
      expect(result).toBe(true);
    });

    it('should return true when only minAmount is provided', () => {
      const result = validateAmountRange(10);
      expect(result).toBe(true);
    });

    it('should return true when only maxAmount is provided', () => {
      const result = validateAmountRange(undefined, 100);
      expect(result).toBe(true);
    });

    it('should return true when maxAmount is within 1000x of minAmount', () => {
      const result = validateAmountRange(10, 5000); // 500x
      expect(result).toBe(true);
    });

    it('should return true when maxAmount equals 1000x of minAmount', () => {
      const result = validateAmountRange(10, 10000); // exactly 1000x
      expect(result).toBe(true);
    });

    it('should return false when maxAmount exceeds 1000x of minAmount', () => {
      const result = validateAmountRange(10, 10001); // 1000.1x
      expect(result).toBe(false);
    });
  });

  describe('validateAnalyticsQueryEnhanced', () => {
    it('should return valid result for valid query', () => {
      const validQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        groupBy: 'month',
        minAmount: 10,
        maxAmount: 100
      };

      const result = validateAnalyticsQueryEnhanced(validQuery);
      expect(result.error).toBeUndefined();
    });

    it('should return error for date range exceeding 5 years', () => {
      const invalidQuery = {
        startDate: '2024-01-01',
        endDate: '2030-01-01', // 6 years
        groupBy: 'month'
      };

      const result = validateAnalyticsQueryEnhanced(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Date range cannot exceed 5 years');
    });

    it('should return error for groupBy with too large date range', () => {
      const invalidQuery = {
        startDate: '2024-01-01',
        endDate: '2025-01-01', // 1 year and 1 day
        groupBy: 'day'
      };

      const result = validateAnalyticsQueryEnhanced(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Date range is too large for day grouping');
    });

    it('should return error for amount range too large', () => {
      const invalidQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        groupBy: 'month',
        minAmount: 10,
        maxAmount: 10001 // 1000.1x
      };

      const result = validateAnalyticsQueryEnhanced(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Amount range is too large');
    });

    it('should return original error for invalid basic validation', () => {
      const invalidQuery = {
        startDate: 'invalid-date',
        endDate: '2024-01-31'
      };

      const result = validateAnalyticsQueryEnhanced(invalidQuery);
      expect(result.error).toBeDefined();
      expect(result.error?.details[0].message).toContain('Start date must be in ISO format');
    });
  });

  describe('Validation helper functions', () => {
    it('should validate analytics query using helper function', () => {
      const validQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const result = validateAnalyticsQuery(validQuery);
      expect(result.error).toBeUndefined();
    });

    it('should validate period comparison using helper function', () => {
      const validBody = {
        currentStart: '2024-01-01',
        currentEnd: '2024-01-31',
        previousStart: '2023-01-01',
        previousEnd: '2023-01-31'
      };

      const result = validatePeriodComparison(validBody);
      expect(result.error).toBeUndefined();
    });

    it('should validate date range using helper function', () => {
      const validQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31'
      };

      const result = validateDateRange(validQuery);
      expect(result.error).toBeUndefined();
    });

    it('should validate cash flow query using helper function', () => {
      const validQuery = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        groupBy: 'month'
      };

      const result = validateCashFlowQuery(validQuery);
      expect(result.error).toBeUndefined();
    });
  });
});
