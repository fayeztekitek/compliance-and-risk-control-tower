/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  User,
  Committee,
  VEGRequest,
  Opportunity,
  Contract,
  Vulnerability,
  Waiver,
  RiskAcceptance,
  SLAIncident,
  Project,
  Roadmap,
  SaaSApplication,
  ContractualObligation,
  Audit,
  AuditFinding,
  CorrectiveAction,
  Notification,
  AuditTrail,
  KPI,
  KRI,
} from "./types";

export const MOCK_USERS: User[] = [
  { id: "usr-001", name: "Fayez Tekitek", email: "fayez.tekitek@vermeg.com", role: "ADMIN", status: "ACTIVE" },
  { id: "usr-002", name: "Amandine Rousset", email: "amandine.rousset@vermeg.com", role: "COMPLIANCE_OFFICER", status: "ACTIVE" },
  { id: "usr-003", name: "Marc-Antoine Dubois", email: "m.dubois@vermeg.com", role: "RISK_MANAGER", status: "ACTIVE" },
  { id: "usr-004", name: "Thomas Lemaire", email: "t.lemaire@vermeg.com", role: "SECURITY_MANAGER", status: "ACTIVE" },
  { id: "usr-005", name: "Sarah Laroche", email: "s.laroche@vermeg.com", role: "PRODUCT_OWNER", status: "ACTIVE" },
  { id: "usr-006", name: "Julien Mercer", email: "j.mercer@vermeg.com", role: "AUDITOR", status: "ACTIVE" },
  { id: "usr-007", name: "Jean-Pierre Vermeg", email: "jp.v@vermeg.com", role: "EXECUTIVE_READ_ONLY", status: "ACTIVE" }
];

export const MOCK_ROADMAPS: Roadmap[] = [
  { id: "RM-2026-001", name: "Palmyra Platform core v8 Upgrade", type: "STRATEGIC", progress: 85, targetDate: "2026-07-15", milestoneStatus: "ON_TIME", leadOwner: "Sarah Laroche" },
  { id: "RM-2026-002", name: "GDPR Cross-Border SaaS Isolation Phase II", type: "REGULATORY", progress: 40, targetDate: "2026-09-30", milestoneStatus: "DELAYED", leadOwner: "Amandine Rousset" },
  { id: "RM-2026-003", name: "Colline Regulatory Cloud Ingress 2026", type: "REGULATORY", progress: 95, targetDate: "2026-06-30", milestoneStatus: "ON_TIME", leadOwner: "Marc-Antoine Dubois" },
  { id: "RM-2026-004", name: "Soliam Pension Scheme API expansion", type: "STRATEGIC", progress: 60, targetDate: "2026-08-31", milestoneStatus: "DELAYED", leadOwner: "Sarah Laroche" },
  { id: "RM-2026-005", name: "FY26 Infrastructure De-risking & Re-platforming", type: "BUDGETARY", progress: 15, targetDate: "2026-12-15", milestoneStatus: "CRITICAL", leadOwner: "Thomas Lemaire" }
];

export const MOCK_PROJECTS: Project[] = [
  { id: "PRJ-2026-001", name: "Colline Integration (BNP Paribas)", code: "COLL-BNP", manager: "Sarah Laroche", initialBudget: 1200, consumedBudget: 950, roadmapId: "RM-2026-003", status: "ON_TRACK", rtdValue: 250, rtdDeviation: 2.5, slippageMD: 15, testAutomationRate: 78, prodGoLiveReadinessState: "READY" },
  { id: "PRJ-2026-002", name: "Soliam Cloud Migration (Societe Generale)", code: "SOLI-SG", manager: "Robert Martin", initialBudget: 1800, consumedBudget: 1550, roadmapId: "RM-2026-004", status: "DEVIATING", rtdValue: 400, rtdDeviation: 12.8, slippageMD: 45, testAutomationRate: 55, prodGoLiveReadinessState: "RISKY" },
  { id: "PRJ-2026-003", name: "Palmyra Framework API Gateway Refactor", code: "PALM-GW", manager: "Sarah Laroche", initialBudget: 600, consumedBudget: 580, roadmapId: "RM-2026-001", status: "ON_TRACK", rtdValue: 20, rtdDeviation: 0.0, slippageMD: 0, testAutomationRate: 92, prodGoLiveReadinessState: "READY" },
  { id: "PRJ-2026-004", name: "Megara Security Token Registry Setup", code: "MEGA-STR", manager: "Jean Dupont", initialBudget: 950, consumedBudget: 890, roadmapId: "RM-2026-005", status: "HIGH_RISK", rtdValue: 210, rtdDeviation: 26.4, slippageMD: 70, testAutomationRate: 41, prodGoLiveReadinessState: "BLOCKED" },
  { id: "PRJ-2026-005", name: "Solife Custom Client Portal (Allianz)", code: "SOLI-AZ", manager: "Robert Martin", initialBudget: 1500, consumedBudget: 1100, roadmapId: "RM-2026-004", status: "ON_TRACK", rtdValue: 400, rtdDeviation: 3.1, slippageMD: -10, testAutomationRate: 82, prodGoLiveReadinessState: "READY" },
  { id: "PRJ-2026-006", name: "DIG Digital Banking Onboarding Suite", code: "DIG-ONB", manager: "Clara Besson", initialBudget: 800, consumedBudget: 650, roadmapId: "RM-2026-001", status: "ON_TRACK", rtdValue: 150, rtdDeviation: -1.2, slippageMD: -5, testAutomationRate: 88, prodGoLiveReadinessState: "READY" },
  { id: "PRJ-2026-007", name: "Palmyra Mobile Hybrid App upgrade", code: "PALM-MOB", manager: "Clara Besson", initialBudget: 500, consumedBudget: 420, roadmapId: "RM-2026-001", status: "DEVIATING", rtdValue: 120, rtdDeviation: 16.5, slippageMD: 25, testAutomationRate: 60, prodGoLiveReadinessState: "RISKY" },
  { id: "PRJ-2026-008", name: "Regulatory Reporting engine v12", code: "REG-REP12", manager: "Marc-Antoine Dubois", initialBudget: 750, consumedBudget: 720, roadmapId: "RM-2026-003", status: "HIGH_RISK", rtdValue: 90, rtdDeviation: 22.0, slippageMD: 35, testAutomationRate: 48, prodGoLiveReadinessState: "BLOCKED" }
];

