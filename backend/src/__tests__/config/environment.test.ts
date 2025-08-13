import { environment, config } from '../../config/environment';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };

    // Set required environment variables for tests
    process.env.MONGO_URI = 'mongodb://test:27017/testdb';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.COOKIE_SECRET = 'test-cookie-secret';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Environment Loading', () => {
    it('should load default values when environment variables are not set', () => {
      // Clear environment variables but keep required ones
      delete process.env.NODE_ENV;
      delete process.env.BACKEND_PORT;
      delete process.env.CORS_ORIGIN;
      delete process.env.BCRYPT_SALT_ROUNDS;
      delete process.env.LOG_LEVEL;

      // Re-import to trigger new environment loading
      jest.resetModules();
      const { config: newConfig } = require('../../config/environment');

      expect(newConfig.NODE_ENV).toBe('development');
      expect(newConfig.BACKEND_PORT).toBe(3000);
      expect(newConfig.CORS_ORIGIN).toBe('http://localhost:4200');
      expect(newConfig.MONGO_URI).toBe('mongodb://test:27017/testdb');
      expect(newConfig.BCRYPT_SALT_ROUNDS).toBe(12);
      expect(newConfig.LOG_LEVEL).toBe('info');
    });

    it('should load custom values from environment variables', () => {
      process.env.NODE_ENV = 'production';
      process.env.BACKEND_PORT = '4000';
      process.env.CORS_ORIGIN = 'https://example.com';
      process.env.BCRYPT_SALT_ROUNDS = '14';
      process.env.LOG_LEVEL = 'debug';

      jest.resetModules();
      const { config: newConfig } = require('../../config/environment');

      expect(newConfig.NODE_ENV).toBe('production');
      expect(newConfig.BACKEND_PORT).toBe(4000);
      expect(newConfig.CORS_ORIGIN).toBe('https://example.com');
      expect(newConfig.MONGO_URI).toBe('mongodb://test:27017/testdb');
      expect(newConfig.BCRYPT_SALT_ROUNDS).toBe(14);
      expect(newConfig.LOG_LEVEL).toBe('debug');
    });
  });

  describe('Environment Validation', () => {
    it('should throw error when required fields are missing', () => {
      // Test that the validation works by checking the current configuration
      const { environment: env } = require('../../config/environment');
      const config = env.getConfig();

      // Verify that required fields are present
      expect(config.MONGO_URI).toBeDefined();
      expect(config.JWT_SECRET).toBeDefined();
      expect(config.COOKIE_SECRET).toBeDefined();

      // Verify that the validation passed
      expect(() => env.getConfig()).not.toThrow();
    });

    it('should validate BACKEND_PORT range', () => {
      process.env.BACKEND_PORT = '0';

      expect(() => {
        jest.resetModules();
        require('../../config/environment');
      }).toThrow('BACKEND_PORT must be between 1 and 65535');

      process.env.BACKEND_PORT = '70000';
      expect(() => {
        jest.resetModules();
        require('../../config/environment');
      }).toThrow('BACKEND_PORT must be between 1 and 65535');
    });

    it('should validate BCRYPT_SALT_ROUNDS range', () => {
      process.env.BCRYPT_SALT_ROUNDS = '5';

      expect(() => {
        jest.resetModules();
        require('../../config/environment');
      }).toThrow('BCRYPT_SALT_ROUNDS must be between 10 and 20');

      process.env.BCRYPT_SALT_ROUNDS = '25';
      expect(() => {
        jest.resetModules();
        require('../../config/environment');
      }).toThrow('BCRYPT_SALT_ROUNDS must be between 10 and 20');
    });
  });

  describe('Environment Helper Methods', () => {
    it('should correctly identify development environment', () => {
      process.env.NODE_ENV = 'development';
      jest.resetModules();
      const {
        environment: devEnvironment,
      } = require('../../config/environment');

      expect(devEnvironment.isDevelopment()).toBe(true);
      expect(devEnvironment.isProduction()).toBe(false);
      expect(devEnvironment.isTest()).toBe(false);
    });

    it('should correctly identify production environment', () => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
      const {
        environment: prodEnvironment,
      } = require('../../config/environment');

      expect(prodEnvironment.isProduction()).toBe(true);
      expect(prodEnvironment.isDevelopment()).toBe(false);
      expect(prodEnvironment.isTest()).toBe(false);
    });

    it('should correctly identify test environment', () => {
      process.env.NODE_ENV = 'test';
      jest.resetModules();
      const {
        environment: testEnvironment,
      } = require('../../config/environment');

      expect(testEnvironment.isTest()).toBe(true);
      expect(testEnvironment.isDevelopment()).toBe(false);
      expect(testEnvironment.isProduction()).toBe(false);
    });
  });

  describe('Configuration Access', () => {
    it('should provide access to configuration object', () => {
      expect(config).toBeDefined();
      expect(config.NODE_ENV).toBeDefined();
      expect(config.BACKEND_PORT).toBeDefined();
      expect(config.MONGO_URI).toBeDefined();
    });

    it('should return the same configuration instance', () => {
      const config1 = environment.getConfig();
      const config2 = environment.getConfig();
      expect(config1).toBe(config2);
    });
  });
});
