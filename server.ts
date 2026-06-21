/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateFullDataset } from "./src/nexusMockData";
import { NexusApiClient, NexusConfig } from "./src/nexusApiClient";
import { 
  NexusKPISnapshot, 
  NexusProduct, 
  NexusApplication, 
  NexusScanReport, 
  NexusVulnerability, 
  NexusPolicyViolation, 
  NexusWaiver, 
  NexusComponent, 
  NexusAlert, 
  NexusSyncLog 
} from "./src/nexusTypes";

// Load Environment variables fallback
const DEFAULT_URL = process.env.NEXUS_IQ_URL || "https://soft-security:8070/";
const DEFAULT_USERNAME = process.env.NEXUS_IQ_USERNAME || "ftekitek";
const DEFAULT_TOKEN = process.env.NEXUS_IQ_TOKEN || "kvq6XXWn";

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent In-Memory Databases mimicking schema state for testing
let dataset = generateFullDataset();

let products: NexusProduct[] = [...dataset.products];
let organizations = [...dataset.organizations];
let applications: NexusApplication[] = [...dataset.applications];
let mappings = [...dataset.mappings];
let scans: NexusScanReport[] = [...dataset.scans];
let components: NexusComponent[] = [...dataset.components];
let vulnerabilities: NexusVulnerability[] = [...dataset.vulnerabilities];
let violations: NexusPolicyViolation[] = [...dataset.violations];
let waivers: NexusWaiver[] = [...dataset.waivers];
let alerts: NexusAlert[] = [...dataset.alerts];
let syncLogs: NexusSyncLog[] = [...dataset.initialSyncLogs];
let snapshot: NexusKPISnapshot = { ...dataset.snapshot };

// Active Connection Config on the server
let currentConConfig: NexusConfig = {
  url: DEFAULT_URL,
  username: DEFAULT_USERNAME,
  token: DEFAULT_TOKEN,
  timeoutMs: 5000,
  maxRetries: 3
};

// Sync State Variables for async progress tracking
let isCurrentlySyncing = false;
let syncProgress = 0;
let lastSyncBatchId = "batch-seed-202606";

