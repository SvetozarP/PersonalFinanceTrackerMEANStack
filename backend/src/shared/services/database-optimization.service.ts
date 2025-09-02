import mongoose from 'mongoose';
import { logger } from './logger.service';

/**
 * Database Optimization Service
 * Handles index creation, validation, and performance monitoring
 */
export class DatabaseOptimizationService {
  private static instance: DatabaseOptimizationService;

  private constructor() {}

  public static getInstance(): DatabaseOptimizationService {
    if (!DatabaseOptimizationService.instance) {
      DatabaseOptimizationService.instance = new DatabaseOptimizationService();
    }
    return DatabaseOptimizationService.instance;
  }

  /**
   * Ensure all required indexes are created for optimal performance
   */
  async ensureIndexes(): Promise<void> {
    try {
      logger.info('Starting database index optimization...');

      // Get all collections
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not established');
      }
      const collections = await db.listCollections().toArray();
      
      for (const collection of collections) {
        const collectionName = collection.name;
        logger.info(`Optimizing indexes for collection: ${collectionName}`);
        
        // Get current indexes
        const currentIndexes = await db
          .collection(collectionName)
          .indexes();
        
        logger.info(`Current indexes for ${collectionName}:`, {
          count: currentIndexes.length,
          indexes: currentIndexes.map(idx => ({
            name: idx.name,
            key: idx.key,
            unique: idx.unique,
            sparse: idx.sparse,
            background: idx.background
          }))
        });
      }

      logger.info('Database index optimization completed successfully');
    } catch (error) {
      logger.error('Error during database index optimization', {
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Analyze query performance and suggest index optimizations
   */
  async analyzeQueryPerformance(query: any, collectionName: string): Promise<any> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not established');
      }
      const collection = db.collection(collectionName);
      
      // Use explain to analyze query performance
      const explainResult = await collection.find(query).explain('executionStats');
      
      const analysis = {
        collection: collectionName,
        query: query,
        executionTime: explainResult.executionStats?.executionTimeMillis || 0,
        totalDocsExamined: explainResult.executionStats?.totalDocsExamined || 0,
        totalDocsReturned: explainResult.executionStats?.totalDocsReturned || 0,
        indexUsed: explainResult.executionStats?.executionStages?.indexName || 'COLLSCAN',
        isIndexUsed: explainResult.executionStats?.executionStages?.stage !== 'COLLSCAN',
        efficiency: this.calculateEfficiency(
          explainResult.executionStats?.totalDocsExamined || 0,
          explainResult.executionStats?.totalDocsReturned || 0
        )
      };

      logger.info('Query performance analysis', analysis);
      return analysis;
    } catch (error) {
      logger.error('Error analyzing query performance', {
        error: String(error),
        collection: collectionName,
        query
      });
      throw error;
    }
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsageStats(): Promise<any> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not established');
      }
      const collections = await db.listCollections().toArray();
      const stats: any = {};

      for (const collection of collections) {
        const collectionName = collection.name;
        
        // Get index stats
        const indexStats = await db
          .collection(collectionName)
          .aggregate([
            { $indexStats: {} }
          ])
          .toArray();

        stats[collectionName] = {
          totalIndexes: indexStats.length,
          indexes: indexStats.map((stat: any) => ({
            name: stat.name,
            key: stat.key,
            accesses: stat.accesses,
            lastAccess: stat.accesses?.ops || 0
          }))
        };
      }

