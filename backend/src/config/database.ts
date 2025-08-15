import mongoose from 'mongoose';
import { logger } from '../shared/services/logger.service';
import { config } from './environment';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.info('Database already connected');
      return;
    }

    try {
      const mongoUri = this.buildMongoUri();

      await mongoose.connect(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      });

      this.isConnected = true;
      logger.info('✅ MongoDB connected successfully');

      // Handle connection events
      mongoose.connection.on('error', error => {
        logger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on('SIGINT', () => {
        this.disconnect()
          .then(() => {
            // Only exit in non-test environments to avoid Jest worker crashes
            if (process.env.NODE_ENV !== 'test') {
              process.exit(0);
            }
          })
          .catch(error => {
            logger.error('Error during shutdown:', error);
            if (process.env.NODE_ENV !== 'test') {
              process.exit(1);
            }
          });
      });
    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected');
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  private buildMongoUri(): string {
    // If MONGO_URI is already a complete connection string, use it
    if (
      config.MONGO_URI.includes('mongodb://') &&
      config.MONGO_URI.includes('@')
    ) {
      return config.MONGO_URI;
    }

    // Build connection string with authentication
    const { MONGO_ROOT_USERNAME, MONGO_ROOT_PASSWORD, MONGO_DATABASE } = config;
    return `mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@localhost:27017/${MONGO_DATABASE}?authSource=admin`;
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const databaseConnection = DatabaseConnection.getInstance();
