import { findUserById } from "../user/user.repository.js";
import { verifyAccessToken } from "./auth.service.js";
import { AppError } from "../../shared/errors/AppError.js";
import { UserRole } from "../../shared/enums/userRole.enum.js";

export const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyAccessToken(token);

  const user = await findUserById(decoded.id);
  if (!user) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }

  req.user = user;
  return next();
};

export const authorizeAdmin = (req, res, next) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return next(
      new AppError("You are not authorized to perform this action", 403, "FORBIDDEN"),
    );
  }
  return next();
};
