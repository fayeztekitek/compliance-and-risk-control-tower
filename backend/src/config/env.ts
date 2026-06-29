import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3000", 10),

  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
  DB_NAME: process.env.DB_NAME || "compliance_tower",
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "postgres",
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX || "20", 10),
  DB_IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT || "30000", 10),

  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: parseInt(process.env.REDIS_PORT || "6379", 10),

  JWT_SECRET: process.env.JWT_SECRET || "dev-secret-change-in-production",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),

  NEXUS_IQ_URL: process.env.NEXUS_IQ_URL || "",
  NEXUS_IQ_USERNAME: process.env.NEXUS_IQ_USERNAME || "",
  NEXUS_IQ_TOKEN: process.env.NEXUS_IQ_TOKEN || "",
  NEXUS_IQ_TLS_INSECURE: process.env.NEXUS_IQ_TLS_INSECURE === "true",

  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.0-flash",

  SONARQUBE_URL: process.env.SONARQUBE_URL || "",
  SONARQUBE_TOKEN: process.env.SONARQUBE_TOKEN || "",
};
