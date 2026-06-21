import { Router, Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service.js";
import { kpiService } from "../services/kpi.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";

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
router.get("/executive", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await dashboardService.getExecutiveDashboard();
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

export default router;
