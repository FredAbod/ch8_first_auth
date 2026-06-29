import { asyncHandler } from "../../shared/helpers/asyncHandler.js";
import env from "../../config/env.js";
import {
  createGoogleAuthUrl,
  getGoogleSuccessRedirect,
} from "./providers/google.provider.js";
import { handleGoogleOAuthCallback } from "./oauth.service.js";

const OAUTH_STATE_COOKIE = "google_oauth_state";
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax",
  maxAge: OAUTH_STATE_MAX_AGE_MS,
};

const buildRedirectUrl = (params) => {
  const url = new URL(getGoogleSuccessRedirect());
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

export const googleAuth = asyncHandler(async (req, res) => {
  const { url, state } = createGoogleAuthUrl();
  res.cookie(OAUTH_STATE_COOKIE, state, cookieOptions);
  return res.redirect(url);
});

export const googleRedirect = async (req, res) => {
  const fail = (message) =>
    res.redirect(
      buildRedirectUrl({
        success: "false",
        message,
      }),
    );

  if (req.query.error) {
    return fail(req.query.error_description || req.query.error);
  }

  const { code, state } = req.query;

  if (!code) {
    return fail("Missing authorization code");
  }

  if (!state || state !== req.cookies?.[OAUTH_STATE_COOKIE]) {
    return fail("Invalid OAuth state");
  }

  res.clearCookie(OAUTH_STATE_COOKIE);

  try {
    const result = await handleGoogleOAuthCallback(code);

    return res.redirect(
      buildRedirectUrl({
        success: "true",
        isNewUser: result.isNewUser,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }),
    );
  } catch (error) {
    return fail(error.message || "Google authentication failed");
  }
};
