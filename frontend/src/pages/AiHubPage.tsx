import { useState, useRef, useCallback } from "react";
import { Command, Send, Bot, Sparkles, BookOpen, MessageSquare, Loader2 } from "lucide-react";
import { aiApi, AiMessage } from "../api/ai.api";

export default function AiHubPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: "assistant", content: "Hello! I'm your GRC Copilot. Ask me about compliance posture, security vulnerabilities, deal status, or any governance question." },
  ]);
  const [sending, setSending] = useState(false);
  const [streamingMsgId, setStreamingMsgId] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSend = useCallback(async () => {
    if (!query.trim() || sending) return;
    const userMsg: AiMessage = { role: "user", content: query };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setQuery("");
    setSending(true);

    const msgIndex = newMessages.length;
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    setStreamingMsgId(msgIndex);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const reader = await aiApi.chatStream(newMessages, undefined, abort.signal);
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
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setMessages(prev => {
        const next = [...prev];
        next[msgIndex] = { role: "assistant", content: "Sorry, I encountered an error processing your request. Please try again." };
        return next;
      });
    } finally {
      setSending(false);
      setStreamingMsgId(null);
      abortRef.current = null;
    }
  }, [query, messages, sending]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Command className="w-6 h-6 text-indigo-500" /> AI Assistant
          </h1>
          <p className="text-sm text-slate-500 mt-1">Your intelligent GRC copilot — ask anything about your governance posture</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50">
            <Bot className="w-3.5 h-3.5" /> Agents
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50">
            <BookOpen className="w-3.5 h-3.5" /> Prompt Library
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
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
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about compliance, risks, vulnerabilities, deals..."
              disabled={sending}
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button onClick={handleSend} disabled={sending || !query.trim()}
              className="p-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Responses are generated by AI. Verify critical information against source dashboards.</p>
        </div>
      </div>
    </div>
  );
}
