export const Config = {
  env: process.env.NODE_ENV as "development" | "production" | "test",
  oauth: {
    secret: process.env.JWT_SECRET ?? 'secret',

    // 1 hour
    accessTokenExpire: 3600,

    // 7 days
    refreshTokenExpire: 7 * 24 * 60 * 60
  },
  mysql: {
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASS ?? "",
    database: process.env.DB_NAME ?? "demo"
  }
}