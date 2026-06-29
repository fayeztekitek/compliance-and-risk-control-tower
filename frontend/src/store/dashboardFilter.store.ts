import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface DashboardFilter {
  organizationIds: string[];
  applicationIds: string[];
  severities: string[];
  statuses: string[];
  reportPeriod: string;
  reportDateFrom: string | null;
  reportDateTo: string | null;
  scanStatus: string[];
  riskLevel: string[];
  scanReportScope: string;
  searchQuery: string;
}

const DEFAULTS: DashboardFilter = {
  organizationIds: [],
  applicationIds: [],
  severities: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
  statuses: ["OPEN", "ACCEPTED", "WAIVED"],
  reportPeriod: "last-90-days",
  reportDateFrom: null,
  reportDateTo: null,
  scanStatus: ["active", "inactive"],
  riskLevel: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
  scanReportScope: "latest",
  searchQuery: "",
};

interface DashboardFilterState {
  filters: DashboardFilter;
  setFilter: <K extends keyof DashboardFilter>(key: K, value: DashboardFilter[K]) => void;
  setMultipleFilters: (partial: Partial<DashboardFilter>) => void;
  resetFilters: () => void;
  getQueryParams: () => Record<string, string>;
}

function toQueryParams(f: DashboardFilter): Record<string, string> {
  const params: Record<string, string> = {};
  if (f.organizationIds.length > 0) params.organizationIds = f.organizationIds.join(",");
  if (f.applicationIds.length > 0) params.applicationIds = f.applicationIds.join(",");
  if (f.severities.length < 4 && f.severities.length > 0) params.severities = f.severities.join(",");
  if (f.statuses.length < 6) params.statuses = f.statuses.join(",");
  if (f.reportPeriod && f.reportPeriod !== "last-90-days") params.reportPeriod = f.reportPeriod;
  if (f.reportDateFrom) params.reportDateFrom = f.reportDateFrom;
  if (f.reportDateTo) params.reportDateTo = f.reportDateTo;
  if (f.scanStatus.length < 2) params.scanStatus = f.scanStatus.join(",");
  if (f.riskLevel.length < 4) params.riskLevel = f.riskLevel.join(",");
  if (f.scanReportScope !== "latest") params.scanReportScope = f.scanReportScope;
  if (f.searchQuery) params.searchQuery = f.searchQuery;
  return params;
}

const URL_KEY = "dashboard_filters";

function loadFromUrl(): Partial<DashboardFilter> {
  if (typeof window === "undefined") return {};
  const url = new URL(window.location.href);
  const p = url.searchParams;
  const partial: Partial<DashboardFilter> = {};

  const orgs = p.get("orgs");
  if (orgs) partial.organizationIds = orgs.split(",");

  const apps = p.get("apps");
  if (apps) partial.applicationIds = apps.split(",");

  const sev = p.get("severity");
  if (sev) partial.severities = sev.split(",");

  const st = p.get("status");
  if (st) partial.statuses = st.split(",");

  const period = p.get("period");
  if (period) partial.reportPeriod = period;

  const from = p.get("from");
  if (from) partial.reportDateFrom = from;

  const to = p.get("to");
  if (to) partial.reportDateTo = to;

  const scan = p.get("scanStatus");
  if (scan) partial.scanStatus = scan.split(",");

  const risk = p.get("riskLevel");
  if (risk) partial.riskLevel = risk.split(",");

  const scope = p.get("scope");
  if (scope) partial.scanReportScope = scope;

  const q = p.get("q");
  if (q) partial.searchQuery = q;

  return partial;
}

function saveToUrl(filters: DashboardFilter) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("orgs");
  url.searchParams.delete("apps");
  url.searchParams.delete("severity");
  url.searchParams.delete("status");
  url.searchParams.delete("period");
  url.searchParams.delete("from");
  url.searchParams.delete("to");
  url.searchParams.delete("scanStatus");
  url.searchParams.delete("riskLevel");
  url.searchParams.delete("scope");
  url.searchParams.delete("q");

  if (filters.organizationIds.length > 0) url.searchParams.set("orgs", filters.organizationIds.join(","));
  if (filters.applicationIds.length > 0) url.searchParams.set("apps", filters.applicationIds.join(","));
  if (filters.severities.length < 4) url.searchParams.set("severity", filters.severities.join(","));
  if (filters.statuses.length < 6) url.searchParams.set("status", filters.statuses.join(","));
  if (filters.reportPeriod !== "last-90-days") url.searchParams.set("period", filters.reportPeriod);
  if (filters.reportDateFrom) url.searchParams.set("from", filters.reportDateFrom);
  if (filters.reportDateTo) url.searchParams.set("to", filters.reportDateTo);
  if (filters.scanStatus.length < 2) url.searchParams.set("scanStatus", filters.scanStatus.join(","));
  if (filters.riskLevel.length < 4) url.searchParams.set("riskLevel", filters.riskLevel.join(","));
  if (filters.scanReportScope !== "latest") url.searchParams.set("scope", filters.scanReportScope);
  if (filters.searchQuery) url.searchParams.set("q", filters.searchQuery);

  const newUrl = url.toString();
  if (newUrl !== window.location.href) {
    window.history.replaceState(null, "", newUrl);
  }
}

export const useDashboardFilterStore = create<DashboardFilterState>()(
  persist(
    (set, get) => {
      const urlOverrides = loadFromUrl();
      const initialFilters = { ...DEFAULTS, ...urlOverrides };

      return {
        filters: initialFilters,

        setFilter: (key, value) => {
          set((state) => {
            const next = { ...state.filters, [key]: value };
            saveToUrl(next);
            return { filters: next };
          });
        },

        setMultipleFilters: (partial) => {
          set((state) => {
            const next = { ...state.filters, ...partial };
            saveToUrl(next);
            return { filters: next };
          });
        },

        resetFilters: () => {
          set(() => {
            saveToUrl(DEFAULTS);
            return { filters: { ...DEFAULTS } };
          });
        },

        getQueryParams: () => {
          return toQueryParams(get().filters);
        },
      };
    },
    {
      name: URL_KEY,
      partialize: (state) => ({ filters: state.filters }),
      merge: (persisted: any, current) => {
        const urlOverrides = loadFromUrl();
        return {
          ...current,
          filters: { ...current.filters, ...persisted?.filters, ...urlOverrides },
        };
      },
    }
  )
);
