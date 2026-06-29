import { query } from "../config/database.js";

export interface VegDealRow {
  id: string;
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
  idCheck?: string;
  vegDateFrom?: string;
  vegDateTo?: string;
  closingDateFrom?: string;
  closingDateTo?: string;
  tcvMin?: number;
  tcvMax?: number;
  wlMin?: number;
  wlMax?: number;
}

const DB_COLS = [
  "id", "veg_id", "client", "opportunity_crm", "identifier_number",
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
  "invst_start_date",
  "created_at", "updated_at",
];

const COLS = DB_COLS.join(", ");

function buildDashboardWhere(filters?: VegDashboardFilters): { clause: string; params: any[] } {
  if (!filters) return { clause: "", params: [] };
  const parts: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (filters.year) { parts.push(`veg_year = $${idx++}`); params.push(filters.year); }
  if (filters.client) { parts.push(`client ILIKE $${idx++}`); params.push(`%${filters.client}%`); }
  if (filters.opportunityCrm) { parts.push(`opportunity_crm ILIKE $${idx++}`); params.push(`%${filters.opportunityCrm}%`); }
  if (filters.businessOwner) { parts.push(`business_owner = $${idx++}`); params.push(filters.businessOwner); }
  if (filters.region) { parts.push(`region = $${idx++}`); params.push(filters.region); }
  if (filters.businessLine) { parts.push(`business_line = $${idx++}`); params.push(filters.businessLine); }
  if (filters.products) { parts.push(`products ILIKE $${idx++}`); params.push(`%${filters.products}%`); }
  if (filters.committeeType) { parts.push(`committee_type = $${idx++}`); params.push(filters.committeeType); }
  if (filters.decision) { parts.push(`decision = $${idx++}`); params.push(filters.decision); }
  if (filters.salesStatus) { parts.push(`sales_status = $${idx++}`); params.push(filters.salesStatus); }
  if (filters.dealType) { parts.push(`deal_type = $${idx++}`); params.push(filters.dealType); }
  if (filters.duplicateCheck !== undefined) { parts.push(`duplicate_check = $${idx++}`); params.push(filters.duplicateCheck); }
  if (filters.idCheck) { parts.push(`id_check = $${idx++}`); params.push(filters.idCheck); }
  if (filters.vegDateFrom) { parts.push(`veg_date >= $${idx++}`); params.push(filters.vegDateFrom); }
  if (filters.vegDateTo) { parts.push(`veg_date <= $${idx++}`); params.push(filters.vegDateTo); }
  if (filters.closingDateFrom) { parts.push(`closing_date >= $${idx++}`); params.push(filters.closingDateFrom); }
  if (filters.closingDateTo) { parts.push(`closing_date <= $${idx++}`); params.push(filters.closingDateTo); }
  if (filters.tcvMin !== undefined) { parts.push(`tcv >= $${idx++}`); params.push(filters.tcvMin); }
  if (filters.tcvMax !== undefined) { parts.push(`tcv <= $${idx++}`); params.push(filters.tcvMax); }
  if (filters.wlMin !== undefined) { parts.push(`(wl_ps_md + wl_investment_md) >= $${idx++}`); params.push(filters.wlMin); }
  if (filters.wlMax !== undefined) { parts.push(`(wl_ps_md + wl_investment_md) <= $${idx++}`); params.push(filters.wlMax); }

  return {
    clause: parts.length ? `WHERE ${parts.join(" AND ")}` : "",
    params,
  };
}

export interface VegDealFilters {
  page: number;
  limit: number;
  search?: string;
  region?: string;
  businessLine?: string;
  decision?: string;
  salesStatus?: string;
  businessOwner?: string;
  year?: number;
  client?: string;
}

