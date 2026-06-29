import { X, Search, RotateCcw } from "lucide-react";
import { useVegDashboardFilterStore } from "../../store/vegDashboardFilter.store";

const REGIONS = ["EU", "Americas", "UK", "APAC"];
const BUSINESS_LINES = ["Colline", "Soliam", "Solife", "Megara", "Digital", "Regulatory", "Numilog", "Insurance France", "Wealth Management", "Shared"];
const DECISIONS = ["GO FINAL", "GO INITIAL", "GO without Committee", "BID", "Differed", "No GO", "NO GO", "Postponed", "BACKLOG", "WITHDRAWN", "CANCELLED"];
const SALES_STATUSES = ["Won", "Lost", "Open", "Canceled", "Committed", "BID"];
const DEAL_TYPES = ["Existing account", "New account"];

export default function VegFilterPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { filters, setFilter, resetFilters } = useVegDashboardFilterStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-80 bg-white shadow-xl h-full overflow-y-auto ml-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-10">
          <h3 className="font-semibold text-slate-900">Filters</h3>
          <div className="flex items-center gap-2">
            <button onClick={resetFilters} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reset</button>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Search</label>
            <div className="relative mt-1">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <input type="text" className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Client, VEG ID..." value={filters.client || ""} onChange={e => setFilter("client", e.target.value || undefined)} />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Year</label>
            <input type="number" className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 2024" value={filters.year || ""} onChange={e => setFilter("year", e.target.value ? parseInt(e.target.value) : undefined)} />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Region</label>
            <select className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg" value={filters.region || ""} onChange={e => setFilter("region", e.target.value || undefined)}>
              <option value="">All Regions</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Business Line</label>
            <select className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg" value={filters.businessLine || ""} onChange={e => setFilter("businessLine", e.target.value || undefined)}>
              <option value="">All Business Lines</option>
              {BUSINESS_LINES.map(bl => <option key={bl} value={bl}>{bl}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Decision</label>
            <select className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg" value={filters.decision || ""} onChange={e => setFilter("decision", e.target.value || undefined)}>
              <option value="">All Decisions</option>
              {DECISIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Sales Status</label>
            <select className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg" value={filters.salesStatus || ""} onChange={e => setFilter("salesStatus", e.target.value || undefined)}>
              <option value="">All Statuses</option>
              {SALES_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 uppercase">Deal Type</label>
            <select className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg" value={filters.dealType || ""} onChange={e => setFilter("dealType", e.target.value || undefined)}>
              <option value="">All Types</option>
              {DEAL_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">VEG Date From</label>
              <input type="date" className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg" value={filters.vegDateFrom || ""} onChange={e => setFilter("vegDateFrom", e.target.value || undefined)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">VEG Date To</label>
              <input type="date" className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg" value={filters.vegDateTo || ""} onChange={e => setFilter("vegDateTo", e.target.value || undefined)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">TCV Min</label>
              <input type="number" className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="0" value={filters.tcvMin ?? ""} onChange={e => setFilter("tcvMin", e.target.value ? parseFloat(e.target.value) : undefined)} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase">TCV Max</label>
              <input type="number" className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 rounded-lg" placeholder="999999" value={filters.tcvMax ?? ""} onChange={e => setFilter("tcvMax", e.target.value ? parseFloat(e.target.value) : undefined)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
