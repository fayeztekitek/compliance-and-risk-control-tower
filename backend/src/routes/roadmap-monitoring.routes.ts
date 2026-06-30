import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { getEnrichedRoadmaps, getRoadmapDetail } from "../services/roadmap-monitoring.service.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "EXECUTIVE_READ_ONLY"]));

router.get("/roadmaps/enriched", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const data = await getEnrichedRoadmaps();
  res.json({ data });
}));

router.get("/roadmaps/:id/detail", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const data = await getRoadmapDetail(req.params.id);
  if (!data) return res.status(404).json({ error: "Roadmap not found" });
  res.json({ data });
}));

export default router;
