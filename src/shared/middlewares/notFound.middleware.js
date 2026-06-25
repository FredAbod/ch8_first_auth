import { sendError } from "../helpers/response.helper.js";

const notFoundMiddleware = (req, res) =>
  sendError(res, 404, `Route ${req.originalUrl} not found`, "NOT_FOUND");

export default notFoundMiddleware;
