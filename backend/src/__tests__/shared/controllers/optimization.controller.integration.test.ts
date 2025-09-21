import request from 'supertest';
import express from 'express';
import { optimizationController } from '../../../shared/controllers/optimization.controller';
import { databaseOptimizationService } from '../../../shared/services/database-optimization.service';
import { advancedCacheService } from '../../../shared/services/redis-cache.service';
import { djangoCacheService } from '../../../shared/services/django-cache.service';

// Mock the services
jest.mock('../../../shared/services/database-optimization.service');
jest.mock('../../../shared/services/redis-cache.service');
jest.mock('../../../shared/services/django-cache.service');

// Mock logger
jest.mock('../../../shared/services/logger.service', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

const mockDatabaseOptimizationService = databaseOptimizationService as jest.Mocked<typeof databaseOptimizationService>;
const mockAdvancedCacheService = advancedCacheService as jest.Mocked<typeof advancedCacheService>;
const mockDjangoCacheService = djangoCacheService as jest.Mocked<typeof djangoCacheService>;

describe('OptimizationController Integration Tests', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Set up routes
    app.get('/health', optimizationController.getHealthReport);
    app.get('/metrics', optimizationController.getPerformanceMetrics);
    app.post('/analyze-query', optimizationController.analyzeQueryPerformance);
    app.post('/analyze-execution-plan', optimizationController.analyzeQueryExecutionPlan);
    app.get('/index-stats', optimizationController.getIndexUsageStats);
    app.get('/validate-indexes', optimizationController.validateCriticalIndexes);
    app.post('/create-indexes', optimizationController.createMissingIndexes);
    app.post('/optimize', optimizationController.optimizePerformance);
    app.post('/optimize-connections', optimizationController.optimizeConnectionPooling);
    app.get('/cache-stats', optimizationController.getCacheStats);
    app.delete('/cache', optimizationController.clearCache);
    app.get('/database-metrics', optimizationController.getDatabaseMetrics);
    app.post('/comprehensive', optimizationController.runComprehensiveOptimization);

    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return database health report', async () => {
      const mockHealthReport = {
        database: {
          collections: 3,
          dataSize: 1024000,
          healthScore: 85
        },
        collections: {
          transactions: { count: 1000, size: 512000 },
          budgets: { count: 100, size: 256000 },
          categories: { count: 50, size: 128000 }
        },
        performance: {
          'transactions:find': { avgTime: 50, hitRate: 80 }
        },
        cache: {
          totalEntries: 100,
          memoryUsage: 1024000
        },
        healthScore: 85,
        recommendations: ['Consider adding more indexes']
      };

      mockDatabaseOptimizationService.getDatabaseHealthReport.mockResolvedValue(mockHealthReport);

      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockHealthReport,
        message: 'Database health report retrieved successfully'
      });
    });

    it('should handle errors when getting health report', async () => {
      mockDatabaseOptimizationService.getDatabaseHealthReport.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/health')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        message: 'Failed to retrieve database health report',
        error: 'Database error'
      });
    });
  });

  describe('GET /metrics', () => {
    it('should return performance metrics', async () => {
      const mockMetrics = {
        'transactions:find': {
          count: 100,
          avgTime: 50,
          maxTime: 200,
          minTime: 10,
          hitRate: 85
        },
        'budgets:aggregate': {
          count: 50,
          avgTime: 100,
          maxTime: 300,
          minTime: 20,
          hitRate: 90
        }
      };

      mockDatabaseOptimizationService.getPerformanceMetrics.mockReturnValue(mockMetrics);

      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockMetrics,
        message: 'Performance metrics retrieved successfully'
      });
    });
  });

  describe('POST /analyze-query', () => {
    it('should analyze query performance', async () => {
      const queryData = {
        query: { userId: '123', type: 'expense' },
        collection: 'transactions'
      };

      const mockAnalysis = {
        collection: 'transactions',
        query: queryData.query,
        executionTime: 75,
        totalDocsExamined: 500,
        totalDocsReturned: 25,
        indexUsed: 'userId_1_type_1',
        isIndexUsed: true,
        efficiency: 5
      };

      mockDatabaseOptimizationService.analyzeQueryPerformance.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/analyze-query')
        .send(queryData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockAnalysis,
        message: 'Query performance analysis completed'
      });
    });

    it('should return error for missing query or collection', async () => {
      const response = await request(app)
        .post('/analyze-query')
        .send({ query: { userId: '123' } })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Query and collection are required'
      });
    });
  });

  describe('POST /analyze-execution-plan', () => {
    it('should analyze query execution plan', async () => {
      const queryData = {
        query: { userId: '123', date: { $gte: new Date() } },
        collection: 'transactions'
      };

      const mockAnalysis = {
        collection: 'transactions',
        query: queryData.query,
        executionStats: {
          executionTimeMillis: 100,
          totalDocsExamined: 1000,
          totalDocsReturned: 50
        },
        executionStages: {
          stage: 'IXSCAN',
          indexName: 'userId_1_date_-1'
        },
        suggestions: ['Query is using index efficiently'],
        indexRecommendations: [
          {
            type: 'compound',
            fields: { userId: 1, date: -1 },
            reason: 'Common pattern for user data with date sorting'
          }
        ],
        performanceScore: 85
      };

      mockDatabaseOptimizationService.analyzeQueryExecutionPlan.mockResolvedValue(mockAnalysis);

      const response = await request(app)
        .post('/analyze-execution-plan')
        .send(queryData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockAnalysis,
        message: 'Query execution plan analysis completed'
      });
    });
  });

  describe('GET /index-stats', () => {
    it('should return index usage statistics', async () => {
      const mockIndexStats = {
        transactions: {
          totalIndexes: 8,
          indexes: [
            { name: 'userId_1', key: { userId: 1 }, accesses: { ops: 1000 }, lastAccess: 1000 },
            { name: 'userId_1_date_-1', key: { userId: 1, date: -1 }, accesses: { ops: 500 }, lastAccess: 500 }
          ]
        },
        budgets: {
          totalIndexes: 5,
          indexes: [
            { name: 'userId_1_status_1', key: { userId: 1, status: 1 }, accesses: { ops: 200 }, lastAccess: 200 }
          ]
        }
      };

      mockDatabaseOptimizationService.getIndexUsageStats.mockResolvedValue(mockIndexStats);

      const response = await request(app)
        .get('/index-stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockIndexStats,
        message: 'Index usage statistics retrieved successfully'
      });
    });
  });

  describe('GET /validate-indexes', () => {
    it('should validate critical indexes', async () => {
      const mockValidation = {
        valid: true,
        missing: []
      };

      mockDatabaseOptimizationService.validateCriticalIndexes.mockResolvedValue(mockValidation);

      const response = await request(app)
        .get('/validate-indexes')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockValidation,
        message: 'Critical indexes validation completed'
      });
    });

    it('should return missing indexes when validation fails', async () => {
      const mockValidation = {
        valid: false,
        missing: [
          'transactions: {"userId":1,"categoryId":1,"date":-1}',
          'budgets: {"userId":1,"status":1}'
        ]
      };

      mockDatabaseOptimizationService.validateCriticalIndexes.mockResolvedValue(mockValidation);

      const response = await request(app)
        .get('/validate-indexes')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockValidation,
        message: 'Critical indexes validation completed'
      });
    });
  });

  describe('POST /create-indexes', () => {
    it('should create missing indexes', async () => {
      const indexData = {
        missingIndexes: [
          'transactions: {"userId":1,"categoryId":1,"date":-1}',
          'budgets: {"userId":1,"status":1}'
        ]
      };

      mockDatabaseOptimizationService.createMissingIndexes.mockResolvedValue();

      const response = await request(app)
        .post('/create-indexes')
        .send(indexData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Missing indexes created successfully'
      });

      expect(mockDatabaseOptimizationService.createMissingIndexes).toHaveBeenCalledWith(indexData.missingIndexes);
    });

    it('should return error for missing indexes array', async () => {
      const response = await request(app)
        .post('/create-indexes')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        message: 'Missing indexes array is required'
      });
    });
  });

  describe('POST /optimize', () => {
    it('should optimize database performance', async () => {
      mockDatabaseOptimizationService.optimizePerformance.mockResolvedValue();

      const response = await request(app)
        .post('/optimize')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Database performance optimization completed'
      });
    });
  });

  describe('POST /optimize-connections', () => {
    it('should optimize connection pooling', async () => {
      mockDatabaseOptimizationService.optimizeConnectionPooling.mockResolvedValue();

      const response = await request(app)
        .post('/optimize-connections')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Connection pooling optimization completed'
      });
    });
  });

  describe('GET /cache-stats', () => {
    it('should return cache statistics', async () => {
      const mockCacheStats = {
        django: {
          hits: 1000,
          misses: 200,
          sets: 500,
          deletes: 50,
          hitRate: 83.33,
          cacheSize: 100,
          memoryUsage: 1024000
        },
        redis: {
          isConnected: false,
          available: false
        }
      };

      mockAdvancedCacheService.getStats.mockResolvedValue(mockCacheStats);

      const response = await request(app)
        .get('/cache-stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockCacheStats,
        message: 'Cache statistics retrieved successfully'
      });
    });
  });

  describe('DELETE /cache', () => {
    it('should clear all cache', async () => {
      mockAdvancedCacheService.clear.mockResolvedValue(true);

      const response = await request(app)
        .delete('/cache')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'All cache cleared successfully'
      });
    });

    it('should clear cache by pattern', async () => {
      mockAdvancedCacheService.delPattern.mockResolvedValue(5);

      const response = await request(app)
        .delete('/cache')
        .query({ pattern: 'user:*' })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Cache cleared for pattern: user:*',
        deletedCount: 5
      });

      expect(mockAdvancedCacheService.delPattern).toHaveBeenCalledWith('user:*', 1);
    });
  });

  describe('GET /database-metrics', () => {
    it('should return database metrics', async () => {
      const mockMetrics = {
        database: {
          collections: 3,
          dataSize: 2048000,
          storageSize: 4096000,
          totalIndexSize: 1024000,
          indexCount: 15
        },
        collections: {
          transactions: {
            count: 2000,
            size: 1024000,
            avgObjSize: 512,
            storageSize: 2048000,
            totalIndexSize: 512000,
            indexCount: 8
          }
        }
      };

      mockDatabaseOptimizationService.getDatabaseMetrics.mockResolvedValue(mockMetrics);

      const response = await request(app)
        .get('/database-metrics')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockMetrics,
        message: 'Database metrics retrieved successfully'
      });
    });
  });

  describe('POST /comprehensive', () => {
    it('should run comprehensive optimization', async () => {
      const mockValidation = { valid: true, missing: [] };
      const mockHealthReport = {
        healthScore: 90,
        database: { collections: 3 },
        collections: {},
        performance: {},
        cache: { totalEntries: 50 },
        recommendations: ['Database is performing well']
      };

      mockDatabaseOptimizationService.validateCriticalIndexes.mockResolvedValue(mockValidation);
      mockDatabaseOptimizationService.optimizePerformance.mockResolvedValue();
      mockDatabaseOptimizationService.optimizeConnectionPooling.mockResolvedValue();
      mockDatabaseOptimizationService.getDatabaseHealthReport.mockResolvedValue(mockHealthReport);

      const response = await request(app)
        .post('/comprehensive')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          healthReport: mockHealthReport,
          optimizationSteps: [
            'Critical indexes validated and created',
            'Database performance optimized',
            'Connection pooling optimized',
            'Health report generated'
          ]
        },
        message: 'Comprehensive database optimization completed successfully'
      });
    });

    it('should create missing indexes when validation fails', async () => {
      const mockValidation = { 
        valid: false, 
        missing: ['transactions: {"userId":1,"date":-1}'] 
      };
      const mockHealthReport = {
        healthScore: 85,
        database: { collections: 3 },
        collections: {},
        performance: {},
        cache: { totalEntries: 50 },
        recommendations: ['Consider adding more indexes']
      };

      mockDatabaseOptimizationService.validateCriticalIndexes.mockResolvedValue(mockValidation);
      mockDatabaseOptimizationService.createMissingIndexes.mockResolvedValue();
      mockDatabaseOptimizationService.optimizePerformance.mockResolvedValue();
      mockDatabaseOptimizationService.optimizeConnectionPooling.mockResolvedValue();
      mockDatabaseOptimizationService.getDatabaseHealthReport.mockResolvedValue(mockHealthReport);

      const response = await request(app)
        .post('/comprehensive')
        .expect(200);

      expect(mockDatabaseOptimizationService.createMissingIndexes).toHaveBeenCalledWith(mockValidation.missing);
    });
  });
});
