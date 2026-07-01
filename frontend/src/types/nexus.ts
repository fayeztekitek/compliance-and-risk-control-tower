export interface Organization {
  id: string;
  name: string;
  parentId: string | null;
  parentName: string | null;
  children: Organization[];
  applications: Application[];
  applicationCount: number;
  childCount: number;
}

export interface Application {
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
  businessCriticality: "HIGH" | "MEDIUM" | "LOW";
  scanReports: ScanReport[];
  latestScan: ScanReport | null;
  latestScanDate: string | null;
  scanReportCount: number;
  openCritical: number;
  openHigh: number;
  openMedium: number;
  openLow: number;
  totalOpen: number;
  waivedCount: number;
  acceptedRisks: number;
  resolvedCount: number;
  riskScore: number;
  status: "ACTIVE" | "INACTIVE" | "NEVER_SCANNED";
}

export interface ScanReport {
  id: string;
  applicationId: string;
  applicationName: string;
  organizationId: string;
  organizationName: string;
  scanDate: string;
  stage: string;
  policyEvaluationStatus: string;
  totalComponents: number;
  vulnerabilities: VulnerabilityOccurrence[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalViolations: number;
}

export interface Vulnerability {
  id: string;
  cve: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  component: Component;
  description: string;
  cvssScore: number;
  firstSeen: string;
  reference: string;
}

export interface VulnerabilityOccurrence {
  id: string;
  vulnerabilityId: string;
  vulnerability: Vulnerability;
  scanReportId: string;
  applicationId: string;
  applicationName: string;
  organizationId: string;
  organizationName: string;
  componentName: string;
  packageUrl: string;
  path: string;
  status: "OPEN" | "FIXED" | "WAIVED" | "ACCEPTED" | "FALSE_POSITIVE";
  detectedDate: string;
  fixedDate: string | null;
  waivedDate: string | null;
}

export interface Component {
  id: string;
  name: string;
  version: string;
  packageUrl: string;
}

export interface RiskAcceptance {
  id: string;
  applicationId: string;
  applicationName: string;
  organizationId: string;
  vulnerabilityId: string;
  cve: string;
  severity: string;
  acceptedDate: string;
  expiryDate: string;
  reason: string;
  acceptedBy: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED";
}

export interface Mitigation {
  id: string;
  applicationId: string;
  vulnerabilityId: string;
  cve: string;
  severity: string;
  fixedDate: string;
  fixType: string;
  componentName: string;
}

export interface KpiCardData {
  icon: string;
  title: string;
  value: number;
  delta: number;
  deltaLabel: string;
  deltaDirection: "up" | "down" | "flat";
}

export interface OrgCardData {
  id: string;
  name: string;
  subOrganizationCount: number;
  applicationCount: number;
  totalOpenVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  organizationId?: string;
}

export interface OrgDrilldownData {
  organizationId: string;
  organizationName: string;
  directSubOrganizationCount: number;
  totalApplications: number;
  scannedApplications: number;
  neverScanned: number;
  activeApplications: number;
  inactiveApplications: number;
  totalScanReports: number;
  openCritical: number;
  openHigh: number;
  openMedium: number;
  openLow: number;
  waiveVulnerabilities: number;
  acceptedRisks: number;
  resolvedVulnerabilities: number;
  applicationsOutOfSla: number;
  topRiskyApplications: TopRiskyAppItem[];
  latestScanReports: LatestScanRow[];
}

export interface TopRiskyAppItem {
  applicationName: string;
  totalOpen: number;
  criticalCount: number;
  highCount: number;
  riskScore: number;
}

export interface LatestScanRow {
  applicationName: string;
  organizationName: string;
  lastScanDate: string;
  scanReportCount?: number;
  openCritical: number;
  openHigh: number;
  openMedium: number;
  openLow: number;
  waivedAccepted?: number;
  waivedCount?: number;
  acceptedRisks?: number;
  riskScore?: number;
  status: string;
}

export interface SeverityDistribution {
  name: string;
  value: number;
  color: string;
}

export interface TrendPoint {
  month: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface RiskStatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface ScanHealthData {
  totalApps: number;
  scannedApps: number;
  coverageRate: number;
  avgScanAgeDays: number;
  maxScanAgeDays: number;
  totalReports: number;
  avgFrequencyDays: number | null;
  scansThisMonth: number;
  scansLastMonth: number;
  trendPct: number;
  status: "fresh" | "aging" | "stale";
  statusColor: "green" | "amber" | "red";
  appsNeverScanned: number;
}

export interface ScanHealthCardData {
  status: "fresh" | "aging" | "stale";
  statusColor: "green" | "amber" | "red";
  latestScanAge: string;
  totalReports: string;
  avgFrequency: string;
  coverageRate: number;
  trendPct: number;
}

export interface DashboardData {
  kpiCards: KpiCardData[];
  topLevelOrganizations: OrgCardData[];
  severityDistribution: SeverityDistribution[];
  vulnerabilityTrend: TrendPoint[];
  topFiveApps: TopRiskyAppItem[];
  riskStatusDistribution: RiskStatusDistribution[];
  latestScans: LatestScanRow[];
  scanHealthCard: ScanHealthCardData | null;
  totalOrgs: number;
  totalApps: number;
  totalVulns: number;
  totalOpen: number;
  orgDrilldowns: Record<string, OrgDrilldownData>;
}

export interface OrganizationRow {
  organizationId: string;
  organizationName: string;
  parentOrganizationName: string;
  subOrganizationCount: number;
  applicationCount: number;
  activeApplicationCount: number;
  lastScanDate: string;
  criticalCount: number;
  highCount: number;
  openCount: number;
  acceptedRisks: number;
  securityScore: number;
  complianceStatus: "COMPLIANT" | "NON_COMPLIANT" | "IN_PROGRESS";
}

export interface AppRow {
  applicationId: string;
  applicationName: string;
  organizationName: string;
  businessOwner: string;
  technicalOwner: string;
  lastScanDate: string;
  scanReportCount: number;
  openCritical: number;
  openHigh: number;
  openMedium: number;
  openLow: number;
  waivedCount: number;
  acceptedRisks: number;
  riskScore: number;
  status: "ACTIVE" | "INACTIVE" | "NEVER_SCANNED";
  businessCriticality: "HIGH" | "MEDIUM" | "LOW";
}

export interface VulnerabilityRow {
  vulnId: string;
  cve: string;
  sonatypeId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  cvssScore: number;
  applicationsImpacted: number;
  occurrences: number;
  components: string;
  firstSeen: string;
  lastSeen: string;
  status: "OPEN" | "FIXED" | "EXAMINING";
  fixAvailable: boolean;
  exploitability: string;
  policy: string;
}

export interface ReportRow {
  reportId: string;
  scanId: string;
  applicationName: string;
  organizationName: string;
  scanDate: string;
  scannerVersion: string;
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  reportAge: number;
  stage: string;
  policyEvaluationStatus: string;
}

export interface RiskItem {
  riskId: string;
  applicationName: string;
  organizationName: string;
  vulnerability: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  owner: string;
  dueDate: string;
  currentStatus: "OPEN" | "IN_PROGRESS" | "VALIDATED" | "CLOSED";
  sla: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  description: string;
}

export interface WaivedAcceptedRiskRow {
  riskId: string;
  applicationName: string;
  organizationName: string;
  vulnerability: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  type: "WAIVED" | "ACCEPTED";
  justification: string;
  requestedBy: string;
  approvedBy: string;
  approvalDate: string;
  expiryDate: string;
  currentStatus: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "REJECTED";
}
