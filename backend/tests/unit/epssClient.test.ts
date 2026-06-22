import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch as any;

let epssClient: any;

describe("epssClient", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    vi.resetModules();
    const mod = await import("../../src/services/epssClient.js");
    epssClient = mod.epssClient;
    epssClient.clearKevCache();
  });

  it("should return enrichment data for a known CVE", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("first.org/epss")) {
        return {
          ok: true,
          json: async () => ({
            data: [{ cve: "CVE-2024-21626", epss: "0.92340", percentile: "0.99980", date: "2024-08-26" }],
            meta: { total: 1, page: 1, size: 1 },
          }),
        };
      }
      if (url.includes("cisa.gov")) {
        return {
          ok: true,
          json: async () => ({
            title: "KEV", catalogVersion: "1.0", dateReleased: "2024-01-01", count: 1,
            vulnerabilities: [{ cveID: "CVE-2024-21626", vendorProject: "Docker", product: "runC", vulnerabilityName: "runc container breakout", dateAdded: "2024-02-01", shortDescription: "Critical container escape", requiredAction: "Update", dueDate: "2024-03-01", knownRansomwareCampaignUse: "No", notes: "", cwes: ["CWE-273"] }],
          }),
        };
      }
      return { ok: false };
    });

    const result = await epssClient.enrichCve("CVE-2024-21626");

    expect(result.epssScore).toBeCloseTo(0.9234, 4);
    expect(result.epssPercentile).toBeCloseTo(0.9998, 4);
    expect(result.cisaKev).toBe(true);
    expect(result.cisaKevDate).toBe("2024-02-01");
    expect(result.cisaKevDescription).toBe("Critical container escape");
  });

  it("should return zeros for unknown CVE", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("first.org/epss")) {
        return { ok: true, json: async () => ({ data: [], meta: { total: 0, page: 1, size: 50 } }) };
      }
      return { ok: true, json: async () => ({ title: "KEV", catalogVersion: "1.0", dateReleased: "2024-01-01", count: 0, vulnerabilities: [] }) };
    });

    const result = await epssClient.enrichCve("CVE-2024-99999");

    expect(result.epssScore).toBe(0);
    expect(result.epssPercentile).toBe(0);
    expect(result.cisaKev).toBe(false);
    expect(result.cisaKevDate).toBeNull();
  });

  it("should handle API errors gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const result = await epssClient.enrichCve("CVE-2024-21626");

    expect(result.epssScore).toBe(0);
    expect(result.cisaKev).toBe(false);
  });

  it("should batch enrich multiple CVEs", async () => {
    const epssCalls: string[] = [];
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("first.org/epss")) {
        epssCalls.push(url);
        return { ok: true, json: async () => ({ data: [{ cve: "CVE-2024-1111", epss: "0.50000", percentile: "0.80000", date: "2024-08-26" }, { cve: "CVE-2024-2222", epss: "0.10000", percentile: "0.60000", date: "2024-08-26" }], meta: { total: 2, page: 1, size: 50 } }) };
      }
      return { ok: true, json: async () => ({ title: "KEV", catalogVersion: "1.0", dateReleased: "2024-01-01", count: 0, vulnerabilities: [] }) };
    });

    const result = await epssClient.batchEnrich(["CVE-2024-1111", "CVE-2024-2222"]);

    expect(result.size).toBe(2);
    expect(result.get("CVE-2024-1111")?.epssScore).toBeCloseTo(0.5, 1);
    expect(result.get("CVE-2024-2222")?.epssScore).toBeCloseTo(0.1, 1);
    expect(epssCalls.length).toBe(1);
  });

  it("should cache KEV catalog across calls", async () => {
    let kevFetchCount = 0;
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("first.org/epss")) {
        return { ok: true, json: async () => ({ data: [], meta: { total: 0, page: 1, size: 50 } }) };
      }
      kevFetchCount++;
      return { ok: true, json: async () => ({ title: "KEV", catalogVersion: "1.0", dateReleased: "2024-01-01", count: 1, vulnerabilities: [{ cveID: "CVE-2024-21626", vendorProject: "Docker", product: "runC", vulnerabilityName: "runc container breakout", dateAdded: "2024-02-01", shortDescription: "Critical container escape", requiredAction: "Update", dueDate: "2024-03-01", knownRansomwareCampaignUse: "No", notes: "", cwes: ["CWE-273"] }] }) };
    });

    await epssClient.enrichCve("CVE-2024-21626");
    await epssClient.enrichCve("CVE-2024-1111");

    expect(kevFetchCount).toBe(1);
  });
});
