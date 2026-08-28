import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHealth } from '@/api/health';
import { onColdStart } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';

/** True while the API client is waiting out a Render cold start. */
export function useColdStart(): boolean {
  const [waking, setWaking] = useState(false);
  useEffect(() => onColdStart(setWaking), []);
  return waking;
}

/**
 * Backend reachability for the footer indicator. /health never queries the
 * database, so polling it is cheap.
 *
 * Two intervals, not one. While the API is answering, poll rarely — on Render's
 * free tier every request resets the idle timer, so there is no reason to chat.
 * While it is NOT answering, poll often: an instance waking from sleep is back
 * within a minute, and a two-minute interval leaves a stale red dot long after
 * the service recovered. That was the actual bug — the indicator outlived the
 * outage it was reporting.
 *
 * Polling pauses automatically while the tab is in the background
 * (refetchIntervalInBackground defaults to false), so an abandoned tab does not
 * hold the free-tier instance awake and burn its monthly hours.
 */
export function useApiHealth() {
  const isWaking = useColdStart();

  const query = useQuery({
    queryKey: queryKeys.health,
    queryFn: ({ signal }) => getHealth(signal),
    refetchInterval: (q) => (q.state.status === 'error' ? 8_000 : 120_000),
    refetchOnWindowFocus: true,
    retry: 1,
    staleTime: 60_000,
  });

  return {
    isOnline: query.isSuccess,
    isChecking: query.isLoading || query.isFetching,
    /**
     * A cold start is not the same as unreachable: the request is still in
     * flight, waiting out the boot. Kept separate so the UI can say "waking up"
     * instead of making a claim that is about to be wrong.
     */
    isWaking,
    uptimeSeconds: query.data?.uptimeSeconds ?? null,
    failed: query.isError,
  };
}
