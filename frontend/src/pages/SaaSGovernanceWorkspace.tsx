import { useState } from "react";
import { Cloud, Plus, ArrowLeft, ChevronRight, Shield, CheckCircle, AlertTriangle, Eye, Edit3, Trash2 } from "lucide-react";
import { useSaaSList, useCreateSaaS, useUpdateSaaS, useDeleteSaaS, useSubmitPrivacyAssessment } from "../hooks/useSaaS";
import { useAuthStore } from "../store/auth.store";
import { SkeletonTable } from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import type { SaaSApplication } from "../api/saas.api";

type ViewMode = "list" | "detail" | "create" | "edit" | "privacy";

const STAGE_BADGE: Record<string, string> = {
  ONBOARDING: "bg-blue-100 text-blue-700 border-blue-200",
  GO_LIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
  OFFBOARDING: "bg-slate-100 text-slate-700 border-slate-200",
};

const PRIVACY_BADGE: Record<string, string> = {
  COMPLIANT: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  NON_COMPLIANT: "bg-red-100 text-red-700",
};

const RISK_BADGE: Record<string, string> = {
  LOW: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  HIGH: "bg-red-100 text-red-700",
};

export default function SaaSGovernanceWorkspace() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const { data: listData, isLoading } = useSaaSList();
  const createSaaS = useCreateSaaS();
  const updateSaaS = useUpdateSaaS();
  const deleteSaaS = useDeleteSaaS();
  const submitAssessment = useSubmitPrivacyAssessment();

  const [form, setForm] = useState<Partial<SaaSApplication>>({
    name: "", lifecycleStage: "ONBOARDING", goLiveReadinessScore: 0,
    privacyDesignStatus: "PENDING", steeringCheckPassed: false,
    dataCategory: "NON_PII", gdprRiskImpact: "LOW", owner: "",
  });
  const [privacyForm, setPrivacyForm] = useState({ assessmentDate: "", status: "PENDING", findings: "" });

  const canManage = user?.role === "ADMIN" || user?.role === "COMPLIANCE_OFFICER" || user?.role === "PRODUCT_OWNER";

  function resetForm() {
    setForm({ name: "", lifecycleStage: "ONBOARDING", goLiveReadinessScore: 0, privacyDesignStatus: "PENDING", steeringCheckPassed: false, dataCategory: "NON_PII", gdprRiskImpact: "LOW", owner: "" });
  }

  function handleEdit(app: SaaSApplication) {
    setForm(app);
    setSelectedId(app.id);
    setMode("edit");
  }

  async function handleSave() {
    if (mode === "create") {
      await createSaaS.mutateAsync(form);
    } else if (mode === "edit" && selectedId) {
      await updateSaaS.mutateAsync({ id: selectedId, data: form });
    }
    setMode("list");
    setSelectedId(null);
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this SaaS application?")) {
      await deleteSaaS.mutateAsync(id);
    }
  }

  async function handleSubmitPrivacy() {
    if (!selectedId) return;
    await submitAssessment.mutateAsync({ id: selectedId, data: privacyForm });
    setMode("detail");
  }

  if (mode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-100 rounded-lg"><Cloud className="w-5 h-5 text-sky-600" /></div>
            <div><h1 className="text-xl font-semibold text-slate-900">SaaS Governance</h1><p className="text-sm text-slate-500">End-to-end SaaS lifecycle oversight — onboarding, go-live, offboarding</p></div>
          </div>
          {canManage && (
            <button onClick={() => { resetForm(); setMode("create"); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"><Plus className="w-4 h-4" /> New SaaS App</button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={4} />
          ) : (
            <>
              {(!listData || listData.length === 0) ? (
                <EmptyState icon={Cloud} title="No SaaS applications" description="Register your first SaaS application to track governance." action={canManage ? { label: "New SaaS App", onClick: () => { resetForm(); setMode("create"); } } : undefined} />
              ) : (
                <table className="w-full">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Stage</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Readiness</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Privacy</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Steering</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">GDPR Risk</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Owner</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {listData.map((app) => {
                      const detail = app as any;
                      return (
                        <tr key={app.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => { setSelectedId(app.id); setMode("detail"); }}>
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">{detail.name}</td>
                          <td className="px-4 py-3"><span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${STAGE_BADGE[detail.lifecycleStage]}`}>{detail.lifecycleStage?.replace("_", " ")}</span></td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-16 bg-slate-200 rounded-full h-1.5"><div className="bg-emerald-500 rounded-full h-1.5" style={{ width: `${detail.goLiveReadinessScore || 0}%` }} /></div>
                              <span className="text-xs text-slate-500">{detail.goLiveReadinessScore || 0}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${PRIVACY_BADGE[detail.privacyDesignStatus]}`}>{detail.privacyDesignStatus?.replace("_", " ")}</span></td>
                          <td className="px-4 py-3 text-center">{detail.steeringCheckPassed ? <CheckCircle className="w-4 h-4 text-emerald-500 inline" /> : <AlertTriangle className="w-4 h-4 text-amber-500 inline" />}</td>
                          <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${RISK_BADGE[detail.gdprRiskImpact]}`}>{detail.gdprRiskImpact}</span></td>
                          <td className="px-4 py-3 text-sm text-slate-600">{detail.owner}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={e => { e.stopPropagation(); setSelectedId(app.id); setMode("detail"); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"><Eye className="w-4 h-4" /></button>
                              {canManage && (
                                <button onClick={e => { e.stopPropagation(); handleEdit(detail); }} className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"><Edit3 className="w-4 h-4" /></button>
                              )}
                              {(user?.role === "ADMIN" || user?.role === "COMPLIANCE_OFFICER") && (
                                <button onClick={e => { e.stopPropagation(); handleDelete(app.id); }} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"><Trash2 className="w-4 h-4" /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (mode === "detail" && selectedId && listData) {
    const app = listData.find(a => a.id === selectedId) as any;
    if (!app) return <div className="p-6 text-slate-500">Loading...</div>;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { setMode("list"); setSelectedId(null); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> Back</button>
          <div className="flex items-center gap-2">
            <button onClick={() => { setPrivacyForm({ assessmentDate: new Date().toISOString().slice(0, 10), status: "PENDING", findings: "" }); setMode("privacy"); }} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"><Shield className="w-4 h-4" /> Privacy Assessment</button>
            <button onClick={() => handleEdit(app)} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"><Edit3 className="w-4 h-4" /> Edit</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div><h2 className="text-xl font-semibold text-slate-900">{app.name}</h2><p className="text-sm text-slate-500 mt-1">Owner: {app.owner}</p></div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${STAGE_BADGE[app.lifecycleStage]}`}>{app.lifecycleStage?.replace("_", " ")}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4"><div className="text-xs text-slate-500 mb-1">Readiness Score</div><div className="text-lg font-semibold text-slate-800">{app.goLiveReadinessScore || 0}%</div></div>
            <div className="bg-slate-50 rounded-lg p-4"><div className="text-xs text-slate-500 mb-1">Privacy</div><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${PRIVACY_BADGE[app.privacyDesignStatus]}`}>{app.privacyDesignStatus?.replace("_", " ")}</span></div>
            <div className="bg-slate-50 rounded-lg p-4"><div className="text-xs text-slate-500 mb-1">Data Category</div><div className="text-sm font-medium text-slate-800">{app.dataCategory?.replace("_", " ")}</div></div>
            <div className="bg-slate-50 rounded-lg p-4"><div className="text-xs text-slate-500 mb-1">GDPR Risk</div><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${RISK_BADGE[app.gdprRiskImpact]}`}>{app.gdprRiskImpact}</span></div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "create" || mode === "edit") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setMode("list"); if (mode === "edit") setSelectedId(null); }} className="p-2 text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-lg font-semibold text-slate-900">{mode === "create" ? "New SaaS Application" : "Edit SaaS Application"}</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Application Name</label><input value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Lifecycle Stage</label><select value={form.lifecycleStage || "ONBOARDING"} onChange={e => setForm(f => ({ ...f, lifecycleStage: e.target.value as any }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">{["ONBOARDING", "GO_LIVE", "OFFBOARDING"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Owner</label><input value={form.owner || ""} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Data Category</label><select value={form.dataCategory || "NON_PII"} onChange={e => setForm(f => ({ ...f, dataCategory: e.target.value as any }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">{["NON_PII", "PII_COMMON", "PII_SENSITIVE"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">GDPR Risk Impact</label><select value={form.gdprRiskImpact || "LOW"} onChange={e => setForm(f => ({ ...f, gdprRiskImpact: e.target.value as any }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">{["LOW", "MEDIUM", "HIGH"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Readiness Score</label><input type="number" min={0} max={100} value={form.goLiveReadinessScore || 0} onChange={e => setForm(f => ({ ...f, goLiveReadinessScore: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
            <div className="flex items-center gap-3 pt-6"><input type="checkbox" checked={form.steeringCheckPassed || false} onChange={e => setForm(f => ({ ...f, steeringCheckPassed: e.target.checked }))} className="rounded border-slate-300" /><label className="text-sm text-slate-700">Steering Check Passed</label></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Privacy Design Status</label><select value={form.privacyDesignStatus || "PENDING"} onChange={e => setForm(f => ({ ...f, privacyDesignStatus: e.target.value as any }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">{["COMPLIANT", "PENDING", "NON_COMPLIANT"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setMode("list"); if (mode === "edit") setSelectedId(null); }} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={!form.name} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{mode === "create" ? "Create" : "Save Changes"}</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "privacy") {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setMode("detail")} className="p-2 text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-lg font-semibold text-slate-900">Privacy Assessment</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Assessment Date</label><input type="date" value={privacyForm.assessmentDate} onChange={e => setPrivacyForm(f => ({ ...f, assessmentDate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={privacyForm.status} onChange={e => setPrivacyForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"><option value="PENDING">Pending</option><option value="COMPLIANT">Compliant</option><option value="NON_COMPLIANT">Non-Compliant</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Findings</label><textarea value={privacyForm.findings} onChange={e => setPrivacyForm(f => ({ ...f, findings: e.target.value }))} rows={4} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setMode("detail")} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleSubmitPrivacy} disabled={!privacyForm.assessmentDate} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Submit</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
