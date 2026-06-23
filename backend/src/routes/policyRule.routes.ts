import { Router, Request, Response, NextFunction } from "express";
import { policyRuleService } from "../services/policyRule.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";
import { z } from "zod";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR"]));

const createSchema = z.object({
  policyId: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  threatLevel: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  category: z.string().max(100).optional(),
  description: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  threatLevel: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
  category: z.string().max(100).optional(),
  description: z.string().optional(),
});

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = { threatLevel: req.query.threatLevel as string | undefined, category: req.query.category as string | undefined };
    const result = await policyRuleService.list(filters);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await policyRuleService.getById(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createSchema.parse(req.body);
    const result = await policyRuleService.create(parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateSchema.parse(req.body);
    const result = await policyRuleService.update(req.params.id, parsed);
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await policyRuleService.delete(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