      logger.info('Index usage statistics retrieved', stats);
      return stats;
    } catch (error) {
      logger.error('Error getting index usage statistics', {
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Validate that critical indexes exist
   */
  async validateCriticalIndexes(): Promise<{ valid: boolean; missing: string[] }> {
    try {
      const criticalIndexes = [
        // Transaction indexes
        { collection: 'transactions', index: { userId: 1, date: -1 } },
        { collection: 'transactions', index: { userId: 1, categoryId: 1, date: -1 } },
        { collection: 'transactions', index: { userId: 1, type: 1, date: -1 } },
        { collection: 'transactions', index: { userId: 1, accountId: 1, date: -1 } },
        
        // Budget indexes
        { collection: 'budgets', index: { userId: 1, status: 1 } },
        { collection: 'budgets', index: { userId: 1, startDate: 1, endDate: 1 } },
        
        // Category indexes
        { collection: 'categories', index: { userId: 1, parentId: 1, name: 1 } },
        { collection: 'categories', index: { userId: 1, isActive: 1 } }
      ];

      const missing: string[] = [];

      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not established');
      }

      for (const criticalIndex of criticalIndexes) {
        try {
          const collection = db.collection(criticalIndex.collection);
          const indexes = await collection.indexes();
          
          const indexExists = indexes.some(index => 
            this.compareIndexKeys(index.key, criticalIndex.index)
          );

          if (!indexExists) {
            missing.push(`${criticalIndex.collection}: ${JSON.stringify(criticalIndex.index)}`);
          }
        } catch (error) {
          // If collection doesn't exist, consider the index missing
          missing.push(`${criticalIndex.collection}: ${JSON.stringify(criticalIndex.index)} (collection not found)`);
        }
      }

      const isValid = missing.length === 0;
      
      logger.info('Critical indexes validation completed', {
        valid: isValid,
        missing: missing
      });

      return { valid: isValid, missing };
    } catch (error) {
      logger.error('Error validating critical indexes', {
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Create missing indexes in background
   */
  async createMissingIndexes(missingIndexes: string[]): Promise<void> {
    try {
      logger.info('Creating missing indexes...', { count: missingIndexes.length });

      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not established');
      }

      for (const missingIndex of missingIndexes) {
        const [collectionName, indexStr] = missingIndex.split(': ');
        if (!collectionName || !indexStr) {
          logger.warn('Skipping malformed missing index', { missingIndex });
          continue;
        }
        
        let indexKey;
        try {
          indexKey = JSON.parse(indexStr);
        } catch (error) {
          logger.warn('Skipping invalid index JSON', { missingIndex, error: String(error) });
          continue;
        }
        
                const collection = db.collection(collectionName);
        try {
          await collection.createIndex(indexKey, { background: true });
          logger.info(`Created index for ${collectionName}`, { index: indexKey });
        } catch (error) {
          // Index might already exist, check if it's a duplicate name error
          if (error instanceof Error && error.message.includes('same name')) {
            logger.info(`Index already exists for ${collectionName}`, { index: indexKey });
          } else {
            logger.warn(`Failed to create index for ${collectionName}`, { 
              index: indexKey, 
              error: error instanceof Error ? error.message : String(error) 
            });
          }
        }
      }

      logger.info('All missing indexes created successfully');
    } catch (error) {
      logger.error('Error creating missing indexes', {
        error: String(error),
        missingIndexes
      });
      throw error;
    }
  }

  /**
   * Get database performance metrics
   */
  async getDatabaseMetrics(): Promise<any> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not established');
      }
      
      // Get collection stats
      const collections = await db.listCollections().toArray();
      const collectionStats: any = {};

      for (const collection of collections) {
        try {
          // Use the admin command to get collection stats
          const stats = await db.admin().command({ collStats: collection.name });
          collectionStats[collection.name] = {
            count: stats.count || 0,
            size: stats.size || 0,
            avgObjSize: stats.avgObjSize || 0,
            storageSize: stats.storageSize || 0,
            totalIndexSize: stats.totalIndexSize || 0,
            indexSizes: stats.indexSizes || {}
          };
        } catch (error) {
          // If collection doesn't exist or stats fail, use default values
          collectionStats[collection.name] = {
            count: 0,
            size: 0,
            avgObjSize: 0,
            storageSize: 0,
            totalIndexSize: 0,
            indexSizes: {}
          };
        }
      }

      try {
        // Get database stats
        const dbStats = await db.admin().command({ dbStats: 1 });
        const metrics = {
          database: {
            collections: dbStats.collections || collections.length,
            dataSize: dbStats.dataSize || 0,
            storageSize: dbStats.storageSize || 0,
            totalIndexSize: dbStats.totalIndexSize || 0,
            indexCount: dbStats.indexes || 0
          },
          collections: collectionStats
        };

        logger.info('Database metrics retrieved', metrics);
        return metrics;
      } catch (error) {
        // Fallback if dbStats fails
        const metrics = {
          database: {
            collections: collections.length,
            dataSize: 0,
            storageSize: 0,
            totalIndexSize: 0,
            indexCount: 0
          },
          collections: collectionStats
        };

        logger.info('Database metrics retrieved (fallback)', metrics);
        return metrics;
      }
    } catch (error) {
      logger.error('Error getting database metrics', {
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Optimize database performance
   */
  async optimizePerformance(): Promise<void> {
    try {
      logger.info('Starting database performance optimization...');

      // 1. Validate critical indexes
      const validation = await this.validateCriticalIndexes();
      if (!validation.valid) {
        logger.warn('Missing critical indexes detected', { missing: validation.missing });
        await this.createMissingIndexes(validation.missing);
      }

      // 2. Ensure all indexes are created
      await this.ensureIndexes();

      // 3. Get performance metrics
      const metrics = await this.getDatabaseMetrics();
      
      // 4. Get index usage stats
      const indexStats = await this.getIndexUsageStats();

      logger.info('Database performance optimization completed', {
        metrics,
        indexStats
      });
    } catch (error) {
      logger.error('Error during database performance optimization', {
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Helper method to compare index keys
   */
  private compareIndexKeys(key1: any, key2: any): boolean {
    const keys1 = Object.keys(key1).sort();
    const keys2 = Object.keys(key2).sort();
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    for (let i = 0; i < keys1.length; i++) {
      if (keys1[i] !== keys2[i] || key1[keys1[i]] !== key2[keys2[i]]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Calculate query efficiency
   */
  private calculateEfficiency(docsExamined: number, docsReturned: number): number {
    if (docsExamined === 0) return 100;
    return Math.round((docsReturned / docsExamined) * 100);
  }
}

export const databaseOptimizationService = DatabaseOptimizationService.getInstance();
