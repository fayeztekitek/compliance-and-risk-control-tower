import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { trendService } from "../services/trend.service.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"]));

router.get("/applications/:id", async (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string, 10) || 6;
  const result = await trendService.getTrend(req.params.id, Math.min(months, 24));
  res.json(result);
});

router.get("/organizations/:id", async (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string, 10) || 6;
  const result = await trendService.getOrgTrend(req.params.id, Math.min(months, 24));
  res.json(result);
});

router.get("/velocity", async (req: Request, res: Response) => {
  const months = parseInt(req.query.months as string, 10) || 3;
  const applicationId = req.query.applicationId as string | undefined;
  const result = await trendService.getVulnerabilityVelocity(applicationId, Math.min(months, 12));
  res.json(result);
});

export default router;
