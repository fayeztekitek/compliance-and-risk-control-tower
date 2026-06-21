import { Queue, Worker, Job } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";

const connection = {
  host: env.REDIS_HOST || "localhost",
  port: env.REDIS_PORT || 6379,
};

export const queues = {
  nexusSync: new Queue("nexus-sync", { connection }),
  slaBreach: new Queue("sla-breach", { connection }),
  waiverExpiry: new Queue("waiver-expiry", { connection }),
  emailNotify: new Queue("email-notify", { connection }),
  kpiRecalc: new Queue("kpi-recalc", { connection }),
};

export async function startWorkers() {
  new Worker("nexus-sync", async (job: Job) => {
    logger.info({ jobId: job.id, data: job.data }, "Nexus sync job started");
    const { nexusService } = await import("./nexus.service.js");
    await nexusService.executeSync(job.data);
    logger.info({ jobId: job.id }, "Nexus sync job completed");
  }, { connection });

  new Worker("sla-breach", async (job: Job) => {
    logger.info({ jobId: job.id }, "SLA breach detection job started");
    const { securityService } = await import("./security.service.js");
    await securityService.detectSlaBreaches();
    logger.info({ jobId: job.id }, "SLA breach detection completed");
  }, { connection });

  new Worker("waiver-expiry", async (job: Job) => {
    logger.info({ jobId: job.id }, "Waiver expiry check job started");
    const { nexusRepo } = await import("../repositories/nexus.repo.js");
    const expired = await nexusRepo.expireOverdueWaivers();
    logger.info({ jobId: job.id, count: expired.length }, `Expired ${expired.length} waivers`);
  }, { connection });

  new Worker("email-notify", async (job: Job) => {
    logger.info({ jobId: job.id, data: job.data }, "Email notify job started (placeholder)");
  }, { connection });

  new Worker("kpi-recalc", async (job: Job) => {
    logger.info({ jobId: job.id }, "KPI recalculation job started");
    const { kpiService } = await import("./kpi.service.js");
    await kpiService.recalculate();
    logger.info({ jobId: job.id }, "KPI recalculation completed");
  }, { connection });
}

export async function scheduleRecurringJobs() {
  const { queues } = await import("./queue.service.js");
  await queues.slaBreach.add("sla-breach-hourly", {}, { repeat: { pattern: "0 * * * *" } });
  await queues.waiverExpiry.add("waiver-expiry-hourly", {}, { repeat: { pattern: "0 * * * *" } });
  await queues.kpiRecalc.add("kpi-recalc-15min", {}, { repeat: { pattern: "*/15 * * * *" } });
}

export async function getJobStatuses() {
  const results: any[] = [];
  for (const [name, queue] of Object.entries(queues)) {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);
    results.push({ queue: name, waiting, active, completed, failed });
  }
  return results;
}
