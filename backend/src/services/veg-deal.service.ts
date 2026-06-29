import { vegDealRepo, VegDealFilters, VegDealRow } from "../repositories/veg-deal.repo.js";
import { NotFoundError } from "../core/errors.js";

export const vegDealService = {
  async list(filters: VegDealFilters) {
    return vegDealRepo.list(filters);
  },

  async getById(id: string) {
    const deal = await vegDealRepo.getById(id);
    if (!deal) throw new NotFoundError("VEG deal", id);
    return deal;
  },

  async getByVegId(vegId: string) {
    const deal = await vegDealRepo.getByVegId(vegId);
    if (!deal) throw new NotFoundError("VEG deal", vegId);
    return deal;
  },

  async create(data: any) {
    return vegDealRepo.create(data);
  },

  async update(id: string, data: any) {
    const existing = await vegDealRepo.getById(id);
    if (!existing) throw new NotFoundError("VEG deal", id);
    const result = await vegDealRepo.update(id, data);
    if (!result) throw new NotFoundError("VEG deal", id);
    return result;
  },

  async delete(id: string) {
    const deleted = await vegDealRepo.delete(id);
    if (!deleted) throw new NotFoundError("VEG deal", id);
    return { success: true };
  },

  async getStats() {
    const [aggregates, decisions, businessLines, regions, topClients, topOwners] = await Promise.all([
      vegDealRepo.getAggregates(),
      vegDealRepo.getDecisionsOverview(),
      vegDealRepo.getBusinessLinesOverview(),
      vegDealRepo.getRegionOverview(),
      vegDealRepo.getTopClients(10),
      vegDealRepo.getTopOwners(10),
    ]);
    return { aggregates, decisions, businessLines, regions, topClients, topOwners };
  },

  async getDashboardData(filters?: any) {
    const [kpis, decisions, tcvByClient, tcvByRegion, tcvByBusinessLine, tcvByProduct,
      topClients, topOpportunities, workloadByProduct, workloadByOwner, workloadByRegion,
      governanceQuality, riskDistribution, dealRows] = await Promise.all([
      vegDealRepo.getDashboardKpis(filters),
      vegDealRepo.getDashboardDecisions(filters),
      vegDealRepo.getDashboardRevenueByDimension("client", filters),
      vegDealRepo.getDashboardRevenueByDimension("region", filters),
      vegDealRepo.getDashboardRevenueByDimension("business_line", filters),
      vegDealRepo.getDashboardRevenueByDimension("products", filters),
      vegDealRepo.getDashboardTopClients(10, filters),
      vegDealRepo.getDashboardTopOpportunities(10, filters),
      vegDealRepo.getDashboardWorkloadByDimension("products", filters),
      vegDealRepo.getDashboardWorkloadByDimension("business_owner", filters),
      vegDealRepo.getDashboardWorkloadByDimension("region", filters),
      vegDealRepo.getDashboardGovernanceQuality(filters),
      vegDealRepo.getDashboardRiskDistribution(filters),
      vegDealRepo.getDashboardDealRows(filters),
    ]);
    return {
      kpis: kpis.rows[0],
      decisions: decisions.rows,
      tcvByClient: tcvByClient.rows,
      tcvByRegion: tcvByRegion.rows,
      tcvByBusinessLine: tcvByBusinessLine.rows,
      tcvByProduct: tcvByProduct.rows,
      topClients: topClients.rows,
      topOpportunities: topOpportunities.rows,
      workloadByProduct: workloadByProduct.rows,
      workloadByOwner: workloadByOwner.rows,
      workloadByRegion: workloadByRegion.rows,
      governanceQuality: governanceQuality.rows[0],
      riskDistribution: riskDistribution.rows,
      dealRows: dealRows.rows,
    };
  },

  async getDecisionsOverview() {
    const result = await vegDealRepo.getDecisionsOverview();
    return result;
  },

  async getBusinessLinesOverview() {
    const result = await vegDealRepo.getBusinessLinesOverview();
    return result;
  },

  async getRegionOverview() {
    const result = await vegDealRepo.getRegionOverview();
    return result;
  },

  async getMonthlyTCVTrend() {
    const result = await vegDealRepo.getMonthlyTCVTrend();
    return result;
  },

  async getYearOverYear() {
    const result = await vegDealRepo.getYearOverYear();
    return result;
  },

  async importFromExcel(data: any[]) {
    return vegDealRepo.bulkInsertNew(data);
  },

  async exportCsv(filters: Omit<VegDealFilters, "page" | "limit">) {
    const rows = await vegDealRepo.exportAll(filters);
    const headers = [
      "VEG ID", "Client", "Opportunity CRM", "Identifier Number",
      "Business Owner", "Region", "Business Line", "Products",
      "Committee Type", "VEG Date", "Decision",
      "TCV", "IP Maintenance", "SaaS", "PS",
      "WL PS MD", "WL Investment MD", "Ticket PP Invest",
      "Minutes", "Financials URL", "Templates URL",
      "Sales Status", "Closing Date",
      "Account Type", "Deal Type", "Duration Days",
      "TCV CRM", "ID Check", "Delta VEG CRM", "Comments",
      "Project Name Chronos", "Chronos WL MD", "Turnover Chronos", "Delta VEG Chronos MD",
      "Product Abbr", "Internal Flag", "VEG Year", "Duplicate Check",
    ];
    const csvLines = [headers.join(",")];
    for (const row of rows) {
      csvLines.push(headers.map((_, i) => {
        const keys: (keyof VegDealRow)[] = [
          "veg_id", "client", "opportunity_crm", "identifier_number",
          "business_owner", "region", "business_line", "products",
          "committee_type", "veg_date", "decision",
          "tcv", "ip_maintenance", "saas", "ps",
          "wl_ps_md", "wl_investment_md", "ticket_pp_invest",
          "minutes", "financials_url", "templates_url",
          "sales_status", "closing_date",
          "account_type", "deal_type", "duration_days",
          "tcv_crm", "id_check", "delta_veg_crm", "comments",
          "project_name_chronos", "chronos_wl_md", "turnover_chronos", "delta_veg_chronos_md",
          "product_abbr", "internal_flag", "veg_year", "duplicate_check",
        ];
        const val = row[keys[i]];
        if (val == null) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(","));
    }
    return csvLines.join("\n");
  },
};
