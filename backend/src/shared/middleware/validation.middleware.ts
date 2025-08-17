import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { logger } from '../services/logger.service';

/**
 * Middleware to validate request data using Joi schemas
 * @param schema - Joi validation schema
 * @param source - Source of data to validate ('body', 'query', 'params')
 */
export const validateRequest = (schema: Schema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = req[source];
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));

        logger.warn('Request validation failed', {
          source,
          path: req.path,
          method: req.method,
          errors: errors.map(e => `${e.field}: ${e.message}`)
        });

        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors
        });
        return;
      }

      // Replace the original data with validated and sanitized data
      req[source] = value;
      next();
    } catch (validationError) {
      logger.error('Validation middleware error', {
        error: String(validationError),
        source,
        path: req.path,
        method: req.method
      });

      res.status(500).json({
        success: false,
        message: 'Validation processing error'
      });
    }
  };
};

/**
 * Middleware to validate multiple sources at once
 * @param schemas - Object with source keys and corresponding Joi schemas
 */
export const validateMultiple = (schemas: {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors: any[] = [];

      // Validate each source if schema is provided
      if (schemas.body) {
        const { error, value } = schemas.body.validate(req.body, {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });
        if (error) {
          errors.push(...error.details.map(detail => ({
            source: 'body',
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type
          })));
        } else {
          req.body = value;
        }
      }

      if (schemas.query) {
        const { error, value } = schemas.query.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });
        if (error) {
          errors.push(...error.details.map(detail => ({
            source: 'query',
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type
          })));
        } else {
          req.query = value;
        }
      }

      if (schemas.params) {
        const { error, value } = schemas.params.validate(req.params, {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });
        if (error) {
          errors.push(...error.details.map(detail => ({
            source: 'params',
            field: detail.path.join('.'),
            message: detail.message,
            type: detail.type
          })));
        } else {
          req.params = value;
        }
      }

      if (errors.length > 0) {
        logger.warn('Multiple validation sources failed', {
          path: req.path,
          method: req.method,
          errors: errors.map(e => `${e.source}.${e.field}: ${e.message}`)
        });

        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors
        });
        return;
      }

      next();
    } catch (validationError) {
      logger.error('Multiple validation middleware error', {
        error: String(validationError),
        path: req.path,
        method: req.method
      });

      res.status(500).json({
        success: false,
        message: 'Validation processing error'
      });
    }
  };
};