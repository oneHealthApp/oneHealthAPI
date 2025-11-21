import { logger } from '../utils';

// Description: This module provides a simple caching utility using NodeCache.
// It allows setting, getting, deleting, and checking the existence of cache entries.

import NodeCache from 'node-cache';

// TTL is in seconds
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });

/**
 * Sets a value in cache.
 */
export function setCache(key: string, value: any, ttl?: number): boolean {
  const success =
    ttl !== undefined ? cache.set(key, value, ttl) : cache.set(key, value);
  logger.debug('Set cache key', { key, ttl, success });
  return success;
}

/**
 * Gets a value from cache.
 */
export function getCache<T>(key: string): T | undefined {
  const value = cache.get<T>(key);
  logger.debug('Fetched cache key', { key, exists: !!value });
  return value;
}

/**
 * Deletes a value from cache.
 */
export function deleteCache(key: string): number {
  return cache.del(key);
}

/**
 * Flushes all keys from the cache.
 */
export function flushCache(): void {
  cache.flushAll();
}

/**
 * Checks if a key exists in the cache.
 */
export function hasCache(key: string): boolean {
  return cache.has(key);
}
