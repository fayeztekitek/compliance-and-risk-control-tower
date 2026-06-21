import { nexusRepo } from "../repositories/nexus.repo.js";

export interface NexusHttpConfig {
  url: string;
  username: string;
  token: string;
  timeoutMs: number;
  maxRetries: number;
}

export class NexusHttpClient {
  private config: NexusHttpConfig;
  private logs: string[] = [];

  constructor(config: NexusHttpConfig) {
    this.config = { timeoutMs: 5000, maxRetries: 3, ...config };
  }

  private maskToken(msg: string): string {
    const t = this.config.token;
    if (!t) return msg;
    const masked = t.substring(0, 3) + "******" + t.substring(Math.max(3, t.length - 2));
    return msg.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), masked);
  }

  private log(message: string, isError = false) {
    const ts = new Date().toISOString();
    const line = `[${ts}] ${isError ? "[ERROR]" : "[INFO]"} ${this.maskToken(message)}`;
    this.logs.push(line);
  }

  getMaskedLogs(): string { return this.logs.join("\n"); }
  clearLogs() { this.logs = []; }

  async executeRequest<T>(endpoint: string, method = "GET", body: any = null): Promise<T> {
    const targetUrl = `${this.config.url.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
    this.log(`Initiating ${method} request to ${targetUrl}`);

    const isMock = this.config.url.includes("mock-nexus-server") || this.config.url.includes("soft-security");

    let attempt = 0;
    while (attempt < this.config.maxRetries) {
      attempt++;
      try {
        this.log(`Attempt ${attempt} of ${this.config.maxRetries}`);
        if (isMock) {
          const delay = 400 + Math.random() * 500;
          if (delay > this.config.timeoutMs) throw new Error("SocketTimeoutException: Connection timed out");
          await new Promise(r => setTimeout(r, delay));
          this.log("Request completed (Mock mode)");
          return {} as T;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
        const authHeader = `Basic ${Buffer.from(`${this.config.username}:${this.config.token}`).toString("base64")}`;

        const response = await fetch(targetUrl, {
          method,
          headers: { Authorization: authHeader, Accept: "application/json", "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        const data = await response.json();
        this.log(`Request completed with status ${response.status}`);
        return data as T;
      } catch (err: any) {
        this.log(`Request failed: ${err.message}`, true);
        if (attempt >= this.config.maxRetries) {
          this.log(`Exhausted ${this.config.maxRetries} retries`, true);
          throw err;
        }
        const backoff = Math.pow(2, attempt) * 300;
        this.log(`Waiting ${backoff}ms before retry`);
        await new Promise(r => setTimeout(r, backoff));
      }
    }
    throw new Error(`Request failed for ${endpoint}`);
  }

  async testConnection(): Promise<{ success: boolean; message: string; duration: number }> {
    this.log("Testing connection...");
    const start = Date.now();
    try {
      await this.executeRequest("api/v2/organizations");
      const elapsed = Date.now() - start;
      return { success: true, message: `Connected in ${elapsed}ms`, duration: elapsed };
    } catch (err: any) {
      const elapsed = Date.now() - start;
      return { success: false, message: err.message, duration: elapsed };
    }
  }
}

export async function createClientFromConfig(): Promise<NexusHttpClient> {
  const cfg = await nexusRepo.getConfig();
  if (cfg) {
    return new NexusHttpClient({ url: cfg.url, username: cfg.username, token: cfg.tokenEncrypted || "", timeoutMs: cfg.timeoutMs, maxRetries: cfg.maxRetries });
  }
  return new NexusHttpClient({ url: "https://mock-nexus-server.local/", username: "mock", token: "mock-token" });
}
