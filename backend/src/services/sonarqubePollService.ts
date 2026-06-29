import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { SonarqubeHttpClient } from "./sonarqubeHttpClient.js";
import { mapSonarqubeIssue } from "./sonarqubeAdapter.js";
import { env } from "../config/env.js";
import { logger } from "../core/logger.js";

let isRunning = false;

export const sonarqubePollService = {
  async sync(client?: SonarqubeHttpClient): Promise<{ projects: number; findings: number; errors: string[] }> {
    if (isRunning) return { projects: 0, findings: 0, errors: [] };
    if (!env.SONARQUBE_URL || !env.SONARQUBE_TOKEN) {
      logger.warn("SonarQube not configured — skipping poll sync");
      return { projects: 0, findings: 0, errors: [] };
    }

    isRunning = true;
    const httpClient = client || new SonarqubeHttpClient(env.SONARQUBE_URL, env.SONARQUBE_TOKEN);
    const errors: string[] = [];
    let projectCount = 0;
    let findingCount = 0;

    try {
      const projects = await httpClient.getProjects();
      logger.info({ count: projects.length }, "SonarQube projects fetched");

      for (const project of projects) {
        projectCount++;
        try {
          const issues = await httpClient.getIssues(project.key);
          for (const issue of issues) {
            const input = mapSonarqubeIssue(issue, project.name);
            await unifiedFindingRepo.createFinding({
              sourceTool: "SONARQUBE",
              sourceId: input.sourceId,
              sourceTable: input.sourceTable,
              title: input.title,
              unifiedSeverity: input.severity,
              targetProduct: input.targetProduct,
              description: input.description,
            });
            findingCount++;
          }
          logger.debug({ project: project.key, issues: issues.length }, "SonarQube project synced");
        } catch (err: any) {
          errors.push(`Project ${project.key}: ${err.message}`);
          logger.error({ err, project: project.key }, "SonarQube project sync failed");
        }
      }
    } catch (err: any) {
      errors.push(err.message);
      logger.error({ err }, "SonarQube poll sync failed");
    } finally {
      isRunning = false;
    }

    return { projects: projectCount, findings: findingCount, errors };
  },
};
