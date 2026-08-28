import { request } from '@/lib/apiClient';

/**
 * Liveness probe for the footer indicator.
 *
 * Deliberately GET / and NOT GET /health. EasyPrivacy — enabled by default in
 * Brave Shields, uBlock Origin and AdGuard — carries this rule:
 *
 *     ||onrender.com/health
 *
 * `||` is a domain anchor covering every subdomain, so that rule blocks
 * /health AND /health/db on any *.onrender.com host. The browser kills the
 * request client-side (net::ERR_BLOCKED_BY_CLIENT) and the indicator reports a
 * healthy API as unreachable.
 *
 * GET / matches no rule in EasyList, EasyPrivacy or uBlock's lists, returns the
 * same envelope, and like /health never touches the database — so it is just as
 * cheap to poll. Do not "tidy" this back to /health.
 */
export interface ServiceInfo {
  service: string;
  version: string;
  health: { shallow: string; deep: string };
  endpoints: string[];
}

export function getHealth(signal?: AbortSignal): Promise<ServiceInfo> {
  return request<ServiceInfo>('/', { signal });
}
