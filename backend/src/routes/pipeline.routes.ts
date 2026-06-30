import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { pipelineService } from "../services/pipeline.service.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";

const router = Router();

const ingestSchema = z.object({
  source: z.enum(["github_actions", "gitlab_ci", "manual"]),
  sourceRunId: z.string().optional(),
  project: z.string().min(1),
  pipelineName: z.string().optional(),
  status: z.enum(["pending", "running", "success", "failure", "cancelled", "skipped", "error"]),
  branch: z.string().optional(),
  commitSha: z.string().optional(),
  commitMessage: z.string().optional(),
  triggerActor: z.string().optional(),
  url: z.string().optional(),
  durationSeconds: z.number().int().optional(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  rawPayload: z.record(z.any()).optional(),
});

// Webhook receiver — no auth (signature verification in production)
router.post("/webhook/github", async (req: Request, res: Response) => {
  try {
    const run = await pipelineService.processGithubWebhook(req.body);
    if (run) {
      pipelineService.evaluateGates(run.id).catch(err => logger.error({ err }, "Gate evaluation failed"));
      res.json({ data: { received: true, runId: run.id, status: run.status } });
    } else {
      res.json({ data: { received: true, note: "No workflow_run or check_suite event" } });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/webhook/gitlab", async (req: Request, res: Response) => {
  try {
    const run = await pipelineService.processGitlabWebhook(req.body);
    if (run) {
      pipelineService.evaluateGates(run.id).catch(err => logger.error({ err }, "Gate evaluation failed"));
      res.json({ data: { received: true, runId: run.id, status: run.status } });
    } else {
      res.json({ data: { received: true, note: "No pipeline or build event" } });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Authenticated routes
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "SECURITY_MANAGER"]));

// Ingest via API
router.post("/", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const parsed = ingestSchema.parse(req.body);
    const run = await pipelineService.ingestRun(parsed);
    const gates = await pipelineService.evaluateGates(run.id);
    res.status(201).json({ data: { run, gates } });
  } catch (err) { next(err); }
});

// List runs
router.get("/", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { source, project, status, page, limit } = req.query;
    const result = await pipelineService.listRuns({
      source: source as string,
      project: project as string,
      status: status as string,
      page: parseInt(page as string, 10) || 1,
      limit: Math.min(parseInt(limit as string, 10) || 20, 100),
    });
    res.json(result);
  } catch (err) { next(err); }
});

// Get single run
router.get("/:id", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const run = await pipelineService.getRun(req.params.id);
    if (!run) return res.status(404).json({ error: "Pipeline run not found" });
    res.json({ data: run });
  } catch (err) { next(err); }
});

// Get gates for a run
router.get("/:id/gates", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const gates = await pipelineService.getGates(req.params.id);
    res.json({ data: gates });
  } catch (err) { next(err); }
});

// Re-evaluate gates for a run
router.post("/:id/evaluate", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const gates = await pipelineService.evaluateGates(req.params.id);
    res.json({ data: gates });
  } catch (err) { next(err); }
});

// Recent gates across all runs
router.get("/gates/recent", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
    const gates = await pipelineService.listRecentGates(limit);
    res.json({ data: gates });
  } catch (err) { next(err); }
});

// Stats
router.get("/stats/summary", async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await pipelineService.getStats();
    res.json({ data: stats });
  } catch (err) { next(err); }
});

import { logger } from "../core/logger.js";

export default router;