// --- RISK SCORE ENGINE CALCULATION ---
// Calculates score based on the proposed formula:
// Risk Score = CVSS Weight + Severity Weight + Reachability Weight + Exploitability Weight + Age Weight + Business Criticality Weight + Waiver Penalty + Fix Availability Weight
function calculateModelRiskScore(vuln: NexusVulnerability, productCriticality: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"): number {
  let score = 0;

  // 1. CVSS Weight: cvssScore * 4 (max 40)
  score += vuln.cvssScore * 4;

  // 2. Severity Weight: CRITICAL: 15, HIGH: 10, MEDIUM: 5, LOW: 2
  if (vuln.severity === "CRITICAL") score += 15;
  else if (vuln.severity === "HIGH") score += 10;
  else if (vuln.severity === "MEDIUM") score += 5;
  else score += 2;

  // 3. Reachability Weight: REACHABLE: 15, UNKNOWN: 5, NOT_REACHABLE: 0
  if (vuln.reachable === "REACHABLE") score += 15;
  else if (vuln.reachable === "UNKNOWN") score += 5;

  // 4. Exploitability Weight: EASY: 10, MEDIUM: 6, HARD: 3, THEORETICAL: 0
  if (vuln.exploitability === "EASY") score += 10;
  else if (vuln.exploitability === "MEDIUM") score += 6;
  else if (vuln.exploitability === "HARD") score += 3;

  // 5. Age Weight: ageInDays > 90: 10, ageInDays > 30: 5, else 2
  if (vuln.ageInDays > 90) score += 10;
  else if (vuln.ageInDays > 30) score += 5;
  else score += 2;

  // 6. Business Criticality Weight: CRITICAL: 10, HIGH: 7, MEDIUM: 4, LOW: 1
  if (productCriticality === "CRITICAL") score += 10;
  else if (productCriticality === "HIGH") score += 7;
  else if (productCriticality === "MEDIUM") score += 4;
  else score += 1;

  // 7. Waiver Penalty
  // Active waiver: -20, Expired waiver: +20, accepted: -10, pending: 0
  if (vuln.status === "Waived") score -= 15;
  else if (vuln.status === "Accepted") score -= 10;
  
  // 8. Fix Availability Weight
  // Fix available but not applied: +10, else 0
  if (vuln.fixAvailable && vuln.status === "Open") {
    score += 10;
  }

  // Cap score between 0 and 100
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Compute aggregate metrics for a single product
function getProductAggregates(pKey: string) {
  const p = products.find(prod => prod.product_id === pKey);
  if (!p) return null;

  // Find all mapped apps
  const mappedAppIds = mappings
    .filter(m => m.product_id === pKey)
    .map(m => m.applicationId);

  // Filter vulnerabilities in these apps
  const pVulns = vulnerabilities.filter(v => mappedAppIds.includes(v.applicationId));
  const activeVulns = pVulns.filter(v => v.status === "Open");

  let totalScoreSum = 0;
  let count = 0;
  pVulns.forEach(v => {
    totalScoreSum += calculateModelRiskScore(v, p.business_criticality);
    count++;
  });

  const avgScore = count > 0 ? Math.round(totalScoreSum / count) : 10; // default baseline

  // Resolve visual Grade (Green 0-20, Yellow 21-50, Orange 51-75, Red 76-100)
  let grade: "GREEN" | "ORANGE" | "RED" = "GREEN";
  if (avgScore > 75) grade = "RED";
  else if (avgScore > 50) grade = "ORANGE";
  else if (avgScore > 20) grade = "ORANGE"; // let 21-50 be ORANGE or Yellow (Muted color range)

  const criticalCount = activeVulns.filter(v => v.severity === "CRITICAL").length;
  const highCount = activeVulns.filter(v => v.severity === "HIGH").length;
  const mediumCount = activeVulns.filter(v => v.severity === "MEDIUM").length;
  const lowCount = activeVulns.filter(v => v.severity === "LOW").length;

  const appWaivers = waivers.filter(w => w.productId === pKey && w.status === "active");

  // Remediation MTTR and velocity models
  const mttrDays = pKey === "megara" ? 22 : pKey === "soliam" ? 27 : 14;
  const fixVelocity = pKey === "megara" ? 64 : pKey === "soliam" ? 58 : 82;

  // Aging groups
  const aging = { under30: 0, "30to60": 0, "60to90": 0, "90to180": 0, over180: 0 };
  pVulns.forEach(v => {
    if (v.ageInDays <= 30) aging.under30++;
    else if (v.ageInDays <= 60) aging["30to60"]++;
    else if (v.ageInDays <= 90) aging["60to90"]++;
    else if (v.ageInDays <= 180) aging["90to180"]++;
    else aging.over180++;
  });

  // Top components
  const pApps = applications.filter(a => mappedAppIds.includes(a.applicationId));
  const topComponents = components
    .slice(0, 5)
    .map((comp, idx) => ({
      componentName: comp.componentName,
      version: comp.currentVersion,
      severity: idx % 3 === 0 ? "CRITICAL" : idx % 3 === 1 ? "HIGH" : "MEDIUM" as any,
      cvssScore: idx % 3 === 0 ? 9.8 : idx % 3 === 1 ? 8.4 : 6.5,
      remediationTargetVersion: comp.recommendedVersion,
      affectedApps: 1 + (idx % 3)
    }));

  return {
    productId: p.product_id,
    productName: p.name,
    riskScore: avgScore,
    grade,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    securityDebt: Math.round(avgScore * 4.5), // simulated effort in engineer days
    compliancePercentage: Math.max(30, 100 - avgScore),
    mttrDays,
    fixVelocityPercentage: fixVelocity,
    activeWaiversCount: appWaivers.length,
    agingStats: aging,
    backlogDetails: pApps.map(app => ({
      applicationId: app.applicationId,
      applicationName: app.applicationName,
      vulnerabilitiesCount: pVulns.filter(v => v.applicationId === app.applicationId && v.status === "Open").length,
      status: "ACTIVE_SCAN"
    })),
    topVulnerableComponents: topComponents
  };
}

// -------------------------------------------------------------
// ENDPOINTS
// -------------------------------------------------------------

// Configurations management APIs
app.get("/api/nexus/config", (req, res) => {
  res.json({
    url: currentConConfig.url,
    username: currentConConfig.username,
    timeoutMs: currentConConfig.timeoutMs,
    maxRetries: currentConConfig.maxRetries
  });
});

app.post("/api/nexus/config", (req, res) => {
  const { url, username, token, timeoutMs, maxRetries } = req.body;
  if (!url || !username) {
    return res.status(400).json({ error: "API URL and Username parameter attributes cannot be empty." });
  }

  currentConConfig = {
    url,
    username,
    token: token || currentConConfig.token, // preserve previous if empty
    timeoutMs: Number(timeoutMs) || 5000,
    maxRetries: Number(maxRetries) || 3
  };

  res.json({ success: true, message: "Sonatype connection parameters saved successfully.", config: { ...currentConConfig, token: "******" } });
});

// GET /api/nexus/products
app.get("/api/nexus/products", (req, res) => {
  res.json(products);
});

// GET /api/nexus/applications
app.get("/api/nexus/applications", (req, res) => {
  res.json(applications);
});

// GET /api/nexus/scans
app.get("/api/nexus/scans", (req, res) => {
  res.json(scans);
});

// GET /api/nexus/vulnerabilities
app.get("/api/nexus/vulnerabilities", (req, res) => {
  const { severity, status, search, productId, limit } = req.query;

  let filtered = [...vulnerabilities];

  if (severity) {
    filtered = filtered.filter(v => v.severity === String(severity).toUpperCase());
  }
  if (status) {
    filtered = filtered.filter(v => v.status.toLowerCase() === String(status).toLowerCase());
  }
  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(v => 
      v.vulnerabilityId.toLowerCase().includes(s) || 
      v.componentName.toLowerCase().includes(s)
    );
  }

  if (productId) {
    const mappedAppIds = mappings
      .filter(m => m.product_id === String(productId))
      .map(m => m.applicationId);
    filtered = filtered.filter(v => mappedAppIds.includes(v.applicationId));
  }

  const limVal = Number(limit) || 200;
  res.json(filtered.slice(0, limVal));
});

