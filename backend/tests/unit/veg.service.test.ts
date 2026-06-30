import { describe, it, expect, vi } from "vitest";
import { vegService } from "../../src/services/veg.service";

vi.mock("../../src/repositories/veg.repo", () => ({
  vegRepo: {
    list: vi.fn().mockResolvedValue({ data: [{ id: "1", title: "Test" }], total: 1, page: 1, limit: 20 }),
    getById: vi.fn().mockImplementation((id: string) =>
      id === "known-id"
        ? { id: "known-id", title: "Known", status: "DRAFT", financeState: "PENDING", salesState: "PENDING", productState: "PENDING", legalState: "PENDING", bidDecision: "PENDING", goNoGoDecision: "PENDING" }
        : null
    ),
    create: vi.fn().mockImplementation((data: any) => ({ id: "new-id", ...data, status: "DRAFT" })),
    update: vi.fn().mockImplementation((id: string, data: any) => ({ id, ...data })),
    softDelete: vi.fn().mockResolvedValue(true),
    updateDepartmentSignoff: vi.fn().mockImplementation((id: string, dept: string, state: string) => ({
      id, financeState: dept === "finance" ? state : "PENDING",
      salesState: dept === "sales" ? state : "PENDING",
      productState: dept === "product" ? state : "PENDING",
      legalState: dept === "legal" ? state : "PENDING",
    })),
    updateBidDecision: vi.fn().mockImplementation((id: string, decision: string) => ({ id, bidDecision: decision })),
    updateGoNoGo: vi.fn().mockImplementation((id: string, decision: string) => ({ id, goNoGoDecision: decision })),
    batchUpsert: vi.fn().mockImplementation((requests: any[]) => requests.map((r: any, i: number) => ({ id: `batch-${i}`, ...r }))),
    getOpportunities: vi.fn().mockResolvedValue([]),
    getContracts: vi.fn().mockResolvedValue([]),
    createOpportunity: vi.fn().mockImplementation((vegId: string, data: any) => ({ id: "opp-1", veg_request_id: vegId, ...data })),
    createContract: vi.fn().mockImplementation((oppId: string, data: any) => ({ id: "contract-1", opportunity_id: oppId, ...data })),
  },
}));

describe("VEG Service (unit)", () => {
  it("should list VEG requests", async () => {
    const result = await vegService.list({ page: 1, limit: 20 });
    expect(result.total).toBe(1);
    expect(result.data[0].title).toBe("Test");
  });

  it("should throw NotFoundError for unknown id", async () => {
    await expect(vegService.getById("unknown")).rejects.toThrow(/not found/i);
  });

  it("should return a VEG request with opportunities for known id", async () => {
    const result = await vegService.getById("known-id");
    expect(result.id).toBe("known-id");
    expect(result.opportunities).toEqual([]);
  });

  it("should create a VEG request", async () => {
    const result = await vegService.create({ title: "New", type: "RFI", client: "Vermeg" });
    expect(result.id).toBe("new-id");
    expect(result.status).toBe("DRAFT");
  });

  it("should throw NotFoundError when updating non-existent request", async () => {
    await expect(vegService.update("unknown", { title: "X" })).rejects.toThrow(/not found/i);
  });

  it("should enforce valid status transitions", async () => {
    const result = await vegService.update("known-id", { status: "SUBMITTED" });
    expect(result!.id).toBe("known-id");

    await expect(vegService.update("known-id", { status: "APPROVED" })).rejects.toThrow(/cannot transition/i);
  });

  it("should soft-delete a request", async () => {
    const result = await vegService.delete("known-id");
    expect(result.success).toBe(true);
  });

  it("should throw NotFoundError on delete for unknown id", async () => {
    const { vegRepo } = await import("../../src/repositories/veg.repo");
    (vegRepo.softDelete as any).mockResolvedValueOnce(false);
    await expect(vegService.delete("unknown")).rejects.toThrow(/not found/i);
  });

  it("should update department sign-off", async () => {
    const result = await vegService.updateDepartmentSignoff("known-id", "finance", "APPROVED");
    expect(result!.financeState).toBe("APPROVED");
  });

  it("should update bid decision", async () => {
    const result = await vegService.updateBidDecision("known-id", "BID");
    expect(result.bidDecision).toBe("BID");
  });

  it("should update go/nogo decision", async () => {
    const result = await vegService.updateGoNoGo("known-id", "GO");
    expect(result.goNoGoDecision).toBe("GO");
  });

  it("should batch sync requests", async () => {
    const requests = [{ title: "Sync 1", type: "RFI", client: "Client A" }];
    const result = await vegService.batchSync(requests);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Sync 1");
  });

  it("should create opportunity", async () => {
    const result = await vegService.createOpportunity("known-id", { name: "Opp 1", value: 10000 });
    expect(result.name).toBe("Opp 1");
  });

  it("should create contract", async () => {
    const result = await vegService.createContract("opp-1", { title: "Contract 1", startDate: "2025-01-01", endDate: "2025-12-31" });
    expect(result.title).toBe("Contract 1");
  });

  it("should throw NotFoundError when creating opportunity for non-existent VEG", async () => {
    await expect(vegService.createOpportunity("unknown", { name: "X" })).rejects.toThrow(/not found/i);
  });
});
