import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { snapshotService } from "../services/snapshot.service.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "EXECUTIVE_READ_ONLY"]));

router.get("/snapshots", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const roadmapId = req.query.roadmapId as string | undefined;
  const data = await snapshotService.listSnapshots(roadmapId);
  res.json({ data });
}));

router.get("/snapshots/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const data = await snapshotService.getSnapshot(req.params.id);
  res.json({ data });
}));

router.post("/snapshots", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { roadmapId, label } = req.body;
  const data = await snapshotService.createSnapshot(roadmapId, label);
  res.status(201).json({ data });
}));

router.get("/snapshots/compare/:id1/:id2", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const data = await snapshotService.compareSnapshots(req.params.id1, req.params.id2);
  res.json({ data });
}));

export default router;
