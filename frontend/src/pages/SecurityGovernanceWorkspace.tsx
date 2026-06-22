import { useState } from "react";
import {
  ShieldAlert, Search, AlertTriangle, CheckCircle, XCircle,
  Clock, Upload, RefreshCw, ChevronLeft, Plus, FileText,
} from "lucide-react";
import {
  useVulnerabilityList, useCreateVulnerability, useUpdateVulnerability,
  useSetFalsePositive, useWaivers, useCreateWaiver, useApproveWaiver, useRejectWaiver,
  useRiskAcceptances, useCreateRiskAcceptance, useApproveRiskAcceptance,
  useSlaIncidents, useDetectSlaBreaches, useCheckWaiverExpiry, useImportScan,
} from "../hooks/useSecurity";
import type { Vulnerability } from "../api/security.api";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonTable } from "../components/ui/Skeleton";

type ViewMode = "list" | "detail" | "create" | "waivers" | "risk-acceptances" | "sla" | "scan-import";

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-green-100 text-green-700",
};

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-red-50 text-red-600 border border-red-200",
  FALSE_POSITIVE: "bg-gray-100 text-gray-600",
  WAIVED: "bg-amber-100 text-amber-700",
  REMEDIATED: "bg-green-100 text-green-700",
};

export default function SecurityGovernanceWorkspace() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [fpModal, setFpModal] = useState<{ vulnId: string; explanation: string } | null>(null);
  const [waiverForm, setWaiverForm] = useState({ vulnerabilityId: "", title: "", rationale: "", expiryDate: "" });
  const [raForm, setRaForm] = useState({ vulnerabilityId: "", title: "", businessImpact: "", mitigationPlan: "", expiryDate: "" });
  const [scanData, setScanData] = useState("");

  const { data: vulnData, isLoading } = useVulnerabilityList({ page, limit: 20, search, severity: sevFilter || undefined, status: statusFilter || undefined });
  const { data: waivers } = useWaivers();
  const { data: riskAcceptances } = useRiskAcceptances();
  const { data: slaIncidents } = useSlaIncidents();
  const createVuln = useCreateVulnerability();
  const updateVuln = useUpdateVulnerability();
  const setFP = useSetFalsePositive();
  const createWaiver = useCreateWaiver();
  const approveWaiver = useApproveWaiver();
  const rejectWaiver = useRejectWaiver();
  const createRA = useCreateRiskAcceptance();
  const approveRA = useApproveRiskAcceptance();
  const detectSLA = useDetectSlaBreaches();
  const checkExpiry = useCheckWaiverExpiry();
  const importScan = useImportScan();

  const [vulnForm, setVulnForm] = useState({ title: "", severity: "MEDIUM" as string, sourceScanner: "VERACODE" as string, slaDueDate: "", targetProduct: "", owner: "" });

  function resetVulnForm() { setVulnForm({ title: "", severity: "MEDIUM", sourceScanner: "VERACODE", slaDueDate: "", targetProduct: "", owner: "" }); }

  // ----- LIST VIEW -----
  if (mode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Security Governance</h2>
            <p className="text-sm text-slate-500 mt-1">Vulnerability registry, waivers, risk acceptances & SLA tracking</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMode("scan-import")} className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">
              <Upload className="w-4 h-4" /> Import Scan
            </button>
            <button onClick={() => { resetVulnForm(); setMode("create"); }} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> New Vuln
            </button>
          </div>
        </div>

        {/* Sub-nav */}
        <div className="flex gap-2 border-b border-slate-200 pb-1">
          {(["list", "waivers", "risk-acceptances", "sla"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${mode === m ? "bg-white text-indigo-600 border border-b-white border-slate-200 -mb-px" : "text-slate-500 hover:text-slate-700"}`}>
              {m === "list" && "Vulnerabilities"}
              {m === "waivers" && `Waivers (${waivers?.length || 0})`}
              {m === "risk-acceptances" && `Risk Acceptances (${riskAcceptances?.length || 0})`}
              {m === "sla" && `SLA Incidents (${slaIncidents?.length || 0})`}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search vulnerabilities..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={sevFilter} onChange={e => { setSevFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="FALSE_POSITIVE">False Positive</option>
            <option value="WAIVED">Waived</option>
            <option value="REMEDIATED">Remediated</option>
          </select>
          <div className="flex gap-1">
            <button onClick={() => detectSLA.mutate()} disabled={detectSLA.isPending} className="px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-1" title="Detect SLA breaches">
              <AlertTriangle className="w-4 h-4" /> Detect SLA
            </button>
            <button onClick={() => checkExpiry.mutate()} disabled={checkExpiry.isPending} className="px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-1" title="Check waiver expiry">
              <RefreshCw className="w-4 h-4" /> Check Waivers
            </button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <SkeletonTable rows={5} />
          </div>
        ) : (
          <>
            {(!vulnData?.data || vulnData.data.length === 0) ? (
              <EmptyState
                icon={ShieldAlert}
                title="No vulnerabilities"
                description="Import scan results or create a vulnerability manually."
                action={{ label: "Import Scan", onClick: () => setMode("scan-import") }}
              />
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Severity</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Scanner</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Product</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">SLA Due</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vulnData?.data ?? []).map((v) => {
                      const isOverdue = v.status === "OPEN" && new Date(v.slaDueDate) <= new Date();
                      return (
                        <tr key={v.id} className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${isOverdue ? "bg-red-50" : ""}`}>
                          <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">{v.title}</td>
                          <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[v.severity]}`}>{v.severity}</span></td>
                          <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[v.status]}`}>{v.status.replace(/_/g, " ")}</span></td>
                          <td className="px-4 py-3 text-slate-600 text-xs">{v.sourceScanner}</td>
                          <td className="px-4 py-3 text-slate-600 text-xs">{v.targetProduct || "—"}</td>
                          <td className="px-4 py-3 text-xs">
                            <span className={isOverdue ? "text-red-600 font-medium" : "text-slate-500"}>
                              {new Date(v.slaDueDate).toLocaleDateString()}
                              {isOverdue && <AlertTriangle className="inline w-3 h-3 ml-1 text-red-500" />}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex gap-1 justify-end">
                              {v.status === "OPEN" && (
                                <button onClick={() => setFpModal({ vulnId: v.id, explanation: "" })} className="text-xs text-slate-500 hover:text-slate-700 underline">False Pos</button>
                              )}
                              <button onClick={() => { setMode("detail"); setSelectedId(v.id); }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {vulnData && vulnData.total > vulnData.limit && (
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{((vulnData.page - 1) * vulnData.limit) + 1}–{Math.min(vulnData.page * vulnData.limit, vulnData.total)} of {vulnData.total}</span>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50">Prev</button>
                  <button disabled={page >= Math.ceil(vulnData.total / vulnData.limit)} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* False Positive Modal */}
        {fpModal && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setFpModal(null)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Mark as False Positive</h3>
              <textarea placeholder="Explain why this is a false positive (min 10 chars)" value={fpModal.explanation}
                onChange={e => setFpModal(f => f ? { ...f, explanation: e.target.value } : null)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500" />
              <div className="flex gap-2 mt-4 justify-end">
                <button onClick={() => setFpModal(null)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">Cancel</button>
                <button onClick={async () => { if (fpModal) { await setFP.mutateAsync({ id: fpModal.vulnId, explanation: fpModal.explanation }); setFpModal(null); } }}
                  disabled={fpModal.explanation.length < 10 || setFP.isPending}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm disabled:opacity-50">Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----- CREATE -----
  if (mode === "create") {
    return (
      <div className="space-y-6 max-w-2xl">
        <button onClick={() => setMode("list")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ChevronLeft className="w-4 h-4" /> Back</button>
        <h2 className="text-2xl font-bold text-slate-800">New Vulnerability</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input type="text" value={vulnForm.title} onChange={e => setVulnForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
              <select value={vulnForm.severity} onChange={e => setVulnForm(f => ({ ...f, severity: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Scanner</label>
              <select value={vulnForm.sourceScanner} onChange={e => setVulnForm(f => ({ ...f, sourceScanner: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                <option value="VERACODE">Veracode</option>
                <option value="NEXPOSE">Nexpose</option>
                <option value="PEN_TEST">Pen Test</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">SLA Due Date</label>
              <input type="date" value={vulnForm.slaDueDate} onChange={e => setVulnForm(f => ({ ...f, slaDueDate: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Product</label>
              <input type="text" value={vulnForm.targetProduct} onChange={e => setVulnForm(f => ({ ...f, targetProduct: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Owner</label>
            <input type="text" value={vulnForm.owner} onChange={e => setVulnForm(f => ({ ...f, owner: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={async () => { await createVuln.mutateAsync(vulnForm as any); setMode("list"); }} disabled={createVuln.isPending}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Create</button>
            <button onClick={() => setMode("list")} className="px-4 py-2 border border-slate-300 rounded-lg text-sm">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ----- Waivers View -----
  if (mode === "waivers") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Waivers</h2>
          <button onClick={() => setMode("list")} className="text-sm text-indigo-600 hover:text-indigo-800">Back to Vulns</button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">New Waiver Request</h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Vulnerability ID" value={waiverForm.vulnerabilityId} onChange={e => setWaiverForm(f => ({ ...f, vulnerabilityId: e.target.value }))} className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
              <input type="text" placeholder="Title" value={waiverForm.title} onChange={e => setWaiverForm(f => ({ ...f, title: e.target.value }))} className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
              <textarea placeholder="Rationale" value={waiverForm.rationale} onChange={e => setWaiverForm(f => ({ ...f, rationale: e.target.value }))} className="col-span-2 px-3 py-1.5 rounded border border-slate-300 text-sm" />
              <input type="date" value={waiverForm.expiryDate} onChange={e => setWaiverForm(f => ({ ...f, expiryDate: e.target.value }))} className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
              <button onClick={async () => { await createWaiver.mutateAsync(waiverForm); setWaiverForm({ vulnerabilityId: "", title: "", rationale: "", expiryDate: "" }); }}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm disabled:opacity-50" disabled={createWaiver.isPending}>Request Waiver</button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200">
              <th className="text-left px-3 py-2 font-medium text-slate-600">Title</th>
              <th className="text-left px-3 py-2 font-medium text-slate-600">Status</th>
              <th className="text-left px-3 py-2 font-medium text-slate-600">Expires</th>
              <th className="text-right px-3 py-2 font-medium text-slate-600">Actions</th>
            </tr></thead>
            <tbody>
              {(waivers || []).map((w: any) => (
                <tr key={w.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{w.title}</td>
                  <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${w.status === "APPROVED" ? "bg-green-100 text-green-700" : w.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{w.status}</span></td>
                  <td className="px-3 py-2 text-xs text-slate-500">{new Date(w.expiry_date).toLocaleDateString()}</td>
                  <td className="px-3 py-2 text-right">
                    {w.status === "PENDING" && (
                      <>
                        <button onClick={() => approveWaiver.mutate(w.id)} className="text-xs text-green-600 hover:text-green-800 mr-2">Approve</button>
                        <button onClick={() => rejectWaiver.mutate(w.id)} className="text-xs text-red-600 hover:text-red-800">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {(!waivers || waivers.length === 0) && <tr><td colSpan={4} className="px-3 py-8 text-center text-slate-400">No waivers</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ----- Risk Acceptances View -----
  if (mode === "risk-acceptances") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Risk Acceptances</h2>
          <button onClick={() => setMode("list")} className="text-sm text-indigo-600 hover:text-indigo-800">Back to Vulns</button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">New Risk Acceptance</h3>
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Vulnerability ID" value={raForm.vulnerabilityId} onChange={e => setRaForm(f => ({ ...f, vulnerabilityId: e.target.value }))} className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
              <input type="text" placeholder="Title" value={raForm.title} onChange={e => setRaForm(f => ({ ...f, title: e.target.value }))} className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
              <textarea placeholder="Business Impact" value={raForm.businessImpact} onChange={e => setRaForm(f => ({ ...f, businessImpact: e.target.value }))} className="col-span-2 px-3 py-1.5 rounded border border-slate-300 text-sm" />
              <textarea placeholder="Mitigation Plan" value={raForm.mitigationPlan} onChange={e => setRaForm(f => ({ ...f, mitigationPlan: e.target.value }))} className="col-span-2 px-3 py-1.5 rounded border border-slate-300 text-sm" />
              <input type="date" value={raForm.expiryDate} onChange={e => setRaForm(f => ({ ...f, expiryDate: e.target.value }))} className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
              <button onClick={async () => { await createRA.mutateAsync(raForm); setRaForm({ vulnerabilityId: "", title: "", businessImpact: "", mitigationPlan: "", expiryDate: "" }); }}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm disabled:opacity-50" disabled={createRA.isPending}>Submit</button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200">
              <th className="text-left px-3 py-2 font-medium text-slate-600">Title</th>
              <th className="text-left px-3 py-2 font-medium text-slate-600">Status</th>
              <th className="text-right px-3 py-2 font-medium text-slate-600">Actions</th>
            </tr></thead>
            <tbody>
              {(riskAcceptances || []).map((ra: any) => (
                <tr key={ra.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{ra.title}</td>
                  <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${ra.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{ra.status}</span></td>
                  <td className="px-3 py-2 text-right">
                    {ra.status === "PENDING" && <button onClick={() => approveRA.mutate(ra.id)} className="text-xs text-green-600 hover:text-green-800">Approve</button>}
                  </td>
                </tr>
              ))}
              {(!riskAcceptances || riskAcceptances.length === 0) && <tr><td colSpan={3} className="px-3 py-8 text-center text-slate-400">No risk acceptances</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ----- SLA Incidents View -----
  if (mode === "sla") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">SLA Incidents</h2>
          <div className="flex gap-2">
            <button onClick={() => setMode("list")} className="text-sm text-indigo-600 hover:text-indigo-800">Back to Vulns</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase font-medium">Total Incidents</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{(slaIncidents || []).length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase font-medium">Breached</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{(slaIncidents || []).filter((i: any) => i.status === "BREACHED").length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase font-medium">Open</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{(slaIncidents || []).filter((i: any) => i.status === "OPEN").length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {(!slaIncidents || slaIncidents.length === 0) ? (
            <p className="px-6 py-8 text-center text-slate-400">No SLA incidents detected</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Project</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Breach Time</th>
              </tr></thead>
              <tbody>
                {(slaIncidents || []).map((i: any) => (
                  <tr key={i.id} className="border-b border-slate-100">
                    <td className="px-4 py-3 text-slate-700">{i.title}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{i.project_name || "—"}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${i.status === "BREACHED" ? "bg-red-100 text-red-700" : i.status === "OPEN" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{i.status}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{new Date(i.breach_time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ----- Scan Import -----
  if (mode === "scan-import") {
    return (
      <div className="space-y-6 max-w-2xl">
        <button onClick={() => setMode("list")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"><ChevronLeft className="w-4 h-4" /> Back</button>
        <h2 className="text-2xl font-bold text-slate-800">Import Scan Results</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <p className="text-sm text-slate-600">Paste JSON array of vulnerabilities from Veracode, Nexpose, or Pen Test reports.</p>
          <textarea
            value={scanData}
            onChange={e => setScanData(e.target.value)}
            placeholder='[{ "title": "XSS in login", "severity": "HIGH", "scanner": "VERACODE", "slaDueDate": "2026-09-01", "product": "RiskTower" }]'
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono min-h-[200px] focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={async () => {
              try {
                const data = JSON.parse(scanData);
                await importScan.mutateAsync(data);
                setScanData("");
                setMode("list");
              } catch { /* parse error silently */ }
            }}
            disabled={!scanData.trim() || importScan.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" /> Import {scanData.trim() ? `(${(JSON.parse(scanData.trim() || "[]") as any[]).length || 0} vulns)` : ""}
          </button>
          {importScan.data && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              Imported {(importScan.data as any).data?.imported || 0} vulnerabilities successfully
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----- DETAIL (placeholder — same as list interaction flow) -----
  if (mode === "detail") {
    return (
      <div className="space-y-6">
        <button onClick={() => { setMode("list"); setSelectedId(null); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Back to list
        </button>
        <p className="text-slate-500 text-center py-12">Select a vulnerability from the list to view details.</p>
      </div>
    );
  }

  return null;
}
