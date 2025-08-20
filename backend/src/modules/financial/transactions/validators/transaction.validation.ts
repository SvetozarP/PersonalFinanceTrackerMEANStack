import Joi from 'joi';
import {
  TransactionType,
  TransactionStatus,
  PaymentMethod,
  RecurrencePattern,
} from '../interfaces/transaction.interface';

// Common validation patterns
const objectIdPattern = /^[0-9a-fA-F]{24}$/;
const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
const currencyPattern = /^[A-Z]{3}$/;
const urlPattern = /^https?:\/\/.+/;

// Base transaction validation schema
export const baseTransactionSchema = Joi.object({
  // Basic information
  title: Joi.string()
    .required()
    .trim()
    .min(1, 'Transaction title is required')
    .max(200, 'Transaction title must be less than 200 characters')
    .messages({
      'string.empty': 'Transaction title cannot be empty',
      'any.required': 'Transaction title is required',
    }),

  description: Joi.string()
    .optional()
    .trim()
    .max(1000, 'Description must be less than 1000 characters')
    .allow(''),

  amount: Joi.number().required().positive().precision(2).messages({
    'any.required': 'Transaction amount is required',
    'number.positive': 'Transaction amount must be positive',
    'number.precision': 'Transaction amount must have 2 decimal places',
    'number.base': 'Transaction amount must be a valid number',
  }),

  currency: Joi.string()
    .required()
    .trim()
    .pattern(currencyPattern, 'Currency must be a valid 3-letter ISO code')
    .uppercase()
    .default('GBP')
    .messages({
      'any.required': 'Currency is required',
      'string.pattern.base':
        'Currency must be a valid 3-letter ISO code (e.g. GBP, USD, EUR)',
    }),

  type: Joi.string()
    .required()
    .valid(...Object.values(TransactionType))
    .messages({
      'any.required': 'Transaction type is required',
      'any.only':
        'Transaction type must be one of: income, expense, transfer, adjustment',
    }),

  status: Joi.string()
    .valid(...Object.values(TransactionStatus))
    .default(TransactionStatus.COMPLETED)
    .messages({
      'any.only': 'Invalid transaction status',
    }),

  categoryId: Joi.string()
    .required()
    .pattern(objectIdPattern, 'Invalid category ID')
    .messages({
      'any.required': 'Category ID is required',
      'string.pattern.base': 'Invalid category ID',
    }),

  subcategoryId: Joi.string()
    .optional()
    .pattern(objectIdPattern, 'Invalid subcategory ID')
    .allow(null),

  tags: Joi.array()
    .items(
      Joi.string()
        .trim()
        .max(50, 'Tag must be less than 50 characters')
        .min(1, 'Tag cannot be empty')
        .messages({
          'string.max': 'Tag must be less than 50 characters',
        })
    )
    .max(20)
    .default([])
    .messages({
      'tags.max': 'Maximum of 20 tags allowed',
    }),

  // Timing
  date: Joi.date()
    .required()
    .max(new Date())
    .default(() => new Date())
    .messages({
      'any.required': 'Transaction date is required',
      'date.max': 'Transaction date cannot be in the future',
    }),

  time: Joi.string()
    .optional()
    .pattern(timePattern, 'Time must be in HH:MM format (24 hour)')
    .allow(''),

  timezone: Joi.string().required().default('Europe/London').messages({
    'any.required': 'Timezone is required',
  }),

  // Location and Context
  location: Joi.object({
    name: Joi.string()
      .optional()
      .trim()
      .max(200, 'Location name must be less than 200 characters')
      .allow(''),

    address: Joi.string()
      .optional()
      .trim()
      .max(500, 'Address must be less than 500 characters')
      .allow(''),

    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90).required().messages({
        'number.min': 'Latitude must be between -90 and 90',
        'number.max': 'Latitude must be between -90 and 90',
        'any.required': 'Latitude is required',
      }),

      longitude: Joi.number().min(-180).max(180).required().messages({
        'number.min': 'Longitude must be between -180 and 180',
        'number.max': 'Longitude must be between -180 and 180',
        'any.required': 'Longitude is required',
      }),
    }).optional(),
  }).optional(),

  // Payment details

  paymentMethod: Joi.string()
    .required()
    .valid(...Object.values(PaymentMethod))
    .messages({
      'any.required': 'Payment method is required',
      'any.only': 'Invalid payment method',
    }),

  paymentReference: Joi.string()
    .optional()
    .trim()
    .max(100, 'Payment reference must be less than 100 characters')
    .allow(''),

  merchantName: Joi.string()
    .optional()
    .trim()
    .max(200, 'Merchant name must be less than 200 characters')
    .allow(''),

  merchantId: Joi.string()
    .optional()
    .trim()
    .max(100, 'Merchant ID must be less than 100 characters')
    .allow(''),

  // Financial details
  originalAmount: Joi.number()
    .optional()
    .positive()
    .precision(2)
    .when('originalCurrency', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required':
        'Original amount is required when original currency is provided',
      'number.positive': 'Original amount must be positive',
      'number.precision': 'Original amount must have 2 decimal places',
    }),

  originalCurrency: Joi.string()
    .optional()
    .trim()
    .pattern(
      currencyPattern,
      'Original currency must be a valid 3-letter ISO code'
    )
    .uppercase()
    .allow(''),

  exchangeRate: Joi.number()
    .optional()
    .positive()
    .precision(6)
    .when('originalCurrency', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required':
        'Exchange rate is required when original currency is provided',
      'number.positive': 'Exchange rate must be positive',
      'number.precision': 'Exchange rate must have 6 decimal places',
    }),

  fees: Joi.number().optional().min(0).precision(2).default(0).messages({
    'number.min': 'Fees must be positive',
    'number.precision': 'Fees must have 2 decimal places',
  }),

  tax: Joi.number().optional().min(0).precision(2).default(0).messages({
    'number.min': 'Tax must be positive',
    'number.precision': 'Tax must have 2 decimal places',
  }),

  // Recurrence
  isRecurring: Joi.boolean().default(false),

  recurrencePattern: Joi.string()
    .valid(...Object.values(RecurrencePattern))
    .default(RecurrencePattern.NONE)
    .when('isRecurring', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required':
        'Recurrence pattern is required when transaction is recurring',
      'any.only': 'Invalid recurrence pattern',
    }),

  recurenceInterval: Joi.number()
    .optional()
    .integer()
    .min(1)
    .when('isRecurring', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required':
        'Recurrence interval is required when transaction is recurring',
      'number.integer': 'Recurrence interval must be a whole number',
      'number.min': 'Recurrence interval must be at least 1',
    }),

  recurrenceEndDate: Joi.date()
    .optional()
    .greater(Joi.ref('date'))
    .when('isRecurring', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required':
        'Recurrence end date is required when transaction is recurring',
      'date.greater': 'Recurrence end date must be after the transaction date',
    }),

  nextOccurrence: Joi.date()
    .optional()
    .greater(Joi.ref('date'))
    .when('isRecurring', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'any.required':
        'Next occurrence date is required when transaction is recurring',
      'date.greater': 'Next occurrence date must be after the transaction date',
    }),

  parentTransactionId: Joi.string()
    .optional()
    .pattern(objectIdPattern, 'Invalid parent transaction ID')
    .allow(null),

  // Attachments and Notes
  attachments: Joi.array()
    .items(
      Joi.object({
        filename: Joi.string()
          .required()
          .trim()
          .min(1, 'Filename cannot be empty')
          .max(255, 'Filename must be less than 255 characters'),

        originalName: Joi.string()
          .required()
          .trim()
          .min(1, 'Original name cannot be empty')
          .max(255, 'Original name must be less than 255 characters'),

        mimeType: Joi.string()
          .required()
          .trim()
          .pattern(
            /^[a-zA-Z0-9]+\/[a-zA-Z0-9\-\.]+$/,
            'Invalid MIME type format'
          ),

        size: Joi.number()
          .required()
          .positive()
          .max(50 * 1024 * 1024)
          .messages({
            'number.positive': 'File size must be positive',
            'number.max': 'File size must be less than 50MB',
          }),

        url: Joi.string()
          .required()
          .trim()
          .pattern(urlPattern, 'Invalid URL format'),

        uploadDate: Joi.date().default(() => new Date()),
      })
    )
    .max(10)
    .default([])
    .messages({
      'attachments.max': 'Maximum of 10 attachments allowed',
    }),

  notes: Joi.string()
    .optional()
    .trim()
    .max(2000, 'Notes must be less than 2000 characters')
    .allow(''),

  // Metadata
  source: Joi.string()
    .required()
    .valid('manual', 'api', 'import', 'bank_sync')
    .default('manual')
    .messages({
      'any.required': 'Transaction source is required',
      'any.only': 'Invalid transaction source',
    }),

  externalId: Joi.string()
    .optional()
    .trim()
    .max(100, 'External ID must be less than 100 characters')
    .allow(''),

  lastSyncedAt: Joi.date().optional().max(new Date()).messages({
    'date.max': 'Last synced date cannot be in the future',
  }),

  userId: Joi.string()
    .required()
    .pattern(objectIdPattern, 'Invalid user ID')
    .messages({
      'any.required': 'User ID is required',
    }),

  accountId: Joi.string()
    .required()
    .pattern(objectIdPattern, 'Invalid account ID')
    .messages({
      'any.required': 'Account ID is required',
    }),
});

