import { apiClient } from "./client";

export const exportApi = {
  csv(dataset = "kpis") {
    return apiClient.get("/api/export/csv", {
      params: { dataset },
      responseType: "blob",
    });
  },
  pdf(dataset = "kpis") {
    return apiClient.get("/api/export/pdf", {
      params: { dataset },
      responseType: "blob",
    });
  },
};
