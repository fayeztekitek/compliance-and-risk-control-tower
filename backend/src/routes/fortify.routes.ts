import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { FortifyHttpClient } from "../services/fortifyHttpClient.js";
import { fortifySyncService } from "../services/fortifySyncService.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "SECURITY_MANAGER"]));

router.post("/sync", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, token } = req.body;
    if (!url || !token) return res.status(400).json({ error: "url and token required" });
    const client = new FortifyHttpClient({ url, authHeader: `FortifyToken ${token}` });
    const result = await fortifySyncService.sync(client);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, token } = req.body;
    if (!url || !token) return res.status(400).json({ error: "url and token required" });
    const client = new FortifyHttpClient({ url, authHeader: `FortifyToken ${token}` });
    await client.getProjects();
    res.json({ data: { success: true, message: "Connection successful" } });
  } catch (err: any) {
    res.json({ data: { success: false, message: err.message } });
  }
});

export default router;
