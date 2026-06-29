import "dotenv/config";
import Joi from "joi";
import { AppError } from "../shared/errors/AppError.js";

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3000),
  MONGODB_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default("7d"),
  REDIS_URL: Joi.string().uri().optional(),
  EMAIL_HOST: Joi.string().optional(),
  EMAIL_PORT: Joi.number().optional(),
  EMAIL_USER: Joi.string().optional(),
  EMAIL_PASSWORD: Joi.string().optional(),
  CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
  CLOUDINARY_API_KEY: Joi.string().optional(),
  CLOUDINARY_API_SECRET: Joi.string().optional(),
  FLUTTERWAVE_SECRET_KEY: Joi.string().optional(),
  FLUTTERWAVE_SECRET_HASH: Joi.string().optional(),
  FLUTTERWAVE_REDIRECT_URL: Joi.string().uri().optional(),
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),
  GOOGLE_SUCCESS_REDIRECT: Joi.string().uri().optional(),
  CORS_ORIGINS: Joi.string().default("*"),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: Joi.number().default(100),
}).unknown(true);

const { value, error } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
});

if (error) {
  const details = error.details.map((d) => d.message).join("; ");
  throw new AppError(`Environment validation failed: ${details}`, 500);
}

const env = {
  ...value,
  corsOrigins: value.CORS_ORIGINS.split(",").map((o) => o.trim()),
  isProduction: value.NODE_ENV === "production",
};

export default env;
