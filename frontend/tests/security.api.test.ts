import { describe, it, expect } from "vitest";
import { securityApi } from "../src/api/security.api";
import { apiClient } from "../src/api/client";

vi.mock("../src/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import { vi } from "vitest";

describe("Security API Client", () => {
  it("listVulnerabilities calls GET with params", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { data: [], total: 0, page: 1, limit: 20 } });
    const result = await securityApi.listVulnerabilities({ severity: "HIGH" });
    expect(result.data.total).toBe(0);
    expect(apiClient.get).toHaveBeenCalledWith("/api/security/vulnerabilities", { params: { severity: "HIGH" } });
  });

  it("createVulnerability calls POST", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { data: { id: "v1" } } });
    const result = await securityApi.createVulnerability({ title: "XSS", severity: "HIGH", sourceScanner: "VERACODE", slaDueDate: "2026-09-01" });
    expect(result.data.data.id).toBe("v1");
  });

  it("setFalsePositive calls POST with explanation", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { data: { status: "FALSE_POSITIVE" } } });
    const result = await securityApi.setFalsePositive("v1", "Not exploitable");
    expect(result.data.data.status).toBe("FALSE_POSITIVE");
    expect(apiClient.post).toHaveBeenCalledWith("/api/security/vulnerabilities/v1/false-positive", { explanation: "Not exploitable" });
  });

  it("createWaiver calls POST", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { data: { id: "w1", status: "PENDING" } } });
    const result = await securityApi.createWaiver({ vulnerabilityId: "v1", title: "W", rationale: "R", expiryDate: "2026-12-31" });
    expect(result.data.data.status).toBe("PENDING");
  });

  it("approveWaiver calls PATCH", async () => {
    (apiClient.patch as any).mockResolvedValue({ data: { data: { status: "APPROVED" } } });
    const result = await securityApi.approveWaiver("w1");
    expect(result.data.data.status).toBe("APPROVED");
  });

  it("listSlaIncidents calls GET", async () => {
    (apiClient.get as any).mockResolvedValue({ data: { data: [{ id: "s1" }] } });
    const result = await securityApi.listSlaIncidents();
    expect(result.data.data).toHaveLength(1);
  });

  it("importScan calls POST", async () => {
    (apiClient.post as any).mockResolvedValue({ data: { data: { imported: 3, ids: ["a", "b", "c"] } } });
    const result = await securityApi.importScan([{ title: "Vuln 1" }]);
    expect(result.data.data.imported).toBe(3);
  });
});
