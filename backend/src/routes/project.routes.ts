import { Router, Request, Response, NextFunction } from "express";
import { projectService } from "../services/project.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { ValidationError } from "../core/errors.js";
import {
  createProjectSchema, updateProjectSchema, submitRtdSchema, projectQuerySchema,
  createRoadmapSchema, updateRoadmapSchema,
  createSaaSAppSchema, updateSaaSAppSchema, privacyAssessmentSchema,
  createAuditSchema, updateAuditSchema, createFindingSchema, createCorrectiveActionSchema, closeCorrectiveActionSchema,
  createCommitteeSchema, updateCommitteeSchema, recordDecisionSchema,
  createContractObligationSchema, verifyObligationSchema,
} from "../validation/project.schema.js";

const router = Router();
router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "PRODUCT_OWNER", "EXECUTIVE_READ_ONLY"]));

function zodHandler(fn: (req: Request) => any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try { const result = await fn(req); res.json({ data: result }); }
    catch (err: any) { if (err.name === "ZodError") return next(new ValidationError("Invalid input", err.flatten().fieldErrors)); next(err); }
  };
}

/**
 * @openapi
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List projects with pagination and search
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
 *         description: Paginated project list
 */
router.get("/projects", async (req, res, next) => {
  try { const q = projectQuerySchema.parse(req.query); res.json(await projectService.listProjects(q)); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid query", err.flatten().fieldErrors) : err); }
});

/** @openapi
 *  /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project by ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project details */
router.get("/projects/:id", zodHandler(r => projectService.getProject(r.params.id)));

/** @openapi
 *  /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Project created */
router.post("/projects", async (req, res, next) => {
  try { const p = createProjectSchema.parse(req.body); const r = await projectService.createProject(p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
/** @openapi
 *  /projects/{id}:
 *   patch:
 *     tags: [Projects]
 *     summary: Update a project
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project updated */
router.patch("/projects/:id", async (req, res, next) => {
  try { const p = updateProjectSchema.parse(req.body); const r = await projectService.updateProject(req.params.id, p); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
/** @openapi
 *  /projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project deleted */
router.delete("/projects/:id", zodHandler(r => projectService.deleteProject(r.params.id)));

/** @openapi
 *  /projects/{id}/rtd:
 *   post:
 *     tags: [Projects]
 *     summary: Submit RTD (Report to Director) with variance calculation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: RTD submitted */
router.post("/projects/:id/rtd", async (req, res, next) => {
  try { const p = submitRtdSchema.parse(req.body); const r = await projectService.submitRtd(req.params.id, p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});

/**
 * @openapi
 * /roadmaps:
 *   get:
 *     tags: [Projects]
 *     summary: List all roadmaps
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roadmap list */
router.get("/roadmaps", zodHandler(_r => projectService.listRoadmaps()));

/** @openapi
 *  /roadmaps:
 *   post:
 *     tags: [Projects]
 *     summary: Create a roadmap
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Roadmap created */
router.post("/roadmaps", async (req, res, next) => {
  try { const p = createRoadmapSchema.parse(req.body); const r = await projectService.createRoadmap(p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
/** @openapi
 *  /roadmaps/{id}:
 *   patch:
 *     tags: [Projects]
 *     summary: Update a roadmap
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roadmap updated */
router.patch("/roadmaps/:id", async (req, res, next) => {
  try { const p = updateRoadmapSchema.parse(req.body); const r = await projectService.updateRoadmap(req.params.id, p); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
/** @openapi
 *  /roadmaps/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a roadmap
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roadmap deleted */
router.delete("/roadmaps/:id", zodHandler(r => projectService.deleteRoadmap(r.params.id)));

/**
 * @openapi
 * /saas-applications:
 *   get:
 *     tags: [Projects]
 *     summary: List SaaS applications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SaaS application list */
router.get("/saas-applications", zodHandler(_r => projectService.listSaaSApps()));

/** @openapi
 *  /saas-applications:
 *   post:
 *     tags: [Projects]
 *     summary: Register a SaaS application
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: SaaS application created */
router.post("/saas-applications", async (req, res, next) => {
  try { const p = createSaaSAppSchema.parse(req.body); const r = await projectService.createSaaSApp(p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
/** @openapi
 *  /saas-applications/{id}:
 *   patch:
 *     tags: [Projects]
 *     summary: Update a SaaS application lifecycle
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SaaS application updated */
router.patch("/saas-applications/:id", async (req, res, next) => {
  try { const p = updateSaaSAppSchema.parse(req.body); const r = await projectService.updateSaaSApp(req.params.id, p); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
/** @openapi
 *  /saas-applications/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a SaaS application
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: SaaS application deleted */
router.delete("/saas-applications/:id", zodHandler(r => projectService.deleteSaaSApp(r.params.id)));

/** @openapi
 *  /saas-applications/{id}/privacy-assessment:
 *   post:
 *     tags: [Projects]
 *     summary: Submit privacy assessment for a SaaS app
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Privacy assessment submitted */
router.post("/saas-applications/:id/privacy-assessment", async (req, res, next) => {
  try { const p = privacyAssessmentSchema.parse(req.body); const r = await projectService.submitPrivacyAssessment(req.params.id, p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});

/** @openapi
 *  /saas-applications/{id}/readiness:
 *   post:
 *     tags: [Projects]
 *     summary: Calculate readiness score for a SaaS app
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Readiness score */
router.post("/saas-applications/:id/readiness", zodHandler(r => projectService.getReadinessScore(r.params.id)));

/**
 * @openapi
 * /audits:
 *   get:
 *     tags: [Projects]
 *     summary: List audits
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit list */
router.get("/audits", zodHandler(_r => projectService.listAudits()));

/** @openapi
 *  /audits:
 *   post:
 *     tags: [Projects]
 *     summary: Create an audit
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Audit created */
router.post("/audits", async (req, res, next) => {
  try { const p = createAuditSchema.parse(req.body); const r = await projectService.createAudit(p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
/** @openapi
 *  /audits/{id}:
 *   patch:
 *     tags: [Projects]
 *     summary: Update an audit
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit updated */
router.patch("/audits/:id", async (req, res, next) => {
  try { const p = updateAuditSchema.parse(req.body); const r = await projectService.updateAudit(req.params.id, p); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
/** @openapi
 *  /audits/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete an audit
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit deleted */
router.delete("/audits/:id", zodHandler(r => projectService.deleteAudit(r.params.id)));

/**
 * @openapi
 * /audits/{id}/findings:
 *   get:
 *     tags: [Projects]
 *     summary: List findings for an audit
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Finding list */
router.get("/audits/:id/findings", zodHandler(r => projectService.listFindings(r.params.id)));

/** @openapi
 *  /audits/{id}/findings:
 *   post:
 *     tags: [Projects]
 *     summary: Add a finding to an audit
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Finding created */
router.post("/audits/:id/findings", async (req, res, next) => {
  try { const p = createFindingSchema.parse(req.body); const r = await projectService.createFinding(req.params.id, p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
/** @openapi
 *  /audits/findings/{id}/actions:
 *   get:
 *     tags: [Projects]
 *     summary: List corrective actions for a finding
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Corrective actions list */
router.get("/audits/findings/:id/actions", zodHandler(r => projectService.listCorrectiveActions(r.params.id)));

/** @openapi
 *  /audits/findings/{id}/actions:
 *   post:
 *     tags: [Projects]
 *     summary: Create a corrective action for a finding
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Corrective action created */
router.post("/audits/findings/:id/actions", async (req, res, next) => {
  try { const p = createCorrectiveActionSchema.parse(req.body); const r = await projectService.createCorrectiveAction(req.params.id, p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});

/** @openapi
 *  /audits/actions/{id}/close:
 *   patch:
 *     tags: [Projects]
 *     summary: Close a corrective action with evidence
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Corrective action closed */
router.patch("/audits/actions/:id/close", async (req, res, next) => {
  try { const p = closeCorrectiveActionSchema.parse(req.body); const r = await projectService.closeCorrectiveAction(req.params.id, p.evidenceDescription); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});

/**
 * @openapi
 * /committees:
 *   get:
 *     tags: [Projects]
 *     summary: List committees
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Committee list */
router.get("/committees", zodHandler(_r => projectService.listCommittees({ page: 1, limit: 100 })));

/** @openapi
 *  /committees:
 *   post:
 *     tags: [Projects]
 *     summary: Create a committee
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Committee created */
router.post("/committees", async (req, res, next) => {
  try { const p = createCommitteeSchema.parse(req.body); const r = await projectService.createCommittee(p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
/** @openapi
 *  /committees/{id}:
 *   patch:
 *     tags: [Projects]
 *     summary: Update a committee
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Committee updated */
router.patch("/committees/:id", async (req, res, next) => {
  try { const p = updateCommitteeSchema.parse(req.body); const r = await projectService.updateCommittee(req.params.id, p); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
/** @openapi
 *  /committees/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a committee
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Committee deleted */
router.delete("/committees/:id", zodHandler(r => projectService.deleteCommittee(r.params.id)));

/**
 * @openapi
 * /committees/{id}/decisions:
 *   get:
 *     tags: [Projects]
 *     summary: List decisions for a committee
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Decision list */
router.get("/committees/:id/decisions", zodHandler(r => projectService.listDecisions(r.params.id)));

/** @openapi
 *  /committees/{id}/decisions:
 *   post:
 *     tags: [Projects]
 *     summary: Record a committee decision
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Decision recorded */
router.post("/committees/:id/decisions", async (req, res, next) => {
  try { const p = recordDecisionSchema.parse(req.body); const r = await projectService.recordDecision(req.params.id, p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});

/**
 * @openapi
 * /contractual-obligations:
 *   get:
 *     tags: [Projects]
 *     summary: List contractual obligations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Obligation list */
router.get("/contractual-obligations", zodHandler(_r => projectService.listObligations()));

/** @openapi
 *  /contractual-obligations:
 *   post:
 *     tags: [Projects]
 *     summary: Create a contractual obligation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Obligation created */
router.post("/contractual-obligations", async (req, res, next) => {
  try { const p = createContractObligationSchema.parse(req.body); const r = await projectService.createObligation(p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});

/** @openapi
 *  /contractual-obligations/{id}/verify:
 *   post:
 *     tags: [Projects]
 *     summary: Verify a contractual obligation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Obligation verified */
router.post("/contractual-obligations/:id/verify", async (req, res, next) => {
  try { const p = verifyObligationSchema.parse(req.body); const r = await projectService.verifyObligation(req.params.id, p); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});

// ========== Milestones ==========
router.get("/projects/:id/milestones", zodHandler(r => projectService.listMilestones(r.params.id)));
router.post("/projects/:id/milestones", zodHandler(r => projectService.createMilestone(r.params.id, r.body)));
router.patch("/milestones/:id", zodHandler(r => projectService.updateMilestone(r.params.id, r.body)));
router.delete("/milestones/:id", zodHandler(r => projectService.deleteMilestone(r.params.id)));

// ========== Risks ==========
router.get("/projects/:id/risks", zodHandler(r => projectService.listRisks(r.params.id)));
router.post("/projects/:id/risks", zodHandler(r => projectService.createRisk(r.params.id, r.body)));
router.patch("/risks/:id", zodHandler(r => projectService.updateRisk(r.params.id, r.body)));
router.delete("/risks/:id", zodHandler(r => projectService.deleteRisk(r.params.id)));

// ========== Status Snapshots ==========
router.get("/projects/:id/status-snapshots", zodHandler(r => projectService.listStatusSnapshots(r.params.id)));
router.post("/projects/:id/status-snapshots", zodHandler(r => projectService.createStatusSnapshot(r.params.id)));

export default router;