export const MOCK_VEG_REQUESTS: VEGRequest[] = [];

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  { id: "opp-003", vegRequestId: "VEG-2026-004", name: "Allianz Retirement Portal Licensing", value: 450000, salesStage: "PROPOSAL_SUBMITTED", contractSigned: false },
  { id: "opp-004", vegRequestId: "VEG-2026-005", name: "Credit Agricole Palmyra License Agreement", value: 380000, salesStage: "BID_PREPARATION", contractSigned: false }
];

export const MOCK_CONTRACTS: Contract[] = [
  { id: "CON-2026-002", opportunityId: "opp-002", title: "Societe Generale Soliam SaaS Core Agreement", startDate: "2026-06-15", endDate: "2031-06-15", slaCommitments: "99.95% Uptime, GDPR strict sovereign hosting, zero data transfer out of EU", complianceStatus: "WARNING", maintenanceSaaS: true }
];

export const MOCK_SLA_INCIDENTS: SLAIncident[] = [];

export const MOCK_VULNERABILITIES: Vulnerability[] = [
  { id: "VULN-DS-2026-001", title: "Missing Co-sign / Sigstore Signatures for Palmyra Docker Images", severity: "HIGH", status: "OPEN", sourceScanner: "PEN_TEST", detectedDate: "2026-06-08", slaDueDate: "2026-07-08", isFalsePositive: false, targetProduct: "Palmyra Platform", owner: "Thomas Lemaire" },
  { id: "VULN-DS-2026-002", title: "Plaintext Vault Token Exposure in Palmyra GitLab Runner Environment Variables", severity: "CRITICAL", status: "OPEN", sourceScanner: "VERACODE", detectedDate: "2026-06-09", slaDueDate: "2026-06-16", isFalsePositive: false, targetProduct: "Palmyra Platform", owner: "Thomas Lemaire" },
  { id: "VULN-DS-2026-003", title: "Remote Code Execution in Spring Boot framework dependency (Colline REST backend)", severity: "CRITICAL", status: "OPEN", sourceScanner: "VERACODE", detectedDate: "2026-06-05", slaDueDate: "2026-06-12", isFalsePositive: false, targetProduct: "Colline Integration", owner: "Thomas Lemaire" },
  { id: "VULN-DS-2026-004", title: "Unrestricted Port 5432 Ingress on Palmyra PostgreSQL Cluster", severity: "HIGH", status: "OPEN", sourceScanner: "NEXPOSE", detectedDate: "2026-06-07", slaDueDate: "2026-07-07", isFalsePositive: false, targetProduct: "Soliam Cloud Migration", owner: "Robert Martin" },
  { id: "VULN-DS-2026-005", title: "Cryptographic Weak Deserialization in Megara Token Broker API", severity: "HIGH", status: "OPEN", sourceScanner: "VERACODE", detectedDate: "2026-06-06", slaDueDate: "2026-07-06", isFalsePositive: false, targetProduct: "Megara Security Token Registry", owner: "Thomas Lemaire" },
  // --- Palmyra Expert Committee Slide Data Ingestions ---
  { id: "CVE-2026-40453", title: "Apache Camel — camel-jms 4.4.3: Remote code execution or deserialization vulnerability on JMS listener (Out of SLA, concerns only version 24.1. Complex migration)", severity: "CRITICAL", status: "OPEN", sourceScanner: "VERACODE", detectedDate: "2026-05-10", slaDueDate: "2026-06-10", isFalsePositive: false, targetProduct: "Palmyra Platform", owner: "Thomas Lemaire" },
  { id: "CVE-2026-40860", title: "Apache Camel — camel-jms 4.4.3: Unsafe deserialization in JMS endpoints (Out of SLA, concerns only version 24.1. Complex migration)", severity: "CRITICAL", status: "OPEN", sourceScanner: "VERACODE", detectedDate: "2026-05-10", slaDueDate: "2026-06-10", isFalsePositive: false, targetProduct: "Palmyra Platform", owner: "Thomas Lemaire" },
  { id: "CVE-2026-47323", title: "Apache Camel — camel-cxf-transport: XXE and Server-side Request Forgery in CXF endpoints (Pending remediation, target June 11, 2026)", severity: "CRITICAL", status: "OPEN", sourceScanner: "VERACODE", detectedDate: "2026-05-12", slaDueDate: "2026-06-11", isFalsePositive: false, targetProduct: "Palmyra Platform", owner: "Thomas Lemaire" },
  { id: "CVE-2026-45505", title: "Apache ActiveMQ: Remote Code Execution via OpenWire protocol broker manipulation (On hold, target June 17, 2026)", severity: "HIGH", status: "OPEN", sourceScanner: "VERACODE", detectedDate: "2026-05-18", slaDueDate: "2026-06-17", isFalsePositive: false, targetProduct: "Palmyra Platform", owner: "Thomas Lemaire" },
  { id: "CVE-2026-42588", title: "Apache ActiveMQ: Path traversal or deserialization vulnerability in web administration board (On hold, target June 17, 2026)", severity: "HIGH", status: "OPEN", sourceScanner: "VERACODE", detectedDate: "2026-05-18", slaDueDate: "2026-06-17", isFalsePositive: false, targetProduct: "Palmyra Platform", owner: "Thomas Lemaire" },
  // Identified False Positives from Slide 3 & 4
  { id: "CVE-2026-40973", title: "org.springframework.boot : spring-boot: Temporary directory serialization bypass (False Positive)", severity: "HIGH", status: "FALSE_POSITIVE", sourceScanner: "VERACODE", detectedDate: "2026-05-10", slaDueDate: "2026-06-09", isFalsePositive: true, explanationFalsePositive: "Not applicable to our deployment. We are not using persistent servlet sessions in Spring Boot ('server.servlet.session.persistent' is not enabled), which is the required condition to trigger this vulnerability. Without persistent session storage, the vulnerable temp-directory/session persistence path is not used, so this finding is not exploitable in our environment.", targetProduct: "Palmyra Platform", owner: "Thomas Lemaire" },
  { id: "CVE-2026-22747", title: "org.springframework.security : spring-security-web: Privilege escalation in SubjectX500PrincipalExtractor (False Positive)", severity: "HIGH", status: "FALSE_POSITIVE", sourceScanner: "VERACODE", detectedDate: "2026-05-10", slaDueDate: "2026-06-09", isFalsePositive: true, explanationFalsePositive: "Not affected (CVE scope mismatch + not using affected class). CVE-2026-22747 (Spring advisory) states the vulnerability affects Spring Security 7.0.0-7.0.4 and specifically the 'SubjectX500PrincipalExtractor' principal extraction logic. Our application does not use Spring Security 7.x (therefore outside the affected version range). Additionally, our MTLS driver uses the DN-regex extractor ('SubjectDnX509PrincipalExtractor') rather than 'SubjectX500PrincipalExtractor'. The CVE description explicitly identifies 'SubjectX500PrincipalExtractor' as the affected class, and does not state that 'SubjectDnX509PrincipalExtractor' is affected. The ticket's claim that 'SubjectDnX509PrincipalExtractor' is affected appears to be a third-party advisory deviation and does not match the CVE scope as published in the Spring advisory.", targetProduct: "Palmyra Platform", owner: "Thomas Lemaire" },
  { id: "CVE-2026-22740", title: "org.springframework : spring-web: Multipart form parsing file descriptor leak / Denial of Service in WebFlux (False Positive)", severity: "HIGH", status: "FALSE_POSITIVE", sourceScanner: "VERACODE", detectedDate: "2026-05-10", slaDueDate: "2026-06-09", isFalsePositive: true, explanationFalsePositive: "We reviewed CVE-2026-22740 (\"Spring Framework DoS with Multipart Temp Files in WebFlux\"). This issue only impacts Spring WebFlux applications that process 'multipart/form-data' requests via the WebFlux multipart reader. Our application does not use Spring WebFlux (reactive stack) and therefore does not execute the vulnerable WebFlux multipart code path. As a result, this finding is not applicable to our application and does not require remediation.", targetProduct: "Palmyra Platform", owner: "Thomas Lemaire" },
  { id: "CVE-2026-40975", title: "org.springframework.boot : spring-boot: Property placeholder processing arbitrary secret generation (False Positive)", severity: "HIGH", status: "FALSE_POSITIVE", sourceScanner: "VERACODE", detectedDate: "2026-05-10", slaDueDate: "2026-06-09", isFalsePositive: true, explanationFalsePositive: "Not applicable to our deployment. The CVE requires '${random.value}' to be used for generating secrets in application configuration. Our codebase does not use '${random.value}' anywhere. All secrets are from trusted sources, not Spring property placeholders. The vulnerable code path is never invoked, making this finding not exploitable in our environment.", targetProduct: "Palmyra Platform", owner: "Thomas Lemaire" },
  { id: "CVE-2026-6009", title: "net.sf.jasperreports : jasperreports: Deserialization vulnerability in NetSF compiling engines (False Positive)", severity: "HIGH", status: "FALSE_POSITIVE", sourceScanner: "VERACODE", detectedDate: "2026-05-10", slaDueDate: "2026-06-09", isFalsePositive: true, explanationFalsePositive: "This Java deserialization vulnerability affecting JasperReports does not apply to our environment. We are using JasperReports 6.21.5 with JDK 17, which has hardened serialization restrictions. JasperReports 4.0.0 is outside the vulnerable range. This combination of versions eliminates the risk.", targetProduct: "Palmyra Platform", owner: "Thomas Lemaire" }
];

