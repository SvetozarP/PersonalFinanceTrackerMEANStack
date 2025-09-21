import { logger } from './logger.service';
import { djangoCacheService } from './django-cache.service';

/**
 * Advanced Cache Service
 * Provides advanced caching capabilities for database query results using Django-style caching
 * with Redis as an optional fallback for distributed scenarios
 */
export class AdvancedCacheService {
  private static instance: AdvancedCacheService;
  private redisClient: any = null;
  private isRedisConnected: boolean = false;

  private constructor() {
    this.initializeRedisFallback();
  }

  public static getInstance(): AdvancedCacheService {
    if (!AdvancedCacheService.instance) {
      AdvancedCacheService.instance = new AdvancedCacheService();
    }
    return AdvancedCacheService.instance;
  }

  /**
   * Initialize Redis as fallback cache
   */
  private async initializeRedisFallback(): Promise<void> {
    try {
      // Only initialize Redis if explicitly configured
      if (process.env.USE_REDIS_CACHE === 'true') {
        const redis = require('redis');
        
        // Create Redis client
        this.redisClient = redis.createClient({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          retry_strategy: (options: any) => {
            if (options.error && options.error.code === 'ECONNREFUSED') {
              logger.warn('Redis server connection refused, using Django cache only');
              return new Error('Redis server connection refused');
            }
            if (options.total_retry_time > 1000 * 60 * 60) {
              logger.error('Redis retry time exhausted');
              return new Error('Retry time exhausted');
            }
            if (options.attempt > 10) {
              logger.warn('Redis max retry attempts reached, using Django cache only');
              return undefined;
            }
            return Math.min(options.attempt * 100, 3000);
          }
        });

        // Handle connection events
        this.redisClient.on('connect', () => {
          logger.info('Redis fallback cache connected');
          this.isRedisConnected = true;
        });

        this.redisClient.on('error', (error: Error) => {
          logger.warn('Redis fallback cache error, using Django cache only', { error: error.message });
          this.isRedisConnected = false;
        });

        this.redisClient.on('end', () => {
          logger.warn('Redis fallback cache connection ended, using Django cache only');
          this.isRedisConnected = false;
        });

        // Connect to Redis
        await this.redisClient.connect();
      } else {
        logger.info('Redis fallback cache disabled, using Django cache only');
      }
    } catch (error) {
      logger.warn('Redis fallback cache not available, using Django cache only', { error: String(error) });
      this.isRedisConnected = false;
    }
  }

  /**
   * Set cache value (Django-style primary, Redis fallback)
   */
  async set(key: string, value: any, ttl: number = 300, version: number = 1): Promise<boolean> {
    try {
      // Primary: Django-style cache
      const djangoResult = await djangoCacheService.set(key, value, ttl, version);
      
      if (djangoResult) {
        logger.debug('Cache set in Django cache', { key, ttl, version });
      }

      // Fallback: Redis cache (if available)
      if (this.isRedisConnected && this.redisClient) {
        try {
          const cacheEntry = {
            data: value,
            timestamp: Date.now(),
            ttl: ttl * 1000,
            version: version
          };
          const serializedValue = JSON.stringify(cacheEntry);
          await this.redisClient.setEx(key, ttl, serializedValue);
          logger.debug('Cache also set in Redis fallback', { key, ttl, version });
        } catch (redisError) {
          logger.debug('Redis fallback failed, using Django cache only', { error: String(redisError) });
        }
      }

      return djangoResult;
    } catch (error) {
      logger.error('Error setting cache', { key, error: String(error) });
      return false;
    }
  }

