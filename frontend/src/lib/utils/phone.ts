export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (hasPlus) {
    return `+${digitsOnly}`;
  }

  const withoutLeadingZero = digitsOnly.replace(/^0+/, "");

  // Bare 10-digit Indian mobile number, e.g. "9142996613".
  if (withoutLeadingZero.length === 10) {
    return `+91${withoutLeadingZero}`;
  }

  if (withoutLeadingZero.length > 10) {
    return `+${withoutLeadingZero}`;
  }

  return trimmed;
}