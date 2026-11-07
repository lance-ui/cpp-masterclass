/**
 * Google OAuth redirect URI helpers.
 * Changing GOOGLE_OAUTH_CALLBACK_PATH requires updating Google Cloud Console.
 */

export const GOOGLE_OAUTH_CALLBACK_PATH = "/api/auth/google/callback";

/** Normalize APP_URL: https preferred, no trailing slash. */
export function normalizeAppUrl(raw: string | undefined): string {
  const fallback = "http://localhost:3000";
  const value = (raw || fallback).trim().replace(/\/$/, "");
  return value || fallback;
}

/**
 * Exact redirect URI registered with Google.
 * Always built from APP_URL + fixed path — never from req.headers.host / localhost probing.
 */
export function googleOAuthRedirectUri(appUrl: string): string {
  return `${normalizeAppUrl(appUrl)}${GOOGLE_OAUTH_CALLBACK_PATH}`;
}
