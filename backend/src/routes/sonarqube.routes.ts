import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { processSonarqubeWebhook, SonarqubeWebhookPayload } from "../services/sonarqubeAdapter.js";

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

export default router;
