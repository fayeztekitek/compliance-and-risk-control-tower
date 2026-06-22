import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { NotFoundError } from "../core/errors.js";

export const unifiedFindingService = {
  async listFindings(filters: any) {
    return unifiedFindingRepo.listFindings(filters);
  },

  async getFinding(id: string) {
    const finding = await unifiedFindingRepo.getFinding(id);
    if (!finding) throw new NotFoundError("Finding", id);
    return finding;
  },

  async createFinding(data: any) {
    return unifiedFindingRepo.createFinding(data);
  },

  async updateFinding(id: string, data: any) {
    const existing = await unifiedFindingRepo.getFinding(id);
    if (!existing) throw new NotFoundError("Finding", id);
    return unifiedFindingRepo.updateFinding(id, data);
  },

  async deleteFinding(id: string) {
    const existing = await unifiedFindingRepo.getFinding(id);
    if (!existing) throw new NotFoundError("Finding", id);
    await unifiedFindingRepo.softDelete(id);
  },

  async getCrossToolSummary() {
    const stats = await unifiedFindingRepo.getStats();

    const bySource: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let total = 0;

    for (const row of stats) {
      if (row.source_tool && !row.unified_severity && !row.status) {
        bySource[row.source_tool] = parseInt(row.count, 10);
      }
      if (row.unified_severity && !row.source_tool && !row.status) {
        bySeverity[row.unified_severity] = parseInt(row.count, 10);
      }
      if (row.status && !row.source_tool && !row.unified_severity) {
        byStatus[row.status] = parseInt(row.count, 10);
      }
      if (!row.source_tool && !row.unified_severity && !row.status) {
        total = parseInt(row.count, 10);
      }
    }

    return { total, bySource, bySeverity, byStatus };
  },

  async enrichFinding(id: string, enrichment: { epssScore?: number; cisaKev?: boolean }) {
    const existing = await unifiedFindingRepo.getFinding(id);
    if (!existing) throw new NotFoundError("Finding", id);
    return unifiedFindingRepo.updateFinding(id, enrichment);
  },
};
