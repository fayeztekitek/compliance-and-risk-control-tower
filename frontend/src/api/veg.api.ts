import { apiClient } from "../api/client";

export interface VegRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  type: "RFI" | "RFP" | "NEW_CLIENT_REQUEST" | "BD_REQUEST" | "ACC_CODE_CREATION" | "BID_COMMITTEE_OVERSIGHT";
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CONTRACT_SIGNATURE";
  client: string;
  marginEstimate: number | null;
  workloadMd: number | null;
  codeAcc: string | null;
  bidDecision: string;
  goNoGoDecision: string;
  financeState: string;
  salesState: string;
  productState: string;
  legalState: string;
  ownerId: string | null;
  date: string;
  opportunities?: Opportunity[];
}

export interface Opportunity {
  id: string;
  veg_request_id: string;
  name: string;
  value: number;
  sales_stage: string;
  contract_signed: boolean;
  contracts?: Contract[];
}

export interface Contract {
  id: string;
  opportunity_id: string;
  title: string;
  start_date: string;
  end_date: string;
  sla_commitments: string | null;
  compliance_status: string;
  maintenance_saas: boolean;
}

export interface VegListParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  client?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const vegApi = {
  list(params?: VegListParams) {
    return apiClient.get<PaginatedResponse<VegRequest>>("/api/veg", { params });
  },

  getById(id: string) {
    return apiClient.get<{ data: VegRequest }>(`/api/veg/${id}`);
  },

  create(data: Partial<VegRequest>) {
    return apiClient.post<{ data: VegRequest }>("/api/veg", data);
  },

  update(id: string, data: Partial<VegRequest>) {
    return apiClient.patch<{ data: VegRequest }>(`/api/veg/${id}`, data);
  },

  delete(id: string) {
    return apiClient.delete<{ data: { success: boolean } }>(`/api/veg/${id}`);
  },

  signoff(id: string, department: string, state: string) {
    return apiClient.patch<{ data: VegRequest }>(`/api/veg/${id}/signoff/${department}`, { state });
  },

  bidDecision(id: string, decision: string) {
    return apiClient.patch<{ data: VegRequest }>(`/api/veg/${id}/bid`, { decision });
  },

  goNoGo(id: string, decision: string) {
    return apiClient.patch<{ data: VegRequest }>(`/api/veg/${id}/gonogo`, { decision });
  },

  batchSync(requests: Partial<VegRequest>[]) {
    return apiClient.post<{ data: { synced: number; requests: VegRequest[] } }>("/api/veg/batch-sync", { requests });
  },

  createOpportunity(vegId: string, data: Partial<Opportunity>) {
    return apiClient.post<{ data: Opportunity }>(`/api/veg/${vegId}/opportunities`, data);
  },

  createContract(opportunityId: string, data: Partial<Contract>) {
    return apiClient.post<{ data: Contract }>(`/api/veg/opportunities/${opportunityId}/contracts`, data);
  },
};

