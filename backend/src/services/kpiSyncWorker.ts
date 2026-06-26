import { Worker, Queue } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";
import { kpiService } from "./kpi.service.js";

const connection = {
  host: env.REDIS_HOST || "localhost",
  port: env.REDIS_PORT || 6379,
};

export const kpiSyncQueue = new Queue("kpi-sync", { connection });

async function recalculateKpis() {
  logger.info("KPI Sync Worker: starting recalculation");
  const result = await kpiService.recalculate();
  logger.info({ snapshotDate: result.snapshotDate, errors: result.errors.length }, "KPI Sync Worker: recalculation completed");
  if (result.errors.length > 0) {
    logger.warn({ errors: result.errors }, "KPI Sync Worker: non-fatal errors during recalculation");
  }
  return result;
}

export function startKpiSyncWorker() {
  new Worker("kpi-sync", async () => {
    await recalculateKpis();
  }, { connection });
  logger.info("KPI Sync Worker started");
}

export async function scheduleKpiSync() {
  await kpiSyncQueue.add("kpi-sync-daily", {}, { repeat: { pattern: "0 2 * * *" } });
  logger.info("KPI Sync scheduled daily at 02:00");
}
