import { Router, Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service.js";
import { kpiService } from "../services/kpi.service.js";
import { vulnerabilityAggregationService } from "../services/vulnerabilityAggregation.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { getCached, setCache } from "../services/redis.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "AUDITOR", "EXECUTIVE_READ_ONLY"]));

/**
 * @openapi
 * /dashboard/executive:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get consolidated executive dashboard payload
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Consolidated KPIs, KRIs, heatmap, trends
 */
const CACHE_KEY = "dashboard:executive";
const CACHE_TTL = 60;

router.get("/executive", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cached = await getCached<object>(CACHE_KEY);
    if (cached) {
      res.json({ data: cached, cached: true });
      return;
    }
    const result = await dashboardService.getExecutiveDashboard();
    await setCache(CACHE_KEY, result, CACHE_TTL);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /dashboard/kpi:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get all 16 KPI values
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 16 KPI objects
 */
router.get("/kpi", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await kpiService.get16Kpis();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /dashboard/kri:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get 4 KRI thresholds with status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 4 KRI objects
 */
router.get("/kri", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await kpiService.get4Kris();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /dashboard/heatmap:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get 5x5 risk heatmap data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Heatmap with severity levels, age ranges, and cells
 */
router.get("/heatmap", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await kpiService.get5x5Heatmap();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly KPI trends
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema: { type: integer, default: 12 }
 *         description: Number of months to include
 *     responses:
 *       200:
 *         description: Monthly security and project trends
 */
router.get("/trends", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const result = await kpiService.getMonthlyTrends(months);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /dashboard/mttr:
 *   get:
 *     tags: [Dashboard]
 *     summary: MTTR by severity
 */
router.get("/mttr", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await kpiService.getMTTR();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /dashboard/sla-breach:
 *   get:
 *     tags: [Dashboard]
 *     summary: SLA breach rate
 */
router.get("/sla-breach", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await kpiService.getSLABreachRate();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /dashboard/distinct-vs-occurrences:
 *   get:
 *     tags: [Dashboard]
 *     summary: Distinct vs occurrence count
 */
router.get("/distinct-vs-occurrences", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await kpiService.getDistinctVsOccurrences();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /dashboard/compliance-posture:
 *   get:
 *     tags: [Dashboard]
 *     summary: Compliance posture per organization
 */
router.get("/compliance-posture", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const kpis = await kpiService.get16Kpis();
    const posture = {
      complianceScore: kpis.complianceScore,
      slaBreachRate: kpis.slaBreachRate,
      mttrDays: kpis.mttrDays,
      totalVulnerabilities: kpis.totalVulnerabilities,
      openVulnerabilities: kpis.openVulnerabilities,
      fixedRate: kpis.totalVulnerabilities > 0
        ? Math.round((kpis.fixedVulnerabilities / kpis.totalVulnerabilities) * 100)
        : 0,
      grade: kpis.complianceScore >= 90 ? "GREEN" : kpis.complianceScore >= 70 ? "AMBER" : "RED",
    };
    res.json({ data: posture });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /dashboard/nexus-lifecycle-summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Nexus Lifecycle vulnerability aggregation across all orgs/apps
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregated stats and top vulnerabilities
 */
router.get("/nexus-lifecycle-summary", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await vulnerabilityAggregationService.getStats();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /dashboard/nexus-lifecycle-occurrences/{vulnId}:
 *   get:
 *     tags: [Dashboard]
 *     summary: Drill-down occurrences for a specific vulnerability
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vulnId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of occurrences
 */
router.get("/nexus-lifecycle-occurrences/:vulnId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await vulnerabilityAggregationService.getOccurrences(req.params.vulnId);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /dashboard/recalculate:
 *   post:
 *     tags: [Dashboard]
 *     summary: Trigger KPI recalculation (ADMIN only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recalculation completed
 */
router.post("/recalculate", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await kpiService.recalculate();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /dashboard/latest-snapshot:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get latest executive KPI snapshot
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Latest precomputed KPI snapshot
 */
router.get("/latest-snapshot", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await kpiService.getLatestSnapshot();
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
