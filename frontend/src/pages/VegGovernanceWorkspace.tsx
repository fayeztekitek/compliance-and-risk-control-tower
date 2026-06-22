import { useState } from "react";
import {
  Plus, Search, ChevronLeft, Briefcase, DollarSign, TrendingUp, AlertTriangle,
  BarChart3, Users, Globe, CheckCircle, Clock, XCircle, ExternalLink, FileText, Activity,
  Send, ThumbsUp, ThumbsDown, FilePlus, FileSignature,
} from "lucide-react";
import {
  useVegDealList, useVegDealById, useVegDealStats,
  useCreateVegDeal, useUpdateVegDeal, useDeleteVegDeal,
  useVegList, useVegById, useCreateVeg, useUpdateVeg, useDeleteVeg,
  useSignoffVeg, useBidDecision, useGoNoGo,
  useCreateOpportunity, useCreateContract,
} from "../hooks/useVegRequests";
import type { VegDeal, VegDealListParams, VegRequest, Opportunity, Contract } from "../api/veg.api";
import EmptyState from "../components/ui/EmptyState";
import { SkeletonTable } from "../components/ui/Skeleton";

type VSubMode = "dashboard" | "list" | "detail" | "create" | "edit"
  | "workflow" | "workflowDetail" | "workflowCreate";

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

const STATUS_BADGES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CONTRACT_SIGNATURE: "bg-purple-100 text-purple-700",
};

const TYPE_BADGES: Record<string, string> = {
  RFI: "bg-cyan-100 text-cyan-700",
  RFP: "bg-indigo-100 text-indigo-700",
  NEW_CLIENT_REQUEST: "bg-emerald-100 text-emerald-700",
  BD_REQUEST: "bg-amber-100 text-amber-700",
  ACC_CODE_CREATION: "bg-rose-100 text-rose-700",
  BID_COMMITTEE_OVERSIGHT: "bg-violet-100 text-violet-700",
};

const DEPT_SIGNOFF_COLORS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[status] || "bg-slate-100 text-slate-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGES[type] || "bg-slate-100 text-slate-700"}`}>
      {type.replace(/_/g, " ")}
    </span>
  );
}

