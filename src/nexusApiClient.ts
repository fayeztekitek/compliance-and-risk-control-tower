/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateFullDataset } from "./nexusMockData";

export interface NexusConfig {
  url: string;
  username: string;
  token: string;
  timeoutMs: number;
  maxRetries: number;
}

export class NexusApiClient {
  private config: NexusConfig;
  private technicalLogs: string[] = [];

  constructor(config: NexusConfig) {
    this.config = {
      url: config.url || "https://soft-security:8070/",
      username: config.username || "ftekitek",
      token: config.token || "kvq6XXWn",
      timeoutMs: config.timeoutMs || 5000,
      maxRetries: config.maxRetries || 3
    };
  }

  // Retrieve security masked logs to protect developer secrets in files or terminal screens
  public getMaskedLogs(): string {
    return this.technicalLogs.join("\n");
  }

  public clearLogs() {
    this.technicalLogs = [];
  }

  public log(message: string, isError = false) {
    const timestamp = new Date().toISOString();
    // Mask sensitive username and user tokens
    let sanitizedMsg = message;
    if (this.config.token) {
      const maskedToken = this.config.token.substring(0, 3) + "******" + this.config.token.substring(Math.max(3, this.config.token.length - 2));
      sanitizedMsg = sanitizedMsg.replace(new RegExp(this.config.token, "g"), maskedToken);
    }
    const logLine = `[${timestamp}] ${isError ? "[ERROR]" : "[INFO]"} ${sanitizedMsg}`;
    this.technicalLogs.push(logLine);
    console.log(logLine);
  }

  /**
   * Performs an API request simulation. If the URL points to the local intranet
   * (e.g., soft-security:8070), it will simulate a robust HTTP transport call.
   * If it's a real external endpoint, it runs fetch, with real retries and timeouts!
   */
  public async executeRequest<T>(endpoint: string, method = "GET", body: any = null): Promise<T> {
    const targetUrl = `${this.config.url.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
    this.log(`Initiating ${method} request to URL: ${targetUrl}`);

    let attempt = 0;
    while (attempt < this.config.maxRetries) {
      attempt++;
      try {
        this.log(`Attempt ${attempt} of ${this.config.maxRetries}...`);

        // Check for local simulator domain
        if (this.config.url.includes("soft-security") || this.config.url.includes("mock-nexus-server")) {
          // Simulate network latency with timeout constraint
          const delay = 400 + Math.random() * 500;
          if (delay > this.config.timeoutMs) {
            throw new Error(`SocketTimeoutException: Connection timed out beyond configured threshold of ${this.config.timeoutMs}ms`);
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
          this.log(`Request completed successfully with HTTP status code 200 (Mocked Client Intranet Bypass)`);
          
          // Generate a chunk of mock data matching this specific request
          const dataset = generateFullDataset();
          if (endpoint.includes("organizations")) return dataset.organizations as T;
          if (endpoint.includes("applications")) return dataset.applications as T;
          if (endpoint.includes("reports")) return dataset.scans as T;
          if (endpoint.includes("vulnerabilities")) return dataset.vulnerabilities as T;
          if (endpoint.includes("violations")) return dataset.violations as T;
          if (endpoint.includes("waivers")) return dataset.waivers as T;
          
          return dataset.snapshot as T;
        }

        // Real Network Fetch Call with Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

        const authHeader = `Basic ${Buffer.from(`${this.config.username}:${this.config.token}`).toString("base64")}`;
        const headers: HeadersInit = {
          "Authorization": authHeader,
          "Accept": "application/json",
          "Content-Type": "application/json"
        };

        const response = await fetch(targetUrl, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP Error Status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        this.log(`Request completed successfully with HTTP status code ${response.status}`);
        return data as T;

      } catch (err: any) {
        this.log(`Request failed during execution: ${err?.message || "Unknown Network Error"}`, true);
        if (attempt >= this.config.maxRetries) {
          this.log(`Exhausted all ${this.config.maxRetries} retry attempts for endpoint ${endpoint}. Reporting failure.`, true);
          throw err;
        }
        // Exponential backoff wait
        const backoffTime = Math.pow(2, attempt) * 300;
        this.log(`Waiting ${backoffTime}ms before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }
    }

    throw new Error(`Aggregate HTTP request failure on endpoint ${endpoint}`);
  }

  // Connection validation probe
  public async testConnection(): Promise<{ success: boolean; message: string; duration: number }> {
    this.log("Probing connection status on server gateway...");
    const start = Date.now();
    try {
      // Fetch organizations or ping
      await this.executeRequest("api/v2/organizations");
      const elapsed = Date.now() - start;
      this.log(`Connection test completed in ${elapsed}ms: GATEWAY STABLE`);
      return { success: true, message: `Successfully connected to gateway in ${elapsed}ms`, duration: elapsed };
    } catch (err: any) {
      const elapsed = Date.now() - start;
      const cleanErr = err?.message || "Connection timeout";
      this.log(`Connection test failed in ${elapsed}ms: ${cleanErr}`, true);
      return { success: false, message: `Gate connection failed: ${cleanErr}`, duration: elapsed };
    }
  }
}
