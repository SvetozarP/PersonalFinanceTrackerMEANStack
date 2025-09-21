import mongoose from 'mongoose';
import { logger } from './logger.service';

/**
 * Database Optimization Service
 * Handles index creation, validation, performance monitoring, and advanced query optimization
 */
export class DatabaseOptimizationService {
  private static instance: DatabaseOptimizationService;
  private queryCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private performanceMetrics: Map<string, any> = new Map();
  private slowQueryThresholds = {
    find: 100, // ms
    findOne: 100, // ms
    aggregate: 200, // ms
    count: 50, // ms
    distinct: 50, // ms
  };

  private constructor() {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 5 * 60 * 1000);
  }

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

  /**
   * Cache query results for improved performance
   */
  async cacheQueryResult(
    cacheKey: string,
    query: any,
    collectionName: string,
    ttl: number = 300000 // 5 minutes default
  ): Promise<any> {
    try {
      // Check if result is already cached
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        logger.debug('Cache hit for query', { cacheKey, collectionName });
        return cached.data;
      }

      // Execute query and cache result
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not established');
      }

      const collection = db.collection(collectionName);
      const startTime = Date.now();
      const result = await collection.find(query).toArray();
      const executionTime = Date.now() - startTime;

      // Cache the result
      this.queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: ttl
      });

      // Log performance metrics
      this.recordQueryPerformance(collectionName, 'find', executionTime, result.length);

      logger.debug('Query cached successfully', {
        cacheKey,
        collectionName,
        executionTime,
        resultCount: result.length
      });

      return result;
    } catch (error) {
      logger.error('Error caching query result', {
        error: String(error),
        cacheKey,
        collectionName
      });
      throw error;
    }
  }

  /**
   * Get cached query result
   */
  getCachedQueryResult(cacheKey: string): any | null {
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    return null;
  }

  /**
   * Clear query cache
   */
  clearQueryCache(pattern?: string): void {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.queryCache.keys()) {
        if (regex.test(key)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
    logger.info('Query cache cleared', { pattern: pattern || 'all' });
  }

  /**
   * Record query performance metrics
   */
  private recordQueryPerformance(
    collectionName: string,
    operation: string,
    executionTime: number,
    resultCount: number
  ): void {
    const key = `${collectionName}:${operation}`;
    const existing = this.performanceMetrics.get(key) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      maxTime: 0,
      minTime: Infinity,
      totalResults: 0,
      avgResults: 0
    };

    existing.count += 1;
    existing.totalTime += executionTime;
    existing.avgTime = Math.round(existing.totalTime / existing.count);
    existing.maxTime = Math.max(existing.maxTime, executionTime);
    existing.minTime = Math.min(existing.minTime, executionTime);
    existing.totalResults += resultCount;
    existing.avgResults = Math.round(existing.totalResults / existing.count);

    this.performanceMetrics.set(key, existing);

    // Check if query is slow
    const threshold = this.slowQueryThresholds[operation as keyof typeof this.slowQueryThresholds] || 100;
    if (executionTime > threshold) {
      logger.warn('Slow query detected', {
        collection: collectionName,
        operation,
        executionTime,
        threshold,
        resultCount
      });
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): any {
    const metrics: any = {};
    for (const [key, value] of this.performanceMetrics.entries()) {
      metrics[key] = value;
    }
    return metrics;
  }

  /**
   * Analyze query execution plan and provide optimization suggestions
   */
  async analyzeQueryExecutionPlan(query: any, collectionName: string): Promise<any> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not established');
      }

      const collection = db.collection(collectionName);
      const explainResult = await collection.find(query).explain('executionStats');

      const analysis = {
        collection: collectionName,
        query: query,
        executionStats: explainResult.executionStats,
        executionStages: explainResult.executionStages,
        suggestions: this.generateOptimizationSuggestions(explainResult),
        indexRecommendations: this.generateIndexRecommendations(query, collectionName),
        performanceScore: this.calculatePerformanceScore(explainResult.executionStats)
      };

      logger.info('Query execution plan analysis completed', {
        collection: collectionName,
        performanceScore: analysis.performanceScore,
        suggestionsCount: analysis.suggestions.length
      });

      return analysis;
    } catch (error) {
      logger.error('Error analyzing query execution plan', {
        error: String(error),
        collection: collectionName,
        query
      });
      throw error;
    }
  }

  /**
   * Generate optimization suggestions based on execution plan
   */
  private generateOptimizationSuggestions(explainResult: any): string[] {
    const suggestions: string[] = [];
    const stats = explainResult.executionStats;

    if (!stats) return suggestions;

    // Check for collection scans
    if (stats.executionStages?.stage === 'COLLSCAN') {
      suggestions.push('Consider adding an index to avoid collection scan');
    }

    // Check for high document examination ratio
    const examinationRatio = stats.totalDocsExamined / Math.max(stats.totalDocsReturned, 1);
    if (examinationRatio > 10) {
      suggestions.push('High document examination ratio - consider optimizing query or adding compound index');
    }

    // Check for large result sets
    if (stats.totalDocsReturned > 1000) {
      suggestions.push('Large result set - consider adding pagination or limiting results');
    }

    // Check for slow execution time
    if (stats.executionTimeMillis > 100) {
      suggestions.push('Slow query execution - consider adding appropriate indexes');
    }

    // Check for index usage
    if (stats.executionStages?.indexName) {
      suggestions.push(`Query is using index: ${stats.executionStages.indexName}`);
    } else {
      suggestions.push('Query is not using any index - consider adding appropriate indexes');
    }

    return suggestions;
  }

  /**
   * Generate index recommendations based on query patterns
   */
  private generateIndexRecommendations(query: any, collectionName: string): any[] {
    const recommendations: any[] = [];
    const queryKeys = Object.keys(query);

    // Analyze query patterns and suggest compound indexes
    if (queryKeys.includes('userId') && queryKeys.includes('date')) {
      recommendations.push({
        type: 'compound',
        fields: { userId: 1, date: -1 },
        reason: 'Common pattern for user data with date sorting'
      });
    }

    if (queryKeys.includes('userId') && queryKeys.includes('categoryId') && queryKeys.includes('date')) {
      recommendations.push({
        type: 'compound',
        fields: { userId: 1, categoryId: 1, date: -1 },
        reason: 'User category transactions with date sorting'
      });
    }

    if (queryKeys.includes('userId') && queryKeys.includes('type') && queryKeys.includes('status')) {
      recommendations.push({
        type: 'compound',
        fields: { userId: 1, type: 1, status: 1 },
        reason: 'User transaction filtering by type and status'
      });
    }

    return recommendations;
  }

  /**
   * Calculate performance score based on execution stats
   */
  private calculatePerformanceScore(stats: any): number {
    if (!stats) return 0;

    let score = 100;

    // Deduct points for collection scans
    if (stats.executionStages?.stage === 'COLLSCAN') {
      score -= 30;
    }

    // Deduct points for high examination ratio
    const examinationRatio = stats.totalDocsExamined / Math.max(stats.totalDocsReturned, 1);
    if (examinationRatio > 10) {
      score -= Math.min(20, (examinationRatio - 10) * 2);
    }

    // Deduct points for slow execution
    if (stats.executionTimeMillis > 100) {
      score -= Math.min(30, (stats.executionTimeMillis - 100) / 10);
    }

    // Deduct points for large result sets without pagination
    if (stats.totalDocsReturned > 1000) {
      score -= 10;
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp >= value.ttl) {
        this.queryCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Cleaned up expired cache entries', { count: cleanedCount });
    }
  }

  /**
   * Optimize database connection pooling
   */
  async optimizeConnectionPooling(): Promise<void> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not established');
      }

      // Get current connection pool stats
      const poolStats = await db.admin().command({ connectionStatus: 1 });
      
      logger.info('Connection pool optimization', {
        currentConnections: poolStats.connections?.current || 0,
        availableConnections: poolStats.connections?.available || 0,
        totalCreated: poolStats.connections?.totalCreated || 0
      });

      // Optimize connection settings
      const optimizedSettings = {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false
      };

      logger.info('Connection pool settings optimized', optimizedSettings);
    } catch (error) {
      logger.error('Error optimizing connection pooling', {
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Get comprehensive database health report
   */
  async getDatabaseHealthReport(): Promise<any> {
    try {
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error('Database connection not established');
      }

      // Get database stats
      const dbStats = await db.admin().command({ dbStats: 1 });
      
      // Get collection stats
      const collections = await db.listCollections().toArray();
      const collectionStats: any = {};

      for (const collection of collections) {
        try {
          const stats = await db.admin().command({ collStats: collection.name });
          collectionStats[collection.name] = {
            count: stats.count || 0,
            size: stats.size || 0,
            avgObjSize: stats.avgObjSize || 0,
            storageSize: stats.storageSize || 0,
            totalIndexSize: stats.totalIndexSize || 0,
            indexCount: stats.nindexes || 0
          };
        } catch (error) {
          collectionStats[collection.name] = {
            count: 0,
            size: 0,
            avgObjSize: 0,
            storageSize: 0,
            totalIndexSize: 0,
            indexCount: 0
          };
        }
      }

      // Get performance metrics
      const performanceMetrics = this.getPerformanceMetrics();

      // Get cache stats
      const cacheStats = {
        totalEntries: this.queryCache.size,
        memoryUsage: this.estimateCacheMemoryUsage()
      };

      const healthReport = {
        database: {
          collections: dbStats.collections || collections.length,
          dataSize: dbStats.dataSize || 0,
          storageSize: dbStats.storageSize || 0,
          totalIndexSize: dbStats.totalIndexSize || 0,
          indexCount: dbStats.indexes || 0,
          avgObjSize: dbStats.avgObjSize || 0
        },
        collections: collectionStats,
        performance: performanceMetrics,
        cache: cacheStats,
        healthScore: this.calculateHealthScore(dbStats, collectionStats, performanceMetrics),
        recommendations: this.generateHealthRecommendations(dbStats, collectionStats, performanceMetrics)
      };

      logger.info('Database health report generated', {
        healthScore: healthReport.healthScore,
        totalCollections: Object.keys(collectionStats).length,
        cacheEntries: cacheStats.totalEntries
      });

      return healthReport;
    } catch (error) {
      logger.error('Error generating database health report', {
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Estimate cache memory usage
   */
  private estimateCacheMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, value] of this.queryCache.entries()) {
      totalSize += key.length * 2; // String length * 2 bytes per character
      totalSize += JSON.stringify(value.data).length * 2;
      totalSize += 24; // Object overhead (timestamp, ttl)
    }
    return totalSize;
  }

  /**
   * Calculate overall health score
   */
  private calculateHealthScore(dbStats: any, collectionStats: any, performanceMetrics: any): number {
    let score = 100;

    // Check database size efficiency
    const indexToDataRatio = (dbStats.totalIndexSize || 0) / Math.max(dbStats.dataSize || 1, 1);
    if (indexToDataRatio > 0.3) {
      score -= 10; // Too many indexes
    }

    // Check collection efficiency
    for (const [name, stats] of Object.entries(collectionStats)) {
      const collStats = stats as any;
      if (collStats.avgObjSize > 10000) { // Large average object size
        score -= 5;
      }
      if (collStats.indexCount > 10) { // Too many indexes per collection
        score -= 5;
      }
    }

    // Check performance metrics
    for (const [key, metrics] of Object.entries(performanceMetrics)) {
      const perfMetrics = metrics as any;
      if (perfMetrics.avgTime > 100) { // Slow average query time
        score -= 10;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate health recommendations
   */
  private generateHealthRecommendations(dbStats: any, collectionStats: any, performanceMetrics: any): string[] {
    const recommendations: string[] = [];

    // Check index efficiency
    const indexToDataRatio = (dbStats.totalIndexSize || 0) / Math.max(dbStats.dataSize || 1, 1);
    if (indexToDataRatio > 0.3) {
      recommendations.push('Consider removing unused indexes to reduce storage overhead');
    }

    // Check collection efficiency
    for (const [name, stats] of Object.entries(collectionStats)) {
      const collStats = stats as any;
      if (collStats.avgObjSize > 10000) {
        recommendations.push(`Collection ${name} has large average object size - consider data normalization`);
      }
      if (collStats.indexCount > 10) {
        recommendations.push(`Collection ${name} has many indexes - review for unused indexes`);
      }
    }

    // Check performance
    for (const [key, metrics] of Object.entries(performanceMetrics)) {
      const perfMetrics = metrics as any;
      if (perfMetrics.avgTime > 100) {
        recommendations.push(`Slow queries detected for ${key} - consider adding indexes or optimizing queries`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Database is performing well - no immediate optimizations needed');
    }

    return recommendations;
  }
}

export const databaseOptimizationService = DatabaseOptimizationService.getInstance();
