
const COOKIE_NAME = "mock_auth_email";

export const isAuthDisabled = process.env.NEXT_PUBLIC_AUTH_DISABLED === "true";

export function getMockEmail(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function setMockEmail(email: string) {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    email.trim().toLowerCase(),
  )}; path=/; max-age=${60 * 60 * 24 * 7}`;
}

export function clearMockEmail() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export const MOCK_AUTH_COOKIE_NAME = COOKIE_NAME;
