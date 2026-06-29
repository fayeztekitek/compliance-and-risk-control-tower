import { query } from "../config/database.js";
import { randomUUID } from "crypto";
import { NotFoundError } from "../core/errors.js";

const PL_COLS = [
  "id", "created_at", "updated_at", "title", "content",
  "category", "domain", "tags", "created_by", "is_favorite", "usage_count",
];

function plRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    title: r.title, content: r.content, category: r.category, domain: r.domain,
    tags: r.tags || [], createdBy: r.created_by,
    isFavorite: r.is_favorite, usageCount: r.usage_count,
  };
}

export const promptLibraryService = {
  async list(filters: {
    page: number; limit: number;
    category?: string; domain?: string; search?: string; favoriteOnly?: boolean;
  }) {
    const params: any[] = [];
    let idx = 1;
    const conds: string[] = [];

    if (filters.category) { conds.push(`category = $${idx++}`); params.push(filters.category); }
    if (filters.domain) { conds.push(`domain = $${idx++}`); params.push(filters.domain); }
    if (filters.favoriteOnly) { conds.push("is_favorite = TRUE"); }
    if (filters.search) {
      conds.push(`(title ILIKE $${idx} OR content ILIKE $${idx} OR $${idx} = ANY(tags))`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.limit;

    const countResult = await query(`SELECT COUNT(*) FROM prompt_library ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query(
      `SELECT ${PL_COLS.join(", ")} FROM prompt_library ${where} ORDER BY is_favorite DESC, usage_count DESC, created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, filters.limit, offset]
    );

    return { data: dataResult.rows.map(plRow), total, page: filters.page, limit: filters.limit };
  },

  async get(id: string) {
    const result = await query(`SELECT ${PL_COLS.join(", ")} FROM prompt_library WHERE id = $1`, [id]);
    if (!result.rows.length) throw new NotFoundError("Prompt", id);
    return plRow(result.rows[0]);
  },

  async create(data: {
    title: string; content: string; category?: string; domain?: string;
    tags?: string[]; createdBy?: string;
  }) {
    const id = randomUUID();
    const result = await query(
      `INSERT INTO prompt_library (id, title, content, category, domain, tags, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${PL_COLS.join(", ")}`,
      [id, data.title, data.content, data.category || "general", data.domain || null, data.tags || [], data.createdBy || null]
    );
    return plRow(result.rows[0]);
  },

  async update(id: string, data: {
    title?: string; content?: string; category?: string; domain?: string;
    tags?: string[]; isFavorite?: boolean;
  }) {
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const mapping: Record<string, string> = {
      title: "title", content: "content", category: "category",
      domain: "domain", tags: "tags", isFavorite: "is_favorite",
    };

    for (const [key, col] of Object.entries(mapping)) {
      if ((data as any)[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        params.push((data as any)[key]);
      }
    }
    if (!fields.length) return null;

    fields.push("updated_at = NOW()");
    params.push(id);
    const result = await query(
      `UPDATE prompt_library SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${PL_COLS.join(", ")}`,
      params
    );
    if (!result.rows.length) throw new NotFoundError("Prompt", id);
    return plRow(result.rows[0]);
  },

  async delete(id: string) {
    const result = await query("DELETE FROM prompt_library WHERE id = $1 RETURNING id", [id]);
    if (!result.rows.length) throw new NotFoundError("Prompt", id);
  },

  async incrementUsage(id: string) {
    await query("UPDATE prompt_library SET usage_count = usage_count + 1 WHERE id = $1", [id]);
  },

  async toggleFavorite(id: string) {
    const result = await query(
      `UPDATE prompt_library SET is_favorite = NOT is_favorite, updated_at = NOW() WHERE id = $1 RETURNING ${PL_COLS.join(", ")}`,
      [id]
    );
    if (!result.rows.length) throw new NotFoundError("Prompt", id);
    return plRow(result.rows[0]);
  },

  async getCategories() {
    const result = await query("SELECT category, COUNT(*)::int as count FROM prompt_library GROUP BY category ORDER BY count DESC");
    return result.rows.map(r => ({ category: r.category, count: r.count }));
  },

  async getDomains() {
    const result = await query("SELECT domain, COUNT(*)::int as count FROM prompt_library WHERE domain IS NOT NULL GROUP BY domain ORDER BY count DESC");
    return result.rows.map(r => ({ domain: r.domain, count: r.count }));
  },
};
