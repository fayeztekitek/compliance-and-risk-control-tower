import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, MessageSquare, Loader2, Bot } from "lucide-react";
import { aiApi, AiMessage, CopilotInfo } from "../api/ai.api";

const COPILOT_ICONS: Record<string, string> = {
  executive: "📊", compliance: "🛡️", security: "🔒", audit: "📋",
  roadmap: "🗺️", veg: "💼", privacy: "🔐", reporting: "📄",
};

export default function CopilotChatPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const [copilot, setCopilot] = useState<CopilotInfo | null>(null);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [streamingIdx, setStreamingIdx] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!type) return;
    aiApi.listCopilots().then(list => {
      const found = list.find(c => c.id === type);
      if (found) {
        setCopilot(found);
        setMessages([{ role: "assistant", content: `Hello! I'm the **${found.label}**. ${found.description}. How can I help you?` }]);
      }
    }).catch(() => {});
  }, [type]);

  const handleSend = useCallback(async () => {
    if (!query.trim() || sending || !type) return;
    const userMsg: AiMessage = { role: "user", content: query };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setQuery("");
    setSending(true);

    const msgIdx = newMessages.length;
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    setStreamingIdx(msgIdx);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const reader = await aiApi.copilotChatStream(type, newMessages, undefined, abort.signal);
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
                next[msgIdx] = { ...next[msgIdx], content: next[msgIdx].content + text };
                return next;
              });
            }
          } catch { }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setMessages(prev => {
        const next = [...prev];
        next[msgIdx] = { role: "assistant", content: "Sorry, I encountered an error. Please try again." };
        return next;
      });
    } finally {
      setSending(false);
      setStreamingIdx(null);
      abortRef.current = null;
    }
  }, [query, messages, sending, type]);

  const icon = COPILOT_ICONS[type || ""] || "🤖";

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/ai")} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-4 h-4 text-slate-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-xl">
            {icon}
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{copilot?.label || "Copilot"}</h1>
            <p className="text-xs text-slate-500">{copilot?.description}</p>
          </div>
        </div>
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
              <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300"
              }`}>
                {msg.content || (streamingIdx === i ? <Loader2 className="w-4 h-4 animate-spin inline" /> : null)}
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
              placeholder={`Ask the ${copilot?.label || "copilot"}...`}
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
