import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contractFormSchema, oppFormSchema } from "../../schemas/forms";
import type { ContractForm, OppForm } from "../../schemas/forms";
import { ChevronLeft, Send, CheckCircle, XCircle, FileSignature, BarChart3, Activity, TrendingUp, Plus, ThumbsUp, ThumbsDown } from "lucide-react";
import { TypeBadge, StatusBadge, DeptSignoffBadge } from "../ui/Badge";
import { fmtNum } from "../../utils/veg";
import type { VegRequest } from "../../types/veg";

interface Props {
  detail: VegRequest;
  onBack: () => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string) => void;
  onSignoff: (dept: string, state: string) => Promise<void>;
  onBid: (decision: string) => Promise<void>;
  onGoNoGo: (decision: string) => Promise<void>;
  onCreateOpp: (data: OppForm) => Promise<void>;
  onCreateContract: (oppId: string, data: ContractForm) => Promise<void>;
  isCreatingOpp: boolean;
  isCreatingContract: boolean;
}

export default function VegWorkflowDetailView({ detail, onBack, onDelete, onSubmit, onSignoff, onBid, onGoNoGo, onCreateOpp, onCreateContract, isCreatingOpp, isCreatingContract }: Props) {
  const [expandedOpp, setExpandedOpp] = useState<string | null>(null);
  const opportunities = detail.opportunities || [];

  const oppFormHook = useForm<OppForm>({ resolver: zodResolver(oppFormSchema), defaultValues: { name: "", value: 0, salesStage: "PROSPECTING" } });
  const { register: oppReg, handleSubmit: oppHandleSubmit, reset: oppReset } = oppFormHook;

  const contractFormHook = useForm<ContractForm>({ resolver: zodResolver(contractFormSchema), defaultValues: { title: "", startDate: "", endDate: "", slaCommitments: "", complianceStatus: "COMPLIANT", maintenanceSaaS: false } });
  const { register: contractReg, handleSubmit: contractHandleSubmit, reset: contractReset } = contractFormHook;

  async function handleCreateOpp(data: OppForm) {
    await onCreateOpp(data);
    oppReset();
  }

  async function handleCreateContract(oppId: string, data: ContractForm) {
    await onCreateContract(oppId, data);
    contractReset();
    setExpandedOpp(null);
  }

  const statuses = ["DRAFT", "SUBMITTED", "APPROVED", "CONTRACT_SIGNATURE"];
  const currentIdx = statuses.indexOf(detail.status);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="w-4 h-4" /> Back to workflow list
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <TypeBadge type={detail.type} />
              <StatusBadge status={detail.status} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{detail.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{detail.client} · {new Date(detail.date).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            {detail.status === "DRAFT" && (
              <button onClick={() => onSubmit(detail.id)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                <Send className="w-4 h-4" /> Submit
              </button>
            )}
            <button onClick={() => onDelete(detail.id)} className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">Delete</button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Status Timeline</h3>
          <div className="flex items-center gap-2 text-sm flex-wrap">
            {statuses.map((s, i) => {
              const isComplete = i <= currentIdx;
              const isCurrent = i === currentIdx && detail.status !== "REJECTED";
              const isRejected = detail.status === "REJECTED";
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                    isRejected && s === "SUBMITTED" ? "bg-red-100 text-red-700" :
                    isCurrent ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300" :
                    isComplete ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"
                  }`}>
                    {isComplete && !isCurrent ? <CheckCircle className="w-3 h-3" /> : null}
                    {s.replace(/_/g, " ")}
                  </div>
                  {i < statuses.length - 1 && (
                    <div className={`w-6 h-px ${isComplete && i < currentIdx ? "bg-green-400" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
            {detail.status === "REJECTED" && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <XCircle className="w-3 h-3" /> REJECTED
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-indigo-500" /> Department Sign-offs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "finance", label: "Finance", state: detail.financeState },
            { key: "sales", label: "Sales", state: detail.salesState },
            { key: "product", label: "Product", state: detail.productState },
            { key: "legal", label: "Legal", state: detail.legalState },
          ].map((dept) => (
            <div key={dept.key} className={`border rounded-lg p-4 ${
              dept.state === "APPROVED" ? "border-green-200 bg-green-50" :
              dept.state === "REJECTED" ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-slate-700">{dept.label}</h4>
                <DeptSignoffBadge state={dept.state} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => onSignoff(dept.key, "APPROVED")}
                  disabled={dept.state === "APPROVED" || detail.status !== "SUBMITTED"}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ThumbsUp className="w-3 h-3" /> Approve
                </button>
                <button onClick={() => onSignoff(dept.key, "REJECTED")}
                  disabled={dept.state === "REJECTED" || detail.status !== "SUBMITTED"}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed">
                  <ThumbsDown className="w-3 h-3" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-500" /> Bid Decision
        </h3>
        <div className="flex gap-3">
          {["BID", "NO_BID"].map((opt) => (
            <button key={opt} onClick={() => onBid(opt)}
              disabled={detail.bidDecision === opt || detail.status === "DRAFT"}
              className={`px-5 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                detail.bidDecision === opt
                  ? opt === "BID" ? "border-green-500 bg-green-50 text-green-700" : "border-red-500 bg-red-50 text-red-700"
                  : "border-slate-200 text-slate-600 hover:border-green-300 disabled:opacity-40"
              }`}>
              {opt === "BID" ? <><ThumbsUp className="w-4 h-4 inline mr-1" /> BID</> : <><ThumbsDown className="w-4 h-4 inline mr-1" /> NO BID</>}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" /> Go / No-Go Decision
        </h3>
        <div className="flex gap-3">
          {["GO", "NO_GO"].map((opt) => (
            <button key={opt} onClick={() => onGoNoGo(opt)}
              disabled={detail.goNoGoDecision === opt || detail.status === "DRAFT"}
              className={`px-5 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                detail.goNoGoDecision === opt
                  ? opt === "GO" ? "border-green-500 bg-green-50 text-green-700" : "border-red-500 bg-red-50 text-red-700"
                  : "border-slate-200 text-slate-600 hover:border-green-300 disabled:opacity-40"
              }`}>
              {opt === "GO" ? <><CheckCircle className="w-4 h-4 inline mr-1" /> GO</> : <><XCircle className="w-4 h-4 inline mr-1" /> NO GO</>}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> Opportunities ({opportunities.length})
          </h3>
        </div>

        {detail.status !== "DRAFT" && (
          <form onSubmit={oppHandleSubmit(handleCreateOpp)} className="grid grid-cols-4 gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
            <input type="text" placeholder="Opportunity name" {...oppReg("name")} className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
            <input type="number" placeholder="Value (K€)" {...oppReg("value")} className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
            <select {...oppReg("salesStage")} className="px-3 py-1.5 rounded border border-slate-300 text-sm">
              <option value="PROSPECTING">Prospecting</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="CLOSED_WON">Closed Won</option>
              <option value="CLOSED_LOST">Closed Lost</option>
            </select>
            <button type="submit" disabled={isCreatingOpp} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50">Save</button>
          </form>
        )}

        {opportunities.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No opportunities yet. {detail.status !== "DRAFT" && "Add one above."}</p>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <div key={opp.id} className="border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50"
                  onClick={() => setExpandedOpp(expandedOpp === opp.id ? null : opp.id)}>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{opp.name}</p>
                    <p className="text-xs text-slate-500">Value: {fmtNum(opp.value)} · Stage: {opp.sales_stage.replace(/_/g, " ")}{opp.contract_signed ? " · ✅ Contract signed" : ""}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${opp.contract_signed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {opp.contract_signed ? "Signed" : "Pending"}
                  </span>
                </div>

                {expandedOpp === opp.id && (
                  <div className="border-t border-slate-100 p-4 bg-slate-50">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Contracts ({(opp.contracts || []).length})</h4>
                    {(opp.contracts || []).length === 0 ? <p className="text-xs text-slate-400 mb-3">No contracts yet</p> : (
                      <div className="space-y-2 mb-3">
                        {opp.contracts?.map((ctr) => (
                          <div key={ctr.id} className="bg-white rounded-lg border border-slate-200 p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-slate-800">{ctr.title}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${ctr.compliance_status === "COMPLIANT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{ctr.compliance_status}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{new Date(ctr.start_date).toLocaleDateString()} — {new Date(ctr.end_date).toLocaleDateString()}{ctr.maintenance_saas ? " · Maintenance/SaaS" : ""}</p>
                            {ctr.sla_commitments && <p className="text-xs text-slate-400 mt-1">SLA: {ctr.sla_commitments}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    <form onSubmit={contractHandleSubmit((data) => handleCreateContract(opp.id, data))}>
                      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
                        <div className="col-span-2">
                          <input type="text" placeholder="Contract title" {...contractReg("title")} className="w-full px-3 py-1.5 rounded border border-slate-300 text-sm" />
                        </div>
                        <input type="date" {...contractReg("startDate")} className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
                        <input type="date" {...contractReg("endDate")} className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
                        <button type="submit" disabled={isCreatingContract} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50">Add Contract</button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
