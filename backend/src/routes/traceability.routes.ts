import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { traceabilityService } from "../services/traceability.service.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"]));

router.get("/trace/:type/:id/related", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const items = await traceabilityService.getRelated(req.params.type, req.params.id);
  res.json({ data: items });
}));

router.post("/trace/links", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { sourceType, sourceId, targetType, targetId, relationshipType, label } = req.body;
  await traceabilityService.addLink(sourceType, sourceId, targetType, targetId, relationshipType, label);
  res.status(201).json({ success: true });
}));

router.delete("/trace/links/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  await traceabilityService.removeLink(req.params.id);
  res.json({ success: true });
}));

router.get("/trace/entity-types", wrapAsync(async (_req: AuthenticatedRequest, res: Response) => {
  const types = await traceabilityService.listEntityTypes();
  res.json({ data: types });
}));

export default router;
