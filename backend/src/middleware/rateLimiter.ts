import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import Redis from 'ioredis';

let redisClient: Redis | null = null;
let isRedisConnected = false;

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
    });

    redisClient.on('error', (err) => {
      console.warn('Redis rate limiter client error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully for rate limiting.');
      isRedisConnected = true;
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });
  } catch (err) {
    console.error('Failed to initialize Redis client for rate limiting:', err);
  }
} else {
  console.log('No REDIS_URL configured. Using local in-memory rate limiting.');
}

export interface RateLimiterOptions {
  windowMs: number; // Time window in ms
  max: number;      // Maximum requests in the window
  keyGenerator?: (req: Request) => string;
  message?: string;
}

export const rateLimiter = (options: RateLimiterOptions) => {
  const duration = Math.ceil(options.windowMs / 1000);
  const points = options.max;
  const keyPrefix = `rl_${options.windowMs}_${options.max}`;

  let limiterRedis: RateLimiterRedis | null = null;
  const limiterMemory = new RateLimiterMemory({
    points,
    duration,
  });

  if (redisClient) {
    limiterRedis = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix,
      points,
      duration,
    });
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator 
      ? options.keyGenerator(req) 
      : (req.ip || req.socket.remoteAddress || 'unknown');

    // Choose limiter based on Redis connection status
    const activeLimiter = (limiterRedis && isRedisConnected) ? limiterRedis : limiterMemory;

    try {
      await activeLimiter.consume(key);
      next();
    } catch (rejRes) {
      // If rejected (too many requests)
      return res.status(429).json({ 
        error: options.message || 'Too many requests, please try again later.' 
      });
    }
  };
};

