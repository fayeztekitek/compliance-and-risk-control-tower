import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { kpiRegistryService } from "../services/kpi-registry.service.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "EXECUTIVE_READ_ONLY"]));

router.get("/kpi-definitions", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const domain = req.query.domain as string | undefined;
  const data = await kpiRegistryService.list(domain);
  res.json({ data });
}));

router.get("/kpi-definitions/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const data = await kpiRegistryService.getById(req.params.id);
  if (!data) return res.status(404).json({ error: "KPI definition not found" });
  res.json({ data });
}));

router.post("/kpi-definitions", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const data = await kpiRegistryService.create(req.body);
  res.status(201).json({ data });
}));

router.patch("/kpi-definitions/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const data = await kpiRegistryService.update(req.params.id, req.body);
  if (!data) return res.status(404).json({ error: "KPI definition not found" });
  res.json({ data });
}));

router.delete("/kpi-definitions/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  await kpiRegistryService.delete(req.params.id);
  res.json({ success: true });
}));

router.get("/kpi-definitions/:id/evaluate", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const kpi = await kpiRegistryService.getById(req.params.id);
  if (!kpi) return res.status(404).json({ error: "KPI definition not found" });
  const value = parseFloat(req.query.value as string) || 0;
  const rag = await kpiRegistryService.evaluateRag(kpi.name, value);
  res.json({ data: { name: kpi.name, value, rag } });
}));

export default router;
