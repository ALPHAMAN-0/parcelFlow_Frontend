/**
 * Every error code the API can emit, mapped to copy a user can act on.
 * Codes taken from AppError call sites across the API, not guessed.
 */
import { ApiError, CLIENT_ERROR_CODES } from './ApiError';
import { STATUS_LABELS, isValidStatus } from '@/domain/parcelStatus';

const MESSAGES: Record<string, string> = {
  // auth
  INVALID_CREDENTIALS: 'That email and password combination does not match an account.',
  EMAIL_TAKEN: 'An account with this email already exists. Try signing in instead.',
  TOKEN_MISSING: 'You need to sign in to do that.',
  TOKEN_EXPIRED: 'Your session expired. Please sign in again.',
  TOKEN_INVALID: 'Your session is no longer valid. Please sign in again.',
  USER_NOT_FOUND: 'The account for this session no longer exists.',
  UNAUTHORIZED: 'You need to sign in to do that.',

  // authorisation
  FORBIDDEN: 'Your role does not allow this action.',

  // parcels
  PARCEL_NOT_FOUND: 'No parcel found with that reference, or it is not visible to your account.',
  STATUS_CONFLICT:
    'Someone else updated this parcel a moment ago. Reload to see the current status, then try again.',
  PARCEL_ALREADY_DELIVERED: 'This parcel has been delivered, so it can no longer be reassigned.',
  STAFF_NOT_FOUND: 'That user no longer exists.',
  NOT_DELIVERY_STAFF: 'Parcels can only be assigned to someone with the delivery staff role.',
  TRACKING_CODE_GENERATION_FAILED: 'Could not allocate a tracking code. Please try again.',

  // admin
  CANNOT_CHANGE_OWN_ROLE:
    'You cannot change your own role. Ask another admin, so the last admin cannot lock themselves out.',
  USER_NOT_FOUND_ADMIN: 'That user no longer exists.',

  // request-level
  VALIDATION_ERROR: 'Please check the highlighted fields and try again.',
  INVALID_JSON: 'The request could not be read. Please try again.',
  PAYLOAD_TOO_LARGE: 'That is too much data for one request.',
  TOO_MANY_LOGIN_ATTEMPTS:
    'Too many sign-in attempts from this network. Wait a few minutes and try again.',
  TOO_MANY_REQUESTS: 'Too many tracking lookups. Wait a moment, then try again.',
  ROUTE_NOT_FOUND: 'That endpoint does not exist on the API.',
  NOT_FOUND: 'Not found.',
  DATABASE_UNAVAILABLE: 'The API cannot reach its database right now. Try again shortly.',
  INTERNAL_ERROR: 'Something went wrong on the server. Try again shortly.',

  // client-side
  [CLIENT_ERROR_CODES.NETWORK]:
    'Could not reach the API. Check your connection, or the backend may still be waking up.',
  [CLIENT_ERROR_CODES.TIMEOUT]:
    'The API took too long to respond. If it has been idle it may be waking up — try again.',
  [CLIENT_ERROR_CODES.MALFORMED]: 'The API returned something this app could not read.',
  [CLIENT_ERROR_CODES.ABORTED]: 'Request cancelled.',
};

function humanStatus(value: string | undefined): string {
  if (!value) return 'that status';
  return isValidStatus(value) ? STATUS_LABELS[value] : value;
}

/**
 * INVALID_STATUS_TRANSITION deserves its own treatment: the API already
 * computed `allowedNext`, so we can tell the user the one move that would work
 * instead of repeating that theirs did not.
 */
function transitionMessage(err: ApiError): string {
  const { currentStatus, requestedStatus, allowedNext } = err.transitionDetails();
  const current = humanStatus(currentStatus);
  const requested = humanStatus(requestedStatus);

  // Reachable when two people advance the same parcel at once: the loser's
  // requested status is the one already applied. "is In Transit so it cannot
  // move to In Transit" would read as nonsense, so it gets its own sentence.
  if (currentStatus && currentStatus === requestedStatus) {
    const next = allowedNext?.[0];
    return next
      ? `This parcel is already ${current} — someone else may have just advanced it. The next step from here is ${humanStatus(next)}.`
      : `This parcel is already ${current}, which is final.`;
  }

  if (allowedNext && allowedNext.length > 0) {
    return `This parcel is ${current}, so it cannot move to ${requested}. The only valid next step is ${humanStatus(allowedNext[0])}.`;
  }
  return `This parcel is ${current}, which is final. It cannot move to ${requested}.`;
}

/** The message to show a user for any thrown value. */
export function describeError(err: unknown): string {
  if (!(err instanceof ApiError)) {
    if (err instanceof Error && err.message) return err.message;
    return 'Something went wrong. Please try again.';
  }

  if (err.code === 'INVALID_STATUS_TRANSITION') return transitionMessage(err);

  const mapped = MESSAGES[err.code];
  if (mapped) return mapped;

  // Fall back to the API's own message — it is written for humans and is
  // better than a generic string, even for a code added after this file.
  return err.message || 'The request failed. Please try again.';
}

/** A short label for a toast title or an inline banner heading. */
export function errorTitle(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Something went wrong';
  if (err.status === 422) return 'Check your input';
  if (err.status === 429) return 'Slow down';
  if (err.status === 409) return 'Conflict';
  if (err.status === 403) return 'Not allowed';
  if (err.status === 404) return 'Not found';
  if (err.isNetwork) return 'Cannot reach the API';
  if (err.status >= 500) return 'Server problem';
  return 'Request failed';
}

/**
 * Maps a 422's per-field issues onto form field names, so each input can show
 * the server's own complaint. `(root)` issues (an unrecognised key, which the
 * strictObject schemas produce) are returned under the `_root` key.
 */
export function fieldErrorsFrom(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError)) return {};
  const out: Record<string, string> = {};
  for (const issue of err.fieldIssues()) {
    const key = issue.field === '(root)' ? '_root' : issue.field;
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
