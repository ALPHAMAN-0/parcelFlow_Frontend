/**
 * Client mirror of ParcelFlowApi/src/utils/trackingCode.ts.
 *
 * The alphabet deliberately excludes I, L, O, 0 and 1 so a code read off a
 * label can't be mistyped into a different valid code. Validating here means a
 * typo costs no request — which matters because GET /parcels/:trackingCode is
 * rate limited to 60/min.
 */

export const TRACKING_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const GROUP = 5;

export const TRACKING_CODE_PATTERN = new RegExp(
  `^PF-[${TRACKING_ALPHABET}]{${GROUP}}-[${TRACKING_ALPHABET}]{${GROUP}}$`,
);

export const TRACKING_CODE_PLACEHOLDER = 'PF-XXXXX-XXXXX';

/** Matches the API's normalisation exactly: trim, then uppercase. */
export function normalizeTrackingCode(input: string | null | undefined): string {
  return String(input ?? '')
    .trim()
    .toUpperCase();
}

export function isValidTrackingCode(input: string): boolean {
  return TRACKING_CODE_PATTERN.test(normalizeTrackingCode(input));
}

/** Characters a user typed that can never appear in a code. */
export function illegalTrackingChars(input: string): string[] {
  const body = normalizeTrackingCode(input).replace(/^PF/, '').replace(/-/g, '');
  return [...new Set([...body].filter((ch) => !TRACKING_ALPHABET.includes(ch)))];
}

/**
 * Formats as the user types: forces the PF- prefix, uppercases, drops
 * characters outside the alphabet, and re-inserts the dashes at 5 and 10.
 */
export function formatTrackingCodeInput(raw: string): string {
  const body = normalizeTrackingCode(raw)
    .replace(/[^A-Z0-9]/g, '')
    .replace(/^PF/, '')
    .split('')
    .filter((ch) => TRACKING_ALPHABET.includes(ch))
    .slice(0, GROUP * 2)
    .join('');

  if (body.length === 0) return '';
  if (body.length <= GROUP) return `PF-${body}`;
  return `PF-${body.slice(0, GROUP)}-${body.slice(GROUP)}`;
}
