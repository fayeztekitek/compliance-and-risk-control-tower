import { z } from "zod";

export const mitigationSchema = z.object({
  mitigationType: z.enum(["FIX", "UPGRADE", "PATCH", "WORKAROUND", "ACCEPT"]),
  targetComponentVersion: z.string().optional(),
  targetRelease: z.string().optional(),
  owner: z.string().optional(),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});
export type MitigationForm = z.infer<typeof mitigationSchema>;

export const waiverSchema = z.object({
  vulnerabilityId: z.string().min(1, "Vulnerability ID is required"),
  title: z.string().min(1, "Title is required"),
  rationale: z.string().min(1, "Rationale is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});
export type WaiverForm = z.infer<typeof waiverSchema>;

export const vegDealSchema = z.object({
  vegId: z.string().min(1, "VEG ID is required"),
  client: z.string().min(1, "Client is required"),
  businessOwner: z.string().optional().default(""),
  region: z.string(),
  businessLine: z.string(),
  products: z.string().optional().default(""),
  committeeType: z.string(),
  vegDate: z.string().optional().default(""),
  decision: z.string(),
  tcv: z.number(),
  ipMaintenance: z.number(),
  saas: z.number(),
  ps: z.number(),
  wlPsMd: z.number(),
  wlInvestmentMd: z.number(),
  vegYear: z.number(),
});
export type VegDealForm = z.infer<typeof vegDealSchema>;

export const vegWfSchema = z.object({
  title: z.string().min(1, "Title is required"),
  client: z.string().min(1, "Client is required"),
  type: z.enum(["RFI", "RFP", "NEW_CLIENT_REQUEST", "BD_REQUEST", "ACC_CODE_CREATION", "BID_COMMITTEE_OVERSIGHT"]),
  description: z.string().optional().default(""),
  ownerId: z.string().optional().default(""),
});
export type VegWfForm = z.infer<typeof vegWfSchema>;

export const vulnFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  severity: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  sourceScanner: z.string(),
  slaDueDate: z.string().optional().default(""),
  targetProduct: z.string().optional().default(""),
  owner: z.string().optional().default(""),
});
export type VulnForm = z.infer<typeof vulnFormSchema>;

export const oppFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.number().min(0),
  salesStage: z.enum(["PROSPECTING", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"]),
});
export type OppForm = z.infer<typeof oppFormSchema>;

export const contractFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  startDate: z.string().optional().default(""),
  endDate: z.string().optional().default(""),
  slaCommitments: z.string().optional().default(""),
  complianceStatus: z.string(),
  maintenanceSaaS: z.boolean(),
});
export type ContractForm = z.infer<typeof contractFormSchema>;

export const riskAcceptanceSchema = z.object({
  vulnerabilityId: z.string().min(1, "Vulnerability ID is required"),
  title: z.string().min(1, "Title is required"),
  businessImpact: z.string().min(1, "Business impact is required"),
  mitigationPlan: z.string().min(1, "Mitigation plan is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});
export type RiskAcceptanceForm = z.infer<typeof riskAcceptanceSchema>;
