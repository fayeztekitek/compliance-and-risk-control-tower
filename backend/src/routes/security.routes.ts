import { Router, Request, Response, NextFunction } from "express";
import { securityService } from "../services/security.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";
import {
  createVulnerabilitySchema, updateVulnerabilitySchema, listVulnerabilityQuerySchema,
  falsePositiveSchema, createWaiverSchema, createRiskAcceptanceSchema, createSlaIncidentSchema,
} from "../validation/security.schema.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"]));

// ---------- Vulnerabilities ----------
router.get("/vulnerabilities", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listVulnerabilityQuerySchema.parse(req.query);
    const result = await securityService.listVulnerabilities(query);
    res.json({ data: result.data, total: result.total, page: result.page, limit: result.limit });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid query", err.flatten().fieldErrors));
    next(err);
  }
});

router.get("/vulnerabilities/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.getVulnerability(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/vulnerabilities", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createVulnerabilitySchema.parse(req.body);
    const result = await securityService.createVulnerability(parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.patch("/vulnerabilities/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateVulnerabilitySchema.parse(req.body);
    const result = await securityService.updateVulnerability(req.params.id, parsed);
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.post("/vulnerabilities/:id/false-positive", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = falsePositiveSchema.parse(req.body);
    const result = await securityService.setFalsePositive(req.params.id, parsed.explanation);
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

// ---------- Waivers ----------
router.get("/waivers", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.listWaivers();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/waivers", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createWaiverSchema.parse(req.body);
    const result = await securityService.createWaiver(parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.patch("/waivers/:id/approve", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.approveWaiver(req.params.id, (req as any).user?.name);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.patch("/waivers/:id/reject", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.rejectWaiver(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// ---------- Risk Acceptances ----------
router.get("/risk-acceptances", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.listRiskAcceptances();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/risk-acceptances", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createRiskAcceptanceSchema.parse(req.body);
    const result = await securityService.createRiskAcceptance(parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.patch("/risk-acceptances/:id/approve", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.approveRiskAcceptance(req.params.id, (req as any).user?.name);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// ---------- SLA Incidents ----------
router.get("/sla-incidents", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.listSlaIncidents();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/sla-incidents", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createSlaIncidentSchema.parse(req.body);
    const { securityRepo } = await import("../repositories/security.repo.js");
    const result = await securityRepo.createSlaIncident(parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

// ---------- SLA Breach Detection ----------
router.post("/detect-sla-breaches", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.detectSlaBreaches();
    res.json({ data: result });
  } catch (err) { next(err); }
});

// ---------- Waiver Expiry ----------
router.post("/check-waiver-expiry", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.checkWaiverExpiry();
    res.json({ data: result });
  } catch (err) { next(err); }
});

// ---------- Scan Import ----------
router.post("/import/scan", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.importScan(req.body.vulnerabilities || []);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
