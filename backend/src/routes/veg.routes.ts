import { Router, Request, Response, NextFunction } from "express";
import { vegService } from "../services/veg.service.js";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";
import { vegEventBus } from "../services/veg-events.service.js";
import {
  createVegSchema, updateVegSchema, listVegQuerySchema,
  departmentSignoffSchema, bidDecisionSchema, goNogoSchema,
  batchSyncSchema, createOpportunitySchema, createContractSchema,
} from "../validation/veg.schema.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"]));

/**
 * @openapi
 * /veg:
 *   get:
 *     tags: [VEG]
 *     summary: List VEG requests with pagination and search
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated VEG request list
 */
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

/**
 * @openapi
 * /veg/{id}:
 *   get:
 *     tags: [VEG]
 *     summary: Get VEG request by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: VEG request details
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await vegService.getById(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /veg:
 *   post:
 *     tags: [VEG]
 *     summary: Create a new VEG request
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: VEG request created
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createVegSchema.parse(req.body);
    const result = await vegService.create(parsed);
    vegEventBus.emitVegEvent({ type: "veg:request:created", requestId: result.id, userId: (req as any).user?.id, timestamp: new Date().toISOString() });
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /veg/{id}:
 *   patch:
 *     tags: [VEG]
 *     summary: Update a VEG request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: VEG request updated
 */
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateVegSchema.parse(req.body);
    const result = await vegService.update(req.params.id, parsed);
    if (parsed.status === "SUBMITTED") {
      vegEventBus.emitVegEvent({ type: "veg:request:submitted", requestId: req.params.id, userId: (req as any).user?.id, timestamp: new Date().toISOString() });
    }
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /veg/{id}:
 *   delete:
 *     tags: [VEG]
 *     summary: Soft-delete a VEG request
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: VEG request deleted
 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await vegService.delete(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /veg/{id}/signoff/{department}:
 *   patch:
 *     tags: [VEG]
 *     summary: Update department sign-off status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: department
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sign-off updated
 */
router.patch("/:id/signoff/:department", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = departmentSignoffSchema.parse({ department: req.params.department, ...req.body });
    const result = await vegService.updateDepartmentSignoff(req.params.id, parsed.department, parsed.state);
    vegEventBus.emitVegEvent({
      type: "veg:request:signed-off", requestId: req.params.id, userId: (req as any).user?.id,
      timestamp: new Date().toISOString(), metadata: { department: parsed.department, state: parsed.state },
    });
    if (result?.status === "APPROVED") {
      vegEventBus.emitVegEvent({ type: "veg:request:approved", requestId: req.params.id, userId: (req as any).user?.id, timestamp: new Date().toISOString() });
    }
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /veg/{id}/bid:
 *   patch:
 *     tags: [VEG]
 *     summary: Update bid decision
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bid decision recorded
 */
router.patch("/:id/bid", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = bidDecisionSchema.parse(req.body);
    const result = await vegService.updateBidDecision(req.params.id, parsed.decision);
    vegEventBus.emitVegEvent({ type: "veg:request:bid-decision", requestId: req.params.id, userId: (req as any).user?.id, timestamp: new Date().toISOString(), metadata: { decision: parsed.decision } });
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /veg/{id}/gonogo:
 *   patch:
 *     tags: [VEG]
 *     summary: Update Go/No-Go decision
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Go/No-Go decision recorded
 */
router.patch("/:id/gonogo", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = goNogoSchema.parse(req.body);
    const result = await vegService.updateGoNoGo(req.params.id, parsed.decision);
    vegEventBus.emitVegEvent({ type: "veg:request:go-nogo", requestId: req.params.id, userId: (req as any).user?.id, timestamp: new Date().toISOString(), metadata: { decision: parsed.decision } });
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /veg/batch-sync:
 *   post:
 *     tags: [VEG]
 *     summary: Batch sync VEG requests from CRM
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync results
 */
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

/**
 * @openapi
 * /veg/{id}/opportunities:
 *   post:
 *     tags: [VEG]
 *     summary: Create an opportunity under a VEG
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Opportunity created
 */
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

/**
 * @openapi
 * /veg/opportunities/{opportunityId}/contracts:
 *   post:
 *     tags: [VEG]
 *     summary: Create a contract under an opportunity
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Contract created
 */
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
