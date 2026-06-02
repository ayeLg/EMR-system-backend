export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    user: process.env.SWAGGER_USER ?? 'swagger',
    password: process.env.SWAGGER_PASSWORD ?? 'swagger',
  },
});
