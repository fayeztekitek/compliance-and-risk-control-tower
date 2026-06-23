import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { archiveService } from "../services/archive.service.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN"]));

router.get("/status", (_req: Request, res: Response) => {
  res.json({ data: archiveService.getStatus() });
});

router.post("/trigger", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const months = req.body?.months ?? 12;
    const result = await archiveService.archiveFindingsOlderThan(months);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