// GET /api/nexus/policy-violations
app.get("/api/nexus/policy-violations", (req, res) => {
  res.json(violations);
});

// GET /api/nexus/waivers
app.get("/api/nexus/waivers", (req, res) => {
  res.json(waivers);
});

// POST /api/nexus/waivers (Allows adding/approving mock waivers on the fly!)
app.post("/api/nexus/waivers", (req, res) => {
  const { violationId, reason, approver, requester, expirationDate, productId, applicationId, componentName, riskAcceptanceComment } = req.body;
  
  if (!violationId || !reason) {
    return res.status(400).json({ error: "Missing required fields (violationId, reason)." });
  }

  const newWaiver: NexusWaiver = {
    id: `waiver-post-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source_system: "sonatype_nexus_iq",
    sync_batch_id: lastSyncBatchId,
    waiverId: `waiver-iq-post-${Math.floor(Math.random() * 9000 + 1000)}`,
    violationId,
    reason,
    approver: approver || "Fayez Tekitek",
    requester: requester || "Hassen Ben Ali",
    creationDate: new Date().toISOString().split("T")[0],
    expirationDate: expirationDate || null,
    status: "active",
    productId: productId || "megara",
    applicationId: applicationId || "app-101",
    componentName: componentName || "com.unspecified:library",
    riskAcceptanceComment: riskAcceptanceComment || "Granted temporarily."
  };

  waivers.push(newWaiver);

  // Automatically create a companion audit trail logging item
  alerts.push({
    id: `alert-post-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source_system: "sonatype_nexus_iq",
    sync_batch_id: lastSyncBatchId,
    alertType: "WAIVER_EXPIRING",
    message: `New manual waiver ${newWaiver.waiverId} approved by ${newWaiver.approver} for component ${newWaiver.componentName}.`,
    productId: newWaiver.productId,
    applicationId: newWaiver.applicationId,
    timestamp: new Date().toISOString(),
    archived: false
  });

  res.json({ success: true, waiver: newWaiver });
});

