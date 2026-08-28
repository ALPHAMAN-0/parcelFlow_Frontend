import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getHealth } from '@/api/health';
import { onColdStart } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Backend reachability for the footer indicator. /health never queries the
 * database, so polling it is cheap — but the interval is generous anyway,
 * because on Render's free tier every request also resets the idle timer.
 */
export function useApiHealth() {
  const query = useQuery({
    queryKey: queryKeys.health,
    queryFn: ({ signal }) => getHealth(signal),
    refetchInterval: 120_000,
    refetchOnWindowFocus: true,
    retry: 1,
    staleTime: 60_000,
  });

  return {
    isOnline: query.isSuccess,
    isChecking: query.isLoading || query.isFetching,
    uptimeSeconds: query.data?.uptimeSeconds ?? null,
    failed: query.isError,
  };
}

/** True while the API client is waiting out a Render cold start. */
export function useColdStart(): boolean {
  const [waking, setWaking] = useState(false);
  useEffect(() => onColdStart(setWaking), []);
  return waking;
}
