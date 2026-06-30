import { useState, useEffect } from "react";
import { Settings, Plus, ArrowLeft, Activity, Server, UserCheck, UserX, RefreshCw, Users, Shield, Loader2 } from "lucide-react";
import { useAuthStore } from "../store/auth.store";
import { adminApi, Team, AuditEntry } from "../api/admin.api";

type ViewMode = "users" | "create-user" | "edit-user" | "activity" | "health" | "teams" | "audit";

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700", COMPLIANCE_OFFICER: "bg-indigo-100 text-indigo-700",
  RISK_MANAGER: "bg-amber-100 text-amber-700", SECURITY_MANAGER: "bg-sky-100 text-sky-700",
  PRODUCT_OWNER: "bg-emerald-100 text-emerald-700", AUDITOR: "bg-purple-100 text-purple-700",
  EXECUTIVE_READ_ONLY: "bg-slate-100 text-slate-700",
};

function StatusBadge({ status }: { status: string }) {
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{status}</span>;
}

export default function AdminWorkspace() {
  const [mode, setMode] = useState<ViewMode>("users");
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [auditStats, setAuditStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([
      adminApi.listUsers(),
      adminApi.listTeams(),
      adminApi.listAuditLogs({ limit: 50 }),
      adminApi.getAuditStats(),
    ]).then(([u, t, a, s]) => {
      setUsers(u);
      setTeams(t);
      setAuditLogs(a.data);
      setAuditStats(s);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function openTeam(team: Team) {
    setSelectedTeam(team);
    try { const members = await adminApi.getTeamMembers(team.id); setTeamMembers(members); } catch { setTeamMembers([]); }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-500" /> Administration
        </h1>
        <div className="flex gap-1">
          {(["users", "teams", "audit", "health"] as ViewMode[]).map(t => (
            <button key={t} onClick={() => setMode(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${mode === t ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
              {t === "users" && <UserCheck className="w-3 h-3 inline mr-1" />}
              {t === "teams" && <Users className="w-3 h-3 inline mr-1" />}
              {t === "audit" && <Shield className="w-3 h-3 inline mr-1" />}
              {t === "health" && <Server className="w-3 h-3 inline mr-1" />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
      ) : mode === "users" ? (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowCreateUser(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
              <Plus className="w-3.5 h-3.5" /> User
            </button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-white">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ROLE_BADGE[u.role] || ""}`}>{u.role}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : mode === "teams" ? (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowCreateTeam(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
              <Plus className="w-3.5 h-3.5" /> Team
            </button>
          </div>
          {teams.length === 0 ? (
            <div className="text-center py-12 text-slate-400"><Users className="w-10 h-10 mx-auto mb-2 opacity-50" /><p className="text-sm">No teams created yet</p></div>
          ) : selectedTeam ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <button onClick={() => setSelectedTeam(null)} className="text-xs text-indigo-600 mb-3 flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Back</button>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{selectedTeam.name}</h3>
                  {selectedTeam.description && <p className="text-sm text-slate-500">{selectedTeam.description}</p>}
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${selectedTeam.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>{selectedTeam.isActive ? "Active" : "Inactive"}</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Members ({teamMembers.length})</h4>
              <div className="space-y-2">
                {teamMembers.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    <div>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{m.user_name}</p>
                      <p className="text-xs text-slate-400">{m.user_email} · {m.user_role}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {teams.map(t => (
                <div key={t.id} onClick={() => openTeam(t)}
                  className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-indigo-300 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{t.name}</h3>
                    <div className={`w-2 h-2 rounded-full ${t.isActive ? "bg-green-500" : "bg-slate-300"}`} />
                  </div>
                  {t.description && <p className="text-xs text-slate-500">{t.description}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : mode === "audit" ? (
        <div>
          {auditStats && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-xs text-slate-500">Total Events</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{auditStats.total}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-xs text-slate-500">Top Action</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{auditStats.byAction?.[0]?.action || "-"}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-xs text-slate-500">Unique Actions</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{auditStats.byAction?.length || 0}</p>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500">
                <th className="px-4 py-3 text-left font-medium">Time</th>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium">Resource</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {auditLogs.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{e.userName || e.userId?.slice(0, 8) || "-"}</td>
                    <td className="px-4 py-3 text-xs font-mono text-indigo-600">{e.action}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{e.resourceType}{e.resourceId ? `/${e.resourceId.slice(0, 8)}` : ""}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${e.statusCode && e.statusCode < 400 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{e.statusCode || "-"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Server className="w-4 h-4" /> System Health</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50"><span className="text-slate-400">Database</span><p className="font-semibold text-green-600 mt-1">Connected</p></div>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50"><span className="text-slate-400">Uptime</span><p className="font-semibold text-slate-800 dark:text-white mt-1">{Math.floor(process.uptime?.() || 0 / 3600)}h</p></div>
          </div>
        </div>
      )}

      {showCreateUser && <CreateUserModal onClose={() => setShowCreateUser(false)} onCreate={() => { setShowCreateUser(false); load(); }} />}
      {showCreateTeam && <CreateTeamModal onClose={() => setShowCreateTeam(false)} onCreate={() => { setShowCreateTeam(false); load(); }} />}
    </div>
  );
}

function CreateUserModal({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EXECUTIVE_READ_ONLY");
  async function handleCreate() { await adminApi.createUser({ name, email, password, role }); onCreate(); }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">New User</h2>
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
          <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
            {Object.keys(ROLE_BADGE).map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600">Cancel</button>
          <button onClick={handleCreate} disabled={!name || !email || !password} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50">Create</button>
        </div>
      </div>
    </div>
  );
}

function CreateTeamModal({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  async function handleCreate() { await adminApi.createTeam({ name, description: description || undefined }); onCreate(); }
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">New Team</h2>
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Team name" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600">Cancel</button>
          <button onClick={handleCreate} disabled={!name} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50">Create</button>
        </div>
      </div>
    </div>
  );
}
