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
  created_at: string;
  updated_at: string;
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
  "created_at", "updated_at",
];

const COLS = DB_COLS.join(", ");

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
        product_abbr, internal_flag, veg_year, duplicate_check
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38)
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
    return query<{ decision: string; count: string; total_tcv: string }>(`
      SELECT decision, COUNT(*)::text as count, COALESCE(SUM(tcv), 0)::text as total_tcv
      FROM veg_deals GROUP BY decision ORDER BY count DESC
    `);
  },

  async getBusinessLinesOverview() {
    return query<{ business_line: string; count: string; total_tcv: string }>(`
      SELECT business_line, COUNT(*)::text as count, COALESCE(SUM(tcv), 0)::text as total_tcv
      FROM veg_deals GROUP BY business_line ORDER BY count DESC
    `);
  },

  async getRegionOverview() {
    return query<{ region: string; count: string; total_tcv: string }>(`
      SELECT region, COUNT(*)::text as count, COALESCE(SUM(tcv), 0)::text as total_tcv
      FROM veg_deals GROUP BY region ORDER BY count DESC
    `);
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
    return query<{ month: string; tcv: string; count: string }>(`
      SELECT TO_CHAR(veg_date, 'YYYY-MM') as month, COALESCE(SUM(tcv), 0)::text as tcv, COUNT(*)::text as count
      FROM veg_deals GROUP BY month ORDER BY month
    `);
  },

  async getYearOverYear() {
    return query<{ year: string; tcv: string; count: string; won_tcv: string }>(`
      SELECT veg_year::text as year, COALESCE(SUM(tcv), 0)::text as tcv, COUNT(*)::text as count,
        COALESCE(SUM(CASE WHEN sales_status = 'Won' THEN tcv ELSE 0 END), 0)::text as won_tcv
      FROM veg_deals GROUP BY veg_year ORDER BY veg_year
    `);
  },

  async getTopClients(limit: number = 10) {
    return query<{ client: string; count: string; total_tcv: string }>(`
      SELECT client, COUNT(*)::text as count, COALESCE(SUM(tcv), 0)::text as total_tcv
      FROM veg_deals GROUP BY client ORDER BY count DESC LIMIT $1
    `, [limit]);
  },

  async getTopOwners(limit: number = 10) {
    return query<{ business_owner: string; count: string; total_tcv: string }>(`
      SELECT business_owner, COUNT(*)::text as count, COALESCE(SUM(tcv), 0)::text as total_tcv
      FROM veg_deals GROUP BY business_owner ORDER BY count DESC LIMIT $1
    `, [limit]);
  },
};
