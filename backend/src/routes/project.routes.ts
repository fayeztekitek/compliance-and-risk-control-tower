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

// ========== Projects ==========
router.get("/projects", async (req, res, next) => {
  try { const q = projectQuerySchema.parse(req.query); res.json(await projectService.listProjects(q)); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid query", err.flatten().fieldErrors) : err); }
});

router.get("/projects/:id", zodHandler(r => projectService.getProject(r.params.id)));
router.post("/projects", async (req, res, next) => {
  try { const p = createProjectSchema.parse(req.body); const r = await projectService.createProject(p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.patch("/projects/:id", async (req, res, next) => {
  try { const p = updateProjectSchema.parse(req.body); const r = await projectService.updateProject(req.params.id, p); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.delete("/projects/:id", zodHandler(r => projectService.deleteProject(r.params.id)));
router.post("/projects/:id/rtd", async (req, res, next) => {
  try { const p = submitRtdSchema.parse(req.body); const r = await projectService.submitRtd(req.params.id, p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});

// ========== Roadmaps ==========
router.get("/roadmaps", zodHandler(_r => projectService.listRoadmaps()));
router.post("/roadmaps", async (req, res, next) => {
  try { const p = createRoadmapSchema.parse(req.body); const r = await projectService.createRoadmap(p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.patch("/roadmaps/:id", async (req, res, next) => {
  try { const p = updateRoadmapSchema.parse(req.body); const r = await projectService.updateRoadmap(req.params.id, p); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.delete("/roadmaps/:id", zodHandler(r => projectService.deleteRoadmap(r.params.id)));

// ========== SaaS Applications ==========
router.get("/saas-applications", zodHandler(_r => projectService.listSaaSApps()));
router.post("/saas-applications", async (req, res, next) => {
  try { const p = createSaaSAppSchema.parse(req.body); const r = await projectService.createSaaSApp(p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.patch("/saas-applications/:id", async (req, res, next) => {
  try { const p = updateSaaSAppSchema.parse(req.body); const r = await projectService.updateSaaSApp(req.params.id, p); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.delete("/saas-applications/:id", zodHandler(r => projectService.deleteSaaSApp(r.params.id)));
router.post("/saas-applications/:id/privacy-assessment", async (req, res, next) => {
  try { const p = privacyAssessmentSchema.parse(req.body); const r = await projectService.submitPrivacyAssessment(req.params.id, p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.post("/saas-applications/:id/readiness", zodHandler(r => projectService.getReadinessScore(r.params.id)));

// ========== Audits ==========
router.get("/audits", zodHandler(_r => projectService.listAudits()));
router.post("/audits", async (req, res, next) => {
  try { const p = createAuditSchema.parse(req.body); const r = await projectService.createAudit(p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.patch("/audits/:id", async (req, res, next) => {
  try { const p = updateAuditSchema.parse(req.body); const r = await projectService.updateAudit(req.params.id, p); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.delete("/audits/:id", zodHandler(r => projectService.deleteAudit(r.params.id)));

router.get("/audits/:id/findings", zodHandler(r => projectService.listFindings(r.params.id)));
router.post("/audits/:id/findings", async (req, res, next) => {
  try { const p = createFindingSchema.parse(req.body); const r = await projectService.createFinding(req.params.id, p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.get("/audits/findings/:id/actions", zodHandler(r => projectService.listCorrectiveActions(r.params.id)));
router.post("/audits/findings/:id/actions", async (req, res, next) => {
  try { const p = createCorrectiveActionSchema.parse(req.body); const r = await projectService.createCorrectiveAction(req.params.id, p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.patch("/audits/actions/:id/close", async (req, res, next) => {
  try { const p = closeCorrectiveActionSchema.parse(req.body); const r = await projectService.closeCorrectiveAction(req.params.id, p.evidenceDescription); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});

// ========== Committees ==========
router.get("/committees", zodHandler(_r => projectService.listCommittees()));
router.post("/committees", async (req, res, next) => {
  try { const p = createCommitteeSchema.parse(req.body); const r = await projectService.createCommittee(p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.patch("/committees/:id", async (req, res, next) => {
  try { const p = updateCommitteeSchema.parse(req.body); const r = await projectService.updateCommittee(req.params.id, p); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.delete("/committees/:id", zodHandler(r => projectService.deleteCommittee(r.params.id)));
router.get("/committees/:id/decisions", zodHandler(r => projectService.listDecisions(r.params.id)));
router.post("/committees/:id/decisions", async (req, res, next) => {
  try { const p = recordDecisionSchema.parse(req.body); const r = await projectService.recordDecision(req.params.id, p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});

// ========== Contractual Obligations ==========
router.get("/contractual-obligations", zodHandler(_r => projectService.listObligations()));
router.post("/contractual-obligations", async (req, res, next) => {
  try { const p = createContractObligationSchema.parse(req.body); const r = await projectService.createObligation(p); res.status(201).json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});
router.post("/contractual-obligations/:id/verify", async (req, res, next) => {
  try { const p = verifyObligationSchema.parse(req.body); const r = await projectService.verifyObligation(req.params.id, p); res.json({ data: r }); }
  catch (err: any) { next(err.name === "ZodError" ? new ValidationError("Invalid input", err.flatten().fieldErrors) : err); }
});

export default router;