// === VEG DEAL types ===
export interface VegDeal {
  id: string;
  veg_id: string;
  client: string;
  opportunity_crm: string | null;
  identifier_number: string | null;
  business_owner: string;
  region: string;
  business_line: string;
  products: string;
  committee_type: "Go n Go" | "Bid n Bid";
  veg_date: string;
  decision: string;
  tcv: number;
  ip_maintenance: number;
  saas: number;
  ps: number;
  wl_ps_md: number;
  wl_investment_md: number;
  ticket_pp_invest: string | null;
  minutes: string | null;
  financials_url: string | null;
  templates_url: string | null;
  sales_status: string | null;
  closing_date: string | null;
  account_type: string | null;
  deal_type: string;
  duration_days: number | null;
  tcv_crm: number;
  id_check: string | null;
  delta_veg_crm: number;
  comments: string | null;
  project_name_chronos: string | null;
  chronos_wl_md: number;
  turnover_chronos: number;
  delta_veg_chronos_md: number;
  product_abbr: string | null;
  internal_flag: boolean;
  veg_year: number;
  duplicate_check: boolean;
  invst_start_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface VegDealListParams {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  businessLine?: string;
  decision?: string;
  salesStatus?: string;
  businessOwner?: string;
  year?: number;
  client?: string;
}

export interface VegDealStats {
  aggregates: {
    total_deals: string;
    total_tcv: string;
    avg_tcv: string;
    won_deals: string;
    lost_deals: string;
    open_deals: string;
  };
  decisions: { decision: string; count: string; total_tcv: string }[];
  businessLines: { business_line: string; count: string; total_tcv: string }[];
  regions: { region: string; count: string; total_tcv: string }[];
  topClients: { client: string; count: string; total_tcv: string }[];
  topOwners: { business_owner: string; count: string; total_tcv: string }[];
}

export interface VegDashboardKpis {
  total_veg: string;
  go_final: string;
  go_initial: string;
  bid: string;
  no_go: string;
  total_tcv: string;
  total_ps: string;
  total_saas: string;
  total_ip_maintenance: string;
  total_wl_ps_md: string;
  total_wl_investment_md: string;
  missing_crm: string;
  missing_chronos: string;
  delta_crm_count: string;
  delta_chronos_count: string;
  duplicate_count: string;
  incomplete_dossier: string;
}

export interface VegDashboardDimension {
  label: string;
  tcv: string;
  ps: string;
  saas: string;
  ip_maintenance: string;
  count: string;
}

export interface VegDashboardTopClient {
  client: string;
  count: string;
  total_tcv: string;
  total_revenue: string;
}

export interface VegDashboardTopOpportunity {
  veg_id: string;
  client: string;
  opportunity_crm: string;
  tcv: string;
}

export interface VegDashboardWorkload {
  label: string;
  wl_ps_md: string;
  wl_investment_md: string;
  chronos_wl_md: string;
  count: string;
}

export interface VegDashboardGovernanceQuality {
  total: string;
  missing_crm: string;
  missing_identifier: string;
  missing_templates: string;
  missing_minutes: string;
  missing_financials: string;
  missing_chronos: string;
  missing_closing_date: string;
  duplicate_yes: string;
  id_check_issues: string;
  delta_crm_issues: string;
  delta_chronos_issues: string;
}

export interface VegDashboardRiskLevel {
  risk_level: string;
  count: string;
}

export interface VegDashboardDealRow {
  veg_id: string;
  client: string;
  opportunity_crm: string | null;
  identifier_number: string | null;
  business_owner: string;
  region: string;
  business_line: string;
  products: string;
  committee_type: string;
  veg_date: string;
  decision: string;
  tcv: number;
  ip_maintenance: number;
  saas: number;
  ps: number;
  wl_ps_md: number;
  wl_investment_md: number;
  sales_status: string | null;
  closing_date: string | null;
  deal_type: string;
  duration_days: number | null;
  project_name_chronos: string | null;
  chronos_wl_md: number;
  turnover_chronos: number;
  delta_veg_chronos_md: number;
  tcv_crm: number;
  delta_veg_crm: number;
  id_check: string | null;
  duplicate_check: boolean;
  total_revenue: number;
  total_workload_md: number;
  chronos_alignment: string;
  crm_alignment: string;
  governance_risk_level: string;
  dossier_completeness: string;
}

export interface VegDashboardData {
  kpis: VegDashboardKpis;
  decisions: { decision: string; count: string; total_tcv: string }[];
  tcvByClient: VegDashboardDimension[];
  tcvByRegion: VegDashboardDimension[];
  tcvByBusinessLine: VegDashboardDimension[];
  tcvByProduct: VegDashboardDimension[];
  topClients: VegDashboardTopClient[];
  topOpportunities: VegDashboardTopOpportunity[];
  workloadByProduct: VegDashboardWorkload[];
  workloadByOwner: VegDashboardWorkload[];
  workloadByRegion: VegDashboardWorkload[];
  governanceQuality: VegDashboardGovernanceQuality;
  riskDistribution: VegDashboardRiskLevel[];
  dealRows: VegDashboardDealRow[];
}

export interface VegDashboardFilters {
  year?: number;
  client?: string;
  opportunityCrm?: string;
  businessOwner?: string;
  region?: string;
  businessLine?: string;
  products?: string;
  committeeType?: string;
  decision?: string;
  salesStatus?: string;
  dealType?: string;
  duplicateCheck?: boolean;
  vegDateFrom?: string;
  vegDateTo?: string;
  closingDateFrom?: string;
  closingDateTo?: string;
  tcvMin?: number;
  tcvMax?: number;
  wlMin?: number;
  wlMax?: number;
}

export const vegDealApi = {
  list(params?: VegDealListParams) {
    return apiClient.get<PaginatedResponse<VegDeal>>("/api/veg-deals", { params });
  },
  getById(id: string) {
    return apiClient.get<{ data: VegDeal }>(`/api/veg-deals/${id}`);
  },
  getByVegId(vegId: string) {
    return apiClient.get<{ data: VegDeal }>(`/api/veg-deals/by-veg-id/${vegId}`);
  },
  create(data: Partial<VegDeal>) {
    return apiClient.post<{ data: VegDeal }>("/api/veg-deals", data);
  },
  update(id: string, data: Partial<VegDeal>) {
    return apiClient.patch<{ data: VegDeal }>(`/api/veg-deals/${id}`, data);
  },
  delete(id: string) {
    return apiClient.delete<{ data: { success: boolean } }>(`/api/veg-deals/${id}`);
  },
  getStats() {
    return apiClient.get<{ data: VegDealStats }>("/api/veg-deals/stats");
  },
  getDecisions() {
    return apiClient.get<{ data: { decision: string; count: string; total_tcv: string }[] }>("/api/veg-deals/decisions");
  },
  getBusinessLines() {
    return apiClient.get<{ data: { business_line: string; count: string; total_tcv: string }[] }>("/api/veg-deals/business-lines");
  },
  getRegions() {
    return apiClient.get<{ data: { region: string; count: string; total_tcv: string }[] }>("/api/veg-deals/regions");
  },
  getMonthlyTrend() {
    return apiClient.get<{ data: { month: string; tcv: string; count: string }[] }>("/api/veg-deals/trends/monthly");
  },
  getYearOverYear() {
    return apiClient.get<{ data: { year: string; tcv: string; count: string; won_tcv: string }[] }>("/api/veg-deals/trends/year-over-year");
  },
  dashboard(filters?: VegDashboardFilters) {
    const params: Record<string, string> = {};
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params[k] = String(v);
      });
    }
    return apiClient.get<{ data: VegDashboardData }>("/api/veg-deals/dashboard", { params });
  },
  importFromExcel(rows: Record<string, any>[]) {
    return apiClient.post<{ data: { imported: number; skipped: number; alreadyExists: number; errors: number } }>("/api/veg-deals/import", { rows });
  },
};
