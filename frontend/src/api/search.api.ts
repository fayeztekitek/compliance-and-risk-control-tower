import apiClient from "./client";

export interface SearchResultItem {
  type: string;
  id: string;
  label: string;
  sublabel: string;
  path: string;
  badge?: string;
}

export async function globalSearch(q: string, limit = 8): Promise<SearchResultItem[]> {
  const { data } = await apiClient.get<{ data: SearchResultItem[] }>("/api/search", {
    params: { q, limit },
  });
  return data.data;
}