  /**
   * Get cache value (Django-style primary, Redis fallback)
   */
  async get(key: string, version: number = 1, default: any = null): Promise<any | null> {
    try {
      // Primary: Django-style cache
      const djangoResult = await djangoCacheService.get(key, version, null);
      
      if (djangoResult !== null) {
        logger.debug('Cache hit in Django cache', { key, version });
        return djangoResult;
      }

      // Fallback: Redis cache (if available)
      if (this.isRedisConnected && this.redisClient) {
        try {
          const cached = await this.redisClient.get(key);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.timestamp < parsed.ttl) {
              logger.debug('Cache hit in Redis fallback', { key, version });
              // Also store in Django cache for future requests
              await djangoCacheService.set(key, parsed.data, parsed.ttl / 1000, version);
              return parsed.data;
            } else {
              // Expired, remove from cache
              await this.del(key);
            }
          }
        } catch (redisError) {
          logger.debug('Redis fallback failed, using Django cache only', { error: String(redisError) });
        }
      }

      logger.debug('Cache miss', { key, version });
      return default;
    } catch (error) {
      logger.error('Error getting cache', { key, error: String(error) });
      return default;
    }
  }

  /**
   * Delete cache value (Django-style primary, Redis fallback)
   */
  async del(key: string, version: number = 1): Promise<boolean> {
    try {
      // Primary: Django-style cache
      const djangoResult = await djangoCacheService.delete(key, version);
      
      if (djangoResult) {
        logger.debug('Cache deleted from Django cache', { key, version });
      }

      // Fallback: Redis cache (if available)
      if (this.isRedisConnected && this.redisClient) {
        try {
          await this.redisClient.del(key);
          logger.debug('Cache also deleted from Redis fallback', { key, version });
        } catch (redisError) {
          logger.debug('Redis fallback delete failed', { error: String(redisError) });
        }
      }

      return djangoResult;
    } catch (error) {
      logger.error('Error deleting cache', { key, error: String(error) });
      return false;
    }
  }

  /**
   * Delete multiple cache values by pattern (Django-style primary, Redis fallback)
   */
  async delPattern(pattern: string, version: number = 1): Promise<number> {
    try {
      let deletedCount = 0;

      // Primary: Django-style cache
      const djangoKeys = await djangoCacheService.getKeys(pattern);
      if (djangoKeys.length > 0) {
        deletedCount = await djangoCacheService.deleteMany(djangoKeys, version);
        logger.debug('Cache pattern deleted from Django cache', { pattern, count: deletedCount, version });
      }

      // Fallback: Redis cache (if available)
      if (this.isRedisConnected && this.redisClient) {
        try {
          const keys = await this.redisClient.keys(pattern);
          if (keys.length > 0) {
            await this.redisClient.del(keys);
            logger.debug('Cache pattern also deleted from Redis fallback', { pattern, count: keys.length });
          }
        } catch (redisError) {
          logger.debug('Redis fallback pattern delete failed', { error: String(redisError) });
        }
      }

      return deletedCount;
    } catch (error) {
      logger.error('Error deleting cache pattern', { pattern, error: String(error) });
      return 0;
    }
  }

  /**
   * Check if key exists in cache (Django-style primary, Redis fallback)
   */
  async exists(key: string, version: number = 1): Promise<boolean> {
    try {
      // Primary: Django-style cache
      const djangoResult = await djangoCacheService.hasKey(key, version);
      
      if (djangoResult) {
        return true;
      }

      // Fallback: Redis cache (if available)
      if (this.isRedisConnected && this.redisClient) {
        try {
          const exists = await this.redisClient.exists(key);
          return exists === 1;
        } catch (redisError) {
          logger.debug('Redis fallback exists check failed', { error: String(redisError) });
        }
      }

      return false;
    } catch (error) {
      logger.error('Error checking cache existence', { key, error: String(error) });
      return false;
    }
  }

  /**
   * Get cache statistics (Django-style primary, Redis fallback)
   */
  async getStats(): Promise<any> {
    try {
      // Primary: Django-style cache stats
      const djangoStats = djangoCacheService.getStats();
      
      const stats = {
        django: djangoStats,
        redis: {
          isConnected: this.isRedisConnected,
          available: this.isRedisConnected && this.redisClient
        }
      };

      // Fallback: Redis cache stats (if available)
      if (this.isRedisConnected && this.redisClient) {
        try {
          const info = await this.redisClient.info('memory');
          const memoryInfo = this.parseRedisInfo(info);
          stats.redis = {
            ...stats.redis,
            usedMemory: memoryInfo.used_memory,
            usedMemoryHuman: memoryInfo.used_memory_human,
            maxMemory: memoryInfo.maxmemory,
            maxMemoryHuman: memoryInfo.maxmemory_human
          };
        } catch (error) {
          logger.debug('Could not get Redis memory info', { error: String(error) });
        }
      }

      return stats;
    } catch (error) {
      logger.error('Error getting cache stats', { error: String(error) });
      return { 
        django: { cacheSize: 0, hits: 0, misses: 0 },
        redis: { isConnected: false, available: false }
      };
    }
  }

  /**
   * Clear all cache (Django-style primary, Redis fallback)
   */
  async clear(): Promise<boolean> {
    try {
      // Primary: Django-style cache
      const djangoResult = await djangoCacheService.clear();
      
      if (djangoResult) {
        logger.info('Django cache cleared');
      }

      // Fallback: Redis cache (if available)
      if (this.isRedisConnected && this.redisClient) {
        try {
          await this.redisClient.flushAll();
          logger.info('Redis fallback cache also cleared');
        } catch (redisError) {
          logger.debug('Redis fallback clear failed', { error: String(redisError) });
        }
      }
      
      return djangoResult;
    } catch (error) {
      logger.error('Error clearing cache', { error: String(error) });
      return false;
    }
  }

  /**
   * Set cache with automatic key generation (Django-style primary, Redis fallback)
   */
  async setWithAutoKey(prefix: string, data: any, ttl: number = 300, version: number = 1): Promise<string> {
    const key = `${prefix}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    await this.set(key, data, ttl, version);
    return key;
  }

  /**
   * Get or set cache (cache-aside pattern) (Django-style primary, Redis fallback)
   */
  async getOrSet(
    key: string,
    fetchFunction: () => Promise<any>,
    ttl: number = 300,
    version: number = 1
  ): Promise<any> {
    try {
      // Try to get from cache first
      const cached = await this.get(key, version);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, fetch data
      const data = await fetchFunction();
      
      // Store in cache
      await this.set(key, data, ttl, version);
      
      return data;
    } catch (error) {
      logger.error('Error in getOrSet', { key, error: String(error) });
      throw error;
    }
  }

  /**
   * Cache database query results (Django-style primary, Redis fallback)
   */
  async cacheQuery(
    collectionName: string,
    query: any,
    options: any = {},
    ttl: number = 300,
    version: number = 1
  ): Promise<any> {
    const cacheKey = this.generateQueryCacheKey(collectionName, query, options);
    
    return this.getOrSet(
      cacheKey,
      async () => {
        // This would be implemented by the calling service
        throw new Error('Query execution not implemented in cache service');
      },
      ttl,
      version
    );
  }

  /**
   * Generate cache key for database queries
   */
  private generateQueryCacheKey(collectionName: string, query: any, options: any): string {
    const queryStr = JSON.stringify({ collection: collectionName, query, options });
    const hash = this.simpleHash(queryStr);
    return `query:${collectionName}:${hash}`;
  }

  /**
   * Simple hash function for cache keys
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Parse Redis INFO command output
   */
  private parseRedisInfo(info: string): any {
    const result: any = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }
    
    return result;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try {
      if (this.redisClient && this.isRedisConnected) {
        await this.redisClient.quit();
        this.isRedisConnected = false;
        logger.info('Redis fallback connection closed');
      }
    } catch (error) {
      logger.error('Error closing Redis connection', { error: String(error) });
    }
  }
}

export const advancedCacheService = AdvancedCacheService.getInstance();