export const MOCK_WAIVERS: Waiver[] = [];

export const MOCK_RISK_ACCEPTANCES: RiskAcceptance[] = [];

export const MOCK_SAAS_APPLICATIONS: SaaSApplication[] = [
  { id: "SAAS-2026-001", name: "Vermeg Palmyra SaaS Hosting Suite", lifecycleStage: "GO_LIVE", goLiveReadinessScore: 94, privacyDesignStatus: "COMPLIANT", steeringCheckPassed: true, dataCategory: "PII_SENSITIVE", gdprRiskImpact: "HIGH", owner: "Sarah Laroche" },
  { id: "SAAS-2026-002", name: "Colline Cloud Client Portal", lifecycleStage: "GO_LIVE", goLiveReadinessScore: 82, privacyDesignStatus: "COMPLIANT", steeringCheckPassed: true, dataCategory: "PII_COMMON", gdprRiskImpact: "MEDIUM", owner: "Marc-Antoine Dubois" },
  { id: "SAAS-2026-003", name: "Soliam Pension Scheme SaaS", lifecycleStage: "ONBOARDING", goLiveReadinessScore: 58, privacyDesignStatus: "PENDING", steeringCheckPassed: false, dataCategory: "PII_SENSITIVE", gdprRiskImpact: "HIGH", owner: "Sarah Laroche" },
  { id: "SAAS-2026-004", name: "Regulatory Automated Report Dispatcher", lifecycleStage: "GO_LIVE", goLiveReadinessScore: 78, privacyDesignStatus: "COMPLIANT", steeringCheckPassed: true, dataCategory: "NON_PII", gdprRiskImpact: "LOW", owner: "Marc-Antoine Dubois" },
  { id: "SAAS-2026-005", name: "DIG Bank Onboarding Cloud Core", lifecycleStage: "ONBOARDING", goLiveReadinessScore: 42, privacyDesignStatus: "NON_PII" as any, steeringCheckPassed: false, dataCategory: "PII_SENSITIVE", gdprRiskImpact: "HIGH", owner: "Thomas Lemaire" },
  { id: "SAAS-2026-006", name: "Solife Allianz Dedicated Legacy Tenant", lifecycleStage: "OFFBOARDING", goLiveReadinessScore: 100, privacyDesignStatus: "COMPLIANT", steeringCheckPassed: true, dataCategory: "PII_SENSITIVE", gdprRiskImpact: "HIGH", owner: "Robert Martin" }
];

