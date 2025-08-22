import { AuthController } from '../../../modules/auth/auth.controller';
import { AuthService } from '../../../modules/auth/auth.service';
import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../../../modules/auth/auth.validation';
import mongoose from 'mongoose';

// Mock AuthService
jest.mock('../../../modules/auth/auth.service');

// Mock validation schemas
jest.mock('../../../modules/auth/auth.validation', () => ({
  registerSchema: {
    validate: jest.fn(),
  },
  loginSchema: {
    validate: jest.fn(),
  },
}));

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Extended Request interface for testing
interface TestRequest extends Request {
  user?: { userId: string };
}

describe('Auth Controller', () => {
  let authController: AuthController;
  let mockRequest: Partial<TestRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockAuthService: jest.Mocked<AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock AuthService instance
    mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      validateToken: jest.fn(),
    } as any;

    // Mock the AuthService constructor to return our mock instance
    (AuthService as jest.MockedClass<typeof AuthService>).mockImplementation(() => mockAuthService);

    authController = new AuthController(mockAuthService);

    // Setup mock request and response
    mockRequest = {
      body: {},
      cookies: {},
      headers: {},
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = { 
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const mockRegisterData = { email: 'test@example.com', password: 'password123', firstName: 'Test', lastName: 'User' };

      (registerSchema.validate as jest.Mock).mockReturnValue({
        error: null,
        value: mockRegisterData,
      });
      mockAuthService.register.mockResolvedValue(mockUser as any);

      const req = { body: mockRegisterData } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: { user: mockUser },
      });
    });

    it('should handle validation errors', async () => {
      const validationError = {
        error: {
          details: [{ message: 'Email is required' }],
        },
      };

      (registerSchema.validate as jest.Mock).mockReturnValue(validationError);

      const req = { body: {} } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: ['Email is required'],
      });
    });

    it('should handle user already exists error', async () => {
      const mockRegisterData = { email: 'test@example.com', password: 'password123' };
      const mockError = new Error('User with this email already exists');

      (registerSchema.validate as jest.Mock).mockReturnValue({
        error: null,
        value: mockRegisterData,
      });
      mockAuthService.register.mockRejectedValue(mockError);

      const req = { body: mockRegisterData } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists',
        errors: ['User with this email already exists'],
      });
    });

    it('should handle other errors by passing to next', async () => {
      const mockRegisterData = { email: 'test@example.com', password: 'password123' };
      const mockError = new Error('Database error');

      (registerSchema.validate as jest.Mock).mockReturnValue({
        error: null,
        value: mockRegisterData,
      });
      mockAuthService.register.mockRejectedValue(mockError);

      const req = { body: mockRegisterData } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });

    it('should handle validation errors with multiple details', async () => {
      const validationError = {
        error: {
          details: [
            { message: 'Email is required' },
            { message: 'Password is required' },
          ],
        },
      };

      (registerSchema.validate as jest.Mock).mockReturnValue(validationError);

      const req = { body: {} } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: ['Email is required', 'Password is required'],
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = { 
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const mockTokens = { accessToken: 'access123', refreshToken: 'refresh123' };
      const mockLoginData = { email: 'test@example.com', password: 'password123' };

      (loginSchema.validate as jest.Mock).mockReturnValue({
        error: null,
        value: mockLoginData,
      });
      mockAuthService.login.mockResolvedValue({ user: mockUser, tokens: mockTokens });

      const req = { body: mockLoginData } as Request;
      const res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn(),
        cookie: jest.fn(),
      } as any;
      const next = jest.fn();

      // Mock process.env.NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await authController.login(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh123', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: { user: mockUser, accessToken: 'access123' },
      });

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle validation errors during login', async () => {
      const validationError = {
        error: {
          details: [{ message: 'Email is required' }],
        },
      };

      (loginSchema.validate as jest.Mock).mockReturnValue(validationError);

      const req = { body: {} } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: ['Email is required'],
      });
    });

    it('should handle invalid email or password error', async () => {
      const mockLoginData = { email: 'test@example.com', password: 'wrongpassword' };
      const mockError = new Error('Invalid email or password');

      (loginSchema.validate as jest.Mock).mockReturnValue({
        error: null,
        value: mockLoginData,
      });
      mockAuthService.login.mockRejectedValue(mockError);

      const req = { body: mockLoginData } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
        errors: ['Invalid email or password'],
      });
    });

    it('should handle account deactivated error', async () => {
      const mockLoginData = { email: 'test@example.com', password: 'password123' };
      const mockError = new Error('Account is deactivated');

      (loginSchema.validate as jest.Mock).mockReturnValue({
        error: null,
        value: mockLoginData,
      });
      mockAuthService.login.mockRejectedValue(mockError);

      const req = { body: mockLoginData } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is deactivated',
        errors: ['Account is deactivated'],
      });
    });

    it('should handle other login errors by passing to next', async () => {
      const mockLoginData = { email: 'test@example.com', password: 'password123' };
      const mockError = new Error('Database error');

      (loginSchema.validate as jest.Mock).mockReturnValue({
        error: null,
        value: mockLoginData,
      });
      mockAuthService.login.mockRejectedValue(mockError);

      const req = { body: mockLoginData } as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });

    it('should set secure cookie in production environment', async () => {
      const mockUser = { 
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const mockTokens = { accessToken: 'access123', refreshToken: 'refresh123' };
      const mockLoginData = { email: 'test@example.com', password: 'password123' };

      (loginSchema.validate as jest.Mock).mockReturnValue({
        error: null,
        value: mockLoginData,
      });
      mockAuthService.login.mockResolvedValue({ user: mockUser, tokens: mockTokens });

      const req = { body: mockLoginData } as Request;
      const res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn(),
        cookie: jest.fn(),
      } as any;
      const next = jest.fn();

      // Mock process.env.NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      await authController.login(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh123', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockTokens = { accessToken: 'newAccess123', refreshToken: 'newRefresh123' };

      mockAuthService.refreshToken.mockResolvedValue(mockTokens);

      const req = { cookies: { refreshToken: 'oldRefresh123' } } as any;
      const res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn(),
        cookie: jest.fn(),
      } as any;
      const next = jest.fn();

      // Mock process.env.NODE_ENV
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      await authController.refreshToken(req, res, next);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'newRefresh123', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: { accessToken: 'newAccess123' },
      });

      // Restore original env
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle missing refresh token', async () => {
      const req = { cookies: {} } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Refresh token not provided',
      });
    });

    it('should handle invalid refresh token error', async () => {
      const mockError = new Error('Invalid refresh token');

      mockAuthService.refreshToken.mockRejectedValue(mockError);

      const req = { cookies: { refreshToken: 'invalidToken' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid refresh token',
        errors: ['Invalid refresh token'],
      });
    });

    it('should handle other refresh token errors by passing to next', async () => {
      const mockError = new Error('Database error');

      mockAuthService.refreshToken.mockRejectedValue(mockError);

      const req = { cookies: { refreshToken: 'validToken' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.refreshToken(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });

    it('should handle undefined cookies', async () => {
      const req = { cookies: {} } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Refresh token not provided',
      });
    });

    it('should handle empty refresh token string', async () => {
      const req = { cookies: { refreshToken: '' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Refresh token not provided',
      });
    });
  });

  describe('logout', () => {
    it('should handle logout with user', async () => {
      const req = { user: { userId: '123' } } as any;
      const res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn(),
        clearCookie: jest.fn(),
      } as any;
      const next = jest.fn();

      await authController.logout(req, res, next);

      expect(mockAuthService.logout).toHaveBeenCalledWith('123');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });

    it('should handle logout without user', async () => {
      const req = { user: undefined } as any;
      const res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn(),
        clearCookie: jest.fn(),
      } as any;
      const next = jest.fn();

      await authController.logout(req, res, next);

      expect(mockAuthService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', async () => {
      const req = { user: { userId: '123' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile retrieved successfully',
        data: { userId: '123' },
      });
    });

    it('should handle profile request without user', async () => {
      const req = { user: undefined } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      await authController.getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not authenticated',
      });
    });

    it('should handle profile errors by passing to next', async () => {
      const mockError = new Error('Profile retrieval failed');

      const req = { user: { userId: '123' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      const next = jest.fn();

      // Mock the response methods to throw an error
      res.status.mockImplementation(() => {
        throw mockError;
      });

      await authController.getProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
});
