import { Worker, Job, Queue } from "bullmq";
import { env } from "../../config/env.js";
import { logger } from "../../core/logger.js";

const connection = {
  host: env.REDIS_HOST || "localhost",
  port: env.REDIS_PORT || 6379,
};

export const reportScheduleQueue = new Queue("report-schedule", { connection });

export function startReportScheduleWorker() {
  new Worker("report-schedule", async (job: Job) => {
    const { reportingEngine } = await import("../engines/reporting.engine.js");
    const schedules = await reportingEngine.getDueSchedules();

    for (const schedule of schedules) {
      try {
        let templateConfig: any = {};
        if (schedule.templateId) {
          const tmpl = await reportingEngine.getTemplate(schedule.templateId);
          if (tmpl) templateConfig = tmpl.config;
        }

        const mergedParams = { ...templateConfig, ...schedule.params };
        const result = await reportingEngine.generateReport({
          name: `${schedule.name} - ${new Date().toISOString().slice(0, 10)}`,
          format: schedule.format as any,
          params: mergedParams,
          channels: schedule.channels,
          recipients: schedule.recipients,
        });

        const nextRun = await reportingEngine.computeNextRun(schedule.cron);
        await reportingEngine.updateScheduleRunTimes(schedule.id, nextRun);

        logger.info({ scheduleId: schedule.id, status: result.status }, "Scheduled report generated");
      } catch (err: any) {
        logger.error({ err, scheduleId: schedule.id }, "Scheduled report generation failed");
        const nextRun = await reportingEngine.computeNextRun(schedule.cron);
        await reportingEngine.updateScheduleRunTimes(schedule.id, nextRun);
      }
    }
  }, { connection });
}

export async function scheduleReportCheck() {
  if (!env.REPORT_SCHEDULE_ENABLED) {
    logger.info("Report scheduling is disabled");
    return;
  }
  const existing = await reportScheduleQueue.getRepeatableJobs();
  if (existing.length === 0) {
    await reportScheduleQueue.add("report-schedule-check", {}, { repeat: { pattern: "* * * * *" } });
    logger.info("Report schedule check every minute");
  }
}
