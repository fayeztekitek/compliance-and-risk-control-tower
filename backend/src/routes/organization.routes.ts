import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { organizationService } from "../services/organization.service.js";

const router = Router();

router.get(
  "/api/organizations",
  authMiddleware,
  rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"]),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await organizationService.listOrganizations();
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

router.get(
  "/api/organizations/:organizationId",
  authMiddleware,
  rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await organizationService.getOrganization(req.params.organizationId);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

router.put(
  "/api/organizations/:organizationId",
  authMiddleware,
  rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await organizationService.upsertOrganization({
        organizationId: req.params.organizationId,
        organizationName: req.body.organizationName,
        parentOrganizationId: req.body.parentOrganizationId,
        description: req.body.description,
        complianceOfficer: req.body.complianceOfficer,
        syncBatchId: req.body.syncBatchId,
      });
      res.status(201).json({ data: result });
    } catch (err) { next(err); }
  }
);

router.patch(
  "/api/organizations/:organizationId",
  authMiddleware,
  rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await organizationService.updateOrganization(req.params.organizationId, req.body);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

router.get(
  "/api/organizations/:organizationId/compliance-posture",
  authMiddleware,
  rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await organizationService.getCompliancePosture(req.params.organizationId);
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

router.post(
  "/api/organizations/:organizationId/recalculate-posture",
  authMiddleware,
  rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER"]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await organizationService.recalculateCompliancePosture(req.params.organizationId);
      res.json({ data: result, message: "Compliance posture recalculated" });
    } catch (err) { next(err); }
  }
);

router.get(
  "/api/organizations/compliance-postures",
  authMiddleware,
  rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "EXECUTIVE_READ_ONLY"]),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await organizationService.listAllCompliancePostures();
      res.json({ data: result });
    } catch (err) { next(err); }
  }
);

export default router;