export const MOCK_CONTRACTUAL_OBLIGATIONS: ContractualObligation[] = [
  { id: "OBL-2026-001", title: "SaaS Database Encryption at Rest Check", sourceContract: "CON-2026-002 (Societe Generale)", requirement: "Verify AES-256 cloud disk encryption is active and keys are rotated semi-annually", frequency: "SEMI_ANNUALLY", lastVerifiedDate: "2025-12-15", status: "OVERDUE", verifiedBy: "Thomas Lemaire" },
  { id: "OBL-2026-002", title: "ISO 27001 Access Control Audit Proximity", sourceContract: "CON-2026-001 (BNP Paribas)", requirement: "Perform system access review for all developers assigned to Palmyra master projects", frequency: "QUARTERLY", lastVerifiedDate: "2026-03-10", status: "COMPLIANT", verifiedBy: "Amandine Rousset" },
  { id: "OBL-2026-003", title: "Monthly Backup Restore Simulation Walk", sourceContract: "CON-2026-002 (Societe Generale)", requirement: "Perform fully documented recovery script dry-run of database cluster", frequency: "MONTHLY", lastVerifiedDate: "2026-05-02", status: "COMPLIANT", verifiedBy: "Thomas Lemaire" },
  { id: "OBL-2026-004", title: "Subcontractor Access Review & Clearance Check", sourceContract: "CON-2026-001 (BNP Paribas)", requirement: "Obtain clean background checks and signed NDA amendments from all contract agencies", frequency: "ANNUALLY", lastVerifiedDate: "2025-06-25", status: "OVERDUE", verifiedBy: "Amandine Rousset" },
  { id: "OBL-2026-005", title: "Critical Vulnerability SLA Remediation", sourceContract: "CON-2026-002 (Societe Generale)", requirement: "Remediate critical vulnerabilities within 30 days of discovery", frequency: "MONTHLY", lastVerifiedDate: "2026-05-15", status: "NON_COMPLIANT", verifiedBy: "Thomas Lemaire" },
  { id: "OBL-2026-006", title: "Disaster Recovery Testing & RTO Audit", sourceContract: "CON-2026-001 (BNP Paribas)", requirement: "Execute disaster recovery simulation confirming RTO < 4 hours and RPO < 1 hour", frequency: "ANNUALLY", lastVerifiedDate: "2025-11-20", status: "COMPLIANT", verifiedBy: "Thomas Lemaire" },
  { id: "OBL-2026-007", title: "GDPR Right-to-be-Forgotten Request Verification", sourceContract: "CON-2026-002 (Societe Generale)", requirement: "Demonstrate database capability to sanitize records within 72 hours of customer notification", frequency: "SEMI_ANNUALLY", lastVerifiedDate: "2025-12-10", status: "OVERDUE", verifiedBy: "Amandine Rousset" },
  { id: "OBL-2026-008", title: "Penetration Testing SLA Commitment", sourceContract: "CON-2026-001 (BNP Paribas)", requirement: "Provide annual independent penetration testing certificate by qualified CREST auditor", frequency: "ANNUALLY", lastVerifiedDate: "2025-10-15", status: "COMPLIANT", verifiedBy: "Thomas Lemaire" },
  { id: "OBL-2026-009", title: "Encryption Standard Audit - TLS 1.3 compliance", sourceContract: "CON-2026-002 (Societe Generale)", requirement: "Confirm rejection of TLS 1.0 and 1.1 handshakes on all public ingress endpoints", frequency: "ANNUALLY", lastVerifiedDate: "2026-01-20", status: "COMPLIANT", verifiedBy: "Thomas Lemaire" },
  { id: "OBL-2026-010", title: "SaaS Maintenance Contract Terms compliance", sourceContract: "CON-2026-002 (Societe Generale)", requirement: "Ensure third-party container runtime licenses are up-to-date and renewed", frequency: "ANNUALLY", lastVerifiedDate: "2025-05-30", status: "OVERDUE", verifiedBy: "Amandine Rousset" }
];

