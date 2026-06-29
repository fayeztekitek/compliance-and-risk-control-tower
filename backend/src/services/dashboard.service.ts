import { kpiService } from "./kpi.service.js";
import { nexusRepo } from "../repositories/nexus.repo.js";
import { DashboardFilters } from "../types/dashboard.js";

export const dashboardService = {
  async getExecutiveDashboard(filters?: DashboardFilters) {
    const hasFilters = filters && Object.values(filters).some(v => v !== undefined);

    if (hasFilters) {
      const orgs = await nexusRepo.listOrganizations();
      const filteredOrgIds = filters!.organizationIds && filters!.organizationIds.length > 0
        ? orgs.filter(o => filters!.organizationIds!.includes(o.organizationId)).map(o => o.organizationId)
        : undefined;

      const appFilters: any = {};
      if (filteredOrgIds) appFilters.organizationIds = filteredOrgIds;
      if (filters!.applicationIds) appFilters.applicationIds = filters!.applicationIds;
      if (filters!.severities) appFilters.severities = filters!.severities;
      if (filters!.statuses) appFilters.statuses = filters!.statuses;
      if (filters!.scanStatus) appFilters.scanStatus = filters!.scanStatus;
      if (filters!.riskLevel) appFilters.riskLevel = filters!.riskLevel;
      if (filters!.searchQuery) appFilters.searchQuery = filters!.searchQuery;
      if (filters!.scanReportScope) appFilters.scanReportScope = filters!.scanReportScope;

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
    }

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
