import { ScannerHttpClient } from "./scannerHttpClient.js";

export interface SonarqubeProject {
  key: string;
  name: string;
  qualifier: string;
  lastAnalysisDate?: string;
}

export interface SonarqubeIssue {
  key: string;
  rule: string;
  severity: string;
  type: string;
  component: string;
  project: string;
  line?: number;
  message: string;
  resolution?: string;
  status: string;
  creationDate: string;
}

export class SonarqubeHttpClient extends ScannerHttpClient {
  constructor(url: string, token: string) {
    super({
      url: `${url}/api`,
      authHeader: `Basic ${Buffer.from(`${token}:`).toString("base64")}`,
      timeoutMs: 15000,
      maxRetries: 3,
    });
  }

  async getProjects(): Promise<SonarqubeProject[]> {
    const allProjects: SonarqubeProject[] = [];
    let page = 1;
    const pageSize = 100;

    while (true) {
      const result = await this.executeRequest<{
        components: SonarqubeProject[];
        paging: { total: number; pageIndex: number; pageSize: number };
      }>(`/projects/search?ps=${pageSize}&p=${page}`);
      allProjects.push(...result.components);
      if (result.paging.pageIndex * result.paging.pageSize >= result.paging.total) break;
      page++;
    }

    return allProjects;
  }

  async getIssues(projectKey: string, severities = "BLOCKER,CRITICAL,MAJOR", statuses = "OPEN,CONFIRMED,REOPENED"): Promise<SonarqubeIssue[]> {
    const allIssues: SonarqubeIssue[] = [];
    let page = 1;
    const pageSize = 500;

    while (true) {
      const result = await this.executeRequest<{
        issues: SonarqubeIssue[];
        paging: { total: number; pageIndex: number; pageSize: number };
      }>(`/issues/search?projectKeys=${projectKey}&severities=${severities}&statuses=${statuses}&ps=${pageSize}&p=${page}`);
      allIssues.push(...result.issues);
      if (result.paging.pageIndex * result.paging.pageSize >= result.paging.total) break;
      page++;
    }

    return allIssues;
  }
}
