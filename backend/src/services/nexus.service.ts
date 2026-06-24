import { nexusRepo } from "../repositories/nexus.repo.js";
import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { riskScoreService } from "./riskScore.service.js";
import { createClientFromConfig, createClientFromCredentials } from "./nexusHttpClient.js";
import { NotFoundError, ValidationError } from "../core/errors.js";
import { credentialStore } from "./credentialStore.js";
import crypto from "crypto";
import { env } from "../config/env.js";

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
      name: a.name || a.publicId,
      organizationId: a.organizationId,
      status: a.status || "UNKNOWN",
      businessCriticality: a.businessCriticality || "N/A",
      productId: a.publicId || a.id,
    }));
    return { applications: remoteApps };
  },

  // ---- Reports ----

  async fetchReportHistory(data?: { sessionToken?: string; applicationId?: string }) {
    const creds = data?.sessionToken ? credentialStore.retrieve(data.sessionToken) : null;
    if (!creds || !data?.applicationId) return { reports: [] };
    const client = createClientFromCredentials(creds);
    const result = await client.executeRequest<any>(`api/v2/reports/applications/${data.applicationId}/history`);
    const raw = result?.reports || (Array.isArray(result) ? result : []);
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

  async executeSync(data: any) {
    const client = await createClientFromConfig();
    const batchId = data.batchId || crypto.randomUUID();

    try {
      const orgs = await client.executeRequest<any[]>("api/v2/organizations");
      const apps = await client.executeRequest<any[]>("api/v2/applications");
      const vulns = await client.executeRequest<any[]>("api/v2/vulnerabilities");

      if (Array.isArray(vulns)) {
        await unifiedFindingRepo.bulkUpsertFindings(vulns.map((v: any) => ({
          sourceTool: "NEXUS",
          sourceId: v.vulnerabilityId,
          sourceTable: "nexus_vulnerabilities",
          title: v.cveId || `${v.componentName}:${v.componentVersion}`,
          unifiedSeverity: v.severity,
          cvssScore: v.cvssScore,
          cveId: v.cveId,
          status: v.status || "OPEN",
          componentName: v.componentName,
          componentVersion: v.componentVersion,
          packageUrl: v.packageUrl,
          scanId: v.scanId,
          applicationId: v.applicationId,
          fixAvailable: v.fixAvailable || false,
          recommendedVersion: v.recommendedVersion,
          metadata: { refId: v.refId, syncBatchId },
        })));
      }

      await nexusRepo.updateSyncLog(batchId, {
        status: "SUCCESS",
        endTime: new Date().toISOString(),
        summary: `Synced ${vulns?.length || 0} vulnerabilities, ${apps?.length || 0} applications`,
      });
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
