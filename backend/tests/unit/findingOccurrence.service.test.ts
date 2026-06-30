import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindingOccurrenceRepo = {
  list: vi.fn(),
  get: vi.fn(),
  listByFinding: vi.fn(),
  listByComponent: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getDistinctCount: vi.fn(),
  getTotalOccurrences: vi.fn(),
};

const mockUnifiedFindingRepo = {
  getFinding: vi.fn(),
};

const mockFindingComponentRepo = {
  get: vi.fn(),
};

vi.mock("../../src/repositories/findingOccurrence.repo.js", () => ({
  findingOccurrenceRepo: mockFindingOccurrenceRepo,
}));

vi.mock("../../src/repositories/unifiedFinding.repo.js", () => ({
  unifiedFindingRepo: mockUnifiedFindingRepo,
}));

describe("FindingOccurrence Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list occurrences", async () => {
    const expected = { data: [], total: 0, page: 1, limit: 20 };
    mockFindingOccurrenceRepo.list.mockResolvedValue(expected);

    const { findingOccurrenceService } = await import("../../src/services/findingOccurrence.service.js");
    const result = await findingOccurrenceService.listOccurrences({ page: 1, limit: 20 });

    expect(result).toEqual(expected);
  });

  it("should get occurrence by id", async () => {
    const expected = { id: "occ-1", findingId: "find-1", path: "/src/main" };
    mockFindingOccurrenceRepo.get.mockResolvedValue(expected);

    const { findingOccurrenceService } = await import("../../src/services/findingOccurrence.service.js");
    const result = await findingOccurrenceService.getOccurrence("occ-1");

    expect(result.path).toBe("/src/main");
  });

  it("should throw NotFoundError for unknown occurrence", async () => {
    mockFindingOccurrenceRepo.get.mockResolvedValue(null);

    const { findingOccurrenceService } = await import("../../src/services/findingOccurrence.service.js");
    await expect(findingOccurrenceService.getOccurrence("unknown")).rejects.toThrow();
  });

  it("should list by finding", async () => {
    mockUnifiedFindingRepo.getFinding.mockResolvedValue({ id: "find-1" });
    mockFindingOccurrenceRepo.listByFinding.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });

    const { findingOccurrenceService } = await import("../../src/services/findingOccurrence.service.js");
    await findingOccurrenceService.listByFinding("find-1", { page: 1, limit: 20 });

    expect(mockFindingOccurrenceRepo.listByFinding).toHaveBeenCalledWith("find-1", { page: 1, limit: 20 });
  });

  it("should throw for listByFinding with unknown finding", async () => {
    mockUnifiedFindingRepo.getFinding.mockResolvedValue(null);

    const { findingOccurrenceService } = await import("../../src/services/findingOccurrence.service.js");
    await expect(findingOccurrenceService.listByFinding("unknown", { page: 1, limit: 20 })).rejects.toThrow();
  });

  it("should create occurrence", async () => {
    mockUnifiedFindingRepo.getFinding.mockResolvedValue({ id: "find-1" });
    mockFindingOccurrenceRepo.create.mockResolvedValue({ id: "occ-1", findingId: "find-1" });

    const { findingOccurrenceService } = await import("../../src/services/findingOccurrence.service.js");
    const result = await findingOccurrenceService.createOccurrence({ findingId: "find-1" });

    expect(result.id).toBe("occ-1");
  });

  it("should get distinct count", async () => {
    mockFindingOccurrenceRepo.getDistinctCount.mockResolvedValue(5);

    const { findingOccurrenceService } = await import("../../src/services/findingOccurrence.service.js");
    const result = await findingOccurrenceService.getDistinctCount();

    expect(result).toBe(5);
  });

  it("should get total occurrences", async () => {
    mockFindingOccurrenceRepo.getTotalOccurrences.mockResolvedValue(15);

    const { findingOccurrenceService } = await import("../../src/services/findingOccurrence.service.js");
    const result = await findingOccurrenceService.getTotalOccurrences();

    expect(result).toBe(15);
  });

  it("should update occurrence", async () => {
    mockFindingOccurrenceRepo.get.mockResolvedValue({ id: "occ-1" });
    mockFindingOccurrenceRepo.update.mockResolvedValue({ id: "occ-1", occurrenceStatus: "FIXED" });

    const { findingOccurrenceService } = await import("../../src/services/findingOccurrence.service.js");
    const result = await findingOccurrenceService.updateOccurrence("occ-1", { occurrenceStatus: "FIXED" });

    expect(result!.occurrenceStatus).toBe("FIXED");
  });

  it("should delete occurrence", async () => {
    mockFindingOccurrenceRepo.get.mockResolvedValue({ id: "occ-1" });

    const { findingOccurrenceService } = await import("../../src/services/findingOccurrence.service.js");
    await findingOccurrenceService.deleteOccurrence("occ-1");

    expect(mockFindingOccurrenceRepo.delete).toHaveBeenCalledWith("occ-1");
  });
});
