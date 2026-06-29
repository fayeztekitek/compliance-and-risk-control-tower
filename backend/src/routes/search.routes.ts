import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { globalSearch } from "../services/search.service.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();

router.use(authMiddleware);

router.get("/search", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const q = (req.query.q as string || "").trim();
  if (!q || q.length < 2) {
    res.json({ data: [] });
    return;
  }
  const limit = Math.min(parseInt(req.query.limit as string) || 8, 20);
  const results = await globalSearch(q, limit);
  res.json({ data: results });
}));

export default router;
