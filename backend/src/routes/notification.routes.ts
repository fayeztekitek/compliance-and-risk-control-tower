import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { notificationEngine } from "../services/engines/notification.engine.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"]));

router.get("/notifications", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(_req.query.limit as string) || 50;
  const offset = parseInt(_req.query.offset as string) || 0;
  const notifications = await notificationEngine.getNotifications(limit, offset);
  res.json({ data: notifications });
}));

router.patch("/notifications/:id/read", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  await notificationEngine.markAsRead(req.params.id);
  res.json({ success: true });
}));

export default router;
