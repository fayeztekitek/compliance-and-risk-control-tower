import { Worker, Job } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";
import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { epssClient } from "./epssClient.js";
import { queues } from "./queue.service.js";

const BATCH_SIZE = 50;

const connection = {
  host: env.REDIS_HOST || "localhost",
  port: env.REDIS_PORT || 6379,
};

async function processEnrichmentBatch(): Promise<{ enriched: number; skipped: number; errors: number }> {
  let enriched = 0;
  let skipped = 0;
  let errors = 0;

  const findings = await unifiedFindingRepo.getUnenrichedFindings(BATCH_SIZE);
  if (!findings.length) return { enriched, skipped, errors };

  const cveIds = findings.map((f: any) => f.cve_id).filter(Boolean) as string[];
  if (!cveIds.length) return { enriched, skipped: findings.length, errors };

  const enrichmentMap = await epssClient.batchEnrich(cveIds);

  for (const finding of findings) {
    const cveId = finding.cve_id;
    if (!cveId) { skipped++; continue; }

    const enrichment = enrichmentMap.get(cveId.toUpperCase());
    if (!enrichment) { skipped++; continue; }

    try {
      await unifiedFindingRepo.upsertEnrichment({
        cveId,
        epssScore: enrichment.epssScore,
        epssPercentile: enrichment.epssPercentile,
        cisaKev: enrichment.cisaKev,
        cisaKevDate: enrichment.cisaKevDate,
        cisaKevDescription: enrichment.cisaKevDescription,
      });

      await unifiedFindingRepo.applyEnrichmentToFindings(cveId, enrichment.epssScore, enrichment.cisaKev);
      enriched++;
    } catch (err: any) {
      logger.error({ err: err.message, cveId, findingId: finding.id }, "Failed to apply enrichment");
      errors++;
    }
  }

  return { enriched, skipped, errors };
}

export function startEnrichmentWorker(): Worker {
  const worker = new Worker("enrichment", async (job: Job) => {
    logger.info({ jobId: job.id, data: job.data }, "Enrichment job started");

    const { enriched, skipped, errors } = await processEnrichmentBatch();

    logger.info({ jobId: job.id, enriched, skipped, errors }, "Enrichment batch completed");

    return { enriched, skipped, errors };
  }, { connection, concurrency: 1 });

  worker.on("completed", (job) => {
    logger.info({ jobId: job.id }, "Enrichment job finished");
  });

  worker.on("failed", (job, err) => {
    logger.error({ jobId: job?.id, err: err.message }, "Enrichment job failed");
  });

  logger.info("Enrichment worker started");
  return worker;
}

export async function triggerEnrichment(): Promise<void> {
  await queues.enrichment.add("enrichment-batch", {}, {});
  logger.info("Enrichment job queued");
}

export async function getEnrichmentStatus(): Promise<{
  enrichedCount: number;
  totalWithCve: number;
  pendingCount: number;
  percentComplete: number;
}> {
  const enrichedCount = await unifiedFindingRepo.countEnrichedFindings();
  const totalWithCve = await unifiedFindingRepo.countTotalFindingsWithCve();
  const pendingCount = Math.max(0, totalWithCve - enrichedCount);
  const percentComplete = totalWithCve > 0 ? Math.round((enrichedCount / totalWithCve) * 100) : 100;

  return { enrichedCount, totalWithCve, pendingCount, percentComplete };
}
