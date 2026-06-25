import { Router, Request, Response, NextFunction } from "express";
import { nexusService } from "../services/nexus.service.js";
import { nexusReportRepo } from "../repositories/nexusReport.repo.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";
import { env } from "../config/env.js";
import {
  nexusConfigSchema, nexusConfigUpdateSchema, nexusQuerySchema,
  createNexusWaiverSchema, triggerSyncSchema,
} from "../validation/nexus.schema.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"]));

/**
 * @openapi
 * /nexus/config:
 *   get:
 *     tags: [Nexus]
 *     summary: Get Nexus IQ configuration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nexus config (token masked)
 */
router.get("/config", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await nexusService.getConfig();
    if (config) {
      const { tokenEncrypted, ...safe } = config;
      return res.json({ data: { ...safe, token: tokenEncrypted ? "********" : null } });
    }
    res.json({ data: { url: env.NEXUS_IQ_URL || "", username: env.NEXUS_IQ_USERNAME || "", token: "" } });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/config:
 *   put:
 *     tags: [Nexus]
 *     summary: Create or replace Nexus IQ configuration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Config updated
 */
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

/**
 * @openapi
 * /nexus/config:
 *   patch:
 *     tags: [Nexus]
 *     summary: Partial update of Nexus IQ configuration
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Config updated
 */
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

/**
 * @openapi
 * /nexus/config/test:
 *   post:
 *     tags: [Nexus]
 *     summary: Test Nexus IQ connection
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection test result
 */
router.post("/config/test", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.testConnection();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/config/connect:
 *   post:
 *     tags: [Nexus]
 *     summary: Test Nexus IQ connection and fetch remote organizations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Connection test result and remote org list
 */
router.post("/config/connect", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.testAndFetchOrgs(req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/applications/fetch:
 *   post:
 *     tags: [Nexus]
 *     summary: Fetch applications from Nexus IQ, optionally filtered by organizationId
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of applications from Nexus IQ
 */
router.post("/applications/fetch", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.fetchApplications(req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// ---- Reports ----

router.post("/reports/history", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.fetchReportHistory(req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/reports/violations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.fetchReportPolicyViolations(req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/reports/vulnerabilities/live", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.fetchReportVulnerabilities(req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/reports/latest", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.fetchLatestReport(req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// Backward-compatible GET endpoint for old frontend
router.get("/reports/:applicationId/latest", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.fetchLatestReport({
      sessionToken: req.query.sessionToken as string | undefined,
      applicationId: req.params.applicationId,
    });
    res.json({ data: result });
  } catch (err) { next(err); }
});

// ---- Report Drill-Down Routes ----

/**
 * @openapi
 * /nexus/reports/sync:
 *   post:
 *     tags: [Nexus]
 *     summary: Sync all reports and violations for an application into local DB
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync result summary
 */
router.post("/reports/sync", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionToken, applicationId, applicationPublicId } = req.body;
    if (!sessionToken || !applicationId) throw new ValidationError("sessionToken and applicationId are required");
    const { nexusReportService } = await import("../services/nexusReport.service.js");
    const result = await nexusReportService.syncReports(sessionToken, applicationId, applicationPublicId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/reports/bulk-scan-status:
 *   post:
 *     tags: [Nexus]
 *     summary: Fetch live scan status for multiple applications with concurrency control
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionToken:
 *                 type: string
 *               applications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     publicId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Scan status per application
 */
router.post("/reports/bulk-scan-status", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionToken, applications } = req.body;
    if (!sessionToken || !Array.isArray(applications)) throw new ValidationError("sessionToken and applications array are required");
    const result = await nexusService.fetchBulkScanStatus({ sessionToken, applications });
    res.json({ data: result.scans });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/reports:
 *   get:
 *     tags: [Nexus]
 *     summary: List stored scan reports for an application
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of reports
 */
router.get("/reports", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applicationId = req.query.applicationId as string;
    if (!applicationId) throw new ValidationError("applicationId is required");
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const { nexusReportService } = await import("../services/nexusReport.service.js");
    const result = await nexusReportService.listReports(applicationId, page, limit);
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/reports/{id}:
 *   get:
 *     tags: [Nexus]
 *     summary: Get a single stored report by scan ID or internal UUID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Report detail
 */
router.get("/reports/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nexusReportService } = await import("../services/nexusReport.service.js");
    const result = await nexusReportService.getReport(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/reports/{id}/violations:
 *   get:
 *     tags: [Nexus]
 *     summary: List policy violations for a stored report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Violations list with severity summary
 */
router.get("/reports/:id/violations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const { nexusReportService } = await import("../services/nexusReport.service.js");
    const result = await nexusReportService.getReportViolations(req.params.id, {
      severity: req.query.severity as string,
      status: req.query.status as string,
      search: req.query.search as string,
      page, limit,
    });
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/reports/compare:
 *   post:
 *     tags: [Nexus]
 *     summary: Compare two stored reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comparison result with added/removed/same violations
 */
router.post("/reports/compare", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportIdA, reportIdB } = req.body;
    if (!reportIdA || !reportIdB) throw new ValidationError("reportIdA and reportIdB are required");
    const { nexusReportService } = await import("../services/nexusReport.service.js");
    const result = await nexusReportService.compareReports(reportIdA, reportIdB);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/reports/scan-counts:
 *   post:
 *     tags: [Nexus]
 *     summary: Get stored scan report counts and latest dates for multiple applications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               applicationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Scan counts per application
 */
router.post("/reports/scan-counts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { applicationIds } = req.body;
    if (!Array.isArray(applicationIds)) throw new ValidationError("applicationIds must be an array");
    const counts = await nexusReportRepo.getScanCountsForApps(applicationIds);
    res.json({ data: counts });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/reports/{applicationId}/evolution:
 *   get:
 *     tags: [Nexus]
 *     summary: Get vulnerability evolution timeline for an application
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Evolution timeline
 */
router.get("/reports/:applicationId/evolution", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nexusReportService } = await import("../services/nexusReport.service.js");
    const result = await nexusReportService.getEvolution(
      req.params.applicationId,
      req.query.fromDate as string,
      req.query.toDate as string,
    );
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/reports/{applicationId}/components:
 *   get:
 *     tags: [Nexus]
 *     summary: Get component impact metrics for an application
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Component impact list
 */
router.get("/reports/:applicationId/components", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nexusReportService } = await import("../services/nexusReport.service.js");
    const result = await nexusReportService.getComponentImpact(req.params.applicationId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/sync:
 *   post:
 *     tags: [Nexus]
 *     summary: Trigger a Nexus IQ sync
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync triggered
 */
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

/**
 * @openapi
 * /nexus/sync/status/{batchId}:
 *   get:
 *     tags: [Nexus]
 *     summary: Get sync status by batch ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status
 */
router.get("/sync/status/:batchId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.getSyncStatus(req.params.batchId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/sync/logs:
 *   get:
 *     tags: [Nexus]
 *     summary: List sync logs with pagination
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated sync logs
 */
router.get("/sync/logs", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await nexusService.listSyncLogs(page, limit);
    res.json(result);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/products:
 *   get:
 *     tags: [Nexus]
 *     summary: List Nexus IQ products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product list
 */
router.get("/products", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.listProducts(req.query.search as string);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/products/{productId}:
 *   get:
 *     tags: [Nexus]
 *     summary: Get product details by ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product details
 */
router.get("/products/:productId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.getProduct(req.params.productId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/applications:
 *   get:
 *     tags: [Nexus]
 *     summary: List applications, optionally filtered by product
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application list
 */
router.get("/applications", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.listApplications(req.query.productId as string, req.query.search as string);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/vulnerabilities:
 *   get:
 *     tags: [Nexus]
 *     summary: List Nexus vulnerabilities with pagination and filters
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Paginated vulnerability list
 */
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

/**
 * @openapi
 * /nexus/vulnerabilities/{id}:
 *   get:
 *     tags: [Nexus]
 *     summary: Get vulnerability by ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vulnerability details
 */
router.get("/vulnerabilities/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.getVulnerability(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/waivers:
 *   get:
 *     tags: [Nexus]
 *     summary: List Nexus waivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Waiver list
 */
router.get("/waivers", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.listWaivers({ productId: req.query.productId as string, status: req.query.status as string });
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/waivers:
 *   post:
 *     tags: [Nexus]
 *     summary: Create a Nexus waiver
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Waiver created
 */
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

/**
 * @openapi
 * /nexus/kpis/executive:
 *   get:
 *     tags: [Nexus]
 *     summary: Get executive KPI summary from Nexus data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Executive KPI payload
 */
router.get("/kpis/executive", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.getExecutiveKpis();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/kpis/product/{productId}:
 *   get:
 *     tags: [Nexus]
 *     summary: Get KPI drill-down for a specific product
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product KPI data
 */
router.get("/kpis/product/:productId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.getProductKpis(req.params.productId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/risk-score/product/{productId}:
 *   get:
 *     tags: [Nexus]
 *     summary: Get risk score for a product
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Risk score with grade
 */
router.get("/risk-score/product/:productId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.getProductRiskScore(req.params.productId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/jobs:
 *   get:
 *     tags: [Nexus]
 *     summary: Get BullMQ job statuses dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job status counts
 */
router.get("/jobs", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { getJobStatuses } = await import("../services/queue.service.js");
    const result = await getJobStatuses();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/findings/{id}/detail:
 *   get:
 *     tags: [Nexus]
 *     summary: Get finding with all components, occurrences, mitigations, and waivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Finding detail with all related data
 */
router.get("/findings/:id/detail", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { findingDetailService } = await import("../services/findingDetail.service.js");
    const result = await findingDetailService.getFindingDetail(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /nexus/occurrences/{id}/detail:
 *   get:
 *     tags: [Nexus]
 *     summary: Get occurrence with component, finding, mitigations, and waivers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Occurrence detail with all related data
 */
router.get("/occurrences/:id/detail", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { findingDetailService } = await import("../services/findingDetail.service.js");
    const result = await findingDetailService.getOccurrenceDetail(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/kpis/executive/live", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await nexusService.fetchExecutiveLiveKpis(req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
