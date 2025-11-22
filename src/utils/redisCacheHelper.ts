// // Description: A utility module for managing Redis cache operations.
// // This module provides functions to set, get, delete, and check the existence of keys in Redis cache.

// import { createClient } from "redis";
// import dotenv from "dotenv";

// dotenv.config();

// const redisClient = createClient({
//   url: process.env.REDIS_URL || "redis://localhost:6379",
// });

// redisClient.on("error", (err) => console.error("❌ Redis Client Error", err));
// redisClient.on("connect", () => console.log("✅ Redis connected"));

// (async () => {
//   if (!redisClient.isOpen) {
//     await redisClient.connect();
//   }
// })();

// export const redisCacheHelper = {
//   /**
//    * Sets a value in Redis cache with optional TTL (in seconds).
//    */
//   async set(key: string, value: any, ttl?: number): Promise<void> {
//     const data = JSON.stringify(value);
//     if (ttl) {
//       await redisClient.setEx(key, ttl, data);
//     } else {
//       await redisClient.set(key, data);
//     }
//   },

//   /**
//    * Gets a value from Redis cache.
//    */
//   async get<T>(key: string): Promise<T | null> {
//     const data = await redisClient.get(key);
//     return data ? JSON.parse(data) : null;
//   },

//   /**
//    * Deletes a key from Redis cache.
//    */
//   async delete(key: string): Promise<void> {
//     await redisClient.del(key);
//   },

//   /**
//    * Flushes all Redis keys (use with caution).
//    */
//   async flush(): Promise<void> {
//     await redisClient.flushAll();
//   },

//   /**
//    * Checks if a key exists in Redis.
//    */
//   async has(key: string): Promise<boolean> {
//     const exists = await redisClient.exists(key);
//     return exists === 1;
//   },
// };

// Description: A utility module for managing Redis cache operations.
// This module provides functions to set, get, delete, and check the existence of keys in Redis cache.

import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://192.168.1.165:6379',
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));

export const redisCacheHelper = {
  /**
   * Sets a value in Redis cache with optional TTL (in seconds).
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const data = JSON.stringify(value);
    if (ttl) {
      await redisClient.setEx(key, ttl, data);
    } else {
      await redisClient.set(key, data);
    }
  },

  /**
   * Gets a value from Redis cache.
   */
  async get<T>(key: string): Promise<T | null> {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Deletes a key from Redis cache.
   */
  async delete(key: string): Promise<void> {
    await redisClient.del(key);
  },

  /**
   * Deletes all keys matching a given pattern.
   */
  async deletePattern(pattern: string): Promise<void> {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  },
  /**
   * Flushes all Redis keys (use with caution).
   */
  async flush(): Promise<void> {
    await redisClient.flushAll();
  },

  /**
   * Checks if a key exists in Redis.
   */
  async has(key: string): Promise<boolean> {
    const exists = await redisClient.exists(key);
    return exists === 1;
  },

  async keys(pattern: string): Promise<string[]> {
    return await redisClient.keys(pattern);
  },
};
