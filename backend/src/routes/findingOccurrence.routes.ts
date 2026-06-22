import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { findingOccurrenceService } from "../services/findingOccurrence.service.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"]));

router.get("/", async (req: Request, res: Response) => {
  const { page = "1", limit = "20", findingId, componentId, status } = req.query;
  const result = await findingOccurrenceService.listOccurrences({
    page: parseInt(page as string, 10),
    limit: Math.min(parseInt(limit as string, 10), 100),
    findingId: findingId as string,
    componentId: componentId as string,
    status: status as string,
  });
  res.json(result);
});

router.get("/distinct-count", async (req: Request, res: Response) => {
  const { applicationId } = req.query;
  const count = await findingOccurrenceService.getDistinctCount(applicationId as string);
  res.json({ distinctFindings: count });
});

router.get("/total-occurrences", async (req: Request, res: Response) => {
  const { applicationId } = req.query;
  const count = await findingOccurrenceService.getTotalOccurrences(applicationId as string);
  res.json({ totalOccurrences: count });
});

router.get("/:id", async (req: Request, res: Response) => {
  const occurrence = await findingOccurrenceService.getOccurrence(req.params.id);
  res.json(occurrence);
});

router.post("/", async (req: Request, res: Response) => {
  const occurrence = await findingOccurrenceService.createOccurrence(req.body);
  res.status(201).json(occurrence);
});

router.patch("/:id", async (req: Request, res: Response) => {
  const occurrence = await findingOccurrenceService.updateOccurrence(req.params.id, req.body);
  res.json(occurrence);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await findingOccurrenceService.deleteOccurrence(req.params.id);
  res.status(204).send();
});

export default router;
