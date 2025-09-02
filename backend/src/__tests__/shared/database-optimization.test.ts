import mongoose from 'mongoose';
import { databaseOptimizationService } from '../../shared/services/database-optimization.service';
import { logger } from '../../shared/services/logger.service';

// Mock logger
jest.mock('../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

describe('Database Optimization Service', () => {
  let mockDb: any;
  let mockCollection: any;

  beforeEach(() => {
    // Mock MongoDB connection
    mockCollection = {
      indexes: jest.fn(),
      createIndex: jest.fn(),
      find: jest.fn(),
      aggregate: jest.fn(),
      stats: jest.fn()
    };

    mockDb = {
      listCollections: jest.fn(),
      collection: jest.fn(() => mockCollection),
      stats: jest.fn()
    };

    // Mock mongoose connection
    (mongoose.connection as any) = {
      db: mockDb
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureIndexes', () => {
    it('should log index optimization process', async () => {
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { name: 'transactions' },
          { name: 'budgets' },
          { name: 'categories' }
        ])
      });

      mockCollection.indexes.mockResolvedValue([
        { name: '_id_', key: { _id: 1 } },
        { name: 'userId_1_date_-1', key: { userId: 1, date: -1 } }
      ]);

      await databaseOptimizationService.ensureIndexes();

      expect(logger.info).toHaveBeenCalledWith('Starting database index optimization...');
      expect(logger.info).toHaveBeenCalledWith('Database index optimization completed successfully');
    });

    it('should handle errors during index optimization', async () => {
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await expect(databaseOptimizationService.ensureIndexes()).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith(
        'Error during database index optimization',
        expect.objectContaining({ error: 'Error: Database error' })
      );
    });
  });

  describe('analyzeQueryPerformance', () => {
    it('should analyze query performance and return metrics', async () => {
      const mockQuery = { userId: '123', date: { $gte: new Date() } };
      const mockExplainResult = {
        executionStats: {
          executionTimeMillis: 50,
          totalDocsExamined: 100,
          totalDocsReturned: 10,
          executionStages: {
            stage: 'IXSCAN',
            indexName: 'userId_1_date_-1'
          }
        }
      };

      mockCollection.find.mockReturnValue({
        explain: jest.fn().mockResolvedValue(mockExplainResult)
      });

      const result = await databaseOptimizationService.analyzeQueryPerformance(
        mockQuery,
        'transactions'
      );

      expect(result).toEqual({
        collection: 'transactions',
        query: mockQuery,
        executionTime: 50,
        totalDocsExamined: 100,
        totalDocsReturned: 10,
        indexUsed: 'userId_1_date_-1',
        isIndexUsed: true,
        efficiency: 10
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Query performance analysis',
        expect.objectContaining({
          collection: 'transactions',
          executionTime: 50,
          isIndexUsed: true
        })
      );
    });

    it('should handle collection scan queries', async () => {
      const mockQuery = { userId: '123' };
      const mockExplainResult = {
        executionStats: {
          executionTimeMillis: 500,
          totalDocsExamined: 1000,
          totalDocsReturned: 10,
          executionStages: {
            stage: 'COLLSCAN'
          }
        }
      };

      mockCollection.find.mockReturnValue({
        explain: jest.fn().mockResolvedValue(mockExplainResult)
      });

      const result = await databaseOptimizationService.analyzeQueryPerformance(
        mockQuery,
        'transactions'
      );

      expect(result.isIndexUsed).toBe(false);
      expect(result.indexUsed).toBe('COLLSCAN');
    });
  });

  describe('getIndexUsageStats', () => {
    it('should return index usage statistics', async () => {
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { name: 'transactions' },
          { name: 'budgets' }
        ])
      });

      mockCollection.aggregate.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            name: 'userId_1_date_-1',
            key: { userId: 1, date: -1 },
            accesses: { ops: 100 }
          }
        ])
      });

      const result = await databaseOptimizationService.getIndexUsageStats();

      expect(result).toEqual({
        transactions: {
          totalIndexes: 1,
          indexes: [
            {
              name: 'userId_1_date_-1',
              key: { userId: 1, date: -1 },
              accesses: { ops: 100 },
              lastAccess: 100
            }
          ]
        },
        budgets: {
          totalIndexes: 1,
          indexes: [
            {
              name: 'userId_1_date_-1',
              key: { userId: 1, date: -1 },
              accesses: { ops: 100 },
              lastAccess: 100
            }
          ]
        }
      });
    });
  });

  describe('validateCriticalIndexes', () => {
    it('should validate that critical indexes exist', async () => {
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { name: 'transactions' },
          { name: 'budgets' },
          { name: 'categories' }
        ])
      });

      // Mock indexes for each collection
      mockCollection.indexes
        .mockResolvedValueOnce([
          { name: '_id_', key: { _id: 1 } },
          { name: 'userId_1_date_-1', key: { userId: 1, date: -1 } },
          { name: 'userId_1_categoryId_1_date_-1', key: { userId: 1, categoryId: 1, date: -1 } },
          { name: 'userId_1_type_1_date_-1', key: { userId: 1, type: 1, date: -1 } },
          { name: 'userId_1_accountId_1_date_-1', key: { userId: 1, accountId: 1, date: -1 } }
        ])
        .mockResolvedValueOnce([
          { name: '_id_', key: { _id: 1 } },
          { name: 'userId_1_status_1', key: { userId: 1, status: 1 } },
          { name: 'userId_1_startDate_1_endDate_1', key: { userId: 1, startDate: 1, endDate: 1 } }
        ])
        .mockResolvedValueOnce([
          { name: '_id_', key: { _id: 1 } },
          { name: 'userId_1_parentId_1_name_1', key: { userId: 1, parentId: 1, name: 1 } },
          { name: 'userId_1_isActive_1', key: { userId: 1, isActive: 1 } }
        ]);

      const result = await databaseOptimizationService.validateCriticalIndexes();

      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });

    it('should detect missing critical indexes', async () => {
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { name: 'transactions' },
          { name: 'budgets' },
          { name: 'categories' }
        ])
      });

      // Mock missing indexes
      mockCollection.indexes
        .mockResolvedValueOnce([
          { name: '_id_', key: { _id: 1 } }
          // Missing critical transaction indexes
        ])
        .mockResolvedValueOnce([
          { name: '_id_', key: { _id: 1 } }
          // Missing critical budget indexes
        ])
        .mockResolvedValueOnce([
          { name: '_id_', key: { _id: 1 } }
          // Missing critical category indexes
        ]);

      const result = await databaseOptimizationService.validateCriticalIndexes();

      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });
  });

  describe('createMissingIndexes', () => {
    it('should create missing indexes', async () => {
      const missingIndexes = [
        'transactions: {"userId":1,"date":-1}',
        'budgets: {"userId":1,"status":1}'
      ];

      mockCollection.createIndex.mockResolvedValue('index_created');

      await databaseOptimizationService.createMissingIndexes(missingIndexes);

      expect(mockCollection.createIndex).toHaveBeenCalledTimes(2);
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { userId: 1, date: -1 },
        { background: true }
      );
      expect(mockCollection.createIndex).toHaveBeenCalledWith(
        { userId: 1, status: 1 },
        { background: true }
      );

      expect(logger.info).toHaveBeenCalledWith('Creating missing indexes...', { count: 2 });
      expect(logger.info).toHaveBeenCalledWith('All missing indexes created successfully');
    });
  });

  describe('getDatabaseMetrics', () => {
    it('should return database metrics', async () => {
      const mockDbStats = {
        collections: 3,
        dataSize: 1024000,
        storageSize: 2048000,
        totalIndexSize: 512000,
        indexes: 15
      };

      const mockCollectionStats = {
        count: 1000,
        size: 512000,
        avgObjSize: 512,
        storageSize: 1024000,
        totalIndexSize: 256000,
        indexSizes: {
          '_id_': 1024,
          'userId_1_date_-1': 2048
        }
      };

      mockDb.stats.mockResolvedValue(mockDbStats);
      mockDb.listCollections.mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { name: 'transactions' },
          { name: 'budgets' }
        ])
      });

      mockCollection.stats
        .mockResolvedValueOnce(mockCollectionStats)
        .mockResolvedValueOnce(mockCollectionStats);

      const result = await databaseOptimizationService.getDatabaseMetrics();

      expect(result).toEqual({
        database: {
          collections: 3,
          dataSize: 1024000,
          storageSize: 2048000,
          totalIndexSize: 512000,
          indexCount: 15
        },
        collections: {
          transactions: mockCollectionStats,
          budgets: mockCollectionStats
        }
      });
    });
  });

  describe('optimizePerformance', () => {
    it('should run complete optimization process', async () => {
      // Mock all dependencies
      jest.spyOn(databaseOptimizationService, 'validateCriticalIndexes')
        .mockResolvedValue({ valid: true, missing: [] });
      jest.spyOn(databaseOptimizationService, 'ensureIndexes')
        .mockResolvedValue();
      jest.spyOn(databaseOptimizationService, 'getDatabaseMetrics')
        .mockResolvedValue({ database: {}, collections: {} });
      jest.spyOn(databaseOptimizationService, 'getIndexUsageStats')
        .mockResolvedValue({});

      await databaseOptimizationService.optimizePerformance();

      expect(databaseOptimizationService.validateCriticalIndexes).toHaveBeenCalled();
      expect(databaseOptimizationService.ensureIndexes).toHaveBeenCalled();
      expect(databaseOptimizationService.getDatabaseMetrics).toHaveBeenCalled();
      expect(databaseOptimizationService.getIndexUsageStats).toHaveBeenCalled();

      expect(logger.info).toHaveBeenCalledWith('Starting database performance optimization...');
      expect(logger.info).toHaveBeenCalledWith('Database performance optimization completed');
    });

    it('should create missing indexes if validation fails', async () => {
      const missingIndexes = ['transactions: {"userId":1,"date":-1}'];
      
      jest.spyOn(databaseOptimizationService, 'validateCriticalIndexes')
        .mockResolvedValue({ valid: false, missing: missingIndexes });
      jest.spyOn(databaseOptimizationService, 'createMissingIndexes')
        .mockResolvedValue();
      jest.spyOn(databaseOptimizationService, 'ensureIndexes')
        .mockResolvedValue();
      jest.spyOn(databaseOptimizationService, 'getDatabaseMetrics')
        .mockResolvedValue({ database: {}, collections: {} });
      jest.spyOn(databaseOptimizationService, 'getIndexUsageStats')
        .mockResolvedValue({});

      await databaseOptimizationService.optimizePerformance();

      expect(databaseOptimizationService.createMissingIndexes).toHaveBeenCalledWith(missingIndexes);
      expect(logger.warn).toHaveBeenCalledWith('Missing critical indexes detected', { missing: missingIndexes });
    });
  });
});
