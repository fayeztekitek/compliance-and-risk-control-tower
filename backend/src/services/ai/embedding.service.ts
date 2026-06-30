import { env } from "../../config/env.js";
import { logger } from "../../core/logger.js";

let genai: any = null;
try {
  const { GoogleGenAI } = await import("@google/genai");
  genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
} catch (err) {
  logger.warn({ err }, "Failed to initialize Google GenAI SDK for embeddings — mock fallback enabled");
}

const EMBEDDING_MODEL = "text-embedding-004";

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export const embeddingService = {
  async generate(text: string): Promise<number[] | null> {
    if (!genai || !env.GEMINI_API_KEY) return this.mockEmbedding(text);

    try {
      const result = await genai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
      });
      if (result?.embedding?.values) return result.embedding.values;
      logger.warn("No embedding values returned from Gemini");
      return null;
    } catch (err) {
      logger.error({ err }, "Gemini embedding API call failed — falling back to mock");
      return this.mockEmbedding(text);
    }
  },

  async generateBatch(texts: string[]): Promise<(number[] | null)[]> {
    if (!genai || !env.GEMINI_API_KEY) return texts.map(t => this.mockEmbedding(t));

    try {
      const requests = texts.map(text => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
      }));
      const result = await genai.models.batchEmbedContents({
        model: EMBEDDING_MODEL,
        requests,
      });
      if (result?.embeddings) {
        return result.embeddings.map((e: any) => e.values || null);
      }
      return texts.map(() => null);
    } catch (err) {
      logger.error({ err }, "Gemini batch embedding API call failed — falling back to mock");
      return texts.map(t => this.mockEmbedding(t));
    }
  },

  mockEmbedding(text: string): number[] {
    const dims = 4;
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);
    const arr: number[] = [];
    for (let i = 0; i < dims; i++) {
      arr.push(Math.sin(seed * (i + 1)) * 0.5 + 0.5);
    }
    return arr;
  },

  cosineSimilarity,
};
