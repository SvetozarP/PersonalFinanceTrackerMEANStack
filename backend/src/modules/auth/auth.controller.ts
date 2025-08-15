import { Request, Response, NextFunction } from 'express';
import { AuthService, IRegisterData, ILoginCredentials } from './auth.service';
import { registerSchema, loginSchema } from './auth.validation';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate input
      const validationResult = registerSchema.validate(req.body);
      const { error, value } = validationResult;
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message),
        });
        return;
      }

      // Register user
      const user = await this.authService.register(value as IRegisterData);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { user },
      });
    } catch (error: unknown) {
      // Handle business logic errors with appropriate status codes
      if (
        error instanceof Error &&
        error.message === 'User with this email already exists'
      ) {
        res.status(400).json({
          success: false,
          message: error.message,
          errors: [error.message],
        });
        return;
      }

      // For other errors, pass to global error handler
      next(error);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate input
      const validationResult = loginSchema.validate(req.body);
      const { error, value } = validationResult;
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(detail => detail.message),
        });
        return;
      }

      // Login user
      const { user, tokens } = await this.authService.login(
        value as ILoginCredentials
      );

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: { user, accessToken: tokens.accessToken },
      });
    } catch (error: unknown) {
      // Handle business logic errors with appropriate status codes
      if (
        error instanceof Error &&
        (error.message === 'Invalid email or password' ||
          error.message === 'Account is deactivated')
      ) {
        res.status(400).json({
          success: false,
          message: error.message,
          errors: [error.message],
        });
        return;
      }

      // For other errors, pass to global error handler
      next(error);
    }
  };

  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { refreshToken } = req.cookies as { refreshToken?: string };

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'Refresh token not provided',
        });
        return;
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      // Set new refresh token in cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { accessToken: tokens.accessToken },
      });
    } catch (error: unknown) {
      // Handle business logic errors with appropriate status codes
      if (error instanceof Error && error.message === 'Invalid refresh token') {
        res.status(401).json({
          success: false,
          message: error.message,
          errors: [error.message],
        });
        return;
      }

      // For other errors, pass to global error handler
      next(error);
    }
  };

  logout = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (userId) {
        await this.authService.logout(userId);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };

  getProfile = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return Promise.resolve();
      }

      // Get user profile (you'll need to implement this in UserService)
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { userId },
      });
      return Promise.resolve();
    } catch (error) {
      next(error);
      return Promise.resolve();
    }
  };
}
