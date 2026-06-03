import { z } from 'zod';

/**
 * Runtime validation of process environment. Runs once at boot via
 * ConfigModule's `validate`. Fail-fast: a misconfigured EMR backend must not
 * start with, e.g., a missing DATABASE_URL or a weak JWT secret.
 */
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Auth
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // PHI encryption — AES-256-GCM key, 32 bytes as 64 hex chars
  PHI_ENCRYPTION_KEY: z
    .string()
    .regex(
      /^[0-9a-fA-F]{64}$/,
      'PHI_ENCRYPTION_KEY must be 64 hex chars (32 bytes)',
    ),

  // 2FA
  TOTP_ISSUER: z.string().default('EMR-System'),

  // Rate limiting
  THROTTLE_TTL: z.coerce.number().int().positive().default(60_000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Swagger
  SWAGGER_ENABLED: z.enum(['true', 'false']).default('true'),
  SWAGGER_USER: z.string().default('swagger'),
  SWAGGER_PASSWORD: z.string().default('swagger'),
});

export type Env = z.infer<typeof EnvSchema>;

export function validate(config: Record<string, unknown>): Env {
  const result = EnvSchema.safeParse(config);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}
