import dotenv from 'dotenv';
import { logger } from '../shared/services/logger.service';

// Load environment variables
dotenv.config();

export interface EnvironmentConfig {
  // Server Configuration
  NODE_ENV: string;
  BACKEND_PORT: number;
  CORS_ORIGIN: string;

  // MongoDB Configuration
  MONGO_URI: string;
  MONGO_PORT: number;
  MONGO_ROOT_USERNAME: string;
  MONGO_ROOT_PASSWORD: string;
  MONGO_DATABASE: string;

  // JWT Configuration
  JWT_SECRET: string;
  JWT_ACCESS_TOKEN_EXPIRY: string;
  JWT_REFRESH_TOKEN_EXPIRY: string;

  // Security
  BCRYPT_SALT_ROUNDS: number;
  COOKIE_SECRET: string;

  // Logging
  LOG_LEVEL: string;
  LOG_FILE_PATH: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
}

class EnvironmentService {
  private config: EnvironmentConfig;

  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private loadConfig(): EnvironmentConfig {
    return {
      // Server Configuration
      NODE_ENV: process.env.NODE_ENV || 'development',
      BACKEND_PORT: parseInt(process.env.BACKEND_PORT || '3000', 10),
      CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4200',

      // MongoDB Configuration
      MONGO_URI:
        process.env.MONGO_URI || 'mongodb://localhost:27017/finance_tracker',
      MONGO_PORT: parseInt(process.env.MONGO_PORT || '27017', 10),
      MONGO_ROOT_USERNAME: process.env.MONGO_ROOT_USERNAME || 'admin',
      MONGO_ROOT_PASSWORD: process.env.MONGO_ROOT_PASSWORD || 'password123',
      MONGO_DATABASE: process.env.MONGO_DATABASE || 'finance_tracker',

      // JWT Configuration
      JWT_SECRET:
        process.env.JWT_SECRET ||
        'your-super-secret-jwt-key-change-this-in-production',
      JWT_ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
      JWT_REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',

      // Security
      BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
      COOKIE_SECRET:
        process.env.COOKIE_SECRET ||
        'your-cookie-secret-key-change-this-in-production',

      // Logging
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      LOG_FILE_PATH: process.env.LOG_FILE_PATH || 'logs/app.log',

      // Rate Limiting
      RATE_LIMIT_WINDOW_MS: parseInt(
        process.env.RATE_LIMIT_WINDOW_MS || '900000',
        10
      ),
      RATE_LIMIT_MAX_REQUESTS: parseInt(
        process.env.RATE_LIMIT_MAX_REQUESTS || '100',
        10
      ),
    };
  }

  private validateConfig(): void {
    const requiredFields: (keyof EnvironmentConfig)[] = [
      'MONGO_URI',
      'JWT_SECRET',
      'COOKIE_SECRET',
    ];

    const missingFields = requiredFields.filter(field => !this.config[field]);

    if (missingFields.length > 0) {
      const error = `Missing required environment variables: ${missingFields.join(', ')}`;
      logger.error(error);
      throw new Error(error);
    }

    // Validate specific fields
    if (this.config.BACKEND_PORT < 1 || this.config.BACKEND_PORT > 65535) {
      throw new Error('BACKEND_PORT must be between 1 and 65535');
    }

    if (
      this.config.BCRYPT_SALT_ROUNDS < 10 ||
      this.config.BCRYPT_SALT_ROUNDS > 20
    ) {
      throw new Error('BCRYPT_SALT_ROUNDS must be between 10 and 20');
    }

    logger.info('Environment configuration validated successfully');
  }

  public getConfig(): EnvironmentConfig {
    return this.config;
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }
}

export const environment = new EnvironmentService();
export const config = environment.getConfig();