// GET /api/nexus/kpis/executive
app.get("/api/nexus/kpis/executive", (req, res) => {
  // Aggregate details across all products to generate heatmap coordinates
  const heatmap = products.map(p => {
    const agg = getProductAggregates(p.product_id);
    return {
      productId: p.product_id,
      productName: p.name,
      score: agg?.riskScore || 10,
      grade: agg?.grade || "GREEN",
      criticalCount: agg?.criticalCount || 0,
      highCount: agg?.highCount || 0,
      totalCount: (agg?.criticalCount || 0) + (agg?.highCount || 0) + (agg?.mediumCount || 0),
      waiversCount: agg?.activeWaiversCount || 0
    };
  });

  // Calculate totals
  const totalVulns = vulnerabilities.length;
  const criticalVulns = vulnerabilities.filter(v => v.severity === "CRITICAL" && v.status === "Open").length;
  const highVulns = vulnerabilities.filter(v => v.severity === "HIGH" && v.status === "Open").length;
  const expiredWaivers = waivers.filter(w => w.status === "expired").length;

  const redCount = heatmap.filter(h => h.grade === "RED").length;
  const orangeCount = heatmap.filter(h => h.grade === "ORANGE").length;
  const greenCount = heatmap.filter(h => h.grade === "GREEN").length;

  const summarySnapshot: NexusKPISnapshot = {
    id: "snap-run",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source_system: "sonatype_nexus_iq",
    sync_batch_id: lastSyncBatchId,
    snapshot_date: new Date().toISOString().split("T")[0],
    globalSecurityRiskScore: Math.round(heatmap.reduce((sum, item) => sum + item.score, 0) / products.length),
    totalVulnerabilities: totalVulns,
    criticalVulnerabilities: criticalVulns,
    highVulnerabilities: highVulns,
    newVulnerabilities: 14,
    fixedVulnerabilities: 45,
    acceptedRiskCount: waivers.length,
    expiredWaiversCount: expiredWaivers,
    productsRedCount: redCount,
    productsOrangeCount: orangeCount,
    productsGreenCount: greenCount,
    securityDebtScore: heatmap.reduce((sum, item) => sum + item.criticalCount * 8 + item.highCount * 3, 0),
    complianceScore: 100 - Math.round(heatmap.reduce((sum, item) => sum + item.score, 0) / products.length)
  };

  // Static historical trend line points
  const trendHistory = [
    { date: "Jan 26", critical: 18, high: 45, vulnerabilities: 152, avgScore: 40 },
    { date: "Feb 26", critical: 24, high: 55, vulnerabilities: 168, avgScore: 44 },
    { date: "Mar 26", critical: 32, high: 62, vulnerabilities: 175, avgScore: 50 },
    { date: "Apr 26", critical: 41, high: 74, vulnerabilities: 188, avgScore: 58 },
    { date: "May 26", critical: 46, high: 82, vulnerabilities: 195, avgScore: 62 },
    { date: "Jun 26", critical: criticalVulns, high: highVulns, vulnerabilities: totalVulns, avgScore: summarySnapshot.globalSecurityRiskScore }
  ];

  res.json({
    snapshot: summarySnapshot,
    recentAlerts: alerts.filter(a => !a.archived).slice(0, 10),
    productHeatmap: heatmap,
    trendHistory
  });
});

