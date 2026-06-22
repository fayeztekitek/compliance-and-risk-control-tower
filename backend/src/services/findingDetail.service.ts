import { unifiedFindingRepo } from "../repositories/unifiedFinding.repo.js";
import { findingOccurrenceRepo } from "../repositories/findingOccurrence.repo.js";
import { findingComponentRepo } from "../repositories/findingComponent.repo.js";
import { nexusRepo } from "../repositories/nexus.repo.js";
import { mitigationService } from "./mitigation.service.js";
import { NotFoundError } from "../core/errors.js";

export interface FindingDetail {
  finding: any;
  components: any[];
  occurrences: any[];
  mitigations: any[];
  waivers: any[];
}

export const findingDetailService = {
  async getFindingDetail(findingId: string): Promise<FindingDetail> {
    const finding = await unifiedFindingRepo.getFinding(findingId);
    if (!finding) throw new NotFoundError("UnifiedFinding", findingId);

    const occurrencesResult = await findingOccurrenceRepo.listByFinding(findingId, { page: 1, limit: 500 });
    const occurrences = occurrencesResult.data;

    const componentIds = [...new Set(occurrences.map((o: any) => o.componentId).filter(Boolean))];
    const components: any[] = [];
    for (const cid of componentIds) {
      const comp = await findingComponentRepo.get(cid);
      if (comp) components.push(comp);
    }

    const mitigationsResult = await mitigationService.listByFinding(findingId, { page: 1, limit: 50 });
    const mitigations = mitigationsResult.data;

    const waivers = await nexusRepo.listWaivers({ status: "active" });

    return { finding, components, occurrences, mitigations, waivers };
  },

  async getOccurrenceDetail(occurrenceId: string) {
    const occurrence = await findingOccurrenceRepo.get(occurrenceId);
    if (!occurrence) throw new NotFoundError("FindingOccurrence", occurrenceId);

    let component = null;
    if (occurrence.componentId) {
      component = await findingComponentRepo.get(occurrence.componentId);
    }

    const finding = occurrence.findingId
      ? await unifiedFindingRepo.getFinding(occurrence.findingId)
      : null;

    let mitigations: any[] = [];
    if (occurrence.findingId) {
      const result = await mitigationService.listByFinding(occurrence.findingId, { page: 1, limit: 50 });
      mitigations = result.data;
    }

    const waivers = await nexusRepo.listWaivers({ status: "active" });

    return { occurrence, component, finding, mitigations, waivers };
  },
};
