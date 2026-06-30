import { Worker, Queue } from "bullmq";
import Redis from "ioredis";
import { env } from "../../config/env.js";
import { logger } from "../../core/logger.js";
import { agentService } from "../ai/agent.service.js";
import { AGENT_DEFINITIONS, AgentType } from "../ai/tools/index.js";

const AGENT_SCHEDULE_QUEUE = "agent-schedule";

function createBullConnection() {
  return new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });
}

async function createAgentScheduleWorker() {
  const worker = new Worker(AGENT_SCHEDULE_QUEUE, async (job) => {
    const { agentType, triggerType } = job.data as { agentType: AgentType; triggerType: string };
    logger.info({ agentType, jobId: job.id }, "Agent scheduled run started");
    await agentService.runAutonomous(agentType, triggerType);
    logger.info({ agentType, jobId: job.id }, "Agent scheduled run completed");
  }, {
    connection: createBullConnection(),
    concurrency: 3,
  });

  worker.on("failed", (job, err) => {
    logger.error({ err, jobId: job?.id, agentType: job?.data?.agentType }, "Agent scheduled run failed");
  });

  return worker;
}

export async function registerAgentSchedules() {
  const conn = createBullConnection();
  const agentQueue = new Queue(AGENT_SCHEDULE_QUEUE, { connection: conn });

  for (const [agentType, def] of Object.entries(AGENT_DEFINITIONS)) {
    if (def.cronSchedule) {
      const existing = await agentQueue.getJobSchedulers();
      const exists = existing.some(s => s.name === `agent-${agentType}`);
      if (!exists) {
        await agentQueue.upsertJobScheduler(
          `agent-${agentType}`,
          { pattern: def.cronSchedule },
          { name: `agent-run-${agentType}`, data: { agentType, triggerType: "scheduled" } },
        );
        logger.info({ agentType, cron: def.cronSchedule }, "Agent schedule registered");
      }
    }
  }

  await createAgentScheduleWorker();
  logger.info("Agent schedule worker started");
}