export const MOCK_AUDITS: Audit[] = [
  { id: "AUDIT-2026-001", title: "SaaS Contractual Conformity Audit H1 2026", type: "SAAS_CONTRACTUAL", date: "2026-05-10", status: "COMPLETED", leadAuditor: "Julien Mercer" },
  { id: "AUDIT-2026-002", title: "Societe Generale Tenant Access Permissions Audit", type: "ACCESS_AUDIT", date: "2026-06-02", status: "IN_PROGRESS", leadAuditor: "Julien Mercer" },
  { id: "AUDIT-2026-003", title: "Palmyra Platform Cryptography & Secrets Audit", type: "ENCRYPTION", date: "2026-06-18", status: "PLANNED", leadAuditor: "Julien Mercer" },
  { id: "AUDIT-2026-004", title: "Chronos Delivery RTD Verification Audit", type: "STAFF_REVIEW", date: "2026-04-15", status: "COMPLETED", leadAuditor: "Amandine Rousset" }
];

export const MOCK_AUDIT_FINDINGS: AuditFinding[] = [
  { id: "FIND-2026-001", auditId: "AUDIT-2026-001", title: "Missing Semi-Annual Encryption Key Rotation Records", description: "Azure Key Vault rotation is configured but there are no signed verification sheets for key reviews from November 2025.", severity: "MEDIUM", status: "OPEN", targetEntity: "Soliam Cloud Migration" },
  { id: "FIND-2026-002", auditId: "AUDIT-2026-001", title: "Stale Subcontractor Accounts Over 90 Days Active", description: "Three consultants who finished their assignments on February 15 still possess read permissions on the Git Repository.", severity: "HIGH", status: "OPEN", targetEntity: "Palmyra Framework API Gateway" },
  { id: "FIND-2026-0010" as any, auditId: "AUDIT-2026-001", title: "Incomplete SaaS Supplier Data Privacy Appendices", description: "Two cloud SaaS components lack full DPA signed documents by the Vermeg Legal Representative.", severity: "MEDIUM", status: "OPEN", targetEntity: "Vermeg Palmyra SaaS" },
  { id: "FIND-2026-003", auditId: "AUDIT-2026-002", title: "Orphaned Admins on Production Containers", description: "Production cloud nodes possess developer key pairs that did not go through the security validation registry.", severity: "CRITICAL", status: "OPEN", targetEntity: "Soliam Cloud Migration" },
  { id: "FIND-2026-004", auditId: "AUDIT-2026-002", title: "Sharing of Support Credentials inside Ops Slack", description: "Support team has pasted raw DB tokens inside unencrypted private workspace channels.", severity: "HIGH", status: "OPEN", targetEntity: "Colline Integration" },
  { id: "FIND-2026-005", auditId: "AUDIT-2026-002", title: "Weak MFA Enforcement Policies for Contractor Email", description: "Two temporary contractor domains are bypassed in Vermeg central MFA groups.", severity: "HIGH", status: "OPEN", targetEntity: "Palmyra Framework API Gateway" },
  { id: "FIND-2026-006", auditId: "AUDIT-2026-004", title: "Unreviewed Chronos Overrun Declarations", description: "Manager approval cycle for overruns above 15% is missing on three Soliam projects.", severity: "MEDIUM", status: "CLOSED", targetEntity: "Soliam Cloud Migration" },
  { id: "FIND-2026-007", auditId: "AUDIT-2026-004", title: "Chronos Declared RTD Value Mismatch", description: "Stale data: project managers did not update Remaining To Do fields for the month of April in Chronos.", severity: "HIGH", status: "CLOSED", targetEntity: "Regulatory Reporting engine v12" },
  { id: "FIND-2026-008", auditId: "AUDIT-2026-004", title: "No Justification for 45-day budget variance alert", description: "No validation sheet is loaded inside Chronos system justifying the 50MD budget overshoot.", severity: "MEDIUM", status: "OPEN", targetEntity: "Soliam Custom Client Portal" },
  { id: "FIND-2026-009", auditId: "AUDIT-2026-001", title: "Unencrypted Local Config File for Test Framework", description: "Test automation script loads raw connection strings containing test database users.", severity: "LOW", status: "OPEN", targetEntity: "DIG Digital Banking Onboarding" },
  { id: "FIND-2026-011", auditId: "AUDIT-2026-001", title: "Inappropriate Access to Financial RFP Responses", description: "Tender folder on SharePoint has broad read access permissions.", severity: "MEDIUM", status: "OPEN", targetEntity: "BNP Paribas Security Clearing RFP" },
  { id: "FIND-2026-012", auditId: "AUDIT-2026-001", title: "Backup Failure System Silent Alert", description: "Database backup failure did not trigger PagerDuty notifications during April server switch.", severity: "HIGH", status: "CLOSED", targetEntity: "Regulatory Automated Report Dispatcher" },
  { id: "FIND-2026-013", auditId: "AUDIT-2026-002", title: "No Offboarding Check for Left Staff Member", description: "Developer account was still active 4 days after official contract termination.", severity: "HIGH", status: "OPEN", targetEntity: "Palmyra Framework API Gateway" },
  { id: "FIND-2026-014", auditId: "AUDIT-2026-002", title: "Insecure Storage of Client Certificate Key in Test Env", description: "SSL private key of test BNP platform uploaded to non-isolated file cabinet.", severity: "HIGH", status: "OPEN", targetEntity: "Colline Integration" },
  { id: "FIND-2026-015", auditId: "AUDIT-2026-004", title: "Undocumented Project Information Sheet Amendments", description: "Two projects had key scope parameters changed without formal project sheet signature.", severity: "LOW", status: "OPEN", targetEntity: "Regulatory Reporting engine v12" }
];

