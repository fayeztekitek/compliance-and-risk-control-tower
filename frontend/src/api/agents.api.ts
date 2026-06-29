export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const agentsApi = {
  async list() {
    const token = localStorage.getItem("auth_token");
    const res = await fetch("/api/ai/agents", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Failed to list agents");
    const json = await res.json();
    return json.data as AgentInfo[];
  },

  async chat(agentType: string, messages: { role: string; content: string }[]) {
    const token = localStorage.getItem("auth_token");
    const res = await fetch(`/api/ai/agents/${agentType}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(`Agent chat failed: ${res.status}`);
    return res.body!.getReader();
  },
};
