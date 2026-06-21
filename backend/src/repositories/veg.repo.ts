import { query, getClient } from "../config/database.js";

export interface VegRequestRow {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  type: string;
  status: string;
  client: string;
  margin_estimate: number | null;
  workload_md: number | null;
  code_acc: string | null;
  bid_decision: string;
  go_nogo_decision: string;
  finance_state: string;
  sales_state: string;
  product_state: string;
  legal_state: string;
  owner_id: string | null;
  date: string;
  deleted_at: string | null;
}

export interface OpportunityRow {
  id: string;
  veg_request_id: string;
  name: string;
  value: number;
  sales_stage: string;
  contract_signed: boolean;
}

export interface ContractRow {
  id: string;
  opportunity_id: string | null;
  title: string;
  start_date: string;
  end_date: string;
  sla_commitments: string | null;
  compliance_status: string;
  maintenance_saas: boolean;
}

type VegStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CONTRACT_SIGNATURE";
type Department = "finance" | "sales" | "product" | "legal";
type DeptState = "PENDING" | "APPROVED" | "REJECTED";

const DB_COLS = ["id", "created_at", "updated_at", "title", "type", "status", "client", "margin_estimate", "workload_md", "code_acc", "bid_decision", "go_nogo_decision", "finance_state", "sales_state", "product_state", "legal_state", "owner_id", "date", "deleted_at"];

function rowToJson(row: VegRequestRow) {
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    title: row.title,
    type: row.type,
    status: row.status,
    client: row.client,
    marginEstimate: row.margin_estimate,
    workloadMd: row.workload_md,
    codeAcc: row.code_acc,
    bidDecision: row.bid_decision,
    goNoGoDecision: row.go_nogo_decision,
    financeState: row.finance_state,
    salesState: row.sales_state,
    productState: row.product_state,
    legalState: row.legal_state,
    ownerId: row.owner_id,
    date: row.date,
  };
}

