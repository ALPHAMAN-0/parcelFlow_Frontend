import { request } from '@/lib/apiClient';
import type { AuthResult, LoginPayload, RegisterPayload, User } from '@/types/api';

/**
 * The register and login schemas are Zod strictObjects, so these payloads must
 * carry exactly these keys. Notably there is no `role` (the API hard-codes
 * CUSTOMER and 422s an unexpected key) and no `confirmPassword`.
 */

export function login(payload: LoginPayload): Promise<AuthResult> {
  return request<AuthResult>('/auth/login', {
    method: 'POST',
    body: { email: payload.email, password: payload.password },
    // A failed login must not be retried: the API allows 10 attempts per
    // 15 minutes per IP, and a retry would spend two of them.
    retryOnColdStart: false,
  });
}

export function register(payload: RegisterPayload): Promise<AuthResult> {
  return request<AuthResult>('/auth/register', {
    method: 'POST',
    body: { name: payload.name, email: payload.email, password: payload.password },
    retryOnColdStart: false,
  });
}

export async function getMe(token: string, signal?: AbortSignal): Promise<User> {
  const { user } = await request<{ user: User }>('/auth/me', { token, signal });
  return user;
}
