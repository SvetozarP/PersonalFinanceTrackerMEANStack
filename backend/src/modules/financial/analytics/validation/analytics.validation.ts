import Joi from 'joi';
import { IAnalyticsQuery } from '../interfaces/analytics.interface';

/**
 * Validation schema for analytics query parameters
 */
export const analyticsQuerySchema = Joi.object<IAnalyticsQuery>({
  startDate: Joi.date().iso().required().messages({
    'date.base': 'Start date must be a valid date',
    'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
    'any.required': 'Start date is required',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required().messages({
    'date.base': 'End date must be a valid date',
    'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
    'date.min': 'End date must be after start date',
    'any.required': 'End date is required',
  }),
  groupBy: Joi.string().valid('day', 'week', 'month', 'quarter', 'year').default('month').messages({
    'string.base': 'Group by must be a string',
    'any.only': 'Group by must be one of: day, week, month, quarter, year',
  }),
  categories: Joi.array().items(Joi.string().hex().length(24)).optional().messages({
    'array.base': 'Categories must be an array',
    'string.hex': 'Category ID must be a valid MongoDB ObjectId',
    'string.length': 'Category ID must be 24 characters long',
  }),
  transactionTypes: Joi.array().items(Joi.string().valid('income', 'expense', 'transfer')).optional().messages({
    'array.base': 'Transaction types must be an array',
    'any.only': 'Transaction type must be one of: income, expense, transfer',
  }),
  accounts: Joi.array().items(Joi.string().hex().length(24)).optional().messages({
    'array.base': 'Accounts must be an array',
    'string.hex': 'Account ID must be a valid MongoDB ObjectId',
    'string.length': 'Account ID must be 24 characters long',
  }),
  tags: Joi.array().items(Joi.string().max(50)).optional().messages({
    'array.base': 'Tags must be an array',
    'string.max': 'Tag must be less than 50 characters',
  }),
  minAmount: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'Minimum amount must be a number',
    'number.positive': 'Minimum amount must be positive',
    'number.precision': 'Minimum amount can have at most 2 decimal places',
  }),
  maxAmount: Joi.number().positive().precision(2).min(Joi.ref('minAmount')).optional().messages({
    'number.base': 'Maximum amount must be a number',
    'number.positive': 'Maximum amount must be positive',
    'number.precision': 'Maximum amount can have at most 2 decimal places',
    'number.min': 'Maximum amount must be greater than or equal to minimum amount',
  }),
  includeRecurring: Joi.boolean().default(true).messages({
    'boolean.base': 'Include recurring must be a boolean',
  }),
  includePending: Joi.boolean().default(true).messages({
    'boolean.base': 'Include pending must be a boolean',
  }),
});

/**
 * Validation schema for period comparison request body
 */
export const periodComparisonSchema = Joi.object({
  currentStart: Joi.date().iso().required().messages({
    'date.base': 'Current start date must be a valid date',
    'date.format': 'Current start date must be in ISO format (YYYY-MM-DD)',
    'any.required': 'Current start date is required',
  }),
  currentEnd: Joi.date().iso().min(Joi.ref('currentStart')).required().messages({
    'date.base': 'Current end date must be a valid date',
    'date.format': 'Current end date must be in ISO format (YYYY-MM-DD)',
    'date.min': 'Current end date must be after current start date',
    'any.required': 'Current end date is required',
  }),
  previousStart: Joi.date().iso().required().messages({
    'date.base': 'Previous start date must be a valid date',
    'date.format': 'Previous start date must be in ISO format (YYYY-MM-DD)',
    'any.required': 'Previous start date is required',
  }),
  previousEnd: Joi.date().iso().min(Joi.ref('previousStart')).required().messages({
    'date.base': 'Previous end date must be a valid date',
    'date.format': 'Previous end date must be in ISO format (YYYY-MM-DD)',
    'date.min': 'Previous end date must be after previous start date',
    'any.required': 'Previous end date is required',
  }),
});

/**
 * Validation schema for date range query parameters
 */
