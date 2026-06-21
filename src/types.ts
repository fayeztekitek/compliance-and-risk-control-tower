/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- User & Role Architecture ---
export type UserRole =
  | "ADMIN"
  | "COMPLIANCE_OFFICER"
  | "RISK_MANAGER"
  | "SECURITY_MANAGER"
  | "PRODUCT_OWNER"
  | "AUDITOR"
  | "EXECUTIVE_READ_ONLY";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
  avatar?: string;
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  description: string;
  permissions: string[];
}

// --- Committee Governance ---
export type CommitteeType =
  | "VEG_COMMITTEE"
  | "VULNERABILITY_COMMITTEE"
  | "SAAS_STEERING"
  | "EXECUTIVE_SECURITY"
  | "EXECUTIVE_ARBITRATION";

export interface Committee {
  id: string;
  name: string;
  date: string;
  time: string;
  type: CommitteeType;
  status: "PLANNED" | "HELD" | "CANCELLED";
  participants: string[];
  agenda: string[];
  minutes?: string;
  decisions: CommitteeDecision[];
}

export interface CommitteeDecision {
  id: string;
  committeeId: string;
  title: string;
  context: string;
  outcome: "APPROVED" | "REJECTED" | "DEFERRED";
  owner: string;
  comments: string;
}

// --- VEG Governance Module ---
export type VEGRequestType =
  | "RFI"
  | "RFP"
  | "NEW_CLIENT_REQUEST"
  | "BD_REQUEST"
  | "ACC_CODE_CREATION"
  | "BID_COMMITTEE_OVERSIGHT";

export interface VEGRequest {
  id: string;
  title: string;
  type: VEGRequestType;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CONTRACT_SIGNATURE";
  client: string;
  marginEstimate: number; // in %
  workloadMD: number; // man-days
  codeACC?: string;
  bidDecision?: "BID" | "NO_BID" | "PENDING";
  goNoGoDecision?: "GO" | "NO_GO" | "PENDING";
  financeState: "PENDING" | "APPROVED" | "REJECTED";
  salesState: "PENDING" | "APPROVED" | "REJECTED";
  productState: "PENDING" | "APPROVED" | "REJECTED";
  legalState: "PENDING" | "APPROVED" | "REJECTED";
  owner: string;
  date: string;
}

export interface Opportunity {
  id: string;
  vegRequestId: string;
  name: string;
  value: number; // EUR
  salesStage:
    | "PROSPECTING"
    | "QUALIFICATION"
    | "BID_PREPARATION"
    | "PROPOSAL_SUBMITTED"
    | "NEGOTIATION"
    | "WON"
    | "LOST";
  contractSigned: boolean;
}

export interface Contract {
  id: string;
  opportunityId: string;
  title: string;
  startDate: string;
  endDate: string;
  slaCommitments: string;
  complianceStatus: "COMPLIANT" | "NON_COMPLIANT" | "WARNING";
  maintenanceSaaS: boolean;
}

// --- Security & Vulnerability Governance ---
export interface Vulnerability {
  id: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "FALSE_POSITIVE" | "WAIVED" | "REMEDIATED";
  sourceScanner: "VERACODE" | "NEXPOSE" | "PEN_TEST";
  detectedDate: string;
  remediatedDate?: string;
  slaDueDate: string;
  isFalsePositive: boolean;
  explanationFalsePositive?: string;
  targetProduct: string;
  owner: string;
  waiverId?: string;
  riskAcceptanceId?: string;
}

export interface Waiver {
  id: string;
  vulnerabilityId: string;
  title: string;
  rationale: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  requestDate: string;
  expiryDate: string;
  approvedBy?: string;
}

export interface RiskAcceptance {
  id: string;
  vulnerabilityId: string;
  title: string;
  businessImpact: string;
  mitigationPlan: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";
  requestDate: string;
  expiryDate: string;
  approvedBy?: string;
}

export interface SLAIncident {
  id: string;
  title: string;
  contractId: string;
  projectName: string;
  breachTime: string;
  resolutionTime?: string;
  maxAllowedResolutionHours: number;
  actualDurationHours?: number;
  status: "OPEN" | "BREACHED" | "RESOLVED";
  penaltyCost?: number; // EUR
}

