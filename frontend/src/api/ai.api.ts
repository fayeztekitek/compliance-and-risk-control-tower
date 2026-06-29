import { apiClient } from "./client";

export interface AiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  data: { text: string };
}

export interface AiModel {
  name: string;
  displayName: string;
}

export const aiApi = {
  async chat(messages: AiMessage[], options?: { temperature?: number; maxOutputTokens?: number }) {
    const { data } = await apiClient.post<ChatResponse>("/api/ai/chat", {
      messages,
      ...options,
    });
    return data.data.text;
  },

  chatStream(
    messages: AiMessage[],
    options?: { temperature?: number; maxOutputTokens?: number },
    signal?: AbortSignal,
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const token = localStorage.getItem("auth_token");
    return fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, ...options }),
      signal,
    }).then((res) => {
      if (!res.ok) throw new Error(`Chat request failed: ${res.status}`);
      return res.body!.getReader();
    });
  },

  async listModels() {
    const { data } = await apiClient.get<{ data: AiModel[] }>("/api/ai/models");
    return data.data;
  },
};