export const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    'date.base': 'Start date must be a valid date',
    'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.base': 'End date must be a valid date',
    'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
    'date.min': 'End date must be after start date',
  }),
});

/**
 * Validation schema for cash flow analysis query parameters
 */
export const cashFlowQuerySchema = Joi.object({
  startDate: Joi.date().iso().optional().messages({
    'date.base': 'Start date must be a valid date',
    'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.base': 'End date must be a valid date',
    'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
    'date.min': 'End date must be after start date',
  }),
  groupBy: Joi.string().valid('day', 'week', 'month').default('month').messages({
    'string.base': 'Group by must be a string',
    'any.only': 'Group by must be one of: day, week, month',
  }),
});

/**
 * Validate analytics query parameters
 */
export const validateAnalyticsQuery = (query: any): Joi.ValidationResult => {
  return analyticsQuerySchema.validate(query, { abortEarly: false });
};

/**
 * Validate period comparison request body
 */
export const validatePeriodComparison = (body: any): Joi.ValidationResult => {
  return periodComparisonSchema.validate(body, { abortEarly: false });
};

/**
 * Validate date range query parameters
 */
export const validateDateRange = (query: any): Joi.ValidationResult => {
  return dateRangeSchema.validate(query, { abortEarly: false });
};

/**
 * Validate cash flow query parameters
 */
export const validateCashFlowQuery = (query: any): Joi.ValidationResult => {
  return cashFlowQuerySchema.validate(query, { abortEarly: false });
};

/**
 * Custom validation functions
 */

/**
 * Validate that the date range is not too large (max 5 years)
 */
export const validateDateRangeSize = (startDate: Date, endDate: Date): boolean => {
  const maxDays = 365 * 5; // 5 years
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= maxDays;
};

/**
 * Validate that the date range is reasonable for the groupBy option
 */
export const validateGroupByForDateRange = (startDate: Date, endDate: Date, groupBy: string): boolean => {
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  switch (groupBy) {
    case 'day':
      return diffDays <= 365; // Max 1 year for daily grouping
    case 'week':
      return diffDays <= 365 * 2; // Max 2 years for weekly grouping
    case 'month':
      return diffDays <= 365 * 5; // Max 5 years for monthly grouping
    case 'quarter':
      return diffDays <= 365 * 10; // Max 10 years for quarterly grouping
    case 'year':
      return diffDays <= 365 * 20; // Max 20 years for yearly grouping
    default:
      return true;
  }
};

/**
 * Validate amount range is reasonable
 */
export const validateAmountRange = (minAmount?: number, maxAmount?: number): boolean => {
  if (minAmount !== undefined && maxAmount !== undefined) {
    // Max amount should not be more than 1000x min amount
    return maxAmount <= minAmount * 1000;
  }
  return true;
};

/**
 * Enhanced validation with custom rules
 */
export const validateAnalyticsQueryEnhanced = (query: any): Joi.ValidationResult => {
  const result = validateAnalyticsQuery(query);
  
  if (result.error) {
    return result;
  }

  const { startDate, endDate, groupBy, minAmount, maxAmount } = result.value;

  // Custom validations
  if (!validateDateRangeSize(startDate, endDate)) {
    return {
      error: {
        details: [{
          message: 'Date range cannot exceed 5 years',
          path: ['startDate'],
          type: 'date.max',
        }],
      },
      value: result.value,
    } as Joi.ValidationResult;
  }

  if (!validateGroupByForDateRange(startDate, endDate, groupBy)) {
    return {
      error: {
        details: [{
          message: `Date range is too large for ${groupBy} grouping`,
          path: ['groupBy'],
          type: 'any.invalid',
        }],
      },
      value: result.value,
    } as Joi.ValidationResult;
  }

  if (!validateAmountRange(minAmount, maxAmount)) {
    return {
      error: {
        details: [{
          message: 'Amount range is too large (max amount should not exceed 1000x min amount)',
          path: ['maxAmount'],
          type: 'number.max',
        }],
      },
      value: result.value,
    } as Joi.ValidationResult;
  }

  return result;
};