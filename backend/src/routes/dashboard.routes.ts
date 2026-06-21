import { Router, Request, Response, NextFunction } from "express";
import { dashboardService } from "../services/dashboard.service.js";
import { kpiService } from "../services/kpi.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "PRODUCT_OWNER", "AUDITOR", "EXECUTIVE_READ_ONLY"]));

router.get("/executive", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await dashboardService.getExecutiveDashboard();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/kpi", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await kpiService.get16Kpis();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/kri", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await kpiService.get4Kris();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/heatmap", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await kpiService.get5x5Heatmap();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/trends", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = parseInt(req.query.months as string) || 12;
    const result = await kpiService.getMonthlyTrends(months);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
