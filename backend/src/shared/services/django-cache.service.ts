import { logger } from './logger.service';

/**
 * Django-Style Cache Service
 * Implements Django's cache framework functionality for Node.js/TypeScript
 * Provides local memory cache with TTL, versioning, and cache key management
 */
export class DjangoCacheService {
  private static instance: DjangoCacheService;
  private cache: Map<string, { data: any; timestamp: number; ttl: number; version: number }> = new Map();
  private cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    version: 1
  };
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeCache();
  }

  public static getInstance(): DjangoCacheService {
    if (!DjangoCacheService.instance) {
      DjangoCacheService.instance = new DjangoCacheService();
    }
    return DjangoCacheService.instance;
  }

  /**
   * Initialize Django-style cache
   */
  private initializeCache(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);

    logger.info('Django-style cache initialized');
  }

  /**
   * Set cache value with Django-style key management
   */
  async set(key: string, value: any, timeout: number = 300, version: number = 1): Promise<boolean> {
    try {
      const cacheKey = this.makeKey(key, version);
      const cacheEntry = {
        data: value,
        timestamp: Date.now(),
        ttl: timeout * 1000, // Convert to milliseconds
        version: version
      };

      this.cache.set(cacheKey, cacheEntry);
      this.cacheStats.sets++;
      
      logger.debug('Cache set', { key: cacheKey, timeout, version });
      return true;
    } catch (error) {
      logger.error('Error setting cache', { key, error: String(error) });
      return false;
    }
  }

  /**
   * Get cache value with Django-style key management
   */
  async get(key: string, version: number = 1, default: any = null): Promise<any> {
    try {
      const cacheKey = this.makeKey(key, version);
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        this.cacheStats.hits++;
        logger.debug('Cache hit', { key: cacheKey, version });
        return cached.data;
      } else if (cached) {
        // Expired, remove from cache
        this.cache.delete(cacheKey);
      }

      this.cacheStats.misses++;
      logger.debug('Cache miss', { key: cacheKey, version });
      return default;
    } catch (error) {
      logger.error('Error getting cache', { key, error: String(error) });
      return default;
    }
  }

  /**
   * Delete cache value
   */
  async delete(key: string, version: number = 1): Promise<boolean> {
    try {
      const cacheKey = this.makeKey(key, version);
      const deleted = this.cache.delete(cacheKey);
      
      if (deleted) {
        this.cacheStats.deletes++;
        logger.debug('Cache deleted', { key: cacheKey, version });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting cache', { key, error: String(error) });
      return false;
    }
  }

  /**
   * Delete multiple cache values by pattern
   */
  async deleteMany(keys: string[], version: number = 1): Promise<number> {
    let deletedCount = 0;
    
    for (const key of keys) {
      if (await this.delete(key, version)) {
        deletedCount++;
      }
    }
    
    logger.debug('Cache deleted many', { count: deletedCount, version });
    return deletedCount;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<boolean> {
    try {
      this.cache.clear();
      this.cacheStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        version: this.cacheStats.version
      };
      
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Error clearing cache', { error: String(error) });
      return false;
    }
  }

  /**
   * Get or set cache value (cache-aside pattern)
   */
  async getOrSet(
    key: string,
    fetchFunction: () => Promise<any>,
    timeout: number = 300,
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
      await this.set(key, data, timeout, version);
      
      return data;
    } catch (error) {
      logger.error('Error in getOrSet', { key, error: String(error) });
      throw error;
    }
  }

  /**
   * Set cache value if not exists
   */
  async add(key: string, value: any, timeout: number = 300, version: number = 1): Promise<boolean> {
    try {
      const cacheKey = this.makeKey(key, version);
      
      if (this.cache.has(cacheKey)) {
        return false; // Key already exists
      }
      
      return await this.set(key, value, timeout, version);
    } catch (error) {
      logger.error('Error adding cache', { key, error: String(error) });
      return false;
    }
  }

  /**
   * Get cache value and delete it (pop operation)
   */
  async pop(key: string, version: number = 1, default: any = null): Promise<any> {
    try {
      const value = await this.get(key, version, default);
      await this.delete(key, version);
      return value;
    } catch (error) {
      logger.error('Error popping cache', { key, error: String(error) });
      return default;
    }
  }

  /**
   * Check if key exists in cache
   */
  async hasKey(key: string, version: number = 1): Promise<boolean> {
    try {
      const cacheKey = this.makeKey(key, version);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return true;
      } else if (cached) {
        // Expired, remove from cache
        this.cache.delete(cacheKey);
      }
      
      return false;
    } catch (error) {
      logger.error('Error checking cache key', { key, error: String(error) });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): any {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0 ? (this.cacheStats.hits / totalRequests) * 100 : 0;
    
    return {
      ...this.cacheStats,
      totalRequests,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: this.cache.size,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Get cache keys by pattern
   */
  async getKeys(pattern?: string): Promise<string[]> {
    try {
      const keys = Array.from(this.cache.keys());
      
      if (pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return keys.filter(key => regex.test(key));
      }
      
      return keys;
    } catch (error) {
      logger.error('Error getting cache keys', { pattern, error: String(error) });
      return [];
    }
  }

  /**
   * Increment cache value (for counters)
   */
  async incr(key: string, delta: number = 1, version: number = 1): Promise<number | null> {
    try {
      const current = await this.get(key, version, 0);
      if (typeof current !== 'number') {
        return null;
      }
      
      const newValue = current + delta;
      await this.set(key, newValue, 300, version); // Default 5 minute timeout
      
      return newValue;
    } catch (error) {
      logger.error('Error incrementing cache', { key, error: String(error) });
      return null;
    }
  }

  /**
   * Decrement cache value (for counters)
   */
  async decr(key: string, delta: number = 1, version: number = 1): Promise<number | null> {
    return await this.incr(key, -delta, version);
  }

  /**
   * Touch cache entry (update timestamp without changing value)
   */
  async touch(key: string, timeout: number = 300, version: number = 1): Promise<boolean> {
    try {
      const cacheKey = this.makeKey(key, version);
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        cached.timestamp = Date.now();
        cached.ttl = timeout * 1000;
        this.cache.set(cacheKey, cached);
        logger.debug('Cache touched', { key: cacheKey, timeout, version });
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error touching cache', { key, error: String(error) });
      return false;
    }
  }

  /**
   * Generate Django-style cache key
   */
  private makeKey(key: string, version: number): string {
    // Django-style key format: version:key
    return `${version}:${key}`;
  }

  /**
   * Clean up expired entries
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= value.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Cleaned up expired cache entries', { count: cleanedCount });
    }
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;
    for (const [key, value] of this.cache.entries()) {
      totalSize += key.length * 2; // String length * 2 bytes per character
      totalSize += JSON.stringify(value.data).length * 2;
      totalSize += 32; // Object overhead (timestamp, ttl, version)
    }
    return totalSize;
  }

  /**
   * Close cache service
   */
  async close(): Promise<void> {
    try {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }
      
      this.cache.clear();
      logger.info('Django cache service closed');
    } catch (error) {
      logger.error('Error closing cache service', { error: String(error) });
    }
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo(): any {
    const entries: any[] = [];
    
    for (const [key, value] of this.cache.entries()) {
      entries.push({
        key,
        age: Date.now() - value.timestamp,
        ttl: value.ttl,
        version: value.version,
        size: JSON.stringify(value.data).length
      });
    }
    
    return {
      stats: this.getStats(),
      entries: entries.slice(0, 100), // Limit to first 100 entries for debugging
      totalEntries: entries.length
    };
  }
}

export const djangoCacheService = DjangoCacheService.getInstance();
