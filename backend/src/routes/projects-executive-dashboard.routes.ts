import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { getProjectsExecutiveDashboard, getProjectDashboard } from "../services/projects-executive-dashboard.service.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"]));

router.get("/projects/executive-dashboard", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const data = await getProjectsExecutiveDashboard();
  res.json({ data });
}));

router.get("/projects/:id/dashboard", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const data = await getProjectDashboard(req.params.id);
  if (!data) return res.status(404).json({ error: "Project not found" });
  res.json({ data });
}));

export default router;
