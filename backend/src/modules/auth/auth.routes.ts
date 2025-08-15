import { Router, Request, Response, NextFunction } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { authenticateToken } from './auth.middleware';

const router = Router();
const authService = new AuthService();
const authController = new AuthController(authService);

// Helper function to wrap async controller methods
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Public routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/refresh-token', asyncHandler(authController.refreshToken));

// Protected routes
router.post('/logout', authenticateToken, asyncHandler(authController.logout));
router.get(
  '/profile',
  authenticateToken,
  asyncHandler(authController.getProfile)
);

export default router;
