import { z } from "zod";

export const severityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
export const vulnStatusEnum = z.enum(["OPEN", "FALSE_POSITIVE", "WAIVED", "REMEDIATED"]);
export const scannerEnum = z.enum(["VERACODE", "NEXPOSE", "PEN_TEST"]);
export const waiverStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]);
export const raStatusEnum = z.enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED"]);
export const slaIncidentStatusEnum = z.enum(["OPEN", "BREACHED", "RESOLVED"]);

export const createVulnerabilitySchema = z.object({
  title: z.string().min(1).max(500),
  severity: severityEnum,
  sourceScanner: scannerEnum,
  detectedDate: z.string().optional(),
  slaDueDate: z.string(),
  targetProduct: z.string().max(255).optional(),
  owner: z.string().max(255).optional(),
});

export const updateVulnerabilitySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  severity: severityEnum.optional(),
  status: vulnStatusEnum.optional(),
  remediatedDate: z.string().optional(),
  targetProduct: z.string().max(255).optional(),
  owner: z.string().max(255).optional(),
});

export const listVulnerabilityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  severity: z.string().optional(),
  status: z.string().optional(),
  scanner: z.string().optional(),
  product: z.string().optional(),
  search: z.string().optional(),
});

export const falsePositiveSchema = z.object({
  explanation: z.string().min(10, "Explanation must be at least 10 characters"),
});

export const createWaiverSchema = z.object({
  vulnerabilityId: z.string().uuid(),
  title: z.string().min(1).max(255),
  rationale: z.string().min(1),
  expiryDate: z.string(),
});

export const createRiskAcceptanceSchema = z.object({
  vulnerabilityId: z.string().uuid(),
  title: z.string().min(1).max(255),
  businessImpact: z.string().min(1),
  mitigationPlan: z.string().min(1),
  expiryDate: z.string(),
});

export const createSlaIncidentSchema = z.object({
  title: z.string().min(1).max(255),
  contractId: z.string().optional(),
  projectName: z.string().optional(),
  breachTime: z.string(),
  maxAllowedResolutionHours: z.number().int().positive(),
  actualDurationHours: z.number().nonnegative().optional(),
  penaltyCost: z.number().nonnegative().optional(),
  status: slaIncidentStatusEnum.optional(),
});
