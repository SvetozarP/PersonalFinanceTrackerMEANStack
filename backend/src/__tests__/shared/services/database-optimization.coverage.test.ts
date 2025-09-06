import { DatabaseOptimizationService } from '../../../shared/services/database-optimization.service';
import mongoose from 'mongoose';

// Mock mongoose
jest.mock('mongoose', () => ({
  connection: {
    db: null,
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

import { logger as mockLogger } from '../../../shared/services/logger.service';

describe('DatabaseOptimizationService - Branch Coverage', () => {
  let service: DatabaseOptimizationService;
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();
    service = DatabaseOptimizationService.getInstance();
    
    mockDb = {
      listCollections: jest.fn(),
      collection: jest.fn(),
    };
    
    (mongoose.connection as any).db = mockDb;
  });

  afterEach(() => {
    (mongoose.connection as any).db = null;
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = DatabaseOptimizationService.getInstance();
      const instance2 = DatabaseOptimizationService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('ensureIndexes', () => {
    it('should handle database connection not established', async () => {
      (mongoose.connection as any).db = null;

      await expect(service.ensureIndexes()).rejects.toThrow(
        'Database connection not established'
      );
    });

    it('should handle empty collections list', async () => {
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      });

      await service.ensureIndexes();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Starting database index optimization...'
      );
    });

    it('should handle collection optimization errors', async () => {
      const collections = [{ name: 'testCollection' }];
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(collections),
      });

      const mockCollection = {
        indexes: jest.fn().mockRejectedValue(new Error('Collection error')),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      await service.ensureIndexes();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error optimizing collection testCollection',
        expect.any(Object)
      );
    });

    it('should handle index creation errors', async () => {
      const collections = [{ name: 'testCollection' }];
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(collections),
      });

      const mockCollection = {
        indexes: jest.fn().mockResolvedValue([
          { name: '_id_', key: { _id: 1 } },
        ]),
        createIndex: jest.fn().mockRejectedValue(new Error('Index creation failed')),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      await service.ensureIndexes();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating index for testCollection',
        expect.any(Object)
      );
    });

    it('should create missing indexes successfully', async () => {
      const collections = [{ name: 'users' }];
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(collections),
      });

      const mockCollection = {
        indexes: jest.fn().mockResolvedValue([
          { name: '_id_', key: { _id: 1 } },
        ]),
        createIndex: jest.fn().mockResolvedValue('email_1'),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      await service.ensureIndexes();

      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { email: 1 },
        { unique: true, background: true }
      );
    });

    it('should skip existing indexes', async () => {
      const collections = [{ name: 'users' }];
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(collections),
      });

      const mockCollection = {
        indexes: jest.fn().mockResolvedValue([
          { name: '_id_', key: { _id: 1 } },
          { name: 'email_1', key: { email: 1 } },
        ]),
        createIndex: jest.fn(),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      await service.ensureIndexes();

      expect(mockCollection.createIndex).not.toHaveBeenCalled();
    });
  });

  describe('validateIndexes', () => {
    it('should handle database connection not established', async () => {
      (mongoose.connection as any).db = null;

      await expect(service.validateIndexes()).rejects.toThrow(
        'Database connection not established'
      );
    });

    it('should validate indexes successfully', async () => {
      const collections = [{ name: 'users' }];
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(collections),
      });

      const mockCollection = {
        indexes: jest.fn().mockResolvedValue([
          { name: '_id_', key: { _id: 1 } },
          { name: 'email_1', key: { email: 1 } },
        ]),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      const result = await service.validateIndexes();

      expect(result).toEqual({
        totalCollections: 1,
        totalIndexes: 2,
        validIndexes: 2,
        invalidIndexes: 0,
        recommendations: [],
      });
    });

    it('should handle validation errors', async () => {
      const collections = [{ name: 'testCollection' }];
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(collections),
      });

      const mockCollection = {
        indexes: jest.fn().mockRejectedValue(new Error('Validation error')),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      await service.validateIndexes();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error validating collection testCollection',
        expect.any(Object)
      );
    });
  });

  describe('analyzeQueryPerformance', () => {
    it('should handle database connection not established', async () => {
      (mongoose.connection as any).db = null;

      await expect(service.analyzeQueryPerformance()).rejects.toThrow(
        'Database connection not established'
      );
    });

    it('should analyze query performance successfully', async () => {
      const collections = [{ name: 'users' }];
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(collections),
      });

      const mockCollection = {
        aggregate: jest.fn().mockResolvedValue([
          {
            operation: 'find',
            count: 100,
            avgExecutionTime: 50,
            slowQueries: 5,
          },
        ]),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      const result = await service.analyzeQueryPerformance();

      expect(result).toEqual({
        totalOperations: 100,
        averageExecutionTime: 50,
        slowQueries: 5,
        recommendations: expect.any(Array),
      });
    });

    it('should handle analysis errors', async () => {
      const collections = [{ name: 'testCollection' }];
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(collections),
      });

      const mockCollection = {
        aggregate: jest.fn().mockRejectedValue(new Error('Analysis error')),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      await service.analyzeQueryPerformance();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error analyzing collection testCollection',
        expect.any(Object)
      );
    });
  });

  describe('optimizeCollection', () => {
    it('should handle database connection not established', async () => {
      (mongoose.connection as any).db = null;

      await expect(service.optimizeCollection('test')).rejects.toThrow(
        'Database connection not established'
      );
    });

    it('should optimize collection successfully', async () => {
      const mockCollection = {
        stats: jest.fn().mockResolvedValue({
          count: 1000,
          size: 1024000,
          avgObjSize: 1024,
        }),
        createIndex: jest.fn().mockResolvedValue('optimized_index'),
        dropIndex: jest.fn().mockResolvedValue({ ok: 1 }),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      const result = await service.optimizeCollection('testCollection');

      expect(result).toEqual({
        collectionName: 'testCollection',
        documentCount: 1000,
        collectionSize: 1024000,
        averageDocumentSize: 1024,
        optimizations: expect.any(Array),
      });
    });

    it('should handle optimization errors', async () => {
      const mockCollection = {
        stats: jest.fn().mockRejectedValue(new Error('Stats error')),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      await service.optimizeCollection('testCollection');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error optimizing collection testCollection',
        expect.any(Object)
      );
    });
  });

  describe('getDatabaseStats', () => {
    it('should handle database connection not established', async () => {
      (mongoose.connection as any).db = null;

      await expect(service.getDatabaseStats()).rejects.toThrow(
        'Database connection not established'
      );
    });

    it('should get database stats successfully', async () => {
      const mockStats = {
        db: 'testdb',
        collections: 5,
        objects: 10000,
        avgObjSize: 1024,
        dataSize: 10240000,
        storageSize: 12288000,
        indexes: 15,
        indexSize: 2048000,
      };

      mockDb.stats.mockResolvedValue(mockStats);

      const result = await service.getDatabaseStats();

      expect(result).toEqual(mockStats);
    });

    it('should handle stats retrieval errors', async () => {
      mockDb.stats.mockRejectedValue(new Error('Stats retrieval failed'));

      await service.getDatabaseStats();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error getting database stats',
        expect.any(Object)
      );
    });
  });

  describe('cleanupUnusedIndexes', () => {
    it('should handle database connection not established', async () => {
      (mongoose.connection as any).db = null;

      await expect(service.cleanupUnusedIndexes()).rejects.toThrow(
        'Database connection not established'
      );
    });

    it('should cleanup unused indexes successfully', async () => {
      const collections = [{ name: 'users' }];
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(collections),
      });

      const mockCollection = {
        indexes: jest.fn().mockResolvedValue([
          { name: '_id_', key: { _id: 1 } },
          { name: 'unused_index', key: { unused: 1 } },
        ]),
        dropIndex: jest.fn().mockResolvedValue({ ok: 1 }),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      const result = await service.cleanupUnusedIndexes();

      expect(result).toEqual({
        totalCollections: 1,
        indexesAnalyzed: 2,
        indexesRemoved: 1,
        spaceFreed: expect.any(Number),
      });
    });

    it('should handle cleanup errors', async () => {
      const collections = [{ name: 'testCollection' }];
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(collections),
      });

      const mockCollection = {
        indexes: jest.fn().mockRejectedValue(new Error('Cleanup error')),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      await service.cleanupUnusedIndexes();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error cleaning up collection testCollection',
        expect.any(Object)
      );
    });
  });

  describe('monitorPerformance', () => {
    it('should handle database connection not established', async () => {
      (mongoose.connection as any).db = null;

      await expect(service.monitorPerformance()).rejects.toThrow(
        'Database connection not established'
      );
    });

    it('should monitor performance successfully', async () => {
      const mockStats = {
        operations: {
          insert: 100,
          query: 500,
          update: 50,
          delete: 10,
        },
        connections: {
          current: 5,
          available: 95,
        },
        memory: {
          resident: 100,
          virtual: 200,
        },
      };

      mockDb.stats.mockResolvedValue(mockStats);

      const result = await service.monitorPerformance();

      expect(result).toEqual({
        operations: mockStats.operations,
        connections: mockStats.connections,
        memory: mockStats.memory,
        healthScore: expect.any(Number),
        recommendations: expect.any(Array),
      });
    });

    it('should handle monitoring errors', async () => {
      mockDb.stats.mockRejectedValue(new Error('Monitoring failed'));

      await service.monitorPerformance();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error monitoring database performance',
        expect.any(Object)
      );
    });
  });

  describe('generateOptimizationReport', () => {
    it('should generate comprehensive report', async () => {
      const mockStats = {
        db: 'testdb',
        collections: 5,
        objects: 10000,
        dataSize: 10240000,
        indexes: 15,
        indexSize: 2048000,
      };

      mockDb.stats.mockResolvedValue(mockStats);

      const collections = [{ name: 'users' }];
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(collections),
      });

      const mockCollection = {
        indexes: jest.fn().mockResolvedValue([
          { name: '_id_', key: { _id: 1 } },
        ]),
      };
      mockDb.collection.mockReturnValue(mockCollection);

      const result = await service.generateOptimizationReport();

      expect(result).toEqual({
        databaseStats: mockStats,
        indexAnalysis: expect.any(Object),
        performanceMetrics: expect.any(Object),
        recommendations: expect.any(Array),
        generatedAt: expect.any(Date),
      });
    });

    it('should handle report generation errors', async () => {
      mockDb.stats.mockRejectedValue(new Error('Report generation failed'));

      await service.generateOptimizationReport();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error generating optimization report',
        expect.any(Object)
      );
    });
  });
});