import { describe, it, expect, vi } from "vitest";
import { archiveService } from "../../src/services/archive.service.js";

describe("Archive Service", () => {
  it("should return status with defaults", () => {
    const s = archiveService.getStatus();
    expect(s).toHaveProperty("isRunning", false);
    expect(s).toHaveProperty("lastRun");
    expect(s).toHaveProperty("lastCount");
    expect(s).toHaveProperty("totalArchivedAllTime");
  });

  it("should return error result when called concurrently", async () => {
    const s1 = archiveService.archiveFindingsOlderThan(12);
    const s2 = archiveService.archiveFindingsOlderThan(12);
    const [r1, r2] = await Promise.all([s1, s2]);
    expect(r1.totalArchived + r2.totalArchived).toBe(r1.totalArchived); // one returns 0
    const hasConcurrent = r2.errors.some((e: string) => e.includes("already running"));
    expect(hasConcurrent).toBe(r2.totalArchived === 0);
  });
});
