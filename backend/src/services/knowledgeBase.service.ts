import { query } from "../config/database.js";
import { randomUUID } from "crypto";
import { NotFoundError } from "../core/errors.js";
import { embeddingService } from "./ai/embedding.service.js";
import { logger } from "../core/logger.js";

const KB_COLS = [
  "id", "created_at", "updated_at", "title", "content",
  "category", "tags", "source_url", "source_type",
  "created_by", "file_name", "file_size", "mime_type",
];

function kbRow(r: any) {
  return {
    id: r.id, createdAt: r.created_at, updatedAt: r.updated_at,
    title: r.title, content: r.content, category: r.category,
    tags: r.tags || [], sourceUrl: r.source_url, sourceType: r.source_type,
    createdBy: r.created_by, fileName: r.file_name,
    fileSize: r.file_size, mimeType: r.mime_type,
  };
}

export const knowledgeBaseService = {
  async list(filters: {
    page: number; limit: number;
    category?: string; search?: string;
  }) {
    const params: any[] = [];
    let idx = 1;
    const conds: string[] = [];

    if (filters.category) { conds.push(`category = $${idx++}`); params.push(filters.category); }
    if (filters.search) {
      conds.push(`(title ILIKE $${idx} OR content ILIKE $${idx} OR $${idx} = ANY(tags))`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    const where = conds.length ? `WHERE ${conds.join(" AND ")}` : "";
    const offset = (filters.page - 1) * filters.limit;

    const countResult = await query(`SELECT COUNT(*) FROM knowledge_base ${where}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await query(
      `SELECT ${KB_COLS.join(", ")} FROM knowledge_base ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, filters.limit, offset]
    );

    return { data: dataResult.rows.map(kbRow), total, page: filters.page, limit: filters.limit };
  },

  async getById(id: string) {
    const result = await query(`SELECT ${KB_COLS.join(", ")} FROM knowledge_base WHERE id = $1`, [id]);
    if (!result.rows.length) throw new NotFoundError("Knowledge base entry not found");
    return kbRow(result.rows[0]);
  },

  async create(payload: {
    title: string; content: string; category: string;
    tags?: string[]; sourceUrl?: string; sourceType?: string;
    createdBy?: string; fileName?: string; fileSize?: number; mimeType?: string;
  }) {
    const id = `kb_${randomUUID().slice(0, 8)}`;
    const result = await query(
      `INSERT INTO knowledge_base (id, title, content, category, tags, source_url, source_type, created_by, file_name, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING ${KB_COLS.join(", ")}`,
      [id, payload.title, payload.content, payload.category || "general",
       payload.tags || [], payload.sourceUrl || null, payload.sourceType || "manual",
       payload.createdBy || null, payload.fileName || null,
       payload.fileSize || null, payload.mimeType || null]
    );
    const row = result.rows[0];
    this.generateEmbedding(row.id, `${row.title}\n${row.content}`);
    return kbRow(row);
  },

  async update(id: string, payload: Partial<{
    title: string; content: string; category: string;
    tags: string[]; sourceUrl: string; sourceType: string;
    fileName: string; fileSize: number; mimeType: string;
  }>) {
    const existing = await this.getById(id);
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    for (const [key, col] of Object.entries({
      title: "title", content: "content", category: "category",
      tags: "tags", source_url: "source_url", source_type: "source_type",
      file_name: "file_name", file_size: "file_size", mime_type: "mime_type",
    })) {
      if ((payload as any)[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        params.push((payload as any)[key]);
      }
    }

    if (!fields.length) return existing;

    fields.push("updated_at = NOW()");
    params.push(id);

    const result = await query(
      `UPDATE knowledge_base SET ${fields.join(", ")} WHERE id = $${idx} RETURNING ${KB_COLS.join(", ")}`,
      params
    );
    const row = result.rows[0];
    const titleChanged = payload.title !== undefined;
    const contentChanged = payload.content !== undefined;
    if (titleChanged || contentChanged) {
      this.generateEmbedding(id, `${row.title}\n${row.content}`);
    }
    return kbRow(row);
  },

  async delete(id: string) {
    await this.getById(id);
    await query("DELETE FROM knowledge_base WHERE id = $1", [id]);
  },

  async generateEmbedding(id: string, text: string) {
    try {
      const embedding = await embeddingService.generate(text);
      if (embedding) {
        await query("UPDATE knowledge_base SET embedding = $1 WHERE id = $2", [JSON.stringify(embedding), id]);
      }
    } catch (err) {
      logger.warn({ err, id }, "Failed to generate embedding for knowledge base entry");
    }
  },

  async getCategories() {
    const result = await query("SELECT DISTINCT category FROM knowledge_base ORDER BY category");
    return result.rows.map(r => r.category);
  },
};
