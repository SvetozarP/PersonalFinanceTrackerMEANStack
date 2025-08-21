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
    .min(1)
    .max(200)
    .messages({
      'string.empty': 'Transaction title cannot be empty',
      'any.required': 'Transaction title is required',
      'string.min': 'Transaction title is required',
      'string.max': 'Transaction title must be less than 200 characters',
    }),

  description: Joi.string()
    .optional()
    .trim()
    .max(1000)
    .allow('', null)
    .messages({
      'string.max': 'Description must be less than 1000 characters',
    }),

  amount: Joi.number().required().positive().precision(2).messages({
    'any.required': 'Transaction amount is required',
    'number.positive': 'Transaction amount must be positive',
    'number.precision': 'Transaction amount must have 2 decimal places',
    'number.base': 'Transaction amount must be a valid number',
  }),

  currency: Joi.string()
    .optional()
    .trim()
    .pattern(currencyPattern)
    .uppercase()
    .default('GBP')
    .allow('', null)
    .messages({
      'string.pattern.base': 'Currency must be a valid 3-letter ISO code (e.g. GBP, USD, EUR)',
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
    .pattern(objectIdPattern)
    .messages({
      'any.required': 'Category ID is required',
      'string.pattern.base': 'Invalid category ID',
    }),

  subcategoryId: Joi.string()
    .optional()
    .pattern(objectIdPattern)
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Invalid subcategory ID',
    }),

  tags: Joi.array()
    .items(
              Joi.string()
          .trim()
          .max(50)
          .min(1)
        .messages({
          'string.max': 'Tag must be less than 50 characters',
        })
    )
    .max(20)
    .default([])
    .messages({
      'array.max': 'Maximum of 20 tags allowed',
    }),

  // Timing
  date: Joi.date()
    .optional()
    .max(new Date())
    .default(() => new Date())
    .messages({
      'date.max': 'Transaction date cannot be in the future',
    }),

  time: Joi.string()
    .optional()
    .pattern(timePattern)
    .allow(null)
    .custom((value, helpers) => {
      if (value === '') {
        return helpers.error('string.pattern.base');
      }
      return value;
    })
    .messages({
      'string.pattern.base': 'Time must be in HH:MM format (24 hour)',
    }),

  timezone: Joi.string()
    .default('Europe/London')
    .messages({
      'string.base': 'Timezone must be a string',
    }),

  // Location and Context
  location: Joi.object({
          name: Joi.string()
        .optional()
        .trim()
        .max(200)
        .allow('', null)
        .messages({
          'string.max': 'Location name must be less than 200 characters',
        }),

          address: Joi.string()
        .optional()
        .trim()
        .max(500)
        .allow('', null)
        .messages({
          'string.max': 'Address must be less than 500 characters',
        }),

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
      .max(100)
      .allow('')
      .messages({
        'string.max': 'Payment reference must be less than 100 characters',
      }),

      merchantName: Joi.string()
      .optional()
      .trim()
      .max(200)
      .allow('')
      .messages({
        'string.max': 'Merchant name must be less than 200 characters',
      }),

  merchantId: Joi.string()
    .optional()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Merchant ID must be less than 100 characters',
    })
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
      'any.required': 'Recurrence pattern is required when transaction is recurring',
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
          .min(1)
          .max(255)
          .messages({
            'string.min': 'Filename cannot be empty',
            'string.max': 'Filename must be less than 255 characters',
          }),

        originalName: Joi.string()
          .required()
          .trim()
          .min(1)
          .max(255)
          .messages({
            'string.min': 'Original name cannot be empty',
            'string.max': 'Original name must be less than 255 characters',
          }),

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
      'array.max': 'Maximum of 10 attachments allowed',
    }),

  notes: Joi.string()
    .optional()
    .trim()
    .max(2000)
    .messages({
      'string.max': 'Notes must be less than 2000 characters',
    })
    .allow('', null),

  // Metadata
  source: Joi.string()
    .optional()
    .valid('manual', 'api', 'import', 'bank_sync')
    .default('manual')
    .messages({
      'any.only': 'Invalid transaction source',
    }),

  externalId: Joi.string()
    .optional()
    .trim()
    .max(100)
    .messages({
      'string.max': 'External ID must be less than 100 characters',
    })
    .allow('', null),

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
  .fork(['userId', 'accountId'], schema => schema.optional());

