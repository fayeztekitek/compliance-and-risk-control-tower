import { describe, it, expect } from "vitest";
import { vegApi } from "../src/api/veg.api";
import { apiClient } from "../src/api/client";

vi.mock("../src/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import { vi } from "vitest";

describe("VEG API Client", () => {
  it("list should call GET /api/veg with params", async () => {
    const mockData = { data: [], total: 0, page: 1, limit: 20 };
    (apiClient.get as any).mockResolvedValue({ data: mockData });

    const result = await vegApi.list({ page: 1, limit: 10, search: "test" });
    expect(result.data).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith("/api/veg", { params: { page: 1, limit: 10, search: "test" } });
  });

  it("getById should call GET /api/veg/:id", async () => {
    const mockData = { data: { id: "abc", title: "Test" } };
    (apiClient.get as any).mockResolvedValue({ data: mockData });

    const result = await vegApi.getById("abc");
    expect(result.data.data.title).toBe("Test");
    expect(apiClient.get).toHaveBeenCalledWith("/api/veg/abc");
  });

  it("create should call POST /api/veg", async () => {
    const payload = { title: "New", type: "RFI" as const, client: "Client" };
    (apiClient.post as any).mockResolvedValue({ data: { data: { id: "1", ...payload } } });

    const result = await vegApi.create(payload);
    expect(result.data.data.id).toBe("1");
    expect(apiClient.post).toHaveBeenCalledWith("/api/veg", payload);
  });

  it("update should call PATCH /api/veg/:id", async () => {
    (apiClient.patch as any).mockResolvedValue({ data: { data: { id: "1", title: "Updated" } } });

    const result = await vegApi.update("1", { title: "Updated" });
    expect(result.data.data.title).toBe("Updated");
    expect(apiClient.patch).toHaveBeenCalledWith("/api/veg/1", { title: "Updated" });
  });

  it("delete should call DELETE /api/veg/:id", async () => {
    (apiClient.delete as any).mockResolvedValue({ data: { data: { success: true } } });

    const result = await vegApi.delete("1");
    expect(result.data.data.success).toBe(true);
    expect(apiClient.delete).toHaveBeenCalledWith("/api/veg/1");
  });

  it("signoff should call PATCH /api/veg/:id/signoff/:department", async () => {
    (apiClient.patch as any).mockResolvedValue({ data: { data: { id: "1", financeState: "APPROVED" } } });

    const result = await vegApi.signoff("1", "finance", "APPROVED");
    expect(result.data.data.financeState).toBe("APPROVED");
    expect(apiClient.patch).toHaveBeenCalledWith("/api/veg/1/signoff/finance", { state: "APPROVED" });
  });

  it("bidDecision should call PATCH /api/veg/:id/bid", async () => {
    (apiClient.patch as any).mockResolvedValue({ data: { data: { id: "1", bidDecision: "BID" } } });

    const result = await vegApi.bidDecision("1", "BID");
    expect(result.data.data.bidDecision).toBe("BID");
  });

  it("goNoGo should call PATCH /api/veg/:id/gonogo", async () => {
    (apiClient.patch as any).mockResolvedValue({ data: { data: { id: "1", goNoGoDecision: "GO" } } });

    const result = await vegApi.goNoGo("1", "GO");
    expect(result.data.data.goNoGoDecision).toBe("GO");
  });

  it("createOpportunity should call POST /api/veg/:id/opportunities", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { data: { id: "opp-1", name: "Test Opp", value: 100 } } });

    const result = await vegApi.createOpportunity("1", { name: "Test Opp", value: 100 });
    expect(result.data.data.name).toBe("Test Opp");
    expect(apiClient.post).toHaveBeenCalledWith("/api/veg/1/opportunities", { name: "Test Opp", value: 100 });
  });

  it("createContract should call POST /api/veg/opportunities/:oppId/contracts", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { data: { id: "ctr-1", title: "Test Contract" } } });

    const result = await vegApi.createContract("opp-1", { title: "Test Contract", start_date: "2024-01-01", end_date: "2024-12-31" });
    expect(result.data.data.title).toBe("Test Contract");
    expect(apiClient.post).toHaveBeenCalledWith("/api/veg/opportunities/opp-1/contracts", { title: "Test Contract", start_date: "2024-01-01", end_date: "2024-12-31" });
  });
});
