export interface ScannerHttpConfig {
  url: string;
  authHeader: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export class ScannerHttpClient {
  protected config: Required<ScannerHttpConfig>;
  protected logs: string[] = [];

  constructor(config: ScannerHttpConfig) {
    this.config = { timeoutMs: 10000, maxRetries: 3, ...config };
  }

  private sanitize(msg: string): string {
    const sanitized = msg.replace(/(Authorization:\s*)(\S+)/gi, "$1[REDACTED]");
    return sanitized.replace(/(token|secret|password)=([^&\s]+)/gi, "$1=[REDACTED]");
  }

  protected log(message: string, isError = false) {
    const ts = new Date().toISOString();
    this.logs.push(`[${ts}] ${isError ? "[ERROR]" : "[INFO]"} ${this.sanitize(message)}`);
  }

  getMaskedLogs(): string { return this.logs.join("\n"); }
  clearLogs() { this.logs = []; }

  async executeRequest<T>(endpoint: string, method = "GET", body?: unknown, customHeaders?: Record<string, string>): Promise<T> {
    const targetUrl = `${this.config.url.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
    this.log(`Initiating ${method} ${targetUrl}`);

    let attempt = 0;
    while (attempt < this.config.maxRetries) {
      attempt++;
      try {
        this.log(`Attempt ${attempt}/${this.config.maxRetries}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
        const response = await fetch(targetUrl, {
          method,
          headers: { Authorization: this.config.authHeader, Accept: "application/json", "Content-Type": "application/json", ...customHeaders },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        const data = await response.json();
        this.log(`Completed with status ${response.status}`);
        return data as T;
      } catch (err: any) {
        this.log(`Failed: ${err.message}`, true);
        if (attempt >= this.config.maxRetries) { this.log("Exhausted retries", true); throw err; }
        const backoff = Math.pow(2, attempt) * 500;
        this.log(`Backoff ${backoff}ms`);
        await new Promise(r => setTimeout(r, backoff));
      }
    }
    throw new Error(`Request failed for ${endpoint}`);
  }
}
