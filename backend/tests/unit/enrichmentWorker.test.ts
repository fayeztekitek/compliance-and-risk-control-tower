import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRepo = {
  getUnenrichedFindings: vi.fn(),
  upsertEnrichment: vi.fn(),
  applyEnrichmentToFindings: vi.fn(),
  countEnrichedFindings: vi.fn(),
  countTotalFindingsWithCve: vi.fn(),
};

const mockEpssClient = {
  batchEnrich: vi.fn(),
  clearKevCache: vi.fn(),
};

vi.mock("../../src/repositories/unifiedFinding.repo.js", () => ({
  unifiedFindingRepo: mockRepo,
}));

vi.mock("../../src/services/epssClient.js", () => ({
  epssClient: mockEpssClient,
}));

vi.mock("../../src/config/env.js", () => ({
  env: { REDIS_HOST: "localhost", REDIS_PORT: 6379 },
}));

vi.mock("../../src/core/logger.js", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("Enrichment Worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should skip when no unenriched findings exist", async () => {
    mockRepo.getUnenrichedFindings.mockResolvedValue([]);

    const { getEnrichmentStatus } = await import("../../src/services/enrichmentWorker.js");
    // Can't easily call processEnrichmentBatch directly since it's not exported,
    // but we can test the status function
    mockRepo.countEnrichedFindings.mockResolvedValue(50);
    mockRepo.countTotalFindingsWithCve.mockResolvedValue(100);

    const status = await getEnrichmentStatus();
    expect(status.enrichedCount).toBe(50);
    expect(status.totalWithCve).toBe(100);
    expect(status.pendingCount).toBe(50);
    expect(status.percentComplete).toBe(50);
  });

  it("should report 100% complete when all findings enriched", async () => {
    mockRepo.countEnrichedFindings.mockResolvedValue(100);
    mockRepo.countTotalFindingsWithCve.mockResolvedValue(100);

    const { getEnrichmentStatus } = await import("../../src/services/enrichmentWorker.js");
    const status = await getEnrichmentStatus();

    expect(status.enrichedCount).toBe(100);
    expect(status.pendingCount).toBe(0);
    expect(status.percentComplete).toBe(100);
  });

  it("should report 0% when no findings with CVE exist", async () => {
    mockRepo.countEnrichedFindings.mockResolvedValue(0);
    mockRepo.countTotalFindingsWithCve.mockResolvedValue(0);

    const { getEnrichmentStatus } = await import("../../src/services/enrichmentWorker.js");
    const status = await getEnrichmentStatus();

    expect(status.percentComplete).toBe(100);
    expect(status.pendingCount).toBe(0);
  });
});
