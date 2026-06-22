import { nexusRepo } from "../repositories/nexus.repo.js";
import { NotFoundError } from "../core/errors.js";

export const organizationService = {
  async listOrganizations() {
    const orgs = await nexusRepo.listOrganizations();
    for (const org of orgs) {
      const posture = await nexusRepo.getCompliancePosture(org.organizationId);
      (org as any).compliancePosture = posture;
    }
    return orgs;
  },

  async getOrganization(organizationId: string) {
    const org = await nexusRepo.getOrganization(organizationId);
    if (!org) throw new NotFoundError("Organization", organizationId);
    const posture = await nexusRepo.getCompliancePosture(organizationId);
    return { ...org, compliancePosture: posture };
  },

  async upsertOrganization(data: any) {
    return nexusRepo.upsertOrganization(data);
  },

  async updateOrganization(organizationId: string, data: any) {
    const existing = await nexusRepo.getOrganization(organizationId);
    if (!existing) throw new NotFoundError("Organization", organizationId);
    return nexusRepo.updateOrganization(organizationId, data);
  },

  async recalculateCompliancePosture(organizationId: string) {
    const org = await nexusRepo.getOrganization(organizationId);
    if (!org) throw new NotFoundError("Organization", organizationId);

    const { unifiedFindingRepo } = await import("../repositories/unifiedFinding.repo.js");
    const { query } = await import("../config/database.js");

    const stats = await unifiedFindingRepo.getStats();

    const totalFindings = stats.find((s: any) => !s.source_tool && !s.unified_severity && !s.status)?.count ?? "0";
    const criticalCount = stats.find((s: any) => s.unified_severity === "CRITICAL")?.count ?? "0";
    const highCount = stats.find((s: any) => s.unified_severity === "HIGH")?.count ?? "0";
    const openCount = stats.find((s: any) => s.status === "OPEN")?.count ?? "0";
    const acceptedCount = stats.find((s: any) => s.status === "ACCEPTED")?.count ?? "0";

    const total = parseInt(totalFindings, 10);
    const open = parseInt(openCount, 10);
    const accepted = parseInt(acceptedCount, 10);

    const slaResult = await query(
      `SELECT COUNT(*) as total, SUM(CASE WHEN sla_due_date < NOW() AND status != 'FIXED' AND deleted_at IS NULL THEN 1 ELSE 0 END) as breached
       FROM unified_findings WHERE sla_due_date IS NOT NULL AND deleted_at IS NULL`
    );
    const slaTotal = parseInt(slaResult.rows[0]?.total || "0", 10);
    const slaBreached = parseInt(slaResult.rows[0]?.breached || "0", 10);
    const slaBreachPct = slaTotal > 0 ? Math.round((slaBreached / slaTotal) * 10000) / 100 : 0;

    const complianceScore = total > 0 ? Math.round(((total - open + accepted) / total) * 100) : 100;
    const fixVelocityPct = total > 0 ? Math.round((accepted / total) * 100) : 100;

    let postureGrade: "RED" | "ORANGE" | "GREEN" = "GREEN";
    if (complianceScore < 70) postureGrade = "RED";
    else if (complianceScore < 90) postureGrade = "ORANGE";

    return nexusRepo.upsertCompliancePosture(organizationId, {
      totalFindings: total,
      criticalFindings: parseInt(criticalCount, 10),
      highFindings: parseInt(highCount, 10),
      openFindings: open,
      acceptedRisks: accepted,
      avgRiskScore: 0,
      fixVelocityPct,
      slaBreachPct,
      complianceScore,
      postureGrade,
    });
  },

  async getCompliancePosture(organizationId: string) {
    const posture = await nexusRepo.getCompliancePosture(organizationId);
    if (!posture) return this.recalculateCompliancePosture(organizationId);
    return posture;
  },

  async listAllCompliancePostures() {
    return nexusRepo.listAllCompliancePostures();
  },

  async getOrganizationProducts(organizationId: string) {
    return nexusRepo.listProducts(undefined);
  },
};
