import {
  DashboardData,
  Organization,
  Application,
  ScanReport,
  Vulnerability,
  VulnerabilityOccurrence,
  Component,
  OrgCardData,
  OrgDrilldownData,
  TopRiskyAppItem,
  LatestScanRow,
  SeverityDistribution,
  TrendPoint,
  RiskStatusDistribution,
} from "../types/nexus";

const components: Component[] = [
  { id: "c1", name: "log4j-core", version: "2.17.0", packageUrl: "pkg:maven/org.apache.logging.log4j/log4j-core@2.17.0" },
  { id: "c2", name: "jackson-databind", version: "2.13.4", packageUrl: "pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.13.4" },
  { id: "c3", name: "spring-core", version: "5.3.25", packageUrl: "pkg:maven/org.springframework/spring-core@5.3.25" },
  { id: "c4", name: "bootstrap", version: "4.6.2", packageUrl: "pkg:npm/bootstrap@4.6.2" },
  { id: "c5", name: "lodash", version: "4.17.21", packageUrl: "pkg:npm/lodash@4.17.21" },
  { id: "c6", name: "axios", version: "1.6.0", packageUrl: "pkg:npm/axios@1.6.0" },
  { id: "c7", name: "openssl", version: "1.1.1w", packageUrl: "pkg:generic/openssl@1.1.1w" },
  { id: "c8", name: "zlib", version: "1.2.13", packageUrl: "pkg:generic/zlib@1.2.13" },
  { id: "c9", name: "tomcat-embed-core", version: "9.0.72", packageUrl: "pkg:maven/org.apache.tomcat.embed/tomcat-embed-core@9.0.72" },
  { id: "c10", name: "netty-handler", version: "4.1.94.Final", packageUrl: "pkg:maven/io.netty/netty-handler@4.1.94.Final" },
  { id: "c11", name: "guava", version: "31.1-jre", packageUrl: "pkg:maven/com.google.guava/guava@31.1-jre" },
  { id: "c12", name: "express", version: "4.18.2", packageUrl: "pkg:npm/express@4.18.2" },
  { id: "c13", name: "minimatch", version: "3.0.8", packageUrl: "pkg:npm/minimatch@3.0.8" },
  { id: "c14", name: "undici", version: "5.28.2", packageUrl: "pkg:npm/undici@5.28.2" },
  { id: "c15", name: "xml2js", version: "0.6.2", packageUrl: "pkg:npm/xml2js@0.6.2" },
];

const vulnerabilities: Vulnerability[] = [
  { id: "v1", cve: "CVE-2024-21626", severity: "CRITICAL", component: components[0], description: "runc container escape", cvssScore: 9.8, firstSeen: "2024-01-15", reference: "" },
  { id: "v2", cve: "CVE-2024-3094", severity: "CRITICAL", component: components[0], description: "XZ Utils backdoor", cvssScore: 10.0, firstSeen: "2024-03-29", reference: "" },
  { id: "v3", cve: "CVE-2024-23897", severity: "CRITICAL", component: components[2], description: "Jenkins arbitrary file read", cvssScore: 9.8, firstSeen: "2024-01-24", reference: "" },
  { id: "v4", cve: "CVE-2024-27198", severity: "CRITICAL", component: components[8], description: "TeamCity auth bypass", cvssScore: 9.8, firstSeen: "2024-03-04", reference: "" },
  { id: "v5", cve: "CVE-2023-46604", severity: "CRITICAL", component: components[0], description: "ActiveMQ RCE", cvssScore: 10.0, firstSeen: "2023-10-27", reference: "" },
  { id: "v6", cve: "CVE-2023-44487", severity: "HIGH", component: components[9], description: "HTTP/2 rapid reset DDoS", cvssScore: 7.5, firstSeen: "2023-10-10", reference: "" },
  { id: "v7", cve: "CVE-2024-0204", severity: "HIGH", component: components[8], description: "GoAnywhere MFT auth bypass", cvssScore: 7.5, firstSeen: "2024-01-22", reference: "" },
  { id: "v8", cve: "CVE-2024-20931", severity: "HIGH", component: components[1], description: "WebLogic RCE", cvssScore: 7.5, firstSeen: "2024-01-16", reference: "" },
  { id: "v9", cve: "CVE-2023-50164", severity: "HIGH", component: components[6], description: "Struts2 path traversal RCE", cvssScore: 8.1, firstSeen: "2023-12-08", reference: "" },
  { id: "v10", cve: "CVE-2024-22252", severity: "HIGH", component: components[11], description: "VMware ESXi use-after-free", cvssScore: 8.2, firstSeen: "2024-03-05", reference: "" },
  { id: "v11", cve: "CVE-2024-1597", severity: "HIGH", component: components[2], description: "PostgreSQL JDBC SQL injection", cvssScore: 8.0, firstSeen: "2024-03-19", reference: "" },
  { id: "v12", cve: "CVE-2023-44981", severity: "MEDIUM", component: components[4], description: "ZooKeeper auth bypass", cvssScore: 5.3, firstSeen: "2023-10-12", reference: "" },
  { id: "v13", cve: "CVE-2024-25600", severity: "MEDIUM", component: components[13], description: "XXE in parsing library", cvssScore: 6.5, firstSeen: "2024-02-18", reference: "" },
  { id: "v14", cve: "CVE-2024-24576", severity: "MEDIUM", component: components[6], description: "Command injection via batch", cvssScore: 5.5, firstSeen: "2024-03-15", reference: "" },
  { id: "v15", cve: "CVE-2024-29185", severity: "MEDIUM", component: components[12], description: "Info disclosure via stack traces", cvssScore: 5.0, firstSeen: "2024-04-02", reference: "" },
  { id: "v16", cve: "CVE-2024-27281", severity: "MEDIUM", component: components[14], description: "SSRF in HTTP client", cvssScore: 6.4, firstSeen: "2024-03-21", reference: "" },
  { id: "v17", cve: "CVE-2024-21131", severity: "MEDIUM", component: components[11], description: "JVM improper exception handling", cvssScore: 5.9, firstSeen: "2024-04-16", reference: "" },
  { id: "v18", cve: "CVE-2024-25710", severity: "MEDIUM", component: components[10], description: "Unreachable loop exit condition", cvssScore: 5.5, firstSeen: "2024-02-27", reference: "" },
  { id: "v19", cve: "CVE-2024-22366", severity: "LOW", component: components[3], description: "Bootstrap XSS in tooltip", cvssScore: 3.5, firstSeen: "2024-02-14", reference: "" },
  { id: "v20", cve: "CVE-2024-22222", severity: "LOW", component: components[7], description: "DoS via malformed compressed data", cvssScore: 3.7, firstSeen: "2024-01-30", reference: "" },
  { id: "v21", cve: "CVE-2024-25720", severity: "LOW", component: components[13], description: "Improper certificate validation", cvssScore: 3.3, firstSeen: "2024-01-12", reference: "" },
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start: string, end: string): string {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + Math.random() * (e - s)).toISOString().slice(0, 10);
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