export const vegDealRepo = {
  async list(filters: VegDealFilters) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.search) {
      conditions.push(`(client ILIKE $${idx} OR business_owner ILIKE $${idx} OR veg_id ILIKE $${idx} OR opportunity_crm ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    if (filters.region) {
      conditions.push(`region = $${idx++}`);
      params.push(filters.region);
    }
    if (filters.businessLine) {
      conditions.push(`business_line = $${idx++}`);
      params.push(filters.businessLine);
    }
    if (filters.decision) {
      conditions.push(`decision = $${idx++}`);
      params.push(filters.decision);
    }
    if (filters.salesStatus) {
      conditions.push(`sales_status = $${idx++}`);
      params.push(filters.salesStatus);
    }
    if (filters.businessOwner) {
      conditions.push(`business_owner = $${idx++}`);
      params.push(filters.businessOwner);
    }
    if (filters.year) {
      conditions.push(`veg_year = $${idx++}`);
      params.push(filters.year);
    }
    if (filters.client) {
      conditions.push(`client ILIKE $${idx++}`);
      params.push(`%${filters.client}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.limit;

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM veg_deals ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query<VegDealRow>(
      `SELECT ${COLS} FROM veg_deals ${where} ORDER BY veg_date DESC, veg_id DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, filters.limit, offset]
    );

    return { data: dataResult.rows, total, page: filters.page, limit: filters.limit };
  },

  async getById(id: string) {
    const result = await query<VegDealRow>(
      `SELECT ${COLS} FROM veg_deals WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async getByVegId(vegId: string) {
    const result = await query<VegDealRow>(
      `SELECT ${COLS} FROM veg_deals WHERE veg_id = $1`,
      [vegId]
    );
    return result.rows[0] || null;
  },

  async create(data: any) {
    const result = await query<VegDealRow>(
      `INSERT INTO veg_deals (
        veg_id, client, opportunity_crm, identifier_number,
        business_owner, region, business_line, products,
        committee_type, veg_date, decision,
        tcv, ip_maintenance, saas, ps,
        wl_ps_md, wl_investment_md, ticket_pp_invest,
        minutes, financials_url, templates_url,
        sales_status, closing_date,
        account_type, deal_type, duration_days,
        tcv_crm, id_check, delta_veg_crm, comments,
        project_name_chronos, chronos_wl_md, turnover_chronos, delta_veg_chronos_md,
        product_abbr, internal_flag, veg_year, duplicate_check,
        invst_start_date
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39)
      RETURNING ${COLS}`,
      [
        data.vegId, data.client, data.opportunityCrm || null, data.identifierNumber || null,
        data.businessOwner, data.region, data.businessLine, data.products,
        data.committeeType, data.vegDate, data.decision,
        data.tcv || 0, data.ipMaintenance || 0, data.saas || 0, data.ps || 0,
        data.wlPsMd || 0, data.wlInvestmentMd || 0, data.ticketPpInvest || null,
        data.minutes || null, data.financialsUrl || null, data.templatesUrl || null,
        data.salesStatus || null, data.closingDate || null,
        data.accountType || null, data.dealType || 'NA', data.durationDays || null,
        data.tcvCrm || 0, data.idCheck || null, data.deltaVegCrm || 0, data.comments || null,
        data.projectNameChronos || null, data.chronosWlMd || 0, data.turnoverChronos || 0, data.deltaVegChronosMd || 0,
        data.productAbbr || null, data.internalFlag || false, data.vegYear, data.duplicateCheck || false,
        data.invstStartDate || null,
      ]
    );
    return result.rows[0];
  },

  async update(id: string, data: any) {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      client: "client", opportunityCrm: "opportunity_crm", identifierNumber: "identifier_number",
      businessOwner: "business_owner", region: "region", businessLine: "business_line",
      products: "products", committeeType: "committee_type", vegDate: "veg_date",
      decision: "decision", tcv: "tcv", ipMaintenance: "ip_maintenance",
      saas: "saas", ps: "ps", wlPsMd: "wl_ps_md", wlInvestmentMd: "wl_investment_md",
      ticketPpInvest: "ticket_pp_invest", minutes: "minutes",
      financialsUrl: "financials_url", templatesUrl: "templates_url",
      salesStatus: "sales_status", closingDate: "closing_date",
      accountType: "account_type", dealType: "deal_type", durationDays: "duration_days",
      tcvCrm: "tcv_crm", idCheck: "id_check", deltaVegCrm: "delta_veg_crm",
      comments: "comments", projectNameChronos: "project_name_chronos",
      chronosWlMd: "chronos_wl_md", turnoverChronos: "turnover_chronos",
      deltaVegChronosMd: "delta_veg_chronos_md", productAbbr: "product_abbr",
      internalFlag: "internal_flag", duplicateCheck: "duplicate_check",
      invstStartDate: "invst_start_date",
    };

    for (const [key, col] of Object.entries(mapping)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        params.push(data[key]);
      }
    }
    if (!fields.length) return null;

    params.push(id);
    const result = await query<VegDealRow>(
      `UPDATE veg_deals SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${COLS}`,
      params
    );
    return result.rows[0] || null;
  },

  async delete(id: string) {
    const result = await query("DELETE FROM veg_deals WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async getAggregates() {
    const result = await query<{
      total_deals: string; total_tcv: string; avg_tcv: string;
      won_deals: string; lost_deals: string; open_deals: string;
    }>(`
      SELECT
        COUNT(*)::text as total_deals,
        COALESCE(SUM(tcv), 0)::text as total_tcv,
        COALESCE(AVG(tcv), 0)::text as avg_tcv,
        COALESCE(SUM(CASE WHEN sales_status = 'Won' THEN 1 ELSE 0 END), 0)::text as won_deals,
        COALESCE(SUM(CASE WHEN sales_status = 'Lost' THEN 1 ELSE 0 END), 0)::text as lost_deals,
        COALESCE(SUM(CASE WHEN sales_status = 'Open' OR sales_status IS NULL THEN 1 ELSE 0 END), 0)::text as open_deals
      FROM veg_deals
    `);
    return result.rows[0];
  },

  async getDecisionsOverview() {
    const result = await query<{ decision: string; count: string; total_tcv: string }>(`
      SELECT decision, COUNT(*)::text as count, COALESCE(SUM(tcv), 0)::text as total_tcv
      FROM veg_deals GROUP BY decision ORDER BY count DESC
    `);
    return result.rows;
  },

  async getBusinessLinesOverview() {
    const result = await query<{ business_line: string; count: string; total_tcv: string }>(`
      SELECT business_line, COUNT(*)::text as count, COALESCE(SUM(tcv), 0)::text as total_tcv
      FROM veg_deals GROUP BY business_line ORDER BY count DESC
    `);
    return result.rows;
  },

  async getRegionOverview() {
    const result = await query<{ region: string; count: string; total_tcv: string }>(`
      SELECT region, COUNT(*)::text as count, COALESCE(SUM(tcv), 0)::text as total_tcv
      FROM veg_deals GROUP BY region ORDER BY count DESC
    `);
    return result.rows;
  },

  async exportAll(filters: Omit<VegDealFilters, "page" | "limit">) {
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (filters.search) {
      conditions.push(`(client ILIKE $${idx} OR business_owner ILIKE $${idx} OR veg_id ILIKE $${idx} OR opportunity_crm ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    if (filters.region) { conditions.push(`region = $${idx++}`); params.push(filters.region); }
    if (filters.businessLine) { conditions.push(`business_line = $${idx++}`); params.push(filters.businessLine); }
    if (filters.decision) { conditions.push(`decision = $${idx++}`); params.push(filters.decision); }
    if (filters.salesStatus) { conditions.push(`sales_status = $${idx++}`); params.push(filters.salesStatus); }
    if (filters.businessOwner) { conditions.push(`business_owner = $${idx++}`); params.push(filters.businessOwner); }
    if (filters.year) { conditions.push(`veg_year = $${idx++}`); params.push(filters.year); }
    if (filters.client) { conditions.push(`client ILIKE $${idx++}`); params.push(`%${filters.client}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await query<VegDealRow>(
      `SELECT ${COLS} FROM veg_deals ${where} ORDER BY veg_date DESC, veg_id DESC`
    );
    return result.rows;
  },

  async getMonthlyTCVTrend() {
    const result = await query<{ month: string; tcv: string; count: string }>(`
      SELECT TO_CHAR(veg_date, 'YYYY-MM') as month, COALESCE(SUM(tcv), 0)::text as tcv, COUNT(*)::text as count
      FROM veg_deals GROUP BY month ORDER BY month
    `);
    return result.rows;
  },

  async getYearOverYear() {
    const result = await query<{ year: string; tcv: string; count: string; won_tcv: string }>(`
      SELECT veg_year::text as year, COALESCE(SUM(tcv), 0)::text as tcv, COUNT(*)::text as count,
        COALESCE(SUM(CASE WHEN sales_status = 'Won' THEN tcv ELSE 0 END), 0)::text as won_tcv
      FROM veg_deals GROUP BY veg_year ORDER BY veg_year
    `);
  },

  async getTopClients(limit: number = 10) {
    const result = await query<{ client: string; count: string; total_tcv: string }>(`
      SELECT client, COUNT(*)::text as count, COALESCE(SUM(tcv), 0)::text as total_tcv
      FROM veg_deals GROUP BY client ORDER BY count DESC LIMIT $1
    `, [limit]);
    return result.rows;
  },

  async getTopOwners(limit: number = 10) {
    const result = await query<{ business_owner: string; count: string; total_tcv: string }>(`
      SELECT business_owner, COUNT(*)::text as count, COALESCE(SUM(tcv), 0)::text as total_tcv
      FROM veg_deals GROUP BY business_owner ORDER BY count DESC LIMIT $1
    `, [limit]);
    return result.rows;
  },

  // === COMEX Dashboard ===

  async getDashboardKpis(filters?: VegDashboardFilters) {
    const { clause, params } = buildDashboardWhere(filters);
    return query<VegDashboardKpis>(`
      SELECT
        COUNT(*)::text AS total_veg,
        COALESCE(SUM(CASE WHEN decision = 'GO FINAL' THEN 1 ELSE 0 END), 0)::text AS go_final,
        COALESCE(SUM(CASE WHEN decision = 'GO INITIAL' THEN 1 ELSE 0 END), 0)::text AS go_initial,
        COALESCE(SUM(CASE WHEN decision = 'BID' THEN 1 ELSE 0 END), 0)::text AS bid,
        COALESCE(SUM(CASE WHEN decision IN ('No GO','NO GO') THEN 1 ELSE 0 END), 0)::text AS no_go,
        COALESCE(SUM(tcv), 0)::text AS total_tcv,
        COALESCE(SUM(ps), 0)::text AS total_ps,
        COALESCE(SUM(saas), 0)::text AS total_saas,
        COALESCE(SUM(ip_maintenance), 0)::text AS total_ip_maintenance,
        COALESCE(SUM(wl_ps_md), 0)::text AS total_wl_ps_md,
        COALESCE(SUM(wl_investment_md), 0)::text AS total_wl_investment_md,
        COALESCE(SUM(CASE WHEN opportunity_crm IS NULL OR opportunity_crm = '' OR opportunity_crm = '#N/A' THEN 1 ELSE 0 END), 0)::text AS missing_crm,
        COALESCE(SUM(CASE WHEN project_name_chronos IS NULL OR project_name_chronos = '' THEN 1 ELSE 0 END), 0)::text AS missing_chronos,
        COALESCE(SUM(CASE WHEN delta_veg_crm IS NOT NULL AND delta_veg_crm != 0 THEN 1 ELSE 0 END), 0)::text AS delta_crm_count,
        COALESCE(SUM(CASE WHEN delta_veg_chronos_md IS NOT NULL AND delta_veg_chronos_md != 0 THEN 1 ELSE 0 END), 0)::text AS delta_chronos_count,
        COALESCE(SUM(CASE WHEN duplicate_check = true THEN 1 ELSE 0 END), 0)::text AS duplicate_count,
        COALESCE(SUM(CASE WHEN (minutes IS NULL OR minutes = '') AND (financials_url IS NULL OR financials_url = '') AND (templates_url IS NULL OR templates_url = '') THEN 1 ELSE 0 END), 0)::text AS incomplete_dossier
      FROM veg_deals ${clause}
    `, params.length > 0 ? params : undefined);
  },

  async getDashboardDecisions(filters?: VegDashboardFilters) {
    const { clause, params } = buildDashboardWhere(filters);
    return query<{ decision: string; count: string; total_tcv: string }>(`
      SELECT decision, COUNT(*)::text AS count, COALESCE(SUM(tcv), 0)::text AS total_tcv
      FROM veg_deals ${clause} GROUP BY decision ORDER BY count DESC
    `, params.length > 0 ? params : undefined);
  },

  async getDashboardRevenueByDimension(dimension: string, filters?: VegDashboardFilters) {
    const { clause, params } = buildDashboardWhere(filters);
    const col = dimension === "region" ? "region"
      : dimension === "business_line" ? "business_line"
      : dimension === "products" ? "products"
      : "client";
    return query<{ label: string; tcv: string; ps: string; saas: string; ip_maintenance: string; count: string }>(`
      SELECT ${col} AS label,
        COALESCE(SUM(tcv), 0)::text AS tcv,
        COALESCE(SUM(ps), 0)::text AS ps,
        COALESCE(SUM(saas), 0)::text AS saas,
        COALESCE(SUM(ip_maintenance), 0)::text AS ip_maintenance,
        COUNT(*)::text AS count
      FROM veg_deals ${clause} GROUP BY ${col} ORDER BY SUM(tcv) DESC
    `, params.length > 0 ? params : undefined);
  },

  async getDashboardTopClients(limit: number = 10, filters?: VegDashboardFilters) {
    const { clause, params } = buildDashboardWhere(filters);
    const limitIdx = params.length + 1;
    return query<{ client: string; count: string; total_tcv: string; total_revenue: string }>(`
      SELECT client, COUNT(*)::text AS count, COALESCE(SUM(tcv), 0)::text AS total_tcv,
        COALESCE(SUM(tcv + ip_maintenance + saas + ps), 0)::text AS total_revenue
      FROM veg_deals ${clause} GROUP BY client ORDER BY total_tcv DESC LIMIT $${limitIdx}
    `, [...params, limit]);
  },

  async getDashboardTopOpportunities(limit: number = 10, filters?: VegDashboardFilters) {
    const { clause, params } = buildDashboardWhere(filters);
    const limitIdx = params.length + 1;
    return query<{ veg_id: string; client: string; opportunity_crm: string; tcv: string }>(`
      SELECT veg_id, client, opportunity_crm, tcv::text
      FROM veg_deals ${clause} ORDER BY tcv DESC LIMIT $${limitIdx}
    `, [...params, limit]);
  },

  async getDashboardWorkloadByDimension(dimension: string, filters?: VegDashboardFilters) {
    const { clause, params } = buildDashboardWhere(filters);
    const col = dimension === "products" ? "products"
      : dimension === "business_owner" ? "business_owner"
      : dimension === "region" ? "region"
      : "business_line";
    return query<{ label: string; wl_ps_md: string; wl_investment_md: string; chronos_wl_md: string; count: string }>(`
      SELECT ${col} AS label,
        COALESCE(SUM(wl_ps_md), 0)::text AS wl_ps_md,
        COALESCE(SUM(wl_investment_md), 0)::text AS wl_investment_md,
        COALESCE(SUM(chronos_wl_md), 0)::text AS chronos_wl_md,
        COUNT(*)::text AS count
      FROM veg_deals ${clause} GROUP BY ${col} ORDER BY SUM(wl_ps_md + wl_investment_md) DESC
    `, params.length > 0 ? params : undefined);
  },

  async getDashboardGovernanceQuality(filters?: VegDashboardFilters) {
    const { clause, params } = buildDashboardWhere(filters);
    return query<{
      total: string;
      missing_crm: string; missing_identifier: string; missing_templates: string;
      missing_minutes: string; missing_financials: string; missing_chronos: string;
      missing_closing_date: string; duplicate_yes: string; id_check_issues: string;
      delta_crm_issues: string; delta_chronos_issues: string;
    }>(`
      SELECT
        COUNT(*)::text AS total,
        COALESCE(SUM(CASE WHEN opportunity_crm IS NULL OR opportunity_crm = '' OR opportunity_crm = '#N/A' THEN 1 ELSE 0 END), 0)::text AS missing_crm,
        COALESCE(SUM(CASE WHEN identifier_number IS NULL OR identifier_number = '' THEN 1 ELSE 0 END), 0)::text AS missing_identifier,
        COALESCE(SUM(CASE WHEN templates_url IS NULL OR templates_url = '' THEN 1 ELSE 0 END), 0)::text AS missing_templates,
        COALESCE(SUM(CASE WHEN minutes IS NULL OR minutes = '' THEN 1 ELSE 0 END), 0)::text AS missing_minutes,
        COALESCE(SUM(CASE WHEN financials_url IS NULL OR financials_url = '' THEN 1 ELSE 0 END), 0)::text AS missing_financials,
        COALESCE(SUM(CASE WHEN project_name_chronos IS NULL OR project_name_chronos = '' THEN 1 ELSE 0 END), 0)::text AS missing_chronos,
        COALESCE(SUM(CASE WHEN closing_date IS NULL THEN 1 ELSE 0 END), 0)::text AS missing_closing_date,
        COALESCE(SUM(CASE WHEN duplicate_check = true THEN 1 ELSE 0 END), 0)::text AS duplicate_yes,
        COALESCE(SUM(CASE WHEN id_check IS NOT NULL AND id_check != '' AND id_check != 'OK' THEN 1 ELSE 0 END), 0)::text AS id_check_issues,
        COALESCE(SUM(CASE WHEN delta_veg_crm IS NOT NULL AND delta_veg_crm != 0 THEN 1 ELSE 0 END), 0)::text AS delta_crm_issues,
        COALESCE(SUM(CASE WHEN delta_veg_chronos_md IS NOT NULL AND delta_veg_chronos_md != 0 THEN 1 ELSE 0 END), 0)::text AS delta_chronos_issues
      FROM veg_deals ${clause}
    `, params.length > 0 ? params : undefined);
  },

  async getDashboardRiskDistribution(filters?: VegDashboardFilters) {
    const { clause, params } = buildDashboardWhere(filters);
    return query<{ risk_level: string; count: string }>(`
      SELECT
        CASE
          WHEN (project_name_chronos IS NULL OR project_name_chronos = '')
            OR duplicate_check = true
            OR (decision::text IS NULL OR decision::text = '')
            OR (opportunity_crm IS NULL OR opportunity_crm = '' OR opportunity_crm = '#N/A')
            OR (ABS(COALESCE(delta_veg_chronos_md, 0)) > 10)
          THEN 'High'
          WHEN (minutes IS NULL OR minutes = '')
            OR (financials_url IS NULL OR financials_url = '')
            OR (templates_url IS NULL OR templates_url = '')
            OR (sales_status::text IS NULL OR sales_status::text = '')
            OR (ABS(COALESCE(delta_veg_crm, 0)) > 0 AND ABS(COALESCE(delta_veg_crm, 0)) <= 10)
          THEN 'Medium'
          ELSE 'Low'
        END AS risk_level,
        COUNT(*)::text AS count
      FROM veg_deals ${clause}
      GROUP BY risk_level
      ORDER BY risk_level
    `, params.length > 0 ? params : undefined);
  },

  async getDashboardDealRows(filters?: VegDashboardFilters) {
    const { clause, params } = buildDashboardWhere(filters);
    return query<any>(`
      SELECT
        veg_id, client, opportunity_crm, identifier_number, business_owner,
        region, business_line, products, committee_type, veg_date, decision,
        tcv, ip_maintenance, saas, ps, wl_ps_md, wl_investment_md,
        sales_status, closing_date, deal_type, duration_days,
        project_name_chronos, chronos_wl_md, turnover_chronos, delta_veg_chronos_md,
        tcv_crm, delta_veg_crm, id_check, duplicate_check,
        COALESCE(tcv + ip_maintenance + saas + ps, 0) AS total_revenue,
        COALESCE(wl_ps_md + wl_investment_md, 0) AS total_workload_md,
        CASE WHEN project_name_chronos IS NOT NULL AND project_name_chronos != ''
          THEN CASE WHEN ABS(COALESCE(delta_veg_chronos_md, 0)) <= 5 THEN 'Aligned' ELSE 'Gap' END
          ELSE 'Missing Chronos' END AS chronos_alignment,
        CASE WHEN opportunity_crm IS NOT NULL AND opportunity_crm != '' AND opportunity_crm != '#N/A'
          THEN CASE WHEN ABS(COALESCE(delta_veg_crm, 0)) <= 0.01 THEN 'Aligned' ELSE 'Gap' END
          ELSE 'Missing CRM' END AS crm_alignment,
        CASE
          WHEN (project_name_chronos IS NULL OR project_name_chronos = '')
            OR duplicate_check = true
            OR (decision::text IS NULL OR decision::text = '')
            OR (opportunity_crm IS NULL OR opportunity_crm = '' OR opportunity_crm = '#N/A')
            OR (ABS(COALESCE(delta_veg_chronos_md, 0)) > 10)
          THEN 'High'
          WHEN (minutes IS NULL OR minutes = '')
            OR (financials_url IS NULL OR financials_url = '')
            OR (templates_url IS NULL OR templates_url = '')
            OR (sales_status::text IS NULL OR sales_status::text = '')
          THEN 'Medium'
          ELSE 'Low'
        END AS governance_risk_level,
        CASE
          WHEN minutes IS NOT NULL AND minutes != ''
            AND financials_url IS NOT NULL AND financials_url != ''
            AND templates_url IS NOT NULL AND templates_url != ''
            AND opportunity_crm IS NOT NULL AND opportunity_crm != '' AND opportunity_crm != '#N/A'
            AND project_name_chronos IS NOT NULL AND project_name_chronos != ''
            AND closing_date IS NOT NULL
          THEN 'Complete'
          WHEN minutes IS NULL AND financials_url IS NULL AND templates_url IS NULL
            AND opportunity_crm IS NULL AND project_name_chronos IS NULL
          THEN 'Incomplete'
          ELSE 'Partially Complete'
        END AS dossier_completeness
      FROM veg_deals ${clause}
      ORDER BY veg_date DESC, veg_id DESC
    `, params.length > 0 ? params : undefined);
  },

  async bulkInsertNew(rows: any[]) {
    if (!rows.length) return { imported: 0, alreadyExists: 0, errors: 0 };
    let imported = 0;
    let alreadyExists = 0;
    let errors = 0;
    for (const row of rows) {
      try {
        const existing = await query<VegDealRow>(
          `SELECT id FROM veg_deals WHERE veg_id = $1`, [row.vegId]
        );
        if (existing.rows.length > 0) {
          alreadyExists++;
        } else {
          await this.create(row);
          imported++;
        }
      } catch {
        errors++;
      }
    }
    return { imported, alreadyExists, errors };
  },
};
