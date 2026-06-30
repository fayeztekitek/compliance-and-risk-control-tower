import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Play, Clock, Download, Send, Loader2, FileSpreadsheet, Mail, Calendar } from "lucide-react";
import { reportsApi, ReportInstance, ReportTemplate, ReportSchedule } from "../api/reports.api";

type Tab = "reports" | "templates" | "schedules";

export default function ReportEnginePage() {
  const [tab, setTab] = useState<Tab>("reports");
  const [reports, setReports] = useState<ReportInstance[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [distributing, setDistributing] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([
      reportsApi.listReports(50, 0),
      reportsApi.listTemplates(),
      reportsApi.listSchedules(),
    ]).then(([r, t, s]) => {
      setReports(r);
      setTemplates(t);
      setSchedules(s);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleGenerate(data: { name: string; format: string; templateId?: string; recipients?: string }) {
    await reportsApi.generateReport({
      name: data.name,
      format: data.format,
      templateId: data.templateId,
      recipients: data.recipients?.split(",").map(s => s.trim()).filter(Boolean),
    });
    setShowGenerate(false);
    load();
  }

  async function handleDistribute(id: string) {
    setDistributing(id);
    try {
      const allEmails = ["admin@controltower.local"];
      const result = await reportsApi.distributeReport(id, ["EMAIL"], allEmails);
      alert("Report distributed via email");
    } catch {}
    setDistributing(null);
  }

  const formatBadge = (fmt: string) => {
    const colors: Record<string, string> = { CSV: "bg-green-100 text-green-700", PDF: "bg-red-100 text-red-700", XLSX: "bg-blue-100 text-blue-700", HTML: "bg-purple-100 text-purple-700" };
    return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors[fmt] || "bg-slate-100 text-slate-600"}`}>{fmt}</span>;
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = { COMPLETED: "bg-green-100 text-green-700", FAILED: "bg-red-100 text-red-700", GENERATING: "bg-amber-100 text-amber-700", PENDING: "bg-slate-100 text-slate-600" };
    return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${colors[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" /> Report Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">Generate, schedule, and distribute reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowGenerate(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
            <Play className="w-3.5 h-3.5" /> Generate
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4">
        {(["reports", "templates", "schedules"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-xs font-medium rounded-lg capitalize ${tab === t ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}>
            {t} {t === "templates" && `(${templates.length})`} {t === "schedules" && `(${schedules.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
      ) : tab === "reports" ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          {reports.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">No reports generated yet</p>
              <button onClick={() => setShowGenerate(true)} className="mt-3 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white">Generate Report</button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {reports.map(r => (
                <div key={r.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileSpreadsheet className="w-5 h-5 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {formatBadge(r.format)}
                    {statusBadge(r.status)}
                    {r.status === "COMPLETED" && (
                      <>
                        <a href={reportsApi.getDownloadUrl(r.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button onClick={() => handleDistribute(r.id)} disabled={distributing === r.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 disabled:opacity-50">
                          {distributing === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : tab === "templates" ? (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowNewTemplate(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
              <Plus className="w-3.5 h-3.5" /> Template
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {templates.map(t => (
              <div key={t.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{t.name}</h3>
                {t.description && <p className="text-xs text-slate-500 mt-1">{t.description}</p>}
                <p className="text-[10px] text-slate-400 mt-2">{t.config.sections?.length || 0} sections</p>
                <div className="flex gap-1 mt-3">
                  <button onClick={() => reportsApi.deleteTemplate(t.id).then(load)}
                    className="p-1 rounded text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setShowNewSchedule(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
              <Plus className="w-3.5 h-3.5" /> Schedule
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
            {schedules.map(s => (
              <div key={s.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{s.name}</h3>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.cron}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${s.isEnabled ? "bg-green-500" : "bg-slate-300"}`} />
                </div>
                {s.description && <p className="text-xs text-slate-500 mt-2">{s.description}</p>}
                <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400">
                  {formatBadge(s.format)}
                  {s.recipients?.length > 0 && (
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.recipients.length}</span>
                  )}
                </div>
                {s.lastRunAt && <p className="text-[10px] text-slate-400 mt-2">Last: {new Date(s.lastRunAt).toLocaleString()}</p>}
                <div className="flex gap-1 mt-3">
                  <button onClick={() => reportsApi.deleteSchedule(s.id).then(load)}
                    className="p-1 rounded text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showGenerate && (
        <GenerateModal
          templates={templates}
          onClose={() => setShowGenerate(false)}
          onGenerate={handleGenerate}
        />
      )}

      {showNewTemplate && (
        <NewTemplateModal
          onClose={() => setShowNewTemplate(false)}
          onCreate={() => { setShowNewTemplate(false); load(); }}
        />
      )}

      {showNewSchedule && (
        <NewScheduleModal
          templates={templates}
          onClose={() => setShowNewSchedule(false)}
          onCreate={() => { setShowNewSchedule(false); load(); }}
        />
      )}
    </div>
  );
}

function GenerateModal({ templates, onClose, onGenerate }: {
  templates: ReportTemplate[];
  onClose: () => void;
  onGenerate: (d: { name: string; format: string; templateId?: string; recipients?: string }) => void;
}) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState("HTML");
  const [templateId, setTemplateId] = useState("");
  const [recipients, setRecipients] = useState("");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Generate Report</h2>
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Report name" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
          <select value={format} onChange={e => setFormat(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
            <option value="HTML">HTML</option><option value="CSV">CSV</option><option value="XLSX">XLSX</option><option value="PDF">PDF</option>
          </select>
          <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
            <option value="">No template (raw query)</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="Email recipients (comma-separated)" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">Cancel</button>
          <button onClick={() => onGenerate({ name, format, templateId: templateId || undefined, recipients })} disabled={!name} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50">Generate</button>
        </div>
      </div>
    </div>
  );
}

function NewTemplateModal({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");

  async function handleCreate() {
    await reportsApi.createTemplate({
      name,
      description: description || undefined,
      config: { sections: query ? [{ title: "Data", type: "table", query }] : [] },
    });
    onCreate();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">New Template</h2>
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Template name" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
          <textarea value={query} onChange={e => setQuery(e.target.value)} placeholder="SQL query for data section" rows={4} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600">Cancel</button>
          <button onClick={handleCreate} disabled={!name} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50">Create</button>
        </div>
      </div>
    </div>
  );
}

function NewScheduleModal({ templates, onClose, onCreate }: {
  templates: ReportTemplate[];
  onClose: () => void;
  onCreate: () => void;
}) {
  const [name, setName] = useState("");
  const [cron, setCron] = useState("0 8 * * 1");
  const [format, setFormat] = useState("HTML");
  const [templateId, setTemplateId] = useState("");
  const [recipients, setRecipients] = useState("");

  async function handleCreate() {
    await reportsApi.createSchedule({
      name, cron, format,
      templateId: templateId || undefined,
      recipients: recipients.split(",").map(s => s.trim()).filter(Boolean),
    });
    onCreate();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">New Schedule</h2>
        <div className="space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Schedule name" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
          <input value={cron} onChange={e => setCron(e.target.value)} placeholder="Cron expression" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono" />
          <select value={format} onChange={e => setFormat(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
            <option value="HTML">HTML</option><option value="CSV">CSV</option><option value="XLSX">XLSX</option><option value="PDF">PDF</option>
          </select>
          <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
            <option value="">No template</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="Recipients (comma-separated)" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600">Cancel</button>
          <button onClick={handleCreate} disabled={!name || !cron} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50">Create</button>
        </div>
      </div>
    </div>
  );
}
