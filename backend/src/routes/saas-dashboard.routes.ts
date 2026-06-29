import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { getSaaSDashboard } from "../services/saas-dashboard.service.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "EXECUTIVE_READ_ONLY"]));

router.get("/dashboard/saas", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const data = await getSaaSDashboard();
  res.json({ data });
}));

export default router;
