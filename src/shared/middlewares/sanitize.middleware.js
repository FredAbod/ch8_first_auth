import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { sanitize: sanitizeMongo } = require("express-mongo-sanitize");
const { clean: cleanXss } = require("xss-clean/lib/xss");

const sanitizeObjectInPlace = (target, sanitizer) => {
  if (target && typeof target === "object") {
    sanitizer(target);
  }
};

/**
 * Express 5 makes req.query read-only (getter only).
 * express-mongo-sanitize and xss-clean reassign req.query, which crashes.
 * This middleware sanitizes in place instead.
 */
const mongoSanitizeMiddleware = (req, res, next) => {
  sanitizeObjectInPlace(req.body, sanitizeMongo);
  sanitizeObjectInPlace(req.params, sanitizeMongo);
  sanitizeObjectInPlace(req.query, sanitizeMongo);
  next();
};

const xssMiddleware = (req, res, next) => {
  if (req.body) req.body = cleanXss(req.body);
  if (req.params) req.params = cleanXss(req.params);
  sanitizeObjectInPlace(req.query, (query) => {
    const cleaned = cleanXss(query);
    Object.keys(query).forEach((key) => {
      delete query[key];
    });
    Object.assign(query, cleaned);
  });
  next();
};

export { mongoSanitizeMiddleware, xssMiddleware };
