import { useState, useEffect } from "react";
import { BookOpen, Search, Plus, Star, StarOff, Trash2, Copy, Clock, Sparkles, Filter, X } from "lucide-react";
import { promptsApi, Prompt, PromptCategory, PromptDomain } from "../api/prompts.api";

const CATEGORY_ICONS: Record<string, string> = {
  analysis: "🔍", report: "📊", checklist: "✅", review: "👁️", general: "📝",
};

export default function PromptLibraryPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [domain, setDomain] = useState("");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [domains, setDomains] = useState<PromptDomain[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({ title: "", content: "", category: "general", domain: "", tags: "" });

  const limit = 20;

  async function loadPrompts() {
    setLoading(true);
    try {
      const { data } = await promptsApi.list({ page, limit, search: search || undefined, category: category || undefined, domain: domain || undefined, favoriteOnly: favoriteOnly || undefined });
      setPrompts(data.data);
      setTotal(data.total);
    } catch { } finally { setLoading(false); }
  }

  async function loadMeta() {
    try {
      const [catRes, domRes] = await Promise.all([promptsApi.getCategories(), promptsApi.getDomains()]);
      setCategories(catRes.data.data);
      setDomains(domRes.data.data);
    } catch { }
  }

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { loadPrompts(); }, [page, category, domain, favoriteOnly]);

  function handleSearch() { setPage(1); loadPrompts(); }

  async function handleCreate() {
    if (!form.title || !form.content) return;
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (editId) {
      await promptsApi.update(editId, { title: form.title, content: form.content, category: form.category, domain: form.domain || undefined, tags });
    } else {
      await promptsApi.create({ title: form.title, content: form.content, category: form.category, domain: form.domain || undefined, tags });
    }
    setShowCreate(false); setEditId(null); setForm({ title: "", content: "", category: "general", domain: "", tags: "" });
    loadPrompts(); loadMeta();
  }

  async function handleEdit(p: Prompt) {
    setForm({ title: p.title, content: p.content, category: p.category, domain: p.domain || "", tags: p.tags.join(", ") });
    setEditId(p.id); setShowCreate(true);
  }

  async function handleDelete(id: string) {
    await promptsApi.delete(id);
    loadPrompts(); loadMeta();
  }

  async function handleToggleFavorite(id: string) {
    await promptsApi.toggleFavorite(id);
    loadPrompts();
  }

  async function handleUse(p: Prompt) {
    await promptsApi.incrementUsage(p.id);
    setPrompts(prev => prev.map(x => x.id === p.id ? { ...x, usageCount: x.usageCount + 1 } : x));
  }

  function handleCopy(p: Prompt) {
    navigator.clipboard.writeText(p.content);
    handleUse(p);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" /> Prompt Library
          </h1>
          <p className="text-sm text-slate-500 mt-1">Reusable prompts for compliance, risk, security, audit, and governance — {total} total</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ title: "", content: "", category: "general", domain: "", tags: "" }); setShowCreate(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> New Prompt
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">{editId ? "Edit Prompt" : "New Prompt"}</h3>
            <button onClick={() => { setShowCreate(false); setEditId(null); }}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <input type="text" placeholder="Title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700" />
          <textarea placeholder="Prompt content *" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={4}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700" />
          <div className="grid grid-cols-3 gap-3">
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700">
              <option value="general">General</option>
              <option value="analysis">Analysis</option>
              <option value="report">Report</option>
              <option value="checklist">Checklist</option>
              <option value="review">Review</option>
            </select>
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700">
              <option value="">All Domains</option>
              <option value="compliance">Compliance</option>
              <option value="risk">Risk</option>
              <option value="security">Security</option>
              <option value="audit">Audit</option>
              <option value="veg">VEG</option>
            </select>
            <input type="text" placeholder="Tags (comma-separated)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700" />
          </div>
          <button onClick={handleCreate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
            {editId ? "Update" : "Create"}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search prompts..." value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700" />
          </div>
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.category} value={c.category}>{CATEGORY_ICONS[c.category] || "📝"} {c.category} ({c.count})</option>)}
          </select>
          <select value={domain} onChange={e => { setDomain(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-700">
            <option value="">All Domains</option>
            {domains.map(d => <option key={d.domain} value={d.domain}>{d.domain} ({d.count})</option>)}
          </select>
          <button onClick={() => { setFavoriteOnly(!favoriteOnly); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${favoriteOnly ? "bg-amber-50 border-amber-300 text-amber-700" : "border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
            <Star className="w-3.5 h-3.5" /> Favorites
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
              <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-full mb-2" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-400">No prompts found</h3>
          <p className="text-sm text-slate-400 mt-1">{favoriteOnly ? "No favorited prompts yet." : "Create your first prompt to get started."}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prompts.map(p => (
              <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors group">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[p.category] || "📝"}</span>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleCopy(p)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Copy"><Copy className="w-3.5 h-3.5 text-slate-400" /></button>
                    <button onClick={() => handleEdit(p)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Edit"><Filter className="w-3.5 h-3.5 text-slate-400" /></button>
                    <button onClick={() => handleToggleFavorite(p.id)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Toggle favorite">
                      {p.isFavorite ? <Star className="w-3.5 h-3.5 text-amber-400" /> : <StarOff className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900" title="Delete"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{p.content}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {p.domain && <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">{p.domain}</span>}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-500">{p.category}</span>
                  {p.tags.slice(0, 3).map(t => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400">#{t}</span>)}
                  <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-1"><Clock className="w-3 h-3" />{p.usageCount}</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40">Previous</button>
              <span className="text-slate-500">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
