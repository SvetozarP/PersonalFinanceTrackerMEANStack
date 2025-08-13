import {
  authenticateToken,
  optionalAuth,
  AuthenticatedRequest,
} from '../../../modules/auth/auth.middleware';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../../modules/auth/auth.service';

// Mock AuthService
jest.mock('../../../modules/auth/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    validateToken: jest.fn(),
  })),
}));

const mockAuthService = AuthService as jest.MockedClass<typeof AuthService>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockAuthServiceInstance: jest.Mocked<AuthService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthServiceInstance = {
      validateToken: jest.fn(),
    } as any;

    mockAuthService.mockImplementation(() => mockAuthServiceInstance);

    mockRequest = {
      headers: {},
      user: undefined,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token successfully', async () => {
      const token = 'valid-token';
      const decodedToken = { userId: 'user123' };

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthServiceInstance.validateToken.mockResolvedValue(decodedToken);

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthServiceInstance.validateToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(decodedToken);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no authorization header is provided', async () => {
      mockRequest.headers = {};

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token not provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is malformed', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat',
      };

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token not provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header has no token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token not provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 when token validation fails', async () => {
      const token = 'invalid-token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthServiceInstance.validateToken.mockRejectedValue(
        new Error('Invalid token')
      );

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token validation errors gracefully', async () => {
      const token = 'error-token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthServiceInstance.validateToken.mockRejectedValue(
        new Error('Database error')
      );

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired token',
      });
    });
  });

  describe('optionalAuth', () => {
    it('should set user when valid token is provided', async () => {
      const token = 'valid-token';
      const decodedToken = { userId: 'user123' };

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthServiceInstance.validateToken.mockResolvedValue(decodedToken);

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthServiceInstance.validateToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toEqual(decodedToken);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when no authorization header is provided', async () => {
      mockRequest.headers = {};

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthServiceInstance.validateToken).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when authorization header is malformed', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat',
      };

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthServiceInstance.validateToken).not.toHaveBeenCalled();
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without user when token validation fails', async () => {
      const token = 'invalid-token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthServiceInstance.validateToken.mockRejectedValue(
        new Error('Invalid token')
      );

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthServiceInstance.validateToken).toHaveBeenCalledWith(token);
      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle token validation errors gracefully and continue', async () => {
      const token = 'error-token';

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockAuthServiceInstance.validateToken.mockRejectedValue(
        new Error('Database error')
      );

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle empty token string gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      await optionalAuth(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockAuthServiceInstance.validateToken).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle authorization header with only Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Bearer',
      };

      await authenticateToken(
        mockRequest as AuthenticatedRequest,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token not provided',
      });
    });
  });
});
