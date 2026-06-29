import { apiClient } from "./client";

export interface Prompt {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  content: string;
  category: string;
  domain: string | null;
  tags: string[];
  createdBy: string | null;
  isFavorite: boolean;
  usageCount: number;
}

export interface PromptListParams {
  page?: number;
  limit?: number;
  category?: string;
  domain?: string;
  search?: string;
  favoriteOnly?: boolean;
}

export interface PromptCategory {
  category: string;
  count: number;
}

export interface PromptDomain {
  domain: string;
  count: number;
}

export interface PromptCreate {
  title: string;
  content: string;
  category?: string;
  domain?: string;
  tags?: string[];
}

export interface PromptUpdate {
  title?: string;
  content?: string;
  category?: string;
  domain?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export const promptsApi = {
  list(params?: PromptListParams) {
    return apiClient.get<{ data: Prompt[]; total: number; page: number; limit: number }>("/api/prompts", { params });
  },

  get(id: string) {
    return apiClient.get<Prompt>(`/api/prompts/${id}`);
  },

  create(data: PromptCreate) {
    return apiClient.post<Prompt>("/api/prompts", data);
  },

  update(id: string, data: PromptUpdate) {
    return apiClient.patch<Prompt>(`/api/prompts/${id}`, data);
  },

  delete(id: string) {
    return apiClient.delete(`/api/prompts/${id}`);
  },

  incrementUsage(id: string) {
    return apiClient.post(`/api/prompts/${id}/use`);
  },

  toggleFavorite(id: string) {
    return apiClient.post<Prompt>(`/api/prompts/${id}/favorite`);
  },

  getCategories() {
    return apiClient.get<{ data: PromptCategory[] }>("/api/prompts/categories");
  },

  getDomains() {
    return apiClient.get<{ data: PromptDomain[] }>("/api/prompts/domains");
  },
};
