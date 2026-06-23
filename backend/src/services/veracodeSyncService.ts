import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { VeracodeHttpClient } from "./veracodeHttpClient.js";
import { mapVeracodeFlaw } from "./veracodeAdapter.js";

let isRunning = false;

export const veracodeSyncService = {
  async sync(client: VeracodeHttpClient): Promise<{ applications: number; findings: number; errors: string[] }> {
    if (isRunning) return { applications: 0, findings: 0, errors: [] };
    isRunning = true;
    const errors: string[] = [];
    let appCount = 0;
    let findingCount = 0;

    try {
      const apps = await client.getApplications();
      for (const app of apps) {
        appCount++;
        const builds = await client.getApplicationBuilds(app.guid);
        for (const build of builds.slice(0, 5)) {
          try {
            const flaws = await client.getBuildFlaws(app.guid, build.buildId);
            for (const flaw of flaws.filter(f => f.remediationStatus !== "FIXED")) {
              const input = mapVeracodeFlaw(flaw, app.name);
              await unifiedFindingRepo.createFinding({
                sourceTool: "VERACODE",
                sourceId: input.sourceId,
                sourceTable: input.sourceTable,
                title: input.title,
                unifiedSeverity: input.severity,
                targetProduct: input.targetProduct,
                description: input.description,
              });
              findingCount++;
            }
          } catch (err: any) {
            errors.push(`Build ${build.buildId} for ${app.name}: ${err.message}`);
          }
        }
      }
    } catch (err: any) {
      errors.push(err.message);
    } finally {
      isRunning = false;
    }
    return { applications: appCount, findings: findingCount, errors };
  },
};
