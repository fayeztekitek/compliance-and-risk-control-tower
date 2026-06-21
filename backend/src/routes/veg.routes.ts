import { Router, Request, Response, NextFunction } from "express";
import { vegService } from "../services/veg.service.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";
import {
  createVegSchema, updateVegSchema, listVegQuerySchema,
  departmentSignoffSchema, bidDecisionSchema, goNogoSchema,
  batchSyncSchema, createOpportunitySchema, createContractSchema,
} from "../validation/veg.schema.js";

const router = Router();

// All VEG routes require auth + COMPLIANCE_OFFICER level or above
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"]));

// List
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listVegQuerySchema.parse(req.query);
    const result = await vegService.list(query);
    res.json({ data: result.data, total: result.total, page: result.page, limit: result.limit });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid query", err.flatten().fieldErrors));
    next(err);
  }
});

// Get by id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await vegService.getById(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// Create
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createVegSchema.parse(req.body);
    const result = await vegService.create(parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

// Update
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateVegSchema.parse(req.body);
    const result = await vegService.update(req.params.id, parsed);
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

// Delete
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await vegService.delete(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

// Department sign-off
router.patch("/:id/signoff/:department", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = departmentSignoffSchema.parse({ department: req.params.department, ...req.body });
    const result = await vegService.updateDepartmentSignoff(req.params.id, parsed.department, parsed.state);
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

// Bid decision
router.patch("/:id/bid", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = bidDecisionSchema.parse(req.body);
    const result = await vegService.updateBidDecision(req.params.id, parsed.decision);
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

// Go/No-Go decision
router.patch("/:id/gonogo", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = goNogoSchema.parse(req.body);
    const result = await vegService.updateGoNoGo(req.params.id, parsed.decision);
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

// Batch sync (CRM import)
router.post("/batch-sync", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = batchSyncSchema.parse(req.body);
    const results = await vegService.batchSync(parsed.requests);
    res.json({ data: { synced: results.length, requests: results } });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

// Create opportunity (nested under VEG)
router.post("/:id/opportunities", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createOpportunitySchema.parse(req.body);
    const result = await vegService.createOpportunity(req.params.id, parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

// Create contract (nested under opportunity)
router.post("/opportunities/:opportunityId/contracts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createContractSchema.parse(req.body);
    const result = await vegService.createContract(req.params.opportunityId, parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

export default router;
