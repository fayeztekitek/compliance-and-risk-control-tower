import { query } from "../config/database.js";
import { logger } from "../core/logger.js";

function auditRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at,
    userId: r.user_id, userName: r.user_name, userRole: r.user_role,
    action: r.action, resourceType: r.resource_type, resourceId: r.resource_id,
    details: typeof r.details === "string" ? JSON.parse(r.details) : r.details,
    ipAddress: r.ip_address, userAgent: r.user_agent, statusCode: r.status_code,
  };
}

export const auditService = {
  async log(params: {
    userId?: string; userName?: string; userRole?: string;
    action: string; resourceType?: string; resourceId?: string;
    details?: any; ipAddress?: string; userAgent?: string; statusCode?: number;
  }) {
    try {
      await query(
        `INSERT INTO audit_log (user_id, user_name, user_role, action, resource_type, resource_id, details, ip_address, user_agent, status_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [params.userId || null, params.userName || null, params.userRole || null,
         params.action, params.resourceType || null, params.resourceId || null,
         JSON.stringify(params.details || {}), params.ipAddress || null,
         params.userAgent || null, params.statusCode || null]
      );
    } catch (err) {
      logger.warn({ err }, "Failed to write audit log");
    }
  },

  async list(params: {
    userId?: string; action?: string; resourceType?: string;
    page?: number; limit?: number;
  }) {
    const { page = 1, limit = 50 } = params;
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params.userId) { conditions.push(`user_id = $${idx++}`); values.push(params.userId); }
    if (params.action) { conditions.push(`action = $${idx++}`); values.push(params.action); }
    if (params.resourceType) { conditions.push(`resource_type = $${idx++}`); values.push(params.resourceType); }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    const countResult = await query(`SELECT COUNT(*) FROM audit_log ${where}`, values);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limit, offset]
    );

    return { data: dataResult.rows.map(auditRow), total, page, limit };
  },

  async getStats() {
    const total = await query("SELECT COUNT(*) FROM audit_log");
    const byAction = await query("SELECT action, COUNT(*) as count FROM audit_log GROUP BY action ORDER BY count DESC LIMIT 10");
    const byResource = await query("SELECT resource_type, COUNT(*) as count FROM audit_log WHERE resource_type IS NOT NULL GROUP BY resource_type ORDER BY count DESC LIMIT 10");
    const recent = await query("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 5");
    return {
      total: parseInt(total.rows[0].count, 10),
      byAction: byAction.rows,
      byResource: byResource.rows,
      recent: recent.rows.map(auditRow),
    };
  },
};
