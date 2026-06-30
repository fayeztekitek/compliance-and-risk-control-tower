import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { notificationEngine } from "../services/engines/notification.engine.js";
import { notificationGenerator } from "../services/notification-generator.service.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"]));

router.get("/notifications", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;
  const filter = req.query.filter as string | undefined;
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const notifications = await notificationEngine.getNotifications(limit, offset, userId);
  let filtered = notifications;
  if (filter === "unread") filtered = notifications.filter((n: any) => n.status !== "READ");
  else if (filter === "read") filtered = notifications.filter((n: any) => n.status === "READ");
  if (req.query.type) {
    filtered = filtered.filter((n: any) => n.type === req.query.type);
  }
  res.json({ data: filtered });
}));

router.get("/notifications/unread-count", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const count = await notificationEngine.getUnreadCount(userId);
  res.json({ count });
}));

router.patch("/notifications/read-all", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  await notificationEngine.markAllRead(userId);
  res.json({ success: true });
}));

router.patch("/notifications/:id/read", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  await notificationEngine.markAsRead(req.params.id);
  res.json({ success: true });
}));

router.post("/notifications/generate", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const result = await notificationGenerator.generateAll();
  res.json(result);
}));

export default router;
