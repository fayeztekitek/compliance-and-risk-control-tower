import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { reportingEngine } from "../services/engines/reporting.engine.js";
import { workflowEngine } from "../services/engines/workflow.engine.js";
import { kpiEngine } from "../services/engines/kpi.engine.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "EXECUTIVE_READ_ONLY"]));

router.post("/engine/reports/generate", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const result = await reportingEngine.generateReport(req.body);
  res.json({ data: result });
}));

router.get("/engine/reports/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const report = await reportingEngine.getReportStatus(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  res.json({ data: report });
}));

router.get("/engine/reports", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(_req.query.limit as string) || 20;
  const offset = parseInt(_req.query.offset as string) || 0;
  const reports = await reportingEngine.listReports(limit, offset);
  res.json({ data: reports });
}));

router.get("/engine/kpi/definitions", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const defs = await kpiEngine.getKpiDefinitions();
  res.json({ data: defs });
}));

router.get("/engine/kri/definitions", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const defs = await kpiEngine.getKriDefinitions();
  res.json({ data: defs });
}));

router.post("/engine/kpi/recalculate", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  await kpiEngine.triggerRecalculation();
  res.json({ success: true });
}));

router.get("/engine/workflow/active", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const entityType = _req.query.entityType as string | undefined;
  const instances = await workflowEngine.getActiveInstances(entityType);
  res.json({ data: instances });
}));

export default router;
