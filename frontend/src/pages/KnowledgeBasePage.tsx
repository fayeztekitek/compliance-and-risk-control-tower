import { useState, useEffect } from "react";
import { BookOpen, Search, Plus, Loader2, X, FileText, Tag, Clock, Trash2, Brain, RefreshCw } from "lucide-react";
import { knowledgeBaseApi, KbEntry } from "../api/knowledgeBase.api";
import { ragApi, RagResult } from "../api/rag.api";
import { useAuthStore } from "../store/auth.store";

type SearchMode = "keyword" | "semantic";

export default function KnowledgeBasePage() {
  const [mode, setMode] = useState<SearchMode>("keyword");
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [ragResults, setRagResults] = useState<RagResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<KbEntry | RagResult | null>(null);
  const [reembedding, setReembedding] = useState(false);
  const { user } = useAuthStore();
  const [form, setForm] = useState({ title: "", content: "", category: "general", tags: "" });

  const limit = 20;
  const isAdmin = user?.role === "ADMIN";

  function load() {
    setLoading(true);
    setRagResults([]);
    knowledgeBaseApi.list({ page, limit, category: category || undefined, search: mode === "keyword" ? search || undefined : undefined })
      .then(r => { setEntries(r.data); setTotal(r.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [page, category, mode]);

  useEffect(() => {
    knowledgeBaseApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  function handleSearch() {
    if (mode === "semantic" && search.trim()) {
      setLoading(true);
      setEntries([]);
      ragApi.search({ query: search, category: category || undefined, topK: 10 })
        .then(r => { setRagResults(r); setTotal(r.length); })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setPage(1);
      load();
    }
  }

  async function handleReembed() {
    setReembedding(true);
    try { await ragApi.reembedAll(); } catch {}
    setReembedding(false);
  }

  async function handleCreate() {
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    await knowledgeBaseApi.create({ title: form.title, content: form.content, category: form.category, tags });
    setShowCreate(false);
    setForm({ title: "", content: "", category: "general", tags: "" });
    load();
  }

  async function handleDelete(id: string) {
    await knowledgeBaseApi.delete(id);
    setSelected(null);
    load();
  }

  function scoreColor(score: number): string {
    if (score >= 0.7) return "bg-green-100 text-green-700";
    if (score >= 0.4) return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-500";
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" /> Knowledge Base
          </h1>
          <p className="text-sm text-slate-500 mt-1">{total} {mode === "semantic" ? "results" : "documents"}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={handleReembed} disabled={reembedding}
              className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${reembedding ? "animate-spin" : ""}`} /> Re-embed
            </button>
          )}
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Document
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder={mode === "semantic" ? "Semantic search knowledge base..." : "Search knowledge base..."}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button onClick={() => { setMode("keyword"); setRagResults([]); }}
            className={`px-3 py-2 text-xs font-medium transition-colors ${mode === "keyword" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "bg-white dark:bg-slate-800 text-slate-500"}`}>
            <Search className="w-3 h-3 inline mr-1" /> Keyword
          </button>
          <button onClick={() => { setMode("semantic"); setEntries([]); }}
            className={`px-3 py-2 text-xs font-medium transition-colors ${mode === "semantic" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" : "bg-white dark:bg-slate-800 text-slate-500"}`}>
            <Brain className="w-3 h-3 inline mr-1" /> Semantic
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
          ) : mode === "semantic" && ragResults.length > 0 ? (
            ragResults.map(entry => (
              <button key={entry.id} onClick={() => setSelected(entry)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selected?.id === entry.id
                    ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-600"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200"
                }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{entry.title}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${scoreColor(entry.score)}`}>
                        {(entry.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{entry.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">{entry.category}</span>
                      {entry.tags?.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] text-indigo-500 flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" />{t}</span>
                      ))}
                    </div>
                  </div>
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              </button>
            ))
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              {mode === "semantic" && search ? "No relevant results found. Try a different query." : 'No documents yet. Click "Add Document" to create one.'}
            </div>
          ) : entries.map(entry => (
            <button key={entry.id} onClick={() => setSelected(entry)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                selected?.id === entry.id
                  ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-600"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200"
              }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{entry.title}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{entry.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">{entry.category}</span>
                    {entry.tags?.slice(0, 3).map(t => (
                      <span key={t} className="text-[10px] text-indigo-500 flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" />{t}</span>
                    ))}
                  </div>
                </div>
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div className="w-96 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 overflow-y-auto shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{selected.title}</h3>
              <button onClick={() => setSelected(null)}><X className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>
            </div>
            {"score" in selected && (
              <div className="mb-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${scoreColor((selected as RagResult).score)}`}>
                  Relevance: {((selected as RagResult).score * 100).toFixed(0)}%
                </span>
              </div>
            )}
            <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 mb-3">{selected.category}</span>
            {selected.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {selected.tags.map(t => <span key={t} className="text-[10px] text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded">{t}</span>)}
              </div>
            )}
            <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap mb-4">{selected.content}</div>
            {"fileName" in selected && selected.fileName && <p className="text-[10px] text-slate-400 mb-2"><FileText className="w-3 h-3 inline mr-1" />{selected.fileName}</p>}
            <button onClick={() => handleDelete(selected.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        )}
      </div>

      {mode === "keyword" && total > limit && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-50">Previous</button>
          <span className="text-xs text-slate-500">Page {page} of {Math.ceil(total / limit)}</span>
          <button disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 disabled:opacity-50">Next</button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Knowledge Base Document</h2>
            <div className="space-y-3">
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm">
                <option value="general">General</option>
                <option value="governance">Governance</option>
                <option value="policies">Policies</option>
                <option value="standards">Standards</option>
                <option value="procedures">Procedures</option>
                <option value="controls">Controls</option>
                <option value="risks">Risks</option>
                <option value="compliance">Compliance</option>
                <option value="security">Security</option>
                <option value="audit">Audit</option>
              </select>
              <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma-separated)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Content..." rows={8}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm resize-none" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">Cancel</button>
              <button onClick={handleCreate} disabled={!form.title || !form.content} className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-700">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
