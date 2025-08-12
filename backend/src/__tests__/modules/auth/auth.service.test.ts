import { AuthService } from '../../../modules/auth/auth.service';

// Mock User model
jest.mock('../../../modules/users/user.model', () => ({
  User: {
    findOne: jest.fn(),
    findById: jest.fn(),
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

describe('Auth Service', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
    expect(authService).toBeInstanceOf(AuthService);
  });

  it('should have register method', () => {
    expect(typeof authService.register).toBe('function');
  });

  it('should have login method', () => {
    expect(typeof authService.login).toBe('function');
  });

  it('should have refreshToken method', () => {
    expect(typeof authService.refreshToken).toBe('function');
  });

  it('should have logout method', () => {
    expect(typeof authService.logout).toBe('function');
  });
});
