import mongoose from 'mongoose';
import { DatabaseConnection, databaseConnection } from '../../config/database';
import { logger } from '../../shared/services/logger.service';
import { config } from '../../config/environment';

// Mock dependencies
jest.mock('mongoose');
jest.mock('../../shared/services/logger.service');
jest.mock('../../config/environment');

const mockMongoose = mongoose as jest.Mocked<typeof mongoose>;
const mockLogger = logger as jest.Mocked<typeof logger>;
const mockConfig = config as jest.Mocked<typeof config>;

describe('DatabaseConnection', () => {
  let dbInstance: DatabaseConnection;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the singleton instance for each test
    (DatabaseConnection as any).instance = undefined;
    dbInstance = DatabaseConnection.getInstance();

    // Mock config values
    mockConfig.MONGO_URI = 'mongodb://localhost:27017/test_db';
    mockConfig.MONGO_ROOT_USERNAME = 'testuser';
    mockConfig.MONGO_ROOT_PASSWORD = 'testpass';
    mockConfig.MONGO_DATABASE = 'test_db';

    // Mock mongoose connection object
    const mockConnection: any = {
      readyState: 1,
    };
    mockConnection.on = jest.fn().mockReturnValue(mockConnection);

    // Mock the connection property
    Object.defineProperty(mockMongoose, 'connection', {
      value: mockConnection,
      writable: true,
      configurable: true,
    });

    // Mock process events - don't actually set up SIGINT handler during test setup
    jest.spyOn(process, 'on').mockImplementation((event, callback) => {
      if (event === 'SIGINT') {
        // Store the callback for manual triggering if needed
        (process as any).sigintCallback = callback;
      }
      return process;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DatabaseConnection.getInstance();
      const instance2 = DatabaseConnection.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should export a singleton instance', () => {
      expect(databaseConnection).toBeInstanceOf(DatabaseConnection);
    });
  });

  describe('connect', () => {
    it('should connect successfully with complete MongoDB URI', async () => {
      mockConfig.MONGO_URI = 'mongodb://user:pass@localhost:27017/test_db';
      mockMongoose.connect.mockResolvedValue(undefined as any);

      await dbInstance.connect();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://user:pass@localhost:27017/test_db',
        {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          bufferCommands: false,
        }
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '✅ MongoDB connected successfully'
      );
      expect(dbInstance.getConnectionStatus()).toBe(true);
    });

    it('should build MongoDB URI from separate config values', async () => {
      mockConfig.MONGO_URI = 'mongodb://localhost:27017/test_db'; // No @ symbol
      mockMongoose.connect.mockResolvedValue(undefined as any);

      await dbInstance.connect();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://testuser:testpass@localhost:27017/test_db?authSource=admin',
        expect.any(Object)
      );
    });

    it('should not connect if already connected', async () => {
      mockMongoose.connect.mockResolvedValue(undefined as any);

      // First connection
      await dbInstance.connect();
      expect(mockMongoose.connect).toHaveBeenCalledTimes(1);

      // Second connection attempt
      await dbInstance.connect();
      expect(mockMongoose.connect).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Database already connected'
      );
    });

    it('should handle connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockMongoose.connect.mockRejectedValue(connectionError);

      await expect(dbInstance.connect()).rejects.toThrow('Connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to connect to MongoDB:',
        connectionError
      );
      expect(dbInstance.getConnectionStatus()).toBe(false);
    });

    it('should set up event listeners', async () => {
      mockMongoose.connect.mockResolvedValue(undefined as any);

      await dbInstance.connect();

      expect(mockMongoose.connection.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      );
      expect(mockMongoose.connection.on).toHaveBeenCalledWith(
        'disconnected',
        expect.any(Function)
      );
      expect(mockMongoose.connection.on).toHaveBeenCalledWith(
        'reconnected',
        expect.any(Function)
      );
    });

    it('should handle connection error event', async () => {
      mockMongoose.connect.mockResolvedValue(undefined as any);
      let errorHandler: Function;

      (mockMongoose.connection.on as jest.Mock).mockImplementation(
        (event: string, handler: Function) => {
          if (event === 'error') {
            errorHandler = handler;
          }
          return mockMongoose.connection;
        }
      );

      await dbInstance.connect();

      // Simulate connection error
      const testError = new Error('Connection lost');
      errorHandler!(testError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'MongoDB connection error:',
        testError
      );
      expect(dbInstance.getConnectionStatus()).toBe(false);
    });

    it('should handle disconnection event', async () => {
      mockMongoose.connect.mockResolvedValue(undefined as any);
      let disconnectedHandler: Function;

      (mockMongoose.connection.on as jest.Mock).mockImplementation(
        (event: string, handler: Function) => {
          if (event === 'disconnected') {
            disconnectedHandler = handler;
          }
          return mockMongoose.connection;
        }
      );

      await dbInstance.connect();

      // Simulate disconnection
      disconnectedHandler!();

      expect(mockLogger.warn).toHaveBeenCalledWith('MongoDB disconnected');
      expect(dbInstance.getConnectionStatus()).toBe(false);
    });

    it('should handle reconnection event', async () => {
      mockMongoose.connect.mockResolvedValue(undefined as any);
      let reconnectedHandler: Function;

      (mockMongoose.connection.on as jest.Mock).mockImplementation(
        (event: string, handler: Function) => {
          if (event === 'reconnected') {
            reconnectedHandler = handler;
          }
          return mockMongoose.connection;
        }
      );

      await dbInstance.connect();

      // Simulate reconnection
      reconnectedHandler!();

      expect(mockLogger.info).toHaveBeenCalledWith('MongoDB reconnected');
      expect(dbInstance.getConnectionStatus()).toBe(true);
    });

    it('should set up SIGINT handler for graceful shutdown', async () => {
      mockMongoose.connect.mockResolvedValue(undefined as any);
      mockMongoose.disconnect.mockResolvedValue(undefined as any);

      await dbInstance.connect();

      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      mockMongoose.connect.mockResolvedValue(undefined as any);
      mockMongoose.disconnect.mockResolvedValue(undefined as any);

      // Connect first
      await dbInstance.connect();
      expect(dbInstance.getConnectionStatus()).toBe(true);

      // Then disconnect
      await dbInstance.disconnect();

      expect(mockMongoose.disconnect).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('MongoDB disconnected');
      expect(dbInstance.getConnectionStatus()).toBe(false);
    });

    it('should not disconnect if not connected', async () => {
      await dbInstance.disconnect();

      expect(mockMongoose.disconnect).not.toHaveBeenCalled();
      expect(dbInstance.getConnectionStatus()).toBe(false);
    });

    it('should handle disconnection errors', async () => {
      mockMongoose.connect.mockResolvedValue(undefined as any);
      const disconnectError = new Error('Disconnect failed');
      mockMongoose.disconnect.mockRejectedValue(disconnectError);

      // Connect first
      await dbInstance.connect();

      // Then try to disconnect with error
      await expect(dbInstance.disconnect()).rejects.toThrow(
        'Disconnect failed'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error disconnecting from MongoDB:',
        disconnectError
      );
    });
  });

  describe('buildMongoUri', () => {
    it('should return complete URI if provided', async () => {
      mockConfig.MONGO_URI =
        'mongodb://user:pass@host:27017/db?authSource=admin';
      mockMongoose.connect.mockResolvedValue(undefined as any);

      await dbInstance.connect();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://user:pass@host:27017/db?authSource=admin',
        expect.any(Object)
      );
    });

    it('should build URI from components', async () => {
      mockConfig.MONGO_URI = 'mongodb://localhost:27017/test_db'; // No @ symbol
      mockConfig.MONGO_ROOT_USERNAME = 'admin';
      mockConfig.MONGO_ROOT_PASSWORD = 'secret';
      mockConfig.MONGO_DATABASE = 'my_db';
      mockMongoose.connect.mockResolvedValue(undefined as any);

      await dbInstance.connect();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://admin:secret@localhost:27017/my_db?authSource=admin',
        expect.any(Object)
      );
    });
  });

  describe('getConnectionStatus', () => {
    it('should return false initially', () => {
      expect(dbInstance.getConnectionStatus()).toBe(false);
    });

    it('should return true after successful connection', async () => {
      mockMongoose.connect.mockResolvedValue(undefined as any);

      await dbInstance.connect();

      expect(dbInstance.getConnectionStatus()).toBe(true);
    });

    it('should return false after disconnection', async () => {
      mockMongoose.connect.mockResolvedValue(undefined as any);
      mockMongoose.disconnect.mockResolvedValue(undefined as any);

      await dbInstance.connect();
      expect(dbInstance.getConnectionStatus()).toBe(true);

      await dbInstance.disconnect();
      expect(dbInstance.getConnectionStatus()).toBe(false);
    });
  });

  describe('SIGINT handler', () => {
    it('should set up SIGINT handler when connecting', async () => {
      mockMongoose.connect.mockResolvedValue(undefined as any);

      await dbInstance.connect();

      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });

    it('should handle graceful shutdown in test environment', async () => {
      process.env.NODE_ENV = 'test';

      mockMongoose.connect.mockResolvedValue(undefined as any);
      mockMongoose.disconnect.mockResolvedValue(undefined as any);

      const mockExit = jest.spyOn(process, 'exit').mockImplementation();

      await dbInstance.connect();

      // Trigger SIGINT manually - the callback should not call process.exit in test env
      const sigintCallback = (process as any).sigintCallback;
      if (sigintCallback) {
        // Call the callback directly (it's synchronous but contains async operations)
        sigintCallback();

        // Wait a bit for the async operations to complete
        await new Promise(resolve => setTimeout(resolve, 10));

        expect(mockMongoose.disconnect).toHaveBeenCalled();
        expect(mockExit).not.toHaveBeenCalled();
      }

      mockExit.mockRestore();
    });
  });
});
