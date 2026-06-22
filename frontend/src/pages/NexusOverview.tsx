import { useState } from "react";
import { Radar, Shield, Bug, AlertTriangle, Activity, ChevronRight, Building2, Layers } from "lucide-react";
import { useOrganizations, useProducts, useCrossToolSummary, useDistinctCount, useTotalOccurrences } from "../hooks/useNexus";
import { SkeletonPage } from "../components/ui/Skeleton";
import NexusApplicationDetail from "./NexusApplicationDetail";

type NexusView = "overview" | "application";

export default function NexusOverview() {
  const [nexusView, setNexusView] = useState<NexusView>("overview");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const { data: orgs, isLoading: orgsLoading } = useOrganizations();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: summary, isLoading: summaryLoading } = useCrossToolSummary();
  const { data: distinctCount } = useDistinctCount();
  const { data: totalOccurrences } = useTotalOccurrences();

  if (nexusView === "application" && selectedAppId) {
    const app = (products || []).find((p: any) => p.id === selectedAppId);
    return (
      <NexusApplicationDetail
        applicationId={selectedAppId}
        applicationName={app?.name}
        onBack={() => { setNexusView("overview"); setSelectedAppId(null); }}
        onBackToOverview={() => { setNexusView("overview"); setSelectedAppId(null); }}
      />
    );
  }

  const isLoading = orgsLoading || productsLoading || summaryLoading;
  if (isLoading) return <SkeletonPage />;

  const filteredApps = selectedOrgId
    ? (products || []).filter((p: any) => p.organizationId === selectedOrgId)
    : (products || []);

  const selectedOrg = orgs?.find((o: any) => o.organizationId === selectedOrgId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <Radar className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Nexus IQ Security Dashboard</h1>
            <p className="text-sm text-slate-500">Application vulnerability drill-down</p>
          </div>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Distinct Vulnerabilities</p>
            <Bug className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1">{distinctCount ?? summary?.total ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Occurrences</p>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalOccurrences ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Affected Applications</p>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1">{products?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Organizations</p>
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800 mt-1">{orgs?.length ?? 0}</p>
        </div>
      </div>

      {/* Org Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Organization</label>
        <select
          value={selectedOrgId}
          onChange={(e) => setSelectedOrgId(e.target.value)}
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Organizations</option>
          {orgs?.map((org: any) => (
            <option key={org.organizationId} value={org.organizationId}>
              {org.organizationName}
            </option>
          ))}
        </select>
        {selectedOrg && (
          <div className="mt-3 flex items-center space-x-4 text-sm text-slate-600">
            <span>Compliance: <strong className={selectedOrg.compliancePosture?.postureGrade === "GREEN" ? "text-emerald-600" : selectedOrg.compliancePosture?.postureGrade === "ORANGE" ? "text-amber-600" : "text-red-600"}>{selectedOrg.compliancePosture?.postureGrade || "N/A"}</strong></span>
            <span>Score: <strong>{selectedOrg.compliancePosture?.complianceScore ?? "N/A"}%</strong></span>
          </div>
        )}
      </div>

      {/* App Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredApps.map((app: any) => {
          const statusColor = app.status === "GREEN" ? "border-l-emerald-500" : app.status === "ORANGE" ? "border-l-amber-500" : "border-l-red-500";
          return (
            <button
              key={app.id}
              onClick={() => { setSelectedAppId(app.id); setNexusView("application"); }}
              className={`text-left bg-white rounded-xl border border-slate-200 border-l-4 ${statusColor} p-5 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{app.name}</h3>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className={`px-2 py-1 rounded-full font-medium ${
                  app.status === "GREEN" ? "bg-emerald-100 text-emerald-700" :
                  app.status === "ORANGE" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>{app.status || "UNKNOWN"}</span>
                <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600">{app.businessCriticality || "N/A"}</span>
              </div>
              <p className="mt-2 text-xs text-slate-400">Product: {app.productId}</p>
            </button>
          );
        })}
        {filteredApps.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>No applications found. Sync Nexus IQ data to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
