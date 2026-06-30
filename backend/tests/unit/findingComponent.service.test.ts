import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindingComponentRepo = {
  list: vi.fn(),
  get: vi.fn(),
  findByCoordinates: vi.fn(),
  findByPurl: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

vi.mock("../../src/repositories/findingComponent.repo.js", () => ({
  findingComponentRepo: mockFindingComponentRepo,
}));

describe("FindingComponent Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list components", async () => {
    const expected = { data: [], total: 0, page: 1, limit: 20 };
    mockFindingComponentRepo.list.mockResolvedValue(expected);

    const { findingComponentService } = await import("../../src/services/findingComponent.service.js");
    const result = await findingComponentService.listComponents({ page: 1, limit: 20 });

    expect(result).toEqual(expected);
    expect(mockFindingComponentRepo.list).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it("should get component by id", async () => {
    const expected = { id: "comp-1", componentName: "log4j" };
    mockFindingComponentRepo.get.mockResolvedValue(expected);

    const { findingComponentService } = await import("../../src/services/findingComponent.service.js");
    const result = await findingComponentService.getComponent("comp-1");

    expect(result.componentName).toBe("log4j");
  });

  it("should throw NotFoundError for unknown component", async () => {
    mockFindingComponentRepo.get.mockResolvedValue(null);

    const { findingComponentService } = await import("../../src/services/findingComponent.service.js");
    await expect(findingComponentService.getComponent("unknown")).rejects.toThrow();
  });

  it("should find by coordinates", async () => {
    const expected = { id: "comp-1", groupId: "org.apache", artifactId: "log4j", version: "2.14.0" };
    mockFindingComponentRepo.findByCoordinates.mockResolvedValue(expected);

    const { findingComponentService } = await import("../../src/services/findingComponent.service.js");
    const result = await findingComponentService.findByCoordinates("org.apache", "log4j", "2.14.0");

    expect(result.artifactId).toBe("log4j");
  });

  it("should create component", async () => {
    const data = { groupId: "org.apache", artifactId: "log4j", version: "2.14.0", componentName: "Log4j" };
    mockFindingComponentRepo.create.mockResolvedValue({ id: "comp-1", ...data });

    const { findingComponentService } = await import("../../src/services/findingComponent.service.js");
    const result = await findingComponentService.createComponent(data);

    expect(result.id).toBe("comp-1");
  });

  it("should update component", async () => {
    mockFindingComponentRepo.get.mockResolvedValue({ id: "comp-1" });
    mockFindingComponentRepo.update.mockResolvedValue({ id: "comp-1", licenseType: "Apache-2.0" });

    const { findingComponentService } = await import("../../src/services/findingComponent.service.js");
    const result = await findingComponentService.updateComponent("comp-1", { licenseType: "Apache-2.0" });

    expect(result!.licenseType).toBe("Apache-2.0");
  });

  it("should delete component", async () => {
    mockFindingComponentRepo.get.mockResolvedValue({ id: "comp-1" });

    const { findingComponentService } = await import("../../src/services/findingComponent.service.js");
    await findingComponentService.deleteComponent("comp-1");

    expect(mockFindingComponentRepo.delete).toHaveBeenCalledWith("comp-1");
  });
});
