import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import env from "../../../config/env.js";
import { AppError } from "../../../shared/errors/AppError.js";

const mapGooglePayload = (payload) => {
  if (!payload?.email) {
    throw new AppError("Google account has no email", 400, "GOOGLE_AUTH_FAILED");
  }

  if (!payload.email_verified) {
    throw new AppError("Google email is not verified", 400, "GOOGLE_EMAIL_NOT_VERIFIED");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    firstName: payload.given_name || "User",
    lastName: payload.family_name || "",
    profilePicture: payload.picture || null,
  };
};

export const getGoogleCallbackUrl = () =>
  env.GOOGLE_CALLBACK_URL || `http://localhost:${env.PORT}/api/auth/redirect`;

export const getGoogleSuccessRedirect = () =>
  env.GOOGLE_SUCCESS_REDIRECT || "http://localhost:3000";

const getOAuthClient = () => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new AppError("Google OAuth is not configured", 503, "GOOGLE_NOT_CONFIGURED");
  }

  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    getGoogleCallbackUrl(),
  );
};

export const createGoogleAuthUrl = () => {
  const state = crypto.randomBytes(20).toString("hex");
  const client = getOAuthClient();

  const url = client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });

  return { url, state };
};

export const exchangeCodeForGoogleProfile = async (code) => {
  try {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);

    if (!tokens.id_token) {
      throw new AppError("Google did not return an ID token", 400, "GOOGLE_AUTH_FAILED");
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });

    return mapGooglePayload(ticket.getPayload());
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Google authentication failed", 401, "GOOGLE_AUTH_FAILED");
  }
};
