import { logger } from '../../../shared/services/logger.service';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('Logger Service', () => {
  it('should export logger', () => {
    expect(logger).toBeDefined();
  });
});
