import { DatabaseOptimizationService } from '../../../shared/services/database-optimization.service';
import mongoose from 'mongoose';

// Mock mongoose
jest.mock('mongoose', () => ({
  connection: {
    db: {
      listCollections: jest.fn(),
      collection: jest.fn(),
      admin: jest.fn()
    }
  }
}));

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('DatabaseOptimizationService', () => {
  let service: DatabaseOptimizationService;
  let mockDb: any;

  beforeEach(() => {
    service = DatabaseOptimizationService.getInstance();
    mockDb = {
      listCollections: jest.fn(),
      collection: jest.fn(),
      admin: jest.fn()
    };
    (mongoose.connection as any).db = mockDb;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureIndexes', () => {
    it('should list collections and log index information', async () => {
      const mockCollections = [
        { name: 'transactions' },
        { name: 'budgets' },
        { name: 'categories' }
      ];

      const mockIndexes = [
        { name: 'index1', key: { userId: 1 }, unique: false, sparse: false, background: false },
        { name: 'index2', key: { date: -1 }, unique: false, sparse: false, background: false }
      ];

      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockCollections)
      });

      mockDb.collection.mockReturnValue({
        indexes: jest.fn().mockResolvedValue(mockIndexes)
      });

      await service.ensureIndexes();

      expect(mockDb.listCollections).toHaveBeenCalled();
      expect(mockDb.collection).toHaveBeenCalledWith('transactions');
      expect(mockDb.collection).toHaveBeenCalledWith('budgets');
      expect(mockDb.collection).toHaveBeenCalledWith('categories');
    });

    it('should handle database connection errors', async () => {
      (mongoose.connection as any).db = null;

      await expect(service.ensureIndexes()).rejects.toThrow('Database connection not established');
    });
  });

  describe('analyzeQueryPerformance', () => {
    it('should analyze query performance and return metrics', async () => {
      const mockQuery = { userId: '123' };
      const mockCollectionName = 'transactions';
      const mockExplainResult = {
        executionStats: {
          executionTimeMillis: 50,
          totalDocsExamined: 100,
          totalDocsReturned: 10,
          executionStages: {
            stage: 'IXSCAN',
            indexName: 'userId_1'
          }
        }
      };

      const mockCollection = {
        find: jest.fn().mockReturnValue({
          explain: jest.fn().mockResolvedValue(mockExplainResult)
        })
      };

      mockDb.collection.mockReturnValue(mockCollection);

      const result = await service.analyzeQueryPerformance(mockQuery, mockCollectionName);

      expect(result).toEqual({
        collection: mockCollectionName,
        query: mockQuery,
        executionTime: 50,
        totalDocsExamined: 100,
        totalDocsReturned: 10,
        indexUsed: 'userId_1',
        isIndexUsed: true,
        efficiency: 10
      });
    });

    it('should handle collection scan queries', async () => {
      const mockQuery = { userId: '123' };
      const mockCollectionName = 'transactions';
      const mockExplainResult = {
        executionStats: {
          executionTimeMillis: 200,
          totalDocsExamined: 1000,
          totalDocsReturned: 10,
          executionStages: {
            stage: 'COLLSCAN'
          }
        }
      };

      const mockCollection = {
        find: jest.fn().mockReturnValue({
          explain: jest.fn().mockResolvedValue(mockExplainResult)
        })
      };

      mockDb.collection.mockReturnValue(mockCollection);

      const result = await service.analyzeQueryPerformance(mockQuery, mockCollectionName);

      expect(result.isIndexUsed).toBe(false);
      expect(result.indexUsed).toBe('COLLSCAN');
      expect(result.efficiency).toBe(1);
    });
  });

  describe('getIndexUsageStats', () => {
    it('should return index usage statistics for all collections', async () => {
      const mockCollections = [
        { name: 'transactions' },
        { name: 'budgets' }
      ];

      const mockIndexStats = [
        { name: 'index1', key: { userId: 1 }, accesses: { ops: 100 } },
        { name: 'index2', key: { date: -1 }, accesses: { ops: 50 } }
      ];

      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockCollections)
      });

      mockDb.collection.mockReturnValue({
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(mockIndexStats)
        })
      });

      const result = await service.getIndexUsageStats();

      expect(result).toEqual({
        transactions: {
          totalIndexes: 2,
          indexes: [
            { name: 'index1', key: { userId: 1 }, accesses: { ops: 100 }, lastAccess: 100 },
            { name: 'index2', key: { date: -1 }, accesses: { ops: 50 }, lastAccess: 50 }
          ]
        },
        budgets: {
          totalIndexes: 2,
          indexes: [
            { name: 'index1', key: { userId: 1 }, accesses: { ops: 100 }, lastAccess: 100 },
            { name: 'index2', key: { date: -1 }, accesses: { ops: 50 }, lastAccess: 50 }
          ]
        }
      });
    });
  });

  describe('validateCriticalIndexes', () => {
    it('should validate that critical indexes exist', async () => {
      mockDb.collection.mockImplementation((collectionName) => {
        const collectionIndexes = {
          'transactions': [
            { key: { userId: 1, date: -1 } },
            { key: { userId: 1, categoryId: 1, date: -1 } },
            { key: { userId: 1, type: 1, date: -1 } },
            { key: { userId: 1, accountId: 1, date: -1 } }
          ],
          'budgets': [
            { key: { userId: 1, status: 1 } },
            { key: { userId: 1, startDate: 1, endDate: 1 } }
          ],
          'categories': [
            { key: { userId: 1, parentId: 1, name: 1 } },
            { key: { userId: 1, isActive: 1 } }
          ]
        };
        return {
          indexes: jest.fn().mockResolvedValue(collectionIndexes[collectionName] || [])
        };
      });

      const result = await service.validateCriticalIndexes();

      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('should identify missing critical indexes', async () => {
      const mockIndexes = [
        { key: { userId: 1, date: -1 } }
        // Missing other critical indexes
      ];

      mockDb.collection.mockReturnValue({
        indexes: jest.fn().mockResolvedValue(mockIndexes)
      });

      const result = await service.validateCriticalIndexes();

      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    it('should handle collection not found errors', async () => {
      mockDb.collection.mockImplementation(() => {
        throw new Error('Collection not found');
      });

      const result = await service.validateCriticalIndexes();

      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });
  });

  describe('createMissingIndexes', () => {
    it('should create missing indexes', async () => {
      const missingIndexes = [
        'transactions: {"userId":1,"categoryId":1,"date":-1}',
        'budgets: {"userId":1,"status":1}'
      ];

      const mockCollection = {
        createIndex: jest.fn().mockResolvedValue(true)
      };

      mockDb.collection.mockReturnValue(mockCollection);

      await service.createMissingIndexes(missingIndexes);

      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { userId: 1, categoryId: 1, date: -1 },
        { background: true }
      );
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { userId: 1, status: 1 },
        { background: true }
      );
    });

    it('should handle malformed missing index entries', async () => {
      const missingIndexes = [
        'malformed-entry',
        'transactions: {"userId":1,"date":-1}'
      ];

      const mockCollection = {
        createIndex: jest.fn().mockResolvedValue(true)
      };

      mockDb.collection.mockReturnValue(mockCollection);

      await service.createMissingIndexes(missingIndexes);

      // Should only create the valid index
      expect(mockCollection.createIndex).toHaveBeenCalledTimes(1);
    });

    it('should handle duplicate index name errors', async () => {
      const missingIndexes = [
        'transactions: {"userId":1,"date":-1}'
      ];

      const mockCollection = {
        createIndex: jest.fn().mockRejectedValue(new Error('Index already exists with same name'))
      };

      mockDb.collection.mockReturnValue(mockCollection);

      await service.createMissingIndexes(missingIndexes);

      expect(mockCollection.createIndex).toHaveBeenCalled();
    });
  });

  describe('getDatabaseMetrics', () => {
    it('should return database metrics', async () => {
      const mockCollections = [
        { name: 'transactions' },
        { name: 'budgets' }
      ];

      const mockDbStats = {
        collections: 2,
        dataSize: 1024000,
        storageSize: 2048000,
        totalIndexSize: 512000,
        indexes: 10
      };

      const mockCollStats = {
        count: 1000,
        size: 512000,
        avgObjSize: 512,
        storageSize: 1024000,
        totalIndexSize: 256000,
        indexSizes: { index1: 128000, index2: 128000 }
      };

      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockCollections)
      });

      mockDb.admin.mockReturnValue({
        command: jest.fn()
          .mockResolvedValueOnce(mockCollStats) // collStats for first collection
          .mockResolvedValueOnce(mockCollStats) // collStats for second collection
          .mockResolvedValueOnce(mockDbStats) // dbStats
      });

      const result = await service.getDatabaseMetrics();

      expect(result).toEqual({
        database: {
          collections: 2,
          dataSize: 1024000,
          storageSize: 2048000,
          totalIndexSize: 512000,
          indexCount: 10
        },
        collections: {
          transactions: {
            count: 1000,
            size: 512000,
            avgObjSize: 512,
            storageSize: 1024000,
            totalIndexSize: 256000,
            indexSizes: { index1: 128000, index2: 128000 }
          },
          budgets: {
            count: 1000,
            size: 512000,
            avgObjSize: 512,
            storageSize: 1024000,
            totalIndexSize: 256000,
            indexSizes: { index1: 128000, index2: 128000 }
          }
        }
      });
    });

    it('should handle collection stats errors gracefully', async () => {
      const mockCollections = [
        { name: 'transactions' },
        { name: 'nonexistent' }
      ];

      const mockDbStats = {
        collections: 2,
        dataSize: 1024000,
        storageSize: 2048000,
        totalIndexSize: 512000,
        indexes: 10
      };

      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue(mockCollections)
      });

      mockDb.admin.mockReturnValue({
        command: jest.fn()
          .mockResolvedValueOnce({ count: 1000, size: 512000 }) // collStats for transactions
          .mockRejectedValueOnce(new Error('Collection not found')) // collStats for nonexistent
          .mockResolvedValueOnce(mockDbStats) // dbStats
      });

      const result = await service.getDatabaseMetrics();

      expect(result.collections.transactions.count).toBe(1000);
      expect(result.collections.nonexistent.count).toBe(0);
    });
  });

  describe('optimizePerformance', () => {
    it('should run complete optimization process', async () => {
      const mockValidation = { valid: true, missing: [] };
      const mockMetrics = { database: { collections: 2 } };
      const mockIndexStats = { transactions: { totalIndexes: 5 } };

      jest.spyOn(service, 'validateCriticalIndexes').mockResolvedValue(mockValidation);
      jest.spyOn(service, 'ensureIndexes').mockResolvedValue();
      jest.spyOn(service, 'getDatabaseMetrics').mockResolvedValue(mockMetrics);
      jest.spyOn(service, 'getIndexUsageStats').mockResolvedValue(mockIndexStats);

      await service.optimizePerformance();

      expect(service.validateCriticalIndexes).toHaveBeenCalled();
      expect(service.ensureIndexes).toHaveBeenCalled();
      expect(service.getDatabaseMetrics).toHaveBeenCalled();
      expect(service.getIndexUsageStats).toHaveBeenCalled();
    });

    it('should create missing indexes when validation fails', async () => {
      const mockValidation = { 
        valid: false, 
        missing: ['transactions: {"userId":1,"date":-1}'] 
      };
      const mockMetrics = { database: { collections: 2 } };
      const mockIndexStats = { transactions: { totalIndexes: 5 } };

      jest.spyOn(service, 'validateCriticalIndexes').mockResolvedValue(mockValidation);
      jest.spyOn(service, 'createMissingIndexes').mockResolvedValue();
      jest.spyOn(service, 'ensureIndexes').mockResolvedValue();
      jest.spyOn(service, 'getDatabaseMetrics').mockResolvedValue(mockMetrics);
      jest.spyOn(service, 'getIndexUsageStats').mockResolvedValue(mockIndexStats);

      await service.optimizePerformance();

      expect(service.createMissingIndexes).toHaveBeenCalledWith(mockValidation.missing);
    });
  });

  describe('Helper Methods', () => {
    it('should compare index keys correctly', () => {
      const key1 = { userId: 1, date: -1 };
      const key2 = { userId: 1, date: -1 };
      const key3 = { userId: 1, date: 1 };
      const key4 = { userId: 1, categoryId: 1, date: -1 };

      // Access private method for testing
      const compareIndexKeys = (service as any).compareIndexKeys;

      expect(compareIndexKeys(key1, key2)).toBe(true);
      expect(compareIndexKeys(key1, key3)).toBe(false);
      expect(compareIndexKeys(key1, key4)).toBe(false);
    });

    it('should calculate efficiency correctly', () => {
      const calculateEfficiency = (service as any).calculateEfficiency;

      expect(calculateEfficiency(0, 0)).toBe(100);
      expect(calculateEfficiency(100, 50)).toBe(50);
      expect(calculateEfficiency(100, 10)).toBe(10);
      expect(calculateEfficiency(100, 100)).toBe(100);
    });
  });
});


