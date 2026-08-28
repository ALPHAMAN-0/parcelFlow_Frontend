import { Input } from '@/components/ui/Input';
import {
  TRACKING_CODE_PLACEHOLDER,
  formatTrackingCodeInput,
  illegalTrackingChars,
  isValidTrackingCode,
} from '@/domain/trackingCode';

/**
 * Formats as you type and rejects the excluded look-alike characters before a
 * request is spent — GET /parcels/:trackingCode is rate limited to 60/min, and
 * a malformed code is a guaranteed 422.
 */
export function TrackingCodeInput({
  value,
  onChange,
  error,
  autoFocus,
  label = 'Tracking code',
}: {
  value: string;
  onChange: (next: string) => void;
  error?: string;
  autoFocus?: boolean;
  label?: string;
}) {
  const illegal = illegalTrackingChars(value);
  const complete = isValidTrackingCode(value);

  const hint = illegal.length
    ? `${illegal.join(', ')} never appears in a tracking code — I, L, O, 0 and 1 are excluded so codes can't be misread.`
    : complete
      ? 'Valid format.'
      : `Format: ${TRACKING_CODE_PLACEHOLDER} — dashes are added for you.`;

  return (
    <Input
      label={label}
      monospace
      autoFocus={autoFocus}
      value={value}
      // Reformatted on every keystroke, so the field can only ever hold a
      // prefix of a legal code.
      onChange={(e) => onChange(formatTrackingCodeInput(e.target.value))}
      placeholder={TRACKING_CODE_PLACEHOLDER}
      spellCheck={false}
      autoComplete="off"
      autoCapitalize="characters"
      inputMode="text"
      maxLength={14}
      error={error}
      hint={hint}
      aside={complete ? '✓' : undefined}
    />
  );
}
