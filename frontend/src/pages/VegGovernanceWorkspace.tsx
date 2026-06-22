import { useState } from "react";
import {
  Plus, Search, ChevronLeft, Briefcase, DollarSign, TrendingUp, AlertTriangle,
  BarChart3, Users, Globe, CheckCircle, Clock, XCircle, ExternalLink, FileText, Activity,
} from "lucide-react";
import {
  useVegDealList, useVegDealById, useVegDealStats,
  useCreateVegDeal, useUpdateVegDeal, useDeleteVegDeal,
} from "../hooks/useVegRequests";
import type { VegDeal, VegDealListParams } from "../api/veg.api";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonTable } from "../components/ui/Skeleton";

type VSubMode = "dashboard" | "list" | "detail" | "create" | "edit";

const DECISION_COLORS: Record<string, string> = {
  "GO FINAL": "bg-green-100 text-green-700",
  "GO INITIAL": "bg-blue-100 text-blue-700",
  "GO without Committee": "bg-teal-100 text-teal-700",
  "BID": "bg-yellow-100 text-yellow-700",
  "Differed": "bg-orange-100 text-orange-700",
  "No GO": "bg-red-100 text-red-700",
  "NO GO": "bg-red-100 text-red-700",
  "Postponed": "bg-purple-100 text-purple-700",
  "BACKLOG": "bg-gray-100 text-gray-700",
  "WITHDRAWN": "bg-pink-100 text-pink-700",
  "CANCELLED": "bg-rose-100 text-rose-700",
};

const SALES_COLORS: Record<string, string> = {
  Won: "bg-green-100 text-green-700",
  Lost: "bg-red-100 text-red-700",
  Open: "bg-blue-100 text-blue-700",
  Canceled: "bg-gray-100 text-gray-700",
  Committed: "bg-indigo-100 text-indigo-700",
};

const REGIONS = ["EU", "Americas", "UK", "APAC"];
const BUSINESS_LINES = ["Colline", "Soliam", "Solife", "Megara", "Digital", "Regulatory", "Numilog", "Insurance France", "Wealth Management", "Shared"];
const DECISIONS = ["GO FINAL", "GO INITIAL", "GO without Committee", "BID", "Differed", "No GO", "Postponed", "BACKLOG", "WITHDRAWN", "CANCELLED"];