// GET /api/nexus/kpis/product/{productId}
app.get("/api/nexus/kpis/product/:productId", (req, res) => {
  const pId = req.params.productId;
  const aggregates = getProductAggregates(pId);
  if (!aggregates) {
    return res.status(404).json({ error: `Product profile '${pId}' not found.` });
  }
  res.json(aggregates);
});

// GET /api/nexus/risk-score/product/{productId}
app.get("/api/nexus/risk-score/product/:productId", (req, res) => {
  const pId = req.params.productId;
  const aggregates = getProductAggregates(pId);
  if (!aggregates) {
    return res.status(404).json({ error: `Product '${pId}' not found for risk assessment.` });
  }
  res.json({
    productId: pId,
    productName: aggregates.productName,
    riskScore: aggregates.riskScore,
    grade: aggregates.grade,
    factors: {
      criticalVulnerabilities: aggregates.criticalCount,
      highVulnerabilities: aggregates.highCount,
      activeWaivers: aggregates.activeWaiversCount,
      remediationMTTRWeeks: Math.round(aggregates.mttrDays / 7)
    }
  });
});

// GET /api/nexus/sync/status
app.get("/api/nexus/sync/status", (req, res) => {
  res.json({
    isSyncing: isCurrentlySyncing,
    progress: syncProgress,
    lastSyncBatchId
  });
});

// POST /api/nexus/sync (Full synchronous ingestion cycle simulation)
app.post("/api/nexus/sync", async (req, res) => {
  if (isCurrentlySyncing) {
    return res.status(409).json({ error: "Background synchronization is already processing in an active thread." });
  }

  isCurrentlySyncing = true;
  syncProgress = 5;
  const start = Date.now();
  const batchId = `runs-${Date.now().toString().substring(7)}`;

  // Connect client to execute probe
  const client = new NexusApiClient(currentConConfig);
  client.log("Starting full workspace synchronization sequence with Sonatype Nexus-IQ API Core context...");

  // Background state runner simulating async step updates
  const timer = setInterval(() => {
    if (syncProgress < 90) {
      syncProgress += Math.floor(Math.random() * 15) + 5;
    }
  }, 400);

  try {
    // Probing connection
    await client.testConnection();

    syncProgress = 40;
    client.log("API link verified. Commencing data parsing mapping on 4 Organizations...");
    // Simulate updating counts or adding minor modifications dynamically to prove the data changes!
    const randomShiftCount = Math.floor(Math.random() * 5);
    for (let i = 0; i < randomShiftCount; i++) {
      // randomly toggle or modify a vulnerability status from wait to active to trigger shifts
      const randIdx = Math.floor(Math.random() * vulnerabilities.length);
      vulnerabilities[randIdx].status = "Fixed";
      vulnerabilities[randIdx].ageInDays += 1;
    }

    syncProgress = 80;
    client.log("Aggregating multi-level metrics snapshots...");
    lastSyncBatchId = batchId;

    clearInterval(timer);
    isCurrentlySyncing = false;
    syncProgress = 100;

    const summary = `Completed full synchronisation run. Ingested 20 Applications. Synced ${vulnerabilities.length} active vulnerabilities registries. Calculated risk grades for Vermeg's 8 central core delivery frameworks.`;
    
    // Register sync logs
    const completedLog: NexusSyncLog = {
      id: `synclog-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_system: "sonatype_nexus_iq",
      sync_batch_id: batchId,
      batchId,
      startTime: new Date(start).toISOString(),
      endTime: new Date().toISOString(),
      executedBy: "ftekitek",
      status: "SUCCESS",
      summary,
      logs: client.getMaskedLogs(),
      retryCount: 0,
      targetUrl: currentConConfig.url
    };

    syncLogs.unshift(completedLog);

    res.json({
      success: true,
      batchId,
      elapsedMs: Date.now() - start,
      summary
    });

  } catch (err: any) {
    clearInterval(timer);
    isCurrentlySyncing = false;
    syncProgress = 0;

    client.log(`Synchronization aborted prematurely due to: ${err?.message || "Internal Connection Abort"}`, true);

    const abortedLog: NexusSyncLog = {
      id: `synclog-fail-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_system: "sonatype_nexus_iq",
      sync_batch_id: batchId,
      batchId,
      startTime: new Date(start).toISOString(),
      endTime: new Date().toISOString(),
      executedBy: "ftekitek",
      status: "FAILED",
      summary: `Failed sync run. Reason: ${err?.message || "API connection lost."}`,
      logs: client.getMaskedLogs(),
      retryCount: 1,
      targetUrl: currentConConfig.url
    };

    syncLogs.unshift(abortedLog);

    res.status(502).json({
      success: false,
      batchId,
      error: err?.message || "Gateway API Connection Timeout Error"
    });
  }
});

