import { query } from "../config/database.js";

const FC_COLS = [
  "id", "created_at", "updated_at",
  "group_id", "artifact_id", "version",
  "package_url", "hash", "license_type", "component_name",
];

function fcRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    groupId: r.group_id, artifactId: r.artifact_id, version: r.version,
    packageUrl: r.package_url, hash: r.hash,
    licenseType: r.license_type, componentName: r.component_name,
  };
}

export const findingComponentRepo = {
  async list(filters: { page: number; limit: number; search?: string }) {
    const params: any[] = [];
    let idx = 1;
    const conds: string[] = [];

    if (filters.search) {
      conds.push(`(component_name ILIKE $${idx++} OR package_url ILIKE $${idx++})`);
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.limit;

    const countResult = await query<{ count: string }>(`SELECT COUNT(*) FROM finding_components ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query(
      `SELECT ${FC_COLS.join(", ")} FROM finding_components ${where} ORDER BY component_name ASC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, filters.limit, offset]
    );

    return { data: dataResult.rows.map(fcRow), total, page: filters.page, limit: filters.limit };
  },

  async get(id: string) {
    const result = await query(
      `SELECT ${FC_COLS.join(", ")} FROM finding_components WHERE id = $1`,
      [id]
    );
    return result.rows.length ? fcRow(result.rows[0]) : null;
  },

  async findByCoordinates(groupId: string, artifactId: string, version: string) {
    const result = await query(
      `SELECT ${FC_COLS.join(", ")} FROM finding_components WHERE group_id = $1 AND artifact_id = $2 AND version = $3`,
      [groupId, artifactId, version]
    );
    return result.rows.length ? fcRow(result.rows[0]) : null;
  },

  async findByPurl(packageUrl: string) {
    const result = await query(
      `SELECT ${FC_COLS.join(", ")} FROM finding_components WHERE package_url = $1`,
      [packageUrl]
    );
    return result.rows.length ? fcRow(result.rows[0]) : null;
  },

  async create(data: {
    groupId?: string; artifactId?: string; version: string;
    packageUrl?: string; hash?: string; licenseType?: string; componentName?: string;
  }) {
    const existing = data.groupId && data.artifactId && data.version
      ? await this.findByCoordinates(data.groupId, data.artifactId, data.version)
      : data.packageUrl ? await this.findByPurl(data.packageUrl)
      : null;
    if (existing) return existing;

    const result = await query(
      `INSERT INTO finding_components (group_id, artifact_id, version, package_url, hash, license_type, component_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (group_id, artifact_id, version) DO UPDATE SET
         package_url = EXCLUDED.package_url,
         hash = EXCLUDED.hash,
         license_type = EXCLUDED.license_type,
         component_name = EXCLUDED.component_name
       RETURNING ${FC_COLS.join(", ")}`,
      [data.groupId || null, data.artifactId || null, data.version,
       data.packageUrl || null, data.hash || null, data.licenseType || null, data.componentName || null]
    );
    return fcRow(result.rows[0]);
  },

  async update(id: string, data: {
    packageUrl?: string; hash?: string; licenseType?: string; componentName?: string;
  }) {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      packageUrl: "package_url", hash: "hash",
      licenseType: "license_type", componentName: "component_name",
    };

    for (const [key, col] of Object.entries(mapping)) {
      if (data[key as keyof typeof data] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        params.push(data[key as keyof typeof data]);
      }
    }
    if (!fields.length) return null;

    params.push(id);
    const result = await query(
      `UPDATE finding_components SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${FC_COLS.join(", ")}`,
      params
    );
    return result.rows.length ? fcRow(result.rows[0]) : null;
  },

  async delete(id: string) {
    await query("DELETE FROM finding_components WHERE id = $1", [id]);
  },

  async getTopVulnerable(limit = 20, filters?: {
    search?: string; minSeverity?: string;
  }) {
    const params: any[] = [];
    let idx = 1;
    const conds: string[] = [];

    if (filters?.search) {
      conds.push(`(fc.component_name ILIKE $${idx} OR fc.package_url ILIKE $${idx})`);
      params.push(`%${filters.search}%`);
      idx++;
    }
    if (filters?.minSeverity) {
      conds.push(`uf.severity IN (${filters.minSeverity.split(",").map(() => `$${idx++}`).join(",")})`);
      params.push(...filters.minSeverity.split(",").map(s => s.trim().toUpperCase()));
    }

    const where = conds.length ? `AND ${conds.join(" AND ")}` : "";

    const result = await query(
      `SELECT fc.id, fc.component_name, fc.group_id, fc.artifact_id, fc.version,
              fc.package_url, fc.license_type,
              COUNT(DISTINCT fo.finding_id)::int as finding_count,
              COUNT(fo.id)::int as occurrence_count,
              COUNT(DISTINCT uf.application_id)::int as affected_apps,
              MAX(uf.severity) as max_severity,
              BOOL_OR(uf.is_critical) as has_critical
       FROM finding_components fc
       JOIN finding_occurrences fo ON fo.component_id = fc.id
       JOIN unified_findings uf ON uf.id = fo.finding_id
       WHERE fo.occurrence_status = 'ACTIVE' ${where}
       GROUP BY fc.id, fc.component_name, fc.group_id, fc.artifact_id, fc.version,
                fc.package_url, fc.license_type
       ORDER BY occurrence_count DESC
       LIMIT $${idx}`,
      [...params, limit]
    );
    return result.rows.map(r => ({
      id: r.id, componentName: r.component_name,
      groupId: r.group_id, artifactId: r.artifact_id, version: r.version,
      packageUrl: r.package_url, licenseType: r.license_type,
      findingCount: r.finding_count, occurrenceCount: r.occurrence_count,
      affectedApps: r.affected_apps, maxSeverity: r.max_severity,
      hasCritical: r.has_critical,
    }));
  },

  async getComponentDetail(id: string) {
    const result = await query(
      `SELECT fc.*,
              COUNT(DISTINCT fo.finding_id)::int as finding_count,
              COUNT(fo.id)::int as occurrence_count,
              COUNT(DISTINCT uf.application_id)::int as affected_apps,
              json_agg(DISTINCT jsonb_build_object(
                'id', uf.id, 'title', uf.title, 'severity', uf.severity,
                'application_id', uf.application_id, 'scanner_source', uf.scanner_source
              )) FILTER (WHERE uf.id IS NOT NULL) as findings
       FROM finding_components fc
       LEFT JOIN finding_occurrences fo ON fo.component_id = fc.id
       LEFT JOIN unified_findings uf ON uf.id = fo.finding_id
       WHERE fc.id = $1
       GROUP BY fc.id`,
      [id]
    );
    if (!result.rows.length) return null;
    const r = result.rows[0];
    return {
      ...fcRow(r),
      findingCount: r.finding_count, occurrenceCount: r.occurrence_count,
      affectedApps: r.affected_apps,
      findings: r.findings?.filter((f: any) => f.id !== null) || [],
    };
  },

  async listByFinding(findingId: string, filters: { page: number; limit: number }) {
    const offset = (filters.page - 1) * filters.limit;

    const countResult = await query(
      `SELECT COUNT(DISTINCT fc.id)::int as count
       FROM finding_components fc
       JOIN finding_occurrences fo ON fo.component_id = fc.id
       WHERE fo.finding_id = $1`,
      [findingId]
    );
    const total = countResult.rows[0]?.count || 0;

    const dataResult = await query(
      `SELECT DISTINCT fc.${FC_COLS.join(", fc.")}
       FROM finding_components fc
       JOIN finding_occurrences fo ON fo.component_id = fc.id
       WHERE fo.finding_id = $1
       ORDER BY fc.component_name ASC
       LIMIT $2 OFFSET $3`,
      [findingId, filters.limit, offset]
    );

    return { data: dataResult.rows.map(fcRow), total, page: filters.page, limit: filters.limit };
  },
};
