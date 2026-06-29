export interface VegDeal {
  id: string;
  veg_id: string;
  client: string;
  business_owner: string;
  region: string;
  business_line: string;
  committee_type: string;
  veg_date: string;
  decision: string;
  tcv: number;
  ip_maintenance: number;
  saas: number;
  ps: number;
  wl_ps_md: number;
  wl_investment_md: number;
  veg_year: number;
  invst_start_date?: string;
  sales_status: string | null;
  tcv_crm: number;
  delta_veg_crm: number;
  duration_days: number | null;
  financials_url?: string;
  templates_url?: string;
  minutes?: string;
  comments?: string;
  account_type?: string;
  deal_type?: string;
  closing_date?: string;
  project_name_chronos?: string;
  chronos_wl_md: number;
  turnover_chronos: number;
  delta_veg_chronos_md: number;
}

export interface VegDealListParams {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  businessLine?: string;
  decision?: string;
  salesStatus?: string;
  year?: number;
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
  decisions: { decision: string; count: string }[];
  businessLines: { business_line: string; count: string }[];
  regions: { region: string; count: string }[];
  topClients: { client: string; count: string; total_tcv: string }[];
  topOwners: { business_owner: string; count: string; total_tcv: string }[];
}

export interface VegRequest {
  id: string;
  title: string;
  client: string;
  type: string;
  status: string;
  date: string;
  description?: string;
  ownerId?: string;
  financeState: string;
  salesState: string;
  productState: string;
  legalState: string;
  bidDecision: string | null;
  goNoGoDecision: string | null;
  opportunities?: VegOpportunity[];
}

export interface VegOpportunity {
  id: string;
  name: string;
  value: number;
  sales_stage: string;
  contract_signed: boolean;
  contracts?: VegContract[];
}

export interface VegContract {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  sla_commitments?: string;
  compliance_status: string;
  maintenance_saas: boolean;
}