// Update validation schema for updating existing transactions
export const updateTransactionSchema = Joi.object({
  _id: Joi.string()
    .optional()
    .pattern(objectIdPattern, 'Invalid transaction ID')
    .messages({
      'string.pattern.base': 'Invalid transaction ID',
    }),
  
  // Make all other fields optional for updates
  title: Joi.string()
    .optional()
    .trim()
    .min(1)
    .max(200)
    .custom((value, helpers) => {
      if (value === '') {
        return helpers.error('string.empty');
      }
      return value;
    })
    .messages({
      'string.empty': 'Transaction title cannot be empty',
      'string.min': 'Transaction title is required',
      'string.max': 'Transaction title must be less than 200 characters',
    }),

  description: Joi.string()
    .optional()
    .trim()
    .max(1000)
    .allow('', null)
    .messages({
      'string.max': 'Description must be less than 1000 characters',
    }),

  amount: Joi.number()
    .optional()
    .min(0.01)
    .precision(2)
    .messages({
      'number.min': 'Transaction amount must be positive',
      'number.precision': 'Transaction amount must have 2 decimal places',
      'number.base': 'Transaction amount must be a valid number',
    }),

  currency: Joi.string()
    .optional()
    .trim()
    .pattern(currencyPattern, 'Currency must be a valid 3-letter ISO code')
    .uppercase()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Currency must be a valid 3-letter ISO code (e.g. GBP, USD, EUR)',
    }),

  type: Joi.string()
    .optional()
    .valid(...Object.values(TransactionType))
    .messages({
      'any.only': 'Invalid transaction type',
    }),

  status: Joi.string()
    .optional()
    .valid(...Object.values(TransactionStatus))
    .messages({
      'any.only': 'Invalid transaction status',
    }),

  categoryId: Joi.string()
    .optional()
    .pattern(objectIdPattern, 'Invalid category ID')
    .allow('', null)
    .messages({
      'string.pattern.base': 'Invalid category ID',
    }),

  subcategoryId: Joi.string()
    .optional()
    .pattern(objectIdPattern, 'Invalid subcategory ID')
    .allow('', null)
    .messages({
      'string.pattern.base': 'Invalid subcategory ID',
    }),

  date: Joi.date()
    .optional()
    .max(new Date())
    .messages({
      'date.max': 'Transaction date cannot be in the future',
    }),

  time: Joi.string()
    .optional()
    .pattern(timePattern)
    .allow(null)
    .custom((value, helpers) => {
      if (value === '') {
        return helpers.error('string.pattern.base');
      }
      return value;
    })
    .messages({
      'string.pattern.base': 'Time must be in HH:MM format (24 hour)',
    }),

  timezone: Joi.string()
    .optional()
    .default('Europe/London')
    .messages({
      'string.base': 'Timezone must be a string',
    }),

  location: Joi.object({
    name: Joi.string()
      .optional()
      .trim()
      .max(200)
      .allow('', null)
      .messages({
        'string.max': 'Location name must be less than 200 characters',
      }),

    address: Joi.string()
      .optional()
      .trim()
      .max(500)
      .allow('', null)
      .messages({
        'string.max': 'Location address must be less than 500 characters',
      }),

    coordinates: Joi.object({
      latitude: Joi.number()
        .optional()
        .min(-90)
        .max(90)
        .messages({
          'number.min': 'Latitude must be between -90 and 90',
          'number.max': 'Latitude must be between -90 and 90',
        }),

      longitude: Joi.number()
        .optional()
        .min(-180)
        .max(180)
        .messages({
          'number.min': 'Longitude must be between -180 and 180',
          'number.max': 'Longitude must be between -180 and 180',
        }),
    }).optional(),
  }).optional(),

  notes: Joi.string()
    .optional()
    .trim()
    .max(1000)
    .allow('', null)
    .messages({
      'string.max': 'Notes must be less than 1000 characters',
    }),

  tags: Joi.array()
    .optional()
    .items(
      Joi.string()
        .trim()
        .min(1)
        .max(50)
        .messages({
          'string.min': 'Tag cannot be empty',
          'string.max': 'Tag must be less than 50 characters',
        })
    )
    .max(20)
    .messages({
      'array.max': 'Cannot have more than 20 tags',
    }),

  externalId: Joi.string()
    .optional()
    .trim()
    .max(200)
    .allow('', null)
    .messages({
      'string.max': 'External ID must be less than 200 characters',
    }),

  isRecurring: Joi.boolean().optional(),

  recurringPattern: Joi.object({
    frequency: Joi.string()
      .optional()
      .valid(...Object.values(RecurrencePattern))
      .messages({
        'any.only': 'Invalid recurring frequency',
      }),

    interval: Joi.number()
      .optional()
      .integer()
      .min(1)
      .max(365)
      .messages({
        'number.integer': 'Recurring interval must be a whole number',
        'number.min': 'Recurring interval must be at least 1',
        'number.max': 'Recurring interval must be at most 365',
      }),

    endDate: Joi.date()
      .optional()
      .min(Joi.ref('startDate'))
      .messages({
        'date.min': 'End date must be after start date',
      }),

    maxOccurrences: Joi.number()
      .optional()
      .integer()
      .min(1)
      .max(1000)
      .messages({
        'number.integer': 'Max occurrences must be a whole number',
        'number.min': 'Max occurrences must be at least 1',
        'number.max': 'Max occurrences must be at most 1000',
      }),
  }).optional(),

  source: Joi.string()
    .optional()
    .valid('manual', 'import', 'api', 'bank_sync')
    .default('manual')
    .messages({
      'any.only': 'Invalid source',
    }),

  paymentMethod: Joi.string()
    .optional()
    .valid(...Object.values(PaymentMethod))
    .messages({
      'any.only': 'Invalid payment method',
    }),
})
.messages({
  'object.unknown': 'Invalid fields provided',
})
.unknown(true); // Allow unknown fields to be stripped

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
    .min(1)
    .max(100)
    .messages({
      'string.empty': 'Search term cannot be empty',
      'string.min': 'Search term cannot be empty',
      'string.max': 'Search term must be less than 100 characters',
    }),

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
