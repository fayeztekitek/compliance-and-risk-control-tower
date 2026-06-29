import { useState, useEffect, useRef, useCallback } from "react";
import { Bot, Sparkles, MessageSquare, Loader2, Send, Command } from "lucide-react";
import { agentsApi, AgentInfo } from "../api/agents.api";

const AGENT_ICONS: Record<string, string> = {
  compliance: "🛡️",
  risk: "⚠️",
  veg: "💼",
};

export default function AiAgentsPage() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("compliance");
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Select an agent to start. I can help with compliance, risk, or VEG governance analysis." },
  ]);
  const [sending, setSending] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    agentsApi.list().then(setAgents).catch(() => {});
  }, []);

  const currentAgent = agents.find(a => a.id === selectedAgent);

  const handleSend = useCallback(async () => {
    if (!query.trim() || sending) return;
    const userMsg = { role: "user" as const, content: query };
    const agentMsg = { role: "assistant" as const, content: "" };
    const newMessages = [...messages, userMsg];
    setMessages([...newMessages, agentMsg]);
    setQuery("");
    setSending(true);

    const msgIndex = newMessages.length;
    setStreamingMsgId(msgIndex);

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
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const { text } = JSON.parse(payload);
            if (text) {
              setMessages(prev => {
                const next = [...prev];
                next[msgIndex] = { ...next[msgIndex], content: next[msgIndex].content + text };
                return next;
              });
            }
          } catch { }
        }
      }
    } catch {
      setMessages(prev => {
        const next = [...prev];
        next[msgIndex] = { role: "assistant", content: "Sorry, I encountered an error. Please try again." };
        return next;
      });
    } finally {
      setSending(false);
      setStreamingMsgId(null);
    }
  }, [query, messages, sending, selectedAgent]);

  function switchAgent(id: string) {
    setSelectedAgent(id);
    setMessages([{ role: "assistant", content: `Switched to the ${agents.find(a => a.id === id)?.name || id}. How can I help you?` }]);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Command className="w-6 h-6 text-indigo-500" /> AI Agents
          </h1>
          <p className="text-sm text-slate-500 mt-1">Specialized agents with live data access — compliance, risk, and governance</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        {agents.map(a => (
          <button key={a.id} onClick={() => switchAgent(a.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
              selectedAgent === a.id
                ? "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-200"
            }`}>
            <span className="text-lg">{a.icon || AGENT_ICONS[a.id] || "🤖"}</span>
            <div className="text-left">
              <p className="text-xs font-semibold">{a.name}</p>
              <p className="text-[10px] opacity-70">{a.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role !== "user" && (
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300"
              }`}>
                {msg.content || (streamingMsgId === i ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null)}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2">
            <input
              type="text" value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder={`Ask the ${currentAgent?.name || "agent"}...`}
              disabled={sending}
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button onClick={handleSend} disabled={sending || !query.trim()}
              className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
