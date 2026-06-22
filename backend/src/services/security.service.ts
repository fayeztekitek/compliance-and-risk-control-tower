import { securityRepo } from "../repositories/security.repo.js";
import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { NotFoundError, ValidationError } from "../core/errors.js";

const SECURITY_SOURCE_TOOLS = ["INTERNAL", "PEN_TEST", "NEXPOSE", "VERACODE"];

export const securityService = {
  // ----- Vulnerabilities (via unified_findings) -----
  async listVulnerabilities(filters: any) {
    return unifiedFindingRepo.listFindings({
      ...filters,
      sourceTool: undefined,
    });
  },

  async getVulnerability(id: string) {
    const vuln = await unifiedFindingRepo.getFinding(id);
    if (!vuln) throw new NotFoundError("Vulnerability", id);
    return vuln;
  },

  async createVulnerability(data: any) {
    const slaDate = new Date(data.slaDueDate);
    if (slaDate <= new Date()) {
      throw new ValidationError("SLA due date must be in the future");
    }
    return unifiedFindingRepo.createFinding({
      sourceTool: data.sourceScanner || "INTERNAL",
      sourceTable: "vulnerabilities",
      title: data.title,
      unifiedSeverity: data.severity,
      detectedDate: data.detectedDate,
      slaDueDate: data.slaDueDate,
      targetProduct: data.targetProduct,
      metadata: data.owner ? { owner: data.owner } : {},
    });
  },

  async updateVulnerability(id: string, data: any) {
    const existing = await unifiedFindingRepo.getFinding(id);
    if (!existing) throw new NotFoundError("Vulnerability", id);

    if (data.status) {
      const valid: Record<string, string[]> = {
        OPEN: ["FALSE_POSITIVE", "WAIVED", "FIXED"],
        FALSE_POSITIVE: ["OPEN"],
        WAIVED: ["OPEN"],
        FIXED: ["OPEN"],
      };
      const allowed = valid[existing.status] || [];
      if (!allowed.includes(data.status)) {
        throw new ValidationError(
          `Cannot transition from '${existing.status}' to '${data.status}'. Allowed: ${allowed.join(", ") || "none"}`
        );
      }
    }

    return unifiedFindingRepo.updateFinding(id, data);
  },

  async setFalsePositive(id: string, explanation: string) {
    const existing = await unifiedFindingRepo.getFinding(id);
    if (!existing) throw new NotFoundError("Vulnerability", id);
    const result = await unifiedFindingRepo.updateFinding(id, {
      status: "FALSE_POSITIVE",
      metadata: { ...(existing.metadata || {}), explanation_false_positive: explanation },
    });
    if (!result) throw new NotFoundError("Vulnerability", id);
    return result;
  },

  // ----- Waivers (via legacy security.repo) -----
  async listWaivers() {
    return securityRepo.listWaivers();
  },

  async createWaiver(data: any) {
    const vuln = await unifiedFindingRepo.getFinding(data.vulnerabilityId);
    if (!vuln) throw new NotFoundError("Vulnerability", data.vulnerabilityId);
    const waiver = await securityRepo.createWaiver(data);
    await unifiedFindingRepo.updateFinding(data.vulnerabilityId, { waiverId: waiver.id });
    return waiver;
  },

  async approveWaiver(id: string, approvedBy?: string) {
    const waiver = await securityRepo.updateWaiverStatus(id, "APPROVED", approvedBy);
    if (!waiver) throw new NotFoundError("Waiver", id);
    await unifiedFindingRepo.updateFinding(waiver.vulnerability_id, { status: "WAIVED" });
    return waiver;
  },

  async rejectWaiver(id: string) {
    const waiver = await securityRepo.updateWaiverStatus(id, "REJECTED");
    if (!waiver) throw new NotFoundError("Waiver", id);
    return waiver;
  },

  async checkWaiverExpiry() {
    const waivers = await securityRepo.listWaivers();
    const now = new Date();
    for (const w of waivers) {
      if (w.status === "APPROVED" && new Date(w.expiry_date) <= now) {
        await securityRepo.updateWaiverStatus(w.id, "EXPIRED");
        await unifiedFindingRepo.updateFinding(w.vulnerability_id, { status: "OPEN" });
      }
    }
    return { checked: waivers.length };
  },

  // ----- Risk Acceptances (via legacy security.repo) -----
  async listRiskAcceptances() {
    return securityRepo.listRiskAcceptances();
  },

  async createRiskAcceptance(data: any) {
    const vuln = await unifiedFindingRepo.getFinding(data.vulnerabilityId);
    if (!vuln) throw new NotFoundError("Vulnerability", data.vulnerabilityId);
    const ra = await securityRepo.createRiskAcceptance(data);
    await unifiedFindingRepo.updateFinding(data.vulnerabilityId, { riskAcceptanceId: ra.id });
    return ra;
  },

  async approveRiskAcceptance(id: string, approvedBy?: string) {
    const ra = await securityRepo.updateRiskAcceptanceStatus(id, "APPROVED", approvedBy);
    if (!ra) throw new NotFoundError("Risk acceptance", id);
    await unifiedFindingRepo.updateFinding(ra.vulnerability_id, { status: "FIXED" });
    return ra;
  },

  // ----- SLA Incidents -----
  async listSlaIncidents() {
    return securityRepo.listSlaIncidents();
  },

  async detectSlaBreaches() {
    const vulns = await unifiedFindingRepo.listFindings({ page: 1, limit: 1000 });
    const breached: any[] = [];
    const now = new Date();
    for (const v of vulns.data) {
      if (v.status === "OPEN" && v.slaDueDate && new Date(v.slaDueDate) <= now) {
        breached.push({
          title: `SLA Breach: ${v.title}`,
          projectName: v.targetProduct || "Unknown",
          breachTime: now.toISOString(),
          maxAllowedResolutionHours: 72,
        });
      }
    }
    for (const b of breached) {
      await securityRepo.createSlaIncident(b);
    }
    return { detected: breached.length };
  },

  // ----- Scan Import -----
  async importScan(raw: any[]) {
    const findings = raw.map((r: any) => ({
      sourceTool: (r.scanner || r.sourceScanner || "VERACODE").toUpperCase(),
      sourceTable: "vulnerabilities",
      title: r.title || r.name || "Imported Vulnerability",
      unifiedSeverity: (r.severity || "MEDIUM").toUpperCase(),
      detectedDate: r.detectedDate || new Date().toISOString().split("T")[0],
      slaDueDate: r.slaDueDate || (() => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split("T")[0]; })(),
      targetProduct: r.product || r.targetProduct,
      metadata: r.owner ? { owner: r.owner } : {},
    }));
    await unifiedFindingRepo.bulkUpsertFindings(findings);
    return { imported: findings.length };
  },
};