function DeptSignoffBadge({ state }: { state: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DEPT_SIGNOFF_COLORS[state] || "bg-slate-100 text-slate-700"}`}>
      {state}
    </span>
  );
}

function TabBar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  return (
    <div className="flex border-b border-slate-200 mb-6">
      <button
        onClick={() => onTabChange("deals")}
        className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "deals" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        <Briefcase className="w-4 h-4 inline mr-2" />Deal Register
      </button>
      <button
        onClick={() => onTabChange("workflow")}
        className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
          activeTab === "workflow" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        <FileSignature className="w-4 h-4 inline mr-2" />Workflow Requests
      </button>
    </div>
  );
}

export default function VegGovernanceWorkspace({ initialTab = "deals" }: { initialTab?: string }) {
  const [mode, setMode] = useState<VSubMode>(initialTab === "workflow" ? "workflow" : "dashboard");
  const [tab, setTab] = useState(initialTab);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [filters, setFilters] = useState<VegDealListParams>({ page: 1, limit: 25 });
  const [search, setSearch] = useState("");
  const [wfFilters, setWfFilters] = useState<{ page: number; limit: number; status?: string; type?: string; search?: string }>({ page: 1, limit: 25 });
  const [wfSearch, setWfSearch] = useState("");
  const [wfForm, setWfForm] = useState({ title: "", client: "", type: "RFI", description: "", ownerId: "" });
  const [oppForm, setOppForm] = useState({ name: "", value: 0, salesStage: "PROSPECTING" });
  const [contractForm, setContractForm] = useState({ title: "", startDate: "", endDate: "", slaCommitments: "", complianceStatus: "COMPLIANT", maintenanceSaaS: false });
  const [expandedOpp, setExpandedOpp] = useState<string | null>(null);

  const { data: listData, isLoading: listLoading } = useVegDealList(filters);
  const { data: detail } = useVegDealById(selectedId);
  const { data: stats, isLoading: statsLoading } = useVegDealStats();
  const createDeal = useCreateVegDeal();
  const updateDeal = useUpdateVegDeal();
  const deleteDeal = useDeleteVegDeal();

  const { data: wfList, isLoading: wfListLoading } = useVegList(wfFilters);
  const { data: wfDetail } = useVegById(selectedWorkflowId);
  const createWf = useCreateVeg();
  const updateWf = useUpdateVeg();
  const deleteWf = useDeleteVeg();
  const signoffWf = useSignoffVeg();
  const bidWf = useBidDecision();
  const gonogoWf = useGoNoGo();
  const createOpp = useCreateOpportunity();
  const createContract = useCreateContract();

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

  async function handleWfSearch() {
    setWfFilters(f => ({ ...f, search: wfSearch || undefined, page: 1 }));
  }

  function setWfFilter(key: string, val: any) {
    setWfFilters((f: any) => ({ ...f, [key]: val || undefined, page: 1 }));
  }

  async function handleWfCreate() {
    await createWf.mutateAsync(wfForm as unknown as Partial<VegRequest>);
    setWfForm({ title: "", client: "", type: "RFI", description: "", ownerId: "" });
    setMode("workflow");
  }

  async function handleSignoff(department: string, state: string) {
    if (!selectedWorkflowId) return;
    await signoffWf.mutateAsync({ id: selectedWorkflowId, department, state });
  }

  async function handleBid(decision: string) {
    if (!selectedWorkflowId) return;
    await bidWf.mutateAsync({ id: selectedWorkflowId, decision });
  }

  async function handleGoNoGo(decision: string) {
    if (!selectedWorkflowId) return;
    await gonogoWf.mutateAsync({ id: selectedWorkflowId, decision });
  }

  async function handleCreateOpp() {
    if (!selectedWorkflowId) return;
    await createOpp.mutateAsync({ vegId: selectedWorkflowId, data: oppForm });
    setOppForm({ name: "", value: 0, salesStage: "PROSPECTING" });
  }

  async function handleCreateContract(opportunityId: string) {
    await createContract.mutateAsync({ opportunityId, data: contractForm });
    setContractForm({ title: "", startDate: "", endDate: "", slaCommitments: "", complianceStatus: "COMPLIANT", maintenanceSaaS: false });
    setExpandedOpp(null);
  }

  function handleTabChange(newTab: string) {
    setTab(newTab);
    if (newTab === "deals") {
      if (!["dashboard", "list", "detail", "create", "edit"].includes(mode)) {
        setMode("dashboard");
      }
    } else {
      if (!["workflow", "workflowDetail", "workflowCreate"].includes(mode)) {
        setMode("workflow");
      }
    }
  }

  function handleWfSelect(id: string) { setSelectedWorkflowId(id); setMode("workflowDetail"); }
  function handleWfBack() { setMode("workflow"); setSelectedWorkflowId(null); }

  // ==================== DEAL REGISTER VIEWS ====================

  // ============ DASHBOARD ============
  if (mode === "dashboard" && tab === "deals") {
    return (
      <div className="space-y-6">
        <TabBar activeTab={tab} onTabChange={handleTabChange} />
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
  if (mode === "list" && tab === "deals") {
    return (
      <div className="space-y-6">
        <TabBar activeTab={tab} onTabChange={handleTabChange} />
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">VEG Deal Register</h2>
            <p className="text-sm text-slate-500 mt-1">All VEG committee reviewed deals — {listData?.total || 0} total</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setMode("dashboard")} className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              Dashboard
            </button>
            <button onClick={() => {
              const params = new URLSearchParams();
              if (filters.search) params.set("search", filters.search);
              if (filters.region) params.set("region", filters.region);
              if (filters.businessLine) params.set("businessLine", filters.businessLine);
              if (filters.decision) params.set("decision", filters.decision);
              if (filters.salesStatus) params.set("salesStatus", filters.salesStatus);
              if (filters.year) params.set("year", String(filters.year));
              window.open(`/api/veg-deals/export?${params.toString()}`, "_blank");
            }} className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              <FileText className="w-4 h-4" /> Export CSV
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
  if ((mode === "create" || mode === "edit") && tab === "deals") {
    return (
      <div className="space-y-6 max-w-3xl">
        <TabBar activeTab={tab} onTabChange={handleTabChange} />
        <button onClick={() => { mode === "edit" ? setMode("detail") : setMode("list"); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-2xl font-bold text-slate-800">{mode === "create" ? "New VEG Deal" : "Edit VEG Deal"}</h2>

        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">VEG ID</label>
              <input type="text" value={form.vegId} onChange={e => setForm((f: any) => ({ ...f, vegId: e.target.value }))}
                placeholder="e.g. 21-2023-001" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">VEG Date</label>
              <input type="date" value={form.vegDate} onChange={e => setForm((f: any) => ({ ...f, vegDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client</label>
              <input type="text" value={form.client} onChange={e => setForm((f: any) => ({ ...f, client: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Business Owner</label>
              <input type="text" value={form.businessOwner} onChange={e => setForm((f: any) => ({ ...f, businessOwner: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
              <select value={form.region} onChange={e => setForm((f: any) => ({ ...f, region: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Business Line</label>
              <select value={form.businessLine} onChange={e => setForm((f: any) => ({ ...f, businessLine: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                {BUSINESS_LINES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Committee Type</label>
              <select value={form.committeeType} onChange={e => setForm((f: any) => ({ ...f, committeeType: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                <option value="Go n Go">Go n Go</option>
                <option value="Bid n Bid">Bid n Bid</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Products</label>
            <input type="text" value={form.products} onChange={e => setForm((f: any) => ({ ...f, products: e.target.value }))}
              placeholder="e.g. Colline, Megara" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Decision</label>
              <select value={form.decision} onChange={e => setForm((f: any) => ({ ...f, decision: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                {DECISIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
              <input type="number" value={form.vegYear} onChange={e => setForm((f: any) => ({ ...f, vegYear: parseInt(e.target.value) || 2023 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-slate-700 pt-2 border-t">Financial Breakdown (K€)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">TCV</label>
              <input type="number" value={form.tcv} onChange={e => setForm((f: any) => ({ ...f, tcv: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">IP + Maintenance</label>
              <input type="number" value={form.ipMaintenance} onChange={e => setForm((f: any) => ({ ...f, ipMaintenance: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">SaaS</label>
              <input type="number" value={form.saas} onChange={e => setForm((f: any) => ({ ...f, saas: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">PS</label>
              <input type="number" value={form.ps} onChange={e => setForm((f: any) => ({ ...f, ps: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Workload PS (man-days)</label>
              <input type="number" value={form.wlPsMd} onChange={e => setForm((f: any) => ({ ...f, wlPsMd: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Investment (man-days)</label>
              <input type="number" value={form.wlInvestmentMd} onChange={e => setForm((f: any) => ({ ...f, wlInvestmentMd: parseFloat(e.target.value) || 0 }))}
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
  if (mode === "detail" && detail && tab === "deals") {
    return (
      <div className="space-y-6">
        <TabBar activeTab={tab} onTabChange={handleTabChange} />
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

  // ==================== WORKFLOW VIEWS ====================

  // ============ WORKFLOW LIST ============
  if ((mode === "workflow" || mode === "workflowDetail" || mode === "workflowCreate") && tab === "workflow") {
    if (mode === "workflow") {
      return (
        <div className="space-y-6">
          <TabBar activeTab={tab} onTabChange={handleTabChange} />
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">VEG Workflow Requests</h2>
              <p className="text-sm text-slate-500 mt-1">Governance request lifecycle — {wfList?.total || 0} total</p>
            </div>
            <button onClick={() => setMode("workflowCreate")} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> New Request
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search by client or title..."
                  value={wfSearch} onChange={e => setWfSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleWfSearch()}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500" />
              </div>
              <select value={wfFilters.status || ""} onChange={e => setWfFilter("status", e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CONTRACT_SIGNATURE">Contract Signature</option>
              </select>
              <select value={wfFilters.type || ""} onChange={e => setWfFilter("type", e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm">
                <option value="">All Types</option>
                <option value="RFI">RFI</option>
                <option value="RFP">RFP</option>
                <option value="NEW_CLIENT_REQUEST">New Client</option>
                <option value="BD_REQUEST">BD Request</option>
                <option value="ACC_CODE_CREATION">ACC Code</option>
                <option value="BID_COMMITTEE_OVERSIGHT">Bid Committee</option>
              </select>
            </div>
          </div>

          {wfListLoading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5"><SkeletonTable rows={8} /></div>
          ) : !wfList || wfList.data.length === 0 ? (
            <EmptyState icon={FileSignature} title="No workflow requests found"
              description="Create a new VEG workflow request to get started."
              action={{ label: "New Request", onClick: () => setMode("workflowCreate") }} />
          ) : (
            <>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                        <th className="text-left px-3 py-3 font-medium">Title</th>
                        <th className="text-left px-3 py-3 font-medium">Client</th>
                        <th className="text-left px-3 py-3 font-medium">Type</th>
                        <th className="text-left px-3 py-3 font-medium">Status</th>
                        <th className="text-left px-3 py-3 font-medium">Bid</th>
                        <th className="text-left px-3 py-3 font-medium">Go/No-Go</th>
                        <th className="text-left px-3 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wfList.data.map((req) => (
                        <tr key={req.id} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => handleWfSelect(req.id)}>
                          <td className="px-3 py-3 font-medium text-slate-800 max-w-[250px] truncate">{req.title}</td>
                          <td className="px-3 py-3 text-slate-600 max-w-[150px] truncate">{req.client}</td>
                          <td className="px-3 py-3"><TypeBadge type={req.type} /></td>
                          <td className="px-3 py-3"><StatusBadge status={req.status} /></td>
                          <td className="px-3 py-3">
                            {req.bidDecision === "BID" ? (
                              <span className="text-green-600 text-xs font-medium">BID</span>
                            ) : req.bidDecision === "NO_BID" ? (
                              <span className="text-red-600 text-xs font-medium">NO BID</span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            {req.goNoGoDecision === "GO" ? (
                              <span className="text-green-600 text-xs font-medium">GO</span>
                            ) : req.goNoGoDecision === "NO_GO" ? (
                              <span className="text-red-600 text-xs font-medium">NO GO</span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-500">{new Date(req.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {wfList && wfList.total > wfList.limit && (
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Showing {((wfList.page - 1) * wfList.limit) + 1}–{Math.min(wfList.page * wfList.limit, wfList.total)} of {wfList.total}</span>
                  <div className="flex gap-2">
                    <button disabled={(wfList.page || 1) <= 1} onClick={() => setWfFilters(f => ({ ...f, page: (f.page || 1) - 1 }))}
                      className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50 text-sm">Prev</button>
                    <button disabled={(wfList.page || 1) >= Math.ceil(wfList.total / wfList.limit)} onClick={() => setWfFilters(f => ({ ...f, page: (f.page || 1) + 1 }))}
                      className="px-3 py-1 rounded border border-slate-300 disabled:opacity-50 text-sm">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    // ============ WORKFLOW DETAIL ============
    if (mode === "workflowDetail" && wfDetail) {
      const opportunities = wfDetail.opportunities || [];

      return (
        <div className="space-y-6">
          <TabBar activeTab={tab} onTabChange={handleTabChange} />
          <button onClick={handleWfBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-4 h-4" /> Back to workflow list
          </button>

          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <TypeBadge type={wfDetail.type} />
                  <StatusBadge status={wfDetail.status} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{wfDetail.title}</h2>
                <p className="text-sm text-slate-500 mt-1">{wfDetail.client} · {new Date(wfDetail.date).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                {wfDetail.status === "DRAFT" && (
                  <button onClick={() => updateWf.mutateAsync({ id: wfDetail.id, data: { status: "SUBMITTED" } })}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                    <Send className="w-4 h-4" /> Submit
                  </button>
                )}
                <button onClick={() => deleteWf.mutateAsync(wfDetail.id)} className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">Delete</button>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Status Timeline</h3>
              <div className="flex items-center gap-2 text-sm">
                {["DRAFT", "SUBMITTED", "APPROVED", "CONTRACT_SIGNATURE"].map((s, i) => {
                  const statuses = ["DRAFT", "SUBMITTED", "APPROVED", "CONTRACT_SIGNATURE"];
                  const currentIdx = statuses.indexOf(wfDetail.status);
                  const isComplete = i <= currentIdx;
                  const isCurrent = i === currentIdx && wfDetail.status !== "REJECTED";
                  const isRejected = wfDetail.status === "REJECTED";
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                        isRejected && s === "SUBMITTED" ? "bg-red-100 text-red-700" :
                        isCurrent ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-300" :
                        isComplete ? "bg-green-100 text-green-700" :
                        "bg-slate-100 text-slate-400"
                      }`}>
                        {isComplete && !isCurrent ? <CheckCircle className="w-3 h-3" /> : null}
                        {s.replace(/_/g, " ")}
                      </div>
                      {i < statuses.length - 1 && (
                        <div className={`w-6 h-px ${isComplete && i < currentIdx ? "bg-green-400" : "bg-slate-200"}`} />
                      )}
                    </div>
                  );
                })}
                {wfDetail.status === "REJECTED" && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <XCircle className="w-3 h-3" /> REJECTED
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Department Sign-offs */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <FileSignature className="w-4 h-4 text-indigo-500" /> Department Sign-offs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: "finance", label: "Finance", state: wfDetail.financeState },
                { key: "sales", label: "Sales", state: wfDetail.salesState },
                { key: "product", label: "Product", state: wfDetail.productState },
                { key: "legal", label: "Legal", state: wfDetail.legalState },
              ].map((dept) => (
                <div key={dept.key} className={`border rounded-lg p-4 ${
                  dept.state === "APPROVED" ? "border-green-200 bg-green-50" :
                  dept.state === "REJECTED" ? "border-red-200 bg-red-50" :
                  "border-slate-200 bg-slate-50"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-700">{dept.label}</h4>
                    <DeptSignoffBadge state={dept.state} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSignoff(dept.key, "APPROVED")}
                      disabled={dept.state === "APPROVED" || wfDetail.status !== "SUBMITTED"}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ThumbsUp className="w-3 h-3" /> Approve
                    </button>
                    <button
                      onClick={() => handleSignoff(dept.key, "REJECTED")}
                      disabled={dept.state === "REJECTED" || wfDetail.status !== "SUBMITTED"}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ThumbsDown className="w-3 h-3" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bid Decision */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> Bid Decision
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleBid("BID")}
                disabled={wfDetail.bidDecision === "BID" || wfDetail.status === "DRAFT"}
                className={`px-5 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  wfDetail.bidDecision === "BID"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-slate-200 text-slate-600 hover:border-green-300 disabled:opacity-40"
                }`}
              >
                <ThumbsUp className="w-4 h-4 inline mr-1" /> BID
              </button>
              <button
                onClick={() => handleBid("NO_BID")}
                disabled={wfDetail.bidDecision === "NO_BID" || wfDetail.status === "DRAFT"}
                className={`px-5 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  wfDetail.bidDecision === "NO_BID"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-200 text-slate-600 hover:border-red-300 disabled:opacity-40"
                }`}
              >
                <ThumbsDown className="w-4 h-4 inline mr-1" /> NO BID
              </button>
            </div>
          </div>

          {/* Go/No-Go Decision */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" /> Go / No-Go Decision
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => handleGoNoGo("GO")}
                disabled={wfDetail.goNoGoDecision === "GO" || wfDetail.status === "DRAFT"}
                className={`px-5 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  wfDetail.goNoGoDecision === "GO"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-slate-200 text-slate-600 hover:border-green-300 disabled:opacity-40"
                }`}
              >
                <CheckCircle className="w-4 h-4 inline mr-1" /> GO
              </button>
              <button
                onClick={() => handleGoNoGo("NO_GO")}
                disabled={wfDetail.goNoGoDecision === "NO_GO" || wfDetail.status === "DRAFT"}
                className={`px-5 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                  wfDetail.goNoGoDecision === "NO_GO"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-200 text-slate-600 hover:border-red-300 disabled:opacity-40"
                }`}
              >
                <XCircle className="w-4 h-4 inline mr-1" /> NO GO
              </button>
            </div>
          </div>

          {/* Opportunities */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" /> Opportunities ({opportunities.length})
              </h3>
              {wfDetail.status !== "DRAFT" && (
                <button onClick={handleCreateOpp} disabled={createOpp.isPending || !oppForm.name}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50">
                  <Plus className="w-4 h-4" /> Add Opportunity
                </button>
              )}
            </div>

            {/* Create opportunity form */}
            {wfDetail.status !== "DRAFT" && (
              <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
                <input type="text" placeholder="Opportunity name" value={oppForm.name}
                  onChange={e => setOppForm(f => ({ ...f, name: e.target.value }))}
                  className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
                <input type="number" placeholder="Value (K€)" value={oppForm.value || ""}
                  onChange={e => setOppForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))}
                  className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
                <select value={oppForm.salesStage} onChange={e => setOppForm(f => ({ ...f, salesStage: e.target.value }))}
                  className="px-3 py-1.5 rounded border border-slate-300 text-sm">
                  <option value="PROSPECTING">Prospecting</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="CLOSED_WON">Closed Won</option>
                  <option value="CLOSED_LOST">Closed Lost</option>
                </select>
                <button onClick={handleCreateOpp} disabled={createOpp.isPending || !oppForm.name}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm disabled:opacity-50">
                  Save
                </button>
              </div>
            )}

            {/* Opportunities table */}
            {opportunities.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No opportunities yet</p>
            ) : (
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="border border-slate-200 rounded-lg">
                    <div
                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50"
                      onClick={() => setExpandedOpp(expandedOpp === opp.id ? null : opp.id)}
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">{opp.name}</p>
                        <p className="text-xs text-slate-500">
                          Value: {fmtNum(opp.value)} · Stage: {opp.sales_stage.replace(/_/g, " ")}
                          {opp.contract_signed ? " · ✅ Contract signed" : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          opp.contract_signed ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {opp.contract_signed ? "Signed" : "Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Contracts within opportunity */}
                    {expandedOpp === opp.id && (
                      <div className="border-t border-slate-100 p-4 bg-slate-50">
                        <h4 className="text-sm font-medium text-slate-700 mb-3">
                          Contracts ({(opp.contracts || []).length})
                        </h4>

                        {/* Contracts list */}
                        {(opp.contracts || []).length === 0 ? (
                          <p className="text-xs text-slate-400 mb-3">No contracts yet</p>
                        ) : (
                          <div className="space-y-2 mb-3">
                            {opp.contracts?.map((ctr) => (
                              <div key={ctr.id} className="bg-white rounded-lg border border-slate-200 p-3 text-sm">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-slate-800">{ctr.title}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    ctr.compliance_status === "COMPLIANT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                  }`}>
                                    {ctr.compliance_status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  {new Date(ctr.start_date).toLocaleDateString()} — {new Date(ctr.end_date).toLocaleDateString()}
                                  {ctr.maintenance_saas ? " · Maintenance/SaaS" : ""}
                                </p>
                                {ctr.sla_commitments && (
                                  <p className="text-xs text-slate-400 mt-1">SLA: {ctr.sla_commitments}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add contract form */}
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-end">
                          <input type="text" placeholder="Contract title"
                            value={expandedOpp === opp.id ? contractForm.title : ""}
                            onChange={e => setContractForm(f => ({ ...f, title: e.target.value }))}
                            className="col-span-2 px-3 py-1.5 rounded border border-slate-300 text-sm" />
                          <input type="date" value={contractForm.startDate}
                            onChange={e => setContractForm(f => ({ ...f, startDate: e.target.value }))}
                            className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
                          <input type="date" value={contractForm.endDate}
                            onChange={e => setContractForm(f => ({ ...f, endDate: e.target.value }))}
                            className="px-3 py-1.5 rounded border border-slate-300 text-sm" />
                          <button
                            onClick={() => handleCreateContract(opp.id)}
                            disabled={createContract.isPending || !contractForm.title}
                            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50">
                            Add Contract
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    // ============ WORKFLOW CREATE ============
    if (mode === "workflowCreate") {
      return (
        <div className="space-y-6 max-w-2xl">
          <TabBar activeTab={tab} onTabChange={handleTabChange} />
          <button onClick={() => setMode("workflow")} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ChevronLeft className="w-4 h-4" /> Back to list
          </button>
          <h2 className="text-2xl font-bold text-slate-800">New VEG Workflow Request</h2>

          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input type="text" value={wfForm.title} onChange={e => setWfForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. RFP — BNP Paribas Colline Migration" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client *</label>
              <input type="text" value={wfForm.client} onChange={e => setWfForm(f => ({ ...f, client: e.target.value }))}
                placeholder="e.g. BNP Paribas" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Request Type</label>
                <select value={wfForm.type} onChange={e => setWfForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm">
                  <option value="RFI">RFI</option>
                  <option value="RFP">RFP</option>
                  <option value="NEW_CLIENT_REQUEST">New Client Request</option>
                  <option value="BD_REQUEST">BD Request</option>
                  <option value="ACC_CODE_CREATION">ACC Code Creation</option>
                  <option value="BID_COMMITTEE_OVERSIGHT">Bid Committee Oversight</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Owner ID</label>
                <input type="text" value={wfForm.ownerId} onChange={e => setWfForm(f => ({ ...f, ownerId: e.target.value }))}
                  placeholder="User UUID (optional)" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={wfForm.description} onChange={e => setWfForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder="Optional description or notes..." className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleWfCreate} disabled={createWf.isPending || !wfForm.title || !wfForm.client}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50">
                <FilePlus className="w-4 h-4 inline mr-1" /> Create Request
              </button>
              <button onClick={() => setMode("workflow")}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      );
    }
  }

  // ============ DEFAULT (should not normally reach here) ============
  return (
    <div className="space-y-6">
      <TabBar activeTab={tab} onTabChange={handleTabChange} />
      <EmptyState icon={Briefcase} title="Select a view"
        description="Use the tabs above or navigation to browse VEG data."
        action={{ label: "Deal Dashboard", onClick: () => { setTab("deals"); setMode("dashboard"); } }} />
    </div>
  );
}
