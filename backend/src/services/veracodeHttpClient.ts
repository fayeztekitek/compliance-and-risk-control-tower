import { ScannerHttpClient } from "./scannerHttpClient.js";

export interface VeracodeApp {
  id: string;
  name: string;
  guid: string;
}

export interface VeracodeBuild {
  buildId: string;
  version: string;
  status: string;
  publishedDate: string;
}

export interface VeracodeFlaw {
  issueId: string;
  cveId?: string;
  severity: number;
  categoryName: string;
  description?: string;
  moduleName?: string;
  modulePath?: string;
  remediationStatus: string;
  exploitLevel: number;
}

export class VeracodeHttpClient extends ScannerHttpClient {
  async getApplications(): Promise<VeracodeApp[]> {
    const res = await this.executeRequest<{ _embedded?: { applications: VeracodeApp[] } }>("api/v3/applications?page=1&size=100");
    return res._embedded?.applications || [];
  }

  async getApplicationBuilds(appGuid: string): Promise<VeracodeBuild[]> {
    const res = await this.executeRequest<{ _embedded?: { builds: VeracodeBuild[] } }>(`api/v3/applications/${appGuid}/builds?page=1&size=50`);
    return res._embedded?.builds || [];
  }

  async getBuildFlaws(appGuid: string, buildId: string): Promise<VeracodeFlaw[]> {
    const res = await this.executeRequest<{ _embedded?: { flaws: VeracodeFlaw[] } }>(
      `api/v3/applications/${appGuid}/builds/${buildId}/flaws?page=1&size=500`
    );
    return res._embedded?.flaws || [];
  }
}
