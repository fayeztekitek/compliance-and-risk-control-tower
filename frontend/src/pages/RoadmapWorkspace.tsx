import { useState } from "react";
import {
  Map, Plus, Eye, Edit3, Trash2, ArrowLeft, ChevronLeft, ChevronRight,
  Clock, TrendingUp, DollarSign, AlertTriangle, CheckCircle,
} from "lucide-react";
import { useProjectList, useProjectById, useRoadmapList, useCreateProject, useUpdateProject, useDeleteProject, useSubmitRtd } from "../hooks/useProject";
import { useAuthStore } from "../store/auth.store";
import { SkeletonTable, SkeletonPage } from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";
import type { Project } from "../api/project.api";

type ViewMode = "list" | "detail" | "create" | "edit" | "rtd";

const STATUS_BADGE: Record<string, string> = {
  ON_TRACK: "bg-emerald-100 text-emerald-700 border-emerald-200",
  DEVIATING: "bg-amber-100 text-amber-700 border-amber-200",
  HIGH_RISK: "bg-red-100 text-red-700 border-red-200",
};

const READINESS_BADGE: Record<string, string> = {
  READY: "bg-emerald-100 text-emerald-700",
  RISKY: "bg-amber-100 text-amber-700",
  BLOCKED: "bg-red-100 text-red-700",
};