const appNamePool = [
  "Online Banking Portal", "Customer Onboarding API", "Payment Processing Engine",
  "KYC Verification Service", "Loan Origination System", "Fraud Detection Platform",
  "Core Banking System", "Trade Finance Platform", "Mobile Banking App",
  "Statement Generation Service", "Card Management System", "ATM Switch Interface",
  "Digital Wallet Service", "Payment Gateway", "Back Office Settlement",
  "Regulatory Reporting Engine", "AML Screening System", "Risk Calculation Engine",
  "Customer Data Platform", "Identity Access Manager", "API Gateway",
  "Notification Service", "Document Manager", "Archival Service",
  "Audit Log Service", "Reporting Dashboard", "Data Lake Integration",
  "ETL Processing Engine", "Master Data Management", "Config Service",
  "User Management Portal", "Role Engineering Service", "Compliance Checklist",
  "Third Party Risk Manager", "Vuln Scanner Integration", "Patch Manager",
  "Asset Inventory", "ServiceNow Integration", "Jira Connector",
  "Confluence Sync", "SSO Provider", "Secrets Manager",
  "Container Registry", "CI/CD Pipeline", "Code Repository",
  "Monitoring Stack", "Log Aggregator", "APM Service",
  "Backup Manager", "Disaster Recovery Orchestrator",
];

const criticalities: ("HIGH" | "MEDIUM" | "LOW")[] = ["HIGH", "MEDIUM", "LOW"];
const scanStages = ["SOURCE", "BUILD", "STAGE", "PRODUCTION", "RELEASE"];

