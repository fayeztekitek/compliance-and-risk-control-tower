import { Building2, Layers, Loader2 } from "lucide-react";
import { useLiveNexusKpis } from "../hooks/useDashboard";
import { useNavigate } from "react-router-dom";

export default function ExecutiveDashboard() {
  const nexusSessionToken = localStorage.getItem("nexus_session_token");
  const { data: liveNexusKpis, isFetching: liveKpisLoading } = useLiveNexusKpis(nexusSessionToken);
  const navigate = useNavigate();

  if (!nexusSessionToken) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Building2 className="w-16 h-16 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Not Connected to Nexus IQ</h2>
        <p className="text-sm text-slate-400 mb-6">
          Connect to a Nexus IQ server to see live executive KPIs.
        </p>
        <button
          onClick={() => navigate("/nexus")}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          Go to Nexus Overview
        </button>
      </div>
    );
  }

  if (liveKpisLoading && !liveNexusKpis) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm text-slate-400">Fetching data from Nexus IQ...</p>
      </div>
    );
  }

  if (!liveNexusKpis) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <p className="text-lg font-medium">Unable to load data from Nexus IQ.</p>
        <button
          onClick={() => navigate("/nexus")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
        >
          Reconnect to Nexus IQ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Executive Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Live counts from Nexus IQ</p>
        </div>
        {liveKpisLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
        <div className="bg-white rounded-xl border border-emerald-200 border-l-4 border-l-emerald-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100"><Building2 className="w-5 h-5 text-emerald-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Organizations</p>
              <p className="text-lg font-bold text-slate-800">{liveNexusKpis.totalOrganizations?.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 border-l-4 border-l-blue-500 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><Layers className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Applications</p>
              <p className="text-lg font-bold text-slate-800">{liveNexusKpis.totalApplications?.toLocaleString() ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
