import { kpiService } from "./kpi.service.js";
import { nexusRepo } from "../repositories/nexus.repo.js";

export const dashboardService = {
  async getExecutiveDashboard() {
    const [kpis, kris, heatmap, trends, alerts, snapshot] = await Promise.all([
      kpiService.get16Kpis(),
      kpiService.get4Kris(),
      kpiService.get5x5Heatmap(),
      kpiService.getMonthlyTrends(12),
      nexusRepo.listAlerts(10),
      nexusRepo.getLatestKpiSnapshot(),
    ]);

    return {
      snapshot,
      kpis,
      kris,
      heatmap,
      trends,
      recentAlerts: alerts,
      lastUpdated: new Date().toISOString(),
    };
  },
};
