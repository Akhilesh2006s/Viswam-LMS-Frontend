/** Normalize to digits only (handles +91 prefix). */
export function normalizePhoneTenDigits(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

/** Empty or exactly 10 digits. */
export function isValidOptionalPhoneTenDigits(raw: string): boolean {
  const digits = normalizePhoneTenDigits(raw);
  return digits.length === 0 || digits.length === 10;
}

/** Strip non-digits while typing; cap at 10. */
export function formatPhoneInputValue(raw: string): string {
  return normalizePhoneTenDigits(raw).slice(0, 10);
}
