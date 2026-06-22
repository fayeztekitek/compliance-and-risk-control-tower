import { query } from "../config/database.js";
import { logger } from "../core/logger.js";

interface EpssResponse {
  data: Array<{
    cve: string;
    epss: string;
    percentile: string;
    date: string;
  }>;
  meta: { total: number; page: number; size: number };
}

interface KevCatalog {
  title: string;
  catalogVersion: string;
  dateReleased: string;
  count: number;
  vulnerabilities: Array<{
    cveID: string;
    vendorProject: string;
    product: string;
    vulnerabilityName: string;
    dateAdded: string;
    shortDescription: string;
    requiredAction: string;
    dueDate: string;
    knownRansomwareCampaignUse: string;
    notes: string;
    cwes: string[];
  }>;
}

const EPSS_BASE = "https://api.first.org/epss/data";
const KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

async function fetchEpssBatch(cveIds: string[]): Promise<Map<string, { epss: number; percentile: number }>> {
  const result = new Map<string, { epss: number; percentile: number }>();
  if (!cveIds.length) return result;

  try {
    const cveParam = cveIds.join(",");
    const url = `${EPSS_BASE}?v=2&cve-id=${encodeURIComponent(cveParam)}`;
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
      logger.warn({ status: response.status, cves: cveIds.length }, "EPSS API returned non-OK status");
      return result;
    }
    const body: EpssResponse = await response.json();
    for (const item of body.data) {
      result.set(item.cve.toUpperCase(), {
        epss: parseFloat(item.epss) || 0,
        percentile: parseFloat(item.percentile) || 0,
      });
    }
  } catch (err: any) {
    logger.error({ err: err.message, cves: cveIds.length }, "EPSS API request failed");
  }
  return result;
}

let kevCache: Map<string, { dateAdded: string; description: string }> | null = null;

async function fetchKevCatalog(): Promise<Map<string, { dateAdded: string; description: string }>> {
  if (kevCache) return kevCache;

  try {
    const response = await fetch(KEV_URL, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) {
      logger.warn({ status: response.status }, "CISA KEV API returned non-OK status");
      return new Map();
    }
    const body: KevCatalog = await response.json();
    const map = new Map<string, { dateAdded: string; description: string }>();
    for (const vuln of body.vulnerabilities) {
      map.set(vuln.cveID.toUpperCase(), {
        dateAdded: vuln.dateAdded,
        description: vuln.shortDescription,
      });
    }
    kevCache = map;
    logger.info({ count: map.size }, "CISA KEV catalog loaded");
  } catch (err: any) {
    logger.error({ err: err.message }, "CISA KEV API request failed");
    return new Map();
  }
  return kevCache || new Map();
}

export const epssClient = {
  async enrichCve(cveId: string): Promise<{ epssScore: number; epssPercentile: number; cisaKev: boolean; cisaKevDate: string | null; cisaKevDescription: string | null }> {
    const epssResult = await fetchEpssBatch([cveId]);
    const kev = await fetchKevCatalog();

    const epss = epssResult.get(cveId.toUpperCase());
    const kevEntry = kev.get(cveId.toUpperCase());

    return {
      epssScore: epss?.epss ?? 0,
      epssPercentile: epss?.percentile ?? 0,
      cisaKev: !!kevEntry,
      cisaKevDate: kevEntry?.dateAdded ?? null,
      cisaKevDescription: kevEntry?.description ?? null,
    };
  },

  async batchEnrich(cveIds: string[]): Promise<Map<string, { epssScore: number; epssPercentile: number; cisaKev: boolean; cisaKevDate: string | null; cisaKevDescription: string | null }>> {
    const uniqueCves = [...new Set(cveIds.map(c => c.toUpperCase()).filter(Boolean))];
    if (!uniqueCves.length) return new Map();

    const epssMap = await fetchEpssBatch(uniqueCves);
    const kevMap = await fetchKevCatalog();

    const result = new Map<string, { epssScore: number; epssPercentile: number; cisaKev: boolean; cisaKevDate: string | null; cisaKevDescription: string | null }>();

    for (const cveId of uniqueCves) {
      const epss = epssMap.get(cveId);
      const kevEntry = kevMap.get(cveId);
      result.set(cveId, {
        epssScore: epss?.epss ?? 0,
        epssPercentile: epss?.percentile ?? 0,
        cisaKev: !!kevEntry,
        cisaKevDate: kevEntry?.dateAdded ?? null,
        cisaKevDescription: kevEntry?.description ?? null,
      });
    }
    return result;
  },

  clearKevCache(): void {
    kevCache = null;
  },

  async getCacheStats(): Promise<{ epssCount: number; kevCount: number }> {
    const kev = await fetchKevCatalog();
    const epss = await query("SELECT COUNT(*) as count FROM vulnerability_enrichments");
    return {
      epssCount: parseInt((epss.rows[0]?.count as string) || "0", 10),
      kevCount: kev.size,
    };
  },
};
