import { AppError } from "../errors/AppError.js";
import { sendError } from "../helpers/response.helper.js";
import logger from "../logger/logger.js";

const handleCastError = (err) =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400, "CAST_ERROR");

const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || "field";
  return new AppError(`Duplicate value for ${field}`, 409, "DUPLICATE_KEY");
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(messages.join(". "), 400, "VALIDATION_ERROR");
};

const handleJwtError = () =>
  new AppError("Invalid or expired token", 401, "JWT_ERROR");

const handleJoiError = (err) =>
  new AppError(err.message, 400, "VALIDATION_ERROR");

const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (err.name === "CastError") {
    error = handleCastError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err.name === "ValidationError" && err.errors) {
    error = handleValidationError(err);
  } else if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    error = handleJwtError();
  } else if (err.isJoi) {
    error = handleJoiError(err);
  } else if (err.code === "LIMIT_FILE_SIZE") {
    error = new AppError("File too large", 400, "FILE_TOO_LARGE");
  } else if (err.message?.includes("Only image files")) {
    error = new AppError(err.message, 400, "INVALID_FILE_TYPE");
  } else if (!(err instanceof AppError)) {
    logger.error("Unhandled error", {
      message: err.message,
      stack: err.stack,
    });
    error = new AppError("Internal server error", 500, "INTERNAL_ERROR");
  }

  if (error.statusCode >= 500) {
    logger.error(error.message, { stack: error.stack });
  }

  return sendError(res, error.statusCode, error.message, error.error);
};

export default errorMiddleware;