function buildOrganizationTree(): { orgs: Organization[]; totalApps: number } {
  const orgDefs: {
    id: string; name: string; parentId: string | null; parentName: string | null;
    children: { id: string; name: string; parentId: string; parentName: string }[];
  }[] = [
    {
      id: "org-bdm", name: "BDM", parentId: "org-root", parentName: "Root Organization",
      children: [
        { id: "org-bdm-cr", name: "Credit Risk", parentId: "org-bdm", parentName: "BDM" },
        { id: "org-bdm-mr", name: "Market Risk", parentId: "org-bdm", parentName: "BDM" },
        { id: "org-bdm-or", name: "Operational Risk", parentId: "org-bdm", parentName: "BDM" },
      ],
    },
    {
      id: "org-bev", name: "Binary Evaluation", parentId: "org-root", parentName: "Root Organization",
      children: [
        { id: "org-bev-pl", name: "Platform", parentId: "org-bev", parentName: "Binary Evaluation" },
        { id: "org-bev-ds", name: "Decision Services", parentId: "org-bev", parentName: "Binary Evaluation" },
      ],
    },
    {
      id: "org-cm", name: "Capital Market", parentId: "org-root", parentName: "Root Organization",
      children: [
        { id: "org-cm-tr", name: "Trading", parentId: "org-cm", parentName: "Capital Market" },
        { id: "org-cm-st", name: "Settlement", parentId: "org-cm", parentName: "Capital Market" },
        { id: "org-cm-cl", name: "Clearing", parentId: "org-cm", parentName: "Capital Market" },
      ],
    },
    {
      id: "org-col", name: "Colline", parentId: "org-root", parentName: "Root Organization",
      children: [
        { id: "org-col-bn", name: "BNP Paribas Integration", parentId: "org-col", parentName: "Colline" },
        { id: "org-col-sg", name: "Societe Generale Integration", parentId: "org-col", parentName: "Colline" },
        { id: "org-col-ca", name: "Credit Agricole Integration", parentId: "org-col", parentName: "Colline" },
      ],
    },
    {
      id: "org-ce", name: "Continental Europe", parentId: "org-root", parentName: "Root Organization",
      children: [
        { id: "org-ce-de", name: "Germany", parentId: "org-ce", parentName: "Continental Europe" },
        { id: "org-ce-nl", name: "Netherlands", parentId: "org-ce", parentName: "Continental Europe" },
        { id: "org-ce-be", name: "Belgium", parentId: "org-ce", parentName: "Continental Europe" },
        { id: "org-ce-lu", name: "Luxembourg", parentId: "org-ce", parentName: "Continental Europe" },
        { id: "org-ce-ch", name: "Switzerland", parentId: "org-ce", parentName: "Continental Europe" },
        { id: "org-ce-at", name: "Austria", parentId: "org-ce", parentName: "Continental Europe" },
        { id: "org-ce-no", name: "Nordics", parentId: "org-ce", parentName: "Continental Europe" },
      ],
    },
    {
      id: "org-dap", name: "digitalApps", parentId: "org-root", parentName: "Root Organization",
      children: [
        { id: "org-dap-ob", name: "Online Banking", parentId: "org-dap", parentName: "digitalApps" },
        { id: "org-dap-mb", name: "Mobile Banking", parentId: "org-dap", parentName: "digitalApps" },
        { id: "org-dap-cb", name: "Corporate Banking", parentId: "org-dap", parentName: "digitalApps" },
        { id: "org-dap-pg", name: "Payment Gateway", parentId: "org-dap", parentName: "digitalApps" },
        { id: "org-dap-kyc", name: "KYC Platform", parentId: "org-dap", parentName: "digitalApps" },
      ],
    },
    {
      id: "org-flu", name: "Fluid", parentId: "org-root", parentName: "Root Organization",
      children: [
        { id: "org-flu-en", name: "Engine", parentId: "org-flu", parentName: "Fluid" },
        { id: "org-flu-wf", name: "Workflow", parentId: "org-flu", parentName: "Fluid" },
      ],
    },
    {
      id: "org-im", name: "InsuranceMarket", parentId: "org-root", parentName: "Root Organization",
      children: (() => {
        const names = [
          "Life Insurance", "Non-Life Insurance", "Reinsurance", "Claims Management",
          "Health Insurance", "Travel Insurance", "Property Insurance", "Auto Insurance",
          "Marine Insurance", "Cyber Insurance", "Liability Insurance",
          "Policy Administration", "Underwriting", "Insurance Analytics",
          "Fraud Investigation", "Premium Collection", "Agent Portal",
          "Broker Portal", "Customer Portal", "Insurance CRM",
          "Reinsurance Management", "Catastrophe Modeling", "Actuarial Services",
          "Micro Insurance", "Group Insurance", "Pension Administration",
          "Aviation Insurance", "Agent Onboarding", "Policy Renewal Services",
          "Claims Analytics", "Insurance Data Warehouse", "Regulatory Reporting - Insurance",
          "Premium Accounting", "Reinsurance Billing", "TPA Portal",
          "Benefits Administration", "Insurance Document Management",
          "e-Signature Integration", "Insurance Rating Engine",
          "Product Configuration", "Distribution Management",
        ];
        return names.map((n, i) => ({
          id: `org-im-${String(i + 1).padStart(2, "0")}`,
          name: n, parentId: "org-im", parentName: "InsuranceMarket",
        }));
      })(),
    },
    {
      id: "org-pa", name: "Palmyra", parentId: "org-root", parentName: "Root Organization",
      children: [
        { id: "org-pa-co", name: "Palmyra Core Platform", parentId: "org-pa", parentName: "Palmyra" },
        { id: "org-pa-sa", name: "Palmyra SaaS", parentId: "org-pa", parentName: "Palmyra" },
        { id: "org-pa-mo", name: "Palmyra Mobile", parentId: "org-pa", parentName: "Palmyra" },
        { id: "org-pa-cm", name: "Palmyra Compliance Module", parentId: "org-pa", parentName: "Palmyra" },
        { id: "org-pa-rp", name: "Palmyra Regulatory Platform", parentId: "org-pa", parentName: "Palmyra" },
        { id: "org-pa-rf", name: "Palmyra Risk Framework", parentId: "org-pa", parentName: "Palmyra" },
        { id: "org-pa-on", name: "Palmyra Onboarding", parentId: "org-pa", parentName: "Palmyra" },
      ],
    },
    {
      id: "org-sb", name: "Sandbox Organization", parentId: "org-root", parentName: "Root Organization",
      children: [
        { id: "org-sb-s1", name: "Sandbox Environment 1", parentId: "org-sb", parentName: "Sandbox Organization" },
        { id: "org-sb-s2", name: "Sandbox Environment 2", parentId: "org-sb", parentName: "Sandbox Organization" },
      ],
    },
    {
      id: "org-sol", name: "Soliam", parentId: "org-root", parentName: "Root Organization",
      children: [
        { id: "org-sol-sg", name: "Soliam Cloud Migration", parentId: "org-sol", parentName: "Soliam" },
        { id: "org-sol-api", name: "Soliam API Platform", parentId: "org-sol", parentName: "Soliam" },
        { id: "org-sol-ds", name: "Soliam Data Services", parentId: "org-sol", parentName: "Soliam" },
      ],
    },
    {
      id: "org-slf", name: "Solife", parentId: "org-root", parentName: "Root Organization",
      children: [
        { id: "org-slf-az", name: "Allianz Integration", parentId: "org-slf", parentName: "Solife" },
        { id: "org-slf-cp", name: "Custom Portal", parentId: "org-slf", parentName: "Solife" },
        { id: "org-slf-pm", name: "Policy Management", parentId: "org-slf", parentName: "Solife" },
      ],
    },
    {
      id: "org-td", name: "To Delete", parentId: "org-root", parentName: "Root Organization",
      children: [
        { id: "org-td-legacy", name: "Legacy Apps", parentId: "org-td", parentName: "To Delete" },
      ],
    },
  ];

  const topOrgs: Organization[] = [];
  const flatOrgs: { id: string; name: string; parentId: string | null; parentName: string | null }[] = [];
  let appCounter = 0;
  const allApps: Application[] = [];

  for (const def of orgDefs) {
    flatOrgs.push({ id: def.id, name: def.name, parentId: def.parentId, parentName: def.parentName });
    const subOrgs: Organization[] = [];
    for (const childDef of def.children) {
      flatOrgs.push({ id: childDef.id, name: childDef.name, parentId: def.id, parentName: def.name });
      const childApps: Application[] = [];
      const appCount = randomInt(3, 8);
      for (let i = 0; i < appCount; i++) {
        const idx = appCounter % appNamePool.length;
        const appId = `app-${String(appCounter + 1).padStart(4, "0")}`;
        const scanCount = randomInt(2, 6);
        const scans: ScanReport[] = [];
        for (let s = 0; s < scanCount; s++) {
          const scanDate = randomDate("2023-06-01", "2026-06-27");
          const vulnCount = randomInt(3, 15);
          const occs: VulnerabilityOccurrence[] = [];
          let crit = 0, high = 0, med = 0, low = 0;
          const selected = pickRandom(vulnerabilities, vulnCount);
          for (const v of selected) {
            if (v.severity === "CRITICAL") crit++;
            else if (v.severity === "HIGH") high++;
            else if (v.severity === "MEDIUM") med++;
            else low++;
            const paths = randomInt(1, 3);
            for (let p = 0; p < paths; p++) {
              const statuses: VulnerabilityOccurrence["status"][] = ["OPEN", "OPEN", "OPEN", "OPEN", "FIXED", "FIXED", "WAIVED", "ACCEPTED"];
              occs.push({
                id: `occ-${appId}-s${s}-${v.id}-${p}`,
                vulnerabilityId: v.id,
                vulnerability: v,
                scanReportId: `scan-${appId}-${s}`,
                applicationId: appId,
                applicationName: appNamePool[idx],
                organizationId: childDef.id,
                organizationName: childDef.name,
                componentName: v.component.name,
                packageUrl: v.component.packageUrl,
                path: `/src/${v.component.name}/lib/${v.id}-${p}.java`,
                status: statuses[randomInt(0, statuses.length - 1)],
                detectedDate: scanDate,
                fixedDate: Math.random() > 0.5 ? randomDate(scanDate, "2026-06-27") : null,
                waivedDate: null,
              });
            }
          }
          scans.push({
            id: `scan-${appId}-${s}`,
            applicationId: appId,
            applicationName: appNamePool[idx],
            organizationId: childDef.id,
            organizationName: childDef.name,
            scanDate,
            stage: scanStages[randomInt(0, scanStages.length - 1)],
            policyEvaluationStatus: ["PASS", "FAIL", "WARN"][randomInt(0, 2)],
            totalComponents: randomInt(50, 300),
            vulnerabilities: occs,
            criticalCount: crit,
            highCount: high,
            mediumCount: med,
            lowCount: low,
            totalViolations: crit + high + med + low,
          });
        }
        scans.sort((a, b) => b.scanDate.localeCompare(a.scanDate));
        const latest = scans[0] || null;
        const openOccs = scans.flatMap(s => s.vulnerabilities.filter(v => v.status === "OPEN"));
        const openC = openOccs.filter(o => o.vulnerability.severity === "CRITICAL").length;
        const openH = openOccs.filter(o => o.vulnerability.severity === "HIGH").length;
        const openM = openOccs.filter(o => o.vulnerability.severity === "MEDIUM").length;
        const openL = openOccs.filter(o => o.vulnerability.severity === "LOW").length;
        const waivedC = scans.flatMap(s => s.vulnerabilities.filter(v => v.status === "WAIVED")).length;
        const acceptedC = scans.flatMap(s => s.vulnerabilities.filter(v => v.status === "ACCEPTED")).length;
        const fixedC = scans.flatMap(s => s.vulnerabilities.filter(v => v.status === "FIXED")).length;
        const lastDate = latest ? latest.scanDate : null;
        let status: Application["status"];
        if (!lastDate) status = "NEVER_SCANNED";
        else {
          const monthsAge = (Date.now() - new Date(lastDate).getTime()) / (30 * 86400000);
          status = monthsAge < 6 ? "ACTIVE" : "INACTIVE";
        }
        const riskScore = Math.round((openC * 10 + openH * 5 + openM * 1) / Math.max(scans.length, 1) * 10) / 10;

        const app: Application = {
          id: appId,
          name: appNamePool[idx],
          organizationId: childDef.id,
          organizationName: childDef.name,
          businessCriticality: criticalities[randomInt(0, 2)],
          scanReports: scans,
          latestScan: latest,
          latestScanDate: lastDate,
          scanReportCount: scans.length,
          openCritical: openC,
          openHigh: openH,
          openMedium: openM,
          openLow: openL,
          totalOpen: openC + openH + openM + openL,
          waivedCount: waivedC,
          acceptedRisks: acceptedC,
          resolvedCount: fixedC,
          riskScore,
          status,
        };
        childApps.push(app);
        allApps.push(app);
        appCounter++;
      }
      subOrgs.push({
        id: childDef.id, name: childDef.name, parentId: def.id, parentName: def.name,
        children: [], applications: childApps, applicationCount: childApps.length, childCount: 0,
      });
    }
    topOrgs.push({
      id: def.id, name: def.name, parentId: def.parentId, parentName: def.parentName,
      children: subOrgs, applications: [],
      applicationCount: subOrgs.reduce((s, o) => s + o.applications.length, 0),
      childCount: subOrgs.length,
    });
  }

  return { orgs: topOrgs, totalApps: allApps.length };
}

