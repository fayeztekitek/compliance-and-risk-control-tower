import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { processSonarqubeWebhook, SonarqubeWebhookPayload } from "../services/sonarqubeAdapter.js";
import { sonarqubePollService } from "../services/sonarqubePollService.js";
import { SonarqubeHttpClient } from "../services/sonarqubeHttpClient.js";
import { env } from "../config/env.js";

const router = Router();

router.post("/webhook", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body as SonarqubeWebhookPayload;
    const findings = processSonarqubeWebhook(payload);
    let created = 0;
    for (const f of findings) {
      await unifiedFindingRepo.createFinding({
        sourceTool: "SONARQUBE",
        sourceId: f.sourceId,
        sourceTable: f.sourceTable,
        title: f.title,
        unifiedSeverity: f.severity,
        targetProduct: f.targetProduct,
        description: f.description,
      });
      created++;
    }
    res.json({ data: { received: true, findingsCreated: created, message: `Processed ${created} findings` } });
  } catch (err) { next(err); }
});

router.post("/sync", authMiddleware, rbacMiddleware(["ADMIN", "SECURITY_MANAGER"]), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!env.SONARQUBE_URL || !env.SONARQUBE_TOKEN) {
      res.status(400).json({ error: "SonarQube not configured. Set SONARQUBE_URL and SONARQUBE_TOKEN." });
      return;
    }
    const client = new SonarqubeHttpClient(env.SONARQUBE_URL, env.SONARQUBE_TOKEN);
    const result = await sonarqubePollService.sync(client);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
