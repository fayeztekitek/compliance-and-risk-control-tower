import { z } from "zod";

const vegRequestType = z.enum(["RFI", "RFP", "NEW_CLIENT_REQUEST", "BD_REQUEST", "ACC_CODE_CREATION", "BID_COMMITTEE_OVERSIGHT"]);
const vegStatus = z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CONTRACT_SIGNATURE"]);
const departmentState = z.enum(["PENDING", "APPROVED", "REJECTED"]);
const bidDecision = z.enum(["BID", "NO_BID", "PENDING"]);
const goNogo = z.enum(["GO", "NO_GO", "PENDING"]);

export const createVegSchema = z.object({
  title: z.string().min(3).max(255),
  type: vegRequestType,
  client: z.string().min(1).max(255),
  marginEstimate: z.number().min(0).max(100).optional(),
  workloadMd: z.number().int().positive().optional(),
  codeAcc: z.string().max(50).optional(),
  ownerId: z.string().uuid().optional(),
  date: z.string().optional(),
});

export const updateVegSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  type: vegRequestType.optional(),
  client: z.string().min(1).max(255).optional(),
  marginEstimate: z.number().min(0).max(100).optional(),
  workloadMd: z.number().int().positive().optional(),
  codeAcc: z.string().max(50).optional(),
  status: vegStatus.optional(),
});

export const departmentSignoffSchema = z.object({
  department: z.enum(["finance", "sales", "product", "legal"]),
  state: departmentState,
});

export const bidDecisionSchema = z.object({
  decision: bidDecision,
});

export const goNogoSchema = z.object({
  decision: goNogo,
});

export const listVegQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: vegStatus.optional(),
  type: vegRequestType.optional(),
  client: z.string().optional(),
  search: z.string().optional(),
});

export const batchSyncSchema = z.object({
  requests: z.array(z.object({
    id: z.string().optional(),
    title: z.string().min(1),
    type: vegRequestType,
    client: z.string().min(1),
    marginEstimate: z.number().optional(),
    workloadMd: z.number().optional(),
    status: vegStatus.optional(),
  })),
});

export const createOpportunitySchema = z.object({
  name: z.string().min(1).max(255),
  value: z.number().nonnegative().optional(),
  salesStage: z.enum(["PROSPECTING", "QUALIFICATION", "BID_PREPARATION", "PROPOSAL_SUBMITTED", "NEGOTIATION", "WON", "LOST"]).optional(),
});

export const createContractSchema = z.object({
  title: z.string().min(1).max(255),
  opportunityId: z.string().uuid().optional(),
  startDate: z.string(),
  endDate: z.string(),
  slaCommitments: z.string().optional(),
  complianceStatus: z.enum(["COMPLIANT", "NON_COMPLIANT", "WARNING"]).optional(),
  maintenanceSaaS: z.boolean().optional(),
});
