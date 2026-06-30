import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { workflowService } from "../services/workflow.service.js";
import { wrapAsync } from "../utils/wrapAsync.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"]));

// Definitions
router.get("/workflow-definitions", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const entityType = req.query.entityType as string | undefined;
  const data = await workflowService.listDefinitions(entityType);
  res.json({ data });
}));

// Instances
router.get("/workflow-instances", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { entityType, status } = req.query as Record<string, string | undefined>;
  const data = await workflowService.listInstances(entityType, status);
  res.json({ data });
}));

router.get("/workflow-instances/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const data = await workflowService.getInstance(req.params.id);
  if (!data) return res.status(404).json({ error: "Workflow instance not found" });
  res.json({ data });
}));

router.post("/workflow-instances", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { definitionId, entityId, entityType, assignee, dueDate, metadata } = req.body;
  const data = await workflowService.startInstance(definitionId, entityId, entityType, assignee, dueDate, metadata);
  res.status(201).json({ data });
}));

router.post("/workflow-instances/:id/transition", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { toState, comment } = req.body;
  const data = await workflowService.transition(req.params.id, toState, (req as any).user?.email || req.user?.id, comment);
  res.json({ data });
}));

router.patch("/workflow-instances/:id", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { assignee, dueDate, metadata } = req.body;
  const data = await workflowService.updateInstance(req.params.id, { assignee, dueDate, metadata });
  res.json({ data });
}));

router.patch("/workflow-instances/:id/status", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const data = await workflowService.setStatus(req.params.id, status);
  res.json({ data });
}));

// Audit log
router.get("/workflow-instances/:id/audit", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const data = await workflowService.getAuditLog(req.params.id);
  res.json({ data });
}));

// Available transitions
router.get("/workflow-definitions/:id/transitions/:state", wrapAsync(async (req: AuthenticatedRequest, res: Response) => {
  const data = await workflowService.getAvailableTransitions(req.params.id, req.params.state);
  res.json({ data });
}));

export default router;
