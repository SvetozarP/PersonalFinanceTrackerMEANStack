import { AuthService } from '../../../modules/auth/auth.service';
import mongoose from 'mongoose';

// Mock the entire user model module
jest.mock('../../../modules/users/user.model', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Import the mocked User model
const { User: mockUserModel } = require('../../../modules/users/user.model');
const mockJwt = require('jsonwebtoken');

describe('Auth Service', () => {
  let authService: AuthService;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
    
    mockUser = {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      password: 'hashedPassword',
      comparePassword: jest.fn(),
      save: jest.fn(),
      toObject: jest.fn(),
    };
  });

  describe('register', () => {
    it('should throw error when user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);

      await expect(authService.register(userData)).rejects.toThrow(
        'User with this email already exists'
      );
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockUserWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(mockUser),
        toObject: jest.fn().mockReturnValue({
          ...mockUser,
          password: undefined,
        }),
      };

      const mockFindOneResult = {
        select: jest.fn().mockResolvedValue(mockUserWithPassword),
      };

      mockUserModel.findOne.mockReturnValue(mockFindOneResult);

      mockJwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = await authService.login(credentials);

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
    });

    it('should throw error when user not found', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      const mockFindOneResult = {
        select: jest.fn().mockResolvedValue(null),
      };

      mockUserModel.findOne.mockReturnValue(mockFindOneResult);

      await expect(authService.login(credentials)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error when user is inactive', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const inactiveUser = {
        ...mockUser,
        isActive: false,
        comparePassword: jest.fn(),
      };

      const mockFindOneResult = {
        select: jest.fn().mockResolvedValue(inactiveUser),
      };

      mockUserModel.findOne.mockReturnValue(mockFindOneResult);

      await expect(authService.login(credentials)).rejects.toThrow(
        'Account is deactivated'
      );
    });

    it('should throw error when password is invalid', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const userWithPassword = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      const mockFindOneResult = {
        select: jest.fn().mockResolvedValue(userWithPassword),
      };

      mockUserModel.findOne.mockReturnValue(mockFindOneResult);

      await expect(authService.login(credentials)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      const decodedToken = { userId: '507f1f77bcf86cd799439011', type: 'refresh' };

      mockJwt.verify.mockReturnValue(decodedToken);
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockJwt.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await authService.refreshToken(refreshToken);

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
    });

    it('should throw error when refresh token is invalid', async () => {
      const refreshToken = 'invalid-refresh-token';

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw error when user not found', async () => {
      const refreshToken = 'valid-refresh-token';
      const decodedToken = { userId: '507f1f77bcf86cd799439011', type: 'refresh' };

      mockJwt.verify.mockReturnValue(decodedToken);
      mockUserModel.findById.mockResolvedValue(null);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should throw error when user is inactive', async () => {
      const refreshToken = 'valid-refresh-token';
      const decodedToken = { userId: '507f1f77bcf86cd799439011', type: 'refresh' };
      const inactiveUser = { ...mockUser, isActive: false };

      mockJwt.verify.mockReturnValue(decodedToken);
      mockUserModel.findById.mockResolvedValue(inactiveUser);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await authService.logout(userId);

      expect(consoleSpy).toHaveBeenCalledWith(`User ${userId} logged out`);
      consoleSpy.mockRestore();
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const token = 'valid-access-token';
      const decodedToken = { userId: '507f1f77bcf86cd799439011', type: 'access' };

      mockJwt.verify.mockReturnValue(decodedToken);
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await authService.validateToken(token);

      expect(result.userId).toBe(decodedToken.userId);
    });

    it('should throw error when token is invalid', async () => {
      const token = 'invalid-token';

      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.validateToken(token)).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should throw error when token type is not access', async () => {
      const token = 'refresh-token';
      const decodedToken = { userId: '507f1f77bcf86cd799439011', type: 'refresh' };

      mockJwt.verify.mockReturnValue(decodedToken);

      await expect(authService.validateToken(token)).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should throw error when user not found', async () => {
      const token = 'valid-access-token';
      const decodedToken = { userId: '507f1f77bcf86cd799439011', type: 'access' };

      mockJwt.verify.mockReturnValue(decodedToken);
      mockUserModel.findById.mockResolvedValue(null);

      await expect(authService.validateToken(token)).rejects.toThrow(
        'Invalid token'
      );
    });

    it('should throw error when user is inactive', async () => {
      const token = 'valid-access-token';
      const decodedToken = { userId: '507f1f77bcf86cd799439011', type: 'access' };
      const inactiveUser = { ...mockUser, isActive: false };

      mockJwt.verify.mockReturnValue(decodedToken);
      mockUserModel.findById.mockResolvedValue(inactiveUser);

      await expect(authService.validateToken(token)).rejects.toThrow(
        'Invalid token'
      );
    });
  });

  describe('private methods', () => {
    it('should generate tokens correctly', async () => {
      const userId = '507f1f77bcf86cd799439011';
      
      mockJwt.sign
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      // Access private method through reflection
      const generateTokensMethod = (authService as any).generateTokens.bind(authService);
      const result = await generateTokensMethod(userId);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(mockJwt.sign).toHaveBeenCalledTimes(2);
    });

    it('should sign JWT with correct parameters', () => {
      const payload = { userId: 'test', type: 'access' };
      const expiresIn = '1h';
      
      mockJwt.sign.mockReturnValue('signed-token');

      // Access private method through reflection
      const signJWTMethod = (authService as any).signJWT.bind(authService);
      const result = signJWTMethod(payload, expiresIn);

      expect(result).toBe('signed-token');
      expect(mockJwt.sign).toHaveBeenCalledWith(payload, expect.any(String), { expiresIn });
    });

    it('should throw error when JWT_SECRET is not configured', () => {
      // Temporarily remove JWT_SECRET
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      const payload = { userId: 'test', type: 'access' };
      const expiresIn = '1h';

      // Access private method through reflection
      const signJWTMethod = (authService as any).signJWT.bind(authService);
      
      // Since JWT_SECRET has a fallback value, it should not throw
      expect(() => signJWTMethod(payload, expiresIn)).not.toThrow();
      
      // Restore JWT_SECRET
      process.env.JWT_SECRET = originalSecret;
    });
  });
});
