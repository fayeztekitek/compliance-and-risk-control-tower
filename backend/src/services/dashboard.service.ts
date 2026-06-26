import { kpiService } from "./kpi.service.js";
import { nexusRepo } from "../repositories/nexus.repo.js";

export const dashboardService = {
  async getExecutiveDashboard() {
    const [snapshot, kpis, kris, trends, alerts, orgPostures] = await Promise.all([
      kpiService.getLatestSnapshot(),
      kpiService.get16Kpis(),
      kpiService.get4Kris(),
      kpiService.getMonthlyTrends(12),
      nexusRepo.listAlerts(10),
      nexusRepo.listAllCompliancePostures(),
    ]);

    return {
      snapshot,
      kpis,
      kris,
      trends,
      recentAlerts: alerts,
      orgPostures,
      lastUpdated: new Date().toISOString(),
    };
  },
};
