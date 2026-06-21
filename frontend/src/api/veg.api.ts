import { apiClient } from "../api/client";

export interface VegRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  type: "RFI" | "RFP" | "NEW_CLIENT_REQUEST" | "BD_REQUEST" | "ACC_CODE_CREATION" | "BID_COMMITTEE_OVERSIGHT";
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CONTRACT_SIGNATURE";
  client: string;
  marginEstimate: number | null;
  workloadMd: number | null;
  codeAcc: string | null;
  bidDecision: string;
  goNoGoDecision: string;
  financeState: string;
  salesState: string;
  productState: string;
  legalState: string;
  ownerId: string | null;
  date: string;
  opportunities?: Opportunity[];
}

export interface Opportunity {
  id: string;
  veg_request_id: string;
  name: string;
  value: number;
  sales_stage: string;
  contract_signed: boolean;
  contracts?: Contract[];
}

export interface Contract {
  id: string;
  opportunity_id: string;
  title: string;
  start_date: string;
  end_date: string;
  sla_commitments: string | null;
  compliance_status: string;
  maintenance_saas: boolean;
}

export interface VegListParams {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  client?: string;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const vegApi = {
  list(params?: VegListParams) {
    return apiClient.get<PaginatedResponse<VegRequest>>("/api/veg", { params });
  },

  getById(id: string) {
    return apiClient.get<{ data: VegRequest }>(`/api/veg/${id}`);
  },

  create(data: Partial<VegRequest>) {
    return apiClient.post<{ data: VegRequest }>("/api/veg", data);
  },

  update(id: string, data: Partial<VegRequest>) {
    return apiClient.patch<{ data: VegRequest }>(`/api/veg/${id}`, data);
  },

  delete(id: string) {
    return apiClient.delete<{ data: { success: boolean } }>(`/api/veg/${id}`);
  },

  signoff(id: string, department: string, state: string) {
    return apiClient.patch<{ data: VegRequest }>(`/api/veg/${id}/signoff/${department}`, { state });
  },

  bidDecision(id: string, decision: string) {
    return apiClient.patch<{ data: VegRequest }>(`/api/veg/${id}/bid`, { decision });
  },

  goNoGo(id: string, decision: string) {
    return apiClient.patch<{ data: VegRequest }>(`/api/veg/${id}/gonogo`, { decision });
  },

  batchSync(requests: Partial<VegRequest>[]) {
    return apiClient.post<{ data: { synced: number; requests: VegRequest[] } }>("/api/veg/batch-sync", { requests });
  },

  createOpportunity(vegId: string, data: Partial<Opportunity>) {
    return apiClient.post<{ data: Opportunity }>(`/api/veg/${vegId}/opportunities`, data);
  },

  createContract(opportunityId: string, data: Partial<Contract>) {
    return apiClient.post<{ data: Contract }>(`/api/veg/opportunities/${opportunityId}/contracts`, data);
  },
};
