import { z } from "zod";

// ========== Projects ==========
export const projectStatusEnum = z.enum(["ON_TRACK", "DEVIATING", "HIGH_RISK"]);
export const goLiveEnum = z.enum(["READY", "RISKY", "BLOCKED"]);

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  manager: z.string().max(255).optional(),
  initialBudget: z.number().nonnegative().optional(),
  roadmapId: z.string().uuid().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  manager: z.string().max(255).optional(),
  status: projectStatusEnum.optional(),
  consumedBudget: z.number().nonnegative().optional(),
  slippageMd: z.number().nonnegative().optional(),
  testAutomationRate: z.number().min(0).max(100).optional(),
  goLiveReadinessState: goLiveEnum.optional(),
});

export const submitRtdSchema = z.object({
  reviewMonth: z.string().regex(/^\d{4}-\d{2}$/),
  declaredRtd: z.number().nonnegative(),
  actualConsumed: z.number().nonnegative(),
  comments: z.string().optional(),
  submittedBy: z.string().optional(),
});

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.string().optional(),
  search: z.string().optional(),
});

// ========== Roadmaps ==========
export const roadmapTypeEnum = z.enum(["STRATEGIC", "BUDGETARY", "REGULATORY"]);
export const milestoneStatusEnum = z.enum(["ON_TIME", "DELAYED", "CRITICAL"]);

export const createRoadmapSchema = z.object({
  name: z.string().min(1).max(255),
  type: roadmapTypeEnum,
  targetDate: z.string(),
  leadOwner: z.string().max(255).optional(),
});

export const updateRoadmapSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  progress: z.number().min(0).max(100).optional(),
  milestoneStatus: milestoneStatusEnum.optional(),
  targetDate: z.string().optional(),
  leadOwner: z.string().optional(),
});

// ========== SaaS Applications ==========
export const lifecycleStageEnum = z.enum(["ONBOARDING", "GO_LIVE", "OFFBOARDING"]);
export const gdprRiskEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);
export const privacyStatusEnum = z.enum(["COMPLIANT", "PENDING", "NON_COMPLIANT"]);

export const createSaaSAppSchema = z.object({
  name: z.string().min(1).max(255),
  dataCategory: z.enum(["PII_SENSITIVE", "PII_COMMON", "NON_PII"]).optional(),
  gdprRiskImpact: gdprRiskEnum.optional(),
  owner: z.string().optional(),
});

export const updateSaaSAppSchema = z.object({
  name: z.string().optional(),
  lifecycleStage: lifecycleStageEnum.optional(),
  privacyDesignStatus: privacyStatusEnum.optional(),
  steeringCheckPassed: z.boolean().optional(),
});

export const privacyAssessmentSchema = z.object({
  gdprReady: z.boolean().optional(),
  dataProtectionOfficerReview: z.boolean().optional(),
  commitments: z.string().optional(),
  dataProcessingObjective: z.string().optional(),
  checklist: z.array(z.any()).optional(),
});

// ========== Audits ==========
export const auditTypeEnum = z.enum(["SAAS_CONTRACTUAL", "ACCESS_AUDIT", "BACKUP_DRP", "VULNERABILITY", "ENCRYPTION", "STAFF_REVIEW"]);
export const auditStatusEnum = z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED"]);
export const findingSeverityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

export const createAuditSchema = z.object({
  title: z.string().min(1).max(255),
  type: auditTypeEnum,
  date: z.string().optional(),
  leadAuditor: z.string().optional(),
});

export const updateAuditSchema = z.object({
  title: z.string().optional(),
  status: auditStatusEnum.optional(),
  leadAuditor: z.string().optional(),
});

export const createFindingSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  severity: findingSeverityEnum,
  targetEntity: z.string().optional(),
});

export const createCorrectiveActionSchema = z.object({
  description: z.string().min(1),
  owner: z.string().optional(),
  dueDate: z.string(),
});

export const closeCorrectiveActionSchema = z.object({
  evidenceDescription: z.string().min(1),
});

// ========== Committees ==========
export const committeeTypeEnum = z.enum(["VEG_COMMITTEE", "VULNERABILITY_COMMITTEE", "SAAS_STEERING", "EXECUTIVE_SECURITY", "EXECUTIVE_ARBITRATION"]);
export const committeeStatusEnum = z.enum(["PLANNED", "HELD", "CANCELLED"]);
export const decisionOutcomeEnum = z.enum(["APPROVED", "REJECTED", "DEFERRED"]);

export const listCommitteeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createCommitteeSchema = z.object({
  name: z.string().min(1).max(255),
  date: z.string(),
  time: z.string().optional(),
  type: committeeTypeEnum,
  participants: z.array(z.string()).optional(),
  agenda: z.array(z.string()).optional(),
});

export const updateCommitteeSchema = z.object({
  name: z.string().optional(),
  status: committeeStatusEnum.optional(),
  minutes: z.string().optional(),
  participants: z.array(z.string()).optional(),
  agenda: z.array(z.string()).optional(),
});

export const recordDecisionSchema = z.object({
  title: z.string().min(1).max(255),
  context: z.string().optional(),
  outcome: decisionOutcomeEnum,
  owner: z.string().optional(),
  comments: z.string().optional(),
});

// ========== Contractual Obligations ==========
export const complianceStatusEnum = z.enum(["COMPLIANT", "NON_COMPLIANT", "WARNING"]);
export const frequencyEnum = z.enum(["MONTHLY", "QUARTERLY", "SEMI_ANNUALLY", "ANNUALLY"]);

export const createContractObligationSchema = z.object({
  title: z.string().min(1).max(255),
  sourceContract: z.string().optional(),
  requirement: z.string().min(1),
  frequency: frequencyEnum.optional(),
});

export const verifyObligationSchema = z.object({
  status: complianceStatusEnum,
  verifiedBy: z.string().optional(),
});
