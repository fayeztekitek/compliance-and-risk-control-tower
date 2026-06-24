import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useStoredReports, useEvolution } from "../hooks/useNexus";
import { SkeletonPage } from "../components/ui/Skeleton";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function NexusEvolutionTimeline() {
  const { appId } = useParams<{ appId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const applicationName = searchParams.get("applicationName") || "Application";

  const { data: evolution, isLoading: evLoading } = useEvolution(appId || "");
  const { data: reportsData, isLoading: rptLoading } = useStoredReports(appId || "", { limit: 100 });

  const isLoading = evLoading || rptLoading;

  if (isLoading) return <SkeletonPage />;

  if (!evolution || evolution.length === 0) {
    return (
      <div className="space-y-6">
        <nav className="flex items-center space-x-2 text-sm text-slate-500">
          <Link to="/nexus" className="hover:text-indigo-600">Nexus IQ</Link>
          <span>/</span>
          <Link to={`/nexus/app/${appId}`} className="hover:text-indigo-600">{applicationName}</Link>
          <span>/</span>
          <span className="text-slate-800 font-medium">Evolution</span>
        </nav>
        <div className="text-center py-16 text-slate-500">
          <BarChart3 className="w-8 h-8 mx-auto mb-2" />
          <p>No evolution data available. Sync the application first.</p>
        </div>
      </div>
    );
  }

  const reports = reportsData?.data || [];
  const chartData = evolution.map((p) => ({
    date: formatDate(p.scanDate),
    critical: p.criticalCount,
    high: p.highCount,
    medium: p.mediumCount,
    low: p.lowCount,
    total: p.totalViolations,
    newViolations: p.newViolations,
    fixedViolations: p.fixedViolations,
    newComponents: p.componentChurn?.newComponents || 0,
    removedComponents: p.componentChurn?.removedComponents || 0,
  }));

  const sortedData = [...chartData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const totalNow = sortedData[sortedData.length - 1]?.total || 0;
  const totalPrev = sortedData.length > 1 ? sortedData[sortedData.length - 2]?.total : totalNow;
  const delta = totalNow - totalPrev;
  const latestNew = sortedData[sortedData.length - 1]?.newViolations || 0;
  const latestFixed = sortedData[sortedData.length - 1]?.fixedViolations || 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-slate-500">
        <Link to="/nexus" className="hover:text-indigo-600">Nexus IQ</Link>
        <span>/</span>
        <Link to={`/nexus/app/${appId}`} className="hover:text-indigo-600">{applicationName}</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Evolution</span>
      </nav>

      {/* Header */}
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Evolution</h1>
            <p className="text-sm text-slate-500">{applicationName} &middot; {reports.length} scans</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Latest Violations</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <p className="text-3xl font-bold text-slate-800">{totalNow}</p>
            {delta !== 0 && (
              <span className={`flex items-center text-sm font-medium ${delta > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {delta > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {delta > 0 ? "+" : ""}{delta}
              </span>
            )}
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-sm font-medium text-red-700">New (latest scan)</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{latestNew}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="text-sm font-medium text-emerald-700">Fixed (latest scan)</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{latestFixed}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Scans</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{reports.length}</p>
        </div>
      </div>

      {/* Severity Distribution Bar Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">Violation Trend by Severity</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="critical" stackId="sev" fill="#dc2626" name="Critical" />
              <Bar dataKey="high" stackId="sev" fill="#ea580c" name="High" />
              <Bar dataKey="medium" stackId="sev" fill="#ca8a04" name="Medium" />
              <Bar dataKey="low" stackId="sev" fill="#64748b" name="Low" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* New/Fixed Line Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4">New vs Fixed Violations</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sortedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="newViolations" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} name="New" />
              <Line type="monotone" dataKey="fixedViolations" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Fixed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Component Churn Chart */}
      {sortedData.some((d) => d.newComponents > 0 || d.removedComponents > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Component Churn</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="newComponents" stackId="churn" fill="#16a34a" name="New Components" />
                <Bar dataKey="removedComponents" stackId="churn" fill="#dc2626" name="Removed Components" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Evolution Timeline List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Scan History</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {sortedData.slice().reverse().map((d, i) => (
            <div key={i} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">{d.date}</p>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-xs">{d.critical} C</span>
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-xs">{d.high} H</span>
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-xs">{d.medium} M</span>
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">{d.low} L</span>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-xs">
                {d.newViolations > 0 && <span className="text-red-600 font-medium">+{d.newViolations} new</span>}
                {d.fixedViolations > 0 && <span className="text-emerald-600 font-medium">-{d.fixedViolations} fixed</span>}
                {d.newComponents > 0 && <span className="text-emerald-500">+{d.newComponents} comp</span>}
                {d.removedComponents > 0 && <span className="text-red-500">-{d.removedComponents} comp</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}