import { getRedisClient } from "./redis.client.js";
import logger from "../shared/logger/logger.js";

const DEFAULT_TTL_SECONDS = 300;

export const cacheGet = async (key) => {
  const client = getRedisClient();
  if (!client) {
    logger.debug("Cache miss", { key, redis: false });
    return null;
  }

  try {
    const value = await client.get(key);
    if (value) {
      logger.debug("Cache hit", { key });
      return JSON.parse(value);
    }
    logger.debug("Cache miss", { key });
    return null;
  } catch (error) {
    logger.warn("Cache get failed", { key, error: error.message });
    return null;
  }
};

export const cacheSet = async (key, value, ttlSeconds = DEFAULT_TTL_SECONDS) => {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    logger.warn("Cache set failed", { key, error: error.message });
  }
};

export const cacheDel = async (key) => {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.del(key);
  } catch (error) {
    logger.warn("Cache delete failed", { key, error: error.message });
  }
};

export const cacheDelPattern = async (pattern) => {
  const client = getRedisClient();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    logger.warn("Cache pattern delete failed", { pattern, error: error.message });
  }
};
