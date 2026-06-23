import { Worker, Queue } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";
import { query } from "../config/database.js";
import { vegEventBus } from "./veg-events.service.js";

const connection = {
  host: env.REDIS_HOST || "localhost",
  port: env.REDIS_PORT || 6379,
};

export const vegSlaQueue = new Queue("veg-sla-check", { connection });

async function checkOverdueRequests() {
  const result = await query<{ id: string; title: string; client: string; due_date: string }>(
    `SELECT id, title, client, due_date
     FROM veg_requests
     WHERE due_date IS NOT NULL
       AND due_date < NOW()
       AND status NOT IN ('APPROVED', 'REJECTED', 'CONTRACT_SIGNATURE')
       AND deleted_at IS NULL
     ORDER BY due_date ASC`
  );

  if (!result.rows.length) {
    logger.info("VEG SLA check: no overdue requests found");
    return { overdue: 0 };
  }

  for (const req of result.rows) {
    logger.warn({ requestId: req.id, title: req.title, client: req.client, dueDate: req.due_date }, "VEG request SLA breached");
    vegEventBus.emitVegEvent({
      type: "veg:request:approved",
      requestId: req.id,
      timestamp: new Date().toISOString(),
      metadata: { reason: "SLA_BREACH", dueDate: req.due_date },
    });
  }

  return { overdue: result.rows.length };
}

export function startVegSlaWorker() {
  new Worker("veg-sla-check", async () => {
    logger.info("VEG SLA check worker started");
    const result = await checkOverdueRequests();
    logger.info({ result }, "VEG SLA check completed");
  }, { connection });
}

export async function scheduleVegSlaDaily() {
  await vegSlaQueue.add("veg-sla-daily", {}, { repeat: { pattern: "0 6 * * *" } });
  logger.info("VEG SLA daily check scheduled at 06:00");
}
