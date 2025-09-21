import { DjangoCacheService } from '../../../shared/services/django-cache.service';

describe('DjangoCacheService', () => {
  let cacheService: DjangoCacheService;

  beforeEach(() => {
    cacheService = DjangoCacheService.getInstance();
    // Clear cache before each test
    cacheService.clear();
  });

  afterEach(async () => {
    await cacheService.close();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get cache values', async () => {
      const key = 'test-key';
      const value = { data: 'test-value', number: 123 };
      const ttl = 300;

      const setResult = await cacheService.set(key, value, ttl);
      expect(setResult).toBe(true);

      const getResult = await cacheService.get(key);
      expect(getResult).toEqual(value);
    });

    it('should return default value when key does not exist', async () => {
      const key = 'non-existent-key';
      const defaultValue = 'default-value';

      const result = await cacheService.get(key, 1, defaultValue);
      expect(result).toBe(defaultValue);
    });

    it('should delete cache values', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await cacheService.set(key, value);
      expect(await cacheService.get(key)).toBe(value);

      const deleteResult = await cacheService.delete(key);
      expect(deleteResult).toBe(true);
      expect(await cacheService.get(key)).toBeNull();
    });

    it('should check if key exists', async () => {
      const key = 'test-key';
      const value = 'test-value';

      expect(await cacheService.hasKey(key)).toBe(false);

      await cacheService.set(key, value);
      expect(await cacheService.hasKey(key)).toBe(true);

      await cacheService.delete(key);
      expect(await cacheService.hasKey(key)).toBe(false);
    });
  });

  describe('Version Management', () => {
    it('should handle different versions of the same key', async () => {
      const key = 'test-key';
      const value1 = 'version-1';
      const value2 = 'version-2';

      await cacheService.set(key, value1, 300, 1);
      await cacheService.set(key, value2, 300, 2);

      expect(await cacheService.get(key, 1)).toBe(value1);
      expect(await cacheService.get(key, 2)).toBe(value2);
    });

    it('should not return value from different version', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await cacheService.set(key, value, 300, 1);
      expect(await cacheService.get(key, 2)).toBeNull();
    });
  });

  describe('TTL and Expiration', () => {
    it('should respect TTL settings', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 1; // 1 second

      await cacheService.set(key, value, ttl);
      expect(await cacheService.get(key)).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      expect(await cacheService.get(key)).toBeNull();
    });

    it('should touch cache entry to update timestamp', async () => {
      const key = 'test-key';
      const value = 'test-value';
      const ttl = 1;

      await cacheService.set(key, value, ttl);
      
      // Touch before expiration
      await new Promise(resolve => setTimeout(resolve, 500));
      const touchResult = await cacheService.touch(key, 2);
      expect(touchResult).toBe(true);

      // Should still be available after original TTL
      await new Promise(resolve => setTimeout(resolve, 600));
      expect(await cacheService.get(key)).toBe(value);
    });
  });

  describe('Cache-aside Pattern', () => {
    it('should implement getOrSet correctly', async () => {
      const key = 'test-key';
      let fetchCount = 0;
      
      const fetchFunction = async () => {
        fetchCount++;
        return `fetched-value-${fetchCount}`;
      };

      // First call should fetch
      const result1 = await cacheService.getOrSet(key, fetchFunction, 300);
      expect(result1).toBe('fetched-value-1');
      expect(fetchCount).toBe(1);

      // Second call should use cache
      const result2 = await cacheService.getOrSet(key, fetchFunction, 300);
      expect(result2).toBe('fetched-value-1');
      expect(fetchCount).toBe(1);
    });

    it('should handle fetch function errors', async () => {
      const key = 'test-key';
      const fetchFunction = async () => {
        throw new Error('Fetch failed');
      };

      await expect(cacheService.getOrSet(key, fetchFunction, 300))
        .rejects.toThrow('Fetch failed');
    });
  });

  describe('Add and Pop Operations', () => {
    it('should add value only if key does not exist', async () => {
      const key = 'test-key';
      const value1 = 'first-value';
      const value2 = 'second-value';

      const addResult1 = await cacheService.add(key, value1, 300);
      expect(addResult1).toBe(true);
      expect(await cacheService.get(key)).toBe(value1);

      const addResult2 = await cacheService.add(key, value2, 300);
      expect(addResult2).toBe(false);
      expect(await cacheService.get(key)).toBe(value1); // Should still be first value
    });

    it('should pop value and delete it', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await cacheService.set(key, value);
      expect(await cacheService.hasKey(key)).toBe(true);

      const poppedValue = await cacheService.pop(key);
      expect(poppedValue).toBe(value);
      expect(await cacheService.hasKey(key)).toBe(false);
    });
  });

  describe('Counter Operations', () => {
    it('should increment counter values', async () => {
      const key = 'counter-key';
      const initialValue = 10;

      await cacheService.set(key, initialValue);
      
      const incremented = await cacheService.incr(key, 5);
      expect(incremented).toBe(15);

      const incrementedAgain = await cacheService.incr(key, 3);
      expect(incrementedAgain).toBe(18);
    });

    it('should decrement counter values', async () => {
      const key = 'counter-key';
      const initialValue = 20;

      await cacheService.set(key, initialValue);
      
      const decremented = await cacheService.decr(key, 5);
      expect(decremented).toBe(15);

      const decrementedAgain = await cacheService.decr(key, 3);
      expect(decrementedAgain).toBe(12);
    });

    it('should return null for non-numeric values when incrementing', async () => {
      const key = 'non-numeric-key';
      const value = 'not-a-number';

      await cacheService.set(key, value);
      
      const result = await cacheService.incr(key);
      expect(result).toBeNull();
    });
  });

  describe('Pattern Operations', () => {
    it('should get keys by pattern', async () => {
      await cacheService.set('user:1', 'user1');
      await cacheService.set('user:2', 'user2');
      await cacheService.set('admin:1', 'admin1');
      await cacheService.set('session:abc', 'session1');

      const userKeys = await cacheService.getKeys('user:*');
      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain('1:user:1');
      expect(userKeys).toContain('1:user:2');

      const allKeys = await cacheService.getKeys();
      expect(allKeys).toHaveLength(4);
    });

    it('should delete multiple keys by pattern', async () => {
      await cacheService.set('user:1', 'user1');
      await cacheService.set('user:2', 'user2');
      await cacheService.set('admin:1', 'admin1');

      const deletedCount = await cacheService.deleteMany(['user:1', 'user:2'], 1);
      expect(deletedCount).toBe(2);

      expect(await cacheService.hasKey('user:1')).toBe(false);
      expect(await cacheService.hasKey('user:2')).toBe(false);
      expect(await cacheService.hasKey('admin:1')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track cache statistics', async () => {
      const stats = cacheService.getStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('sets');
      expect(stats).toHaveProperty('deletes');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('memoryUsage');
    });

    it('should calculate hit rate correctly', async () => {
      // Miss
      await cacheService.get('non-existent');
      
      // Set and hit
      await cacheService.set('test-key', 'test-value');
      await cacheService.get('test-key');
      await cacheService.get('test-key');

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(66.67);
    });
  });

  describe('Cache Info and Debugging', () => {
    it('should provide cache info for debugging', async () => {
      await cacheService.set('test-key', 'test-value', 300);
      
      const info = cacheService.getCacheInfo();
      expect(info).toHaveProperty('stats');
      expect(info).toHaveProperty('entries');
      expect(info).toHaveProperty('totalEntries');
      expect(info.totalEntries).toBe(1);
      expect(info.entries[0]).toHaveProperty('key');
      expect(info.entries[0]).toHaveProperty('age');
      expect(info.entries[0]).toHaveProperty('ttl');
      expect(info.entries[0]).toHaveProperty('version');
      expect(info.entries[0]).toHaveProperty('size');
    });
  });

  describe('Memory Management', () => {
    it('should estimate memory usage', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await cacheService.set(key, value);
      
      const stats = cacheService.getStats();
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    it('should clean up expired entries', async () => {
      const key = 'test-key';
      const value = 'test-value';

      await cacheService.set(key, value, 1); // 1 second TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Manually trigger cleanup (normally done by interval)
      const info = cacheService.getCacheInfo();
      expect(info.totalEntries).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully in getOrSet', async () => {
      const key = 'test-key';
      const fetchFunction = async () => {
        throw new Error('Network error');
      };

      await expect(cacheService.getOrSet(key, fetchFunction, 300))
        .rejects.toThrow('Network error');
    });

    it('should handle invalid operations gracefully', async () => {
      const result = await cacheService.incr('non-existent-key');
      expect(result).toBeNull();
    });
  });
});
