import crypto from "crypto";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";
import { AppError } from "../../shared/errors/AppError.js";
import {
  createRefreshToken,
  findRefreshTokenByHash,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
} from "./auth.repository.js";

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const signAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN },
  );

export const signRefreshToken = () => crypto.randomBytes(40).toString("hex");

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError("Invalid or expired access token", 401, "JWT_ERROR");
  }
};

export const issueTokenPair = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken();
  const tokenHash = hashToken(refreshToken);

  const expiresAt = new Date(
    Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
  );

  await createRefreshToken({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

export const rotateRefreshToken = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);
  const storedToken = await findRefreshTokenByHash(tokenHash);

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401, "JWT_ERROR");
  }

  if (storedToken.expiresAt < new Date()) {
    await revokeRefreshToken(tokenHash);
    throw new AppError("Refresh token expired", 401, "JWT_ERROR");
  }

  const newRefreshToken = signRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);

  await revokeRefreshToken(tokenHash, newTokenHash);

  const expiresAt = new Date(
    Date.now() + parseDurationMs(env.JWT_REFRESH_EXPIRES_IN),
  );

  await createRefreshToken({
    userId: storedToken.userId,
    tokenHash: newTokenHash,
    expiresAt,
  });

  return {
    userId: storedToken.userId,
    refreshToken: newRefreshToken,
  };
};

export const revokeRefreshTokenByValue = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);
  await revokeRefreshToken(tokenHash);
};

export const revokeAllTokensForUser = (userId) =>
  revokeAllUserRefreshTokens(userId);

const parseDurationMs = (duration) => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2];

  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * multipliers[unit];
};
