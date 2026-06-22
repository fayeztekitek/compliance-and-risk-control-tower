import { useState } from "react";
import { Users, Plus, ArrowLeft, Eye, Edit3, Trash2, FileText, ClipboardList } from "lucide-react";
import { useCommitteeList, useCreateCommittee, useUpdateCommittee, useDeleteCommittee, useCommitteeDecisions, useRecordDecision, useCommitteeObligations, useCreateObligation, useUpdateObligation } from "../hooks/useCommittee";
import { useAuthStore } from "../store/auth.store";
import { SkeletonTable } from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";

type ViewMode = "list" | "detail" | "create" | "edit" | "decisions" | "obligations" | "add-decision" | "add-obligation";

const STATUS_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700", INACTIVE: "bg-slate-100 text-slate-700", DISBANDED: "bg-red-100 text-red-700",
};

export default function CommitteeWorkspace() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const user = useAuthStore((s) => s.user);

  const { data: listData, isLoading } = useCommitteeList(search);
  const createCommittee = useCreateCommittee();
  const updateCommittee = useUpdateCommittee();
  const deleteCommittee = useDeleteCommittee();
  const { data: decisions } = useCommitteeDecisions(mode === "decisions" || mode === "add-decision" ? selectedId : null);
  const { data: obligations } = useCommitteeObligations(mode === "obligations" || mode === "add-obligation" ? selectedId : null);
  const recordDecision = useRecordDecision();
  const createObligationHook = useCreateObligation();
  const updateObligation = useUpdateObligation();

  const [form, setForm] = useState({ name: "", type: "", status: "ACTIVE", chairperson: "", meetingFrequency: "" });
  const [decisionForm, setDecisionForm] = useState({ title: "", description: "", status: "PENDING", decisionDate: new Date().toISOString().slice(0, 10) });
  const [obligationForm, setObligationForm] = useState({ title: "", sourceContract: "", requirement: "", frequency: "", status: "ACTIVE" });

  const canManage = user?.role === "ADMIN" || user?.role === "COMPLIANCE_OFFICER";

  if (mode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 rounded-lg"><Users className="w-5 h-5 text-purple-600" /></div>
            <div><h1 className="text-xl font-semibold text-slate-900">Committees</h1><p className="text-sm text-slate-500">Oversight committees, decisions, and regulatory obligations</p></div>
          </div>
          {canManage && <button onClick={() => { setForm({ name: "", type: "", status: "ACTIVE", chairperson: "", meetingFrequency: "" }); setMode("create"); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"><Plus className="w-4 h-4" /> New Committee</button>}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search committees..." className="w-full max-w-md border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? <SkeletonTable rows={4} /> : (
            (!listData || listData.length === 0) ? (
              <EmptyState icon={Users} title="No committees" description="Create your first oversight committee." action={canManage ? { label: "New Committee", onClick: () => { setForm({ name: "", type: "", status: "ACTIVE", chairperson: "", meetingFrequency: "" }); setMode("create"); } } : undefined} />
            ) : (
              <table className="w-full">
                <thead><tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Chairperson</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Frequency</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {(listData ?? []).map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedId(c.id); setMode("detail"); }}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{c.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.type}</td>
                      <td className="px-4 py-3 text-center"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[c.status]}`}>{c.status}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.chairperson}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.meetingFrequency}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={e => { e.stopPropagation(); setSelectedId(c.id); setMode("detail"); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"><Eye className="w-4 h-4" /></button>
                          {canManage && <button onClick={e => { e.stopPropagation(); setForm(c); setSelectedId(c.id); setMode("edit"); }} className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"><Edit3 className="w-4 h-4" /></button>}
                          {user?.role === "ADMIN" && <button onClick={e => { e.stopPropagation(); if (confirm("Delete?")) deleteCommittee.mutate(c.id); }} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"><Trash2 className="w-4 h-4" /></button>}
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

  if (mode === "detail" && selectedId && listData) {
    const c = listData.find((x: any) => x.id === selectedId) as any;
    if (!c) return <div className="p-6 text-slate-500">Loading...</div>;
    return (
      <div className="space-y-6">
        <button onClick={() => setMode("list")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> Back</button>
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div><h2 className="text-xl font-semibold text-slate-900">{c.name}</h2><p className="text-sm text-slate-500 mt-1">{c.type} | Chair: {c.chairperson}</p></div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${STATUS_BADGE[c.status]}`}>{c.status}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4"><div className="text-xs text-slate-500">Meeting Frequency</div><div className="text-sm font-medium text-slate-800">{c.meetingFrequency || "—"}</div></div>
            <div className="bg-slate-50 rounded-lg p-4"><div className="text-xs text-slate-500">Decisions</div><div className="text-sm font-medium text-slate-800">{decisions?.length || 0}</div></div>
            <div className="bg-slate-50 rounded-lg p-4"><div className="text-xs text-slate-500">Obligations</div><div className="text-sm font-medium text-slate-800">{obligations?.length || 0}</div></div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setMode("decisions")} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"><FileText className="w-4 h-4" /> Decisions</button>
            <button onClick={() => setMode("obligations")} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"><ClipboardList className="w-4 h-4" /> Obligations</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "decisions" && selectedId) {
    return (
      <div className="space-y-6">
        <button onClick={() => setMode("detail")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> Back</button>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Decisions</h2>
          <button onClick={() => { setDecisionForm({ title: "", description: "", status: "PENDING", decisionDate: new Date().toISOString().slice(0, 10) }); setMode("add-decision"); }} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus className="w-4 h-4" /> Record Decision</button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 divide-y">
          {(!decisions || decisions.length === 0) ? <EmptyState icon={FileText} title="No decisions" description="No decisions recorded yet." /> : decisions.map((d: any) => (
            <div key={d.id} className="p-4"><p className="text-sm font-medium text-slate-800">{d.title}</p><p className="text-xs text-slate-500 mt-1">{d.description?.slice(0, 120)}</p><p className="text-xs text-slate-400 mt-1">{d.decisionDate?.slice(0, 10)}</p></div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "add-decision" && selectedId) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <button onClick={() => setMode("decisions")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> Back</button>
        <h2 className="text-lg font-semibold text-slate-900">Record Decision</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Title</label><input value={decisionForm.title} onChange={e => setDecisionForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea value={decisionForm.description} onChange={e => setDecisionForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Date</label><input type="date" value={decisionForm.decisionDate} onChange={e => setDecisionForm(f => ({ ...f, decisionDate: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={decisionForm.status} onChange={e => setDecisionForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select></div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setMode("decisions")} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={async () => { await recordDecision.mutateAsync({ committeeId: selectedId, data: decisionForm }); setMode("decisions"); }} disabled={!decisionForm.title} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Record</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "obligations" && selectedId) {
    return (
      <div className="space-y-6">
        <button onClick={() => setMode("detail")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> Back</button>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Obligations</h2>
          <button onClick={() => { setObligationForm({ title: "", sourceContract: "", requirement: "", frequency: "", status: "ACTIVE" }); setMode("add-obligation"); }} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus className="w-4 h-4" /> Add Obligation</button>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 divide-y">
          {(!obligations || obligations.length === 0) ? <EmptyState icon={ClipboardList} title="No obligations" description="No regulatory obligations tracked." /> : obligations.map((o: any) => (
            <div key={o.id} className="p-4 flex items-center justify-between">
              <div><p className="text-sm font-medium text-slate-800">{o.title}</p><p className="text-xs text-slate-500">{o.sourceContract} | {o.frequency}</p></div>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[o.status] || "bg-slate-100 text-slate-700"}`}>{o.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "add-obligation" && selectedId) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <button onClick={() => setMode("obligations")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> Back</button>
        <h2 className="text-lg font-semibold text-slate-900">Add Obligation</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Title</label><input value={obligationForm.title} onChange={e => setObligationForm(f => ({ ...f, title: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Source Contract</label><input value={obligationForm.sourceContract} onChange={e => setObligationForm(f => ({ ...f, sourceContract: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Requirement</label><textarea value={obligationForm.requirement} onChange={e => setObligationForm(f => ({ ...f, requirement: e.target.value }))} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label><input value={obligationForm.frequency} onChange={e => setObligationForm(f => ({ ...f, frequency: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={obligationForm.status} onChange={e => setObligationForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option><option value="OVERDUE">Overdue</option></select></div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setMode("obligations")} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={async () => { await createObligationHook.mutateAsync({ committeeId: selectedId, data: obligationForm }); setMode("obligations"); }} disabled={!obligationForm.title} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Add</button>
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
          <h2 className="text-lg font-semibold text-slate-900">{mode === "create" ? "New Committee" : "Edit Committee"}</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Type</label><input value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">{["ACTIVE", "INACTIVE", "DISBANDED"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Chairperson</label><input value={form.chairperson} onChange={e => setForm(f => ({ ...f, chairperson: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Meeting Frequency</label><input value={form.meetingFrequency} onChange={e => setForm(f => ({ ...f, meetingFrequency: e.target.value }))} placeholder="e.g. Monthly, Quarterly" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setMode("list"); if (mode === "edit") setSelectedId(null); }} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={async () => { if (mode === "create") await createCommittee.mutateAsync(form); else if (selectedId) await updateCommittee.mutateAsync({ id: selectedId, data: form }); setMode("list"); }} disabled={!form.name} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{mode === "create" ? "Create" : "Save"}</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
