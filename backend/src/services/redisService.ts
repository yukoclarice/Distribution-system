import redis, { CACHE_DURATIONS } from '../config/redis';

/**
 * Redis Service for caching operations
 */
class RedisService {
  /**
   * Sets value in Redis cache
   * @param key Cache key
   * @param value Data to cache
   * @param ttl Time to live in seconds (defaults to 5 minutes)
   */
  async set(key: string, value: any, ttl: number = CACHE_DURATIONS.MEDIUM): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await redis.set(key, serializedValue, 'EX', ttl);
    } catch (error) {
      console.error('Redis SET error:', error);
      // Continue execution without caching if Redis fails
    }
  }

  /**
   * Gets value from Redis cache
   * @param key Cache key
   * @returns Parsed value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  /**
   * Deletes a key from Redis cache
   * @param key Cache key to delete
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error('Redis DELETE error:', error);
    }
  }

  /**
   * Deletes multiple keys matching a pattern
   * @param pattern Pattern to match keys (e.g., "report:*")
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      console.error('Redis deleteByPattern error:', error);
    }
  }

  /**
   * Checks if a key exists in Redis
   * @param key Cache key to check
   * @returns Boolean indicating if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      return (await redis.exists(key)) === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  /**
   * Retrieves data from cache if exists, otherwise executes the provided function,
   * caches the result, and returns it.
   * @param key Cache key
   * @param fetchFn Function to execute if data not in cache
   * @param ttl Time to live in seconds
   * @returns Cached or freshly fetched data
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = CACHE_DURATIONS.MEDIUM
  ): Promise<T> {
    try {
      // Try to get from cache
      const cachedData = await this.get<T>(key);
      if (cachedData !== null) {
        return cachedData;
      }

      // If not in cache, fetch fresh data
      const freshData = await fetchFn();
      
      // Store in cache
      await this.set(key, freshData, ttl);
      
      return freshData;
    } catch (error) {
      console.error('Redis getOrSet error:', error);
      // If Redis fails, still return the data directly from the fetch function
      return await fetchFn();
    }
  }
}

export default new RedisService(); 