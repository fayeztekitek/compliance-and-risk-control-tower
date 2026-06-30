import { query } from "../../config/database.js";
import { embeddingService } from "./embedding.service.js";
import { logger } from "../../core/logger.js";

export interface RagChunk {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  score: number;
}

const KB_INCLUDE_COLS = ["id", "title", "content", "category", "tags", "embedding"];

function rowToChunk(row: any, score: number): RagChunk {
  return {
    id: row.id, title: row.title, content: row.content,
    category: row.category, tags: row.tags || [], score,
  };
}

async function keywordSearch(queryText: string, limit: number) {
  const result = await query(
    `SELECT ${KB_INCLUDE_COLS.join(", ")} FROM knowledge_base
     WHERE content ILIKE $1 OR title ILIKE $1 OR $2 = ANY(tags)
     ORDER BY created_at DESC LIMIT $3`,
    [`%${queryText}%`, queryText, limit]
  );
  return result.rows;
}

async function allWithEmbeddings() {
  const result = await query(
    `SELECT ${KB_INCLUDE_COLS.join(", ")} FROM knowledge_base WHERE embedding IS NOT NULL`
  );
  return result.rows;
}

export const ragService = {
  async search(queryText: string, options: {
    topK?: number;
    minScore?: number;
    category?: string;
  } = {}): Promise<RagChunk[]> {
    const { topK = 5, minScore = 0.0, category } = options;

    const queryEmbedding = await embeddingService.generate(queryText);
    if (!queryEmbedding) {
      logger.warn("No embedding available — falling back to keyword search");
      const rows = await keywordSearch(queryText, topK);
      return rows.map(r => rowToChunk(r, 0.5));
    }

    const rows = await allWithEmbeddings();
    if (rows.length === 0) {
      const rows2 = await keywordSearch(queryText, topK);
      return rows2.map(r => rowToChunk(r, 0.5));
    }

    const scored: { row: any; vecScore: number }[] = [];
    for (const row of rows) {
      if (category && row.category !== category) continue;
      const emb = row.embedding;
      if (!emb) continue;
      const vec = typeof emb === "string" ? JSON.parse(emb) : emb;
      const vecScore = embeddingService.cosineSimilarity(queryEmbedding, vec);
      scored.push({ row, vecScore });
    }

    scored.sort((a, b) => b.vecScore - a.vecScore);

    const keywordResults = await keywordSearch(queryText, topK);
    const keywordMap = new Map<string, number>();
    for (const kr of keywordResults) {
      keywordMap.set(kr.id, 0.3);
    }

    const merged = new Map<string, { chunk: RagChunk; score: number }>();
    const keywordBoost = 0.15;

    for (const { row, vecScore } of scored) {
      if (vecScore < minScore) continue;
      const boost = keywordMap.has(row.id) ? keywordBoost : 0;
      const finalScore = vecScore + boost;
      merged.set(row.id, {
        chunk: rowToChunk(row, finalScore),
        score: finalScore,
      });
    }

    for (const kr of keywordResults) {
      if (!merged.has(kr.id)) {
        merged.set(kr.id, {
          chunk: rowToChunk(kr, 0.3),
          score: 0.3,
        });
      }
    }

    return [...merged.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.chunk);
  },

  async buildContext(queryText: string, options: {
    topK?: number;
    minScore?: number;
    category?: string;
    maxChars?: number;
  } = {}): Promise<{ context: string; chunks: RagChunk[] }> {
    const { maxChars = 4000 } = options;
    const chunks = await this.search(queryText, options);

    if (chunks.length === 0) return { context: "", chunks: [] };

    const parts: string[] = [];
    let totalChars = 0;

    for (const chunk of chunks) {
      const entry = `[${chunk.category}] ${chunk.title}:\n${chunk.content.substring(0, 800)}`;
      if (totalChars + entry.length > maxChars) break;
      parts.push(entry);
      totalChars += entry.length;
    }

    const context = parts.length
      ? `Relevant knowledge base context:\n\n${parts.join("\n\n")}`
      : "";

    return { context, chunks };
  },

  async reembedAll(): Promise<number> {
    const result = await query("SELECT id, title, content FROM knowledge_base");
    let count = 0;
    for (const row of result.rows) {
      const text = `${row.title}\n${row.content}`;
      const embedding = await embeddingService.generate(text);
      if (embedding) {
        await query("UPDATE knowledge_base SET embedding = $1 WHERE id = $2", [JSON.stringify(embedding), row.id]);
        count++;
      }
    }
    return count;
  },
};
