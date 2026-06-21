/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  NexusProduct,
  NexusOrganization,
  NexusApplication,
  ProductApplicationMapping,
  NexusScanReport,
  NexusVulnerability,
  NexusPolicyViolation,
  NexusWaiver,
  NexusComponent,
  NexusKPISnapshot,
  NexusAlert,
  NexusSyncLog
} from "./nexusTypes";

// The 8 Corporate Products of Vermeg
export const PRODUCTS_LIST = [
  { key: "megara", name: "Megara", criticality: "CRITICAL", owner: "Thomas Lemaire", secOwner: "Marc-Antoine" },
  { key: "soliam", name: "Soliam", criticality: "CRITICAL", owner: "Sophia Berrada", secOwner: "Fayez Tekitek" },
  { key: "digital_insurance", name: "Digital Insurance", criticality: "HIGH", owner: "Jean-Pierre", secOwner: "Clara Dupont" },
  { key: "framework", name: "Framework", criticality: "CRITICAL", owner: "Hassen Ben Ali", secOwner: "Fayez Tekitek" },
  { key: "solife", name: "Solife", criticality: "CRITICAL", owner: "Laurent Gasser", secOwner: "Marc-Antoine" },
  { key: "digital_banking", name: "Digital Banking", criticality: "HIGH", owner: "Amir Chater", secOwner: "Clara Dupont" },
  { key: "solife_plat", name: "Solife Digital Platform", criticality: "HIGH", owner: "Laurent Gasser", secOwner: "Fayez Tekitek" },
  { key: "colline", name: "Colline", criticality: "LOW", owner: "Nadia Belhaj", secOwner: "Clara Dupont" }
];

// Seed raw lists to dynamically construct the exact numbers requested 
// (8 products, 20 apps, 50 scans, 200 vulnerabilities, 80 policy violations, 30 waivers, 100 components)

