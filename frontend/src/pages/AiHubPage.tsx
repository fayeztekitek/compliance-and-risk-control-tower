import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Command, Sparkles, BookOpen, Bot, Loader2, ArrowRight } from "lucide-react";
import { aiApi, CopilotInfo } from "../api/ai.api";

const COPILOT_ICONS: Record<string, string> = {
  executive: "📊", compliance: "🛡️", security: "🔒", audit: "📋",
  roadmap: "🗺️", veg: "💼", privacy: "🔐", reporting: "📄",
};

export default function AiHubPage() {
  const navigate = useNavigate();
  const [copilots, setCopilots] = useState<CopilotInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aiApi.listCopilots().then(setCopilots).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Command className="w-6 h-6 text-indigo-500" /> AI Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">Choose a specialized copilot or explore AI tools</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate("/ai/agents")} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50">
            <Bot className="w-3.5 h-3.5" /> Agents
          </button>
          <button onClick={() => navigate("/ai/prompts")} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50">
            <BookOpen className="w-3.5 h-3.5" /> Prompt Library
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {copilots.map(cp => (
            <button key={cp.id} onClick={() => navigate(`/ai/copilot/${cp.id}`)}
              className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 text-left hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md transition-all">
              <div className="text-3xl mb-3">{COPILOT_ICONS[cp.id] || cp.icon}</div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{cp.label}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{cp.description}</p>
              <div className="mt-3 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Open <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/5 dark:to-purple-500/5 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Need a general assistant?</p>
            <p className="text-xs text-slate-500">Use the AI Assistant for general GRC questions, or pick a specialized copilot above.</p>
          </div>
          <button onClick={() => navigate("/ai/general")} className="ml-auto shrink-0 px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            Open Assistant
          </button>
        </div>
      </div>
    </div>
  );
}
