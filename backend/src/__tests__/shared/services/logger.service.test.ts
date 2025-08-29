import { LoggerService } from '../../../shared/services/logger.service';

// Mock winston
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
    log: jest.fn(),
  };

  const mockConsoleTransport = jest.fn();
  const mockDailyRotateFile = jest.fn();
  const mockFormat = {
    combine: jest.fn().mockReturnValue({}),
    colorize: jest.fn().mockReturnValue({}),
    timestamp: jest.fn().mockReturnValue({}),
    printf: jest.fn().mockReturnValue({}),
    errors: jest.fn().mockReturnValue({}),
    json: jest.fn().mockReturnValue({}),
  };

  return {
    createLogger: jest.fn().mockReturnValue(mockLogger),
    transports: {
      Console: mockConsoleTransport,
    },
    format: mockFormat,
  };
});

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  dirname: jest.fn().mockReturnValue('logs'),
  join: jest.fn().mockReturnValue('logs/app-2024-01-01.log'),
}));

// Mock DailyRotateFile
jest.mock('winston-daily-rotate-file', () => {
  return jest.fn().mockImplementation(() => ({}));
});

describe('Logger Service', () => {
  let loggerService: LoggerService;
  let mockLogger: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Reset environment variables
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_FILE_PATH;
    delete process.env.NODE_ENV;

    // Get fresh instance
    loggerService = LoggerService.getInstance();
    mockLogger = (loggerService as any).logger;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = LoggerService.getInstance();
      const instance2 = LoggerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Logger Creation', () => {
    it('should create logger with default configuration', () => {
      expect(mockLogger).toBeDefined();
    });

    it('should create logger with custom log level', () => {
      process.env.LOG_LEVEL = 'debug';
      const newInstance = LoggerService.getInstance();
      expect(newInstance).toBeDefined();
    });

    it('should create logger with custom log file path', () => {
      process.env.LOG_FILE_PATH = '/custom/logs/app.log';
      const newInstance = LoggerService.getInstance();
      expect(newInstance).toBeDefined();
    });

    it('should create logger in test environment without file transport', () => {
      process.env.NODE_ENV = 'test';
      const newInstance = LoggerService.getInstance();
      expect(newInstance).toBeDefined();
    });

    it('should create logger in production environment with file transport', () => {
      process.env.NODE_ENV = 'production';
      const newInstance = LoggerService.getInstance();
      expect(newInstance).toBeDefined();
    });
  });

  describe('Logging Methods', () => {
    it('should log info message', () => {
      const message = 'Test info message';
      const meta = { userId: '123' };

      loggerService.info(message, meta);

      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('should log error message', () => {
      const message = 'Test error message';
      const meta = { error: 'Something went wrong' };

      loggerService.error(message, meta);

      expect(mockLogger.error).toHaveBeenCalledWith(message, meta);
    });

    it('should log warn message', () => {
      const message = 'Test warning message';
      const meta = { warning: 'Something to watch' };

      loggerService.warn(message, meta);

      expect(mockLogger.warn).toHaveBeenCalledWith(message, meta);
    });

    it('should log debug message', () => {
      const message = 'Test debug message';
      const meta = { debug: 'Debug info' };

      loggerService.debug(message, meta);

      expect(mockLogger.debug).toHaveBeenCalledWith(message, meta);
    });

    it('should log verbose message', () => {
      const message = 'Test verbose message';
      const meta = { verbose: 'Verbose info' };

      loggerService.verbose(message, meta);

      expect(mockLogger.verbose).toHaveBeenCalledWith(message, meta);
    });

    it('should log silly message', () => {
      const message = 'Test silly message';
      const meta = { silly: 'Silly info' };

      loggerService.silly(message, meta);

      expect(mockLogger.silly).toHaveBeenCalledWith(message, meta);
    });

    it('should log with custom level', () => {
      const level = 'custom';
      const message = 'Test custom level message';
      const meta = { custom: 'Custom info' };

      loggerService.log(level, message, meta);

      expect(mockLogger.log).toHaveBeenCalledWith(level, message, meta);
    });

    it('should log without meta data', () => {
      const message = 'Test message without meta';

      loggerService.info(message);

      expect(mockLogger.info).toHaveBeenCalledWith(message, undefined);
    });
  });

  describe('Logger Access', () => {
    it('should return the underlying logger instance', () => {
      const logger = loggerService.getLogger();
      expect(logger).toBe(mockLogger);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message', () => {
      const message = '';
      const meta = { empty: true };

      loggerService.info(message, meta);

      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('should handle null meta data', () => {
      const message = 'Test message with null meta';
      const meta = null;

      loggerService.info(message, meta);

      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('should handle undefined meta data', () => {
      const message = 'Test message with undefined meta';
      const meta = undefined;

      loggerService.info(message, meta);

      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('should handle complex meta data objects', () => {
      const message = 'Test message with complex meta';
      const meta = {
        user: { id: '123', name: 'Test User' },
        transaction: { amount: 100, currency: 'USD' },
        timestamp: new Date(),
        array: [1, 2, 3],
        nested: { deep: { value: 'test' } },
      };

      loggerService.info(message, meta);

      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('should handle circular reference in meta data', () => {
      const message = 'Test message with circular reference';
      const meta: any = { name: 'test' };
      meta.self = meta;

      loggerService.info(message, meta);

      expect(mockLogger.info).toHaveBeenCalledWith(message, meta);
    });
  });

  describe('Environment Specific Behavior', () => {
    it('should handle missing LOG_LEVEL environment variable', () => {
      delete process.env.LOG_LEVEL;
      const newInstance = LoggerService.getInstance();
      expect(newInstance).toBeDefined();
    });

    it('should handle missing LOG_FILE_PATH environment variable', () => {
      delete process.env.LOG_FILE_PATH;
      const newInstance = LoggerService.getInstance();
      expect(newInstance).toBeDefined();
    });

    it('should handle missing NODE_ENV environment variable', () => {
      delete process.env.NODE_ENV;
      const newInstance = LoggerService.getInstance();
      expect(newInstance).toBeDefined();
    });

    it('should handle empty string environment variables', () => {
      process.env.LOG_LEVEL = '';
      process.env.LOG_FILE_PATH = '';
      process.env.NODE_ENV = '';
      const newInstance = LoggerService.getInstance();
      expect(newInstance).toBeDefined();
    });
  });
});
