import { useState } from "react";
import { usePolicyRuleList, useCreatePolicyRule, useUpdatePolicyRule, useDeletePolicyRule } from "../hooks/usePolicyRule";
import { useUIStore } from "../store/ui.store";
import { SkeletonTable } from "../components/ui/Skeleton";

type ViewMode = "list" | "create" | "edit";

const THREAT_LEVELS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

const threatBadge = (level: string) => {
  const colors: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800",
    HIGH: "bg-orange-100 text-orange-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    LOW: "bg-blue-100 text-blue-800",
  };
  return `px-2 py-0.5 rounded text-xs font-medium ${colors[level] || "bg-slate-100 text-slate-600"}`;
};

export default function PolicyRuleWorkspace() {
  const [mode, setMode] = useState<ViewMode>("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [filterThreat, setFilterThreat] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = usePolicyRuleList(
    filterThreat ? { threatLevel: filterThreat, category: filterCategory || undefined } :
    filterCategory ? { category: filterCategory } : undefined
  );
  const createRule = useCreatePolicyRule();
  const updateRule = useUpdatePolicyRule();
  const deleteRule = useDeletePolicyRule();

  const [form, setForm] = useState({ policyId: "", name: "", threatLevel: "MEDIUM", category: "", description: "" });

  const resetForm = () => setForm({ policyId: "", name: "", threatLevel: "MEDIUM", category: "", description: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create") {
      createRule.mutate(form, { onSuccess: () => { setMode("list"); resetForm(); } });
    } else if (mode === "edit" && editId) {
      const payload: any = {};
      if (form.name) payload.name = form.name;
      if (form.threatLevel) payload.threatLevel = form.threatLevel;
      if (form.category !== undefined) payload.category = form.category || undefined;
      if (form.description !== undefined) payload.description = form.description || undefined;
      updateRule.mutate({ id: editId, data: payload }, { onSuccess: () => { setMode("list"); setEditId(null); resetForm(); } });
    }
  };

  const startEdit = (rule: any) => {
    setEditId(rule.id);
    setForm({ policyId: rule.policy_id, name: rule.name, threatLevel: rule.threat_level, category: rule.category || "", description: rule.description || "" });
    setMode("edit");
  };

  if (isLoading) return <SkeletonTable />;

  const categories = [...new Set((data || []).map(r => r.category).filter(Boolean))] as string[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Policy Rules</h1>
        {mode === "list" && (
          <button onClick={() => { resetForm(); setMode("create"); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            + New Rule
          </button>
        )}
        {mode !== "list" && (
          <button onClick={() => { setMode("list"); setEditId(null); resetForm(); }} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Back
          </button>
        )}
      </div>

      {mode === "list" && (
        <>
          <div className="flex gap-3">
            <select value={filterThreat} onChange={e => setFilterThreat(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" aria-label="Filter by threat level">
              <option value="">All Threat Levels</option>
              {THREAT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" aria-label="Filter by category">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {!data?.length ? (
            <div className="text-center py-12 text-slate-500">No policy rules found.</div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full" role="table">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Policy ID</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Threat Level</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono text-slate-600">{rule.policy_id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{rule.name}</td>
                      <td className="px-4 py-3"><span className={threatBadge(rule.threat_level)}>{rule.threat_level}</span></td>
                      <td className="px-4 py-3 text-sm text-slate-600">{rule.category || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEdit(rule)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium" aria-label={`Edit ${rule.name}`}>Edit</button>
                          <button onClick={() => setDeleteConfirm(rule.id)} className="text-xs text-red-600 hover:text-red-800 font-medium" aria-label={`Delete ${rule.name}`}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {deleteConfirm && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Confirm delete">
              <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Policy Rule?</h3>
                <p className="text-sm text-slate-600 mb-4">This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button onClick={() => { deleteRule.mutate(deleteConfirm); setDeleteConfirm(null); }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {(mode === "create" || mode === "edit") && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Policy ID</label>
            <input type="text" value={form.policyId} onChange={e => setForm(f => ({ ...f, policyId: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required disabled={mode === "edit"} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Threat Level</label>
            <select value={form.threatLevel} onChange={e => setForm(f => ({ ...f, threatLevel: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm">
              {THREAT_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <input type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" rows={3} />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            {mode === "create" ? "Create Rule" : "Update Rule"}
          </button>
        </form>
      )}
    </div>
  );
}
