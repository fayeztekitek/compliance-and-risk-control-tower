import { useState, useRef, useCallback, useEffect } from "react";
import {
  MessageSquare, X, Send, Loader2, Sparkles, History, ChevronDown, Trash2, PanelRight
} from "lucide-react";
import { useChatbotStore } from "../../store/chatbot.store";
import { usePageContextStore } from "../../store/pageContext.store";
import { chatbotApi, QuickAction, ConversationSummary } from "../../api/chatbot.api";

export default function ChatbotWidget() {
  const { isOpen, toggle, unreadCount } = useChatbotStore();
  const { pageContext } = usePageContextStore();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "Hi! I'm your context-aware assistant. Ask me about this page or any GRC topic." },
  ]);
  const [sending, setSending] = useState(false);
  const [convId, setConvId] = useState<string | undefined>();
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [streamingIdx, setStreamingIdx] = useState<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const msgsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatbotApi.getQuickActions(pageContext.page).then(setQuickActions).catch(() => {});
  }, [pageContext.page]);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async (prompt?: string) => {
    const text = (prompt || query).trim();
    if (!text || sending) return;

    const userMsg = { role: "user" as const, content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setQuery("");
    setSending(true);

    const idx = newMessages.length;
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);
    setStreamingIdx(idx);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const reader = await chatbotApi.chatStream(newMessages, pageContext, convId, abort.signal);
      const decoder = new TextDecoder();
      let buffer = "";
      let newConvId = convId;

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
            const parsed = JSON.parse(payload);
            if (parsed.conversationId && !newConvId) {
              newConvId = parsed.conversationId;
              setConvId(newConvId);
            }
            if (parsed.text) {
              setMessages(prev => {
                const next = [...prev];
                next[idx] = { ...next[idx], content: next[idx].content + parsed.text };
                return next;
              });
            }
          } catch { }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
    } finally {
      setSending(false);
      setStreamingIdx(null);
      abortRef.current = null;
    }
  }, [query, messages, sending, convId, pageContext]);

  function handleQuickAction(action: QuickAction) {
    handleSend(action.prompt);
  }

  async function loadHistory() {
    setShowHistory(!showHistory);
    if (!showHistory) {
      setChatsLoading(true);
      try {
        const result = await chatbotApi.listConversations();
        setConversations(result.data);
      } catch { }
      setChatsLoading(false);
    }
  }

  async function resumeConversation(c: ConversationSummary) {
    setConvId(c.id);
    setShowHistory(false);
    setChatsLoading(true);
    try {
      const conv = await chatbotApi.getConversation(c.id);
      setMessages(conv.messages);
    } catch { }
    setChatsLoading(false);
  }

  async function deleteConversation(id: string) {
    await chatbotApi.deleteConversation(id);
    setConversations(prev => prev.filter(c => c.id !== id));
  }

  return (
    <>
      <button onClick={toggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center">
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[600px] max-h-[calc(100vh-160px)] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Assistant</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                {pageContext.pageLabel}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={loadHistory} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                <History className="w-4 h-4" />
              </button>
              <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showHistory ? (
            <div className="flex-1 overflow-y-auto p-3">
              <p className="text-xs font-medium text-slate-500 mb-2">Recent Conversations</p>
              {chatsLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-500" /></div>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No conversations yet</p>
              ) : conversations.map(c => (
                <div key={c.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer group"
                  onClick={() => resumeConversation(c)}>
                  <PanelRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">{c.title}</p>
                  <button onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}
                    className="p-1 rounded text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button onClick={() => { setConvId(undefined); setMessages([{ role: "assistant", content: "Hi! I'm your context-aware assistant. Ask me about this page or any GRC topic." }]); setShowHistory(false); }}
                className="w-full mt-2 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors">
                + New Conversation
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                    {msg.role !== "user" && (
                      <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300"
                    }`}>
                      {msg.content || (streamingIdx === i ? <Loader2 className="w-3 h-3 animate-spin inline" /> : null)}
                    </div>
                  </div>
                ))}
                <div ref={msgsEndRef} />

                {!sending && messages.length === 1 && quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {quickActions.map(qa => (
                      <button key={qa.label} onClick={() => handleQuickAction(qa)}
                        className="px-2.5 py-1.5 text-[10px] font-medium rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                        {qa.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 p-3 shrink-0">
                <div className="flex items-center gap-2">
                  <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="Ask about this page..."
                    disabled={sending}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
                  <button onClick={() => handleSend()} disabled={sending || !query.trim()}
                    className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 shrink-0">
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
