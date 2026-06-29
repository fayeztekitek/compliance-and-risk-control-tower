import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Command, ArrowRight, Loader2 } from "lucide-react";
import { globalSearch, SearchResultItem } from "../../api/search.api";

const TYPE_ICONS: Record<string, string> = {
  "VEG Deal": "💰", "VEG Request": "📋", "Vulnerability": "🐛", "CVE": "🔒",
  "Project": "📊", "Organization": "🏢", "Application": "💻", "Audit": "📝",
  "Committee": "👥", "SaaS": "☁️", "User": "👤",
};

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await globalSearch(query);
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => { setSelectedIndex(0); }, [results]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex].path);
      onClose();
    }
    if (e.key === "Escape") onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search deals, vulnerabilities, projects, users, audits..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
          />
          {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-400">
            <Command className="w-3 h-3" />K
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
          {query.trim().length < 2 ? (
            <div className="px-3 py-8 text-center text-sm text-slate-400">Type at least 2 characters to search</div>
          ) : results.length === 0 && !loading ? (
            <div className="px-3 py-8 text-center text-sm text-slate-400">No results found</div>
          ) : (
            results.map((r, i) => {
              const isSelected = i === selectedIndex;
              return (
                <button
                  key={r.type + r.id}
                  onClick={() => { navigate(r.path); onClose(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isSelected ? "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <span className="text-base shrink-0">{TYPE_ICONS[r.type] || "📄"}</span>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{r.label}</span>
                      {r.badge && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 shrink-0">{r.badge}</span>}
                    </div>
                    {r.sublabel && <p className="text-[11px] text-slate-400 truncate">{r.sublabel}</p>}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide shrink-0">{r.type}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-slate-300" />
                </button>
              );
            })
          )}
        </div>
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" /> navigate</span>
            <span className="flex items-center gap-1"><kbd className="px-1 rounded bg-slate-100 dark:bg-slate-700">esc</kbd> close</span>
            <span className="flex-1 text-right">{results.length} results</span>
          </div>
        )}
      </div>
    </div>
  );
}
