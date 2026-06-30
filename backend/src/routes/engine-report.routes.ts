import { Router, Response } from "express";
import { z } from "zod";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { reportingEngine } from "../services/engines/reporting.engine.js";
import { workflowEngine } from "../services/engines/workflow.engine.js";
import { kpiEngine } from "../services/engines/kpi.engine.js";
import { wrapAsync } from "../utils/wrapAsync.js";
import { ValidationError } from "../core/errors.js";
import { existsSync } from "fs";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "EXECUTIVE_READ_ONLY"]));

const generateSchema = z.object({
  templateId: z.string().uuid().optional(),
  templateName: z.string().optional(),
  name: z.string().min(1),
  format: z.enum(["CSV", "PDF", "XLSX", "HTML"]),
  params: z.record(z.any()).optional(),
  channels: z.array(z.string()).optional(),
  recipients: z.array(z.string()).optional(),
});

const templateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  config: z.object({
    sections: z.array(z.object({
      title: z.string(),
      type: z.enum(["kpi_summary", "table", "chart_data"]),
      dataSource: z.string().optional(),
      query: z.string().optional(),
    })),
    filters: z.record(z.any()).optional(),
  }),
});

const scheduleSchema = z.object({
  templateId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  cron: z.string().min(1),
  format: z.enum(["CSV", "PDF", "XLSX", "HTML"]).optional(),
  params: z.record(z.any()).optional(),
  recipients: z.array(z.string()).optional(),
  channels: z.array(z.string()).optional(),
});

// --- Template CRUD ---
router.get("/engine/reports/templates", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const templates = await reportingEngine.listTemplates();
  res.json({ data: templates });
}));

router.get("/engine/reports/templates/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const template = await reportingEngine.getTemplate(req.params.id);
  if (!template) return res.status(404).json({ error: "Template not found" });
  res.json({ data: template });
}));

router.post("/engine/reports/templates", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = templateSchema.parse(req.body);
  const id = await reportingEngine.createTemplate(parsed);
  res.status(201).json({ data: { id } });
}));

router.put("/engine/reports/templates/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = templateSchema.partial().parse(req.body);
  const template = await reportingEngine.updateTemplate(req.params.id, parsed);
  if (!template) return res.status(404).json({ error: "Template not found" });
  res.json({ data: template });
}));

router.delete("/engine/reports/templates/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  await reportingEngine.deleteTemplate(req.params.id);
  res.status(204).send();
}));

// --- Schedule CRUD ---
router.get("/engine/reports/schedules", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const schedules = await reportingEngine.listSchedules();
  res.json({ data: schedules });
}));

router.get("/engine/reports/schedules/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const schedule = await reportingEngine.getSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ error: "Schedule not found" });
  res.json({ data: schedule });
}));

router.post("/engine/reports/schedules", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = scheduleSchema.parse(req.body);
  const schedule = await reportingEngine.createSchedule(parsed);
  res.status(201).json({ data: schedule });
}));

router.put("/engine/reports/schedules/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = scheduleSchema.partial().parse(req.body);
  const schedule = await reportingEngine.updateSchedule(req.params.id, parsed);
  if (!schedule) return res.status(404).json({ error: "Schedule not found" });
  res.json({ data: schedule });
}));

router.delete("/engine/reports/schedules/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  await reportingEngine.deleteSchedule(req.params.id);
  res.status(204).send();
}));

// --- Report Generation ---
router.post("/engine/reports/generate", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const parsed = generateSchema.parse(req.body);
  const result = await reportingEngine.generateReport(parsed);
  res.json({ data: result });
}));

router.get("/engine/reports/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const report = await reportingEngine.getReportStatus(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  res.json({ data: report });
}));

router.get("/engine/reports", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = parseInt(req.query.offset as string) || 0;
  const reports = await reportingEngine.listReports(limit, offset);
  res.json({ data: reports });
}));

// --- Distribution ---
router.get("/engine/reports/:id/distribution", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const logs = await reportingEngine.getDistributionLogs(req.params.id);
  res.json({ data: logs });
}));

router.post("/engine/reports/:id/distribute", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { channels, recipients } = req.body;
  if (!channels?.length || !recipients?.length) {
    throw new ValidationError("channels and recipients are required");
  }
  const report = await reportingEngine.getReportStatus(req.params.id);
  if (!report) return res.status(404).json({ error: "Report not found" });
  await reportingEngine.distributeReport(req.params.id, channels, recipients, report.filePath);
  res.json({ data: { distributed: true } });
}));

// --- File Download ---
router.get("/engine/reports/:id/download", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const report = await reportingEngine.getReportStatus(req.params.id);
  if (!report || !report.filePath) return res.status(404).json({ error: "Report file not found" });
  if (!existsSync(report.filePath)) return res.status(404).json({ error: "File does not exist on disk" });
  res.download(report.filePath);
}));

// --- KPI / Workflow (existing) ---
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
