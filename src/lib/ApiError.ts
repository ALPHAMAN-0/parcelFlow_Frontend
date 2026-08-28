/**
 * Mirrors the API's failure envelope:
 *   { success: false, error: { code, message, details?, requestId } }
 *
 * Always branch on `code`. The API's README is explicit that messages get
 * reworded and codes do not.
 */

/** Shape of `details` on a 422 (src/middleware/validate.js:4). */
export interface FieldIssue {
  location: 'body' | 'query' | 'params' | string;
  field: string;
  message: string;
}

/** Shape of `details` on a 409 INVALID_STATUS_TRANSITION. */
export interface TransitionDetails {
  currentStatus?: string;
  requestedStatus?: string;
  allowedNext?: string[];
  expectedStatus?: string;
}

export type ApiErrorDetails = FieldIssue[] | TransitionDetails | undefined;

/** Codes invented client-side, for failures that never reach the API. */
export const CLIENT_ERROR_CODES = {
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'REQUEST_TIMEOUT',
  ABORTED: 'REQUEST_ABORTED',
  MALFORMED: 'MALFORMED_RESPONSE',
} as const;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetails;
  readonly requestId?: string;
  /** True when the request never got a reply — worth a retry, unlike a 422. */
  readonly isNetwork: boolean;

  constructor(args: {
    status: number;
    code: string;
    message: string;
    details?: ApiErrorDetails;
    requestId?: string;
  }) {
    super(args.message);
    this.name = 'ApiError';
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
    this.requestId = args.requestId;
    this.isNetwork =
      args.status === 0 ||
      args.code === CLIENT_ERROR_CODES.NETWORK ||
      args.code === CLIENT_ERROR_CODES.TIMEOUT;
  }

  /** Per-field issues from a 422, for mapping back onto form inputs. */
  fieldIssues(): FieldIssue[] {
    return Array.isArray(this.details) ? this.details : [];
  }

  transitionDetails(): TransitionDetails {
    return !Array.isArray(this.details) && this.details ? this.details : {};
  }

  /**
   * True for the four codes that mean "this token is no good" — which must NOT
   * include INVALID_CREDENTIALS. That is also a 401, but it means a wrong
   * password on the login form; treating it as a session expiry would bounce
   * the user off the very page they are trying to use.
   */
  isSessionExpired(): boolean {
    return (
      this.status === 401 &&
      ['TOKEN_MISSING', 'TOKEN_EXPIRED', 'TOKEN_INVALID', 'USER_NOT_FOUND'].includes(this.code)
    );
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
