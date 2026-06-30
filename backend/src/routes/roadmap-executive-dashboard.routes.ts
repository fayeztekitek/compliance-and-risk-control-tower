import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { getRoadmapExecutiveDashboard, getRoadmapRtdTrend } from "../services/roadmap-executive-dashboard.service.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "EXECUTIVE_READ_ONLY"]));

router.get("/roadmaps/executive-dashboard", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const data = await getRoadmapExecutiveDashboard();
  res.json({ data });
}));

router.get("/roadmaps/:id/rtd-trend", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const data = await getRoadmapRtdTrend(req.params.id);
  res.json({ data });
}));

export default router;
