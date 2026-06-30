export interface PageContext {
  page: string;
  pageLabel: string;
  entityId?: string;
  entityType?: string;
  filters?: Record<string, any>;
}

export interface QuickAction {
  label: string;
  prompt: string;
}

export interface ConversationSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  title: string;
  pageContext?: PageContext;
  isArchived: boolean;
}

export const chatbotApi = {
  async getQuickActions(page: string) {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/chatbot/quick-actions?page=${page}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to get quick actions");
    const json = await res.json();
    return json.data as QuickAction[];
  },

  async chatStream(
    messages: { role: string; content: string }[],
    pageContext: PageContext,
    conversationId?: string,
    signal?: AbortSignal,
  ) {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/api/chatbot/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, pageContext, conversationId }),
      signal,
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
    return res.body!.getReader();
  },

  async listConversations(page = 1, limit = 20) {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/chatbot/conversations?page=${page}&limit=${limit}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to list conversations");
    return res.json();
  },

  async getConversation(id: string) {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/chatbot/conversations/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to get conversation");
    const json = await res.json();
    return json.data;
  },

  async deleteConversation(id: string) {
    const token = localStorage.getItem("auth_token");
    await fetch(`/api/chatbot/conversations/${id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },

  async archiveConversation(id: string) {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/chatbot/conversations/${id}/archive`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.json();
  },
};