function computeOrgCardData(org: Organization): OrgCardData & { id: string; subOrgTotal: number } {
  function collectApps(o: Organization): Application[] {
    return [...o.applications, ...o.children.flatMap(collectApps)];
  }
  const allApps = collectApps(org);
  const totalOpen = allApps.reduce((s, a) => s + a.totalOpen, 0);
  const crit = allApps.reduce((s, a) => s + a.openCritical, 0);
  const high = allApps.reduce((s, a) => s + a.openHigh, 0);
  const subOrgCount = org.childCount + org.children.reduce((s, c) => s + c.children.length, 0);
  return {
    id: org.id,
    name: org.name,
    subOrganizationCount: subOrgCount,
    applicationCount: allApps.length,
    totalOpenVulnerabilities: totalOpen,
    criticalCount: crit,
    highCount: high,
    subOrgTotal: subOrgCount,
  };
}

function computeOrgDrilldown(org: Organization): OrgDrilldownData {
  function collectApps(o: Organization): Application[] {
    return [...o.applications, ...o.children.flatMap(collectApps)];
  }
  const allApps = collectApps(org);
  const allScans = allApps.flatMap(a => a.scanReports);
  const scannedApps = allApps.filter(a => a.latestScanDate !== null);
  const neverScanned = allApps.filter(a => a.status === "NEVER_SCANNED");
  const activeApps = allApps.filter(a => a.status === "ACTIVE");
  const inactiveApps = allApps.filter(a => a.status === "INACTIVE");
  const openOccs = allScans.flatMap(s => s.vulnerabilities.filter(v => v.status === "OPEN"));
  const openC = openOccs.filter(o => o.vulnerability.severity === "CRITICAL").length;
  const openH = openOccs.filter(o => o.vulnerability.severity === "HIGH").length;
  const openM = openOccs.filter(o => o.vulnerability.severity === "MEDIUM").length;
  const openL = openOccs.filter(o => o.vulnerability.severity === "LOW").length;

  const topRisky: TopRiskyAppItem[] = allApps
    .map(a => ({
      applicationName: a.name,
      totalOpen: a.totalOpen,
      criticalCount: a.openCritical,
      highCount: a.openHigh,
      riskScore: a.riskScore,
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const latestScans: LatestScanRow[] = allScans
    .sort((a, b) => b.scanDate.localeCompare(a.scanDate))
    .slice(0, 10)
    .map(s => {
      const sc = s.vulnerabilities.filter(v => v.status === "OPEN" && v.vulnerability.severity === "CRITICAL").length;
      const sh = s.vulnerabilities.filter(v => v.status === "OPEN" && v.vulnerability.severity === "HIGH").length;
      const sm = s.vulnerabilities.filter(v => v.status === "OPEN" && v.vulnerability.severity === "MEDIUM").length;
      const sl = s.vulnerabilities.filter(v => v.status === "OPEN" && v.vulnerability.severity === "LOW").length;
      const w = s.vulnerabilities.filter(v => v.status === "WAIVED").length + s.vulnerabilities.filter(v => v.status === "ACCEPTED").length;
      const riskScore = Math.round((sc * 10 + sh * 5 + sm * 1) * 10) / 10;
      return {
        applicationName: s.applicationName,
        organizationName: s.organizationName,
        lastScanDate: s.scanDate,
        scanReportCount: allApps.find(a => a.id === s.applicationId)?.scanReportCount || 0,
        openCritical: sc, openHigh: sh, openMedium: sm, openLow: sl,
        waivedCount: w, acceptedRisks: 0,
        riskScore,
        status: s.policyEvaluationStatus,
      };
    });

  const appsOutOfSla = allApps.filter(a => {
    if (!a.latestScanDate) return true;
    const monthsAge = (Date.now() - new Date(a.latestScanDate).getTime()) / (30 * 86400000);
    return monthsAge > 3;
  }).length;

  return {
    organizationId: org.id,
    organizationName: org.name,
    directSubOrganizationCount: org.children.length,
    totalApplications: allApps.length,
    scannedApplications: scannedApps.length,
    neverScanned: neverScanned.length,
    activeApplications: activeApps.length,
    inactiveApplications: inactiveApps.length,
    totalScanReports: allScans.length,
    openCritical: openC, openHigh: openH, openMedium: openM, openLow: openL,
    waivedVulnerabilities: allScans.flatMap(s => s.vulnerabilities.filter(v => v.status === "WAIVED")).length,
    acceptedRisks: allScans.flatMap(s => s.vulnerabilities.filter(v => v.status === "ACCEPTED")).length,
    resolvedVulnerabilities: allScans.flatMap(s => s.vulnerabilities.filter(v => v.status === "FIXED")).length,
    applicationsOutOfSla: appsOutOfSla,
    topRiskyApplications: topRisky,
    latestScanReports: latestScans,
  };
}

let cachedData: DashboardData | null = null;

export function getMockDashboardData(): DashboardData {
  if (cachedData) return cachedData;

  const { orgs: topLevelOrgs, totalApps: mockAppCount } = buildOrganizationTree();

  const allTopCards = topLevelOrgs.map(computeOrgCardData);
  const drilldowns: Record<string, OrgDrilldownData> = {};
  for (const org of topLevelOrgs) {
    drilldowns[org.id] = computeOrgDrilldown(org);
    for (const child of org.children) {
      drilldowns[child.id] = computeOrgDrilldown(child);
    }
  }

  function collectAllApps(orgs: Organization[]): Application[] {
    return orgs.flatMap(o => [...o.applications, ...collectAllApps(o.children)]);
  }
  const allApps = collectAllApps(topLevelOrgs);
  const totalOrgs = 1 + topLevelOrgs.length + topLevelOrgs.reduce((s, o) => s + o.children.length, 0);

  const allScans = allApps.flatMap(a => a.scanReports);
  const allOccs = allScans.flatMap(s => s.vulnerabilities);

  const mockTotalVulns = allOccs.length;
  const mockTotalOpen = allOccs.filter(v => v.status === "OPEN").length;

  const severityDist: SeverityDistribution[] = [
    { name: "Critical", value: allOccs.filter(v => v.vulnerability.severity === "CRITICAL" && v.status === "OPEN").length, color: "#dc2626" },
    { name: "High", value: allOccs.filter(v => v.vulnerability.severity === "HIGH" && v.status === "OPEN").length, color: "#ea580c" },
    { name: "Medium", value: allOccs.filter(v => v.vulnerability.severity === "MEDIUM" && v.status === "OPEN").length, color: "#d97706" },
    { name: "Low", value: allOccs.filter(v => v.vulnerability.severity === "LOW" && v.status === "OPEN").length, color: "#3b82f6" },
  ];

  const trendPoints: TrendPoint[] = [
    { month: "Jan 2026", total: 2847, critical: 5, high: 32, medium: 2110, low: 700 },
    { month: "Feb 2026", total: 3102, critical: 6, high: 38, medium: 2290, low: 768 },
    { month: "Mar 2026", total: 3650, critical: 7, high: 42, medium: 2710, low: 891 },
    { month: "Apr 2026", total: 3890, critical: 5, high: 28, medium: 2960, low: 897 },
    { month: "May 2026", total: 4120, critical: 4, high: 22, medium: 3150, low: 944 },
    { month: "Jun 2026", total: 4765, critical: 3, high: 18, medium: 3700, low: 1044 },
  ];

  const topFive: TopRiskyAppItem[] = allApps
    .map(a => ({
      applicationName: a.name,
      totalOpen: a.totalOpen,
      criticalCount: a.openCritical,
      highCount: a.openHigh,
      riskScore: a.riskScore,
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const riskDist: RiskStatusDistribution[] = [
    { name: "Red (Critical)", value: allApps.filter(a => a.openCritical > 0).length, color: "#dc2626" },
    { name: "Orange (High)", value: allApps.filter(a => a.openHigh > 0 && a.openCritical === 0).length, color: "#ea580c" },
    { name: "Yellow (Medium)", value: allApps.filter(a => a.totalOpen > 0 && a.openCritical === 0 && a.openHigh === 0).length, color: "#d97706" },
    { name: "Green (Safe)", value: allApps.filter(a => a.totalOpen === 0).length, color: "#16a34a" },
  ];

  const latestScans: LatestScanRow[] = allScans
    .sort((a, b) => b.scanDate.localeCompare(a.scanDate))
    .slice(0, 10)
    .map(s => {
      const sc = s.vulnerabilities.filter(v => v.status === "OPEN" && v.vulnerability.severity === "CRITICAL").length;
      const sh = s.vulnerabilities.filter(v => v.status === "OPEN" && v.vulnerability.severity === "HIGH").length;
      const sm = s.vulnerabilities.filter(v => v.status === "OPEN" && v.vulnerability.severity === "MEDIUM").length;
      const sl = s.vulnerabilities.filter(v => v.status === "OPEN" && v.vulnerability.severity === "LOW").length;
      const w = s.vulnerabilities.filter(v => v.status === "WAIVED").length + s.vulnerabilities.filter(v => v.status === "ACCEPTED").length;
      const riskScore = Math.round((sc * 10 + sh * 5 + sm * 1) * 10) / 10;
      return {
        applicationName: s.applicationName,
        organizationName: s.organizationName,
        lastScanDate: s.scanDate,
        scanReportCount: allApps.find(a => a.id === s.applicationId)?.scanReportCount || 0,
        openCritical: sc, openHigh: sh, openMedium: sm, openLow: sl,
        waivedCount: w, acceptedRisks: 0,
        riskScore,
        status: s.policyEvaluationStatus,
      };
    });

  cachedData = {
    kpiCards: [
      { icon: "building", title: "Total Organizations", value: totalOrgs, delta: 3, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "appwindow", title: "Total Applications", value: mockAppCount + 3350, delta: 12, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "bug", title: "Total Vulnerabilities", value: mockTotalVulns + 3500, delta: 284, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "alert", title: "Open Vulnerabilities", value: mockTotalOpen + 3500, delta: -18, deltaLabel: "vs last month", deltaDirection: "down" },
    ],
    topLevelOrganizations: allTopCards,
    severityDistribution: severityDist,
    vulnerabilityTrend: trendPoints,
    topFiveApps: topFive,
    riskStatusDistribution: riskDist,
    latestScans,
    totalOrgs,
    totalApps: mockAppCount + 3350,
    totalVulns: mockTotalVulns + 3500,
    totalOpen: mockTotalOpen + 3500,
    orgDrilldowns: drilldowns,
  };

  return cachedData;
}

export function getOrgDrilldown(orgId: string): OrgDrilldownData {
  const data = getMockDashboardData();
  return data.orgDrilldowns[orgId];
}

export interface OrganizationsPageData {
  kpiCards: Array<{ icon: string; title: string; value: number; delta: number; deltaLabel: string; deltaDirection: "up" | "down" | "flat" }>;
  rows: import("../types/nexus").OrganizationRow[];
}

export interface ApplicationsPageData {
  kpiCards: Array<{ icon: string; title: string; value: number; delta: number; deltaLabel: string; deltaDirection: "up" | "down" | "flat" }>;
  rows: import("../types/nexus").AppRow[];
}

export interface VulnerabilitiesPageData {
  kpiCards: Array<{ icon: string; title: string; value: number; delta: number; deltaLabel: string; deltaDirection: "up" | "down" | "flat" }>;
  rows: import("../types/nexus").VulnerabilityRow[];
}

export interface ReportsPageData {
  kpiCards: Array<{ icon: string; title: string; value: number; delta: number; deltaLabel: string; deltaDirection: "up" | "down" | "flat" }>;
  rows: import("../types/nexus").ReportRow[];
}

export interface RiskManagementPageData {
  kpiCards: Array<{ icon: string; title: string; value: number; delta: number; deltaLabel: string; deltaDirection: "up" | "down" | "flat" }>;
  rows: import("../types/nexus").RiskItem[];
}

export interface WaivedAcceptedPageData {
  kpiCards: Array<{ icon: string; title: string; value: number; delta: number; deltaLabel: string; deltaDirection: "up" | "down" | "flat" }>;
  rows: import("../types/nexus").WaivedAcceptedRiskRow[];
}

const orgNames = ["BDM","Binary evaluation","Capital Market","Colline","Continental Europe","digitalApps","Fluid","InsuranceMarket","Palmyra","Sandbox Organization","Soliam","Solife","to_delete"];
const appNames = ["Online Banking Portal","Customer Onboarding API","Payment Processing Engine","KYC Verification Service","Loan Origination System","Fraud Detection Platform","Core Banking System","Trade Finance Platform","Mobile Banking App","Statement Generation Service","Card Management System","ATM Switch Interface","Digital Wallet Service","Payment Gateway","Back Office Settlement","Regulatory Reporting Engine","AML Screening System","Risk Calculation Engine","Customer Data Platform","Identity Access Manager","API Gateway","Notification Service","Document Manager","Archival Service","Audit Log Service","Reporting Dashboard","Data Lake Integration","ETL Processing Engine","Master Data Management"];
const owners = ["Alice Martin","Bob Chen","Carol Dupont","David Kim","Emma Wilson","Francois Laurent","Grace Lee","Hassan Ali","Iris Zhang","James Brown","Karen Davis","Luis Garcia","Maria Rodriguez","Nathan Park","Olivia Taylor"];
const severities = ["CRITICAL","HIGH","MEDIUM","LOW"];
const statuses = ["PASS","FAIL","WARN"];

function seedRandom(seed: number) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seedRandom(42);

function rInt(min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function rPick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function rDate(start: string, end: string) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return new Date(s + rand() * (e - s)).toISOString().slice(0,10);
}

let organizationsPageData: OrganizationsPageData | null = null;
export function getOrganizationsPageData(): OrganizationsPageData {
  if (organizationsPageData) return organizationsPageData;
  const rows: import("../types/nexus").OrganizationRow[] = orgNames.map((name, i) => {
    const pa = rInt(5, 40);
    const aa = Math.max(0, pa - rInt(0, 5));
    const crit = rInt(0, 8);
    const high = rInt(0, 20);
    const open = crit + high + rInt(0, 30);
    const score = Math.max(0, 100 - crit * 10 - high * 3 - rInt(0, 10));
    return {
      organizationId: `org-${name.toLowerCase().replace(/\s+/g,"-")}`,
      organizationName: name,
      parentOrganizationName: i === 0 ? "Root Organization" : orgNames[0],
      subOrganizationCount: rInt(0, 12),
      applicationCount: pa,
      activeApplicationCount: aa,
      lastScanDate: rDate("2025-06-01","2026-06-20"),
      criticalCount: crit,
      highCount: high,
      openCount: open,
      acceptedRisks: rInt(0, 10),
      securityScore: score,
      complianceStatus: score >= 80 ? "COMPLIANT" : score >= 50 ? "IN_PROGRESS" : "NON_COMPLIANT",
    };
  });
  const totalApps = rows.reduce((s, r) => s + r.applicationCount, 0);
  const totalActive = rows.reduce((s, r) => s + r.activeApplicationCount, 0);
  const totalInactive = totalApps - totalActive;
  const totalScans = rows.reduce((s, r) => s + r.applicationCount * rInt(2, 8), 0);
  const totalOpen = rows.reduce((s, r) => s + r.openCount, 0);
  const totalCrit = rows.reduce((s, r) => s + r.criticalCount, 0);
  const totalHigh = rows.reduce((s, r) => s + r.highCount, 0);
  const totalAccepted = rows.reduce((s, r) => s + r.acceptedRisks, 0);
  const outOfSla = rows.filter(r => r.securityScore < 50).length;
  organizationsPageData = {
    kpiCards: [
      { icon: "appwindow", title: "Total Applications", value: totalApps, delta: 12, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "activity", title: "Active Applications", value: totalActive, delta: 5, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "pause", title: "Inactive Applications", value: totalInactive, delta: -3, deltaLabel: "vs last month", deltaDirection: "down" },
      { icon: "filetext", title: "Total Scan Reports", value: totalScans, delta: 45, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "bug", title: "Open Vulnerabilities", value: totalOpen, delta: -28, deltaLabel: "vs last month", deltaDirection: "down" },
      { icon: "alert-triangle", title: "Critical", value: totalCrit, delta: -2, deltaLabel: "vs last month", deltaDirection: "down" },
      { icon: "alert-circle", title: "High", value: totalHigh, delta: 3, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "check-square", title: "Accepted Risks", value: totalAccepted, delta: 1, deltaLabel: "vs last month", deltaDirection: "flat" },
      { icon: "clock", title: "Applications Out of SLA", value: outOfSla, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" },
    ],
    rows,
  };
  return organizationsPageData;
}

let applicationsPageData: ApplicationsPageData | null = null;
export function getApplicationsPageData(): ApplicationsPageData {
  if (applicationsPageData) return applicationsPageData;
  const rows: import("../types/nexus").AppRow[] = appNames.map((name, i) => {
    const crit = rInt(0, 5);
    const high = rInt(0, 12);
    const med = rInt(0, 20);
    const low = rInt(0, 15);
    const waived = rInt(0, 5);
    const accepted = rInt(0, 3);
    const riskScore = crit * 10 + high * 5 + med * 1;
    const hasScan = rand() > 0.1;
    const scanCount = hasScan ? rInt(1, 15) : 0;
    const daysAgo = hasScan ? rInt(1, 400) : 999;
    const lastScan = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0,10);
    const active = hasScan && daysAgo <= 180;
    return {
      applicationId: `app-${i+1}`,
      applicationName: name,
      organizationName: rPick(orgNames),
      businessOwner: rPick(owners),
      technicalOwner: rPick(owners),
      lastScanDate: lastScan,
      scanReportCount: scanCount,
      openCritical: crit,
      openHigh: high,
      openMedium: med,
      openLow: low,
      waivedCount: waived,
      acceptedRisks: accepted,
      riskScore,
      status: hasScan ? (active ? "ACTIVE" : "INACTIVE") : "NEVER_SCANNED",
      businessCriticality: rPick(["HIGH","MEDIUM","LOW"]),
    };
  });
  const total = rows.length;
  const neverScanned = rows.filter(r => r.status === "NEVER_SCANNED").length;
  const active = rows.filter(r => r.status === "ACTIVE").length;
  const inactive = rows.filter(r => r.status === "INACTIVE").length;
  const withCrit = rows.filter(r => r.openCritical > 0).length;
  const outOfSla = rows.filter(r => r.status !== "NEVER_SCANNED" && !r.lastScanDate).length + rows.filter(r => r.status === "INACTIVE").length;
  const avgScore = Math.round(rows.reduce((s, r) => s + r.riskScore, 0) / rows.length);
  applicationsPageData = {
    kpiCards: [
      { icon: "appwindow", title: "Total Applications", value: total, delta: 8, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "eye-off", title: "Never Scanned", value: neverScanned, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" },
      { icon: "activity", title: "Active Applications", value: active, delta: 4, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "pause", title: "Inactive Applications", value: inactive, delta: 1, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "alert-triangle", title: "Applications with Critical", value: withCrit, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" },
      { icon: "clock", title: "Applications Out of SLA", value: outOfSla, delta: 0, deltaLabel: "vs last month", deltaDirection: "flat" },
      { icon: "trending-up", title: "Average Risk Score", value: avgScore, delta: -2, deltaLabel: "vs last month", deltaDirection: "down" },
    ],
    rows,
  };
  return applicationsPageData;
}

let vulnerabilitiesPageData: VulnerabilitiesPageData | null = null;
export function getVulnerabilitiesPageData(): VulnerabilitiesPageData {
  if (vulnerabilitiesPageData) return vulnerabilitiesPageData;
  const cvePool = ["CVE-2024-21626","CVE-2024-3094","CVE-2024-23897","CVE-2024-27198","CVE-2023-46604","CVE-2023-44487","CVE-2024-0204","CVE-2024-20931","CVE-2023-50164","CVE-2024-22252","CVE-2024-1597","CVE-2023-44981","CVE-2024-25600","CVE-2024-24576","CVE-2024-29185","CVE-2024-27281","CVE-2024-21131","CVE-2024-25710","CVE-2024-22366","CVE-2024-22222","CVE-2024-25720"];
  const descs = ["runc container escape","XZ Utils backdoor","Jenkins arbitrary file read","TeamCity auth bypass","ActiveMQ RCE","HTTP/2 rapid reset DDoS","GoAnywhere MFT auth bypass","WebLogic RCE","Struts2 path traversal RCE","VMware ESXi use-after-free","PostgreSQL JDBC SQL injection","ZooKeeper auth bypass","XXE in parsing library","Command injection via batch","Info disclosure via stack traces","SSRF in HTTP client","JVM improper exception handling","Unreachable loop exit condition","Bootstrap XSS in tooltip","DoS via malformed compressed data","Improper certificate validation"];
  const rows: import("../types/nexus").VulnerabilityRow[] = cvePool.map((cve, i) => {
    const sev = i < 5 ? "CRITICAL" : i < 11 ? "HIGH" : i < 18 ? "MEDIUM" : "LOW";
    const cvss = sev === "CRITICAL" ? +(9 + rand() * 1).toFixed(1) : sev === "HIGH" ? +(7 + rand() * 2).toFixed(1) : sev === "MEDIUM" ? +(4 + rand() * 3).toFixed(1) : +(rand() * 3.9).toFixed(1);
    const apps = rInt(1, 15);
    const occs = rInt(1, 50) * apps;
    return {
      vulnId: `vuln-${i+1}`,
      cve,
      sonatypeId: `sonatype-2024-${1000+i}`,
      severity: sev as any,
      cvssScore: cvss,
      applicationsImpacted: apps,
      occurrences: occs,
      components: rPick(["log4j-core","jackson-databind","spring-core","bootstrap","lodash","axios","openssl","tomcat-embed-core","netty-handler","express"]),
      firstSeen: rDate("2023-01-01","2024-06-01"),
      lastSeen: rDate("2024-06-01","2026-06-20"),
      status: rPick(["OPEN","OPEN","OPEN","OPEN","FIXED","EXAMINING"]),
      fixAvailable: rand() > 0.3,
      exploitability: rPick(["PROVEN","LIKELY","UNLIKELY"]),
      policy: rPick(["Security Critical","Security High","Security Medium","Security Low"]),
    };
  });
  const totalOccs = rows.reduce((s, r) => s + r.occurrences, 0);
  const critCount = rows.filter(r => r.severity === "CRITICAL").reduce((s, r) => s + r.occurrences, 0);
  const highCount = rows.filter(r => r.severity === "HIGH").reduce((s, r) => s + r.occurrences, 0);
  vulnerabilitiesPageData = {
    kpiCards: [
      { icon: "bug", title: "Distinct Vulnerabilities", value: rows.length, delta: 2, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "layers", title: "Total Occurrences", value: totalOccs, delta: 153, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "alert-triangle", title: "Critical", value: critCount, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" },
      { icon: "alert-circle", title: "High", value: highCount, delta: 12, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "zap", title: "Exploitable", value: rows.filter(r => r.exploitability === "PROVEN").length, delta: 0, deltaLabel: "vs last month", deltaDirection: "flat" },
      { icon: "clock", title: "New Since Last Scan", value: rInt(3, 15), delta: -2, deltaLabel: "vs last month", deltaDirection: "down" },
    ],
    rows,
  };
  return vulnerabilitiesPageData;
}

let reportsPageData: ReportsPageData | null = null;
export function getReportsPageData(): ReportsPageData {
  if (reportsPageData) return reportsPageData;
  const rows: import("../types/nexus").ReportRow[] = Array.from({ length: 50 }, (_, i) => {
    const date = rDate("2025-01-01","2026-06-20");
    const ageInDays = Math.round((Date.now() - new Date(date).getTime()) / 86400000);
    const crit = rInt(0, 10);
    const high = rInt(0, 20);
    return {
      reportId: `RPT-${10000+i}`,
      scanId: `scan-${10000+i}`,
      applicationName: rPick(appNames),
      organizationName: rPick(orgNames),
      scanDate: date,
      scannerVersion: `${rInt(7,9)}.${rInt(0,9)}.${rInt(0,99)}`,
      totalVulnerabilities: crit + high + rInt(0, 30),
      criticalCount: crit,
      highCount: high,
      reportAge: ageInDays,
      stage: rPick(["SOURCE","BUILD","STAGE","PRODUCTION","RELEASE"]),
      policyEvaluationStatus: rPick(["PASS","FAIL","WARN"]),
    };
  });
  const today = rows.filter(r => {
    const d = new Date(r.scanDate);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }).length;
  reportsPageData = {
    kpiCards: [
      { icon: "filetext", title: "Total Reports", value: rows.length, delta: 8, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "calendar", title: "Reports Today", value: Math.max(1, today), delta: 2, deltaLabel: "vs yesterday", deltaDirection: "up" },
      { icon: "clock", title: "Average Scan Duration", value: rInt(2, 8), delta: -0.5, deltaLabel: "vs last month", deltaDirection: "down" },
      { icon: "x-circle", title: "Failed Imports", value: rInt(0, 3), delta: -1, deltaLabel: "vs last month", deltaDirection: "down" },
      { icon: "check-circle", title: "Applications Scanned", value: rInt(15, 30), delta: 3, deltaLabel: "vs last month", deltaDirection: "up" },
    ],
    rows,
  };
  return reportsPageData;
}

let riskManagementPageData: RiskManagementPageData | null = null;
export function getRiskManagementPageData(): RiskManagementPageData {
  if (riskManagementPageData) return riskManagementPageData;
  const vulnNames = ["runc container escape","XZ Utils backdoor","Jenkins arbitrary file read","TeamCity auth bypass","ActiveMQ RCE","HTTP/2 rapid reset DDoS","GoAnywhere MFT auth bypass","WebLogic RCE","Struts2 path traversal RCE","VMware ESXi use-after-free"];
  const rows: import("../types/nexus").RiskItem[] = Array.from({ length: 30 }, (_, i) => {
    const sev = rPick(severities) as any;
    const statuses2 = ["OPEN","OPEN","OPEN","IN_PROGRESS","VALIDATED","CLOSED"];
    return {
      riskId: `RISK-${1000+i}`,
      applicationName: rPick(appNames),
      organizationName: rPick(orgNames),
      vulnerability: rPick(vulnNames),
      severity: sev,
      owner: rPick(owners),
      dueDate: rDate("2026-01-01","2026-12-31"),
      currentStatus: rPick(statuses2) as any,
      sla: rPick(["7 days","14 days","30 days","60 days","90 days"]),
      priority: sev === "CRITICAL" ? "HIGH" : sev === "HIGH" ? "HIGH" : "MEDIUM",
      description: `Risk remediation for ${rPick(vulnNames)} in ${rPick(appNames)}`,
    };
  });
  const open = rows.filter(r => r.currentStatus === "OPEN").length;
  const outOfSla = rows.filter(r => r.currentStatus !== "CLOSED" && new Date(r.dueDate) < new Date()).length;
  const crit = rows.filter(r => r.severity === "CRITICAL" && r.currentStatus !== "CLOSED").length;
  const accepted = rows.filter(r => r.currentStatus === "VALIDATED").length;
  const mitigated = rows.filter(r => r.currentStatus === "CLOSED").length;
  riskManagementPageData = {
    kpiCards: [
      { icon: "alert-triangle", title: "Open Risks", value: open, delta: -4, deltaLabel: "vs last month", deltaDirection: "down" },
      { icon: "clock", title: "Risks Out of SLA", value: outOfSla, delta: 2, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "alert-octagon", title: "Critical Risks", value: crit, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" },
      { icon: "check-square", title: "Accepted Risks", value: accepted, delta: 1, deltaLabel: "vs last month", deltaDirection: "flat" },
      { icon: "check-circle", title: "Mitigated Risks", value: mitigated, delta: 5, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "trending-down", title: "Average MTTR (days)", value: rInt(14, 45), delta: -3, deltaLabel: "vs last month", deltaDirection: "down" },
    ],
    rows,
  };
  return riskManagementPageData;
}

let waivedAcceptedPageData: WaivedAcceptedPageData | null = null;
export function getWaivedAcceptedPageData(): WaivedAcceptedPageData {
  if (waivedAcceptedPageData) return waivedAcceptedPageData;
  const vulnNames = ["runc container escape","XZ Utils backdoor","Jenkins arbitrary file read","TeamCity auth bypass","ActiveMQ RCE","HTTP/2 rapid reset DDoS","GoAnywhere MFT auth bypass","WebLogic RCE","Struts2 path traversal RCE","VMware ESXi use-after-free","PostgreSQL JDBC SQL injection","ZooKeeper auth bypass","XXE in parsing library"];
  const justifications = ["Business critical application - cannot patch during production hours","Compensating controls in place","Mitigation accepted by security team","Temporary waiver for legacy system","Risk accepted by CISO","False positive verified","Third party component - vendor delayed fix"];
  const rows: import("../types/nexus").WaivedAcceptedRiskRow[] = Array.from({ length: 25 }, (_, i) => {
    const sev = rPick(severities) as any;
    const type = rPick(["WAIVED","WAIVED","ACCEPTED"]) as any;
    const expiry = rDate("2026-01-01","2026-12-31");
    const approved = rDate("2025-06-01","2026-06-01");
    const now = new Date();
    const expDate = new Date(expiry);
    const diffDays = Math.round((expDate.getTime() - now.getTime()) / 86400000);
    let status: string;
    if (diffDays < 0) status = "EXPIRED";
    else if (diffDays < 30) status = "EXPIRING_SOON";
    else status = "ACTIVE";
    if (i === 0) status = "REJECTED";
    return {
      riskId: `GOV-${2000+i}`,
      applicationName: rPick(appNames),
      organizationName: rPick(orgNames),
      vulnerability: rPick(vulnNames),
      severity: sev,
      type,
      justification: rPick(justifications),
      requestedBy: rPick(owners),
      approvedBy: rPick(owners),
      approvalDate: approved,
      expiryDate: expiry,
      currentStatus: status as any,
    };
  });
  const active = rows.filter(r => r.currentStatus === "ACTIVE").length;
  const accepted = rows.filter(r => r.type === "ACCEPTED" && r.currentStatus !== "EXPIRED" && r.currentStatus !== "REJECTED").length;
  const expired = rows.filter(r => r.currentStatus === "EXPIRED").length;
  const expiring = rows.filter(r => r.currentStatus === "EXPIRING_SOON").length;
  const rejected = rows.filter(r => r.currentStatus === "REJECTED").length;
  waivedAcceptedPageData = {
    kpiCards: [
      { icon: "shield", title: "Active Waivers", value: active, delta: 2, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "check-square", title: "Active Accepted Risks", value: accepted, delta: 0, deltaLabel: "vs last month", deltaDirection: "flat" },
      { icon: "alert-triangle", title: "Expired Waivers", value: expired, delta: 1, deltaLabel: "vs last month", deltaDirection: "up" },
      { icon: "clock", title: "Expiring in 30 Days", value: expiring, delta: -1, deltaLabel: "vs last month", deltaDirection: "down" },
      { icon: "x-circle", title: "Rejected Requests", value: rejected, delta: 0, deltaLabel: "vs last month", deltaDirection: "flat" },
    ],
    rows,
  };
  return waivedAcceptedPageData;
}
