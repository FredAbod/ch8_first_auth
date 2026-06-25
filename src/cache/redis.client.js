import Redis from "ioredis";
import env from "../config/env.js";
import logger from "../shared/logger/logger.js";

let redis = null;

export const getRedisClient = () => {
  if (!env.REDIS_URL) {
    return null;
  }

  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on("error", (err) => {
      logger.error("Redis connection error", { error: err.message });
    });

    redis.on("connect", () => {
      logger.info("Connected to Redis");
    });
  }

  return redis;
};

export const connectRedis = async () => {
  const client = getRedisClient();
  if (client && client.status !== "ready") {
    await client.connect();
  }
  return client;
};
