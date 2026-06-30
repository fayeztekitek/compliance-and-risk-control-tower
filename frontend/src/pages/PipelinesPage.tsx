import { useState, useEffect } from "react";
import { Play, GitBranch, GitCommit, CheckCircle, XCircle, Clock, AlertTriangle, Loader2, ExternalLink, User, ArrowRight, Shield } from "lucide-react";
import { pipelineApi, PipelineRun, PipelinePolicyGate, PipelineStats } from "../api/pipeline.api";

const STATUS_COLORS: Record<string, string> = {
  success: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300",
  failure: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  cancelled: "bg-slate-100 text-slate-600",
  running: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  pending: "bg-amber-100 text-amber-700",
  skipped: "bg-slate-100 text-slate-500",
  error: "bg-red-100 text-red-700",
};

const SOURCE_ICONS: Record<string, string> = {
  github_actions: "🐙",
  gitlab_ci: "🦊",
  manual: "👤",
};

export default function PipelinesPage() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);
  const [gates, setGates] = useState<PipelinePolicyGate[]>([]);

  function load() {
    setLoading(true);
    Promise.all([
      pipelineApi.list({ limit: 50 }),
      pipelineApi.getStats(),
    ]).then(([r, s]) => {
      setRuns(r.data);
      setStats(s);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function selectRun(run: PipelineRun) {
    setSelectedRun(run);
    try {
      const g = await pipelineApi.getGates(run.id);
      setGates(g);
    } catch { setGates([]); }
  }

  const filtered = runs.filter(r => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return r.project.toLowerCase().includes(q) || r.pipelineName?.toLowerCase().includes(q) || r.branch?.toLowerCase().includes(q);
  });

  const statusDot = (s: string) => {
    const colors: Record<string, string> = { success: "bg-green-500", failure: "bg-red-500", running: "bg-blue-500", pending: "bg-amber-500", cancelled: "bg-slate-400", skipped: "bg-slate-300", error: "bg-red-500" };
    return <span className={`w-2 h-2 rounded-full ${colors[s] || "bg-slate-400"} inline-block`} />;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Play className="w-6 h-6 text-indigo-500" /> CI/CD Pipelines
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track pipeline runs and policy gate evaluations</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Runs</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
          </div>
          {stats.byStatus.slice(0, 3).map(s => (
            <div key={s.status} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.status}</p>
              <p className="text-2xl font-bold mt-1">{s.count}</p>
            </div>
          ))}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
            {stats.bySource.map(s => (
              <div key={s.source} className="text-center">
                <p className="text-lg">{SOURCE_ICONS[s.source] || "?"}</p>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">{s.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-4">
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search by project, pipeline, or branch..."
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
      ) : selectedRun ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <button onClick={() => setSelectedRun(null)} className="text-xs text-indigo-600 hover:text-indigo-800 mb-3 flex items-center gap-1">
            <ArrowRight className="w-3 h-3 rotate-180" /> Back
          </button>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{selectedRun.pipelineName || "Unnamed pipeline"}</h3>
              <p className="text-sm text-slate-500">{selectedRun.project}</p>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[selectedRun.status] || ""}`}>{selectedRun.status}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
            {selectedRun.branch && <div><span className="text-slate-400 text-xs">Branch</span><p className="font-mono text-xs flex items-center gap-1 mt-0.5"><GitBranch className="w-3 h-3" />{selectedRun.branch}</p></div>}
            {selectedRun.commitSha && <div><span className="text-slate-400 text-xs">Commit</span><p className="font-mono text-xs flex items-center gap-1 mt-0.5"><GitCommit className="w-3 h-3" />{selectedRun.commitSha.slice(0, 7)}</p></div>}
            {selectedRun.durationSeconds && <div><span className="text-slate-400 text-xs">Duration</span><p className="font-mono text-xs flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{(selectedRun.durationSeconds / 60).toFixed(1)}m</p></div>}
            {selectedRun.triggerActor && <div><span className="text-slate-400 text-xs">Triggered by</span><p className="text-xs flex items-center gap-1 mt-0.5"><User className="w-3 h-3" />{selectedRun.triggerActor}</p></div>}
          </div>
          {selectedRun.url && (
            <a href={selectedRun.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800">
              <ExternalLink className="w-3 h-3" /> View in {selectedRun.source}
            </a>
          )}

          {gates.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Policy Gates
              </h4>
              <div className="space-y-2">
                {gates.map(g => (
                  <div key={g.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                    <div className="flex items-center gap-2">
                      {g.status === "pass" ? <CheckCircle className="w-4 h-4 text-green-500" /> : g.status === "fail" ? <XCircle className="w-4 h-4 text-red-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{g.gateName}</span>
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      g.status === "pass" ? "bg-green-100 text-green-700" : g.status === "fail" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>{g.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <Play className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-sm font-medium">No pipeline runs yet</p>
          <p className="text-xs mt-1">Configure GitHub/GitLab webhooks to receive pipeline events</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(run => (
            <div key={run.id} onClick={() => selectRun(run)}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-indigo-300 cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">{SOURCE_ICONS[run.source] || "🔷"}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{run.pipelineName || run.project}</p>
                      {statusDot(run.status)}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{run.project}</span>
                      {run.branch && <><span>·</span><GitBranch className="w-3 h-3" />{run.branch}</>}
                      {run.commitSha && <><span>·</span><span className="font-mono">{run.commitSha.slice(0, 7)}</span></>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[run.status] || ""}`}>{run.status}</span>
                  {run.durationSeconds && <span className="text-[10px] text-slate-400">{(run.durationSeconds / 60).toFixed(0)}m</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