// Create transaction validation schema
export const createTransactionSchema = baseTransactionSchema
  .fork(['userId', 'accountId'], schema => schema.optional())
  .messages({
    'object.unknown': 'Invalid fields provided',
  });

// Update transaction validation schema
export const updateTransactionSchema = baseTransactionSchema
  .fork(['userId', 'accountId'], schema => schema.forbidden())
  .fork(['id'], schema => schema.required())
  .messages({
    'object.unknown': 'Invalid fields provided',
    'any.forbidden': 'Cannot modify user or account ID',
    'any.required': 'Transaction ID is required',
  });

// Bulk transaction validation schema
export const bulkTransactionSchema = Joi.object({
  transactions: Joi.array()
    .items(createTransactionSchema)
    .min(1)
    .max(100)
    .required()
    .messages({
      'any.required': 'At least one transaction is required',
      'array.min': 'At least one transaction is required',
      'array.max': 'Maximum of 100 transactions allowed',
    }),
});

// Query validation schema for filtering transactions
export const queryTransactionSchema = Joi.object({
  // Pagination
  page: Joi.number().integer().min(1).default(1).messages({
    'number.integer': 'Page must be a whole number',
    'number.min': 'Page must be at least 1',
  }),

  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.integer': 'Limit must be a whole number',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must be less than 100',
  }),

  // Filtering
  type: Joi.string()
    .valid(...Object.values(TransactionType))
    .optional(),

  status: Joi.string()
    .valid(...Object.values(TransactionStatus))
    .optional(),

  categoryId: Joi.string()
    .pattern(objectIdPattern, 'Category ID must be a valid MongoDB ObjectId')
    .optional(),

  subcategoryId: Joi.string()
    .pattern(objectIdPattern, 'Subcategory ID must be a valid MongoDB ObjectId')
    .optional(),

  paymentMethod: Joi.string()
    .valid(...Object.values(PaymentMethod))
    .optional(),

  isRecurring: Joi.boolean().optional(),

  source: Joi.string().valid('manual', 'import', 'api', 'bank_sync').optional(),

  // Date range filtering
  startDate: Joi.date().optional().max(new Date()).messages({
    'date.max': 'Start date cannot be in the future',
  }),

  endDate: Joi.date()
    .optional()
    .min(Joi.ref('startDate'))
    .max(new Date())
    .messages({
      'date.min': 'End date must be after start date',
      'date.max': 'End date cannot be in the future',
    }),

  // Amount filtering
  minAmount: Joi.number().positive().optional().messages({
    'number.positive': 'Minimum amount must be positive',
  }),

  maxAmount: Joi.number()
    .positive()
    .min(Joi.ref('minAmount'))
    .optional()
    .messages({
      'number.positive': 'Maximum amount must be positive',
      'number.min': 'Maximum amount must be greater than minimum amount',
    }),

  // Search
  search: Joi.string()
    .optional()
    .trim()
    .min(1, 'Search term cannot be empty')
    .max(100, 'Search term must be less than 100 characters'),

  // Tags
  tags: Joi.array().items(Joi.string().trim()).optional(),

  // Sorting
  sortBy: Joi.string()
    .valid('date', 'amount', 'title', 'createdAt', 'updatedAt')
    .default('date'),

  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
});

// Recurring transaction validation schema
export const recurringTransactionSchema = Joi.object({
  transaction: createTransactionSchema.required(),
  pattern: Joi.string()
    .valid(...Object.values(RecurrencePattern))
    .required()
    .messages({
      'any.required': 'Recurrence pattern is required',
    }),
  endDate: Joi.date()
    .required()
    .greater(Joi.ref('...transaction.date'))
    .messages({
      'any.required': 'End date is required',
      'date.greater': 'End date must be after transaction date',
    }),
  interval: Joi.number().integer().min(1).default(1).messages({
    'number.integer': 'Interval must be a whole number',
    'number.min': 'Interval must be at least 1',
  }),
});

// Export all schemas
export const transactionValidation = {
  create: createTransactionSchema,
  update: updateTransactionSchema,
  bulk: bulkTransactionSchema,
  query: queryTransactionSchema,
  recurring: recurringTransactionSchema,
};

export default transactionValidation;
