import { Queue, Worker, Job } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";

const connection = {
  host: env.REDIS_HOST || "localhost",
  port: env.REDIS_PORT || 6379,
};

export const queues = {
  nexusSync: new Queue("nexus-sync", { connection }),
  nexusIncSync: new Queue("nexus-inc-sync", { connection }),
  slaBreach: new Queue("sla-breach", { connection }),
  waiverExpiry: new Queue("waiver-expiry", { connection }),
  emailNotify: new Queue("email-notify", { connection }),
  kpiRecalc: new Queue("kpi-recalc", { connection }),
  enrichment: new Queue("enrichment", { connection }),
  vegSlaCheck: new Queue("veg-sla-check", { connection }),
  notificationDispatch: new Queue("notification-dispatch", { connection }),
  reportGenerate: new Queue("report-generate", { connection }),
};

export async function startWorkers() {
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
    const { kpiEngine } = await import("./engines/kpi.engine.js");
    await kpiEngine.calculateAndStore();
    logger.info({ jobId: job.id }, "KPI recalculation completed");
  }, { connection });

  new Worker("notification-dispatch", async (job: Job) => {
    logger.info({ jobId: job.id, data: job.data }, "Notification dispatch job started");
    const { notificationEngine } = await import("./engines/notification.engine.js");
    await notificationEngine.processEvent(job.data.event);
    logger.info({ jobId: job.id }, "Notification dispatch completed");
  }, { connection });

  new Worker("report-generate", async (job: Job) => {
    logger.info({ jobId: job.id, data: job.data }, "Report generation job started");
    const { reportingEngine } = await import("./engines/reporting.engine.js");
    const result = await reportingEngine.generateReport(job.data);
    logger.info({ jobId: job.id, status: result.status }, "Report generation completed");
  }, { connection });
}

export async function scheduleRecurringJobs() {
  const { queues } = await import("./queue.service.js");
  // Full sync: weekly on Sunday at 2am
  await queues.nexusSync.add("nexus-sync-weekly", {}, { repeat: { pattern: "0 2 * * 0" } });
  // Daily incremental sync (24h lookback): every day at 3am
  await queues.nexusIncSync.add("nexus-inc-sync-daily", { hours: 24 }, { repeat: { pattern: "0 3 * * *" } });
  // 4-hour incremental sync: every 4 hours
  await queues.nexusIncSync.add("nexus-inc-sync-4hour", { hours: 4 }, { repeat: { pattern: "0 */4 * * *" } });
  await queues.slaBreach.add("sla-breach-hourly", {}, { repeat: { pattern: "0 * * * *" } });
  await queues.waiverExpiry.add("waiver-expiry-hourly", {}, { repeat: { pattern: "0 * * * *" } });
  await queues.kpiRecalc.add("kpi-recalc-15min", {}, { repeat: { pattern: "*/15 * * * *" } });
  await queues.notificationDispatch.add("notification-dispatch-cleanup", { type: "cleanup" }, { repeat: { pattern: "0 0 * * *" } });
  await queues.reportGenerate.add("report-generate-daily", { type: "daily-summary" }, { repeat: { pattern: "0 7 * * *" } });
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
