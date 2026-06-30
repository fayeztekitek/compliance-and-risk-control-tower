import { apiClient } from "./client";

export interface KbEntry {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  sourceUrl?: string;
  sourceType: string;
  createdBy?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

export interface KbListResponse {
  data: KbEntry[];
  total: number;
  page: number;
  limit: number;
}

export const knowledgeBaseApi = {
  async list(params: { page?: number; limit?: number; category?: string; search?: string }) {
    const { data } = await apiClient.get<KbListResponse>("/api/knowledge-base", { params });
    return data;
  },

  async getById(id: string) {
    const { data } = await apiClient.get<{ data: KbEntry }>(`/api/knowledge-base/${id}`);
    return data.data;
  },

  async create(payload: {
    title: string; content: string; category: string;
    tags?: string[]; sourceUrl?: string; createdBy?: string;
  }) {
    const { data } = await apiClient.post<{ data: KbEntry }>("/api/knowledge-base", payload);
    return data.data;
  },

  async update(id: string, payload: Partial<KbEntry>) {
    const { data } = await apiClient.put<{ data: KbEntry }>(`/api/knowledge-base/${id}`, payload);
    return data.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/api/knowledge-base/${id}`);
  },

  async getCategories() {
    const { data } = await apiClient.get<{ data: string[] }>("/api/knowledge-base/categories");
    return data.data;
  },
};