export const vegRepo = {
  async list(filters: { page: number; limit: number; status?: string; type?: string; client?: string; search?: string }) {
    const conditions: string[] = ["deleted_at IS NULL"];
    const params: any[] = [];
    let idx = 1;

    if (filters.status) { conditions.push(`status = $${idx++}`); params.push(filters.status); }
    if (filters.type) { conditions.push(`type = $${idx++}`); params.push(filters.type); }
    if (filters.client) { conditions.push(`client ILIKE $${idx++}`); params.push(`%${filters.client}%`); }
    if (filters.search) { conditions.push(`(title ILIKE $${idx++} OR client ILIKE $${idx++})`); params.push(`%${filters.search}%`, `%${filters.search}%`); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.limit;

    const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM veg_requests ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query<VegRequestRow>(
      `SELECT ${DBCols()} FROM veg_requests ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, filters.limit, offset]
    );

    return { data: dataResult.rows.map(rowToJson), total, page: filters.page, limit: filters.limit };
  },

  async getById(id: string) {
    const result = await query<VegRequestRow>(
      `SELECT ${DBCols()} FROM veg_requests WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rows.length ? rowToJson(result.rows[0]) : null;
  },

  async create(data: any) {
    const result = await query<VegRequestRow>(
      `INSERT INTO veg_requests (title, type, client, margin_estimate, workload_md, code_acc, owner_id, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${DBCols()}`,
      [data.title, data.type, data.client, data.marginEstimate || null, data.workloadMd || null, data.codeAcc || null, data.ownerId || null, data.date || new Date().toISOString().split("T")[0]]
    );
    return rowToJson(result.rows[0]);
  },

  async update(id: string, data: any) {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      title: "title", type: "type", client: "client",
      marginEstimate: "margin_estimate", workloadMd: "workload_md",
      codeAcc: "code_acc", status: "status",
    };

    for (const [key, col] of Object.entries(mapping)) {
      if (data[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        params.push(data[key]);
      }
    }
    if (!fields.length) return null;

    params.push(id);
    const result = await query<VegRequestRow>(
      `UPDATE veg_requests SET ${fields.join(", ")} WHERE id = $${idx} AND deleted_at IS NULL RETURNING ${DBCols()}`,
      params
    );
    return result.rows.length ? rowToJson(result.rows[0]) : null;
  },

  async softDelete(id: string) {
    const result = await query(
      `UPDATE veg_requests SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rowCount ? true : false;
  },

  async updateDepartmentSignoff(id: string, department: Department, state: DeptState) {
    const colMap: Record<Department, string> = {
      finance: "finance_state", sales: "sales_state", product: "product_state", legal: "legal_state",
    };
    const col = colMap[department];
    const result = await query<VegRequestRow>(
      `UPDATE veg_requests SET ${col} = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING ${DBCols()}`,
      [state, id]
    );
    return result.rows.length ? rowToJson(result.rows[0]) : null;
  },

  async updateBidDecision(id: string, decision: string) {
    const result = await query<VegRequestRow>(
      `UPDATE veg_requests SET bid_decision = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING ${DBCols()}`,
      [decision, id]
    );
    return result.rows.length ? rowToJson(result.rows[0]) : null;
  },

  async updateGoNoGo(id: string, decision: string) {
    const result = await query<VegRequestRow>(
      `UPDATE veg_requests SET go_nogo_decision = $1 WHERE id = $2 AND deleted_at IS NULL RETURNING ${DBCols()}`,
      [decision, id]
    );
    return result.rows.length ? rowToJson(result.rows[0]) : null;
  },

  async batchUpsert(requests: any[]) {
    const client = await getClient();
    try {
      await client.query("BEGIN");
      const results = [];
      for (const req of requests) {
        if (req.id) {
          const r = await client.query<VegRequestRow>(
            `UPDATE veg_requests SET title = $1, type = $2, client = $3, margin_estimate = $4, workload_md = $5 WHERE id = $6 AND deleted_at IS NULL RETURNING ${DBCols()}`,
            [req.title, req.type, req.client, req.marginEstimate || null, req.workloadMd || null, req.id]
          );
          if (r.rows.length) results.push(rowToJson(r.rows[0]));
        } else {
          const r = await client.query<VegRequestRow>(
            `INSERT INTO veg_requests (title, type, client, margin_estimate, workload_md) VALUES ($1, $2, $3, $4, $5) RETURNING ${DBCols()}`,
            [req.title, req.type, req.client, req.marginEstimate || null, req.workloadMd || null]
          );
          results.push(rowToJson(r.rows[0]));
        }
      }
      await client.query("COMMIT");
      return results;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  // Opportunities
  async getOpportunities(vegRequestId: string) {
    const result = await query<OpportunityRow>(
      "SELECT id, veg_request_id, name, value, sales_stage, contract_signed FROM opportunities WHERE veg_request_id = $1",
      [vegRequestId]
    );
    return result.rows;
  },

  async createOpportunity(vegRequestId: string, data: any) {
    const result = await query<OpportunityRow>(
      `INSERT INTO opportunities (veg_request_id, name, value, sales_stage) VALUES ($1, $2, $3, $4) RETURNING id, veg_request_id, name, value, sales_stage, contract_signed`,
      [vegRequestId, data.name, data.value || 0, data.salesStage || "PROSPECTING"]
    );
    return result.rows[0];
  },

  // Contracts
  async getContracts(opportunityId: string) {
    const result = await query<ContractRow>(
      "SELECT id, opportunity_id, title, start_date, end_date, sla_commitments, compliance_status, maintenance_saas FROM contracts WHERE opportunity_id = $1",
      [opportunityId]
    );
    return result.rows;
  },

  async createContract(opportunityId: string, data: any) {
    const result = await query<ContractRow>(
      `INSERT INTO contracts (opportunity_id, title, start_date, end_date, sla_commitments, compliance_status, maintenance_saas)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, opportunity_id, title, start_date, end_date, sla_commitments, compliance_status, maintenance_saas`,
      [opportunityId, data.title, data.startDate, data.endDate, data.slaCommitments || null, data.complianceStatus || "COMPLIANT", data.maintenanceSaaS || false]
    );
    return result.rows[0];
  },
};

function DBCols() {
  return DB_COLS.join(", ");
}
