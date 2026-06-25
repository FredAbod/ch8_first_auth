import mongoose from "mongoose";
import env from "./env.js";
import logger from "../shared/logger/logger.js";

const connectDb = async () => {
  try {
    await mongoose.connect(env.MONGODB_URL);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("Error connecting to MongoDB", { error: error.message });
    process.exit(1);
  }
};

export default connectDb;
