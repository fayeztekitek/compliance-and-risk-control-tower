import { nexusRepo } from "../repositories/nexus.repo.js";
import http from "http";
import https from "https";

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
    this.config = { timeoutMs: 60000, maxRetries: 2, ...config };
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

  private async nodeFetch(url: string, options: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    timeoutMs: number;
  }): Promise<{ status: number; statusText: string; data: any }> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const httpModule = parsedUrl.protocol === "https:" ? https : http;
      let settled = false;

      const req = httpModule.request(url, {
        method: options.method,
        headers: options.headers,
        timeout: options.timeoutMs,
        rejectUnauthorized: false,
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          if (settled) return;
          settled = true;
          const raw = Buffer.concat(chunks).toString();
          let data: any = raw;
          try { data = raw ? JSON.parse(raw) : null; } catch { /* keep raw string */ }
          resolve({ status: res.statusCode || 0, statusText: res.statusMessage || "", data });
        });
      });

      req.on("error", (err) => {
        if (settled) return;
        settled = true;
        reject(err);
      });
      req.on("timeout", () => {
        if (settled) return;
        settled = true;
        req.destroy();
        reject(new Error("Connection timed out"));
      });

      if (options.body) req.write(options.body);
      req.end();
    });
  }

  async executeRequest<T>(endpoint: string, method = "GET", body: any = null): Promise<T> {
    const targetUrl = `${this.config.url.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
    this.log(`Initiating ${method} request to ${targetUrl}`);

    let attempt = 0;
    while (attempt < this.config.maxRetries) {
      attempt++;
      try {
        this.log(`Attempt ${attempt} of ${this.config.maxRetries}`);

        const authHeader = `Basic ${Buffer.from(`${this.config.username}:${this.config.token}`).toString("base64")}`;

        const res = await this.nodeFetch(targetUrl, {
          method,
          headers: { Authorization: authHeader, Accept: "application/json", "Content-Type": "application/json" },
          body: body ? JSON.stringify(body) : undefined,
          timeoutMs: this.config.timeoutMs,
        });

        if (res.status < 200 || res.status >= 300) {
          throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
        }
        this.log(`Request completed with status ${res.status}`);
        return res.data as T;
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
  throw new Error("Nexus IQ configuration not found. Please configure Nexus IQ server URL, username, and token in the settings.");
}

export function createClientFromCredentials(creds: { url: string; username: string; token: string }): NexusHttpClient {
  return new NexusHttpClient({
    url: creds.url,
    username: creds.username || "admin",
    token: creds.token || "",
  });
}