export const MOCK_CORRECTIVE_ACTIONS: CorrectiveAction[] = [
  { id: "ACT-2026-001", findingId: "FIND-2026-001", description: "Retroactively sign key vault reviews for Nov 2025 and establish system task automailer.", owner: "Thomas Lemaire", dueDate: "2026-06-15", status: "IN_PROGRESS" },
  { id: "ACT-2026-002", findingId: "FIND-2026-002", description: "Revoke Git commit and read rights dynamically via Azure AD automated script.", owner: "Amandine Rousset", dueDate: "2026-06-10", status: "COMPLETED", completionDate: "2026-06-08", evidenceDescription: "AD logs confirmation output loaded." },
  { id: "ACT-2026-003", findingId: "FIND-2026-003", description: "Rotate SSH master keypairs on all staging and prod nodes immediately.", owner: "Thomas Lemaire", dueDate: "2026-06-12", status: "NOT_STARTED" },
  { id: "ACT-2026-004", findingId: "FIND-2026-004", description: "Purge Slack message history containing tokens and roll all secret database passwords.", owner: "Thomas Lemaire", dueDate: "2026-06-08", status: "COMPLETED", completionDate: "2026-06-07", evidenceDescription: "Password rotated in Vault; Slack message purged." },
  { id: "ACT-2026-005", findingId: "FIND-2026-005", description: "Audit contractor AD domain groups and enforce central MFA policies without exclusion.", owner: "Thomas Lemaire", dueDate: "2026-06-25", status: "NOT_STARTED" },
  { id: "ACT-2026-006", findingId: "FIND-2026-006", description: "Implement strict validation check script inside Chronos requiring VP signature for over 15% budget overrun.", owner: "Amandine Rousset", dueDate: "2025-12-30", status: "COMPLETED", completionDate: "2025-12-28", evidenceDescription: "Chronos update logged." },
  { id: "ACT-2026-007", findingId: "FIND-2026-007", description: "Train PMs on strict monthly RTD submission procedures.", owner: "Sarah Laroche", dueDate: "2026-04-30", status: "COMPLETED", completionDate: "2026-04-29" },
  { id: "ACT-2026-008", findingId: "FIND-2026-008", description: "Load formal explanation sheet for Allianz budget overrun.", owner: "Sarah Laroche", dueDate: "2026-06-20", status: "IN_PROGRESS" },
  { id: "ACT-2026-009", findingId: "FIND-2026-009", description: "Move raw connection string variables inside masked system env variables.", owner: "Thomas Lemaire", dueDate: "2026-07-15", status: "NOT_STARTED" },
  { id: "ACT-2026-010", findingId: "FIND-2026-0010" as any, description: "Contact third-party vendors to sign DPA documents under legal threat.", owner: "Amandine Rousset", dueDate: "2026-07-31", status: "IN_PROGRESS" },
  { id: "ACT-2026-011", findingId: "FIND-2026-011", description: "Restrict SP cleared access to strict account partners and sales desk heads groups.", owner: "Amandine Rousset", dueDate: "2026-06-30", status: "IN_PROGRESS" },
  { id: "ACT-2026-012", findingId: "FIND-2026-012", description: "Configure fallback Slack webhook channel on primary DB backup scripts.", owner: "Thomas Lemaire", dueDate: "2026-05-15", status: "COMPLETED", completionDate: "2026-05-10" },
  { id: "ACT-2026-013", findingId: "FIND-2026-013", description: "Audit offboarding workflow checklists from HR directly through identity integrations.", owner: "Amandine Rousset", dueDate: "2026-06-15", status: "OVERDUE" },
  { id: "ACT-2026-014", findingId: "FIND-2026-014", description: "Establish isolated virtual volume for BNP secure certificates with restricted access controls.", owner: "Thomas Lemaire", dueDate: "2026-06-22", status: "IN_PROGRESS" },
  { id: "ACT-2026-015", findingId: "FIND-2026-015", description: "Formally approve and sign outstanding Project Information Sheet changes.", owner: "Sarah Laroche", dueDate: "2026-06-25", status: "NOT_STARTED" },
  { id: "ACT-2026-016", findingId: "FIND-2026-003", description: "Draft automated policy rejecting all docker push commands containing developer-origin certificates.", owner: "Thomas Lemaire", dueDate: "2026-06-30", status: "IN_PROGRESS" },
  { id: "ACT-2026-017", findingId: "FIND-2026-002", description: "Enforce bi-weekly central directory scan for left contractor contractors.", owner: "Amandine Rousset", dueDate: "2026-06-18", status: "NOT_STARTED" },
  { id: "ACT-2026-018", findingId: "FIND-2026-004", description: "Configure automated Slack DLP policy triggering block on credit card or security token regex.", owner: "Thomas Lemaire", dueDate: "2026-07-05", status: "NOT_STARTED" },
  { id: "ACT-2026-019", findingId: "FIND-2026-005", description: "Establish continuous integration AD compliance dashboard.", owner: "Thomas Lemaire", dueDate: "2026-08-10", status: "NOT_STARTED" },
  { id: "ACT-2026-020", findingId: "FIND-2026-001", description: "Automate Azure Key Vault rotation reports creation using weekly Logic Apps.", owner: "Thomas Lemaire", dueDate: "2026-07-20", status: "NOT_STARTED" }
];

