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

/**
 * @openapi
 * /security/vulnerabilities:
 *   get:
 *     tags: [Security]
 *     summary: List vulnerabilities with pagination and filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema: { type: string, enum: [CRITICAL, HIGH, MEDIUM, LOW] }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated vulnerability list
 */
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

/**
 * @openapi
 * /security/vulnerabilities/{id}:
 *   get:
 *     tags: [Security]
 *     summary: Get vulnerability by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Vulnerability details
 */
router.get("/vulnerabilities/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.getVulnerability(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /security/vulnerabilities:
 *   post:
 *     tags: [Security]
 *     summary: Create a new vulnerability
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Vulnerability created
 */
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

/**
 * @openapi
 * /security/vulnerabilities/{id}:
 *   patch:
 *     tags: [Security]
 *     summary: Update a vulnerability
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vulnerability updated
 */
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

/**
 * @openapi
 * /security/vulnerabilities/{id}/false-positive:
 *   post:
 *     tags: [Security]
 *     summary: Mark vulnerability as false positive
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: False positive status toggled
 */
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

/**
 * @openapi
 * /security/waivers:
 *   get:
 *     tags: [Security]
 *     summary: List waivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Waiver list
 */
router.get("/waivers", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.listWaivers();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /security/waivers:
 *   post:
 *     tags: [Security]
 *     summary: Create a waiver request
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Waiver created
 */
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

/**
 * @openapi
 * /security/waivers/{id}/approve:
 *   patch:
 *     tags: [Security]
 *     summary: Approve a waiver
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Waiver approved
 */
router.patch("/waivers/:id/approve", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.approveWaiver(req.params.id, (req as any).user?.name);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /security/waivers/{id}/reject:
 *   patch:
 *     tags: [Security]
 *     summary: Reject a waiver
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Waiver rejected
 */
router.patch("/waivers/:id/reject", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.rejectWaiver(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /security/risk-acceptances:
 *   get:
 *     tags: [Security]
 *     summary: List risk acceptances
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Risk acceptance list
 */
router.get("/risk-acceptances", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.listRiskAcceptances();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /security/risk-acceptances:
 *   post:
 *     tags: [Security]
 *     summary: Create a risk acceptance request
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Risk acceptance created
 */
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

/**
 * @openapi
 * /security/risk-acceptances/{id}/approve:
 *   patch:
 *     tags: [Security]
 *     summary: Approve a risk acceptance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Risk acceptance approved (vulnerability remediated)
 */
router.patch("/risk-acceptances/:id/approve", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.approveRiskAcceptance(req.params.id, (req as any).user?.name);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /security/sla-incidents:
 *   get:
 *     tags: [Security]
 *     summary: List SLA incidents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SLA incident list
 */
router.get("/sla-incidents", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.listSlaIncidents();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /security/sla-incidents:
 *   post:
 *     tags: [Security]
 *     summary: Create an SLA incident manually
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: SLA incident created
 */
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

/**
 * @openapi
 * /security/detect-sla-breaches:
 *   post:
 *     tags: [Security]
 *     summary: Detect SLA breaches for overdue vulnerabilities
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SLA breach detection completed
 */
router.post("/detect-sla-breaches", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.detectSlaBreaches();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /security/check-waiver-expiry:
 *   post:
 *     tags: [Security]
 *     summary: Check and auto-expire waivers past their expiry date
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Waiver expiry check completed
 */
router.post("/check-waiver-expiry", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.checkWaiverExpiry();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /security/import/scan:
 *   post:
 *     tags: [Security]
 *     summary: Import vulnerabilities from a scan report
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Scan imported
 */
router.post("/import/scan", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await securityService.importScan(req.body.vulnerabilities || []);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
