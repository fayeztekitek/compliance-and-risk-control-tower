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
};