export const MOCK_COMMITTEES: Committee[] = [
  {
    id: "COMM-2026-001",
    name: "VEG Bid & Candidate Approval Committee (June H1)",
    date: "2026-06-03",
    time: "10:00",
    type: "VEG_COMMITTEE",
    status: "HELD",
    participants: ["Fayez Tekitek", "Amandine Rousset", "Marc-Antoine Dubois", "Sarah Laroche"],
    agenda: ["Validation of Allianz Retirement extension bid", "Go/No-Go decision for Credit Agricole Integration", "Review of Zurich Life Insurance sandbox proposal"],
    minutes: "Minutes: Allianz bid approved with 28.5% expected margin margin. Credit Agricole Go/No-Go approved conditional on Legal drafting the secure escrow agreement. Zurich Life sandbox approved for ACC code allocation.",
    decisions: [
      { id: "DEC-001", committeeId: "COMM-2026-001", title: "Allianz Retirement Extension Bid approval", context: "Proposal to Allianz for 650MD framework", outcome: "APPROVED", owner: "Sarah Laroche", comments: "Requires monitoring of Palmyra Gateway resources." },
      { id: "DEC-002", committeeId: "COMM-2026-001", title: "Credit Agricole Palmyra Mobile Integration", context: "550MD potential client deal validation", outcome: "APPROVED", owner: "Fayez Tekitek", comments: "Check legal guarantees regarding intellectual property." }
    ]
  },
  {
    id: "COMM-2026-002",
    name: "Monthly Expert Vulnerability Committee (June)",
    date: "2026-06-08",
    time: "14:00",
    type: "VULNERABILITY_COMMITTEE",
    status: "HELD",
    participants: ["Thomas Lemaire", "Marc-Antoine Dubois", "Julien Mercer", "Amandine Rousset"],
    agenda: [
      "Vulnerabilities audit out of SLA (Apache Camel, ActiveMQ)",
      "Validation of identified Spring Framework & JasperReports False Positives",
      "Analysis of historical security scans (SCA / SAST / Sonar) per Palmyra Release Version",
      "Approve Remediation and upgrade action plans"
    ],
    minutes: "Palmyra product manager presented results for the Spring / JasperReports vulnerability scans. 5 major high CVE findings were proved to be false positives based on our architectural deployment context. Library vulnerability SLA breaches were reviewed; the team committed to the recommended patch and upgrade schedule.",
    decisions: [
      { id: "DEC-003", committeeId: "COMM-2026-002", title: "Approval of Spring and JasperReports False Positives", context: "High severity CVE-2026-40973, CVE-2026-22747, CVE-2026-22740, CVE-2026-40975, CVE-2026-6009", outcome: "APPROVED", owner: "Thomas Lemaire", comments: "Validations confirmed; non-vulnerable paths confirmed." },
      { id: "DEC-003-B", committeeId: "COMM-2026-002", title: "Remediation Action Plan: Apache Camel", context: "CVE-2026-40453, CVE-2026-40860, CVE-2026-47323 library exposures", outcome: "APPROVED", owner: "Thomas Lemaire", comments: "Scheduled complex migration update for June 2026." },
      { id: "DEC-003-C", committeeId: "COMM-2026-002", title: "ActiveMQ Broker Upgrade authorization", context: "CVE-2026-45505, CVE-2026-42588 library exposures", outcome: "APPROVED", owner: "Thomas Lemaire", comments: "Target upgrade completion set for June 17, 2026." }
    ]
  },
  {
    id: "COMM-2026-003",
    name: "Quarterly SaaS Steering Committee Q2",
    date: "2026-05-15",
    time: "11:00",
    type: "SAAS_STEERING",
    status: "HELD",
    participants: ["Amandine Rousset", "Sarah Laroche", "Marc-Antoine Dubois"],
    agenda: ["SaaS Onboarding of Soliam Pension Scheme SaaS", "Go-live readiness review: Vermeg Palmyra SaaS Hosting", "Sanitary GDPR Review: DIG Bank Core Integration"],
    minutes: "Palmyra SaaS Hosting cleared with 94 score. Soliam Pension Scheme onboarding deferred for 30 days due to incomplete privacy impact assessment.",
    decisions: [
      { id: "DEC-004", committeeId: "COMM-2026-003", title: "Vermeg Palmyra SaaS Hosting Clearance", context: "Go live compliance review", outcome: "APPROVED", owner: "Sarah Laroche", comments: "Database disk encryption confirmed active." },
      { id: "DEC-005", committeeId: "COMM-2026-003", title: "Soliam Pension Scheme Onboarding", context: "Onboarding stage authorization", outcome: "DEFERRED", owner: "Sarah Laroche", comments: "Postponed until PII assessment review complete." }
    ]
  },
  {
    id: "COMM-2026-004",
    name: "Quarterly Executive Security Committee Q2",
    date: "2026-06-18",
    time: "09:30",
    type: "EXECUTIVE_SECURITY",
    status: "PLANNED",
    participants: ["Jean-Pierre Vermeg", "Amandine Rousset", "Thomas Lemaire", "Marc-Antoine Dubois"],
    agenda: ["System compliance metrics report", "SLA Incident SG Outage Arbitration", "Audit Findings overdueness review"],
    decisions: []
  },
  {
    id: "COMM-2026-005",
    name: "Executive Risk Arbitration for Soliam Go-Live",
    date: "2026-06-25",
    time: "15:00",
    type: "EXECUTIVE_ARBITRATION",
    status: "PLANNED",
    participants: ["Jean-Pierre Vermeg", "Fayez Tekitek", "Amandine Rousset", "Marc-Antoine Dubois", "Sarah Laroche"],
    agenda: ["Production go-live greenlight: Soliam SaaS SG client tenant", "Risk review regarding SQL injection and SLA breach"],
    decisions: []
  }
];

