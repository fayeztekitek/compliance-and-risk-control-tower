import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { unifiedFindingService } from "../services/unifiedFinding.service.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"]));

router.get("/", async (req: Request, res: Response) => {
  const { page = "1", limit = "20", sourceTool, severity, status, productId, applicationId, cveId, search } = req.query;
  const result = await unifiedFindingService.listFindings({
    page: parseInt(page as string, 10),
    limit: Math.min(parseInt(limit as string, 10), 100),
    sourceTool: sourceTool as string,
    severity: severity as string,
    status: status as string,
    productId: productId as string,
    applicationId: applicationId as string,
    cveId: cveId as string,
    search: search as string,
  });
  res.json(result);
});

router.get("/summary", async (_req: Request, res: Response) => {
  const summary = await unifiedFindingService.getCrossToolSummary();
  res.json(summary);
});

router.get("/:id", async (req: Request, res: Response) => {
  const finding = await unifiedFindingService.getFinding(req.params.id);
  res.json(finding);
});

router.post("/", async (req: Request, res: Response) => {
  const finding = await unifiedFindingService.createFinding(req.body);
  res.status(201).json(finding);
});

router.patch("/:id", async (req: Request, res: Response) => {
  const finding = await unifiedFindingService.updateFinding(req.params.id, req.body);
  res.json(finding);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await unifiedFindingService.deleteFinding(req.params.id);
  res.status(204).send();
});

export default router;
