import Redis from 'ioredis';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Redis connection options
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Create Redis client
const redis = new Redis(redisOptions);

// Set up Redis event listeners
redis.on('connect', () => {
  console.log('Redis client connected');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Test connection function
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    await redis.ping();
    console.log('Redis connection test successful');
    return true;
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
};

// Cache duration constants (in seconds)
export const CACHE_DURATIONS = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
  DAY: 86400 // 24 hours
};

export default redis; 