export const MOCK_NP_KPIS: KPI[] = [
  { id: "kpi-001", name: "Critical Vulnerabilities", value: 4, target: 0, unit: "Open", trend: "DOWN", category: "SECURITY", status: "CRITICAL" },
  { id: "kpi-002", name: "High Vulnerabilities", value: 9, target: 0, unit: "Open", trend: "UP", category: "SECURITY", status: "WARNING" },
  { id: "kpi-003", name: "SLA Incidents (Month)", value: 3, target: 0, unit: "Incidents", trend: "UP", category: "COMPLIANCE", status: "WARNING" },
  { id: "kpi-004", name: "Waivers Expiring Within 30d", value: 1, target: 0, unit: "Waivers", trend: "STABLE", category: "COMPLIANCE", status: "WARNING" },
  { id: "kpi-005", name: "Active Risk Acceptances", value: 3, target: 2, unit: "Approved", trend: "STABLE", category: "SECURITY", status: "GOOD" },
  { id: "kpi-006", name: "Access Overdue Reviews", value: 4, target: 0, unit: "Audits", trend: "UP", category: "COMPLIANCE", status: "CRITICAL" },
  { id: "kpi-007", name: "Corrective Actions Overdue", value: 1, target: 0, unit: "Actions", trend: "UP", category: "COMPLIANCE", status: "CRITICAL" },
  { id: "kpi-008", name: "Average RTD Deviation", value: 10.3, target: 5.0, unit: "% Deviation", trend: "UP", category: "DELIVERY", status: "WARNING" },
  { id: "kpi-009", name: "Budget Slippaged Projects", value: 2, target: 0, unit: "Projects", trend: "UP", category: "DELIVERY", status: "WARNING" },
  { id: "kpi-010", name: "Roadmap Milestones SLA Status", value: 60.0, target: 100.0, unit: "% On-Time", trend: "DOWN", category: "DELIVERY", status: "CRITICAL" },
  { id: "kpi-011", name: "SaaS Go-Live Readiness Avg", value: 76.3, target: 85.0, unit: "% Score", trend: "UP", category: "SAAS_PRIVACY", status: "WARNING" },
  { id: "kpi-012", name: "Privacy Impact Compliance Rate", value: 83.3, target: 100.0, unit: "% Compliant", trend: "STABLE", category: "SAAS_PRIVACY", status: "WARNING" },
  { id: "kpi-013", name: "Contractual Obligations Match Rate", value: 60.0, target: 100.0, unit: "% Verified", trend: "DOWN", category: "COMPLIANCE", status: "CRITICAL" },
  { id: "kpi-014", name: "Go/No-Go Approval Average Cycle", value: 14.2, target: 7.0, unit: "Days", trend: "STABLE", category: "DELIVERY", status: "WARNING" },
  { id: "kpi-015", name: "Dossiers Complétude Globale", value: 81.5, target: 95.0, unit: "% Rate", trend: "UP", category: "COMPLIANCE", status: "GOOD" }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "notif-001", title: "Security SLA Breach Warning", type: "ALERT", content: "Critical SQL Injection VULN-2026-001 SLA expires in 7 days on Colline. Corrective action ACT-2026-001 is incomplete.", date: "2026-06-10", read: false, targetRoles: ["ADMIN", "SECURITY_MANAGER", "RISK_MANAGER"] },
  { id: "notif-002", title: "Upcoming Roadmap Review Deadline", type: "INFO", content: "Monthly RTD declarations for June roadmaps are due in 4 days. Stale RTD flagged on 3 development branches.", date: "2026-06-08", read: false, targetRoles: ["PRODUCT_OWNER", "RISK_MANAGER"] },
  { id: "notif-003", title: "Expired GDPR Contractual Verification", type: "ALERT", content: "Societe Generale Master Contract requires database disk encryption rest review. Marked OVERDUE since 30 days.", date: "2026-06-05", read: true, targetRoles: ["COMPLIANCE_OFFICER", "ADMIN"] },
  { id: "notif-004", title: "SaaS Onboarding Steer Committee Decision Required", type: "REMINDER", content: "Soliam Pension Scheme SaaS requires signed Data Processing Appendix (DPA) to clear Go-Live block.", date: "2026-06-10", read: false, targetRoles: ["PRODUCT_OWNER", "COMPLIANCE_OFFICER"] }
];

export const MOCK_AUDIT_TRAILS: AuditTrail[] = [
  { id: "trail-001", timestamp: "2026-06-10T14:12:05Z", user: "Fayez Tekitek", role: "ADMIN", action: "USER_LOGIN", module: "AUTH", status: "SUCCESS", ipAddress: "192.168.1.102", detailCode: "Session JWT issued." },
  { id: "trail-002", timestamp: "2026-06-10T12:01:44Z", user: "Thomas Lemaire", role: "SECURITY_MANAGER", action: "FALSE_POSITIVE_FLAG", module: "VULNERABILITY", status: "SUCCESS", ipAddress: "10.0.4.15", detailCode: "Marked VULN-2026-011 as FP: Outgo Sandbox Isolation verification." },
  { id: "trail-003", timestamp: "2026-06-09T18:22:10Z", user: "Amandine Rousset", role: "COMPLIANCE_OFFICER", action: "CONTRACT_COMPLIANCE_UPDATE", module: "CONTRACTS", status: "SUCCESS", ipAddress: "192.168.1.55", detailCode: "Conformed OBL-2026-003 backup restore simulation report." },
  { id: "trail-004", timestamp: "2026-06-08T15:05:01Z", user: "Marc-Antoine Dubois", role: "RISK_MANAGER", action: "RISK_ACCEPTANCE_APPROVE", module: "VULNERABILITY", status: "SUCCESS", ipAddress: "10.0.12.92", detailCode: "Approved RA-2026-004 API Gateway auth bypass contingency." },
  { id: "trail-005", timestamp: "2026-06-03T11:45:00Z", user: "Sarah Laroche", role: "PRODUCT_OWNER", action: "VEG_CREATE_REQUEST", module: "VEG", status: "SUCCESS", ipAddress: "192.168.12.18", detailCode: "Created Zurich life insurance sandbox request: ACC-ZLI-102." }
];
