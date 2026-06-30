import { useState, useEffect, useCallback } from "react";
import { Bot, Play, Clock, AlertTriangle, CheckCircle, XCircle, Loader2, Sparkles, History, Lightbulb, Eye, EyeOff, Trash2, Send, MessageSquare } from "lucide-react";
import { agentsApi, AgentInfo, AgentRunLog, AgentRecommendation } from "../api/agents.api";

const AGENT_ICONS: Record<string, string> = {
  executive: "📊", compliance: "🛡️", risk: "⚠️", security: "🔒",
  audit: "📋", roadmap: "🗺️", veg: "💼", privacy: "🔐", reporting: "📄",
};

export default function AiAgentsPage() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [runs, setRuns] = useState<AgentRunLog[]>([]);
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [tab, setTab] = useState<"chat" | "runs" | "recommendations">("chat");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [streamingIdx, setStreamingIdx] = useState<number | null>(null);

  useEffect(() => {
    agentsApi.list().then(a => {
      setAgents(a);
      if (a.length && !selectedAgent) setSelectedAgent(a[0].id);
    }).finally(() => setLoading(false));
  }, []);

  const loadData = useCallback(async (agentId: string) => {
    const [r, rec] = await Promise.all([
      agentsApi.getRuns(agentId, 1, 10).catch(() => ({ data: [] as AgentRunLog[], total: 0 })),
      agentsApi.getRecommendations(agentId, false, 1, 10).catch(() => ({ data: [] as AgentRecommendation[], total: 0 })),
    ]);
    setRuns(r.data);
    setRecommendations(rec.data);
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      loadData(selectedAgent);
      setMessages([{ role: "assistant", content: `Hello! I'm the ${agents.find(a => a.id === selectedAgent)?.name || selectedAgent}. Ask me anything or trigger a scheduled run.` }]);
    }
  }, [selectedAgent, loadData, agents]);

  async function handleRun(agentId: string) {
    setRunning(agentId);
    try {
      await agentsApi.runAgent(agentId);
      loadData(agentId);
    } catch { }
    setRunning(null);
  }

  async function handleSend() {
    if (!query.trim() || sending || !selectedAgent) return;
    const userMsg = { role: "user", content: query };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setQuery("");
    setSending(true);
    const idx = newMessages.length;
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    setStreamingIdx(idx);

    try {
      const reader = await agentsApi.chat(selectedAgent, newMessages);
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data: ") || t === "data: [DONE]") continue;
          try {
            const { text } = JSON.parse(t.slice(6));
            if (text) setMessages(prev => { const n = [...prev]; n[idx] = { ...n[idx], content: n[idx].content + text }; return n; });
          } catch { }
        }
      }
    } catch { } finally { setSending(false); setStreamingIdx(null); }
  }

  const selAgent = agents.find(a => a.id === selectedAgent);
  const icon = AGENT_ICONS[selectedAgent || ""] || "🤖";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-indigo-500" /> AI Agents
        </h1>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        {agents.map(a => (
          <button key={a.id} onClick={() => setSelectedAgent(a.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
              selectedAgent === a.id
                ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-200"
            }`}>
            <span>{AGENT_ICONS[a.id] || "🤖"}</span>
            {a.name}
            {a.cronSchedule && <Clock className="w-3 h-3 text-slate-400" />}
          </button>
        ))}
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
          <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-200 dark:border-slate-700">
            <button onClick={() => setTab("chat")} className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${tab === "chat" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              <MessageSquare className="w-3.5 h-3.5 inline mr-1" />Chat
            </button>
            <button onClick={() => setTab("runs")} className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${tab === "runs" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              <History className="w-3.5 h-3.5 inline mr-1" />Runs
            </button>
            <button onClick={() => setTab("recommendations")} className={`px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${tab === "recommendations" ? "border-indigo-500 text-indigo-600 dark:text-indigo-400" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              <Lightbulb className="w-3.5 h-3.5 inline mr-1" />Recommendations ({recommendations.filter(r => !r.isRead).length})
            </button>
            <div className="flex-1" />
            <button onClick={() => selectedAgent && handleRun(selectedAgent)} disabled={running === selectedAgent}
              className="mb-2 flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {running === selectedAgent ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
              {running === selectedAgent ? "Running..." : "Run Agent"}
            </button>
          </div>

          {tab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role !== "user" && <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0"><Sparkles className="w-3.5 h-3.5 text-indigo-600" /></div>}
                    <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300"}`}>
                      {msg.content || (streamingIdx === i ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : null)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2">
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder={`Ask ${selAgent?.name || "agent"}...`} disabled={sending}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
                  <button onClick={handleSend} disabled={sending || !query.trim()}
                    className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"><Send className="w-4 h-4" /></button>
                </div>
              </div>
            </>
          )}

          {tab === "runs" && (
            <div className="flex-1 overflow-y-auto p-4">
              {runs.length === 0 ? <p className="text-xs text-slate-400 text-center py-8">No runs yet. Click "Run Agent" to start.</p> : runs.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 mb-2">
                  {r.status === "completed" ? <CheckCircle className="w-4 h-4 text-green-500 shrink-0" /> :
                   r.status === "failed" ? <XCircle className="w-4 h-4 text-red-500 shrink-0" /> :
                   <Loader2 className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{r.triggerType} run</p>
                    <p className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleString()}{r.durationMs ? ` · ${(r.durationMs / 1000).toFixed(1)}s` : ""}</p>
                  </div>
                  {r.errorMessage && <p className="text-[10px] text-red-400 truncate max-w-[200px]">{r.errorMessage}</p>}
                </div>
              ))}
            </div>
          )}

          {tab === "recommendations" && (
            <div className="flex-1 overflow-y-auto p-4">
              {recommendations.length === 0 ? <p className="text-xs text-slate-400 text-center py-8">No recommendations yet.</p> : recommendations.map(r => (
                <div key={r.id} className={`p-3 rounded-lg mb-2 border ${r.isRead ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" : "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-600"}`}>
                  <div className="flex items-start gap-2">
                    {r.severity === "critical" || r.severity === "high" ? <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /> : <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-white">{r.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{r.description}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!r.isRead && (
                        <button onClick={() => agentsApi.markRead(r.id).then(() => setRecommendations(prev => prev.map(x => x.id === r.id ? { ...x, isRead: true } : x)))}
                          className="p-1 rounded text-slate-400 hover:text-indigo-500"><Eye className="w-3.5 h-3.5" /></button>
                      )}
                      <button onClick={() => agentsApi.dismiss(r.id).then(() => setRecommendations(prev => prev.filter(x => x.id !== r.id)))}
                        className="p-1 rounded text-slate-400 hover:text-red-500"><XCircle className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
