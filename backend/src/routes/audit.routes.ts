import { Router, Request, Response, NextFunction } from "express";
import { projectService } from "../services/project.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";
import {
  createAuditSchema, updateAuditSchema, createFindingSchema, createCorrectiveActionSchema,
} from "../validation/project.schema.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "AUDITOR"]));

function zodHandler(fn: (req: Request) => any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try { const result = await fn(req); res.json({ data: result }); }
    catch (err: any) { if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors)); next(err); }
  };
}

/**
 * @openapi
 * /audits:
 *   get:
 *     tags: [Audits]
 *     summary: List all audits (paginated)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated audit list
 */
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.listAudits();
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /audits/{id}:
 *   get:
 *     tags: [Audits]
 *     summary: Get audit by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Audit details
 */
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.getAudit(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /audits:
 *   post:
 *     tags: [Audits]
 *     summary: Create a new audit
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
 *         description: Audit created
 */
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createAuditSchema.parse(req.body);
    const result = await projectService.createAudit(parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /audits/{id}:
 *   put:
 *     tags: [Audits]
 *     summary: Update an audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Audit updated
 */
router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = updateAuditSchema.parse(req.body);
    const result = await projectService.updateAudit(req.params.id, parsed);
    res.json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /audits/{id}:
 *   delete:
 *     tags: [Audits]
 *     summary: Delete an audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Audit deleted
 */
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.deleteAudit(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /audits/{id}/findings:
 *   get:
 *     tags: [Audits]
 *     summary: List findings for an audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Finding list
 */
router.get("/:id/findings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.listFindings(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /audits/{id}/findings:
 *   post:
 *     tags: [Audits]
 *     summary: Add a finding to an audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Finding created
 */
router.post("/:id/findings", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createFindingSchema.parse(req.body);
    const result = await projectService.createFinding(req.params.id, parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

/**
 * @openapi
 * /audits/findings/{findingId}:
 *   put:
 *     tags: [Audits]
 *     summary: Update a finding
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: findingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Finding updated
 */
router.put("/findings/:findingId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.updateFinding(req.params.findingId, req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /audits/{id}/capa:
 *   get:
 *     tags: [Audits]
 *     summary: List CAPA items for an audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: CAPA item list
 */
router.get("/:id/capa", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await projectService.listCapa(req.params.id);
    res.json({ data: result });
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /audits/{id}/capa:
 *   post:
 *     tags: [Audits]
 *     summary: Create a CAPA item for an audit
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: CAPA item created
 */
router.post("/:id/capa", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createCorrectiveActionSchema.parse(req.body);
    const result = await projectService.createCapa(req.params.id, parsed);
    res.status(201).json({ data: result });
  } catch (err: any) {
    if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors));
    next(err);
  }
});

export default router;
