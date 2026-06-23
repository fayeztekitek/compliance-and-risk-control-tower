import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { getJobStatuses, queues } from "../services/queue.service.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN"]));

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const statuses = await getJobStatuses();
    res.json({ data: statuses });
  } catch (err) { next(err); }
});

router.post("/:name/retry-all", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queue = (queues as any)[req.params.name];
    if (!queue) return res.status(404).json({ error: `Queue '${req.params.name}' not found` });
    const failed = await queue.getFailed();
    const retried = await Promise.allSettled(failed.map((j: any) => j.retry()));
    res.json({ data: { retried: retried.filter(r => r.status === "fulfilled").length } });
  } catch (err) { next(err); }
});

router.post("/:name/clean", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const queue = (queues as any)[req.params.name];
    if (!queue) return res.status(404).json({ error: `Queue '${req.params.name}' not found` });
    await queue.obliterate({ force: true });
    res.json({ data: { cleaned: true } });
  } catch (err) { next(err); }
});

export default router;
