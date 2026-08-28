/**
 * Vite inlines VITE_* at build time, so this value is frozen into the bundle.
 * Changing it on Vercel needs a redeploy, not just a saved variable.
 *
 * Two shapes are supported:
 *   /api                              same-origin, proxied by vercel.json
 *   https://host.onrender.com         direct to the backend
 *
 * The same-origin form is the default because a direct cross-origin call to
 * onrender.com is blocked outright by some ad-blocker filter lists and by
 * corporate URLBlocklist policies — the browser reports ERR_BLOCKED_BY_CLIENT
 * and the whole app is dead. A first-party path cannot be singled out that way.
 */
const RAW = import.meta.env.VITE_API_BASE_URL as string | undefined;

const FALLBACK = '/api';

function resolveBaseUrl(): string {
  const value = (RAW ?? '').trim();
  if (!value) {
    if (import.meta.env.PROD) {
      console.error(
        '[ParcelFlow] VITE_API_BASE_URL is not set. Add it in Vercel > Settings > ' +
          `Environment Variables and redeploy. Falling back to "${FALLBACK}".`,
      );
    }
    return FALLBACK;
  }
  return value.replace(/\/+$/, ''); // trailing slashes would double up in paths
}

export const API_BASE_URL = resolveBaseUrl();
export const IS_API_CONFIGURED = Boolean((RAW ?? '').trim());

/** True when requests go through this origin rather than straight to Render. */
export const IS_SAME_ORIGIN_API = API_BASE_URL.startsWith('/');

/**
 * What the footer shows. A relative base has no host of its own, so it borrows
 * the page's — otherwise the indicator would just read "/api", which says
 * nothing about where the data is actually coming from.
 */
export const API_HOST = (() => {
  if (IS_SAME_ORIGIN_API) {
    const host = typeof location === 'undefined' ? '' : location.host;
    return `${host}${API_BASE_URL}`;
  }
  try {
    return new URL(API_BASE_URL).host;
  } catch {
    return API_BASE_URL;
  }
})();

/** Render's free tier spins down after ~15 min idle; the wake-up takes 30-60s. */
export const REQUEST_TIMEOUT_MS = 15_000;
export const COLD_START_TIMEOUT_MS = 70_000;
