import app from "./app.js";
import connectDb from "./config/db.js";
import env from "./config/env.js";
import { connectRedis } from "./cache/redis.client.js";
import logger from "./shared/logger/logger.js";

const startServer = async () => {
  await connectDb();

  try {
    await connectRedis();
  } catch (error) {
    logger.warn("Redis unavailable — caching disabled", {
      error: error.message,
    });
  }

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
};

startServer();