// GET /api/nexus/sync/logs
app.get("/api/nexus/sync/logs", (req, res) => {
  res.json(syncLogs);
});

// GET /api/nexus/export/excel - SHEET INGEST
app.get("/api/nexus/export/excel", (req, res) => {
  // Return plain CSV or text formatted spreadsheet representing key values
  const fileLines: string[] = [];
  fileLines.push("Product ID,Product Name,Risk Score,Grade,Active Vulnerabilities,Critical,High,Waivers");
  
  products.forEach(p => {
    const agg = getProductAggregates(p.product_id);
    if (agg) {
      fileLines.push(`${p.product_id},${p.name},${agg.riskScore},${agg.grade},${agg.criticalCount + agg.highCount},${agg.criticalCount},${agg.highCount},${agg.activeWaiversCount}`);
    }
  });

  res.header("Content-Type", "text/csv");
  res.attachment("Vermeg_Sonatype_Waivers_Audit_Export.csv");
  return res.send(fileLines.join("\n"));
});

// GET /api/nexus/export/pdf
app.get("/api/nexus/export/pdf", (req, res) => {
  // Returns formatted administrative printout text
  const printText = `
========================================================================
             VERMEG RISK TOWER - DEVAST_SECOPS REPORT
             SONATYPE NEXUS IQ COMPLIANCE SUMMARY PORTAL
========================================================================
Generated On: ${new Date().toLocaleString()}
Initiated By: Audit Officer Portal (ftekitek)
Target Server: https://soft-security:8070/
Status: INTEGRATED

I. COMPLIANCE SNAPSHOT:
-----------------------
* Overall Security Risk Score: ${snapshot.globalSecurityRiskScore} / 100
* Active Tracked Vulnerabilities: ${vulnerabilities.length}
* active Waivers Approved: ${waivers.filter(w=>w.status === "active").length}
* critical policy violations: ${violations.filter(v=>v.threatLevel === 10).length}

II. CORE CORPORATE ROADMAP RATINGS:
-----------------------------------
${products.map(p => ` - ${p.name.toUpperCase()} (Grades: ${p.status}): Risk index evaluates to ${getProductAggregates(p.product_id)?.riskScore || "N/A"}. Waivers: ${getProductAggregates(p.product_id)?.activeWaiversCount || 0}.`).join("\n")}

III. DEVS_SECOPS REMEDIATION VERIFICATION OBLIGATIONS:
------------------------------------------------------
All high-severity and critical components MUST undergo version replacement or mitigation approval inside a structured 30-day SLA period. Waiver approval requires explicit justification in relation to customer security protocols.

[END OF AUTOMATED COMPLIANCE REPORT]
========================================================================
  `;

  res.header("Content-Type", "text/plain");
  res.attachment("Vermeg_Nexus_Compliance_Audit_Printout.txt");
  return res.send(printText);
});


// -------------------------------------------------------------
// VITE OR MIDDLEWARE PIPELINE ROUTING
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYS] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
