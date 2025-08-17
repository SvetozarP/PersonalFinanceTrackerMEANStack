import { AuthController } from '../../../modules/auth/auth.controller';
import { AuthService } from '../../../modules/auth/auth.service';
import { Request, Response, NextFunction } from 'express';

// Mock AuthService
jest.mock('../../../modules/auth/auth.service');
const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;

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
  let mockAuthServiceInstance: jest.Mocked<AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock AuthService instance
    mockAuthServiceInstance = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    } as any;

    mockAuthService.mockImplementation(() => mockAuthServiceInstance);

    authController = new AuthController(mockAuthServiceInstance);

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
        _id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        password: 'hashedPassword',
        comparePassword: jest.fn(),
        $assertPopulated: jest.fn(),
        $clearModifiedPaths: jest.fn(),
        $clone: jest.fn(),
        $getAllSubdocs: jest.fn(),
        $ignore: jest.fn(),
        $isDefault: jest.fn(),
        $isDeleted: jest.fn(),
        $isEmpty: jest.fn(),
        $isValid: jest.fn(),
        $locals: {},
        $op: null,
        $session: jest.fn(),
        $where: {},
        collection: {} as any,
        db: {} as any,
        delete: jest.fn(),
        deleteOne: jest.fn(),
        depopulate: jest.fn(),
        equals: jest.fn(),
        errors: {},
        get: jest.fn(),
        increment: jest.fn(),
        isDirectModified: jest.fn(),
        isInit: jest.fn(),
        isModified: jest.fn(),
        isSelected: jest.fn(),
        markModified: jest.fn(),
        modifiedPaths: jest.fn(),
        modelName: '',
        overwrite: jest.fn(),
        populate: jest.fn(),
        populated: jest.fn(),
        replaceOne: jest.fn(),
        resetModified: jest.fn(),
        save: jest.fn(),
        schema: {} as any,
        set: jest.fn(),
        toJSON: jest.fn(),
        toObject: jest.fn(),
        unmarkModified: jest.fn(),
        update: jest.fn(),
        validate: jest.fn(),
        validateSync: jest.fn(),
      } as any;

      mockRequest.body = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      mockAuthServiceInstance.register.mockResolvedValue(mockUser);

      await authController.register(
        mockRequest as TestRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthServiceInstance.register).toHaveBeenCalledWith(
        mockRequest.body
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: { user: mockUser },
      });
    });

    it('should handle validation errors', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
      };

      await authController.register(
        mockRequest as TestRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation error',
        errors: expect.arrayContaining([
          expect.stringContaining(
            'Password must be at least 8 characters long'
          ),
        ]),
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        password: 'hashedPassword',
        comparePassword: jest.fn(),
        $assertPopulated: jest.fn(),
        $clearModifiedPaths: jest.fn(),
        $clone: jest.fn(),
        $getAllSubdocs: jest.fn(),
        $ignore: jest.fn(),
        $isDefault: jest.fn(),
        $isDeleted: jest.fn(),
        $isEmpty: jest.fn(),
        $isValid: jest.fn(),
        $locals: {},
        $op: null,
        $session: jest.fn(),
        $where: {},
        collection: {} as any,
        db: {} as any,
        delete: jest.fn(),
        deleteOne: jest.fn(),
        depopulate: jest.fn(),
        equals: jest.fn(),
        errors: {},
        get: jest.fn(),
        increment: jest.fn(),
        isDirectModified: jest.fn(),
        isInit: jest.fn(),
        isModified: jest.fn(),
        isSelected: jest.fn(),
        markModified: jest.fn(),
        modifiedPaths: jest.fn(),
        modelName: '',
        overwrite: jest.fn(),
        populate: jest.fn(),
        populated: jest.fn(),
        replaceOne: jest.fn(),
        resetModified: jest.fn(),
        save: jest.fn(),
        schema: {} as any,
        set: jest.fn(),
        toJSON: jest.fn(),
        toObject: jest.fn(),
        unmarkModified: jest.fn(),
        update: jest.fn(),
        validate: jest.fn(),
        validateSync: jest.fn(),
      } as any;

      const mockTokens = {
        accessToken: 'access123',
        refreshToken: 'refresh123',
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      mockAuthServiceInstance.login.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      await authController.login(
        mockRequest as TestRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthServiceInstance.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: false,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: { user: mockUser, accessToken: mockTokens.accessToken },
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockTokens.refreshToken,
        expect.any(Object)
      );
    });

    it('should handle login errors', async () => {
      const mockError = new Error('Invalid email or password');
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockAuthServiceInstance.login.mockRejectedValue(mockError);

      await authController.login(
        mockRequest as TestRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
        errors: ['Invalid email or password'],
      });
    });
  });

  describe('logout', () => {
    it('should handle logout with user', () => {
      mockRequest.user = { userId: 'user123' };

      mockAuthServiceInstance.logout.mockReturnValue(undefined);

      authController.logout(
        mockRequest as TestRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthServiceInstance.logout).toHaveBeenCalledWith('user123');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
    });

    it('should handle logout without user', () => {
      mockRequest.user = undefined;

      authController.logout(
        mockRequest as TestRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout successful',
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockTokens = {
        accessToken: 'newAccess123',
        refreshToken: 'newRefresh123',
      };

      mockRequest.cookies = { refreshToken: 'oldRefresh123' };

      mockAuthServiceInstance.refreshToken.mockResolvedValue(mockTokens);

      await authController.refreshToken(
        mockRequest as TestRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthServiceInstance.refreshToken).toHaveBeenCalledWith(
        'oldRefresh123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: { accessToken: mockTokens.accessToken },
      });
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refreshToken',
        mockTokens.refreshToken,
        expect.any(Object)
      );
    });

    it('should handle refresh token errors', async () => {
      const mockError = new Error('Invalid refresh token');
      mockRequest.cookies = { refreshToken: 'invalidToken' };

      mockAuthServiceInstance.refreshToken.mockRejectedValue(mockError);

      await authController.refreshToken(
        mockRequest as TestRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid refresh token',
        errors: ['Invalid refresh token'],
      });
    });
  });

  describe('getProfile', () => {
    it('should get user profile successfully', () => {
      mockRequest.user = { userId: 'user123' };

      authController.getProfile(
        mockRequest as TestRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile retrieved successfully',
        data: { userId: 'user123' },
      });
    });

    it('should handle profile request without user', () => {
      mockRequest.user = undefined;

      authController.getProfile(
        mockRequest as TestRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not authenticated',
      });
    });
  });
});
