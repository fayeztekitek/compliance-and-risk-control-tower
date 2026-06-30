import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { getProjectsDashboard } from "../services/projects-dashboard.service.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "EXECUTIVE_READ_ONLY"]));

router.get("/dashboard/projects", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const data = await getProjectsDashboard();
  res.json({ data });
}));

export default router;
