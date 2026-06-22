import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { triggerEnrichment, getEnrichmentStatus } from "../services/enrichmentWorker.js";
import { epssClient } from "../services/epssClient.js";

const router = Router();

router.post(
  "/api/enrichment/trigger",
  authMiddleware,
  rbacMiddleware(["ADMIN", "SECURITY_MANAGER", "COMPLIANCE_OFFICER"]),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await triggerEnrichment();
      res.status(202).json({ success: true, message: "Enrichment job queued" });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/api/enrichment/status",
  authMiddleware,
  rbacMiddleware(["ADMIN", "SECURITY_MANAGER", "COMPLIANCE_OFFICER", "EXECUTIVE_READ_ONLY"]),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await getEnrichmentStatus();
      const cacheStats = await epssClient.getCacheStats();
      res.json({ ...status, ...cacheStats });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/api/enrichment/lookup",
  authMiddleware,
  rbacMiddleware(["ADMIN", "SECURITY_MANAGER"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cveId } = req.body;
      if (!cveId || typeof cveId !== "string") {
        res.status(400).json({ error: "cveId is required" });
        return;
      }
      const result = await epssClient.enrichCve(cveId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
