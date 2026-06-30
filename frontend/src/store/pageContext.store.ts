import { create } from "zustand";
import type { PageContext } from "../api/chatbot.api";

const PAGE_LABELS: Record<string, string> = {
  executive: "Executive Dashboard",
  compliance: "Compliance Dashboard",
  risk: "Risk Dashboard",
  audit: "Audit Dashboard",
  committees: "Committees Dashboard",
  roadmaps: "Roadmaps Dashboard",
  saas: "SaaS Dashboard",
  veg: "VEG Governance",
  "veg-deals": "VEG Deal Register",
  "finding-components": "Finding Components",
  vulnerabilities: "Vulnerabilities",
  "risk-register": "Risk Register",
  "ai-hub": "AI Hub",
  admin: "Administration",
};

interface PageContextState {
  pageContext: PageContext;
  setPage: (page: string, extra?: Partial<PageContext>) => void;
  setEntity: (type: string, id: string) => void;
  setFilters: (filters: Record<string, any>) => void;
}

export const usePageContextStore = create<PageContextState>((set) => ({
  pageContext: { page: "executive", pageLabel: "Executive Dashboard" },
  setPage: (page, extra) => set({
    pageContext: {
      page,
      pageLabel: PAGE_LABELS[page] || page,
      ...extra,
    },
  }),
  setEntity: (entityType, entityId) => set(state => ({
    pageContext: { ...state.pageContext, entityType, entityId },
  })),
  setFilters: (filters) => set(state => ({
    pageContext: { ...state.pageContext, filters },
  })),
}));
