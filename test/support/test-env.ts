/**
 * Minimal environment so the Nest app and config validation can boot under
 * test. DATABASE_URL is set later by global-setup once the container is up.
 * These are throwaway secrets — never reuse outside tests.
 */
export function applyTestEnv(): void {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET ??= 'test-jwt-secret-0123456789';
  process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-0123456789';
  process.env.PHI_ENCRYPTION_KEY ??=
    '0000000000000000000000000000000000000000000000000000000000000000';
  process.env.SWAGGER_ENABLED ??= 'false';
}
