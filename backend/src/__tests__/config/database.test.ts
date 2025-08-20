import mongoose from 'mongoose';
import { DatabaseConnection } from '../../../config/database';

// Mock mongoose
jest.mock('mongoose', () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  connection: {
    on: jest.fn(),
  },
}));

// Mock the logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock the environment config
jest.mock('../../../config/environment', () => ({
  config: {
    MONGO_URI: 'mongodb://test:test@localhost:27017/testdb',
    MONGO_ROOT_USERNAME: 'test',
    MONGO_ROOT_PASSWORD: 'test',
    MONGO_DATABASE: 'testdb',
  },
}));

describe('Database Connection', () => {
  let databaseConnection: DatabaseConnection;
  let mockMongoose: jest.Mocked<typeof mongoose>;

  beforeEach(() => {
    jest.clearAllMocks();
    databaseConnection = DatabaseConnection.getInstance();
    
    // Reset the singleton instance for each test
    (DatabaseConnection as any).instance = undefined;
    
    mockMongoose = mongoose as jest.Mocked<typeof mongoose>;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = DatabaseConnection.getInstance();
      const instance2 = DatabaseConnection.getInstance();
      
      expect(instance1).toBe(instance2);
    });

    it('should create new instance only once', () => {
      const instance1 = DatabaseConnection.getInstance();
      const instance2 = DatabaseConnection.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(DatabaseConnection);
    });
  });

  describe('Connection Status', () => {
    it('should return correct connection status', () => {
      const instance = DatabaseConnection.getInstance();
      
      // Initially should be false
      expect(instance.getConnectionStatus()).toBe(false);
    });

    it('should update connection status after successful connection', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      await instance.connect();
      
      expect(instance.getConnectionStatus()).toBe(true);
    });

    it('should update connection status after disconnection', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      mockMongoose.disconnect.mockResolvedValue(undefined);
      
      await instance.connect();
      expect(instance.getConnectionStatus()).toBe(true);
      
      await instance.disconnect();
      expect(instance.getConnectionStatus()).toBe(false);
    });
  });

  describe('Connect Method', () => {
    it('should connect to MongoDB successfully', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      await instance.connect();
      
      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://test:test@localhost:27017/testdb?authSource=admin',
        {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          bufferCommands: false,
        }
      );
      expect(instance.getConnectionStatus()).toBe(true);
    });

    it('should not reconnect if already connected', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      // First connection
      await instance.connect();
      expect(mockMongoose.connect).toHaveBeenCalledTimes(1);
      
      // Second connection attempt
      await instance.connect();
      expect(mockMongoose.connect).toHaveBeenCalledTimes(1); // Should not call again
    });

    it('should handle connection errors', async () => {
      const instance = DatabaseConnection.getInstance();
      const connectionError = new Error('Connection failed');
      mockMongoose.connect.mockRejectedValue(connectionError);
      
      await expect(instance.connect()).rejects.toThrow('Connection failed');
      expect(instance.getConnectionStatus()).toBe(false);
    });

    it('should set up connection event handlers', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      await instance.connect();
      
      expect(mockMongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockMongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
      expect(mockMongoose.connection.on).toHaveBeenCalledWith('reconnected', expect.any(Function));
    });

    it('should handle connection error events', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      await instance.connect();
      
      // Get the error handler function
      const errorHandlerCall = mockMongoose.connection.on.mock.calls.find(
        call => call[0] === 'error'
      );
      expect(errorHandlerCall).toBeDefined();
      
      const errorHandler = errorHandlerCall![1];
      const testError = new Error('Test connection error');
      
      // Call the error handler
      errorHandler(testError);
      
      expect(instance.getConnectionStatus()).toBe(false);
    });

    it('should handle disconnection events', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      await instance.connect();
      
      // Get the disconnected handler function
      const disconnectedHandlerCall = mockMongoose.connection.on.mock.calls.find(
        call => call[0] === 'disconnected'
      );
      expect(disconnectedHandlerCall).toBeDefined();
      
      const disconnectedHandler = disconnectedHandlerCall![1];
      
      // Call the disconnected handler
      disconnectedHandler();
      
      expect(instance.getConnectionStatus()).toBe(false);
    });

    it('should handle reconnection events', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      await instance.connect();
      
      // Get the reconnected handler function
      const reconnectedHandlerCall = mockMongoose.connection.on.mock.calls.find(
        call => call[0] === 'reconnected'
      );
      expect(reconnectedHandlerCall).toBeDefined();
      
      const reconnectedHandler = reconnectedHandlerCall![1];
      
      // Call the reconnected handler
      reconnectedHandler();
      
      expect(instance.getConnectionStatus()).toBe(true);
    });
  });

  describe('Disconnect Method', () => {
    it('should disconnect from MongoDB successfully', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      mockMongoose.disconnect.mockResolvedValue(undefined);
      
      await instance.connect();
      expect(instance.getConnectionStatus()).toBe(true);
      
      await instance.disconnect();
      
      expect(mockMongoose.disconnect).toHaveBeenCalled();
      expect(instance.getConnectionStatus()).toBe(false);
    });

    it('should not disconnect if not connected', async () => {
      const instance = DatabaseConnection.getInstance();
      
      await instance.disconnect();
      
      expect(mockMongoose.disconnect).not.toHaveBeenCalled();
    });

    it('should handle disconnection errors', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      mockMongoose.disconnect.mockRejectedValue(new Error('Disconnect failed'));
      
      await instance.connect();
      expect(instance.getConnectionStatus()).toBe(true);
      
      await expect(instance.disconnect()).rejects.toThrow('Disconnect failed');
      expect(instance.getConnectionStatus()).toBe(true); // Should remain true on error
    });
  });

  describe('MongoDB URI Building', () => {
    it('should build URI with authentication when MONGO_URI is not complete', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      await instance.connect();
      
      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://test:test@localhost:27017/testdb?authSource=admin',
        expect.any(Object)
      );
    });

    it('should use complete MONGO_URI when provided', async () => {
      // Mock with complete URI
      jest.doMock('../../../config/environment', () => ({
        config: {
          MONGO_URI: 'mongodb://user:pass@host:27017/db?authSource=admin',
          MONGO_ROOT_USERNAME: 'test',
          MONGO_ROOT_PASSWORD: 'test',
          MONGO_DATABASE: 'testdb',
        },
      }));
      
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      await instance.connect();
      
      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://user:pass@host:27017/db?authSource=admin',
        expect.any(Object)
      );
    });

    it('should detect complete URI correctly', async () => {
      // Mock with URI that has mongodb:// but no @
      jest.doMock('../../../config/environment', () => ({
        config: {
          MONGO_URI: 'mongodb://localhost:27017/db',
          MONGO_ROOT_USERNAME: 'test',
          MONGO_ROOT_PASSWORD: 'test',
          MONGO_DATABASE: 'testdb',
        },
      }));
      
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      await instance.connect();
      
      // Should build URI with authentication
      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://test:test@localhost:27017/testdb?authSource=admin',
        expect.any(Object)
      );
    });
  });

  describe('Graceful Shutdown', () => {
    it('should handle SIGINT signal in non-test environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      mockMongoose.disconnect.mockResolvedValue(undefined);
      
      await instance.connect();
      
      // Simulate SIGINT signal
      const sigintHandler = process.listeners('SIGINT').find(
        listener => listener.name === 'bound disconnect'
      );
      
      if (sigintHandler) {
        await sigintHandler();
      }
      
      expect(mockMongoose.disconnect).toHaveBeenCalled();
      
      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should not exit in test environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      mockMongoose.disconnect.mockResolvedValue(undefined);
      
      await instance.connect();
      
      // Simulate SIGINT signal
      const sigintHandler = process.listeners('SIGINT').find(
        listener => listener.name === 'bound disconnect'
      );
      
      if (sigintHandler) {
        await sigintHandler();
      }
      
      expect(mockMongoose.disconnect).toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
      
      mockExit.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle shutdown errors gracefully', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      mockMongoose.disconnect.mockRejectedValue(new Error('Shutdown error'));
      
      await instance.connect();
      
      // Simulate SIGINT signal
      const sigintHandler = process.listeners('SIGINT').find(
        listener => listener.name === 'bound disconnect'
      );
      
      if (sigintHandler) {
        await sigintHandler();
      }
      
      expect(mockMongoose.disconnect).toHaveBeenCalled();
      
      mockExit.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Connection Options', () => {
    it('should use correct connection options', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      await instance.connect();
      
      expect(mockMongoose.connect).toHaveBeenCalledWith(
        expect.any(String),
        {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          bufferCommands: false,
        }
      );
    });
  });

  describe('Exported Instance', () => {
    it('should export a database connection instance', () => {
      const { databaseConnection } = require('../../../config/database');
      expect(databaseConnection).toBeDefined();
      expect(databaseConnection).toBeInstanceOf(DatabaseConnection);
    });

    it('should be the same instance as getInstance', () => {
      const { databaseConnection } = require('../../../config/database');
      const instance = DatabaseConnection.getInstance();
      expect(databaseConnection).toBe(instance);
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid connection attempts', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      // Make multiple rapid connection attempts
      const connectionPromises = [
        instance.connect(),
        instance.connect(),
        instance.connect(),
      ];
      
      await Promise.all(connectionPromises);
      
      // Should only connect once
      expect(mockMongoose.connect).toHaveBeenCalledTimes(1);
      expect(instance.getConnectionStatus()).toBe(true);
    });

    it('should handle connection state changes during operations', async () => {
      const instance = DatabaseConnection.getInstance();
      mockMongoose.connect.mockResolvedValue(mongoose as any);
      
      await instance.connect();
      expect(instance.getConnectionStatus()).toBe(true);
      
      // Simulate connection state change
      const disconnectedHandlerCall = mockMongoose.connection.on.mock.calls.find(
        call => call[0] === 'disconnected'
      );
      const disconnectedHandler = disconnectedHandlerCall![1];
      disconnectedHandler();
      
      expect(instance.getConnectionStatus()).toBe(false);
      
      // Simulate reconnection
      const reconnectedHandlerCall = mockMongoose.connection.on.mock.calls.find(
        call => call[0] === 'reconnected'
      );
      const reconnectedHandler = reconnectedHandlerCall![1];
      reconnectedHandler();
      
      expect(instance.getConnectionStatus()).toBe(true);
    });
  });
});
