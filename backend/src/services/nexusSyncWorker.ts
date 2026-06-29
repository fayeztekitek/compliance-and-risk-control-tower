import { Queue, Worker, Job } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";

const connection = {
  host: env.REDIS_HOST || "localhost",
  port: env.REDIS_PORT || 6379,
};

export const nexusSyncQueue = new Queue("nexus-sync", { connection });

export async function scheduleNexusSync() {
  await nexusSyncQueue.add("nexus-sync-10am", {}, { repeat: { pattern: "0 10 * * *" } });
  await nexusSyncQueue.add("nexus-sync-1pm", {}, { repeat: { pattern: "0 13 * * *" } });
  logger.info("Nexus full sync scheduled daily at 10:00 and 13:00");
}

export function startNexusSyncWorker() {
  new Worker("nexus-sync", async (job: Job) => {
    const jobId = job.id!;
    logger.info({ jobId }, "Nexus sync worker: job started");

    await job.updateProgress(0);
    await job.updateData({ ...job.data, status: "running", progress: 0 });

    try {
      const { nexusService } = await import("./nexus.service.js");
      const result: any = await nexusService.fullSync({ batchId: job.data?.batchId });

      await job.updateProgress(100);
      await job.updateData({
        ...(job.data || {}),
        status: "completed",
        progress: 100,
        batchId: result.batchId,
        summary: result.summary || `Synced ${result.orgsCount || 0} orgs, ${result.appsCount || 0} apps`,
        elapsedMs: result.elapsedMs || 0,
      });

      logger.info({ jobId, batchId: result.batchId }, "Nexus sync worker: job completed");

      // Trigger KPI recalculation after sync
      const { queues } = await import("./queue.service.js");
      await queues.kpiRecalc.add("kpi-recalc-after-sync", { triggeredBy: "nexus-sync" });
    } catch (err: any) {
      await job.updateData({
        ...(job.data || {}),
        status: "failed",
        error: err?.message || "Unknown error",
      });
      logger.error({ jobId, err }, "Nexus sync worker: job failed");
      throw err;
    }
  }, { connection });

  logger.info("Nexus Sync Worker started");
}

export async function getJobStatus(jobId: string) {
  const job = await nexusSyncQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = await job.progress;
  const data = job.returnvalue || job.data || {};

  return {
    jobId: job.id,
    state,
    progress: typeof progress === "number" ? progress : 0,
    batchId: data.batchId || null,
    summary: data.summary || null,
    error: data.error || null,
    elapsedMs: data.elapsedMs || null,
    createdAt: job.timestamp,
    finishedAt: job.finishedOn,
  };
}