export default function RoadmapWorkspace() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const user = useAuthStore((s) => s.user);

  const { data: listData, isLoading } = useProjectList({ page, limit: 20, search: search || undefined, status: statusFilter || undefined });
  const { data: detail } = useProjectById(selectedId);
  const { data: roadmaps } = useRoadmapList();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const submitRtd = useSubmitRtd();

  const [form, setForm] = useState<Partial<Project>>({
    name: "", code: "", manager: "", status: "ON_TRACK",
    initialBudget: 0, consumedBudget: 0,
    rtdValue: 0, rtdDeviation: 0, slippageMd: 0,
    testAutomationRate: 0, goLiveReadinessState: "READY",
  });
  const [rtdForm, setRtdForm] = useState({ reviewMonth: "", declaredRtd: 0, actualConsumed: 0, comments: "" });

  function resetForm() {
    setForm({ name: "", code: "", manager: "", status: "ON_TRACK", initialBudget: 0, consumedBudget: 0, rtdValue: 0, rtdDeviation: 0, slippageMd: 0, testAutomationRate: 0, goLiveReadinessState: "READY" });
  }

  function handleEdit(project: Project) {
    setForm(project);
    setSelectedId(project.id);
    setMode("edit");
  }

  async function handleSave() {
    if (mode === "create") {
      await createProject.mutateAsync(form);
    } else if (mode === "edit" && selectedId) {
      await updateProject.mutateAsync({ id: selectedId, data: form });
    }
    setMode("list");
    setSelectedId(null);
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this project?")) {
      await deleteProject.mutateAsync(id);
    }
  }

  async function handleSubmitRtd() {
    if (!selectedId) return;
    await submitRtd.mutateAsync({ id: selectedId, data: rtdForm });
    setMode("detail");
  }

  if (mode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 rounded-lg"><Map className="w-5 h-5 text-indigo-600" /></div>
            <div><h1 className="text-xl font-semibold text-slate-900">Roadmaps & Projects</h1><p className="text-sm text-slate-500">Monitor strategic, budgetary and regulatory initiatives</p></div>
          </div>
          {(user?.role === "ADMIN" || user?.role === "COMPLIANCE_OFFICER" || user?.role === "PRODUCT_OWNER") && (
            <button onClick={() => { resetForm(); setMode("create"); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"><Plus className="w-4 h-4" /> New Project</button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search projects..." className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="">All statuses</option>
            <option value="ON_TRACK">On Track</option>
            <option value="DEVIATING">Deviating</option>
            <option value="HIGH_RISK">High Risk</option>
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : (
            <>
              {(!listData?.data || listData.data.length === 0) ? (
                <EmptyState icon={Map} title="No projects" description="Create your first project to track roadmap progress." action={(user?.role === "ADMIN" || user?.role === "COMPLIANCE_OFFICER" || user?.role === "PRODUCT_OWNER") ? { label: "New Project", onClick: () => { resetForm(); setMode("create"); } } : undefined} />
              ) : (
                <table className="w-full">
                  <thead><tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Project</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Code</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Manager</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Budget</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">RTD</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Readiness</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {listData.data.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => { setSelectedId(p.id); setMode("detail"); }}>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{p.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-500 font-mono">{p.code}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{p.manager}</td>
                        <td className="px-4 py-3"><span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_BADGE[p.status] || ""}`}>{p.status.replace("_", " ")}</span></td>
                        <td className="px-4 py-3 text-sm text-right text-slate-600">{p.consumedBudget?.toLocaleString()} / {p.initialBudget?.toLocaleString()} k€</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={p.rtdDeviation > 10 ? "text-red-600 font-medium" : "text-slate-600"}>{p.rtdValue}</span>
                        </td>
                        <td className="px-4 py-3 text-center"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${READINESS_BADGE[p.goLiveReadinessState]}`}>{p.goLiveReadinessState}</span></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={e => { e.stopPropagation(); setSelectedId(p.id); setMode("detail"); }} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"><Eye className="w-4 h-4" /></button>
                            {(user?.role === "ADMIN" || user?.role === "COMPLIANCE_OFFICER" || user?.role === "PRODUCT_OWNER") && (
                              <button onClick={e => { e.stopPropagation(); handleEdit(p); }} className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"><Edit3 className="w-4 h-4" /></button>
                            )}
                            {(user?.role === "ADMIN" || user?.role === "COMPLIANCE_OFFICER") && (
                              <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"><Trash2 className="w-4 h-4" /></button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {listData && listData.total > listData.limit && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50">
                  <span className="text-sm text-slate-500">{listData.total} total</span>
                  <div className="flex items-center gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1.5 text-slate-500 hover:text-slate-700 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-sm text-slate-600">Page {page} of {Math.ceil(listData.total / listData.limit)}</span>
                    <button disabled={page >= Math.ceil(listData.total / listData.limit)} onClick={() => setPage(p => p + 1)} className="p-1.5 text-slate-500 hover:text-slate-700 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (mode === "detail" && detail) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => { setMode("list"); setSelectedId(null); }} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /> Back</button>
          <div className="flex items-center gap-2">
            <button onClick={() => { setRtdForm({ reviewMonth: new Date().toISOString().slice(0, 7), declaredRtd: detail.rtdValue, actualConsumed: 0, comments: "" }); setMode("rtd"); }} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"><Clock className="w-4 h-4" /> Submit RTD</button>
            <button onClick={() => handleEdit(detail)} className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"><Edit3 className="w-4 h-4" /> Edit</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{detail.name}</h2>
              <p className="text-sm text-slate-500 mt-1">Code: <span className="font-mono">{detail.code}</span> · Manager: {detail.manager}</p>
            </div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${STATUS_BADGE[detail.status]}`}>{detail.status.replace("_", " ")}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><DollarSign className="w-3.5 h-3.5" /> Budget</div><div className="text-lg font-semibold text-slate-800">{detail.consumedBudget?.toLocaleString()} / {detail.initialBudget?.toLocaleString()} k€</div></div>
            <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><TrendingUp className="w-3.5 h-3.5" /> RTD</div><div className="text-lg font-semibold text-slate-800">{detail.rtdValue}<span className="text-sm font-normal text-slate-500 ml-1">({detail.rtdDeviation > 0 ? "+" : ""}{detail.rtdDeviation}%)</span></div></div>
            <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><AlertTriangle className="w-3.5 h-3.5" /> Slippage</div><div className="text-lg font-semibold text-slate-800">{detail.slippageMd} <span className="text-sm font-normal text-slate-500">days</span></div></div>
            <div className="bg-slate-50 rounded-lg p-4"><div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><CheckCircle className="w-3.5 h-3.5" /> Tests</div><div className="text-lg font-semibold text-slate-800">{detail.testAutomationRate}%</div></div>
          </div>

          <div className="flex items-center gap-2"><span className="text-sm text-slate-500">Go-live readiness:</span><span className={`inline-block px-3 py-0.5 rounded-full text-sm font-medium ${READINESS_BADGE[detail.goLiveReadinessState]}`}>{detail.goLiveReadinessState}</span></div>
        </div>
      </div>
    );
  }

  if (mode === "create" || mode === "edit") {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => { setMode("list"); if (mode === "edit") setSelectedId(null); }} className="p-2 text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-lg font-semibold text-slate-900">{mode === "create" ? "New Project" : "Edit Project"}</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Project Name</label><input value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Code</label><input value={form.code || ""} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Manager</label><input value={form.manager || ""} onChange={e => setForm(f => ({ ...f, manager: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Initial Budget (k€)</label><input type="number" value={form.initialBudget || 0} onChange={e => setForm(f => ({ ...f, initialBudget: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Status</label><select value={form.status || "ON_TRACK"} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">{["ON_TRACK", "DEVIATING", "HIGH_RISK"].map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">RTD Value</label><input type="number" value={form.rtdValue || 0} onChange={e => setForm(f => ({ ...f, rtdValue: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Test Automation %</label><input type="number" min={0} max={100} value={form.testAutomationRate || 0} onChange={e => setForm(f => ({ ...f, testAutomationRate: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Readiness</label><select value={form.goLiveReadinessState || "READY"} onChange={e => setForm(f => ({ ...f, goLiveReadinessState: e.target.value as any }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">{["READY", "RISKY", "BLOCKED"].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Slippage (days)</label><input type="number" value={form.slippageMd || 0} onChange={e => setForm(f => ({ ...f, slippageMd: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setMode("list"); if (mode === "edit") setSelectedId(null); }} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleSave} disabled={!form.name || !form.code} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{mode === "create" ? "Create Project" : "Save Changes"}</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "rtd" && detail) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setMode("detail")} className="p-2 text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-lg font-semibold text-slate-900">RTD Review — {detail.name}</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Review Month</label><input type="month" value={rtdForm.reviewMonth} onChange={e => setRtdForm(f => ({ ...f, reviewMonth: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Declared RTD (man-days)</label><input type="number" value={rtdForm.declaredRtd} onChange={e => setRtdForm(f => ({ ...f, declaredRtd: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Actual Consumed (man-days)</label><input type="number" value={rtdForm.actualConsumed} onChange={e => setRtdForm(f => ({ ...f, actualConsumed: Number(e.target.value) }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Comments</label><textarea value={rtdForm.comments} onChange={e => setRtdForm(f => ({ ...f, comments: e.target.value }))} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setMode("detail")} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleSubmitRtd} disabled={!rtdForm.reviewMonth} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">Submit RTD</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
