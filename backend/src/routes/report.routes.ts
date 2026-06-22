import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";
import { scanReportService } from "../services/scanReport.service.js";
import { reportComparisonService } from "../services/reportComparison.service.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"]));

router.get("/:applicationId", async (req: Request, res: Response) => {
  const { page = "1", limit = "20", scannerSource, fromDate, toDate } = req.query;
  const result = await scanReportService.listScanReports({
    page: parseInt(page as string, 10),
    limit: Math.min(parseInt(limit as string, 10), 100),
    applicationId: req.params.applicationId,
    scannerSource: scannerSource as string,
    fromDate: fromDate as string,
    toDate: toDate as string,
  });
  res.json(result);
});

router.get("/:applicationId/latest", async (req: Request, res: Response) => {
  const { scannerSource } = req.query;
  const report = await scanReportService.getLatestByApp(req.params.applicationId, scannerSource as string);
  res.json(report);
});

router.get("/:applicationId/compare", async (req: Request, res: Response) => {
  const { latest: latestId, previous: previousId } = req.query;
  const applicationId = req.params.applicationId;

  if (latestId && previousId) {
    const result = await reportComparisonService.compareReports(latestId as string, previousId as string);
    res.json(result);
  } else {
    const result = await reportComparisonService.getLatestComparison(applicationId);
    res.json(result);
  }
});

export default router;