export function generateFullDataset() {
  const batchId = "batch-seed-202606";
  const source = "sonatype_nexus_iq";
  const nowStr = new Date().toISOString();

  // 1. Organizations
  const organizations: NexusOrganization[] = [
    { id: "org-1", created_at: nowStr, updated_at: nowStr, source_system: source, sync_batch_id: batchId, organizationId: "vmg-org-core", organizationName: "Vermeg Core Architecture", parentOrganizationId: null },
    { id: "org-2", created_at: nowStr, updated_at: nowStr, source_system: source, sync_batch_id: batchId, organizationId: "vmg-org-wealth", organizationName: "Vermeg Wealth solutions", parentOrganizationId: null },
    { id: "org-3", created_at: nowStr, updated_at: nowStr, source_system: source, sync_batch_id: batchId, organizationId: "vmg-org-digital", organizationName: "Vermeg Digital Factory", parentOrganizationId: null },
    { id: "org-4", created_at: nowStr, updated_at: nowStr, source_system: source, sync_batch_id: batchId, organizationId: "vmg-org-insurance", organizationName: "Vermeg Life Insurance Dev", parentOrganizationId: null }
  ];

  // 2. Products (8 items)
  const products: NexusProduct[] = PRODUCTS_LIST.map((p, idx) => ({
    id: `prod-sql-${p.key}`,
    created_at: nowStr,
    updated_at: nowStr,
    source_system: source,
    sync_batch_id: batchId,
    product_id: p.key,
    name: p.name,
    status: idx === 0 || idx === 1 ? "RED" : idx === 4 || idx === 6 ? "ORANGE" : "GREEN",
    business_criticality: p.criticality as any,
    security_owner: p.secOwner,
    product_owner: p.owner
  }));

  // 3. Applications (exactly 20 apps)
  const applications: NexusApplication[] = [];
  const appNames = [
    { key: "megara-sso", fullname: "Megara SSO Core module", orgId: "vmg-org-core" },
    { key: "megara-vault", fullname: "Megara Security Vault Proxy", orgId: "vmg-org-core" },
    { key: "megara-clearing", fullname: "Megara Settlement & Clearing engine", orgId: "vmg-org-core" },
    { key: "soliam-crm", fullname: "Soliam Investor Relations Portal", orgId: "vmg-org-wealth" },
    { key: "soliam-accounting", fullname: "Soliam Portfolio Accounting backend", orgId: "vmg-org-wealth" },
    { key: "soliam-order", fullname: "Soliam Trading Desk Orchestrator", orgId: "vmg-org-wealth" },
    { key: "digi-ins-life", fullname: "Digital Insurance - Term Life UI", orgId: "vmg-org-insurance" },
    { key: "digi-ins-underwrite", fullname: "Digital Insurance Underwriting Rules Engine", orgId: "vmg-org-insurance" },
    { key: "vmg-framework-db", fullname: "Vermeer Framework DB Persist Plugin", orgId: "vmg-org-core" },
    { key: "vmg-framework-auth", fullname: "Vermeer IAM Authorization Middleware", orgId: "vmg-org-core" },
    { key: "solife-actuary", fullname: "Solife Pension Calculators REST service", orgId: "vmg-org-insurance" },
    { key: "solife-policy", fullname: "Solife Contract Master backend", orgId: "vmg-org-insurance" },
    { key: "solife-portal", fullname: "Solife Broker Digital Hub", orgId: "vmg-org-insurance" },
    { key: "digi-bank-transfer", fullname: "Digital Banking instant credit payment service", orgId: "vmg-org-digital" },
    { key: "digi-bank-onboarding", fullname: "Digital Banking automated client KYC workflow", orgId: "vmg-org-digital" },
    { key: "solife-plat-esb", fullname: "Solife Platform integration enterprise bus", orgId: "vmg-org-digital" },
    { key: "solife-plat-reporting", fullname: "Solife Platform tax statement report engine", orgId: "vmg-org-digital" },
    { key: "colline-margin", fullname: "Colline Collateral Optimizer", orgId: "vmg-org-core" },
    { key: "colline-exposure", fullname: "Colline Real-time Exposure calculator", orgId: "vmg-org-core" },
    { key: "vmg-framework-ui", fullname: "Vermeer Admin Dashboard Framework UI library", orgId: "vmg-org-core" }
  ];

  appNames.forEach((a, idx) => {
    // Map application to their related product key
    let mappedProd = "framework";
    if (a.key.startsWith("megara")) mappedProd = "megara";
    else if (a.key.startsWith("soliam")) mappedProd = "soliam";
    else if (a.key.startsWith("digi-ins")) mappedProd = "digital_insurance";
    else if (a.key.startsWith("solife-plat")) mappedProd = "solife_plat";
    else if (a.key.startsWith("solife")) mappedProd = "solife";
    else if (a.key.startsWith("digi-bank")) mappedProd = "digital_banking";
    else if (a.key.startsWith("colline")) mappedProd = "colline";

    const prodInfo = PRODUCTS_LIST.find((p) => p.key === mappedProd)!;

    applications.push({
      id: `app-sql-${a.key}`,
      created_at: nowStr,
      updated_at: nowStr,
      source_system: source,
      sync_batch_id: batchId,
      applicationId: `app-${idx + 101}`,
      applicationPublicId: `pub-${a.key}`,
      applicationName: a.fullname,
      organizationId: a.orgId,
      tags: ["VERMEG_LIVE_PROD", "SDLC_PHASE_RELEASE"],
      categories: ["Security Level 1", "Core Fintech Services"],
      businessCriticality: prodInfo.criticality as any,
      securityOwner: prodInfo.secOwner,
      productOwner: prodInfo.owner
    });
  });

  // 4. Mappings
  const mappings: ProductApplicationMapping[] = applications.map((app) => {
    let mappedProd = "framework";
    const key = app.applicationPublicId;
    if (key.includes("megara")) mappedProd = "megara";
    else if (key.includes("soliam")) mappedProd = "soliam";
    else if (key.includes("digi-ins")) mappedProd = "digital_insurance";
    else if (key.includes("solife-plat")) mappedProd = "solife_plat";
    else if (key.includes("solife")) mappedProd = "solife";
    else if (key.includes("digi-bank")) mappedProd = "digital_banking";
    else if (key.includes("colline")) mappedProd = "colline";

    return {
      id: `map-sql-${app.applicationId}`,
      created_at: nowStr,
      updated_at: nowStr,
      source_system: source,
      sync_batch_id: batchId,
      product_id: mappedProd,
      organizationId: app.organizationId,
      applicationId: app.applicationId
    };
  });

  // 5. Scan Reports (exactly 50 scans)
  const scans: NexusScanReport[] = [];
  const stages = ["develop", "build", "release"] as const;
  for (let i = 0; i < 50; i++) {
    const app = applications[i % applications.length];
    const isLatest = i < applications.length; 
    const scanDate = new Date();
    scanDate.setDate(scanDate.getDate() - (i * 2) - 1);
    const dateStr = scanDate.toISOString().split("T")[0];

    // Determine counts based on product severity (make megara and soliam highly critical, colline super clean)
    let c = 0, h = 0, m = 0, l = 0;
    if (app.applicationPublicId.includes("megara")) {
      c = isLatest ? 8 : 4; h = isLatest ? 20 : 12; m = 40; l = 90;
    } else if (app.applicationPublicId.includes("soliam")) {
      c = isLatest ? 12 : 6; h = isLatest ? 28 : 19; m = 55; l = 72;
    } else if (app.applicationPublicId.includes("colline")) {
      c = 0; h = isLatest ? 1 : 0; m = 3; l = 10;
    } else {
      c = isLatest ? 2 : 1; h = isLatest ? 8 : 4; m = 22; l = 45;
    }

    scans.push({
      id: `scan-sql-${1000 + i}`,
      created_at: nowStr,
      updated_at: nowStr,
      source_system: source,
      sync_batch_id: batchId,
      scanId: `scan-pkg-run-${8000 + i}`,
      applicationId: app.applicationId,
      applicationPublicId: app.applicationPublicId,
      stage: stages[i % stages.length],
      scanDate: dateStr,
      reportUrl: `https://soft-security:8070/assets/index.html#/web/report/${app.applicationPublicId}/${stages[i%stages.length]}/${8000+i}`,
      policyEvaluationDate: dateStr,
      totalComponents: 110 + (i * 4),
      affectedComponents: 12 + (i % 8),
      criticalCount: c,
      highCount: h,
      mediumCount: m,
      lowCount: l
    });
  }

  // 6. Components (exactly 100 components)
  const components: NexusComponent[] = [];
  const componentLibs = [
    { name: "log4j-core", version: "2.16.0", latest: "2.17.1", rec: "2.17.1", parent: "org.apache.logging.log4j", risk: "CRITICAL", lic: "GREEN" },
    { name: "jackson-databind", version: "2.12.3", latest: "2.15.2", rec: "2.14.0", parent: "com.fasterxml.jackson.core", risk: "CRITICAL", lic: "GREEN" },
    { name: "spring-webmvc", version: "5.3.8", latest: "6.0.12", rec: "5.3.29", parent: "org.springframework", risk: "HIGH", lic: "GREEN" },
    { name: "netty-handler", version: "4.1.60.Final", latest: "4.1.97.Final", rec: "4.1.97.Final", parent: "io.netty", risk: "CRITICAL", lic: "GREEN" },
    { name: "protobuf-java", version: "3.15.5", latest: "3.24.1", rec: "3.21.12", parent: "com.google.protobuf", risk: "MEDIUM", lic: "GREEN" },
    { name: "guava", version: "30.1-jre", latest: "32.1.2-jre", rec: "32.0.0-jre", parent: "com.google.guava", risk: "HIGH", lic: "GREEN" },
    { name: "commons-compress", version: "1.20", latest: "1.24", rec: "1.21", parent: "org.apache.commons", risk: "CRITICAL", lic: "GREEN" },
    { name: "hibernate-core", version: "5.4.30.Final", latest: "6.2.7.Final", rec: "5.6.15.Final", parent: "org.hibernate", risk: "MEDIUM", lic: "YELLOW" },
    { name: "json-smart", version: "2.3", latest: "2.4.11", rec: "2.4.9", parent: "net.minidev", risk: "HIGH", lic: "GREEN" },
    { name: "bcprov-jdk15on", version: "1.65", latest: "1.74", rec: "1.70", parent: "org.bouncycastle", risk: "CRITICAL", lic: "GREEN" }
  ];

  for (let i = 0; i < 100; i++) {
    const libSeed = componentLibs[i % componentLibs.length];
    const finalName = `${libSeed.parent}:${libSeed.name}`;
    const dynamicVersion = libSeed.version;

    components.push({
      id: `comp-sql-${i + 1}`,
      created_at: nowStr,
      updated_at: nowStr,
      source_system: source,
      sync_batch_id: batchId,
      componentName: finalName,
      currentVersion: dynamicVersion,
      latestVersion: libSeed.latest,
      recommendedVersion: libSeed.rec,
      remediationPath: `Upgrade pom.xml dependency '${finalName}' configuration to version <bold>${libSeed.rec}</bold>. Test backwards compatibility on authentication integration vectors.`,
      securityRisk: libSeed.risk as any,
      licenseRisk: libSeed.lic as any,
      popularity: 85 - (i % 20),
      age: `${6 + (i % 24)} months`,
      numberOfAffectedApplications: 2 + (i % 5)
    });
  }

  // 7. Vulnerabilities (exactly 200 vulnerabilities)
  const vulnerabilities: NexusVulnerability[] = [];
  const cveDescriptions = [
    "Remote Code Execution (RCE) triggerable via serialized payload streams.",
    "SQL Injection in parsing interface of core transactional controller.",
    "Cryptographic bypass due to weak PRNG key seed vector allocation.",
    "SSRF payload validation flaw enabling port-knocking internal endpoints.",
    "JSON parsing memory exhaustion denial-of-service vulnerability.",
    "Unauthenticated administrative credential reset sequence logic flaw.",
    "Directory traversal in static asset compression middleware route.",
    "Prototype pollution inside recursive metadata parsing routine."
  ];

  for (let i = 0; i < 200; i++) {
    const scan = scans[i % scans.length];
    const comp = components[i % components.length];
    const cveId = `CVE-2026-${1100 + i}`;
    const score = 4.0 + (i % 6) + (i % 11) * 0.5 > 10 ? 9.8 : Math.round((4.0 + (i % 6) + (i % 11) * 0.5) * 10) / 10;
    
    let severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "MEDIUM";
    if (score >= 9.0) severity = "CRITICAL";
    else if (score >= 7.0) severity = "HIGH";
    else if (score >= 4.0) severity = "MEDIUM";
    else severity = "LOW";

    let status: "Open" | "Fixed" | "Accepted" | "Waived" | "False Positive" = "Open";
    if (i % 10 === 0) status = "Waived";
    else if (i % 15 === 0) status = "Accepted";
    else if (i % 12 === 0) status = "False Positive";
    else if (i % 18 === 0) status = "Fixed";

    const isDirect = i % 3 === 0;

    vulnerabilities.push({
      id: `vuln-sql-${i + 1}`,
      created_at: nowStr,
      updated_at: nowStr,
      source_system: source,
      sync_batch_id: batchId,
      vulnerabilityId: cveId,
      refId: `SONATYPE-${cveId.replace("CVE-", "IQ-")}`,
      cvssScore: score,
      cvssVector: `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`,
      severity,
      componentName: comp.componentName,
      componentVersion: comp.currentVersion,
      packageUrl: `pkg:maven/${comp.componentName.replace(":", "/")}/${comp.currentVersion}`,
      dependencyType: isDirect ? "direct" : "transitive",
      reachable: i % 4 === 0 ? "REACHABLE" : i % 4 === 1 ? "NOT_REACHABLE" : "UNKNOWN",
      recommendedVersion: comp.recommendedVersion,
      fixAvailable: i % 5 !== 4,
      exploitability: i % 3 === 0 ? "EASY" : i % 3 === 1 ? "MEDIUM" : "HARD",
      ageInDays: 14 + (i * 3),
      firstSeenDate: new Date(Date.now() - (30 + i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      lastSeenDate: nowStr.split("T")[0],
      status,
      applicationId: scan.applicationId,
      scanId: scan.scanId
    });
  }

  // 8. Policy Violations (exactly 80 policy violations)
  const violations: NexusPolicyViolation[] = [];
  const policies = [
    { name: "Security-Critical-Policy", level: 10, constraint: "Vulnerability Score >= 9" },
    { name: "Licensing-Commercial-Risk", level: 8, constraint: "Copyleft GPL licensing restriction" },
    { name: "Architectural-Obsolete-Age", level: 7, constraint: "Dependency older than 18 months" },
    { name: "High-Risk-Vulnerability-Policy", level: 8, constraint: "Vulnerability Score >= 7" },
    { name: "Security-Medium-Policy", level: 5, constraint: "Vulnerability Score >= 4" }
  ];

  for (let i = 0; i < 80; i++) {
    const policy = policies[i % policies.length];
    const app = applications[i % applications.length];
    const comp = components[i % components.length];

    let pkey = "framework";
    if (app.applicationPublicId.includes("megara")) pkey = "megara";
    else if (app.applicationPublicId.includes("soliam")) pkey = "soliam";
    else if (app.applicationPublicId.includes("digi-ins")) pkey = "digital_insurance";
    else if (app.applicationPublicId.includes("solife_plat")) pkey = "solife_plat";
    else if (app.applicationPublicId.includes("solife")) pkey = "solife";
    else if (app.applicationPublicId.includes("digi-bank")) pkey = "digital_banking";
    else if (app.applicationPublicId.includes("colline")) pkey = "colline";

    violations.push({
      id: `violation-sql-${i + 1}`,
      created_at: nowStr,
      updated_at: nowStr,
      source_system: source,
      sync_batch_id: batchId,
      violationId: `violation-iq-${67000 + i}`,
      policyName: policy.name,
      constraintName: policy.constraint,
      threatLevel: policy.level,
      applicationId: app.applicationId,
      productMapping: pkey,
      componentName: comp.componentName,
      stage: stages[i % stages.length],
      createdDate: new Date(Date.now() - (15 + i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: i % 6 === 5 ? "RESOLVED" : "OPEN",
      waiverStatus: i % 8 === 0 ? "ACTIVE" : i % 15 === 0 ? "EXPIRED" : "NONE",
      businessImpact: `Critical violation of ${policy.name} threatens product build promotion to operate stage.`
    });
  }

  // 9. Waivers (exactly 30 waivers)
  const waivers: NexusWaiver[] = [];
  const waiverReasons = [
    "Legacy library that is highly coupled with database integration layer; rewrite postponed.",
    "Vulnerable paths are completely shielded by input sanitation middleware and verify filters.",
    "Internal server tool that doesn't accept client egress or ingress traffic. Risk is nullified.",
    "Commercial client requested legacy SSO connector; exception granted for 6 months.",
    "Component is undergoing replacement design on branch trunk_9. Waiver is standard staging transition."
  ];

  const approvers = ["Fayez Tekitek (DevSecOps Manager)", "Thomas Lemaire (Director)", "Sophia Berrada (SecOps VP)"];
  const requesters = ["Hassen Ben Ali (Tech Lead)", "Laurent Cole (Delivery Lead)", "Clara Dupont (Sec Analyst)"];

  for (let i = 0; i < 30; i++) {
    const viol = violations[i % violations.length];
    const daysOffset = (i * 4) - 20; // some negative (expired), some positive (active)
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + daysOffset);

    waivers.push({
      id: `waiver-sql-${i + 1}`,
      created_at: nowStr,
      updated_at: nowStr,
      source_system: source,
      sync_batch_id: batchId,
      waiverId: `waiver-iq-7800${i}`,
      violationId: viol.violationId,
      reason: waiverReasons[i % waiverReasons.length],
      approver: approvers[i % approvers.length],
      requester: requesters[i % requesters.length],
      creationDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      expirationDate: i % 10 === 9 ? null : expiry.toISOString().split("T")[0],
      status: i % 10 === 9 ? "active" : daysOffset < 0 ? "expired" : daysOffset < 10 ? "stale" : "active",
      productId: viol.productMapping,
      applicationId: viol.applicationId,
      componentName: viol.componentName,
      riskAcceptanceComment: `Accepted by the Security Committee during session on Vermeg intranet governance boards.`
    });
  }

  // 10. Alerts
  const alerts: NexusAlert[] = [
    { id: "al-1", created_at: nowStr, updated_at: nowStr, source_system: source, sync_batch_id: batchId, alertType: "CRITICAL_VULNERABILITY", message: "Critical Log4J RCE (Score 9.8) detected inside Megara SSO branch release on Sonatype Nexus-IQ.", productId: "megara", applicationId: "app-101", timestamp: nowStr, archived: false },
    { id: "al-2", created_at: nowStr, updated_at: nowStr, source_system: source, sync_batch_id: batchId, alertType: "HIGH_VULN_INCREASE", message: "Vulnerability count spike (+14 items) on Soliam Portfolio Accounting module build.", productId: "soliam", applicationId: "app-105", timestamp: nowStr, archived: false },
    { id: "al-3", created_at: nowStr, updated_at: nowStr, source_system: source, sync_batch_id: batchId, alertType: "WAIVER_EXPIRED", message: "Waiver WAIVER-IQ-78005 expired for Solife Actuary REST service.", productId: "solife", applicationId: "app-111", timestamp: nowStr, archived: false },
    { id: "al-4", created_at: nowStr, updated_at: nowStr, source_system: source, sync_batch_id: batchId, alertType: "OUTDATED_SCAN", message: "Colline Collateral Optimizer has not been scanned in over 45 days.", productId: "colline", applicationId: "app-118", timestamp: nowStr, archived: false }
  ];

  // 11. Sync Log
  const initialSyncLogs: NexusSyncLog[] = [
    {
      id: "synclog-1",
      created_at: nowStr,
      updated_at: nowStr,
      source_system: source,
      sync_batch_id: batchId,
      batchId,
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() - 3580000).toISOString(),
      executedBy: "ftekitek",
      status: "SUCCESS",
      summary: "Completed automatic nightly sync of Sonatype Nexus-IQ databases.",
      logs: "[INFO] Connected successfully to API Server: https://soft-security:8070/\n[INFO] Authenticating using secret token for user: ftekitek\n[INFO] Auto-discovery loaded 4 Organizations containing 20 Applications.\n[INFO] Filtered and parsed 50 recent scan reports.\n[INFO] Refreshed 200 vulnerabilities items, 80 policy violations, and 30 waiver parameters.",
      retryCount: 0,
      targetUrl: "https://soft-security:8070/"
    }
  ];

  // 12. KPISnapshot
  const snapshot: NexusKPISnapshot = {
    id: "snap-1",
    created_at: nowStr,
    updated_at: nowStr,
    source_system: source,
    sync_batch_id: batchId,
    snapshot_date: nowStr.split("T")[0],
    globalSecurityRiskScore: 68.4,
    totalVulnerabilities: 200,
    criticalVulnerabilities: 45,
    highVulnerabilities: 88,
    newVulnerabilities: 12,
    fixedVulnerabilities: 32,
    acceptedRiskCount: 15,
    expiredWaiversCount: 12,
    productsRedCount: 2,
    productsOrangeCount: 2,
    productsGreenCount: 4,
    securityDebtScore: 785, // in hours
    complianceScore: 72.8  // %
  };

  return {
    organizations,
    products,
    applications,
    mappings,
    scans,
    components,
    vulnerabilities,
    violations,
    waivers,
    alerts,
    initialSyncLogs,
    snapshot
  };
}
