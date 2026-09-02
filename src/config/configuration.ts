export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    name: process.env.DB_NAME ?? 'biblio_track',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION ?? '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '7d',
  },
  mail: {
    apiKey: process.env.ELASTICEMAIL_API_KEY ?? '',
    from: process.env.EMAIL_FROM ?? 'BiblioTrack <no-reply@bibliotrack.app>',
  },
});
