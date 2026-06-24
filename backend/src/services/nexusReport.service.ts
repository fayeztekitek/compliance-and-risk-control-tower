import { nexusReportRepo } from "../repositories/nexusReport.repo.js";
import { nexusRepo } from "../repositories/nexus.repo.js";
import { credentialStore } from "./credentialStore.js";
import { createClientFromCredentials } from "./nexusHttpClient.js";
import { NotFoundError, ValidationError } from "../core/errors.js";

function extractThreatLevel(threatLevel: any): number {
  const level = typeof threatLevel === "string" ? parseInt(threatLevel, 10) : threatLevel;
  return Number.isFinite(level) ? level : 0;
}

function severityBucket(threatLevel: number): "critical" | "high" | "medium" | "low" {
  if (threatLevel >= 8) return "critical";
  if (threatLevel >= 5) return "high";
  if (threatLevel >= 3) return "medium";
  return "low";
}

function extractComponentCoordinates(comp: any): any {
  const ci = comp.componentIdentifier;
  if (!ci) return null;
  return { format: ci.format, coordinates: ci.coordinates };
}

function getNexusPublicId(comp: any): string | undefined {
  const ci = comp.componentIdentifier;
  if (!ci?.coordinates) return undefined;
  const coords = ci.coordinates;
  if (ci.format === "maven") return `${coords.groupId}:${coords.artifactId}`;
  return `${ci.format}:${coords.artifactId || coords.name || coords.package}`;
}

