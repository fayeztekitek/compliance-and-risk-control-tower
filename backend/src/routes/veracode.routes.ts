import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { VeracodeHttpClient } from "../services/veracodeHttpClient.js";
import { veracodeSyncService } from "../services/veracodeSyncService.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "SECURITY_MANAGER"]));

router.post("/sync", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, apiId, apiKey } = req.body;
    if (!url || !apiId || !apiKey) return res.status(400).json({ error: "url, apiId, and apiKey required" });
    const auth = `VERACODE ${Buffer.from(`${apiId}:${apiKey}`).toString("base64")}`;
    const client = new VeracodeHttpClient({ url, authHeader: auth });
    const result = await veracodeSyncService.sync(client);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, apiId, apiKey } = req.body;
    if (!url || !apiId || !apiKey) return res.status(400).json({ error: "url, apiId, and apiKey required" });
    const auth = `VERACODE ${Buffer.from(`${apiId}:${apiKey}`).toString("base64")}`;
    const client = new VeracodeHttpClient({ url, authHeader: auth });
    await client.getApplications();
    res.json({ data: { success: true, message: "Connection successful" } });
  } catch (err: any) {
    res.json({ data: { success: false, message: err.message } });
  }
});

export default router;
