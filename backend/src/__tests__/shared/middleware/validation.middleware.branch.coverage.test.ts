import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validateRequest, validateMultiple } from '../../../shared/middleware/validation.middleware';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

import { logger as mockLogger } from '../../../shared/services/logger.service';

describe('Validation Middleware - Branch Coverage', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      body: {},
      query: {},
      params: {},
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe('validateRequest', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      age: Joi.number().integer().min(0).max(120),
    });

    it('should validate body data successfully', () => {
      const middleware = validateRequest(schema, 'body');
      
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should validate query data successfully', () => {
      const middleware = validateRequest(schema, 'query');
      
      mockRequest.query = {
        name: 'John Doe',
        email: 'john@example.com',
        age: '30',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should validate params data successfully', () => {
      const middleware = validateRequest(schema, 'params');
      
      mockRequest.params = {
        name: 'John Doe',
        email: 'john@example.com',
        age: '30',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle validation errors with detailed messages', () => {
      const middleware = validateRequest(schema, 'body');
      
      mockRequest.body = {
        name: '',
        email: 'invalid-email',
        age: -5,
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'email',
            message: expect.any(String),
          }),
          expect.objectContaining({
            field: 'age',
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle missing required fields', () => {
      const middleware = validateRequest(schema, 'body');
      
      mockRequest.body = {};

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.stringContaining('required'),
          }),
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('required'),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle extra fields in data', () => {
      const strictSchema = Joi.object({
        name: Joi.string().required(),
      }).strict();

      const middleware = validateRequest(strictSchema, 'body');
      
      mockRequest.body = {
        name: 'John Doe',
        extraField: 'should not be here',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // With stripUnknown: true, extra fields are stripped and validation passes
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockRequest.body).toEqual({ name: 'John Doe' });
    });

    it('should handle different data types', () => {
      const typeSchema = Joi.object({
        string: Joi.string().required(),
        number: Joi.number().required(),
        boolean: Joi.boolean().required(),
        array: Joi.array().items(Joi.string()).required(),
        object: Joi.object({
          nested: Joi.string().required(),
        }).required(),
      });

      const middleware = validateRequest(typeSchema, 'body');
      
      mockRequest.body = {
        string: 'test',
        number: 42,
        boolean: true,
        array: ['item1', 'item2'],
        object: {
          nested: 'value',
        },
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle validation with custom options', () => {
      const customSchema = Joi.object({
        name: Joi.string().required(),
      });

      const middleware = validateRequest(customSchema, 'body');
      
      mockRequest.body = {
        name: 'John Doe',
        unknownField: 'will be stripped',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle validation errors with abortEarly: true', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
      });

      const middleware = validateRequest(schema, 'body');
      
      mockRequest.body = {
        name: '',
        email: 'invalid-email',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'name',
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle validation with different source types', () => {
      const sources = ['body', 'query', 'params', 'headers'] as const;
      
      sources.forEach(source => {
        const middleware = validateRequest(schema, source as 'body' | 'query' | 'params');
        
        (mockRequest as any)[source] = {
          name: 'John Doe',
          email: 'john@example.com',
          age: '30',
        };

        middleware(mockRequest as Request, mockResponse as Response, mockNext);
      });

      expect(mockNext).toHaveBeenCalledTimes(sources.length);
    });

    it('should handle empty data objects', () => {
      const middleware = validateRequest(schema, 'body');
      
      mockRequest.body = {};

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle null data', () => {
      const middleware = validateRequest(schema, 'body');
      
      mockRequest.body = null;

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle undefined data', () => {
      const middleware = validateRequest(schema, 'body');
      
      mockRequest.body = undefined;

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Joi treats undefined as valid, so validation should pass
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle complex nested validation', () => {
      const complexSchema = Joi.object({
        user: Joi.object({
          profile: Joi.object({
            personal: Joi.object({
              firstName: Joi.string().required(),
              lastName: Joi.string().required(),
            }).required(),
            contact: Joi.object({
              email: Joi.string().email().required(),
              phone: Joi.string().optional(),
            }).required(),
          }).required(),
        }).required(),
        preferences: Joi.object({
          notifications: Joi.boolean().default(true),
          theme: Joi.string().valid('light', 'dark').default('light'),
        }).optional(),
      });

      const middleware = validateRequest(complexSchema, 'body');
      
      mockRequest.body = {
        user: {
          profile: {
            personal: {
              firstName: 'John',
              lastName: 'Doe',
            },
            contact: {
              email: 'john@example.com',
              phone: '+1234567890',
            },
          },
        },
        preferences: {
          notifications: true,
          theme: 'dark',
        },
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle array validation', () => {
      const arraySchema = Joi.object({
        items: Joi.array().items(
          Joi.object({
            id: Joi.string().required(),
            name: Joi.string().required(),
            price: Joi.number().min(0).required(),
          })
        ).min(1).required(),
      });

      const middleware = validateRequest(arraySchema, 'body');
      
      mockRequest.body = {
        items: [
          { id: '1', name: 'Item 1', price: 10.99 },
          { id: '2', name: 'Item 2', price: 20.99 },
        ],
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle conditional validation', () => {
      const conditionalSchema = Joi.object({
        type: Joi.string().valid('individual', 'company').required(),
        name: Joi.string().required(),
        companyName: Joi.string().when('type', {
          is: 'company',
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        }),
        ssn: Joi.string().when('type', {
          is: 'individual',
          then: Joi.required(),
          otherwise: Joi.forbidden(),
        }),
      });

      const middleware = validateRequest(conditionalSchema, 'body');
      
      // Test individual type
      mockRequest.body = {
        type: 'individual',
        name: 'John Doe',
        ssn: '123-45-6789',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();

      // Reset mocks
      jest.clearAllMocks();
      mockNext = jest.fn();
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Test company type
      mockRequest.body = {
        type: 'company',
        name: 'Acme Corp',
        companyName: 'Acme Corporation',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('validateMultiple', () => {
    const schemas = {
      body: Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
      }),
      query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
      }),
      params: Joi.object({
        id: Joi.string().required(),
      }),
    };

    it('should validate multiple sources successfully', () => {
      const middleware = validateMultiple(schemas);
      
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      mockRequest.query = {
        page: '1',
        limit: '10',
      };
      mockRequest.params = {
        id: '123',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle validation errors in multiple sources', () => {
      const middleware = validateMultiple(schemas);
      
      mockRequest.body = {
        name: '',
        email: 'invalid-email',
      };
      mockRequest.query = {
        page: '0',
        limit: '200',
      };
      mockRequest.params = {};

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            source: 'body',
            field: 'name',
            message: expect.any(String),
          }),
          expect.objectContaining({
            source: 'body',
            field: 'email',
            message: expect.any(String),
          }),
          expect.objectContaining({
            source: 'query',
            field: 'page',
            message: expect.any(String),
          }),
          expect.objectContaining({
            source: 'query',
            field: 'limit',
            message: expect.any(String),
          }),
          expect.objectContaining({
            source: 'params',
            field: 'id',
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle partial validation success', () => {
      const middleware = validateMultiple(schemas);
      
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      mockRequest.query = {
        page: '0', // Invalid
        limit: '10',
      };
      mockRequest.params = {
        id: '123',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            source: 'query',
            field: 'page',
            message: expect.any(String),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty schemas object', () => {
      const middleware = validateMultiple({});
      
      mockRequest.body = { any: 'data' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle undefined schemas', () => {
      const middleware = validateMultiple({
        body: undefined as any,
        query: schemas.query,
      });
      
      mockRequest.body = { any: 'data' };
      mockRequest.query = { page: '1', limit: '10' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle null schemas', () => {
      const middleware = validateMultiple({
        body: null as any,
        query: schemas.query,
      });
      
      mockRequest.body = { any: 'data' };
      mockRequest.query = { page: '1', limit: '10' };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle complex nested validation across multiple sources', () => {
      const complexSchemas = {
        body: Joi.object({
          user: Joi.object({
            profile: Joi.object({
              firstName: Joi.string().required(),
              lastName: Joi.string().required(),
            }).required(),
          }).required(),
        }),
        query: Joi.object({
          include: Joi.array().items(Joi.string().valid('profile', 'settings')).default([]),
        }),
        params: Joi.object({
          userId: Joi.string().uuid().required(),
        }),
      };

      const middleware = validateMultiple(complexSchemas);
      
      mockRequest.body = {
        user: {
          profile: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
      };
      mockRequest.query = {
        include: ['profile', 'settings'],
      };
      mockRequest.params = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle validation with custom options for multiple sources', () => {
      const middleware = validateMultiple(schemas);
      
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        extraField: 'will be stripped',
      };
      mockRequest.query = {
        page: '1',
        limit: '10',
        extraQuery: 'will be stripped',
      };
      mockRequest.params = {
        id: '123',
        extraParam: 'will be stripped',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle validation errors with different error types', () => {
      const errorSchemas = {
        body: Joi.object({
          email: Joi.string().email().required(),
          age: Joi.number().integer().min(0).max(120).required(),
          status: Joi.string().valid('active', 'inactive').required(),
        }),
        query: Joi.object({
          sort: Joi.string().valid('asc', 'desc').required(),
          order: Joi.string().valid('name', 'date', 'amount').required(),
        }),
      };

      const middleware = validateMultiple(errorSchemas);
      
      mockRequest.body = {
        email: 'not-an-email',
        age: 'not-a-number',
        status: 'invalid-status',
      };
      mockRequest.query = {
        sort: 'invalid-sort',
        order: 'invalid-order',
      };

      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.objectContaining({
            source: 'body',
            field: 'email',
            message: expect.stringContaining('valid email'),
          }),
          expect.objectContaining({
            source: 'body',
            field: 'age',
            message: expect.stringContaining('number'),
          }),
          expect.objectContaining({
            source: 'body',
            field: 'status',
            message: expect.stringContaining('one of'),
          }),
          expect.objectContaining({
            source: 'query',
            field: 'sort',
            message: expect.stringContaining('one of'),
          }),
          expect.objectContaining({
            source: 'query',
            field: 'order',
            message: expect.stringContaining('one of'),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