export const nexusReportService = {
  // ---- Sync ----
  async syncReports(sessionToken: string, applicationId: string) {
    const creds = credentialStore.retrieve(sessionToken);
    if (!creds) throw new ValidationError("Invalid or expired session token");
    const client = createClientFromCredentials(creds);

    const historyResult = await client.executeRequest<any>(
      `api/v2/reports/applications/${applicationId}/history`
    );
    const rawReports: any[] = historyResult?.reports || (Array.isArray(historyResult) ? historyResult : []);

    if (rawReports.length === 0) {
      return { applicationId, reportsSynced: 0, violationsSynced: 0, componentsSynced: 0 };
    }

    const firstReport = rawReports[0];
    const appPublicId = firstReport.application?.publicId || firstReport.applicationId;

    let reportsSynced = 0;
    let violationsSynced = 0;
    let componentsSynced = 0;

    for (const raw of rawReports) {
      const scanId = raw.reportId;
      const reportDate = raw.evaluationDate
        ? new Date(raw.evaluationDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      const reportData = {
        scanId,
        applicationId,
        applicationPublicId: appPublicId,
        stage: raw.stage || "build",
        scanDate: reportDate,
        reportUrl: raw.reportHtmlUrl || null,
        embeddableReportHtmlUrl: raw.embeddableReportHtmlUrl || null,
        reportPdfUrl: raw.reportPdfUrl || null,
        reportDataUrl: raw.reportDataUrl || null,
        reportTitle: raw.reportTitle || "Scan Report",
        commitHash: raw.commitHash || null,
        initiator: raw.initiator || "system",
        policyEvaluationDate: raw.evaluationDate || null,
      };

      const upsertedReport = await nexusReportRepo.upsertReport(reportData);
      reportsSynced++;

      let violations: any[] = [];
      let totalViolations = 0;
      const criticalCount = 0;
      const highCount = 0;
      const mediumCount = 0;
      const lowCount = 0;

      try {
        const policyResult = await client.executeRequest<any>(
          `api/v2/applications/${appPublicId}/reports/${scanId}/policy`
        );
        const components = policyResult?.components || [];

        const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
        const componentHashes: string[] = [];
        const seenComponents = new Map<string, { versions: Set<string>; violations: number; maxThreat: number }>();

        for (const comp of components) {
          const hash = comp.hash;
          if (hash) {
            componentHashes.push(hash);
            if (!seenComponents.has(hash)) {
              seenComponents.set(hash, { versions: new Set(), violations: 0, maxThreat: 0 });
            }
          }

          const cc = extractComponentCoordinates(comp);
          const compName = comp.displayName || getNexusPublicId(comp) || comp.componentName || "unknown";

          await nexusReportRepo.upsertComponent({
            componentHash: hash || compName,
            componentName: compName,
            displayName: comp.displayName || compName,
            currentVersion: cc?.coordinates?.version || null,
            format: cc?.format || null,
            coordinates: cc?.coordinates || null,
            proprietary: comp.proprietary,
            matchState: comp.matchState,
          });
          componentsSynced++;

          const compViolations = comp.constraintViolations || comp.violations || [];
          const compSecurityIssues = comp.securityData?.securityIssues || [];

          for (const ci of compViolations) {
            const violationId = ci.policyViolationId || `${scanId}-${hash}-${ci.constraintId || ci.policyId}-${Date.now()}`;
            const threatLevel = extractThreatLevel(ci.threatLevel);
            const bucket = severityBucket(threatLevel);
            severityCounts[bucket]++;

            const securityIssue = compSecurityIssues[0];

            await nexusReportRepo.upsertViolation({
              violationId,
              reportId: scanId,
              policyId: ci.policyId || ci.constraintId,
              policyName: ci.policyName || ci.constraintName || "Unknown Policy",
              constraintId: ci.constraintId,
              constraintName: ci.constraintName,
              threatLevel,
              threatCategory: ci.threatCategory || bucket,
              applicationId,
              componentHash: hash || null,
              componentFormat: cc?.format || null,
              componentName: compName,
              componentCoordinates: cc?.coordinates || null,
              displayName: comp.displayName || compName,
              proprietary: comp.proprietary,
              matchState: comp.matchState,
              securityIssueRefId: securityIssue?.reference || null,
              securityIssueSeverity: securityIssue?.severity || null,
              cveId: securityIssue?.reference?.startsWith("CVE-") ? securityIssue.reference : null,
              status: ci.violationState || ci.status || "OPEN",
              stage: raw.stage,
              openTime: ci.openTime || null,
              waiveTime: ci.waiveTime || null,
              fixTime: ci.fixTime || null,
              isWaived: ci.isWaived || false,
              isLegacy: ci.isLegacy || false,
            });
            violationsSynced++;
            violations.push({ threatLevel, hash });

            if (hash) {
              const tracked = seenComponents.get(hash)!;
              tracked.violations++;
              tracked.maxThreat = Math.max(tracked.maxThreat, threatLevel);
              if (cc?.coordinates?.version) tracked.versions.add(cc.coordinates.version);
            }
          }
        }

        totalViolations = violationsSynced;

        await nexusReportRepo.upsertReport({
          ...reportData,
          totalViolations: totalViolations,
          criticalCount: severityCounts.critical,
          highCount: severityCounts.high,
          mediumCount: severityCounts.medium,
          lowCount: severityCounts.low,
          componentHashes,
        });

        const previousReport = await nexusReportRepo.getPreviousReportByDate(applicationId, scanId, reportDate);
        let componentChurn: any = null;
        let newViolations = 0;
        let fixedViolations = 0;

        if (previousReport) {
          const prevViolations = await nexusReportRepo.listViolations(previousReport.scanId, { limit: 10000 });
          const currViolations = violations;

          const prevHashes = await nexusReportRepo.getComponentHashSet(previousReport.scanId);

          const currHashSet = new Set(componentHashes);
          const prevHashSet = new Set(prevHashes);
          const newComponents = componentHashes.filter(h => !prevHashSet.has(h));
          const removedComponents = prevHashes.filter(h => !currHashSet.has(h));

          const prevViolMap = new Map<string, number>();
          for (const v of prevViolations.data) {
            prevViolMap.set(`${v.componentHash}:${v.policyId}`, v.threatLevel);
          }
          const currViolMap = new Map<string, number>();
          for (const v of currViolations) {
            const key = `${v.hash}:${v.policyName}`;
            if (!currViolMap.has(key)) currViolMap.set(key, v.threatLevel);
          }

          newViolations = [...currViolMap.keys()].filter(k => !prevViolMap.has(k)).length;
          fixedViolations = [...prevViolMap.keys()].filter(k => !currViolMap.has(k)).length;

          componentChurn = {
            newComponents: newComponents.length,
            removedComponents: removedComponents.length,
            newComponentNames: newComponents.slice(0, 20),
            removedComponentNames: removedComponents.slice(0, 20),
          };

          for (const [hash, tracked] of seenComponents) {
            await nexusReportRepo.upsertComponentImpact({
              applicationId,
              componentHash: hash,
              firstSeen: reportDate,
              lastSeen: reportDate,
              reportsAffected: 1,
              violationCount: tracked.violations,
              maxThreatLevel: tracked.maxThreat,
              versionsSeen: [...tracked.versions],
            });
          }
        }

        await nexusReportRepo.upsertEvolutionSnapshot({
          applicationId,
          reportId: scanId,
          scanDate: reportDate,
          stage: raw.stage,
          totalViolations,
          criticalCount: severityCounts.critical,
          highCount: severityCounts.high,
          mediumCount: severityCounts.medium,
          lowCount: severityCounts.low,
          totalComponents: policyResult?.matchSummary?.totalComponentCount || componentHashes.length,
          affectedComponents: componentHashes.length,
          componentChurn,
          newViolations,
          fixedViolations,
        });
      } catch {
        if (!totalViolations) totalViolations = 0;
        await nexusReportRepo.upsertReport({
          ...reportData,
          totalViolations: 0,
          criticalCount: 0, highCount: 0, mediumCount: 0, lowCount: 0,
        });
      }
    }

    return {
      applicationId,
      reportsSynced,
      violationsSynced,
      componentsSynced,
    };
  },

  // ---- Read ----
  async listReports(applicationId: string, page: number = 1, limit: number = 20) {
    return nexusReportRepo.listReports(applicationId, page, limit);
  },

  async getReport(id: string) {
    let report = await nexusReportRepo.getReport(id);
    if (!report) report = await nexusReportRepo.getReportByInternalId(id);
    if (!report) throw new NotFoundError("Report", id);
    return report;
  },

  async getReportViolations(reportId: string, filters?: {
    severity?: string; status?: string; search?: string;
    page?: number; limit?: number;
  }) {
    const report = await this.getReport(reportId);
    const violations = await nexusReportRepo.listViolations(reportId, filters);
    const summary = await nexusReportRepo.getViolationSummary(reportId);
    return { ...violations, summary, report };
  },

  // ---- Compare ----
  async compareReports(reportIdA: string, reportIdB: string) {
    const reportA = await this.getReport(reportIdA);
    const reportB = await this.getReport(reportIdB);

    const [violationsA, violationsB] = await Promise.all([
      nexusReportRepo.listViolations(reportIdA, { limit: 10000 }),
      nexusReportRepo.listViolations(reportIdB, { limit: 10000 }),
    ]);

    const indexA = new Map<string, any>();
    for (const v of violationsA.data) {
      indexA.set(`${v.componentHash}:${v.policyId}`, v);
    }
    const indexB = new Map<string, any>();
    for (const v of violationsB.data) {
      indexB.set(`${v.componentHash}:${v.policyId}`, v);
    }

    const added: any[] = [];
    const removed: any[] = [];
    const same: any[] = [];
    const statusChanged: any[] = [];

    for (const v of violationsB.data) {
      const key = `${v.componentHash}:${v.policyId}`;
      if (indexA.has(key)) {
        const existing = indexA.get(key);
        same.push(v);
        if (existing.status !== v.status || existing.isWaived !== v.isWaived) {
          statusChanged.push({ from: existing, to: v });
        }
      } else {
        added.push(v);
      }
    }

    for (const v of violationsA.data) {
      const key = `${v.componentHash}:${v.policyId}`;
      if (!indexB.has(key)) {
        removed.push(v);
      }
    }

    function countBySeverity(violations: any[]) {
      return {
        critical: violations.filter(v => (v.threatLevel ?? 0) >= 8).length,
        high: violations.filter(v => (v.threatLevel ?? 0) >= 5 && (v.threatLevel ?? 0) < 8).length,
        medium: violations.filter(v => (v.threatLevel ?? 0) >= 3 && (v.threatLevel ?? 0) < 5).length,
        low: violations.filter(v => (v.threatLevel ?? 0) < 3).length,
      };
    }

    return {
      reportA,
      reportB,
      addedViolations: added,
      removedViolations: removed,
      sameViolations: same,
      statusChangedViolations: statusChanged,
      summary: {
        added: countBySeverity(added),
        removed: countBySeverity(removed),
        same: countBySeverity(same),
        statusChanged: statusChanged.length,
      },
    };
  },

  // ---- Evolution ----
  async getEvolution(applicationId: string, fromDate?: string, toDate?: string) {
    return nexusReportRepo.getEvolution(applicationId, fromDate, toDate);
  },

  async getComponentImpact(applicationId: string) {
    return nexusReportRepo.getComponentImpact(applicationId);
  },
};
