import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { findingComponentService } from "../services/findingComponent.service.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"]));

router.get("/", async (req: Request, res: Response) => {
  const { page = "1", limit = "20", search } = req.query;
  const result = await findingComponentService.listComponents({
    page: parseInt(page as string, 10),
    limit: Math.min(parseInt(limit as string, 10), 100),
    search: search as string,
  });
  res.json(result);
});

router.get("/:id", async (req: Request, res: Response) => {
  const component = await findingComponentService.getComponent(req.params.id);
  res.json(component);
});

router.post("/", async (req: Request, res: Response) => {
  const component = await findingComponentService.createComponent(req.body);
  res.status(201).json(component);
});

router.patch("/:id", async (req: Request, res: Response) => {
  const component = await findingComponentService.updateComponent(req.params.id, req.body);
  res.json(component);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await findingComponentService.deleteComponent(req.params.id);
  res.status(204).send();
});

export default router;
