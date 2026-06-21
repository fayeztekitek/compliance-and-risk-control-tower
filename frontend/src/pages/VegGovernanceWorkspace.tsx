import { useState } from "react";
import {
  Plus, Search, ChevronLeft, FileText, CheckCircle, XCircle,
  Clock, Briefcase, TrendingUp, DollarSign, AlertTriangle,
  BarChart3, Users, ThumbsUp, ThumbsDown,
} from "lucide-react";
import { useVegList, useVegById, useCreateVeg, useUpdateVeg, useDeleteVeg, useSignoffVeg, useBidDecision, useGoNoGo, useCreateOpportunity, useCreateContract } from "../hooks/useVegRequests";
import type { VegRequest } from "../api/veg.api";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonTable } from "../components/ui/Skeleton";

type ViewMode = "list" | "detail" | "create" | "edit";
type VegType = "RFI" | "RFP" | "NEW_CLIENT_REQUEST" | "BD_REQUEST" | "ACC_CODE_CREATION" | "BID_COMMITTEE_OVERSIGHT";
type VegStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CONTRACT_SIGNATURE";

const VEG_TYPES: VegType[] = ["RFI", "RFP", "NEW_CLIENT_REQUEST", "BD_REQUEST", "ACC_CODE_CREATION", "BID_COMMITTEE_OVERSIGHT"];
const VEG_STATUSES: VegStatus[] = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "CONTRACT_SIGNATURE"];

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CONTRACT_SIGNATURE: "bg-indigo-100 text-indigo-700",
};

const DEPT_LABELS: Record<string, string> = { finance: "Finance", sales: "Sales", product: "Product", legal: "Legal" };

