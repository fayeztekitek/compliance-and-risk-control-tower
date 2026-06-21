import { Router, Request, Response, NextFunction } from "express";
import { exportService } from "../services/export.service.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { rbacMiddleware } from "../middleware/rbac.middleware.js";

const router = Router();

router.use(authMiddleware);
router.use(rbacMiddleware(["ADMIN", "COMPLIANCE_OFFICER", "RISK_MANAGER", "SECURITY_MANAGER", "AUDITOR", "EXECUTIVE_READ_ONLY"]));

router.get("/csv", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dataset = (req.query.dataset as string) || "kpis";
    const csv = await exportService.exportCsv(dataset, req.query);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${dataset}-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
});

router.get("/pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dataset = (req.query.dataset as string) || "kpis";
    const pdf = await exportService.exportPdf(dataset);
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `inline; filename="${dataset}-${Date.now()}.html"`);
    res.send(pdf.toString());
  } catch (err) { next(err); }
});

export default router;
