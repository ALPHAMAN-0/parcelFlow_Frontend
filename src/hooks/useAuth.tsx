import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/api/auth';
import { setUnauthorizedHandler } from '@/lib/apiClient';
import { AUTH_KEY, readJson, remove, writeJson } from '@/lib/storage';
import { isApiError } from '@/lib/ApiError';
import type { AuthResult, LoginPayload, RegisterPayload, Role, User } from '@/types/api';

interface StoredSession {
  token: string;
  user: User;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  /** True until the stored token has been checked against GET /auth/me. */
  isBootstrapping: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: (reason?: string) => void;
  /** Set when a session ended by itself, so /login can explain why. */
  expiryNotice: string | null;
  clearExpiryNotice: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const stored = useRef<StoredSession | null>(readJson<StoredSession>(AUTH_KEY));

  // Seeded from storage so a reload paints the app immediately instead of
  // flashing the login screen while /auth/me is in flight.
  const [session, setSession] = useState<StoredSession | null>(stored.current);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(Boolean(stored.current));
  const [expiryNotice, setExpiryNotice] = useState<string | null>(null);

  const applySession = useCallback((result: AuthResult) => {
    const next = { token: result.token, user: result.user };
    writeJson(AUTH_KEY, next);
    setSession(next);
    setExpiryNotice(null);
    return result.user;
  }, []);

  const logout = useCallback(
    (reason?: string) => {
      remove(AUTH_KEY);
      setSession(null);
      setIsBootstrapping(false);
      if (reason) setExpiryNotice(reason);
      // Drop every cached response: the next user must not see this one's data.
      queryClient.clear();
    },
    [queryClient],
  );

  /**
   * Revalidate the stored token once on mount. The API re-reads the user from
   * the database on every request, so this also picks up a role change made by
   * an admin while this tab was closed.
   */
  useEffect(() => {
    const token = stored.current?.token;
    if (!token) return;

    const controller = new AbortController();
    let cancelled = false;

    authApi
      .getMe(token, controller.signal)
      .then((user) => {
        if (cancelled) return;
        const next = { token, user };
        writeJson(AUTH_KEY, next);
        setSession(next);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isApiError(err) && err.status === 401) {
          logout('Your session expired. Please sign in again.');
          return;
        }
        // Network trouble or a cold backend: keep the cached session rather
        // than signing the user out over a transient failure.
      })
      .finally(() => {
        if (!cancelled) setIsBootstrapping(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [logout]);

  /**
   * A 401 from any later request ends the session. Registered against the API
   * client, which only fires this for TOKEN_* / USER_NOT_FOUND — never for
   * INVALID_CREDENTIALS, so a mistyped password stays on the login form.
   */
  useEffect(() => {
    setUnauthorizedHandler((err) => {
      logout(
        err.code === 'TOKEN_EXPIRED'
          ? 'Your session expired. Please sign in again.'
          : 'Your session is no longer valid. Please sign in again.',
      );
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(
    async (payload: LoginPayload) => applySession(await authApi.login(payload)),
    [applySession],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => applySession(await authApi.register(payload)),
    [applySession],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      role: session?.user.role ?? null,
      isAuthenticated: Boolean(session),
      isBootstrapping,
      login,
      register,
      logout,
      expiryNotice,
      clearExpiryNotice: () => setExpiryNotice(null),
    }),
    [session, isBootstrapping, login, register, logout, expiryNotice],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/**
 * For queries, which always need a token. Throwing here would be a bug — every
 * caller sits behind RequireAuth — so it returns '' and lets the API answer 401.
 */
export function useAuthToken(): string {
  return useAuth().token ?? '';
}
