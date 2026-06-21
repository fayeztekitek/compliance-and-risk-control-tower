/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Global Fields Present in All SQL Tables ---
export interface SqlCommonFields {
  id: string;
  created_at: string;
  updated_at: string;
  source_system: string; // e.g., 'sonatype_nexus_iq'
  sync_batch_id: string;
}

// --- SQL Table Interface Declarations ---

export interface NexusProduct extends SqlCommonFields {
  product_id: string; // matches product mapping keys like 'megara', 'soliam'
  name: string;
  status: "RED" | "ORANGE" | "GREEN";
  business_criticality: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  security_owner: string;
  product_owner: string;
}

export interface NexusOrganization extends SqlCommonFields {
  organizationId: string;
  organizationName: string;
  parentOrganizationId: string | null;
}

export interface NexusApplication extends SqlCommonFields {
  applicationId: string;
  applicationPublicId: string;
  applicationName: string;
  organizationId: string;
  tags: string[]; // parsed from JSON array
  categories: string[];
  businessCriticality: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  securityOwner: string;
  productOwner: string;
}

export interface ProductApplicationMapping extends SqlCommonFields {
  product_id: string; // references NexusProduct
  organizationId: string | null; // optionally maps entire Org
  applicationId: string | null; // or specific App
}

export interface NexusScanReport extends SqlCommonFields {
  scanId: string;
  applicationId: string;
  applicationPublicId: string;
  stage: "develop" | "build" | "release" | "operate";
  scanDate: string;
  reportUrl: string;
  policyEvaluationDate: string;
  totalComponents: number;
  affectedComponents: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export interface NexusVulnerability extends SqlCommonFields {
  vulnerabilityId: string; // e.g. CVE-2026-1182
  refId: string; // Nexus IQ Internal Reference Code
  cvssScore: number;
  cvssVector: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  componentName: string;
  componentVersion: string;
  packageUrl: string;
  dependencyType: "direct" | "transitive";
  reachable: "REACHABLE" | "NOT_REACHABLE" | "UNKNOWN";
  recommendedVersion: string;
  fixAvailable: boolean;
  exploitability: "EASY" | "MEDIUM" | "HARD" | "THEORETICAL";
  ageInDays: number;
  firstSeenDate: string;
  lastSeenDate: string;
  status: "Open" | "Fixed" | "Accepted" | "Waived" | "False Positive";
  applicationId: string;
  scanId: string;
}

export interface NexusPolicyViolation extends SqlCommonFields {
  violationId: string;
  policyName: string;
  constraintName: string;
  threatLevel: number; // 1 to 10
  applicationId: string;
  productMapping: string; // references product_id
  componentName: string;
  stage: "develop" | "build" | "release" | "operate";
  createdDate: string;
  status: "OPEN" | "RESOLVED";
  waiverStatus: "ACTIVE" | "EXPIRED" | "NONE";
  businessImpact: string;
}

export interface NexusWaiver extends SqlCommonFields {
  waiverId: string;
  violationId: string;
  reason: string;
  approver: string;
  requester: string;
  creationDate: string;
  expirationDate: string | null; // null means infinite duration
  status: "active" | "expired" | "stale";
  productId: string;
  applicationId: string;
  componentName: string;
  riskAcceptanceComment: string;
}

export interface NexusComponent extends SqlCommonFields {
  componentName: string;
  currentVersion: string;
  latestVersion: string;
  recommendedVersion: string;
  remediationPath: string; // JSON/Text summary path
  securityRisk: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
  licenseRisk: "RED" | "YELLOW" | "GREEN" | "NONE";
  popularity: number; // score 1-100
  age: string; // version release age e.g. '18 months'
  numberOfAffectedApplications: number;
}

export interface NexusKPISnapshot extends SqlCommonFields {
  snapshot_date: string;
  globalSecurityRiskScore: number;
  totalVulnerabilities: number;
  criticalVulnerabilities: number;
  highVulnerabilities: number;
  newVulnerabilities: number;
  fixedVulnerabilities: number;
  acceptedRiskCount: number;
  expiredWaiversCount: number;
  productsRedCount: number;
  productsOrangeCount: number;
  productsGreenCount: number;
  securityDebtScore: number;
  complianceScore: number;
}

export interface NexusAlert extends SqlCommonFields {
  alertType: "CRITICAL_VULNERABILITY" | "HIGH_VULN_INCREASE" | "WAIVER_EXPIRING" | "WAIVER_EXPIRED" | "PRODUCT_GRADE_RED" | "OUTDATED_SCAN" | "SCORE_DEGRADED" | "DUAL_PRODUCT_COMPONENT";
  message: string;
  productId: string | null;
  applicationId: string | null;
  timestamp: string;
  archived: boolean;
}

export interface NexusSyncLog extends SqlCommonFields {
  batchId: string;
  startTime: string;
  endTime: string;
  executedBy: string;
  status: "SUCCESS" | "FAILED" | "WARNING";
  summary: string;
  logs: string; // Text stream with masked secrets
  retryCount: number;
  targetUrl: string;
}

// --- Combined KPI Schema for Executive View ---
export interface ExecutiveKpis {
  snapshot: NexusKPISnapshot;
  recentAlerts: NexusAlert[];
  productHeatmap: {
    productId: string;
    productName: string;
    score: number;
    grade: "RED" | "ORANGE" | "GREEN";
    criticalCount: number;
    highCount: number;
    totalCount: number;
    waiversCount: number;
  }[];
  trendHistory: {
    date: string;
    critical: number;
    high: number;
    vulnerabilities: number;
    avgScore: number;
  }[];
}

// --- Product specific KPI dashboard ---
export interface ProductKpis {
  productId: string;
  productName: string;
  riskScore: number;
  grade: "RED" | "ORANGE" | "GREEN";
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  securityDebt: number; // in hours or currency units
  compliancePercentage: number;
  mttrDays: number;
  fixVelocityPercentage: number;
  activeWaiversCount: number;
  agingStats: {
    under30: number;
    "30to60": number;
    "60to90": number;
    "90to180": number;
    over180: number;
  };
  backlogDetails: {
    applicationId: string;
    applicationName: string;
    vulnerabilitiesCount: number;
    status: string;
  }[];
  topVulnerableComponents: {
    componentName: string;
    version: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM";
    cvssScore: number;
    remediationTargetVersion: string;
    affectedApps: number;
  }[];
}
