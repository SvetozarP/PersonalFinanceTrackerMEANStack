import Joi from 'joi';
import { Types } from 'mongoose';

// Validation schemas for budget operations
export const budgetValidation = {
  // Schema for creating a new budget
  createBudget: Joi.object({
    name: Joi.string().trim().min(1).max(200).required().messages({
      'string.empty': 'Budget name is required',
      'string.min': 'Budget name is required',
      'string.max': 'Budget name must be less than 200 characters',
      'any.required': 'Budget name is required',
    }),

    description: Joi.string().trim().max(1000).optional().allow('').messages({
      'string.max': 'Budget description must be less than 1000 characters',
    }),

    period: Joi.string()
      .valid('monthly', 'yearly', 'custom')
      .required()
      .messages({
        'any.only': 'Budget period must be monthly, yearly, or custom',
        'any.required': 'Budget period is required',
      }),

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

    totalAmount: Joi.number()
      .positive()
      .precision(2)
      .max(999999999.99)
      .required()
      .messages({
        'number.base': 'Total budget amount must be a valid number',
        'number.positive': 'Total budget amount must be greater than 0',
        'number.precision':
          'Total budget amount can have up to 2 decimal places',
        'number.max': 'Total budget amount cannot exceed 999,999,999.99',
        'any.required': 'Total budget amount is required',
      }),

    currency: Joi.string()
      .trim()
      .length(3)
      .uppercase()
      .pattern(/^[A-Z]{3}$/)
      .default('USD')
      .optional()
      .messages({
        'string.length': 'Currency code must be exactly 3 characters',
        'string.pattern.base': 'Currency code must be 3 uppercase letters',
      }),

    categoryAllocations: Joi.array()
      .items(
        Joi.object({
          categoryId: Joi.string()
            .custom((value: string, helpers) => {
              if (!Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
              }
              return value;
            }, 'valid ObjectId')
            .required()
            .messages({
              'any.invalid': 'Category ID must be a valid MongoDB ObjectId',
              'any.required': 'Category ID is required',
            }),

          allocatedAmount: Joi.number()
            .positive()
            .precision(2)
            .max(999999999.99)
            .required()
            .messages({
              'number.base': 'Allocated amount must be a valid number',
              'number.positive': 'Allocated amount must be greater than 0',
              'number.precision':
                'Allocated amount can have up to 2 decimal places',
              'number.max': 'Allocated amount cannot exceed 999,999,999.99',
              'any.required': 'Allocated amount is required',
            }),

          isFlexible: Joi.boolean().default(false).optional().messages({
            'boolean.base': 'isFlexible must be a boolean value',
          }),

          priority: Joi.number()
            .integer()
            .min(1)
            .max(10)
            .default(1)
            .optional()
            .messages({
              'number.base': 'Priority must be a valid number',
              'number.integer': 'Priority must be a whole number',
              'number.min': 'Priority must be at least 1',
              'number.max': 'Priority cannot exceed 10',
            }),
        })
      )
      .min(1)
      .required()
      .messages({
        'array.min': 'At least one category allocation is required',
        'any.required': 'Category allocations are required',
      }),

    alertThreshold: Joi.number()
      .min(0)
      .max(100)
      .default(80)
      .optional()
      .messages({
        'number.base': 'Alert threshold must be a valid number',
        'number.min': 'Alert threshold cannot be negative',
        'number.max': 'Alert threshold cannot exceed 100%',
      }),

    autoAdjust: Joi.boolean().default(false).optional().messages({
      'boolean.base': 'Auto-adjust must be a boolean value',
    }),

    allowRollover: Joi.boolean().default(false).optional().messages({
      'boolean.base': 'Allow rollover must be a boolean value',
    }),

    rolloverAmount: Joi.number()
      .min(0)
      .precision(2)
      .default(0)
      .optional()
      .messages({
        'number.base': 'Rollover amount must be a valid number',
        'number.min': 'Rollover amount cannot be negative',
        'number.precision': 'Rollover amount can have up to 2 decimal places',
      }),
  }).custom((value: any, helpers) => {
    // Custom validation: ensure total allocated amount doesn't exceed total budget
    const totalAllocated = value.categoryAllocations.reduce(
      (sum: number, allocation: any) => sum + allocation.allocatedAmount,
      0
    );

    if (totalAllocated > value.totalAmount) {
      return helpers.error('any.invalid', {
        message: 'Total allocated amount cannot exceed total budget amount',
      });
    }

    return value;
  }),

  // Schema for updating a budget
  updateBudget: Joi.object({
    name: Joi.string().trim().min(1).max(200).optional().messages({
      'string.empty': 'Budget name cannot be empty',
      'string.min': 'Budget name cannot be empty',
      'string.max': 'Budget name must be less than 200 characters',
    }),

    description: Joi.string().trim().max(1000).optional().allow('').messages({
      'string.max': 'Budget description must be less than 1000 characters',
    }),

    status: Joi.string()
      .valid('active', 'paused', 'completed', 'archived')
      .optional()
      .messages({
        'any.only': 'Status must be active, paused, completed, or archived',
      }),

    totalAmount: Joi.number()
      .positive()
      .precision(2)
      .max(999999999.99)
      .optional()
      .messages({
        'number.base': 'Total budget amount must be a valid number',
        'number.positive': 'Total budget amount must be greater than 0',
        'number.precision':
          'Total budget amount can have up to 2 decimal places',
        'number.max': 'Total budget amount cannot exceed 999,999,999.99',
      }),

    categoryAllocations: Joi.array()
      .items(
        Joi.object({
          categoryId: Joi.string()
            .custom((value, helpers) => {
              if (!Types.ObjectId.isValid(value)) {
                return helpers.error('any.invalid');
              }
              return value;
            }, 'valid ObjectId')
            .required()
            .messages({
              'any.invalid': 'Category ID must be a valid MongoDB ObjectId',
              'any.required': 'Category ID is required',
            }),

          allocatedAmount: Joi.number()
            .positive()
            .precision(2)
            .max(999999999.99)
            .required()
            .messages({
              'number.base': 'Allocated amount must be a valid number',
              'number.positive': 'Allocated amount must be greater than 0',
              'number.precision':
                'Allocated amount can have up to 2 decimal places',
              'number.max': 'Allocated amount cannot exceed 999,999,999.99',
              'any.required': 'Allocated amount is required',
            }),

          isFlexible: Joi.boolean().default(false).optional().messages({
            'boolean.base': 'isFlexible must be a boolean value',
          }),

          priority: Joi.number()
            .integer()
            .min(1)
            .max(10)
            .default(1)
            .optional()
            .messages({
              'number.base': 'Priority must be a valid number',
              'number.integer': 'Priority must be a whole number',
              'number.min': 'Priority must be at least 1',
              'number.max': 'Priority cannot exceed 10',
            }),
        })
      )
      .min(1)
      .optional()
      .messages({
        'array.min': 'At least one category allocation is required',
      }),

    alertThreshold: Joi.number().min(0).max(100).optional().messages({
      'number.base': 'Alert threshold must be a valid number',
      'number.min': 'Alert threshold cannot be negative',
      'number.max': 'Alert threshold cannot exceed 100%',
    }),

    autoAdjust: Joi.boolean().optional().messages({
      'boolean.base': 'Auto-adjust must be a boolean value',
    }),

    allowRollover: Joi.boolean().optional().messages({
      'boolean.base': 'Allow rollover must be a boolean value',
    }),

    rolloverAmount: Joi.number().min(0).precision(2).optional().messages({
      'number.base': 'Rollover amount must be a valid number',
      'number.min': 'Rollover amount cannot be negative',
      'number.precision': 'Rollover amount can have up to 2 decimal places',
    }),
  }).custom((value: any, helpers) => {
    // Custom validation: if categoryAllocations is provided, ensure total allocated doesn't exceed total budget
    if (value.categoryAllocations && value.totalAmount) {
      const totalAllocated = value.categoryAllocations.reduce(
        (sum: number, allocation: any) => sum + allocation.allocatedAmount,
        0
      );

      if (totalAllocated > value.totalAmount) {
        return helpers.error('any.invalid', {
          message: 'Total allocated amount cannot exceed total budget amount',
        });
      }
    }

    return value;
  }),

  // Schema for updating category allocation
  updateCategoryAllocation: Joi.object({
    allocatedAmount: Joi.number()
      .positive()
      .precision(2)
      .max(999999999.99)
      .required()
      .messages({
        'number.base': 'Allocated amount must be a valid number',
        'number.positive': 'Allocated amount must be greater than 0',
        'number.precision': 'Allocated amount can have up to 2 decimal places',
        'number.max': 'Allocated amount cannot exceed 999,999,999.99',
        'any.required': 'Allocated amount is required',
      }),

    isFlexible: Joi.boolean().optional().messages({
      'boolean.base': 'isFlexible must be a boolean value',
    }),

    priority: Joi.number().integer().min(1).max(10).optional().messages({
      'number.base': 'Priority must be a valid number',
      'number.integer': 'Priority must be a whole number',
      'number.min': 'Priority must be at least 1',
      'number.max': 'Priority cannot exceed 10',
    }),
  }),

  // Schema for budget filters
  budgetFilters: Joi.object({
    status: Joi.string()
      .valid('active', 'paused', 'completed', 'archived')
      .optional()
      .messages({
        'any.only': 'Status must be active, paused, completed, or archived',
      }),

    period: Joi.string()
      .valid('monthly', 'yearly', 'custom')
      .optional()
      .messages({
        'any.only': 'Period must be monthly, yearly, or custom',
      }),

    startDate: Joi.date().iso().optional().messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)',
    }),

    endDate: Joi.date().iso().optional().messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
    }),

    categoryId: Joi.string()
      .custom((value: string, helpers) => {
        if (!Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      }, 'valid ObjectId')
      .optional()
      .messages({
        'any.invalid': 'Category ID must be a valid MongoDB ObjectId',
      }),

    isActive: Joi.boolean().optional().messages({
      'boolean.base': 'isActive must be a boolean value',
    }),
  }),
};

// Export individual validation functions
export const validateBudgetInput = {
  createBudget: (data: any) => budgetValidation.createBudget.validate(data),
  updateBudget: (data: any) => budgetValidation.updateBudget.validate(data),
  updateCategoryAllocation: (data: any) =>
    budgetValidation.updateCategoryAllocation.validate(data),
  budgetFilters: (data: any) => budgetValidation.budgetFilters.validate(data),
};

export default budgetValidation;