function fmtNum(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

function fmtK(num: number) {
  if (num >= 1000) return (num / 1000).toFixed(1) + "M";
  return fmtNum(num) + "K";
}

function DecisionBadge({ decision }: { decision: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DECISION_COLORS[decision] || "bg-slate-100 text-slate-700"}`}>
      {decision}
    </span>
  );
}

function SalesBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${SALES_COLORS[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}

export default function VegGovernanceWorkspace() {
  const [mode, setMode] = useState<VSubMode>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<VegDealListParams>({ page: 1, limit: 25 });
  const [search, setSearch] = useState("");

  const { data: listData, isLoading: listLoading } = useVegDealList(filters);
  const { data: detail } = useVegDealById(selectedId);
  const { data: stats, isLoading: statsLoading } = useVegDealStats();
  const createDeal = useCreateVegDeal();
  const updateDeal = useUpdateVegDeal();
  const deleteDeal = useDeleteVegDeal();

  const [form, setForm] = useState<Record<string, any>>({
    vegId: "", client: "", businessOwner: "", region: "EU",
    businessLine: "Colline", products: "", committeeType: "Go n Go",
    vegDate: "", decision: "GO FINAL", tcv: 0, ipMaintenance: 0,
    saas: 0, ps: 0, wlPsMd: 0, wlInvestmentMd: 0,
    vegYear: new Date().getFullYear(),
  });

  function handleSelect(id: string) { setSelectedId(id); setMode("detail"); }
  function handleBack() { setMode("list"); setSelectedId(null); }

  function handleSearch() {
    setFilters(f => ({ ...f, search: search || undefined, page: 1 }));
  }

  function setFilter(key: string, val: any) {
    setFilters((f: VegDealListParams) => ({ ...f, [key]: val || undefined, page: 1 }));
  }

  async function handleCreate() {
    await createDeal.mutateAsync({ ...form, vegDate: form.vegDate || new Date().toISOString().split("T")[0] });
    setMode("list");
  }

  async function handleUpdate() {
    if (!selectedId) return;
    await updateDeal.mutateAsync({ id: selectedId, data: form });
    setMode("detail");
  }

  async function handleDelete(id: string) {
    await deleteDeal.mutateAsync(id);
    if (selectedId === id) handleBack();
  }

  // ============ DASHBOARD ============
  if (mode === "dashboard") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">VEG Governance</h2>
            <p className="text-sm text-slate-500 mt-1">VEG Committee Deal Register — {stats?.aggregates.total_deals || "..."} deals, {(stats ? fmtK(parseFloat(stats.aggregates.total_tcv)) : "...")} TCV</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMode("list")} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              View All Deals
            </button>
            <button onClick={() => { setMode("create"); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New Deal
            </button>
          </div>
        </div>

        {statsLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5"><SkeletonTable rows={3} /></div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2"><Briefcase className="w-5 h-5 text-indigo-500" /><h3 className="text-sm font-medium text-slate-600">Total Deals</h3></div>
                <p className="text-3xl font-bold text-slate-800">{fmtNum(parseInt(stats.aggregates.total_deals))}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2"><DollarSign className="w-5 h-5 text-green-500" /><h3 className="text-sm font-medium text-slate-600">Total TCV</h3></div>
                <p className="text-3xl font-bold text-slate-800">{fmtK(parseFloat(stats.aggregates.total_tcv))}</p>
                <p className="text-xs text-slate-400 mt-1">Avg: {fmtK(parseFloat(stats.aggregates.avg_tcv))}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2"><CheckCircle className="w-5 h-5 text-green-500" /><h3 className="text-sm font-medium text-slate-600">Won</h3></div>
                <p className="text-3xl font-bold text-green-600">{fmtNum(parseInt(stats.aggregates.won_deals))}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-3 mb-2"><XCircle className="w-5 h-5 text-red-500" /><h3 className="text-sm font-medium text-slate-600">Lost / Open</h3></div>
                <p className="text-3xl font-bold text-slate-800">{fmtNum(parseInt(stats.aggregates.lost_deals))} / {fmtNum(parseInt(stats.aggregates.open_deals))}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Decisions</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.decisions.map(d => (
                    <div key={d.decision} className="flex items-center justify-between text-sm">
                      <span><DecisionBadge decision={d.decision} /></span>
                      <span className="text-slate-600 font-medium">{fmtNum(parseInt(d.count))}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Business Lines</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.businessLines.map(b => (
                    <div key={b.business_line} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{b.business_line}</span>
                      <span className="text-slate-600 font-medium">{fmtNum(parseInt(b.count))}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2"><Globe className="w-4 h-4" /> Regions</h3>
                <div className="space-y-2">
                  {stats.regions.map(r => (
                    <div key={r.region} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{r.region}</span>
                      <span className="text-slate-600 font-medium">{fmtNum(parseInt(r.count))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Clients</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats.topClients.map(c => (
                    <div key={c.client} className="flex items-center justify-between text-sm py-1 border-b border-slate-50">
                      <span className="text-slate-700">{c.client}</span>
                      <span className="text-slate-500 text-xs">{fmtNum(parseInt(c.count))} deals / {fmtK(parseFloat(c.total_tcv))}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Top Business Owners</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {stats.topOwners.map(o => (
                    <div key={o.business_owner} className="flex items-center justify-between text-sm py-1 border-b border-slate-50">
                      <span className="text-slate-700">{o.business_owner}</span>
                      <span className="text-slate-500 text-xs">{fmtNum(parseInt(o.count))} deals / {fmtK(parseFloat(o.total_tcv))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // ============ LIST ============
  if (mode === "list") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">VEG Deal Register</h2>
            <p className="text-sm text-slate-500 mt-1">All VEG committee reviewed deals — {listData?.total || 0} total</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMode("dashboard")} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              Dashboard
            </button>
            <button onClick={() => { setForm({ vegId: "", client: "", businessOwner: "", region: "EU", businessLine: "Colline", products: "", committeeType: "Go n Go", vegDate: "", decision: "GO FINAL", tcv: 0, ipMaintenance: 0, saas: 0, ps: 0, wlPsMd: 0, wlInvestmentMd: 0, vegYear: new Date().getFullYear() }); setMode("create"); }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New Deal
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search client, owner, VEG ID..."
                value={search} onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <select value={filters.region || ""} onChange={e => setFilter("region", e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
              <option value="">All Regions</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={filters.businessLine || ""} onChange={e => setFilter("businessLine", e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
              <option value="">All Lines</option>
              {BUSINESS_LINES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={filters.decision || ""} onChange={e => setFilter("decision", e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm max-w-[160px]">
              <option value="">All Decisions</option>
              {DECISIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filters.salesStatus || ""} onChange={e => setFilter("salesStatus", e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
              <option value="">All Sales</option>
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
              <option value="Open">Open</option>
              <option value="Canceled">Canceled</option>
              <option value="Committed">Committed</option>
            </select>
            <select value={filters.year ? String(filters.year) : ""} onChange={e => setFilter("year", e.target.value ? parseInt(e.target.value) : undefined)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
              <option value="">All Years</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
        </div>

        {listLoading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5"><SkeletonTable rows={8} /></div>
        ) : !listData || listData.data.length === 0 ? (
          <EmptyState icon={Briefcase} title="No VEG deals found"
            description="Try adjusting your filters or import the Excel spreadsheet."
            action={{ label: "New Deal", onClick: () => setMode("create") }} />
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="text-left px-3 py-3 font-medium">VEG ID</th>
                      <th className="text-left px-3 py-3 font-medium">Client</th>
                      <th className="text-left px-3 py-3 font-medium">Owner</th>
                      <th className="text-left px-3 py-3 font-medium">Line</th>
                      <th className="text-left px-3 py-3 font-medium">Region</th>
                      <th className="text-left px-3 py-3 font-medium">Type</th>
                      <th className="text-left px-3 py-3 font-medium">Decision</th>
                      <th className="text-right px-3 py-3 font-medium">TCV</th>
                      <th className="text-right px-3 py-3 font-medium">PS</th>
                      <th className="text-left px-3 py-3 font-medium">Sales</th>
                      <th className="text-left px-3 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listData.data.map((deal) => (
                      <tr key={deal.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => handleSelect(deal.id)}>
                        <td className="px-3 py-3 font-mono text-xs text-slate-500">{deal.veg_id}</td>
                        <td className="px-3 py-3 font-medium text-slate-800 max-w-[180px] truncate">{deal.client}</td>
                        <td className="px-3 py-3 text-slate-600 max-w-[140px] truncate">{deal.business_owner}</td>
                        <td className="px-3 py-3 text-slate-600">{deal.business_line}</td>
                        <td className="px-3 py-3 text-slate-600">{deal.region}</td>
                        <td className="px-3 py-3 text-xs text-slate-500">{deal.committee_type}</td>
                        <td className="px-3 py-3"><DecisionBadge decision={deal.decision} /></td>
                        <td className="px-3 py-3 text-right font-mono text-sm">{fmtK(deal.tcv)}</td>
                        <td className="px-3 py-3 text-right font-mono text-xs text-slate-500">{deal.wl_ps_md ? fmtNum(deal.wl_ps_md) + "md" : "—"}</td>
                        <td className="px-3 py-3"><SalesBadge status={deal.sales_status} /></td>
                        <td className="px-3 py-3 text-xs text-slate-500">{new Date(deal.veg_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {listData && listData.total > listData.limit && (
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Showing {((listData.page - 1) * listData.limit) + 1}–{Math.min(listData.page * listData.limit, listData.total)} of {listData.total}</span>
                <div className="flex gap-2">
                  <button disabled={(listData.page || 1) <= 1} onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) - 1 }))}
                    className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50 text-sm">Prev</button>
                  <button disabled={(listData.page || 1) >= Math.ceil(listData.total / listData.limit)} onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) + 1 }))}
                    className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50 text-sm">Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ============ CREATE / EDIT ============
  if (mode === "create" || mode === "edit") {
    return (
      <div className="space-y-6 max-w-3xl">
        <button onClick={() => { mode === "edit" ? setMode("detail") : setMode("list"); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-2xl font-bold text-slate-800">{mode === "create" ? "New VEG Deal" : "Edit VEG Deal"}</h2>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">VEG ID</label>
              <input type="text" value={form.vegId} onChange={e => setForm(f => ({ ...f, vegId: e.target.value }))}
                placeholder="e.g. 21-2023-001" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">VEG Date</label>
              <input type="date" value={form.vegDate} onChange={e => setForm(f => ({ ...f, vegDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
              <input type="text" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Business Owner</label>
              <input type="text" value={form.businessOwner} onChange={e => setForm(f => ({ ...f, businessOwner: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
              <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Business Line</label>
              <select value={form.businessLine} onChange={e => setForm(f => ({ ...f, businessLine: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                {BUSINESS_LINES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Committee Type</label>
              <select value={form.committeeType} onChange={e => setForm(f => ({ ...f, committeeType: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                <option value="Go n Go">Go n Go</option>
                <option value="Bid n Bid">Bid n Bid</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Products</label>
            <input type="text" value={form.products} onChange={e => setForm(f => ({ ...f, products: e.target.value }))}
              placeholder="e.g. Colline, Megara" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Decision</label>
              <select value={form.decision} onChange={e => setForm(f => ({ ...f, decision: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                {DECISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
              <input type="number" value={form.vegYear} onChange={e => setForm(f => ({ ...f, vegYear: parseInt(e.target.value) || 2023 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-700 pt-2 border-t">Financial Breakdown (K€)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">TCV</label>
              <input type="number" value={form.tcv} onChange={e => setForm(f => ({ ...f, tcv: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">IP + Maintenance</label>
              <input type="number" value={form.ipMaintenance} onChange={e => setForm(f => ({ ...f, ipMaintenance: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">SaaS</label>
              <input type="number" value={form.saas} onChange={e => setForm(f => ({ ...f, saas: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">PS</label>
              <input type="number" value={form.ps} onChange={e => setForm(f => ({ ...f, ps: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Workload PS (man-days)</label>
              <input type="number" value={form.wlPsMd} onChange={e => setForm(f => ({ ...f, wlPsMd: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Investment (man-days)</label>
              <input type="number" value={form.wlInvestmentMd} onChange={e => setForm(f => ({ ...f, wlInvestmentMd: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={mode === "create" ? handleCreate : handleUpdate}
              disabled={createDeal.isPending || updateDeal.isPending || !form.vegId || !form.client}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
              {mode === "create" ? "Create Deal" : "Update Deal"}
            </button>
            <button onClick={() => { mode === "edit" ? setMode("detail") : setMode("list"); }}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ============ DETAIL ============
  if (mode === "detail" && detail) {
    return (
      <div className="space-y-6">
        <button onClick={handleBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Back to list
        </button>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-xs text-slate-400">{detail.veg_id}</span>
                <DecisionBadge decision={detail.decision} />
                <SalesBadge status={detail.sales_status} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{detail.client}</h2>
              <p className="text-sm text-slate-500 mt-1">
                {detail.business_line} · {detail.region} · {detail.committee_type}
                · {new Date(detail.veg_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setForm({ vegId: detail.veg_id, client: detail.client, businessOwner: detail.business_owner, region: detail.region, businessLine: detail.business_line, products: detail.products, committeeType: detail.committee_type, vegDate: detail.veg_date, decision: detail.decision, tcv: detail.tcv, ipMaintenance: detail.ip_maintenance, saas: detail.saas, ps: detail.ps, wlPsMd: detail.wl_ps_md, wlInvestmentMd: detail.wl_investment_md, vegYear: detail.veg_year }); setMode("edit"); }}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Edit</button>
              <button onClick={() => handleDelete(detail.id)} className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">Delete</button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm"><Briefcase className="w-4 h-4 text-indigo-400" /><span className="text-slate-600">Owner: <strong>{detail.business_owner}</strong></span></div>
            <div className="flex items-center gap-2 text-sm"><DollarSign className="w-4 h-4 text-green-500" /><span className="text-slate-600">TCV: <strong>{fmtK(detail.tcv)}</strong></span></div>
            <div className="flex items-center gap-2 text-sm"><Activity className="w-4 h-4 text-blue-500" /><span className="text-slate-600">PS: <strong>{fmtK(detail.ps)}</strong> / {fmtNum(detail.wl_ps_md)}md</span></div>
            <div className="flex items-center gap-2 text-sm"><BarChart3 className="w-4 h-4 text-orange-500" /><span className="text-slate-600">IP&M: <strong>{fmtK(detail.ip_maintenance)}</strong></span></div>
          </div>

          <h3 className="text-base font-semibold text-slate-700 mt-6 mb-3">Financial Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">TCV</p>
              <p className="text-lg font-bold text-slate-800">{fmtK(detail.tcv)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">IP + Maintenance</p>
              <p className="text-lg font-bold text-slate-800">{fmtK(detail.ip_maintenance)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">SaaS</p>
              <p className="text-lg font-bold text-slate-800">{fmtK(detail.saas)}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">PS</p>
              <p className="text-lg font-bold text-slate-800">{fmtK(detail.ps)}</p>
            </div>
          </div>

          {(detail.tcv_crm > 0 || detail.delta_veg_crm !== 0) && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-600">TCV CRM</p>
                <p className="text-lg font-bold text-slate-800">{fmtK(detail.tcv_crm)}</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-600">Delta VEG/CRM</p>
                <p className="text-lg font-bold text-slate-800">{fmtK(detail.delta_veg_crm)}</p>
              </div>
              {detail.duration_days ? (
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-amber-600">Duration</p>
                  <p className="text-lg font-bold text-slate-800">{detail.duration_days} days</p>
                </div>
              ) : null}
            </div>
          )}

          {(detail.financials_url || detail.templates_url) && (
            <div className="flex gap-3 mt-4">
              {detail.financials_url && (
                <a href={detail.financials_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                  <FileText className="w-4 h-4" /> Financial Simulator <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {detail.templates_url && (
                <a href={detail.templates_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800">
                  <FileText className="w-4 h-4" /> GNG Template <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          )}

          {detail.minutes && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Minutes</h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{detail.minutes}</p>
            </div>
          )}

          {detail.comments && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
              <h4 className="text-xs font-medium text-slate-500 mb-1">Comments</h4>
              <p className="text-sm text-slate-600">{detail.comments}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {detail.account_type && (
              <div className="text-sm"><span className="text-slate-500">Account:</span> <strong>{detail.account_type}</strong></div>
            )}
            {detail.deal_type && detail.deal_type !== "NA" && (
              <div className="text-sm"><span className="text-slate-500">Deal Type:</span> <strong>{detail.deal_type}</strong></div>
            )}
            {detail.closing_date && (
              <div className="text-sm"><span className="text-slate-500">Closing:</span> <strong>{new Date(detail.closing_date).toLocaleDateString()}</strong></div>
            )}
            {detail.project_name_chronos && (
              <div className="text-sm"><span className="text-slate-500">Chronos:</span> <strong>{detail.project_name_chronos}</strong></div>
            )}
          </div>

          {/* Chronos */}
          {(detail.chronos_wl_md > 0 || detail.turnover_chronos > 0) && (
            <div className="mt-4 p-3 bg-slate-50 rounded-lg">
              <h4 className="text-xs font-medium text-slate-500 mb-2">Chronos Tracking</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-slate-500">WL:</span> {fmtNum(detail.chronos_wl_md)} md</div>
                <div><span className="text-slate-500">Turnover:</span> {fmtK(detail.turnover_chronos)}</div>
                {detail.delta_veg_chronos_md !== 0 && <div><span className="text-slate-500">Delta:</span> {fmtNum(detail.delta_veg_chronos_md)} md</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
