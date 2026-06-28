import { nexusRepo } from "../repositories/nexus.repo.js";
import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { riskScoreService } from "./riskScore.service.js";
import { createClientFromConfig, createClientFromCredentials, NexusHttpClient } from "./nexusHttpClient.js";
import { NotFoundError, ValidationError } from "../core/errors.js";
import { credentialStore } from "./credentialStore.js";
import { getCached, setCache } from "./redis.js";
import crypto from "crypto";
import { env } from "../config/env.js";

async function execWithLog(client: NexusHttpClient, endpoint: string): Promise<any> {
  try {
    return await client.executeRequest<any>(endpoint);
  } catch (err: any) {
    err.message = `[${endpoint}] ${err.message}`;
    throw err;
  }
}

export const nexusService = {
  // ---- Config ----
  async getConfig() { return nexusRepo.getConfig(); },

  async updateConfig(data: any) {
    return nexusRepo.upsertConfig({
      ...data,
      tokenEncrypted: data.token,
    });
  },

  async testConnection() {
    const client = await createClientFromConfig();
    return client.testConnection();
  },

  async testAndFetchOrgs(data?: { url?: string; username?: string; token?: string }) {
    let client;
    let creds: { url: string; username: string; token: string } | undefined;
    if (data?.url) {
      creds = {
        url: data.url,
        username: data.username || env.NEXUS_IQ_USERNAME || "admin",
        token: data.token || env.NEXUS_IQ_TOKEN || "",
      };
      client = createClientFromCredentials(creds);
    } else {
      client = await createClientFromConfig();
    }
    const connectionResult = await client.testConnection();
    if (!connectionResult.success) {
      return { connection: connectionResult, remoteOrgs: [], sessionToken: null };
    }
    const orgs = await client.executeRequest<any>("api/v2/organizations");
    let orgList: any[] = [];
    if (Array.isArray(orgs)) {
      orgList = orgs;
    } else if (orgs?.organizations && Array.isArray(orgs.organizations)) {
      orgList = orgs.organizations;
    } else if (orgs?.items && Array.isArray(orgs.items)) {
      orgList = orgs.items;
    }
    const remoteOrgs = orgList.map((o: any) => ({
      organizationId: o.id || o.organizationId,
      organizationName: o.name || o.organizationName,
      parentOrganizationId: o.parentOrganizationId || null,
    }));
    let sessionToken: string | null = null;
    if (creds) {
      sessionToken = credentialStore.store(creds);
    }
    return { connection: connectionResult, remoteOrgs, sessionToken };
  },

  async fetchApplications(data?: { sessionToken?: string; organizationId?: string; url?: string; username?: string; token?: string }) {
    let creds: { url: string; username: string; token: string } | undefined;

    if (data?.sessionToken) {
      const stored = credentialStore.retrieve(data.sessionToken);
      if (stored) {
        creds = stored;
      }
    }

    if (!creds && data?.url) {
      creds = {
        url: data.url,
        username: data.username || env.NEXUS_IQ_USERNAME || "admin",
        token: data.token || env.NEXUS_IQ_TOKEN || "",
      };
    }

    if (!creds) {
      return { applications: [] };
    }

    const client = createClientFromCredentials(creds);
    const endpoint = data?.organizationId
      ? `api/v2/applications/organization/${encodeURIComponent(data.organizationId)}`
      : "api/v2/applications";
    const apps = await client.executeRequest<any>(endpoint);
    let appList: any[] = [];
    if (Array.isArray(apps)) {
      appList = apps;
    } else if (apps?.applications && Array.isArray(apps.applications)) {
      appList = apps.applications;
    } else if (apps?.items && Array.isArray(apps.items)) {
      appList = apps.items;
    }
    const remoteApps = appList.map((a: any) => ({
      id: a.id,
      publicId: a.publicId || a.id,
      name: a.name || a.publicId,
      organizationId: a.organizationId,
      status: a.status || "UNKNOWN",
      businessCriticality: a.businessCriticality || null,
      productId: a.publicId || a.id,
    }));
    return { applications: remoteApps };
  },

  // ---- Reports ----

  async fetchReportHistory(data?: { sessionToken?: string; applicationId?: string }) {
    const creds = data?.sessionToken ? credentialStore.retrieve(data.sessionToken) : null;
    if (!creds || !data?.applicationId) return { reports: [] };
    const client = createClientFromCredentials(creds);
    const result = await client.executeRequest<any>(`api/v2/reports/applications/${data.applicationId}?limit=100`);
    const raw: any[] = result?.applicationReports || result?.reports || (Array.isArray(result) ? result : []);
    const reports = raw.map((r: any) => ({
      reportId: r.reportId,
      reportTime: r.reportTime,
      reportTitle: r.reportTitle || "Scan Report",
      stage: r.stage || "unknown",
      commitHash: r.commitHash || null,
      initiator: r.initiator || "system",
      applicationId: r.application?.id || data.applicationId,
      applicationName: r.application?.name || "",
    }));
    return { reports };
  },

  async fetchReportPolicyViolations(data?: { sessionToken?: string; applicationPublicId?: string; scanId?: string }) {
    const creds = data?.sessionToken ? credentialStore.retrieve(data.sessionToken) : null;
    if (!creds || !data?.applicationPublicId || !data?.scanId) return { violations: [], severityCounts: {} };
    const client = createClientFromCredentials(creds);
    const result = await client.executeRequest<any>(
      `api/v2/applications/${data.applicationPublicId}/reports/${data.scanId}/policy`
    );
    const components = result?.components || [];
    const allViolations: any[] = [];
    for (const comp of components) {
      for (const violation of (comp.violations || [])) {
        allViolations.push({
          componentHash: comp.hash,
          componentName: comp.displayName,
          policyId: violation.policyId,
          policyName: violation.policyName,
          policyThreatLevel: violation.policyThreatLevel,
          threatCategory: violation.policyThreatCategory,
          constraintName: violation.constraintName,
          violationState: violation.violationState || "OPEN",
        });
      }
    }
    const severityCounts = {
      critical: allViolations.filter((v: any) => v.policyThreatLevel >= 8).length,
      high: allViolations.filter((v: any) => v.policyThreatLevel >= 5 && v.policyThreatLevel < 8).length,
      medium: allViolations.filter((v: any) => v.policyThreatLevel >= 3 && v.policyThreatLevel < 5).length,
      low: allViolations.filter((v: any) => v.policyThreatLevel < 3).length,
      total: allViolations.length,
    };
    return { violations: allViolations, severityCounts };
  },

  async fetchReportVulnerabilities(data?: { sessionToken?: string; applicationPublicId?: string; scanId?: string }) {
    const creds = data?.sessionToken ? credentialStore.retrieve(data.sessionToken) : null;
    if (!creds || !data?.applicationPublicId || !data?.scanId) return { issues: [], severityCounts: {}, statusCounts: {} };
    const client = createClientFromCredentials(creds);
    const result = await client.executeRequest<any>(
      `api/v2/applications/${data.applicationPublicId}/reports/${data.scanId}/raw`
    );
    const components = result?.components || [];
    const issueMap = new Map<string, any>();

    for (const comp of components) {
      const issues = comp.securityData?.securityIssues || [];
      for (const iss of issues) {
        const ref = iss.reference || iss.cve || `internal-${Math.random()}`;
        if (!issueMap.has(ref)) {
          const s = parseFloat(String(iss.severity || 0));
          let severity = "LOW";
          if (!isNaN(s)) {
            if (s >= 9.0) severity = "CRITICAL";
            else if (s >= 7.0) severity = "HIGH";
            else if (s >= 4.0) severity = "MEDIUM";
          }
          issueMap.set(ref, {
            reference: ref,
            severity,
            cvssScore: isNaN(s) ? null : s,
            status: iss.status || "Open",
            cwe: iss.cwe || null,
            url: iss.url || null,
            componentName: comp.displayName || null,
          });
        }
      }
    }

    const issues = Array.from(issueMap.values());
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    const statusCounts: Record<string, number> = {};

    for (const iss of issues) {
      const sev = iss.severity.toLowerCase();
      if (sev in severityCounts) severityCounts[sev as keyof typeof severityCounts]++;
      const st = iss.status || "Unknown";
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    }

    return { issues, distinctCount: issues.length, severityCounts, statusCounts };
  },

  async fetchLatestReport(data?: { sessionToken?: string; applicationId?: string; applicationPublicId?: string }) {
    const history = await this.fetchReportHistory(data);
    if (history.reports.length === 0) return { report: null, severityCounts: null };
    const latest = history.reports[0];
    const violations = await this.fetchReportPolicyViolations({
      sessionToken: data?.sessionToken,
      applicationPublicId: data?.applicationPublicId || latest.applicationId,
      scanId: latest.reportId,
    });
    return { report: latest, severityCounts: violations.severityCounts };
  },

  // ---- Sync ----
  async fetchBulkScanStatus(data: { sessionToken: string; applications: { id: string; publicId?: string }[] }) {
    const creds = data?.sessionToken ? credentialStore.retrieve(data.sessionToken) : null;
    if (!creds || !data?.applications?.length) return { scans: {} };
    const client = createClientFromCredentials(creds);

    const results: Record<string, {
      scanPerformed: boolean;
      scanReportCount: number;
      latestScanDate: string | null;
      latestScanAge: string;
      statusLabel: "N/A" | "Scan Performed";
      statusColor: "grey" | "green";
    }> = {};

    const CONCURRENCY = 5;
    const queue = [...data.applications];

    async function worker() {
      while (queue.length > 0) {
        const app = queue.shift()!;
        const appId = app.id;
        try {
          const resp = await client.executeRequest<any>(`api/v2/reports/applications/${appId}?limit=100`);
          const rawReports: any[] = resp?.applicationReports || resp?.reports || (Array.isArray(resp) ? resp : []);

          if (rawReports.length === 0) {
            results[appId] = {
              scanPerformed: false, scanReportCount: 0,
              latestScanDate: null, latestScanAge: "N/A",
              statusLabel: "N/A", statusColor: "grey",
            };
            continue;
          }

          let latestDate: string | null = null;
          let latestMs = 0;
          for (const r of rawReports) {
            const ts = r.reportTime || (r.evaluationDate ? new Date(r.evaluationDate).getTime() : 0);
            if (ts > latestMs) {
              latestMs = ts;
              latestDate = r.evaluationDate || new Date(ts).toISOString();
            }
          }

          const now = Date.now();
          const diff = now - latestMs;
          const days = Math.floor(diff / 86400000);
          let age: string;
          if (days < 1) age = "Today";
          else if (days === 1) age = "Yesterday";
          else if (days < 7) age = `${days} days ago`;
          else if (days < 30) age = `${Math.floor(days / 7)} weeks ago`;
          else age = `${Math.floor(days / 30)} months ago`;

          results[appId] = {
            scanPerformed: true,
            scanReportCount: rawReports.length,
            latestScanDate: latestDate,
            latestScanAge: age,
            statusLabel: "Scan Performed",
            statusColor: "green",
          };
        } catch (err: any) {
          results[appId] = {
            scanPerformed: false, scanReportCount: 0,
            latestScanDate: null, latestScanAge: "N/A",
            statusLabel: "N/A", statusColor: "grey",
          };
        }
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, data.applications.length) }, () => worker());
    await Promise.all(workers);
    return { scans: results };
  },

  async fetchExecutiveLiveKpis(data: { sessionToken: string; includeVulns?: boolean }): Promise<{
    totalOrganizations: number;
    totalApplications: number;
  }> {
    const creds = data?.sessionToken ? credentialStore.retrieve(data.sessionToken) : null;
    if (!creds) throw new Error("Invalid or expired Nexus IQ session. Please connect to Nexus IQ first.");

    const client = createClientFromCredentials(creds);
    const errors: string[] = [];

    let orgs: any[] = [];
    let apps: any[] = [];
    await Promise.all([
      (async () => {
        try {
          const raw = await client.executeRequest<any>("api/v2/organizations");
          orgs = Array.isArray(raw) ? raw : raw?.organizations || raw?.items || [];
        } catch (err: any) {
          errors.push(`Failed to fetch organizations: ${err.message}`);
        }
      })(),
      (async () => {
        try {
          const raw = await client.executeRequest<any>("api/v2/applications");
          apps = Array.isArray(raw) ? raw : raw?.applications || raw?.items || [];
        } catch (err: any) {
          errors.push(`Failed to fetch applications: ${err.message}`);
        }
      })(),
    ]);

    return {
      totalOrganizations: orgs.length,
      totalApplications: apps.length,
    };
  },

  async triggerSync(data: { mode: string; targetUrl?: string }) {
    const batchId = crypto.randomUUID();
    const syncLog = await nexusRepo.createSyncLog({
      batchId,
      executedBy: "system",
      status: "IN_PROGRESS",
      targetUrl: data.targetUrl,
      syncBatchId: batchId,
    });
    return { batchId, syncLog };
  },

  async getSyncStatus(batchId: string) {
    const logs = await nexusRepo.listSyncLogs(1, 1);
    const log = logs.data.find((l: any) => l.batchId === batchId);
    if (!log) throw new NotFoundError("Sync log", batchId);
    return log;
  },

  async listSyncLogs(page: number, limit: number) {
    return nexusRepo.listSyncLogs(page, limit);
  },

  async fullSync(data: { batchId?: string } = {}) {
    const client = await createClientFromConfig();
    const batchId = data.batchId || crypto.randomUUID();
    const errors: { step: string; app?: string; message: string }[] = [];

    const mapStage = (stage?: string): string => {
      const valid = ["develop", "build", "release", "operate"];
      const s = (stage || "release").toLowerCase().replace(/^stage-/, "");
      return valid.includes(s) ? s : "release";
    };

    await nexusRepo.createSyncLog({
      batchId,
      executedBy: "system",
      status: "IN_PROGRESS",
      syncBatchId: batchId,
    });

    const mapStatus = (status?: string): string => {
      switch ((status || "OPEN").toLowerCase()) {
        case "open": return "OPEN";
        case "fixed": return "FIXED";
        case "waived": return "WAIVED";
        case "accepted": return "ACCEPTED";
        case "false positive": return "FALSE_POSITIVE";
        default: return "OPEN";
      }
    };

    try {
      // 1. Fetch & upsert organizations
      const orgsRaw: any = await execWithLog(client, "api/v2/organizations") || [];
      const orgList: any[] = Array.isArray(orgsRaw) ? orgsRaw : (orgsRaw?.organizations || orgsRaw?.items || []);
      let orgsCount = 0;
      for (const org of orgList) {
        const orgName = org.name || org.organizationName || org.orgName || org.displayName || (`Organization-${org.id || org.organizationId}`).slice(0, 30);
        await nexusRepo.upsertOrganization({
          organizationId: org.id || org.organizationId,
          organizationName: orgName,
          parentOrganizationId: org.parentOrganizationId || null,
          syncBatchId: batchId,
        });
        orgsCount++;
      }
      console.log(`[fullSync] Synced ${orgsCount} organizations`);

      // 2. Fetch & upsert applications
      const appsRaw: any = await execWithLog(client, "api/v2/applications") || [];
      const appList: any[] = Array.isArray(appsRaw) ? appsRaw : (appsRaw?.applications || appsRaw?.items || []);
      let appsCount = 0;
      for (const app of appList) {
        const orgId = app.organizationId || app.organization?.id;
        const appPubId = String(app.publicId || app.id || app.applicationId || `app-${appsCount}`).slice(0, 100);
        const appName = String(app.name || app.applicationName || app.publicId || app.id || `App-${appsCount}`).slice(0, 255);
        await nexusRepo.upsertApplication({
          applicationId: String(app.id || app.applicationId).slice(0, 100),
          applicationPublicId: appPubId,
          applicationName: appName,
          organizationId: orgId,
        });
        appsCount++;
      }
      console.log(`[fullSync] Synced ${appsCount} applications`);

      // 3. Fetch bulk reports (all apps with their latest scan info in one call)
      let reportsCount = 0;
      let vulnsCount = 0;
      const bulkReportsRaw: any = await execWithLog(client, "api/v2/reports/applications") || {};
      const bulkReports: any[] = Array.isArray(bulkReportsRaw) ? bulkReportsRaw : (bulkReportsRaw?.applications || bulkReportsRaw?.items || []);
      console.log(`[fullSync] Bulk reports returned ${bulkReports.length} entries`);

      // Map appId -> latest report info for quick lookup
      const appReportMap = new Map<string, any>();
      for (const entry of bulkReports) {
        const appId = entry.applicationId;
        if (!appId) continue;
        const existing = appReportMap.get(appId);
        if (!existing || new Date(entry.evaluationDate) > new Date(existing.evaluationDate)) {
          appReportMap.set(appId, entry);
        }
      }

      // Build lookup: application_id (varchar) -> id (uuid) for FK in unified_findings
      const appIdToUuid = await nexusRepo.getAppIdToUuidMap();

      // 4. Process reports & vulnerabilities in parallel batches
      const CONCURRENCY = 10;
      const reportEntries = Array.from(appReportMap.entries());
      for (let i = 0; i < reportEntries.length; i += CONCURRENCY) {
        const batch = reportEntries.slice(i, i + CONCURRENCY);
        const results = await Promise.allSettled(batch.map(async ([appId, entry]: [string, any]) => {
          const scanId = entry.reportId?.toString?.() || entry.id?.toString() || entry.latestReportId;
          const scanDate = entry.evaluationDate || entry.scanDate || entry.timePeriod || new Date().toISOString().split("T")[0];
          const reportUrl = entry.latestReportHtmlUrl || entry.reportHtmlUrl || entry.embeddableReportHtmlUrl;
          // Upsert the scan report
          await nexusRepo.upsertScanReport({
            scanId: scanId || `report-${appId}`,
            applicationId: appId,
            applicationPublicId: null,
            stage: mapStage(entry.stage),
            scanDate: new Date(scanDate).toISOString().split("T")[0],
            reportUrl,
            syncBatchId: batchId,
          });
          // Fetch vulns via the raw data URL
          const rawUrl = entry.reportDataUrl || `api/v2/scan/${scanId}/raw`;
          const vulnData: any = await execWithLog(client, rawUrl);
          const rawVulns: any[] = vulnData?.components || vulnData?.vulnerabilities || vulnData?.results || [];
          return { appId, appUuid: appIdToUuid.get(appId), scanId, rawVulns };
        }));
        for (const result of results) {
          if (result.status === "rejected") {
            errors.push({ step: "process_report", message: result.reason?.message });
            continue;
          }
          const { appId, appUuid, scanId, rawVulns } = result.value;
          reportsCount++;
          if (rawVulns.length > 0) {
            const nexusVulns = rawVulns.map((v: any, idx: number) => ({
              vulnerabilityId: v.vulnerabilityId || v.id || `${scanId}-${idx}`,
              refId: v.referenceId || v.refId,
              cvssScore: v.cvssScore || v.score || v.cvss?.score || 0,
              severity: (v.severity || "MEDIUM").toUpperCase(),
              componentName: v.componentName || v.component?.name || v.component?.displayName || "unknown",
              componentVersion: v.componentVersion || v.component?.version || v.component?.displayVersion || "unknown",
              packageUrl: v.packageUrl || v.component?.packageUrl,
              status: v.status || v.state || v.threatCategory || "Open",
              applicationId: appId,
              scanId,
              syncBatchId: batchId,
              firstSeenDate: v.firstSeenDate,
              lastSeenDate: v.lastSeenDate,
            }));
            await nexusRepo.bulkUpsertVulnerabilitiesFromNexus(nexusVulns);
            vulnsCount += nexusVulns.length;
            if (appUuid) {
              const unifiedEntries = nexusVulns.map((v: any) => ({
                sourceTool: "NEXUS",
                sourceId: v.vulnerabilityId,
                sourceTable: "nexus_vulnerabilities",
                title: v.cveId || `${v.componentName}:${v.componentVersion}`,
                unifiedSeverity: v.severity,
                cvssScore: v.cvssScore,
                status: mapStatus(v.status),
                componentName: v.componentName,
                componentVersion: v.componentVersion,
                packageUrl: v.packageUrl,
                scanId,
                applicationId: appUuid,
                metadata: { refId: v.refId, syncBatchId: batchId },
              }));
              for (let j = 0; j < unifiedEntries.length; j += 500) {
                await unifiedFindingRepo.bulkUpsertFindings(unifiedEntries.slice(j, j + 500));
              }
            }
          }
        }
        if ((i / CONCURRENCY) % 20 === 0) {
          console.log(`[fullSync] Processed ${Math.min(i + CONCURRENCY, reportEntries.length)}/${reportEntries.length} reports, ${reportsCount} reports, ${vulnsCount} vulns`);
        }
      }

      // 5. Trigger KPI recalculation
      try {
        const { kpiService } = await import("./kpi.service.js");
        await kpiService.recalculate();
      } catch (err: any) {
        errors.push({ step: "kpi_recalculate", message: err.message });
      }

      const summary = `Synced ${orgsCount} orgs, ${appsCount} apps, ${reportsCount} reports, ${vulnsCount} vulnerabilities`;
      await nexusRepo.updateSyncLog(batchId, {
        status: errors.length ? "COMPLETED_WITH_ERRORS" : "SUCCESS",
        endTime: new Date().toISOString(),
        summary,
      });

      return { batchId, orgsCount, appsCount, reportsCount, vulnsCount, errors };
    } catch (err: any) {
      await nexusRepo.updateSyncLog(batchId, {
        status: "FAILED",
        endTime: new Date().toISOString(),
        summary: `Sync failed: ${err.message}`,
      });
      throw err;
    }
  },

  // ---- Products ----
  async listProducts(search?: string) { return nexusRepo.listProducts(search); },
  async getProduct(productId: string) {
    const p = await nexusRepo.getProduct(productId);
    if (!p) throw new NotFoundError("Product", productId);
    return p;
  },

  // ---- Applications ----
  async listApplications(productId?: string, search?: string) {
    return nexusRepo.listApplications(productId, search);
  },

  // ---- Vulnerabilities (via unified_findings) ----
  async listVulnerabilities(filters: any) {
    return unifiedFindingRepo.listFindings({ ...filters, sourceTool: "NEXUS" });
  },

  async getVulnerability(id: string) {
    const v = await unifiedFindingRepo.getFinding(id);
    if (!v) throw new NotFoundError("Vulnerability", id);
    return v;
  },

  // ---- Waivers ----
  async listWaivers(filters: any) { return nexusRepo.listWaivers(filters); },

  async createWaiver(data: any) {
    return nexusRepo.createWaiver({
      ...data,
      waiverId: data.waiverId || crypto.randomUUID(),
      creationDate: new Date().toISOString(),
      syncBatchId: crypto.randomUUID(),
    });
  },

  // ---- KPI ----
  async getExecutiveKpis() {
    const snapshot = await nexusRepo.getLatestKpiSnapshot();
    const products = await nexusRepo.listProducts();
    const alerts = await nexusRepo.listAlerts(10);

    const productHeatmap = await Promise.all(
      products.map(async (p: any) => {
        const vulns = await unifiedFindingRepo.listFindings({ page: 1, limit: 10000, productId: p.productId });
        const aggregates = riskScoreService.getAggregates(vulns.data, p.businessCriticality);
        return {
          productId: p.productId,
          productName: p.name,
          score: aggregates.riskScore,
          grade: aggregates.grade,
          criticalCount: aggregates.criticalCount,
          highCount: aggregates.highCount,
          totalCount: vulns.total,
          waiversCount: aggregates.activeWaiversCount,
        };
      })
    );

    return { snapshot, recentAlerts: alerts, productHeatmap };
  },

  async getProductKpis(productId: string) {
    const product = await nexusRepo.getProduct(productId);
    if (!product) throw new NotFoundError("Product", productId);

    const vulns = await unifiedFindingRepo.listFindings({ page: 1, limit: 10000, productId });
    const aggregates = riskScoreService.getAggregates(vulns.data, product.businessCriticality);
    const waivers = await nexusRepo.listWaivers({ productId });

    return {
      productId: product.productId,
      productName: product.name,
      ...aggregates,
      activeWaiversCount: waivers.filter((w: any) => w.status === "active").length,
      topVulnerableComponents: vulns.data
        .filter((v: any) => v.severity === "CRITICAL" || v.severity === "HIGH")
        .slice(0, 10)
        .map((v: any) => ({
          componentName: v.componentName,
          version: v.componentVersion,
          severity: v.unifiedSeverity,
          cvssScore: v.cvssScore,
          vulnerabilityId: v.id,
        })),
    };
  },

  async getProductRiskScore(productId: string) {
    const product = await nexusRepo.getProduct(productId);
    if (!product) throw new NotFoundError("Product", productId);
    const vulns = await unifiedFindingRepo.listFindings({ page: 1, limit: 10000, productId });
    const aggregates = riskScoreService.getAggregates(vulns.data, product.businessCriticality);
    return aggregates;
  },
};