// --- Roadmaps & Project Monitoring ---
export interface Project {
  id: string;
  name: string;
  code: string;
  manager: string;
  initialBudget: number; // in MD or EUR
  consumedBudget: number; // in MD or EUR
  roadmapId: string;
  status: "ON_TRACK" | "DEVIATING" | "HIGH_RISK";
  rtdValue: number; // Remaining To Do in man-days
  rtdDeviation: number; // deviation %
  slippageMD: number; // slippage in man-days
  testAutomationRate: number; // in %
  prodGoLiveReadinessState: "READY" | "RISKY" | "BLOCKED";
}

export interface Roadmap {
  id: string;
  name: string;
  type: "STRATEGIC" | "BUDGETARY" | "REGULATORY";
  progress: number; // %
  targetDate: string;
  milestoneStatus: "ON_TIME" | "DELAYED" | "CRITICAL";
  leadOwner: string;
}

export interface RTDReview {
  id: string;
  projectId: string;
  reviewMonth: string; // e.g., "2026-05"
  declaredRTD: number;
  actualConsumed: number;
  variance: number;
  comments: string;
  submittedBy: string;
  reviewerApproved: boolean;
}

// --- SaaS Governance & Privacy ---
export interface SaaSApplication {
  id: string;
  name: string;
  lifecycleStage: "ONBOARDING" | "GO_LIVE" | "OFFBOARDING";
  goLiveReadinessScore: number; // 0-100
  privacyDesignStatus: "COMPLIANT" | "PENDING" | "NON_COMPLIANT";
  steeringCheckPassed: boolean;
  dataCategory: string; // "PII_SENSITIVE" | "PII_COMMON" | "NON_PII"
  gdprRiskImpact: "LOW" | "MEDIUM" | "HIGH";
  owner: string;
}

export interface PrivacyAssessment {
  id: string;
  saasApplicationId: string;
  gdprReady: boolean;
  dataProtectionOfficerReview: boolean;
  commitments: string;
  dataProcessingObjective: string;
}

export interface DataProcessingInventory {
  id: string;
  dataName: string;
  purpose: string;
  storageLocation: string;
  retentionPeriod: string;
  encryptionStandard: string;
}

// --- Contractual Verification & Audits ---
export interface ContractualObligation {
  id: string;
  title: string;
  sourceContract: string;
  requirement: string;
  frequency: "MONTHLY" | "QUARTERLY" | "SEMI_ANNUALLY" | "ANNUALLY";
  lastVerifiedDate: string;
  status: "COMPLIANT" | "NON_COMPLIANT" | "OVERDUE";
  verifiedBy: string;
}

export interface Audit {
  id: string;
  title: string;
  type:
    | "SAAS_CONTRACTUAL"
    | "ACCESS_AUDIT"
    | "BACKUP_DRP"
    | "VULNERABILITY"
    | "ENCRYPTION"
    | "STAFF_REVIEW";
  date: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  leadAuditor: string;
}

export interface AuditFinding {
  id: string;
  auditId: string;
  title: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "OPEN" | "CLOSED" | "UNDER_REVIEW";
  targetEntity: string;
}

export interface CorrectiveAction {
  id: string;
  findingId: string;
  description: string;
  owner: string;
  dueDate: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";
  completionDate?: string;
  evidenceDescription?: string;
}

export interface Evidence {
  id: string;
  modelType: "AUDIT" | "VULNERABILITY" | "VEG_REQUEST" | "SAAS_APPLICATION";
  modelId: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedDate: string;
}

// --- Dashboards & Infrastructure ---
export interface KPI {
  id: string;
  name: string;
  value: number;
  target?: number;
  unit: string;
  trend: "UP" | "DOWN" | "STABLE";
  category: "SECURITY" | "DELIVERY" | "SAAS_PRIVACY" | "COMPLIANCE";
  status: "GOOD" | "WARNING" | "CRITICAL";
}

export interface KRI {
  id: string;
  name: string;
  value: number;
  threshold: number;
  unit: string;
  status: "GOOD" | "WARNING" | "CRITICAL";
  category: "SECURITY" | "DELIVERY" | "SAAS_PRIVACY" | "COMPLIANCE";
}

export interface Notification {
  id: string;
  title: string;
  type: "ALERT" | "INFO" | "REMINDER";
  content: string;
  date: string;
  read: boolean;
  targetRoles: UserRole[];
}

export interface AuditTrail {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  module: string;
  status: "SUCCESS" | "FAILED";
  ipAddress: string;
  detailCode: string;
}
