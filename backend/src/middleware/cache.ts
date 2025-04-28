import { Request, Response, NextFunction } from 'express';
import redisService from '../services/redisService';
import { CACHE_DURATIONS } from '../config/redis';

/**
 * Helper function to check if cache should be bypassed
 */
const shouldBypassCache = (req: Request): boolean => {
  const cacheControl = req.headers['cache-control'];
  if (cacheControl) {
    return cacheControl.includes('no-cache') || cacheControl.includes('no-store');
  }
  return false;
};

/**
 * Middleware to cache API responses
 * @param prefix Key prefix to categorize cached data
 * @param ttl Time to live in seconds
 * @param keyFn Optional function to generate a custom key based on request
 */
export const cacheMiddleware = (
  prefix: string,
  ttl: number = CACHE_DURATIONS.MEDIUM,
  keyFn?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip caching if no-cache headers are present
      if (shouldBypassCache(req)) {
        console.log('Cache bypassed due to cache-control headers');
        return next();
      }
      
      // Generate cache key based on custom function or default to URL + query params
      const key = keyFn 
        ? `${prefix}:${keyFn(req)}` 
        : `${prefix}:${req.originalUrl}`;

      // Try to get data from cache
      const cachedData = await redisService.get(key);
      
      if (cachedData !== null) {
        // Add cache header to indicate response came from cache
        res.setHeader('X-Cache', 'HIT');
        // Return cached data
        return res.json(cachedData);
      }

      // Add cache header to indicate response is not from cache
      res.setHeader('X-Cache', 'MISS');

      // Store original send method
      const originalSend = res.json;

      // Override send method to cache response before sending
      res.json = function (body: any): Response {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisService.set(key, body, ttl)
            .catch(err => console.error('Error caching response:', err));
        }
        
        // Call original send method
        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue to controller even if caching fails
    }
  };
};

/**
 * Middleware to invalidate cache entries by pattern
 * @param pattern Pattern for keys to invalidate (e.g., "reports:*")
 */
export const clearCacheMiddleware = (pattern: string) => {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      await redisService.deleteByPattern(pattern);
      next();
    } catch (error) {
      console.error('Clear cache middleware error:', error);
      next(); // Continue to controller even if cache clearing fails
    }
  };
}; 