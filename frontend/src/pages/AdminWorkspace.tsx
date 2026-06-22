import { useState } from "react";
import { Settings, Plus, ArrowLeft, Activity, Server, UserCheck, UserX, RefreshCw } from "lucide-react";
import { useUserList, useCreateUser, useUpdateUser, useDeleteUser, useActivityLogs, useSystemHealth } from "../hooks/useAdmin";
import { useAuthStore } from "../store/auth.store";
import { SkeletonTable } from "../components/ui/Skeleton";
import EmptyState from "../components/ui/EmptyState";

type ViewMode = "users" | "create-user" | "edit-user" | "activity" | "health";

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700", COMPLIANCE_OFFICER: "bg-indigo-100 text-indigo-700",
  RISK_MANAGER: "bg-amber-100 text-amber-700", SECURITY_MANAGER: "bg-sky-100 text-sky-700",
  PRODUCT_OWNER: "bg-emerald-100 text-emerald-700", AUDITOR: "bg-purple-100 text-purple-700",
  EXECUTIVE_READ_ONLY: "bg-slate-100 text-slate-700",
};

function TabBar({ mode, setMode }: { mode: string; setMode: (v: ViewMode) => void }) {
  const tabs = [
    { key: "users", label: "Users" },
    { key: "activity", label: "Activity Logs" },
    { key: "health", label: "System Health" },
  ];
  return (
    <div className="flex gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setMode(t.key as ViewMode)}
          className={`px-4 py-2 text-sm rounded-lg ${
            mode === t.key ? "bg-indigo-100 text-indigo-700" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminWorkspace() {
  const [mode, setMode] = useState<ViewMode>("users");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const { data: users, isLoading: usersLoading } = useUserList();
  const { data: logs, isLoading: logsLoading } = useActivityLogs();
  const { data: health, isLoading: healthLoading } = useSystemHealth();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "COMPLIANCE_OFFICER", isActive: true });

  const isAdmin = user?.role === "ADMIN";

  if (mode === "users") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 rounded-lg"><Settings className="w-5 h-5 text-white" /></div>
            <div><h1 className="text-xl font-semibold text-slate-900">Administration</h1><p className="text-sm text-slate-500">User management, activity logs, and system health</p></div>
          </div>
          {isAdmin && <button onClick={() => { setForm({ name: "", email: "", password: "", role: "COMPLIANCE_OFFICER", isActive: true }); setMode("create-user"); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"><Plus className="w-4 h-4" /> New User</button>}
        </div>
        <TabBar mode={mode} setMode={setMode} />
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {usersLoading ? <SkeletonTable rows={4} /> : (
            (!users || users.length === 0) ? (
              <EmptyState icon={Settings} title="No users" description="Create users to manage access." action={isAdmin ? { label: "New User", onClick: () => { setForm({ name: "", email: "", password: "", role: "COMPLIANCE_OFFICER", isActive: true }); setMode("create-user"); } } : undefined} />
            ) : (
              <table className="w-full">
                <thead><tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Active</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {(users ?? []).map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{u.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                      <td className="px-4 py-3 text-center"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                      <td className="px-4 py-3 text-center">{u.isActive ? <UserCheck className="w-4 h-4 text-emerald-500 inline" /> : <UserX className="w-4 h-4 text-red-500 inline" />}</td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin && (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => { setForm({ name: u.name, email: u.email, password: "", role: u.role, isActive: u.isActive }); setSelectedId(u.id); setMode("edit-user"); }} className="p-1.5 text-slate-400 hover:text-amber-600 rounded hover:bg-slate-100"><RefreshCw className="w-4 h-4" /></button>
                            <button onClick={() => { if (confirm("Delete user?")) deleteUser.mutate(u.id); }} className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100"><UserX className="w-4 h-4" /></button>
                          </div>
                        )}
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

  if (mode === "activity") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-lg"><Settings className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-xl font-semibold text-slate-900">Administration</h1><p className="text-sm text-slate-500">User management, activity logs, and system health</p></div>
        </div>
        <TabBar mode={mode} setMode={setMode} />
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Activity Logs</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {logsLoading ? <SkeletonTable rows={4} /> : (
            (!logs || logs.length === 0) ? (
              <EmptyState icon={Activity} title="No activity logs" description="User actions will appear here." />
            ) : (
              <div className="divide-y divide-slate-100">
                {(logs ?? []).map((l: any) => (
                  <div key={l.id} className="px-4 py-3 flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800"><span className="font-medium">{l.userId?.slice(0, 8)}</span> {l.action} <span className="text-slate-500">{l.resource}</span></p>
                      {l.details && <p className="text-xs text-slate-500 truncate">{l.details}</p>}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{l.createdAt?.slice(0, 16).replace("T", " ")}</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  if (mode === "health") {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 rounded-lg"><Settings className="w-5 h-5 text-white" /></div>
          <div><h1 className="text-xl font-semibold text-slate-900">Administration</h1><p className="text-sm text-slate-500">User management, activity logs, and system health</p></div>
        </div>
        <TabBar mode={mode} setMode={setMode} />
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">System Health</h2>
        </div>
        {healthLoading ? (
          <SkeletonTable rows={3} />
        ) : health ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-xs text-slate-500 mb-1">Status</div>
              <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${health.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`} /><span className="text-lg font-semibold text-slate-800 capitalize">{health.status}</span></div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-xs text-slate-500 mb-1">Database</div>
              <div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${health.db === "connected" ? "bg-emerald-500" : "bg-red-500"}`} /><span className="text-base font-semibold text-slate-800">{health.db}</span></div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-xs text-slate-500 mb-1">Uptime</div>
              <div className="text-lg font-semibold text-slate-800">{Math.floor(health.uptime / 60)}m {health.uptime % 60}s</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="text-xs text-slate-500 mb-1">Memory</div>
              <div className="text-lg font-semibold text-slate-800">{health.memory}</div>
            </div>
          </div>
        ) : (
          <EmptyState icon={Server} title="Health data unavailable" description="System health endpoint could not be reached." />
        )}
      </div>
    );
  }

  if (mode === "create-user" || mode === "edit-user") {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setMode("users")} className="p-2 text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" /></button>
          <h2 className="text-lg font-semibold text-slate-900">{mode === "create-user" ? "New User" : "Edit User"}</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>
            {mode === "create-user" && <div className="col-span-2"><label className="block text-sm font-medium text-slate-700 mb-1">Password</label><input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" /></div>}
            <div><label className="block text-sm font-medium text-slate-700 mb-1">Role</label><select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">{Object.keys(ROLE_BADGE).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
            <div className="flex items-center gap-3 pt-6"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded border-slate-300" /><label className="text-sm text-slate-700">Active</label></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setMode("users")} className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={async () => {
              if (mode === "create-user") await createUser.mutateAsync(form);
              else if (selectedId) await updateUser.mutateAsync({ id: selectedId, data: { name: form.name, email: form.email, role: form.role, isActive: form.isActive } });
              setMode("users");
            }} disabled={!form.name || !form.email} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">{mode === "create-user" ? "Create" : "Save"}</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
