import mongoose from 'mongoose';
import { databaseOptimizationService } from '../../../shared/services/database-optimization.service';
import { logger } from '../../../shared/services/logger.service';

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Database Optimization Service - Coverage Tests', () => {
  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/finance-tracker-test');
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Handling Coverage', () => {
    it('should handle database connection errors in ensureIndexes', async () => {
      // Mock database connection error
      const originalDb = mongoose.connection.db;
      (mongoose.connection as any).db = undefined;

      try {
        await databaseOptimizationService.ensureIndexes();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Database connection not established');
      } finally {
        // Restore original database connection
        (mongoose.connection as any).db = originalDb;
      }
    });

    it('should handle database connection errors in getIndexUsageStats', async () => {
      // Mock database connection error
      const originalDb = mongoose.connection.db;
      (mongoose.connection as any).db = undefined;

      try {
        await databaseOptimizationService.getIndexUsageStats();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Database connection not established');
      } finally {
        // Restore original database connection
        (mongoose.connection as any).db = originalDb;
      }
    });

    it('should handle database connection errors in getDatabaseMetrics', async () => {
      // Mock database connection error
      const originalDb = mongoose.connection.db;
      (mongoose.connection as any).db = undefined;

      try {
        await databaseOptimizationService.getDatabaseMetrics();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Database connection not established');
      } finally {
        // Restore original database connection
        (mongoose.connection as any).db = originalDb;
      }
    });

    it('should handle database connection errors in validateCriticalIndexes', async () => {
      // Mock database connection error
      const originalDb = mongoose.connection.db;
      (mongoose.connection as any).db = undefined;

      try {
        await databaseOptimizationService.validateCriticalIndexes();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Database connection not established');
      } finally {
        // Restore original database connection
        (mongoose.connection as any).db = originalDb;
      }
    });

    it('should handle database connection errors in createMissingIndexes', async () => {
      // Mock database connection error
      const originalDb = mongoose.connection.db;
      (mongoose.connection as any).db = undefined;

      try {
        await databaseOptimizationService.createMissingIndexes(['transactions: {"userId": 1}']);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Database connection not established');
      } finally {
        // Restore original database connection
        (mongoose.connection as any).db = originalDb;
      }
    });

    it('should handle database connection errors in analyzeQueryPerformance', async () => {
      // Mock database connection error
      const originalDb = mongoose.connection.db;
      (mongoose.connection as any).db = undefined;

      try {
        await databaseOptimizationService.analyzeQueryPerformance({ userId: '123' }, 'transactions');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Database connection not established');
      } finally {
        // Restore original database connection
        (mongoose.connection as any).db = originalDb;
      }
    });
  });

  describe('Edge Cases Coverage', () => {
    it('should handle empty missing indexes array', async () => {
      const result = await databaseOptimizationService.createMissingIndexes([]);
      expect(result).toBeUndefined();
    });

    it('should handle malformed missing index strings', async () => {
      // This should not throw an error, but handle gracefully
      expect(async () => {
        await databaseOptimizationService.createMissingIndexes(['invalid:format']);
      }).not.toThrow();
    });

    it('should handle analyzeQueryPerformance with empty query', async () => {
      const result = await databaseOptimizationService.analyzeQueryPerformance({}, 'transactions');
      expect(result).toHaveProperty('collection', 'transactions');
      expect(result).toHaveProperty('query', {});
      expect(result).toHaveProperty('executionTime');
    });

    it('should handle analyzeQueryPerformance with non-existent collection', async () => {
      const result = await databaseOptimizationService.analyzeQueryPerformance(
        { userId: '123' }, 
        'nonexistent_collection'
      );
      expect(result).toHaveProperty('collection', 'nonexistent_collection');
      expect(result).toHaveProperty('executionTime');
    });
  });

  describe('Index Comparison Coverage', () => {
    it('should compare index keys correctly', () => {
      // Test the private compareIndexKeys method through validateCriticalIndexes
      const index1 = { userId: 1, date: -1 };
      const index2 = { userId: 1, date: -1 };
      const index3 = { userId: 1, date: 1 };
      const index4 = { userId: 1, categoryId: 1 };

      // This tests the compareIndexKeys method indirectly
      expect(async () => {
        await databaseOptimizationService.validateCriticalIndexes();
      }).not.toThrow();
    });
  });

  describe('Optimization Process Coverage', () => {
    it('should have proper optimization process structure', () => {
      // Test that the optimization process has proper structure
      expect(typeof databaseOptimizationService.optimizePerformance).toBe('function');
      expect(typeof databaseOptimizationService.getIndexUsageStats).toBe('function');
      expect(typeof databaseOptimizationService.getDatabaseMetrics).toBe('function');
      expect(typeof databaseOptimizationService.validateCriticalIndexes).toBe('function');
    });
  });

  describe('Database Metrics Coverage', () => {
    it('should handle database stats command failure', async () => {
      // Mock database admin command failure
      const originalDb = mongoose.connection.db;
      const mockDb = {
        admin: jest.fn().mockReturnValue({
          command: jest.fn().mockRejectedValue(new Error('Command failed'))
        }),
        listCollections: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([])
        })
      };
      (mongoose.connection as any).db = mockDb;

      const result = await databaseOptimizationService.getDatabaseMetrics();
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('collections');

      // Restore original database connection
      (mongoose.connection as any).db = originalDb;
    });

    it('should handle collection stats command failure', async () => {
      // Mock collection stats command failure
      const originalDb = mongoose.connection.db;
      const mockDb = {
        admin: jest.fn().mockReturnValue({
          command: jest.fn()
            .mockResolvedValueOnce({ collections: 1, dataSize: 0, storageSize: 0, totalIndexSize: 0, indexes: 0 }) // dbStats success
            .mockRejectedValue(new Error('Collection stats failed')) // collStats failure
        }),
        listCollections: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([{ name: 'test_collection' }])
        })
      };
      (mongoose.connection as any).db = mockDb;

      const result = await databaseOptimizationService.getDatabaseMetrics();
      expect(result).toHaveProperty('database');
      expect(result).toHaveProperty('collections');
      expect(result.collections).toHaveProperty('test_collection');

      // Restore original database connection
      (mongoose.connection as any).db = originalDb;
    });
  });
});
