import Joi from 'joi';
import mongoose from 'mongoose';

export const categoryValidation = {
  // Validation for creating a new category
  create: Joi.object({
    name: Joi.string().trim().min(1).max(100).required().messages({
      'string.empty': 'Category name cannot be empty',
      'string.min': 'Category name must be at least 1 character long',
      'string.max': 'Category name cannot exceed 100 characters',
      'any.required': 'Category name is required',
    }),
    description: Joi.string().trim().max(500).optional().messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
    color: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .optional()
      .messages({
        'string.pattern.base': 'Color must be a valid hex color code',
      }),
    icon: Joi.string().trim().max(50).optional().messages({
      'string.max': 'Icon name cannot exceed 50 characters',
    }),
    parentId: Joi.string()
      .custom((value, helpers) => {
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      })
      .optional()
      .messages({
        'any.invalid': 'Parent ID must be a valid MongoDB ObjectId',
      }),
  }),

  // Validation for updating a category
  update: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional().messages({
      'string.empty': 'Category name cannot be empty',
      'string.min': 'Category name must be at least 1 character long',
      'string.max': 'Category name cannot exceed 100 characters',
    }),
    description: Joi.string().trim().max(500).optional().messages({
      'string.max': 'Description cannot exceed 500 characters',
    }),
    color: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .optional()
      .messages({
        'string.pattern.base': 'Color must be a valid hex color code',
      }),
    icon: Joi.string().trim().max(50).optional().messages({
      'string.max': 'Icon name cannot exceed 50 characters',
    }),
    parentId: Joi.string()
      .custom((value, helpers) => {
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      })
      .optional()
      .messages({
        'any.invalid': 'Parent ID must be a valid MongoDB ObjectId',
      }),
    isActive: Joi.boolean().optional(),
  }),

  // Validation for category ID parameter
  id: Joi.object({
    id: Joi.string()
      .custom((value, helpers) => {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      })
      .required()
      .messages({
        'any.invalid': 'Category ID must be a valid MongoDB ObjectId',
        'any.required': 'Category ID is required',
      }),
  }),

  // Validation for query parameters
  query: Joi.object({
    parentId: Joi.string()
      .custom((value, helpers) => {
        if (value && !mongoose.Types.ObjectId.isValid(value)) {
          return helpers.error('any.invalid');
        }
        return value;
      })
      .optional()
      .messages({
        'any.invalid': 'Parent ID must be a valid MongoDB ObjectId',
      }),
    level: Joi.number().integer().min(0).optional().messages({
      'number.base': 'Level must be a number',
      'number.integer': 'Level must be an integer',
      'number.min': 'Level cannot be negative',
    }),
    isActive: Joi.boolean().optional(),
    search: Joi.string().trim().optional(),
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
  }),
};
