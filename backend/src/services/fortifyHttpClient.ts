import { ScannerHttpClient } from "./scannerHttpClient.js";

export interface FortifyProject {
  id: string;
  name: string;
  description?: string;
}

export interface FortifyArtifact {
  id: string;
  version: string;
  status: string;
}

export interface FortifyVulnerability {
  id: string;
  category: string;
  priority: number;
  severity: string;
  cweId?: string;
  fileName?: string;
  lineNumber?: number;
  kingdom?: string;
  analyzer: string;
  scanId: string;
  primaryUrl?: string;
  primaryLocation?: string;
}

export class FortifyHttpClient extends ScannerHttpClient {
  async getProjects(): Promise<FortifyProject[]> {
    const res = await this.executeRequest<{ data: FortifyProject[] }>("api/v1/projects?limit=200");
    return res.data || [];
  }

  async getArtifacts(projectId: string): Promise<FortifyArtifact[]> {
    const res = await this.executeRequest<{ data: FortifyArtifact[] }>(`api/v1/projects/${projectId}/artifact-versions?limit=50`);
    return res.data || [];
  }

  async getVulnerabilities(projectId: string, artifactId: string): Promise<FortifyVulnerability[]> {
    const res = await this.executeRequest<{ data: FortifyVulnerability[] }>(
      `api/v1/projects/${projectId}/artifacts/${artifactId}/vulnerabilities?limit=500`
    );
    return res.data || [];
  }
}
