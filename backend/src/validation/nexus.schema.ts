import { z } from "zod";

export const businessCriticalityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
export const productGradeEnum = z.enum(["RED", "ORANGE", "GREEN"]);
export const scanStageEnum = z.enum(["develop", "build", "release", "operate"]);
export const reachabilityEnum = z.enum(["REACHABLE", "NOT_REACHABLE", "UNKNOWN"]);
export const exploitabilityEnum = z.enum(["EASY", "MEDIUM", "HARD", "THEORETICAL"]);
export const nexusVulnStatusEnum = z.enum(["Open", "Fixed", "Accepted", "Waived", "False Positive"]);
export const nexusWaiverStatusEnum = z.enum(["active", "expired", "stale"]);
export const syncStatusEnum = z.enum(["SUCCESS", "FAILED", "WARNING", "IN_PROGRESS"]);

export const nexusConfigSchema = z.object({
  url: z.string().url(),
  username: z.string().min(1),
  token: z.string().min(1),
  timeoutMs: z.number().int().positive().default(5000),
  maxRetries: z.number().int().positive().max(10).default(3),
});

export const nexusConfigUpdateSchema = z.object({
  url: z.string().url().optional(),
  username: z.string().min(1).optional(),
  token: z.string().min(1).optional(),
  timeoutMs: z.number().int().positive().optional(),
  maxRetries: z.number().int().positive().max(10).optional(),
  isActive: z.boolean().optional(),
});

export const nexusQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  severity: z.string().optional(),
  status: z.string().optional(),
  productId: z.string().optional(),
  applicationId: z.string().optional(),
});

export const createNexusWaiverSchema = z.object({
  violationId: z.string().min(1),
  reason: z.string().min(1).max(2000),
  requester: z.string().optional(),
  expirationDate: z.string().optional(),
  productId: z.string().min(1),
  applicationId: z.string().min(1),
  componentName: z.string().optional(),
  riskAcceptanceComment: z.string().optional(),
});

export const triggerSyncSchema = z.object({
  mode: z.enum(["full", "incremental"]).default("full"),
  targetUrl: z.string().optional(),
});
