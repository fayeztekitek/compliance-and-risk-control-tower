import { securityRepo } from "../repositories/security.repo.js";
import { NotFoundError, ValidationError } from "../core/errors.js";

export const securityService = {
  // ----- Vulnerabilities -----
  async listVulnerabilities(filters: any) {
    return securityRepo.listVulnerabilities(filters);
  },

  async getVulnerability(id: string) {
    const vuln = await securityRepo.getVulnerability(id);
    if (!vuln) throw new NotFoundError("Vulnerability", id);
    return vuln;
  },

  async createVulnerability(data: any) {
    const slaDate = new Date(data.slaDueDate);
    if (slaDate <= new Date()) {
      throw new ValidationError("SLA due date must be in the future");
    }
    return securityRepo.createVulnerability(data);
  },

  async updateVulnerability(id: string, data: any) {
    const existing = await securityRepo.getVulnerability(id);
    if (!existing) throw new NotFoundError("Vulnerability", id);

    // Validate status transitions
    if (data.status) {
      const valid: Record<string, string[]> = {
        OPEN: ["FALSE_POSITIVE", "WAIVED", "REMEDIATED"],
        FALSE_POSITIVE: ["OPEN"],
        WAIVED: ["OPEN"],
        REMEDIATED: ["OPEN"],
      };
      const allowed = valid[existing.status] || [];
      if (!allowed.includes(data.status)) {
        throw new ValidationError(
          `Cannot transition from '${existing.status}' to '${data.status}'. Allowed: ${allowed.join(", ") || "none"}`
        );
      }
    }

    return securityRepo.updateVulnerability(id, data);
  },

  async setFalsePositive(id: string, explanation: string) {
    const existing = await securityRepo.getVulnerability(id);
    if (!existing) throw new NotFoundError("Vulnerability", id);
    const vuln = await securityRepo.setFalsePositive(id, explanation);
    if (!vuln) throw new NotFoundError("Vulnerability", id);
    return vuln;
  },

  // ----- Waivers -----
  async listWaivers() {
    return securityRepo.listWaivers();
  },

  async createWaiver(data: any) {
    const vuln = await securityRepo.getVulnerability(data.vulnerabilityId);
    if (!vuln) throw new NotFoundError("Vulnerability", data.vulnerabilityId);
    const waiver = await securityRepo.createWaiver(data);
    await securityRepo.linkWaiver(data.vulnerabilityId, waiver.id);
    return waiver;
  },

  async approveWaiver(id: string, approvedBy?: string) {
    const waiver = await securityRepo.updateWaiverStatus(id, "APPROVED", approvedBy);
    if (!waiver) throw new NotFoundError("Waiver", id);
    await securityRepo.updateVulnerability(waiver.vulnerability_id, { status: "WAIVED" });
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
        await securityRepo.updateVulnerability(w.vulnerability_id, { status: "OPEN" });
      }
    }
    return { checked: waivers.length };
  },

  // ----- Risk Acceptances -----
  async listRiskAcceptances() {
    return securityRepo.listRiskAcceptances();
  },

  async createRiskAcceptance(data: any) {
    const vuln = await securityRepo.getVulnerability(data.vulnerabilityId);
    if (!vuln) throw new NotFoundError("Vulnerability", data.vulnerabilityId);
    const ra = await securityRepo.createRiskAcceptance(data);
    await securityRepo.linkRiskAcceptance(data.vulnerabilityId, ra.id);
    return ra;
  },

  async approveRiskAcceptance(id: string, approvedBy?: string) {
    const ra = await securityRepo.updateRiskAcceptanceStatus(id, "APPROVED", approvedBy);
    if (!ra) throw new NotFoundError("Risk acceptance", id);
    await securityRepo.updateVulnerability(ra.vulnerability_id, { status: "REMEDIATED" });
    return ra;
  },

  // ----- SLA Incidents -----
  async listSlaIncidents() {
    const incidents = await securityRepo.listSlaIncidents();
    return incidents;
  },

  async detectSlaBreaches() {
    const vulns = await securityRepo.listVulnerabilities({ page: 1, limit: 1000 });
    const breached: any[] = [];
    const now = new Date();
    for (const v of vulns.data) {
      if (v.status === "OPEN" && new Date(v.slaDueDate) <= now) {
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
    const vulns = raw.map((r: any) => ({
      title: r.title || r.name || "Imported Vulnerability",
      severity: (r.severity || "MEDIUM").toUpperCase(),
      sourceScanner: (r.scanner || r.sourceScanner || "VERACODE").toUpperCase(),
      detectedDate: r.detectedDate || new Date().toISOString().split("T")[0],
      slaDueDate: r.slaDueDate || (() => { const d = new Date(); d.setMonth(d.getMonth() + 3); return d.toISOString().split("T")[0]; })(),
      targetProduct: r.product || r.targetProduct,
      owner: r.owner,
    }));
    const ids = await securityRepo.batchImportVulnerabilities(vulns);
    return { imported: ids.length, ids };
  },
};
