import { Router, Request, Response, NextFunction } from "express";
import { projectService } from "../services/project.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";
import {
  createCommitteeSchema, updateCommitteeSchema, recordDecisionSchema, createContractObligationSchema,
  listCommitteeQuerySchema,
} from "../validation/project.schema.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "EXECUTIVE_READ_ONLY"]));

function zodHandler(fn: (req: Request) => any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try { const result = await fn(req); res.json({ data: result }); }
    catch (err: any) { if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors)); next(err); }
  };
}

/**
 * @openapi
 * /committees:
 *   get:
 *     tags: [Committees]
 *     summary: List all committees
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Committee list
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = listCommitteeQuerySchema.parse(req.query);
    const result = await projectService.listCommittees(query);
    res.json({ data: result.data, total: result.total, page: result.page, limit: result.limit });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid query", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /committees/{id}:
 *   get:
 *     tags: [Committees]
 *     summary: Get committee by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Committee details
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.getCommittee(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /committees:
 *   post:
 *     tags: [Committees]
 *     summary: Create a new committee
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
 *         description: Committee created
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createCommitteeSchema.parse(req.body);
    const result = await projectService.createCommittee(parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /committees/{id}:
 *   put:
 *     tags: [Committees]
 *     summary: Update a committee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Committee updated
 */
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateCommitteeSchema.parse(req.body);
    const result = await projectService.updateCommittee(req.params.id, parsed);
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /committees/{id}:
 *   delete:
 *     tags: [Committees]
 *     summary: Delete a committee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Committee deleted
 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.deleteCommittee(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /committees/{id}/decisions:
 *   get:
 *     tags: [Committees]
 *     summary: List decisions for a committee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Decision list
 */
router.get("/:id/decisions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.listDecisions(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /committees/{id}/decisions:
 *   post:
 *     tags: [Committees]
 *     summary: Add a decision to a committee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Decision created
 */
router.post("/:id/decisions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = recordDecisionSchema.parse(req.body);
    const result = await projectService.recordDecision(req.params.id, parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /committees/{id}/obligations:
 *   get:
 *     tags: [Committees]
 *     summary: List obligations for a committee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Obligation list
 */
router.get("/:id/obligations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.listCommitteeObligations(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /committees/{id}/obligations:
 *   post:
 *     tags: [Committees]
 *     summary: Add an obligation to a committee
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Obligation created
 */
router.post("/:id/obligations", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createContractObligationSchema.parse(req.body);
    const result = await projectService.createCommitteeObligation(req.params.id, parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /committees/obligations/{obligationId}:
 *   put:
 *     tags: [Committees]
 *     summary: Update an obligation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: obligationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Obligation updated
 */
router.put("/obligations/:obligationId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.updateObligation(req.params.obligationId, req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
