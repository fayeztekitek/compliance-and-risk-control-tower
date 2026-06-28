import { Router, Request, Response, NextFunction } from "express";
import { dashboardPagesService } from "../services/dashboardPages.service.js";

const router = Router();

const PAGE_HANDLERS: Record<string, () => Promise<any>> = {
  organizations: () => dashboardPagesService.getOrganizationsPage(),
  applications: () => dashboardPagesService.getApplicationsPage(),
  vulnerabilities: () => dashboardPagesService.getVulnerabilitiesPage(),
  reports: () => dashboardPagesService.getReportsPage(),
  "risk-management": () => dashboardPagesService.getRiskManagementPage(),
  "waived-accepted": () => dashboardPagesService.getWaivedAcceptedPage(),
};

router.get("/:page", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const handler = PAGE_HANDLERS[req.params.page];
    if (!handler) {
      res.status(404).json({ error: `Unknown page: ${req.params.page}` });
      return;
    }
    const result = await handler();
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
