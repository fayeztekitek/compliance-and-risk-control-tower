import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { scanReportService } from "../services/scanReport.service.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"]));

router.get("/", async (req: Request, res: Response) => {
  const { page = "1", limit = "20", applicationId, scannerSource, fromDate, toDate } = req.query;
  const result = await scanReportService.listScanReports({
    page: parseInt(page as string, 10),
    limit: Math.min(parseInt(limit as string, 10), 100),
    applicationId: applicationId as string,
    scannerSource: scannerSource as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
  });
  res.json(result);
});

router.get("/latest/:applicationId", async (req: Request, res: Response) => {
  const { scannerSource } = req.query;
  const report = await scanReportService.getLatestByApp(req.params.applicationId, scannerSource as string);
  res.json(report);
});

router.get("/:id", async (req: Request, res: Response) => {
  const report = await scanReportService.getScanReport(req.params.id);
  res.json(report);
});

router.post("/", async (req: Request, res: Response) => {
  const report = await scanReportService.createScanReport(req.body);
  res.status(201).json(report);
});

router.patch("/:id", async (req: Request, res: Response) => {
  const report = await scanReportService.updateScanReport(req.params.id, req.body);
  res.json(report);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await scanReportService.deleteScanReport(req.params.id);
  res.status(204).send();
});

export default router;
