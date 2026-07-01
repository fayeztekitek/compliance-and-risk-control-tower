import { Queue, Worker, Job } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";

const connection = {
  host: env.REDIS_HOST || "localhost",
  port: env.REDIS_PORT || 6379,
};

export const nexusIncSyncQueue = new Queue("nexus-inc-sync", { connection });

export function startNexusIncSyncWorker() {
  new Worker("nexus-inc-sync", async (job: Job) => {
    const jobId = job.id!;
    const hours = job.data?.hours || 24;
    logger.info({ jobId, hours }, "Nexus incremental sync worker: job started");

    await job.updateProgress(0);
    await job.updateData({ ...job.data, status: "running", progress: 0 });

    try {
      const { nexusService } = await import("./nexus.service.js");
      const result: any = await nexusService.incrementalSync(hours, { batchId: job.data?.batchId });

      await job.updateProgress(100);
      await job.updateData({
        ...(job.data || {}),
        status: "completed",
        progress: 100,
        batchId: result.batchId,
        summary: `Synced ${result.reportsCount || 0} new reports, skipped ${result.skippedCount || 0} (window: ${hours}h)`,
        elapsedMs: result.elapsedMs || 0,
      });

      logger.info({ jobId, batchId: result.batchId, reports: result.reportsCount, skipped: result.skippedCount }, "Nexus incremental sync worker: job completed");

      const { queues } = await import("./queue.service.js");
      await queues.kpiRecalc.add("kpi-recalc-after-sync", { triggeredBy: "nexus-inc-sync" });
    } catch (err: any) {
      await job.updateData({
        ...(job.data || {}),
        status: "failed",
        error: err?.message || "Unknown error",
      });
      logger.error({ jobId, err }, "Nexus incremental sync worker: job failed");
      throw err;
    }
  }, { connection });

  logger.info("Nexus Incremental Sync Worker started");
}