export default function VegGovernanceWorkspace() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data: listData, isLoading } = useVegList({ page, limit: 20, search, status: statusFilter || undefined, type: typeFilter || undefined });
  const { data: detail } = useVegById(selectedId);
  const createVeg = useCreateVeg();
  const updateVeg = useUpdateVeg();
  const deleteVeg = useDeleteVeg();
  const signoff = useSignoffVeg();
  const bid = useBidDecision();
  const gonogo = useGoNoGo();
  const createOpp = useCreateOpportunity();
  const createContr = useCreateContract();

  const [form, setForm] = useState<Partial<VegRequest>>({ title: "", type: "RFI", client: "", marginEstimate: null, workloadMd: null, codeAcc: "" });
  const [oppForm, setOppForm] = useState({ name: "", value: 0, salesStage: "PROSPECTING" });
  const [contractForm, setContractForm] = useState({ title: "", startDate: "", endDate: "", slaCommitments: "", complianceStatus: "COMPLIANT", maintenanceSaaS: false });

  const resetForm = () => setForm({ title: "", type: "RFI", client: "", marginEstimate: null, workloadMd: null, codeAcc: "" });

  function handleSelect(id: string) { setSelectedId(id); setMode("detail"); }

  function handleBack() {
    setMode("list");
    setSelectedId(null);
    resetForm();
  }

  async function handleCreate() {
    await createVeg.mutateAsync(form);
    handleBack();
  }

  async function handleUpdate() {
    if (!selectedId) return;
    await updateVeg.mutateAsync({ id: selectedId, data: form });
    handleBack();
  }

  async function handleDelete(id: string) {
    await deleteVeg.mutateAsync(id);
    if (selectedId === id) handleBack();
  }

  async function handleSignoff(department: string, state: string) {
    if (!selectedId) return;
    await signoff.mutateAsync({ id: selectedId, department, state });
  }

  async function handleBid(decision: string) {
    if (!selectedId) return;
    await bid.mutateAsync({ id: selectedId, decision });
  }

  async function handleGoNoGo(decision: string) {
    if (!selectedId) return;
    await gonogo.mutateAsync({ id: selectedId, decision });
  }

  async function handleAddOpp() {
    if (!selectedId) return;
    await createOpp.mutateAsync({ vegId: selectedId, data: oppForm });
    setOppForm({ name: "", value: 0, salesStage: "PROSPECTING" });
  }

  async function handleAddContract(oppId: string) {
    await createContr.mutateAsync({ opportunityId: oppId, data: contractForm });
    setContractForm({ title: "", startDate: "", endDate: "", slaCommitments: "", complianceStatus: "COMPLIANT", maintenanceSaaS: false });
  }

  // -------- LIST VIEW --------
  if (mode === "list") {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">VEG Governance</h2>
            <p className="text-sm text-slate-500 mt-1">Manage Vetting & Entry Gate requests, approvals, and contracts</p>
          </div>
          <button
            onClick={() => { resetForm(); setMode("create"); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New VEG Request
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder="Search by title or client..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
            <option value="">All Statuses</option>
            {VEG_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
            <option value="">All Types</option>
            {VEG_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <SkeletonTable rows={5} />
          </div>
        ) : (
          <>
            {(!listData?.data || listData.data.length === 0) ? (
              <EmptyState
                icon={Briefcase}
                title="No VEG requests"
                description="Create your first VEG request to get started."
                action={{ label: "New VEG Request", onClick: () => { resetForm(); setMode("create"); } }}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Type</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Client</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Date</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(listData?.data ?? []).map((veg) => (
                      <tr key={veg.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => handleSelect(veg.id)}>
                        <td className="px-4 py-3 font-medium text-slate-800">{veg.title}</td>
                        <td className="px-4 py-3 text-slate-600">{veg.type.replace(/_/g, " ")}</td>
                        <td className="px-4 py-3 text-slate-600">{veg.client}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[veg.status]}`}>
                            {veg.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(veg.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(veg.id); }}
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {listData && listData.total > listData.limit && (
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Showing {((listData.page - 1) * listData.limit) + 1}–{Math.min(listData.page * listData.limit, listData.total)} of {listData.total}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50">Prev</button>
                  <button disabled={page >= Math.ceil(listData.total / listData.limit)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // -------- CREATE / EDIT FORM --------
  if (mode === "create" || mode === "edit") {
    return (
      <div className="space-y-6 max-w-2xl">
        <button onClick={handleBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-2xl font-bold text-slate-800">{mode === "create" ? "New VEG Request" : "Edit VEG Request"}</h2>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input type="text" value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select value={form.type || "RFI"} onChange={e => setForm(f => ({ ...f, type: e.target.value as VegType }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                {VEG_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
              <input type="text" value={form.client || ""} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Margin Estimate (%)</label>
              <input type="number" min="0" max="100" value={form.marginEstimate ?? ""} onChange={e => setForm(f => ({ ...f, marginEstimate: e.target.value ? Number(e.target.value) : null }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Workload (man-days)</label>
              <input type="number" min="1" value={form.workloadMd ?? ""} onChange={e => setForm(f => ({ ...f, workloadMd: e.target.value ? Number(e.target.value) : null }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ACC Code</label>
            <input type="text" value={form.codeAcc || ""} onChange={e => setForm(f => ({ ...f, codeAcc: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={mode === "create" ? handleCreate : handleUpdate} disabled={createVeg.isPending || updateVeg.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
              {mode === "create" ? "Create Request" : "Update Request"}
            </button>
            <button onClick={handleBack} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // -------- DETAIL VIEW --------
  if (mode === "detail" && detail) {
    const isApproved = detail.financeState === "APPROVED" && detail.salesState === "APPROVED" && detail.productState === "APPROVED" && detail.legalState === "APPROVED";

    return (
      <div className="space-y-6">
        <button onClick={handleBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Back to list
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-slate-800">{detail.title}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[detail.status]}`}>
                  {detail.status.replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm text-slate-500">{detail.client} · {detail.type.replace(/_/g, " ")} · {new Date(detail.date).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setForm({ title: detail.title, type: detail.type as VegType, client: detail.client, marginEstimate: detail.marginEstimate, workloadMd: detail.workloadMd, codeAcc: detail.codeAcc }); setMode("edit"); }}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
              >
                Edit
              </button>
              <button onClick={() => handleDelete(detail.id)} className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">Delete</button>
            </div>
          </div>

          {detail.marginEstimate !== null && (
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-slate-600">Margin: <strong>{detail.marginEstimate}%</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="text-slate-600">Workload: <strong>{detail.workloadMd} md</strong></span>
              </div>
              {detail.codeAcc && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span className="text-slate-600">ACC: <strong>{detail.codeAcc}</strong></span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Department Sign-Offs */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" /> Department Sign-Offs
            {isApproved && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">All Approved</span>}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {(["finance", "sales", "product", "legal"] as const).map((dept) => {
              const state = detail[`${dept}State` as keyof VegRequest] as string;
              return (
                <div key={dept} className={`p-4 rounded-lg border ${state === "APPROVED" ? "border-green-200 bg-green-50" : state === "REJECTED" ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">{DEPT_LABELS[dept]}</span>
                    {state === "APPROVED" ? <CheckCircle className="w-5 h-5 text-green-500" /> : state === "REJECTED" ? <XCircle className="w-5 h-5 text-red-500" /> : <Clock className="w-5 h-5 text-slate-400" />}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">Status: {state}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleSignoff(dept, "APPROVED")} className="flex-1 px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 font-medium">Approve</button>
                    <button onClick={() => handleSignoff(dept, "REJECTED")} className="flex-1 px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 font-medium">Reject</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bid & Go/No-Go */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5" /> Bid Decision
            </h3>
            <p className="text-sm text-slate-600 mb-3">Current: <strong>{detail.bidDecision}</strong></p>
            <div className="flex gap-2">
              <button onClick={() => handleBid("BID")} className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium">Bid</button>
              <button onClick={() => handleBid("NO_BID")} className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium">No Bid</button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Go / No-Go
            </h3>
            <p className="text-sm text-slate-600 mb-3">Current: <strong>{detail.goNoGoDecision}</strong></p>
            <div className="flex gap-2">
              <button onClick={() => handleGoNoGo("GO")} className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium">Go</button>
              <button onClick={() => handleGoNoGo("NO_GO")} className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium">No Go</button>
            </div>
          </div>
        </div>

        {/* Opportunities */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5" /> Opportunities
          </h3>

          {/* Add Opportunity Form */}
          <div className="flex gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
            <input type="text" placeholder="Opportunity name" value={oppForm.name} onChange={e => setOppForm(f => ({ ...f, name: e.target.value }))}
              className="flex-1 px-3 py-1.5 rounded border border-slate-300 text-sm" />
            <input type="number" placeholder="Value" value={oppForm.value || ""} onChange={e => setOppForm(f => ({ ...f, value: Number(e.target.value) }))}
              className="w-24 px-3 py-1.5 rounded border border-slate-300 text-sm" />
            <select value={oppForm.salesStage} onChange={e => setOppForm(f => ({ ...f, salesStage: e.target.value }))} className="px-3 py-1.5 rounded border border-slate-300 text-sm">
              <option value="PROSPECTING">Prospecting</option>
              <option value="QUALIFICATION">Qualification</option>
              <option value="BID_PREPARATION">Bid Prep</option>
              <option value="PROPOSAL_SUBMITTED">Submitted</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="WON">Won</option>
              <option value="LOST">Lost</option>
            </select>
            <button onClick={handleAddOpp} disabled={!oppForm.name || createOpp.isPending}
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
              Add
            </button>
          </div>

          {(!detail.opportunities || detail.opportunities.length === 0) ? (
            <p className="text-sm text-slate-400 py-4 text-center">No opportunities yet</p>
          ) : (
            <div className="space-y-4">
              {detail.opportunities.map((opp) => (
                <div key={opp.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium text-slate-800">{opp.name}</span>
                      <span className="ml-2 text-sm text-slate-500">${Number(opp.value).toLocaleString()}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{opp.sales_stage.replace(/_/g, " ")}</span>
                  </div>

                  {/* Contracts */}
                  <div className="mt-3 pl-4 border-l-2 border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-2 uppercase">Contracts</p>
                    {opp.contracts && opp.contracts.length > 0 ? (
                      opp.contracts.map((c) => (
                        <div key={c.id} className="flex items-center justify-between text-xs py-1">
                          <span className="text-slate-700">{c.title}</span>
                          <span className="text-slate-500">{new Date(c.start_date).toLocaleDateString()} – {new Date(c.end_date).toLocaleDateString()}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">No contracts</p>
                    )}
                    {/* Add Contract Form */}
                    <div className="mt-2 flex gap-2 items-center">
                      <input type="text" placeholder="Contract title" value={contractForm.title} onChange={e => setContractForm(f => ({ ...f, title: e.target.value }))}
                        className="flex-1 px-2 py-1 text-xs rounded border border-slate-300" />
                      <input type="date" value={contractForm.startDate} onChange={e => setContractForm(f => ({ ...f, startDate: e.target.value }))}
                        className="w-28 px-2 py-1 text-xs rounded border border-slate-300" />
                      <input type="date" value={contractForm.endDate} onChange={e => setContractForm(f => ({ ...f, endDate: e.target.value }))}
                        className="w-28 px-2 py-1 text-xs rounded border border-slate-300" />
                      <button onClick={() => handleAddContract(opp.id)} disabled={!contractForm.title || createContr.isPending}
                        className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
