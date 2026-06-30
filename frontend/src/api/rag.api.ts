import { apiClient } from "./client";

export interface RagResult {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  score: number;
}

export const ragApi = {
  async search(params: { query: string; topK?: number; category?: string }) {
    const { data } = await apiClient.post<{ data: RagResult[] }>("/api/rag/search", params);
    return data.data;
  },

  async reembedAll() {
    const { data } = await apiClient.post<{ data: { reembedded: number } }>("/api/rag/reembed");
    return data.data;
  },
};
