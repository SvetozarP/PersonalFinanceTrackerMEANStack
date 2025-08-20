import { validateRequest, validateMultiple } from '../../../shared/middleware/validation.middleware';
import { Schema } from 'joi';

// Mock the logger service
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Validation Middleware', () => {
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
      path: '/test',
      method: 'POST',
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('validateRequest', () => {
    const testSchema = {
      validate: jest.fn(),
    } as any;

    it('should pass validation for valid data', () => {
      const validData = { name: 'Test', email: 'test@example.com' };
      mockRequest.body = validData;

      testSchema.validate.mockReturnValue({
        error: null,
        value: validData,
      });

      validateRequest(testSchema, 'body')(mockRequest, mockResponse, mockNext);

      expect(mockRequest.body).toEqual(validData);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', () => {
      const invalidData = { name: 'Test' }; // email is missing
      mockRequest.body = invalidData;

      testSchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: ['email'],
              message: 'Email is required',
              type: 'any.required',
            },
          ],
        },
        value: invalidData,
      });

      validateRequest(testSchema, 'body')(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            field: 'email',
            message: 'Email is required',
            type: 'any.required',
          },
        ],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should validate query parameters', () => {
      const validQuery = { page: '1', limit: '10' };
      mockRequest.query = validQuery;

      testSchema.validate.mockReturnValue({
        error: null,
        value: validQuery,
      });

      validateRequest(testSchema, 'query')(mockRequest, mockResponse, mockNext);

      expect(mockRequest.query).toEqual(validQuery);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate route parameters', () => {
      const validParams = { id: '123' };
      mockRequest.params = validParams;

      testSchema.validate.mockReturnValue({
        error: null,
        value: validParams,
      });

      validateRequest(testSchema, 'params')(mockRequest, mockResponse, mockNext);

      expect(mockRequest.params).toEqual(validParams);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle validation errors gracefully', () => {
      const invalidData = { email: 'invalid-email' };
      mockRequest.body = invalidData;

      testSchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: ['email'],
              message: 'Invalid email format',
              type: 'string.email',
            },
          ],
        },
        value: invalidData,
      });

      validateRequest(testSchema, 'body')(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            field: 'email',
            message: 'Invalid email format',
            type: 'string.email',
          },
        ],
      });
    });

    it('should handle validation processing errors', () => {
      mockRequest.body = {};
      testSchema.validate.mockImplementation(() => {
        throw new Error('Validation processing error');
      });

      validateRequest(testSchema, 'body')(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation processing error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('validateMultiple', () => {
    const bodySchema = {
      validate: jest.fn(),
    } as any;

    const querySchema = {
      validate: jest.fn(),
    } as any;

    const paramsSchema = {
      validate: jest.fn(),
    } as any;

    it('should validate multiple sources successfully', () => {
      const validBody = { name: 'Test' };
      const validQuery = { page: '1' };
      const validParams = { id: '123' };

      mockRequest.body = validBody;
      mockRequest.query = validQuery;
      mockRequest.params = validParams;

      bodySchema.validate.mockReturnValue({ error: null, value: validBody });
      querySchema.validate.mockReturnValue({ error: null, value: validQuery });
      paramsSchema.validate.mockReturnValue({ error: null, value: validParams });

      validateMultiple({
        body: bodySchema,
        query: querySchema,
        params: paramsSchema,
      })(mockRequest, mockResponse, mockNext);

      expect(mockRequest.body).toEqual(validBody);
      expect(mockRequest.query).toEqual(validQuery);
      expect(mockRequest.params).toEqual(validParams);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle validation errors from multiple sources', () => {
      const invalidBody = {};
      const invalidQuery = {};

      mockRequest.body = invalidBody;
      mockRequest.query = invalidQuery;

      bodySchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: ['name'],
              message: 'Name is required',
              type: 'any.required',
            },
          ],
        },
        value: invalidBody,
      });

      querySchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: ['page'],
              message: 'Page is required',
              type: 'any.required',
            },
          ],
        },
        value: invalidQuery,
      });

      validateMultiple({
        body: bodySchema,
        query: querySchema,
      })(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            source: 'body',
            field: 'name',
            message: 'Name is required',
            type: 'any.required',
          },
          {
            source: 'query',
            field: 'page',
            message: 'Page is required',
            type: 'any.required',
          },
        ],
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should skip validation for undefined schemas', () => {
      const validBody = { name: 'Test' };
      mockRequest.body = validBody;

      bodySchema.validate.mockReturnValue({ error: null, value: validBody });

      validateMultiple({
        body: bodySchema,
        // query and params are undefined
      })(mockRequest, mockResponse, mockNext);

      expect(mockRequest.body).toEqual(validBody);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle validation processing errors gracefully', () => {
      mockRequest.body = {};
      bodySchema.validate.mockImplementation(() => {
        throw new Error('Validation processing error');
      });

      validateMultiple({
        body: bodySchema,
      })(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation processing error',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    const testSchema = {
      validate: jest.fn(),
    } as any;

    it('should handle null values', () => {
      mockRequest.body = null;

      testSchema.validate.mockReturnValue({
        error: null,
        value: null,
      });

      validateRequest(testSchema, 'body')(mockRequest, mockResponse, mockNext);

      expect(mockRequest.body).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle undefined values', () => {
      mockRequest.body = undefined;

      testSchema.validate.mockReturnValue({
        error: null,
        value: undefined,
      });

      validateRequest(testSchema, 'body')(mockRequest, mockResponse, mockNext);

      expect(mockRequest.body).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle empty objects', () => {
      mockRequest.body = {};

      testSchema.validate.mockReturnValue({
        error: null,
        value: {},
      });

      validateRequest(testSchema, 'body')(mockRequest, mockResponse, mockNext);

      expect(mockRequest.body).toEqual({});
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        user: {
          profile: {
            name: 'Test',
            address: {
              street: '123 Main St',
              city: 'Test City',
            },
          },
        },
        preferences: ['setting1', 'setting2'],
      };

      mockRequest.body = complexData;

      testSchema.validate.mockReturnValue({
        error: null,
        value: complexData,
      });

      validateRequest(testSchema, 'body')(mockRequest, mockResponse, mockNext);

      expect(mockRequest.body).toEqual(complexData);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle array validation', () => {
      const arrayData = ['item1', 'item2', 'item3'];
      mockRequest.body = arrayData;

      testSchema.validate.mockReturnValue({
        error: null,
        value: arrayData,
      });

      validateRequest(testSchema, 'body')(mockRequest, mockResponse, mockNext);

      expect(mockRequest.body).toEqual(arrayData);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle validation with custom error messages', () => {
      const invalidData = { age: 'invalid' };
      mockRequest.body = invalidData;

      testSchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: ['age'],
              message: 'Age must be a number',
              type: 'number.base',
            },
          ],
        },
        value: invalidData,
      });

      validateRequest(testSchema, 'body')(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            field: 'age',
            message: 'Age must be a number',
            type: 'number.base',
          },
        ],
      });
    });

    it('should handle multiple validation errors', () => {
      const invalidData = { name: '', email: 'invalid' };
      mockRequest.body = invalidData;

      testSchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: ['name'],
              message: 'Name is required',
              type: 'any.required',
            },
            {
              path: ['email'],
              message: 'Invalid email format',
              type: 'string.email',
            },
          ],
        },
        value: invalidData,
      });

      validateRequest(testSchema, 'body')(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            field: 'name',
            message: 'Name is required',
            type: 'any.required',
          },
          {
            field: 'email',
            message: 'Invalid email format',
            type: 'string.email',
          },
        ],
      });
    });

    it('should handle validation with nested field paths', () => {
      const invalidData = { user: { profile: { age: 'invalid' } } };
      mockRequest.body = invalidData;

      testSchema.validate.mockReturnValue({
        error: {
          details: [
            {
              path: ['user', 'profile', 'age'],
              message: 'Age must be a number',
              type: 'number.base',
            },
          ],
        },
        value: invalidData,
      });

      validateRequest(testSchema, 'body')(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: [
          {
            field: 'user.profile.age',
            message: 'Age must be a number',
            type: 'number.base',
          },
        ],
      });
    });
  });
});
