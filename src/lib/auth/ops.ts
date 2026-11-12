/**
 * Elets operations sign-in lives at an unlisted path, set with OPS_LOGIN_PATH
 * (e.g. "/ops-k7q2m9x4"). Nothing in the app links to it, and the internal
 * route (/ops-login) returns 404 when a custom path is configured. Without the
 * variable it is served at /ops-login, which is convenient for local work.
 *
 * The path only keeps the page out of sight; the account's password is what
 * protects it.
 */
export const OPS_LOGIN_INTERNAL = "/ops-login";

export function opsLoginPath(): string {
  const raw = process.env.OPS_LOGIN_PATH?.trim();
  if (!raw) return OPS_LOGIN_INTERNAL;
  const p = "/" + raw.replace(/^\/+|\/+$/g, "");
  return /^\/[A-Za-z0-9._~-]+$/.test(p) ? p : OPS_LOGIN_INTERNAL;
}
