import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { FortifyHttpClient } from "./fortifyHttpClient.js";
import { mapFortifyVulnerability } from "./fortifyAdapter.js";

let isRunning = false;

export const fortifySyncService = {
  async sync(client: FortifyHttpClient): Promise<{ projects: number; findings: number; errors: string[] }> {
    if (isRunning) return { projects: 0, findings: 0, errors: [] };
    isRunning = true;
    const errors: string[] = [];
    let projectCount = 0;
    let findingCount = 0;

    try {
      const projects = await client.getProjects();
      for (const project of projects) {
        projectCount++;
        const artifacts = await client.getArtifacts(project.id);
        for (const artifact of artifacts) {
          try {
            const vulns = await client.getVulnerabilities(project.id, artifact.id);
            for (const vuln of vulns) {
              const input = mapFortifyVulnerability(vuln, project.name);
              await unifiedFindingRepo.createFinding({
                sourceTool: "FORTIFY",
                sourceId: input.sourceId,
                sourceTable: input.sourceTable,
                title: input.title,
                unifiedSeverity: input.severity,
                targetProduct: input.targetProduct,
                description: input.description,
                scanId: artifact.id,
              });
              findingCount++;
            }
          } catch (err: any) {
            errors.push(`Artifact ${artifact.id}: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      errors.push(err.message);
    } finally {
      isRunning = false;
    }
    return { projects: projectCount, findings: findingCount, errors };
  },
};
