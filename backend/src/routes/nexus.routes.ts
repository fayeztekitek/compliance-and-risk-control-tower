import { Router, Request, Response, NextFunction } from "express";
import { nexusService } from "../services/nexus.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";
import {
  nexusConfigSchema, nexusConfigUpdateSchema, nexusQuerySchema,
  createNexusWaiverSchema, triggerSyncSchema,
} from "../validation/nexus.schema.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"]));

// ---- Config ----
router.get("/config", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await nexusService.getConfig();
    if (config) {
      const { tokenEncrypted, ...safe } = config;
      return res.json({ data: { ...safe, token: tokenEncrypted ? "********" : null } });
    }
    res.json({ data: null });
  } catch (err) { next(err); }
});

router.put("/config", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = nexusConfigSchema.parse(req.body);
    const result = await nexusService.updateConfig(parsed);
    res.json({ data: { ...result, token: "********" } });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.patch("/config", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = nexusConfigUpdateSchema.parse(req.body);
    const result = await nexusService.updateConfig(parsed);
    res.json({ data: { ...result, token: "********" } });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.post("/config/test", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.testConnection();
    res.json({ data: result });
  } catch (err) { next(err); }
});

// ---- Sync ----
router.post("/sync", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = triggerSyncSchema.parse(req.body);
    const result = await nexusService.triggerSync(parsed);
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.get("/sync/status/:batchId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.getSyncStatus(req.params.batchId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/sync/logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await nexusService.listSyncLogs(page, limit);
    res.json(result);
  } catch (err) { next(err); }
});

// ---- Products ----
router.get("/products", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.listProducts(req.query.search as string);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/products/:productId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.getProduct(req.params.productId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// ---- Applications ----
router.get("/applications", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.listApplications(req.query.productId as string, req.query.search as string);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// ---- Vulnerabilities ----
router.get("/vulnerabilities", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = nexusQuerySchema.parse(req.query);
    const result = await nexusService.listVulnerabilities(query);
    res.json({ data: result.data, total: result.total, page: result.page, limit: result.limit });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid query", err.flatten().fieldErrors));
    next(err);
  }
});

router.get("/vulnerabilities/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.getVulnerability(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// ---- Waivers ----
router.get("/waivers", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.listWaivers({ productId: req.query.productId as string, status: req.query.status as string });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/waivers", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createNexusWaiverSchema.parse(req.body);
    const result = await nexusService.createWaiver(parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

// ---- KPI ----
router.get("/kpis/executive", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.getExecutiveKpis();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/kpis/product/:productId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.getProductKpis(req.params.productId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/risk-score/product/:productId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.getProductRiskScore(req.params.productId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// ---- Jobs Dashboard ----
router.get("/jobs", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { getJobStatuses } = await import("../services/queue.service.js");
    const result = await getJobStatuses();
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
