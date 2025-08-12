import { authenticateToken, optionalAuth } from '../../../modules/auth/auth.middleware';
import { Request, Response, NextFunction } from 'express';

// Mock AuthService
jest.mock('../../../modules/auth/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    validateToken: jest.fn(),
  })),
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      headers: {},
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should be defined', () => {
      expect(authenticateToken).toBeDefined();
      expect(typeof authenticateToken).toBe('function');
    });
  });

  describe('optionalAuth', () => {
    it('should be defined', () => {
      expect(optionalAuth).toBeDefined();
      expect(typeof optionalAuth).toBe('function');
    });
  });
});
