import { useState } from "react";
import { FileCheck, Plus, ArrowLeft, Eye, Edit3, Trash2, AlertTriangle, CheckCircle, XCircle, ClipboardList } from "lucide-react";
import { useAuditList, useCreateAudit, useUpdateAudit, useDeleteAudit, useFindings, useCreateFinding, useCapiList, useCreateCapi } from "../hooks/useAudit";
import { useAuthStore } from "../store/auth.store";
import { SkeletonTable } from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import type { Audit, Finding, CapiItem } from "../api/audit.api";

type ViewMode = "list" | "detail" | "create" | "edit" | "findings" | "capa" | "add-finding" | "add-capa";

const STATUS_BADGE: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-700", IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700", CLOSED: "bg-slate-100 text-slate-700",
};

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700", HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-amber-100 text-amber-700", LOW: "bg-slate-100 text-slate-700",
};

export default function AuditWorkspace() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useAuditList({ search: search || undefined, status: undefined, page: undefined });
  const createAudit = useCreateAudit();
  const updateAudit = useUpdateAudit();
  const deleteAudit = useDeleteAudit();
  const { data: findings } = useFindings(mode === "findings" || mode === "add-finding" ? selectedId : null);
  const { data: capaItems } = useCapiList(mode === "capa" || mode === "add-capa" ? selectedId : null);
  const createFinding = useCreateFinding();
  const createCapi = useCreateCapi();

  const [form, setForm] = useState<Partial<Audit>>({ title: "", auditType: "", status: "PLANNED", startDate: "", endDate: "", leadAuditor: "", scope: "" });
  const [findingForm, setFindingForm] = useState({ title: "", description: "", severity: "MEDIUM", status: "OPEN" });
  const [capiForm, setCapiForm] = useState({ action: "", owner: "", dueDate: "", status: "OPEN" });

  const canManage = user?.role === "ADMIN" || user?.role === "COMPLIANCE_OFFICER" || user?.role === "AUDITOR";

  function resetForm() { setForm({ title: "", auditType: "", status: "PLANNED", startDate: "", endDate: "", leadAuditor: "", scope: "" }); }

  if (mode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 rounded-lg"><FileCheck className="w-5 h-5 text-rose-600" /></div>
            <div><h1 className="text-xl font-semibold text-slate-900">Audits & Findings</h1><p className="text-sm text-slate-500">Audit lifecycle, findings, and corrective actions</p></div>
          </div>
          {canManage && <button onClick={() => { resetForm(); setMode("create"); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"><Plus className="w-4 h-4" /> New Audit</button>}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search audits..." className="w-full max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? <SkeletonTable rows={4} /> : (
            (data?.data ?? []).length === 0 ? (
              <EmptyState icon={FileCheck} title="No audits" description="Create your first audit to start tracking." action={canManage ? { label: "New Audit", onClick: () => { resetForm(); setMode("create"); } } : undefined} />
            ) : (
              <table className="w-full">
                <thead><tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Lead</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Start</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {(data?.data ?? []).map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedId(a.id); setMode("detail"); }}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{a.title}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{a.auditType}</td>
                      <td className="px-4 py-3 text-center"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[a.status]}`}>{a.status?.replace("_", " ")}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-600">{a.leadAuditor}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{a.startDate?.slice(0, 10)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={e => { e.stopPropagation(); setSelectedId(a.id); setMode("detail"); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"><Eye className="w-4 h-4" /></button>
                          {canManage && <button onClick={e => { e.stopPropagation(); setForm(a); setSelectedId(a.id); setMode("edit"); }} className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"><Edit3 className="w-4 h-4" /></button>}
                          {(user?.role === "ADMIN" || user?.role === "COMPLIANCE_OFFICER") && <button onClick={e => { e.stopPropagation(); if (confirm("Delete?")) deleteAudit.mutate(a.id); }} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"><Trash2 className="w-4 h-4" /></button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    );
  }

  if (mode === "detail" && selectedId) {
    const a = data?.data?.find((x: any) => x.id === selectedId) as any;
    if (!a) return <div className="p-6 text-slate-500">Loading...</div>;
    return (
      <div className="space-y-6">
        <button onClick={() => setMode("list")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> Back</button>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div><h2 className="text-xl font-semibold text-slate-900">{a.title}</h2><p className="text-sm text-slate-500 mt-1">{a.auditType} | Lead: {a.leadAuditor}</p></div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${STATUS_BADGE[a.status]}`}>{a.status?.replace("_", " ")}</span>
          </div>
          {a.scope && <div className="mb-4"><h3 className="text-sm font-medium text-slate-700 mb-1">Scope</h3><p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{a.scope}</p></div>}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4"><div className="text-xs text-slate-500">Start</div><div className="text-sm font-medium text-slate-800">{a.startDate?.slice(0, 10) || "—"}</div></div>
            <div className="bg-slate-50 rounded-lg p-4"><div className="text-xs text-slate-500">End</div><div className="text-sm font-medium text-slate-800">{a.endDate?.slice(0, 10) || "—"}</div></div>
            <div className="bg-slate-50 rounded-lg p-4"><div className="text-xs text-slate-500">Findings</div><div className="text-sm font-medium text-slate-800">{findings?.length || 0}</div></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setMode("findings")} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"><ClipboardList className="w-4 h-4" /> Findings</button>
            <button onClick={() => setMode("capa")} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"><AlertTriangle className="w-4 h-4" /> CAPA</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "findings" && selectedId) {
    return (
      <div className="space-y-6">
        <button onClick={() => setMode("detail")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> Back</button>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Findings</h2>
          <button onClick={() => { setFindingForm({ title: "", description: "", severity: "MEDIUM", status: "OPEN" }); setMode("add-finding"); }} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus className="w-4 h-4" /> Add Finding</button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 divide-y">
          {(!findings || findings.length === 0) ? <EmptyState icon={ClipboardList} title="No findings" description="No findings recorded for this audit." /> : findings.map((f: any) => (
            <div key={f.id} className="p-4 flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-800">{f.title}</p><p className="text-xs text-slate-500">{f.description?.slice(0, 100)}</p></div>
              <div className="flex items-center gap-2">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[f.severity]}`}>{f.severity}</span>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[f.status]}`}>{f.status?.replace("_", " ")}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setMode("capa")} className="text-sm text-indigo-600 hover:text-indigo-800">View CAPA items →</button>
      </div>
    );
  }

  if (mode === "add-finding" && selectedId) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <button onClick={() => setMode("findings")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> Back</button>
        <h2 className="text-lg font-semibold text-slate-900">Add Finding</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Title</label><input value={findingForm.title} onChange={e => setFindingForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea value={findingForm.description} onChange={e => setFindingForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Severity</label><select value={findingForm.severity} onChange={e => setFindingForm(f => ({ ...f, severity: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">{["CRITICAL", "HIGH", "MEDIUM", "LOW"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={findingForm.status} onChange={e => setFindingForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">{["OPEN", "IN_PROGRESS", "CLOSED"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setMode("findings")} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={async () => { await createFinding.mutateAsync({ auditId: selectedId, data: findingForm as any }); setMode("findings"); }} disabled={!findingForm.title} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Add</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "capa" && selectedId) {
    return (
      <div className="space-y-6">
        <button onClick={() => setMode("detail")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> Back</button>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Corrective Actions (CAPA)</h2>
          <button onClick={() => { setCapiForm({ action: "", owner: "", dueDate: "", status: "OPEN" }); setMode("add-capa"); }} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus className="w-4 h-4" /> Add CAPA</button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 divide-y">
          {(!capaItems || capaItems.length === 0) ? <EmptyState icon={AlertTriangle} title="No CAPA items" description="No corrective actions for this audit." /> : capaItems.map((c: any) => (
            <div key={c.id} className="p-4 flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-800">{c.action}</p><p className="text-xs text-slate-500">Owner: {c.owner} | Due: {c.dueDate?.slice(0, 10)}</p></div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[c.status]}`}>{c.status?.replace("_", " ")}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "add-capa" && selectedId) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <button onClick={() => setMode("capa")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> Back</button>
        <h2 className="text-lg font-semibold text-slate-900">Add CAPA</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Action</label><textarea value={capiForm.action} onChange={e => setCapiForm(f => ({ ...f, action: e.target.value }))} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Owner</label><input value={capiForm.owner} onChange={e => setCapiForm(f => ({ ...f, owner: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label><input type="date" value={capiForm.dueDate} onChange={e => setCapiForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setMode("capa")} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={async () => { await createCapi.mutateAsync({ auditId: selectedId, data: capiForm as any }); setMode("capa"); }} disabled={!capiForm.action} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Add</button>
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
          <h2 className="text-lg font-semibold text-slate-900">{mode === "create" ? "New Audit" : "Edit Audit"}</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Title</label><input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Audit Type</label><input value={form.auditType || ""} onChange={e => setForm(f => ({ ...f, auditType: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={form.status || "PLANNED"} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">{["PLANNED", "IN_PROGRESS", "COMPLETED", "CLOSED"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label><input type="date" value={form.startDate || ""} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">End Date</label><input type="date" value={form.endDate || ""} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Lead Auditor</label><input value={form.leadAuditor || ""} onChange={e => setForm(f => ({ ...f, leadAuditor: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Scope</label><textarea value={form.scope || ""} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setMode("list"); if (mode === "edit") setSelectedId(null); }} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={async () => { if (mode === "create") await createAudit.mutateAsync(form); else if (selectedId) await updateAudit.mutateAsync({ id: selectedId, data: form }); setMode("list"); }} disabled={!form.title} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{mode === "create" ? "Create" : "Save"}</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
