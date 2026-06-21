import { app } from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/database.js";
import { logger } from "./core/logger.js";

async function gracefulShutdown(signal: string) {
  logger.info({ signal }, "Shutting down gracefully...");
  try {
    await pool.end();
    logger.info("Database pool closed");
  } catch (err) {
    logger.error({ err }, "Error closing database pool");
  }
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server started");
});
