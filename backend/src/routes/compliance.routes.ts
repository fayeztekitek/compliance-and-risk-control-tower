import { Router, Request, Response, NextFunction } from "express";
import { complianceService } from "../services/compliance.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR"]));

router.get("/frameworks", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await complianceService.getFrameworkSummaries();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/regulatory-mappings", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await complianceService.getRegulatoryMappings();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/sla-breaches", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await complianceService.getSlaBreaches();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.get("/classifications", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      framework: req.query.framework as string | undefined,
      findingId: req.query.findingId as string | undefined,
      status: req.query.status as string | undefined,
    };
    const result = await complianceService.getClassifications(filters);
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.post("/auto-classify/:findingId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await complianceService.autoClassify(req.params.findingId);
    res.status(201).json({ data: result });
  } catch (err) { next(err); }
});

router.post("/detect-breaches", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await complianceService.detectBreaches();
    res.json({ data: result });
  } catch (err) { next(err); }
});

router.patch("/classifications/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await complianceService.updateClassification(req.params.id, req.body);
    res.json({ data: result });
  } catch (err) { next(err); }
});

export default router;
