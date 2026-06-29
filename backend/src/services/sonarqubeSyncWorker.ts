import { Worker, Job } from "bullmq";
import { Queue } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";

const connection = {
  host: env.REDIS_HOST || "localhost",
  port: env.REDIS_PORT || 6379,
};

export const sonarqubeSyncQueue = new Queue("sonarqube-sync", { connection });

export function startSonarqubeSyncWorker() {
  new Worker("sonarqube-sync", async (job: Job) => {
    logger.info({ jobId: job.id }, "SonarQube sync job started");
    const { sonarqubePollService } = await import("./sonarqubePollService.js");
    const result = await sonarqubePollService.sync();
    logger.info({ jobId: job.id, ...result }, "SonarQube sync job completed");
  }, { connection });
}

export async function scheduleSonarqubeSync() {
  if (!env.SONARQUBE_URL || !env.SONARQUBE_TOKEN) {
    logger.info("SonarQube not configured — skipping sync scheduling");
    return;
  }
  await sonarqubeSyncQueue.add("sonarqube-sync-hourly", {}, { repeat: { pattern: "0 */3 * * *" } });
  logger.info("SonarQube sync scheduled every 3 hours");
}
