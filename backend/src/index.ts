import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./core/logger.js";

function gracefulShutdown() {
  logger.info("Shutting down gracefully...");
  process.exit(0);
}

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

app.listen(env.PORT, "0.0.0.0", () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server started");
});
