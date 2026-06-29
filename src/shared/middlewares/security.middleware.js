import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import compression from "compression";
import cookieParser from "cookie-parser";
import env from "../../config/env.js";
import {
  mongoSanitizeMiddleware,
  xssMiddleware,
} from "./sanitize.middleware.js";

const applySecurityMiddleware = (app) => {
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins.includes("*") ? true : env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many requests, please try again later",
        error: "RATE_LIMIT_EXCEEDED",
        data: null,
      },
    }),
  );
  app.use(mongoSanitizeMiddleware);
  app.use(xssMiddleware);
  app.use(hpp());
  app.use(compression());
  app.use(cookieParser());
};

export default applySecurityMiddleware;
