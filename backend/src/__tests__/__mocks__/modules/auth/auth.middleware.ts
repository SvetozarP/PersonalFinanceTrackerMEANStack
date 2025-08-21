import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateToken = jest.fn((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Default behavior - always authenticate successfully
  req.user = { _id: 'mock-user-id' };
  next();
});

export const optionalAuth = jest.fn((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Default behavior - always pass through
  next();
});
