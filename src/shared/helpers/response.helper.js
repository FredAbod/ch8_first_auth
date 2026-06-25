export const sendSuccess = (res, statusCode, message, data = null) =>
  res.status(statusCode).json({
    success: true,
    message,
    error: null,
    data,
  });

export const sendError = (res, statusCode, message, error = null) =>
  res.status(statusCode).json({
    success: false,
    message,
    error,
    data: null,
  });
