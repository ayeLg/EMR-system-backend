export default () => ({
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    url: process.env.DATABASE_URL,
    queryLogging: process.env.PRISMA_QUERY_LOGGING === 'true',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  phi: {
    encryptionKey: process.env.PHI_ENCRYPTION_KEY ?? '',
  },
  totp: {
    issuer: process.env.TOTP_ISSUER ?? 'EMR-System',
  },
  throttle: {
    ttl: Number.parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: Number.parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },
  logging: {
    requests:
      process.env.REQUEST_LOGGING_ENABLED === undefined
        ? (process.env.NODE_ENV ?? 'development') !== 'production'
        : process.env.REQUEST_LOGGING_ENABLED === 'true',
  },
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    user: process.env.SWAGGER_USER ?? 'swagger',
    password: process.env.SWAGGER_PASSWORD ?? 'swagger',
  },
});
