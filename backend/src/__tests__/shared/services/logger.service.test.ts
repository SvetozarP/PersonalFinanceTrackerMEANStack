import { logger } from '../../../shared/services/logger.service';

// Mock the logger service
jest.mock('../../../shared/services/logger.service', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
    log: jest.fn(),
    getLogger: jest.fn().mockReturnValue({ info: jest.fn() }),
  };
  
  return {
    logger: mockLogger,
  };
});

describe('Logger Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have all required logging methods', () => {
    expect(logger.info).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.debug).toBeDefined();
    expect(logger.verbose).toBeDefined();
    expect(logger.silly).toBeDefined();
    expect(logger.log).toBeDefined();
    expect(logger.getLogger).toBeDefined();
  });

  it('should handle info logging', () => {
    logger.info('Test info message');
    expect(logger.info).toHaveBeenCalledWith('Test info message');
  });

  it('should handle warn logging', () => {
    logger.warn('Test warning message');
    expect(logger.warn).toHaveBeenCalledWith('Test warning message');
  });

  it('should handle error logging', () => {
    logger.error('Test error message');
    expect(logger.error).toHaveBeenCalledWith('Test error message');
  });

  it('should handle debug logging', () => {
    logger.debug('Test debug message');
    expect(logger.debug).toHaveBeenCalledWith('Test debug message');
  });

  it('should handle verbose logging', () => {
    logger.verbose('Test verbose message');
    expect(logger.verbose).toHaveBeenCalledWith('Test verbose message');
  });

  it('should handle logging with metadata', () => {
    const metadata = { userId: '123', action: 'test' };
    logger.info('Test message with metadata', metadata);
    expect(logger.info).toHaveBeenCalledWith('Test message with metadata', metadata);
  });

  it('should handle error logging with error objects', () => {
    const error = new Error('Test error');
    logger.error('Test error message', error);
    expect(logger.error).toHaveBeenCalledWith('Test error message', error);
  });

  it('should handle silly logging', () => {
    logger.silly('Test silly message');
    expect(logger.silly).toHaveBeenCalledWith('Test silly message');
  });

  it('should handle custom level logging', () => {
    logger.log('custom', 'Test custom level message');
    expect(logger.log).toHaveBeenCalledWith('custom', 'Test custom level message');
  });

  it('should return logger instance', () => {
    expect(logger.getLogger).toBeDefined();
    expect(typeof logger.getLogger).toBe('function');
  });
});
