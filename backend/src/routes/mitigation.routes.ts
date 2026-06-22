import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { mitigationService } from "../services/mitigation.service.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER"]));

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await mitigationService.propose(req.body);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
});

router.get("/overdue", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await mitigationService.getOverdue();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await mitigationService.get(req.params.id);
    if (!result) return res.status(404).json({ error: "Mitigation not found" });
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.patch("/:id/approve", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await mitigationService.approve(req.params.id, (req as any).user?.id || "system");
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.patch("/:id/verify", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { evidence } = req.body;
    if (!evidence) return res.status(400).json({ error: "evidence is required" });
    const result = await mitigationService.verify(req.params.id, evidence);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.patch("/:id/close", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await mitigationService.close(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.patch("/:id/reject", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    const result = await mitigationService.reject(req.params.id, reason);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
