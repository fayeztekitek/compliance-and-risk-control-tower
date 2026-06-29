import { Worker, Job } from "bullmq";
import { env } from "../../config/env.js";
import { logger } from "../../core/logger.js";

const connection = { host: env.REDIS_HOST || "localhost", port: env.REDIS_PORT || 6379 };

export function startNotificationDispatchWorker() {
  new Worker("notification-dispatch", async (job: Job) => {
    logger.info({ jobId: job.id, data: job.data }, "Dispatching notification");
    const { notificationEngine } = await import("../engines/notification.engine.js");
    if (job.data.type === "rule-based") {
      const { eventBus } = await import("../../core/events/eventBus.js");
      await eventBus.publish(job.data.event);
    }
  }, { connection });
  logger.info("Notification dispatch worker started");
}
