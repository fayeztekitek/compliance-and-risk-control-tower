import { Queue } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";

const connection = {
  host: env.REDIS_HOST || "localhost",
  port: env.REDIS_PORT || 6379,
};

export const nexusSyncQueue = new Queue("nexus-sync", { connection });

export async function scheduleNexusSync() {
  await nexusSyncQueue.add("nexus-sync-10am", {}, { repeat: { pattern: "0 10 * * *" } });
  await nexusSyncQueue.add("nexus-sync-2pm", {}, { repeat: { pattern: "0 14 * * *" } });
  logger.info("Nexus full sync scheduled daily at 10:00 and 14:00");
}
