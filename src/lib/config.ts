/**
 * Vite inlines VITE_* at build time, so this value is frozen into the bundle.
 * Changing it on Vercel needs a redeploy, not just a saved variable.
 */
const RAW = import.meta.env.VITE_API_BASE_URL as string | undefined;

function resolveBaseUrl(): string {
  const value = (RAW ?? '').trim();
  if (!value) {
    if (import.meta.env.PROD) {
      // Loud, because the alternative is every request quietly hitting the
      // Vercel origin itself and 404ing on HTML.
      console.error(
        '[ParcelFlow] VITE_API_BASE_URL is not set. Add it in Vercel > Settings > ' +
          'Environment Variables and redeploy.',
      );
    }
    return 'http://localhost:3000';
  }
  return value.replace(/\/+$/, ''); // trailing slashes would double up in paths
}

export const API_BASE_URL = resolveBaseUrl();
export const IS_API_CONFIGURED = Boolean((RAW ?? '').trim());

/** Shown in the footer so it's obvious which backend the app is talking to. */
export const API_HOST = (() => {
  try {
    return new URL(API_BASE_URL).host;
  } catch {
    return API_BASE_URL;
  }
})();

/** Render's free tier spins down after ~15 min idle; the wake-up takes 30-60s. */
export const REQUEST_TIMEOUT_MS = 15_000;
export const COLD_START_TIMEOUT_MS = 70_000;
