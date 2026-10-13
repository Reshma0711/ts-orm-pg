import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT) || 3000,
  database: {
    name: process.env.DB_NAME!,
    user: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    host: process.env.DB_HOST!,
    port: Number(process.env.DB_PORT) || 5432,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
  },
  apiBaseUrl: process.env.API_BASE_URL,
  redisUrl: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  email: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    username: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },
  s3: {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET,
  },
};

export const isProduction = env.nodeEnv === "production";
